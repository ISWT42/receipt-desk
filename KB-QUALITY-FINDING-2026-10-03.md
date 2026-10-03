# Knowledge Base quality finding

Recorded after the completed paired model trial, before further Context requests for this finding. The pre-run protocol notes and frozen model plan remain intact.

## Observed numeric error

The first-build claims/extraction_evidence entry says record-9a8e24576364 has 57 replies. The approved original claim bundle has 54. This mismatch was checked independently against the public source snapshot:
results/kb-reply-count-2026-10-03T00-05-08-245Z.json.

The read-only retrieval succeeded, but this generated numeric claim fails source verification. Do not treat retrieval as acceptance of entry quality. Do not generalize this one checked error to every generated claim.

## Current handling proposal

The verified false board_pack cross-record conflict can be dismissed with the record-specific reason already documented in CONTEXT-PROTOCOL-FINDING-2026-10-02.md. Review each of the other eight owner-reported issues individually. Do not choose a side.

The reply-count error is a separate entry-quality problem. Dismissing the reported conflict would not repair it. Preserve the first-build snapshot and audit generated claims against their original sources. A purpose revision and rebuild is a proposal for either lost record identity or unsupported generated facts. No issue dismissal, instruction, purpose change, source edit, or rebuild has been applied or is authorized here.

Proposed purpose for a reviewed rebuild:
"Help a status desk find original engineering evidence by neutral record ID and source digest, preserving each independent log and its ordered commands, exact output lines, and source links. Treat historical model replies as claims; keep observations scoped to their own record and step; state a count only from complete source coverage or explicit verified metadata, otherwise omit it; never manufacture a scenario-wide status or choose one record as standing truth for another."

This purpose contains no expected status, page-count answer, or per-record answer key. Its effectiveness remains untested. Review the result of any future authorized rebuild against the original source, not against the generated entry it replaced.

## Model boundary

This error was found after both model arms and their original scoring completed. No prompt, answer, scorer, or model input changed. Knowledge Base entries and all issue handling were excluded from both arms.

## Doubts considered and dismissed

- A successful knowledge_base_read proves that its numbers are correct. The 57-versus-54 comparison disproves that for one claim. Matching original coverage is required.
- Dismissal repairs a generated entry. It rejects an issue proposal without proving any entry changed. A source-verified rebuilt entry is needed to establish a repair.
- The count can be inserted as a standing answer. No remote instruction or side-selection is proposed. The purpose concerns source scope and coverage, not a supplied result.
