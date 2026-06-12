#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { extractJson } from './extract.ts';
import { JsonExtractionError } from './types.ts';
import type { ExtractOptions } from './types.ts';

export interface CliStreams {
  stdout: (chunk: string) => void;
  stderr: (chunk: string) => void;
}

interface CliConfig extends ExtractOptions {
  help: boolean;
}

const usage = `Usage: json-from-llm [--expect object|array|any] [--no-repair]

Read LLM output from stdin and print the extracted JSON value to stdout.

Options:
  --expect <type>  Require the top-level JSON value to be object, array or any.
  --no-repair      Disable conservative trailing-comma repair.
  -h, --help       Show this help text.
`;

function parseArgs(args: string[]): CliConfig | string {
  const config: CliConfig = { help: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '-h' || arg === '--help') {
      config.help = true;
      continue;
    }

    if (arg === '--no-repair') {
      config.repair = false;
      continue;
    }

    if (arg === '--expect') {
      const value = args[index + 1];
      if (value !== 'object' && value !== 'array' && value !== 'any') {
        return 'invalid --expect value; use object, array or any';
      }
      config.expect = value;
      index += 1;
      continue;
    }

    return `unknown option: ${arg}`;
  }

  return config;
}

export async function runCli(
  args: string[],
  stdin: string,
  streams: CliStreams,
): Promise<number> {
  const config = parseArgs(args);

  if (typeof config === 'string') {
    streams.stderr(`json-from-llm: ${config}\n`);
    return 2;
  }

  if (config.help) {
    streams.stdout(usage);
    return 0;
  }

  try {
    const value = extractJson(stdin, config);
    streams.stdout(`${JSON.stringify(value)}\n`);
    return 0;
  } catch (error) {
    if (error instanceof JsonExtractionError) {
      streams.stderr('json-from-llm: no JSON found\n');
      return 1;
    }

    streams.stderr(
      `json-from-llm: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    return 1;
  }
}

async function readStdin(): Promise<string> {
  process.stdin.setEncoding('utf8');
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
  }
  return input;
}

export function isExecutedFile(moduleUrl: string, argvPath?: string): boolean {
  if (!argvPath) {
    return false;
  }

  try {
    return realpathSync(fileURLToPath(moduleUrl)) === realpathSync(argvPath);
  } catch {
    return false;
  }
}

function isMain(): boolean {
  return isExecutedFile(import.meta.url, process.argv[1]);
}

async function main(): Promise<void> {
  process.exitCode = await runCli(process.argv.slice(2), await readStdin(), {
    stdout: (chunk) => {
      process.stdout.write(chunk);
    },
    stderr: (chunk) => {
      process.stderr.write(chunk);
    },
  });
}

if (isMain()) {
  void main();
}
