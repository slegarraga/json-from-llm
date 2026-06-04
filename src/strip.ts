/**
 * Remove model "thinking" / reasoning blocks. Reasoning models (DeepSeek R1,
 * Qwen, and prompted Claude/Gemini setups) emit `<think>…</think>` or
 * `<thinking>…</thinking>` before the answer, and that text frequently contains
 * brace-laden prose that would otherwise be mistaken for the payload.
 */
const REASONING_TAGS = /<(think|thinking|reasoning|thought)>[\s\S]*?<\/\1>/gi;

export function stripReasoning(text: string): string {
  return text.replace(REASONING_TAGS, '');
}

/**
 * Return the inner contents of fenced code blocks that could hold JSON: blocks
 * tagged ```json / ```jsonc / ```json5, or untagged ``` blocks. Other languages
 * (```python, ```ts) are skipped — they won't contain the answer JSON.
 */
const FENCE = /```[^\S\n]*([a-zA-Z0-9_+-]*)[^\S\n]*\n?([\s\S]*?)```/g;

export function fencedBlocks(text: string): string[] {
  const blocks: string[] = [];
  FENCE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = FENCE.exec(text)) !== null) {
    const lang = match[1].toLowerCase();
    const content = match[2].trim();
    if (content.length > 0 && (lang === '' || lang.includes('json'))) {
      blocks.push(content);
    }
  }
  return blocks;
}
