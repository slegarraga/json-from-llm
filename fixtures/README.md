# Reasoning Output Fixture Corpus

This corpus contains deterministic model-output examples that commonly break
plain `JSON.parse`:

- reasoning/thinking tags with brace-laden prose
- fenced JSON blocks inside conversational text
- multiple fenced blocks where a later complete payload should win
- trailing commas in otherwise valid JSON
- competing arrays/objects when callers expect a specific top-level type
- malformed drafts before a final valid JSON answer
- truncated stream output that contains nested draft fragments
- unclosed reasoning tags that should not leak draft JSON
- negative text with no recoverable JSON

Each `.txt` file has a matching expected JSON file under `fixtures/expected/`.
The fixtures are synthetic and safe for public CI: they contain no prompts,
secrets, user data or live provider responses.
