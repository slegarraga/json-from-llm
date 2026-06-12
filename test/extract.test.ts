import { describe, expect, it } from 'vitest';
import {
  balancedSpans,
  extractJson,
  tryExtractJson,
  JsonExtractionError,
} from '../src/index.ts';

describe('extractJson — wrapping', () => {
  it('returns bare JSON unchanged', () => {
    expect(extractJson('{"a":1,"b":[2,3]}')).toEqual({ a: 1, b: [2, 3] });
  });

  it('extracts JSON from a ```json fenced block', () => {
    const text =
      'Here\'s the result:\n```json\n{"score": 7}\n```\nHope that helps!';
    expect(extractJson(text)).toEqual({ score: 7 });
  });

  it('extracts JSON from an untagged ``` block', () => {
    expect(extractJson('```\n{"ok": true}\n```')).toEqual({ ok: true });
  });

  it('extracts JSON embedded in prose', () => {
    expect(
      extractJson('Sure! {"city":"Santiago"} Let me know if you need more.'),
    ).toEqual({
      city: 'Santiago',
    });
  });

  it('skips a ```python fence and finds the real JSON', () => {
    const text =
      '```python\nprint({"not": "json"})\n```\n```json\n{"real": 1}\n```';
    expect(extractJson(text)).toEqual({ real: 1 });
  });

  it('extracts JSON inside a fenced block that includes prose', () => {
    const text =
      'OpenAI-style response:\n```json\nHere is the object:\n{"score": 9, "label": "ship"}\n```';
    expect(extractJson(text)).toEqual({ score: 9, label: 'ship' });
  });

  it('prefers a later complete fenced payload over an earlier fenced fragment', () => {
    const text = [
      'Draft:',
      '```json',
      'The draft object was {"score": 4, "draft": true}, but do not use it.',
      '```',
      'Final:',
      '```json',
      '{"score": 8, "draft": false}',
      '```',
    ].join('\n');

    expect(extractJson(text)).toEqual({ score: 8, draft: false });
  });
});

describe('extractJson — reasoning / thinking tokens', () => {
  it('ignores brace-laden text inside <think> and takes the answer after it', () => {
    const text =
      '<think>The user wants a score. Maybe {guess: 5}? No, let me reconsider.</think>\n{"score": 8}';
    expect(extractJson(text)).toEqual({ score: 8 });
  });

  it('handles <thinking> blocks and fenced output together', () => {
    const text =
      '<thinking>compute...</thinking>\nHere it is:\n```json\n{"result": [1, 2]}\n```';
    expect(extractJson(text)).toEqual({ result: [1, 2] });
  });

  it('supports reasoning tags with attributes and case differences', () => {
    const text =
      '<THINK data-provider="deepseek">draft {"score": 3}</THINK>\n{"score": 8}';
    expect(extractJson(text)).toEqual({ score: 8 });
  });

  it('does not extract draft JSON from an unclosed reasoning block', () => {
    const result = tryExtractJson(
      '<thinking>\n{"draft": true, "score": 4}\nstill deciding...',
    );
    expect(result.found).toBe(false);
  });
});

describe('extractJson — repair', () => {
  it('removes trailing commas before } and ]', () => {
    expect(extractJson('{"a": 1, "b": [2, 3,],}')).toEqual({ a: 1, b: [2, 3] });
  });

  it('never touches a comma inside a string', () => {
    expect(extractJson('{"msg": "a, b, c"}')).toEqual({ msg: 'a, b, c' });
  });

  it('can be disabled with { repair: false }', () => {
    const r = tryExtractJson('{"a": 1,}', { repair: false });
    expect(r.found).toBe(false);
  });
});

describe('extractJson — string-aware scanning', () => {
  it('is not fooled by braces inside string values', () => {
    expect(
      extractJson('{"template": "use {placeholder} here", "n": 1}'),
    ).toEqual({
      template: 'use {placeholder} here',
      n: 1,
    });
  });

  it('handles escaped quotes inside strings', () => {
    expect(extractJson('{"q": "she said \\"hi\\""}')).toEqual({
      q: 'she said "hi"',
    });
  });

  it('handles escaped braces inside string values', () => {
    expect(
      extractJson('{"pattern":"\\\\{user\\\\}","text":"literal } brace"}'),
    ).toEqual({
      pattern: '\\{user\\}',
      text: 'literal } brace',
    });
  });

  it('does not return spans closed by the wrong delimiter', () => {
    expect(balancedSpans('draft [1, 2} final {"ok": true}')).toEqual([
      '{"ok": true}',
    ]);
  });

  it('does not return nested spans from a mismatched draft candidate', () => {
    const text =
      'draft {"outer": {"score": 4}, "items": [1, 2} final {"score": 8}';

    expect(balancedSpans(text)).toEqual(['{"score": 8}']);
    expect(extractJson(text)).toEqual({ score: 8 });
  });
});

describe('expect option', () => {
  it('returns an array when expect is array', () => {
    expect(extractJson('prefix [1,2,3] suffix', { expect: 'array' })).toEqual([
      1, 2, 3,
    ]);
  });

  it('skips an array and finds the object when expect is object', () => {
    expect(extractJson('[1,2] then {"a":1}', { expect: 'object' })).toEqual({
      a: 1,
    });
  });
});

describe('extractJson — edge cases from LLM output', () => {
  it('handles leading BOM and whitespace before JSON', () => {
    expect(extractJson('\uFEFF \n\t {"ok": true} \n')).toEqual({ ok: true });
  });

  it('skips malformed candidates before the final JSON', () => {
    const text =
      'Draft: {score: 7, reason: "rough"}\nFinal answer: {"score":8,"reason":"clear"}';
    expect(extractJson(text)).toEqual({ score: 8, reason: 'clear' });
  });

  it('handles deeply nested JSON without flattening or rewriting it', () => {
    let expected: unknown = { leaf: true };
    for (let level = 0; level < 40; level += 1) {
      expected = { level, child: expected };
    }

    expect(extractJson(JSON.stringify(expected))).toEqual(expected);
  });

  it('returns found:false for partial JSON', () => {
    expect(tryExtractJson('partial {"a": [1, 2}').found).toBe(false);
  });

  it('does not extract nested objects from truncated JSON-looking streams', () => {
    const text = [
      'stream chunk:',
      '{"items": [',
      '  {"id": "draft", "score": 4}',
    ].join('\n');

    expect(tryExtractJson(text).found).toBe(false);
  });

  it('handles degenerate runs of openers in linear time', () => {
    // A model stuck in a repetition loop can emit huge runs of `{` — this
    // must return quickly rather than rescanning the tail from every brace.
    const started = Date.now();
    expect(tryExtractJson('{'.repeat(200_000)).found).toBe(false);
    expect(tryExtractJson('['.repeat(200_000)).found).toBe(false);
    expect(Date.now() - started).toBeLessThan(2_000);
  });

  it('continues after non-JSON prose with an unmatched brace', () => {
    const text = 'Template note: use {name in copy. Final: {"ok": true}';

    expect(extractJson(text)).toEqual({ ok: true });
  });
});

describe('not found', () => {
  it('throws JsonExtractionError when there is no JSON', () => {
    expect(() => extractJson('no json here at all')).toThrow(
      JsonExtractionError,
    );
  });

  it('tryExtractJson returns found:false on empty / non-string', () => {
    expect(tryExtractJson('').found).toBe(false);
    expect(tryExtractJson(undefined as unknown as string).found).toBe(false);
  });

  it('JsonExtractionError carries the original text', () => {
    try {
      extractJson('nope');
    } catch (error) {
      expect(error).toBeInstanceOf(JsonExtractionError);
      expect((error as JsonExtractionError).text).toBe('nope');
    }
  });
});
