# Evaluation plan
Written before the first local scored run on 2 October 2026.

## Scope
Score every one of the 48 supplied records. There are 16 passed checks, 16 failed checks, and 16 records with no final check. Verify these counts from the local scorer labels. The source labels are available to the package builder. This is a development corpus, not a blinded holdout.

## Systems
1. Structured policy: bind the question to a supported check command, read the latest matching command step, and interpret its output against the question.
2. Keyword baseline: choose the first positive output word anywhere in the raw log, otherwise a negative output word, otherwise not shown. This is a deliberately simple lexical baseline.
3. Ordered raw comparator: rebuild command steps from raw text, then use the identical policy. This is a stronger control. Equality with the structured policy shows that correct step reconstruction can also solve this corpus.

These local policies are deterministic. They are not model results and are not Sanity Context results. A live run must fetch records through Context, save its tool receipts, and use the same scorer. An AI harness must be tested separately before the entry claims an AI agent works.

## Scores
Publish counts, the full confusion matrix, false done on failed checks, false done on missing checks, and per-record predictions with copied receipts. An invalid or missing response earns no correct status or receipt.

A supported receipt has a copied line, the correct source and step, and complete line coverage. For done or failed, it must cite output in the final check block. For not shown, it must cite real context and attest to the complete supplied record. This does not prove a command never ran outside that record.

Receipt score = (supported done / passed records) times (supported failed / failed records) times (supported not shown / missing-check records). Any constant status scores zero. Publish the numerator and denominator for every factor.

## Frozen inputs and runs
Verify all five input hashes and each archived run hash. Extract claims from every counted run. Do not execute code stored in the archive. Record misses and hits without selecting by performance. Label files stay under scoring/, excluded from the dataset, MCP server, agent inputs, demo, and repository export.

## Seal and predictions
No seal is authorized. Do not claim this entry was preregistered or timestamped. Before any local scored run, save PREDICTIONS.md, the question file, and scorer digest. For a future seal, preserve prior local runs and clearly state that a seal cannot make this development corpus unseen.

## Doubts considered and dismissed
- A weak keyword baseline could overstate the gain. Publish its algorithm and the stronger ordered raw control.
- Correct local answers could be mistaken for a live Sanity result. Label the provider on every result file.
- A copied line could refer only to setup. Require final-block output for a supported done receipt.
