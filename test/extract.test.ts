import { describe, expect, it } from 'vitest';
import {
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
