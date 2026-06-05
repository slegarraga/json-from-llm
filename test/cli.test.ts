import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { isExecutedFile, runCli } from '../src/cli.ts';

async function run(args: string[], stdin: string) {
  let stdout = '';
  let stderr = '';
  const exitCode = await runCli(args, stdin, {
    stdout: (chunk) => {
      stdout += chunk;
    },
    stderr: (chunk) => {
      stderr += chunk;
    },
  });
  return { exitCode, stdout, stderr };
}

describe('json-from-llm CLI', () => {
  it('reads stdin and prints normalized JSON', async () => {
    const result = await run(
      [],
      '<think>{draft: true}</think>```json\n{"score":8,"reason":"clear"}\n```',
    );

    expect(result).toEqual({
      exitCode: 0,
      stdout: '{"score":8,"reason":"clear"}\n',
      stderr: '',
    });
  });

  it('supports --expect object and skips earlier arrays', async () => {
    const result = await run(
      ['--expect', 'object'],
      'candidate [1,2,3]\nfinal {"ok":true}',
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('{"ok":true}\n');
    expect(result.stderr).toBe('');
  });

  it('supports --no-repair and reports extraction failures on stderr', async () => {
    const result = await run(['--no-repair'], '{"a":1,}');

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('json-from-llm: no JSON found');
  });

  it('detects execution through an npm bin symlink', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'json-from-llm-cli-'));
    try {
      const target = join(tempDir, 'cli.js');
      const symlink = join(tempDir, 'json-from-llm');
      writeFileSync(target, '#!/usr/bin/env node\n');
      symlinkSync(target, symlink);

      expect(isExecutedFile(pathToFileURL(target).href, symlink)).toBe(true);
    } finally {
      rmSync(tempDir, { force: true, recursive: true });
    }
  });
});
