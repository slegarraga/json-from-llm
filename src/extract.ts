import { removeTrailingCommas } from './repair.ts';
import { balancedSpans } from './scan.ts';
import { fencedBlocks, stripReasoning } from './strip.ts';
import { JsonExtractionError } from './types.ts';
import type { ExtractOptions, ExtractResult } from './types.ts';

function parseCandidate(
  candidate: string,
  repair: boolean,
): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(candidate) };
  } catch {
    // fall through to repair
  }
  if (repair) {
    try {
      return { ok: true, value: JSON.parse(removeTrailingCommas(candidate)) };
    } catch {
      // unrecoverable
    }
  }
  return { ok: false };
}

function matchesExpect(
  value: unknown,
  expect: 'object' | 'array' | 'any',
): boolean {
  if (expect === 'any') {
    return true;
  }
  if (expect === 'array') {
    return Array.isArray(value);
  }
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Extract a JSON value from LLM output without throwing.
 *
 * Strips `<think>` / `<thinking>` reasoning blocks, prefers fenced ```json
 * code blocks, then scans for the first balanced object/array that parses
 * (applying conservative repair). Returns `{ found: false }` if nothing parses.
 *
 * @example
 * ```ts
 * const r = tryExtractJson<{ score: number }>('<think>...</think>\n{"score":7}');
 * if (r.found) console.log(r.value.score); // 7
 * ```
 */
export function tryExtractJson<T = unknown>(
  text: string,
  options: ExtractOptions = {},
): ExtractResult<T> {
  if (typeof text !== 'string' || text.length === 0) {
    return { found: false };
  }

  const repair = options.repair ?? true;
  const expect = options.expect ?? 'any';
  const cleaned = stripReasoning(text);

  // Candidate substrings, highest confidence first: fenced blocks (and any
  // balanced values inside them), then balanced values anywhere in the text.
  const candidates: string[] = [];
  const blocks = fencedBlocks(cleaned);
  candidates.push(...blocks);
  for (const block of blocks) {
    candidates.push(...balancedSpans(block));
  }
  candidates.push(...balancedSpans(cleaned));

  for (const candidate of candidates) {
    const parsed = parseCandidate(candidate, repair);
    if (parsed.ok && matchesExpect(parsed.value, expect)) {
      return { found: true, value: parsed.value as T };
    }
  }
  return { found: false };
}

/**
 * Extract a JSON value from LLM output, throwing {@link JsonExtractionError}
 * if none can be recovered. See {@link tryExtractJson} for the algorithm.
 */
export function extractJson<T = unknown>(
  text: string,
  options: ExtractOptions = {},
): T {
  const result = tryExtractJson<T>(text, options);
  if (!result.found) {
    throw new JsonExtractionError(
      'No JSON value could be extracted from the text.',
      text,
    );
  }
  return result.value;
}
