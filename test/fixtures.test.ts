import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { tryExtractJson } from '../src/index.ts';
import type { ExtractOptions } from '../src/index.ts';

interface ExpectedFixture {
  found: boolean;
  expect: ExtractOptions['expect'];
  value?: unknown;
}

const fixtureNames = [
  'deepseek-thinking-object',
  'gemini-reasoning-array',
  'prose-trailing-commas',
  'expect-object-skips-array',
  'no-json',
] as const;

async function fixtureText(name: string): Promise<string> {
  return readFile(new URL(`../fixtures/${name}.txt`, import.meta.url), 'utf8');
}

async function expectedFixture(name: string): Promise<ExpectedFixture> {
  const text = await readFile(
    new URL(`../fixtures/expected/${name}.json`, import.meta.url),
    'utf8',
  );
  return JSON.parse(text) as ExpectedFixture;
}

describe('reasoning output fixture corpus', () => {
  for (const name of fixtureNames) {
    it(`matches ${name}`, async () => {
      const text = await fixtureText(name);
      const expected = await expectedFixture(name);
      const result = tryExtractJson(text, { expect: expected.expect });

      expect(result.found).toBe(expected.found);
      if (expected.found) {
        expect(result).toEqual({ found: true, value: expected.value });
      }
    });
  }
});
