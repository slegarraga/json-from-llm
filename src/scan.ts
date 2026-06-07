/**
 * Find the substrings of complete, balanced JSON objects/arrays in `text`,
 * in document order. String-aware and delimiter-aware: braces and brackets
 * inside JSON strings do not affect nesting, and `[` must close with `]`.
 */
export function balancedSpans(text: string): string[] {
  const spans: string[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '{' || ch === '[') {
      const match = matchBalanced(text, i);
      if (match.end !== -1) {
        spans.push(text.slice(i, match.end));
        i = match.end;
        continue;
      }

      i = Math.max(match.resume, i + 1);
      continue;
    }
    i++;
  }
  return spans;
}

interface MatchResult {
  /** Index just past the balanced value, or -1 when no complete value exists. */
  end: number;
  /** Next scan index after a malformed or incomplete candidate. */
  resume: number;
}

function matchBalanced(text: string, start: number): MatchResult {
  const expectedClosers: string[] = [];
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
      continue;
    }

    if (ch === '{') {
      expectedClosers.push('}');
      continue;
    }

    if (ch === '[') {
      expectedClosers.push(']');
      continue;
    }

    if (ch === '}' || ch === ']') {
      if (expectedClosers.pop() !== ch) {
        return { end: -1, resume: i + 1 };
      }
      if (expectedClosers.length === 0) {
        return { end: i + 1, resume: i + 1 };
      }
    }
  }

  return {
    end: -1,
    resume: looksLikeJsonContainerStart(text, start) ? text.length : start + 1,
  };
}

function looksLikeJsonContainerStart(text: string, start: number): boolean {
  let index = start + 1;
  while (index < text.length && /\s/.test(text[index])) {
    index++;
  }

  const next = text[index];
  if (text[start] === '{') {
    return next === '"' || next === '}';
  }

  return (
    next === undefined ||
    next === '[' ||
    next === '{' ||
    next === '"' ||
    next === ']' ||
    next === '-' ||
    (next >= '0' && next <= '9') ||
    next === 't' ||
    next === 'f' ||
    next === 'n'
  );
}
