# Same-model comparison

Model: gpt-6.1-sol. Reasoning effort: high. Provider: existing ChatGPT/Codex plan. No paid API.

The application retrieves the structured arm through hosted Sanity Context before inference. The model uses no tools. Every answer comes from a fresh ephemeral session.

| Arm | Correct status | False done on failed | False done on not shown | Supported receipts: done, failed, not shown | Receipt score |
| --- | --- | --- | --- | --- | --- |
| rawModel | 48/48 | 0/16 | 0/16 | 15/16, 15/16, 16/16 | 0.878906 |
| contextModel | 48/48 | 0/16 | 0/16 | 15/16, 15/16, 16/16 | 0.878906 |

Paired counts: {"bothCorrect":48,"rawOnlyCorrect":0,"contextOnlyCorrect":0,"bothIncorrect":0}.

This is one run on a known development corpus. The builder saw the labels. No external seal, blind holdout, or unseen-performance claim is made.
The original scorer is unchanged. Invalid replies earn no credit. All answers and receipt misses are retained.

## Doubts considered and dismissed
- A tie could be concealed by emphasizing the weak baseline. These two model arms are the main comparison.
- A copied line alone could prove completion. The scorer also requires the correct status, source, step, complete coverage, and canonical final-check output.
- Context could secretly fall back to local evidence. Its saved provider receipts and input digests identify every fetched record.
