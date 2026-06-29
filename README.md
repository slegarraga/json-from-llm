# json-from-llm

[![npm version](https://img.shields.io/npm/v/json-from-llm.svg)](https://www.npmjs.com/package/json-from-llm)
[![npm downloads](https://img.shields.io/npm/dm/json-from-llm?logo=npm&label=downloads)](https://www.npmjs.com/package/json-from-llm)
[![CI](https://github.com/slegarraga/json-from-llm/actions/workflows/ci.yml/badge.svg)](https://github.com/slegarraga/json-from-llm/actions/workflows/ci.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/slegarraga/json-from-llm/badge)](https://scorecard.dev/viewer/?uri=github.com/slegarraga/json-from-llm)
[![install size](https://packagephobia.com/badge?p=json-from-llm)](https://packagephobia.com/result?p=json-from-llm)
[![bundle size](https://img.shields.io/bundlephobia/minzip/json-from-llm?label=min%2Bgzip)](https://bundlephobia.com/package/json-from-llm)
[![license](https://img.shields.io/npm/l/json-from-llm.svg)](./LICENSE)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](./package.json)

> Reasoning-aware JSON extractor for LLM responses: strips thinking tags, unwraps markdown fences, and scans prose before `JSON.parse` ever sees the text. Zero dependencies.

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

### Real provider call sites

These are the exact shapes returned by each SDK. Pass the raw string directly to `extractJson`.

**OpenAI**

```ts
import OpenAI from 'openai';
import { extractJson } from 'json-from-llm';

const client = new OpenAI();
const res = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Return {"score":8} as JSON.' }],
});
const raw = res.choices[0].message.content ?? '';
const data = extractJson<{ score: number }>(raw);
```

**Anthropic**

```ts
import Anthropic from '@anthropic-ai/sdk';
import { extractJson } from 'json-from-llm';

const client = new Anthropic();
const msg = await client.messages.create({
  model: 'claude-opus-4-5',
  max_tokens: 256,
  messages: [{ role: 'user', content: 'Return {"score":8} as JSON.' }],
});
const raw = msg.content.find((b) => b.type === 'text')?.text ?? '';
const data = extractJson<{ score: number }>(raw);
```

**Vercel AI SDK**

```ts
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { extractJson } from 'json-from-llm';

const { text } = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Return {"score":8} as JSON.',
});
const data = extractJson<{ score: number }>(text);
```

**Streaming (OpenAI)**

```ts
import OpenAI from 'openai';
import { extractJson } from 'json-from-llm';

const client = new OpenAI();
const stream = await client.chat.completions.create({
  model: 'gpt-4o',
  stream: true,
  messages: [{ role: 'user', content: 'Return {"score":8} as JSON.' }],
});
let raw = '';
for await (const chunk of stream) {
  raw += chunk.choices[0]?.delta?.content ?? '';
}
const data = extractJson<{ score: number }>(raw);
```

**Streaming (Vercel AI SDK)**

```ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { extractJson } from 'json-from-llm';

const result = streamText({
  model: openai('gpt-4o'),
  prompt: 'Return {"score":8} as JSON.',
});
const { text } = await result;
const data = extractJson<{ score: number }>(text);
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

## Recipes

### Validate the extracted object with Zod

```ts
import { z } from 'zod';
import { extractJson } from 'json-from-llm';

const Schema = z.object({ score: z.number(), reason: z.string() });

const raw = modelOutput; // the raw LLM response string
const parsed = Schema.parse(extractJson(raw)); // throws ZodError if shape is wrong
```

TypeScript generics pass through without runtime checking. Zod (or any schema validator) is the right layer for field-level validation.

### Retry loop on extraction failure

```ts
import { JsonExtractionError, tryExtractJson } from 'json-from-llm';

async function extractWithRetry(
  call: () => Promise<string>,
  maxAttempts = 3,
): Promise<unknown> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const raw = await call();
    const result = tryExtractJson(raw);
    if (result.found) return result.value;
    if (attempt === maxAttempts) {
      throw new JsonExtractionError(
        `No JSON found after ${maxAttempts} attempts`,
      );
    }
    // Re-ask the model on failure
  }
  throw new JsonExtractionError('Unreachable');
}
```

## Why not X?

**`jsonrepair`**: repairs malformed JSON syntax (unclosed brackets, unquoted keys, comments). It expects the input to already be JSON-shaped. `json-from-llm` solves the step before that: locating which substring is the intended JSON payload inside a mixed reasoning/prose/fenced response. The two are complementary: extract first, then repair if needed.

**`JSON.parse` with a prompt asking for pure JSON**: works often, but reasoning models emit `<think>` blocks unconditionally, and conversational models wrap answers in prose even when instructed not to. `json-from-llm` handles those cases without prompt engineering.

**`structured_outputs` / forced JSON mode**: not all providers support it, not all tasks are compatible with it (e.g., chain-of-thought), and it requires schema registration. `json-from-llm` works on any plain-text completion.

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

- [`tool-schema`](https://www.npmjs.com/package/tool-schema): convert a JSON Schema into a provider tool / function-calling schema for OpenAI, Anthropic, Gemini and MCP
- [`llm-sse`](https://www.npmjs.com/package/llm-sse): parse streaming SSE from LLM providers into typed, provider-agnostic events
- [`llm-messages`](https://www.npmjs.com/package/llm-messages): convert chat messages between OpenAI, Anthropic and Gemini formats
- [`llm-errors`](https://www.npmjs.com/package/llm-errors): normalize provider errors (rate limits, retries, status) into one shape

## License

MIT © Sebastian Legarraga
