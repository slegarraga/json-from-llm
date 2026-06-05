# Reasoning Output Fixture Corpus

This corpus contains deterministic model-output examples that commonly break
plain `JSON.parse`:

- reasoning/thinking tags with brace-laden prose
- fenced JSON blocks inside conversational text
- trailing commas in otherwise valid JSON
- competing arrays/objects when callers expect a specific top-level type
- negative text with no recoverable JSON

Each `.txt` file has a matching expected JSON file under `fixtures/expected/`.
The fixtures are synthetic and safe for public CI: they contain no prompts,
secrets, user data or live provider responses.
