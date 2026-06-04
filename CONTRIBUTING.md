# Contributing to json-from-llm

Thanks for taking the time to contribute. This project aims to be a small,
dependable, zero-dependency building block, so the bar for changes is clarity
and correctness over breadth.

## Getting started

```sh
git clone https://github.com/slegarraga/json-from-llm.git
cd json-from-llm
npm install
```

## Development workflow

Every change should keep the full check suite green:

```sh
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest
npm run build       # tsup (ESM + CJS + types)
npm run format      # prettier --write
```

Run `npm run test:watch` while developing.

## Pull requests

1. Fork the repo and create a branch from `main` (e.g. `fix/nested-fence`).
2. Add or update tests. New behaviour without a test will not be merged.
3. Make sure `typecheck`, `lint`, `test` and `build` all pass.
4. Keep the public API surface small and documented with JSDoc.
5. Open a pull request and include the exact LLM output string you are handling.

## Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/).
Examples:

```
feat: strip <reasoning> blocks as well as <think>
fix: keep braces inside string values out of the scan
docs: document the expect option
test: cover escaped quotes inside strings
chore: bump dev dependencies
```

The type drives the next version bump (`fix` -> patch, `feat` -> minor, a
`!` or `BREAKING CHANGE` footer -> major).

## Reporting bugs

Open an issue with the exact text the model produced, what you expected to be
extracted, and what you got. A failing test case is the most useful form a bug
report can take.

## Scope and philosophy

- Zero runtime dependencies. A dependency needs an exceptional justification.
- Extraction is total: it never throws from `tryExtractJson`, and repair is
  conservative — it may only fix structure, never rewrite string contents.
- Prefer being correct over being clever: if a repair could corrupt valid data,
  it does not belong here.
