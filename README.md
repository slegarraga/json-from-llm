# json-from-llm

> Extract valid JSON from an LLM response — even when it's wrapped in reasoning/thinking tags, markdown fences or prose. **Zero dependencies.**

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

- **Reasoning-model aware.** Strips `<think>` / `<thinking>` blocks first, so brace-laden reasoning (a real cause of `No object generated` failures with DeepSeek R1, Gemini 2.5 thinking, prompted Claude) never gets mistaken for the payload.
- **Handles the real wrappers.** Markdown fences (`json` and bare ```), conversational prose before/after, and the JSON sitting bare in the text.
- **String-aware, never corrupts.** The scanner and the trailing-comma repair both respect string contents — a `}` or `,` inside `"a string value"` is left alone.
- **Conservative repair.** Removes trailing commas (the most common malformation); it will never rewrite your data.
- **Two entry points.** `extractJson` throws on failure; `tryExtractJson` returns `{ found }`.
- **Zero dependencies**, ESM + CJS, fully typed.

## Install

```sh
npm install json-from-llm
```

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

### Algorithm

1. Strip `<think>` / `<thinking>` / `<reasoning>` blocks.
2. Prefer the contents of fenced `json (or bare `) code blocks.
3. Otherwise scan for the first balanced `{…}` / `[…]` that parses, string-aware.
4. If parsing fails, apply conservative repair (trailing commas) and retry.

The low-level pieces (`stripReasoning`, `fencedBlocks`, `balancedSpans`, `removeTrailingCommas`) are exported too.

## Related

- [`tool-schema`](https://www.npmjs.com/package/tool-schema) — turn a JSON Schema into a provider tool/function schema (define the shape you then extract).
- [`llm-sse`](https://www.npmjs.com/package/llm-sse) · [`llm-messages`](https://www.npmjs.com/package/llm-messages) · [`llm-errors`](https://www.npmjs.com/package/llm-errors) — the provider-portability suite.

## License

MIT © Sebastian Legarraga
