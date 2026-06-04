# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
