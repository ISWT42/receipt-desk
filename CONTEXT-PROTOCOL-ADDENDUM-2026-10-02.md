# Context protocol addendum

Written after the completed raw-model arm and before any Context request in this continuation. The original AI-EVAL-PLAN.md, model prompt, response schema, scorer, source records, and raw answers remain unchanged. This is a disclosed amendment, not a claim of preregistration.

## Owner-reported finding
The owner reports that Receipt Desk, kbGtaUln7JDn, finished building with Entries up to date and raised 9 conflict issues. The reported failure mode is conflating distinct records for one scenario into a shared fact. In the reported board_pack example, record-9a8e24576364 has 24 pages and record-3fa95fd9371e has 61 pages, while historical model claims say done and 24 pages. This information is owner-reported. It has not yet been independently retrieved in this continuation. No claim is made that all 9 issues have the same cause until each is reviewed.

## Chosen handling proposal
Recommend changing the Knowledge Base purpose and rebuilding, rather than blanket dismissal. A dismissal can close an issue while leaving merged or mis-scoped entries intact. The purpose must make record identity the unit of fact and distinguish requested criteria, observed output, model claims, and missing evidence.

Keep the current built Knowledge Base and its issues unchanged as the first observed snapshot. Do not accept either side, create a standing truth, add an answer as an insight, or resolve an issue by treating a model claim as evidence. Do not dismiss issues or change the purpose in this run: those are additional remote writes, and the owner asked for a proposal. Apply no rebuild without the owner's approval and free-plan confirmation.

Scoped dismissal is an alternative only when the entry itself already preserves both record identities and each issue is verified to be a false conflict across different records. A reason would be: These observations concern distinct record IDs and source digests. Each holds only within its own supplied log. Historical model replies are attributed claims. No scenario-wide completion status or page count follows. This alternative has not been applied.

## Proposed purpose text
Organize independent engineering benchmark records for source discovery. Each recordId and sourceDigest identifies a separate supplied log, not an update to one shared scenario state. Use one clearly scoped entry per record where possible. Similar questions may be grouped for navigation, but their observations must not be merged into one scenario-wide fact.

Separate the requested condition from observed command output. Preserve the order of check steps, exact source lines, their original line numbers, and the neutral record identity. Scope every page count, check result, and absence of a check to the record and step that supplied it. Do not infer an observed result from an expected target in a question. Earlier output cannot silently replace a later check.

Treat every historical model reply as an attributed claim tied to its recordId and runId, not as verification. Keep claims separate from source observations. A disagreement between a claim and a log is material to preserve. Do not make either side a standing truth. Preserve distinct observations across different records even when they share a task name. Link entries back to the original source record so that the exact log can decide an answer. Do not manufacture a unified answer, preferred count, or missing output.

## Boundary for the imminent Context run
The read-only dataset Context check will use an exact neutral document ID, validate full line coverage, and verify the original source digest before assessing it. Any Knowledge Base reads in this continuation are diagnostic observations of the existing first build.

The scored Context arm, if run, remains the frozen application-fetches-GROQ-record design. It receives only each original ordered record. Knowledge Base summaries, outlines, conflict resolutions, historical model replies, this addendum, and the owner-reported example do not enter scored model inputs. The scorer remains separate and unchanged. No local evidence fallback is allowed.

The original raw arm stays intact and unscored until both arms complete. Record this addendum's digest beside the Context run before launching it. Do not relabel the original raw protocol hash or pretend this finding was observed before the raw arm.

## Post finding
Report that a built Knowledge Base can flag distinct benchmark records as competing facts when it scopes them by scenario instead of record identity. Report the owner's nine-issue count as owner-observed until issue records are retrieved. Show a source-grounded example when available. This is a Knowledge Base scoping finding, separate from the raw-versus-original-Context-record accuracy comparison. Do not claim that every issue is identical or that the revised purpose has fixed anything before a rebuilt snapshot is checked.

## Doubts considered and dismissed
- One count should be selected to make the Knowledge Base consistent. The records describe distinct supplied logs, and a global selection would erase the distinction. A verified same-record contradiction would require a separate issue review.
- The model claim can settle the count. It is the kind of claim this desk must compare against evidence. A matching original source receipt is required to support it.
- Closing an issue repairs its entry. Dismissal does not establish that a merged entry changed. Reading an identity-preserving entry after a documented action would be the relevant evidence.
- This changes the scored prompt after the raw arm. The addendum is excluded from model inputs and the nine frozen file hashes remain unchanged. A hash or input mismatch would stop the paired run.
