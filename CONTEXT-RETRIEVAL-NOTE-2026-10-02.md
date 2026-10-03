# Canonical Context retrieval note

Recorded before the first scored Context model case.

After the owner opened the deployed Studio in the existing session, Context connected and schema_explorer returned the content types. The first original-record check then stopped with CONTEXT_RETRIEVAL_INCOMPLETE. Its groq_query returned steps as a noncanonical outline, even for two steps. The strict decoder correctly rejected it.

Read-only inspection of array_field_reader returned canonical original blocks without cropping. Source: results/context-array-format-2026-10-02T23-41-30-893Z.json. Sanity documents this split at https://www.sanity.io/docs/ai/sanity-context-mcp-tools.

The adapter requests scalar metadata and the step count through groq_query, then consecutive canonical range pages through array_field_reader. It requires the right document and field, unchanged total count, consecutive indices, no cropped blocks, no continuation token, and every expected block. The unchanged record validator and original source-line digest check run afterward. There is no local or anonymous API fallback. Existing tests, the strict decoder, source records, common model prompt, model settings, isolation code, and scorer stay unchanged.

This transport repair predates every Context model case. The model still receives the original ordered commands and output lines specified by AI-EVAL-PLAN.md. It receives no Knowledge Base entry, issue choice, historical claim, protocol note, or verdict.

## Doubts considered and dismissed

- A complete outline is original evidence. It says canonical:false and omits source lines. Canonical blocks and a matching original line digest are required.
- One successful page proves full coverage. Every declared step and index must be present. Missing or cropped pages fail.
- Transport repair changes the common model prompt. All nine frozen model contract hashes are checked separately. A mismatch stops the pair.
