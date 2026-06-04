/**
 * Find the substrings of complete, balanced JSON objects/arrays in `text`,
 * in document order. String-aware: braces and brackets inside JSON strings do
 * not affect nesting, so prose like `"the } char"` won't break the scan.
 */
export function balancedSpans(text: string): string[] {
  const spans: string[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '{' || ch === '[') {
      const end = matchBalanced(text, i);
      if (end !== -1) {
        spans.push(text.slice(i, end));
        i = end;
        continue;
      }
    }
    i++;
  }
  return spans;
}

/** Return the index just past the balanced value starting at `start`, or -1. */
function matchBalanced(text: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === '{' || ch === '[') {
      depth++;
    } else if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 0) {
        return i + 1;
      }
    }
  }

  return -1;
}
