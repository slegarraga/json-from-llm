# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.2] - 2026-06-11

### Changed

- Published README download badge updates so the npm package page shows the refreshed 30-day download badge.

## [0.2.1] - 2026-06-07

### Added

- Added provider-style fixtures for fenced OpenAI-like output, multiple fenced
  candidates, Anthropic-like prose wrappers, malformed drafts before final JSON,
  truncated streams and unclosed reasoning blocks.
- Added edge-case coverage for BOM/whitespace, escaped braces in strings,
  deeply nested JSON and partial malformed input.

### Changed

- Made balanced scanning delimiter-aware so mismatched `{` / `]` drafts and
  truncated JSON-looking containers are skipped as malformed candidates.
- Prefer complete fenced payloads across all JSON-ish fences before falling back
  to lower-confidence balanced fragments inside fenced prose.
- Treat unclosed reasoning tags as reasoning through the end of the text to
  avoid extracting valid-looking draft JSON.

## [0.2.0] - 2026-06-05

### Added

- Added the `json-from-llm` CLI for shell pipelines. It reads stdin, prints the
  extracted JSON value to stdout and supports `--expect object|array|any` plus
  `--no-repair`.
- Added CLI tests covering normalized stdout, top-level type selection and
  extraction failures.

## [0.1.3] - 2026-06-05

### Added

- Added a public reasoning-output fixture corpus covering `<think>` /
  `<reasoning>` blocks, fenced JSON, prose wrappers, trailing commas, type
  expectations and no-JSON failures.
- Added tests that read the published fixture corpus and verify `tryExtractJson`
  results.
- Published the `fixtures/` directory in the npm package for downstream parser
  and agent-loop tests.

## [0.1.2] - 2026-06-04

### Changed

- Updated vulnerable development tooling and added CodeQL, OpenSSF Scorecard,
  pinned GitHub Actions, least-privilege workflow permissions, Dependabot config
  and a Scorecard README badge.

## [0.1.1] - 2026-06-04

### Changed

- Published README package-status badges, download visibility and release notes
  to the npm package page.

## [0.1.0] - 2026-06-04

### Added

- `extractJson(text, options?)` and `tryExtractJson(text, options?)` — recover a
  JSON value from LLM output wrapped in reasoning/thinking tags, markdown fences
  or prose.
- Strips `<think>` / `<thinking>` / `<reasoning>` blocks before scanning.
- String-aware balanced-value scanner and trailing-comma repair (never corrupt
  string contents).
- `expect: 'object' | 'array' | 'any'` option and `repair` toggle.
- Low-level exports: `stripReasoning`, `fencedBlocks`, `balancedSpans`,
  `removeTrailingCommas`.
- Zero runtime dependencies; ESM + CJS builds with type declarations.

[0.1.0]: https://github.com/slegarraga/json-from-llm/releases/tag/v0.1.0
