/**
 * Remove trailing commas (`{"a":1,}` → `{"a":1}`, `[1,2,]` → `[1,2]`), which
 * models emit frequently. String-aware: a comma inside a string value is never
 * touched, so this can only ever fix structure, never corrupt content.
 */
export function removeTrailingCommas(json: string): string {
  let out = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];

    if (inString) {
      out += ch;
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
      out += ch;
      continue;
    }

    if (ch === ',') {
      let j = i + 1;
      while (
        j < json.length &&
        (json[j] === ' ' ||
          json[j] === '\n' ||
          json[j] === '\r' ||
          json[j] === '\t')
      ) {
        j++;
      }
      if (json[j] === '}' || json[j] === ']') {
        continue; // drop the trailing comma
      }
    }

    out += ch;
  }

  return out;
}
