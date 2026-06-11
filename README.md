# json-from-llm

[![npm version](https://img.shields.io/npm/v/json-from-llm.svg)](https://www.npmjs.com/package/json-from-llm)
[![npm downloads](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fslegarraga%2Fjson-from-llm%2Fmain%2Fbadges%2Fnpm-downloads%2Fjson-from-llm.json)](https://www.npmjs.com/package/json-from-llm)
[![CI](https://github.com/slegarraga/json-from-llm/actions/workflows/ci.yml/badge.svg)](https://github.com/slegarraga/json-from-llm/actions/workflows/ci.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/slegarraga/json-from-llm/badge)](https://scorecard.dev/viewer/?uri=github.com/slegarraga/json-from-llm)
[![license](https://img.shields.io/npm/l/json-from-llm.svg)](./LICENSE)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](./package.json)

> Extract valid JSON from an LLM response — even when it's wrapped in reasoning/thinking tags, markdown fences or prose. **Zero dependencies.**

Security posture is tracked in [docs/security-posture.md](./docs/security-posture.md),
including CodeQL, OpenSSF Scorecard, Dependabot and branch rules.

You asked for JSON. The model gave you:

````text
<think>
Let me reason about this. The score should reflect... maybe {draft: 6}?
</think>
Sure! Here's the result:
```json
{"score": 8, "reason": "clear"}
```
Hope that helps!
````

`JSON.parse` throws on all of that. `json-from-llm` returns `{ score: 8, reason: "clear" }`.

```ts
import { extractJson } from 'json-from-llm';

const data = extractJson<{ score: number }>(modelOutput);
```

## Why

- **Reasoning-model aware.** Strips `<think>` / `<thinking>` blocks first, including unclosed reasoning prefixes, so brace-laden reasoning (a real cause of `No object generated` failures with DeepSeek R1, Gemini 2.5 thinking, prompted Claude) never gets mistaken for the payload.
- **Handles the real wrappers.** Markdown fences (`json` and bare ```), conversational prose before/after, and the JSON sitting bare in the text.
- **String-aware, delimiter-aware, never corrupts.** The scanner and the trailing-comma repair both respect string contents — a `}` or `,` inside `"a string value"` is left alone, and mismatched or truncated JSON-looking drafts are skipped.
- **Conservative repair.** Removes trailing commas (the most common malformation); it will never rewrite your data.
- **Fixture-backed edge cases.** Public fixtures cover reasoning tags, fenced JSON, prose wrappers, trailing commas, top-level type expectations and no-JSON failures.
- **Two library entry points + CLI.** `extractJson` throws on failure; `tryExtractJson` returns `{ found }`; `json-from-llm` reads stdin for shell pipelines.
- **Zero dependencies**, ESM + CJS, fully typed.

## Install

```sh
npm install json-from-llm
```

## CLI

Pipe model output directly into the binary:

```sh
cat response.txt | npx json-from-llm
```

Example:

````sh
printf '%s\n' '<think>{draft: true}</think>```json
{"score":8,"reason":"clear"}
```' | npx json-from-llm
# {"score":8,"reason":"clear"}
````

Useful flags:

```sh
# Skip an earlier array and require the first object that parses
cat response.txt | npx json-from-llm --expect object

# Disable trailing-comma repair when you want strict parsing
cat response.txt | npx json-from-llm --no-repair
```

Exit codes:

- `0` — JSON extracted and printed to stdout.
- `1` — no matching JSON value found.
- `2` — invalid CLI options.

## API

### `extractJson<T>(text, options?) => T`

Returns the extracted JSON value, or throws `JsonExtractionError` if none can be recovered.

### `tryExtractJson<T>(text, options?) => { found: true, value: T } | { found: false }`

The non-throwing variant.

### Options

```ts
interface ExtractOptions {
  repair?: boolean; // remove trailing commas (default true)
  expect?: 'object' | 'array' | 'any'; // restrict the top-level type (default 'any')
}
```

`expect` is handy when prose contains a stray array but you want the object:

```ts
extractJson('[1,2] then the answer {"a":1}', { expect: 'object' }); // { a: 1 }
```

### Provider-style snippets

OpenAI-style fenced output:

`````ts
const value = extractJson<{ score: number }>(
  `Here is the JSON:
```json
{"score":8,"reason":"clear"}
````,
  { expect: 'object' },
);
`````

Anthropic-style prose around the object:

```ts
const result = tryExtractJson<{ safe: boolean }>(
  'I will return the object first.\n{"safe":true}\nLet me know if you need more.',
  { expect: 'object' },
);
```

Gemini-style thinking plus a top-level array:

```ts
const items = extractJson<Array<{ id: string }>>(
  '<thinking>{draft: true}</thinking>\n[{"id":"a"}]',
  { expect: 'array' },
);
```

### Algorithm

1. Strip `<think>` / `<thinking>` / `<reasoning>` blocks. If a reasoning tag is opened and never closed, treat the rest as reasoning.
2. Prefer complete contents of fenced `json` (or bare) code blocks.
3. If a fence contains prose, scan inside those fences for balanced JSON after complete fence payloads have been tried.
4. Otherwise scan for the first balanced `{…}` / `[…]` that parses, string-aware and delimiter-aware.
5. If parsing fails, apply conservative repair (trailing commas) and retry.

The low-level pieces (`stripReasoning`, `fencedBlocks`, `balancedSpans`, `removeTrailingCommas`) are exported too.

### Caveats

- TypeScript generics do not validate runtime shape. Pair this with your schema validator when fields matter.
- Repair is intentionally narrow: trailing commas only. It will not convert JSON5, comments, single quotes or unquoted keys.
- Candidate order is deterministic: JSON-ish fences first, then balanced objects/arrays in document order, filtered by `expect`.
- Unclosed reasoning tags return no JSON from that suffix instead of risking a draft extraction.

## Fixture corpus

The package includes a small public corpus under [`fixtures/`](./fixtures):

- `deepseek-thinking-object.txt`
- `gemini-reasoning-array.txt`
- `openai-fenced-object.txt`
- `multiple-fenced-final.txt`
- `anthropic-prose-object.txt`
- `prose-trailing-commas.txt`
- `malformed-draft-valid-final.txt`
- `expect-object-skips-array.txt`
- `truncated-stream-no-json.txt`
- `unclosed-thinking-no-json.txt`
- `no-json.txt`
- expected `tryExtractJson` outputs under `fixtures/expected/`

The tests read these files directly, so parser changes are checked against
stable, reusable examples. The fixtures are synthetic and safe for public CI:
they contain no prompts, secrets, user data or live provider responses.

## Related

- [`tool-schema`](https://www.npmjs.com/package/tool-schema) — turn a JSON Schema into a provider tool/function schema (define the shape you then extract).
- [`llm-sse`](https://www.npmjs.com/package/llm-sse) · [`llm-messages`](https://www.npmjs.com/package/llm-messages) · [`llm-errors`](https://www.npmjs.com/package/llm-errors) — the provider-portability suite.

## License

MIT © Sebastian Legarraga
