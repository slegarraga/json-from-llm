# Security Policy

## Supported versions

The latest published `0.x` release receives security fixes.

## Reporting a vulnerability

Please report security issues privately rather than opening a public issue.

- Use GitHub's [private vulnerability reporting](https://github.com/slegarraga/json-from-llm/security/advisories/new), or
- Email **sebastian@0a.cl** with the details.

Include a description, a reproduction, and the impact. You can expect an initial
response within a few days. Once a fix is released, we are happy to credit you in
the advisory unless you prefer to remain anonymous.

## Scope

`json-from-llm` has zero runtime dependencies and performs only in-memory string
scanning and `JSON.parse`: it does not make network requests, read or write
files, or execute code from its input. The most relevant risks are denial of
service from pathological input (for example, very long unbalanced strings).
Reports along those lines are welcome.
