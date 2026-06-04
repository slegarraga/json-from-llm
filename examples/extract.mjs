// Extract JSON from realistic LLM responses.
//
//   node examples/extract.mjs
import { extractJson, tryExtractJson } from '../dist/index.js';

const cases = [
  // A reasoning model leaks <think> tokens before the answer.
  '<think>The user wants a rating. I should weigh the evidence... maybe {draft: 6}?</think>\n{"rating": 8, "reason": "clear and complete"}',
  // The model wrapped the JSON in a fenced block and added prose.
  'Sure, here\'s the result:\n```json\n{"items": ["a", "b"], "done": true}\n```\nLet me know if you need changes.',
  // Trailing comma (very common) — repaired automatically.
  '{"a": 1, "b": 2,}',
  // No JSON at all.
  'I could not complete that request.',
];

for (const text of cases) {
  const result = tryExtractJson(text);
  const preview = text.replace(/\n/g, ' ').slice(0, 48);
  if (result.found) {
    console.log(`OK   "${preview}..." -> ${JSON.stringify(result.value)}`);
  } else {
    console.log(`MISS "${preview}..." -> no JSON found`);
  }
}

// extractJson throws on failure, for the common "I expect JSON" path:
try {
  extractJson('definitely not json');
} catch (error) {
  console.log(`\nextractJson threw: ${error.name}`);
}
