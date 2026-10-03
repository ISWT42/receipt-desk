# Numbers in the post
Both 48-record model arms completed and were scored together with the unchanged original scorer. The result is a tie.

| Number or identifier | Source file and field |
| --- | --- |
| 48 records, 48 bundles, 96 indexed documents | work/content/public-manifest.json: records, claimBundles, datasetDocuments |
| 2,592 replies, 54 counted runs | work/content/public-manifest.json: matchedReplies, countedRuns |
| Verified 48 public records, 48 bundles, 2,592 replies | results/dataset-read-2026-10-02T21-14-30-090Z.json: records, claimBundles, historicalReplies |
| 48 retained raw-model responses | results/model-raw-2026-10-02T21-18-17-071Z/completion.json: records, status |
| 48 questions per model arm | AI-EVAL-PLAN.md and work/eval/questions.jsonl |
| gpt-6.1-sol, high effort | app/lib/model-session.mjs: modelSettings; results/model-text-interface-2026-10-02T21-16-16-920Z.json |
| 48 correct, deterministic structured | results/local-2026-10-02T19-36-52-112Z/summary.json: systems.structured.correctTotal |
| 48 correct, deterministic ordered raw | Same summary: systems.orderedRaw.correctTotal |
| 17 correct, lexical | Same summary: systems.keyword.correctTotal |
| 16 failed, 16 missing checks | Same summary: classTotals.failed, classTotals.not shown |
| 15 false done in each negative class, lexical | Same summary: keyword.falseDoneFailed, keyword.falseDoneNotShown |
| First local run: 47 correct | results/local-2026-10-02T19-36-14-132Z/summary.json: structured.correctTotal |
| Constant status scores zero | EVAL-PLAN.md formula and unchanged app/tests/policy.test.mjs |
| CC BY 4.0 | inputs/dataset-metadata.json: licenses; exported documents preserve it |
| ixoe9uvf / production, public | sanity.public.json and anonymous dataset verification |
| 19 Knowledge Base entries | results/kb-outline-2026-10-02T23-34-22-346Z/receipt.json: outline text |
| Nine first-build conflict issues | results/kb-issues-owner-report-2026-10-02T23-40-45-958Z.json: issueCount; owner-reported, not independently read from the issue queue |
| 24 and 61 pages on distinct board_pack records | results/kb-example-source-2026-10-02T23-36-23-420Z.json: records, line 6; source digests verified |
| Third board_pack record with no page-count check | Same source receipt: record-c69a5f22a694, three source lines |
| Generated reply count 57 versus original 54 | results/kb-reply-count-2026-10-03T00-05-08-245Z.json; original Context reply verification: results/context-claims-2026-10-03T00-06-32-891Z.json |
| Board_pack entry preserves all three IDs | results/knowledge-base-2026-10-02T23-34-49-452Z/receipt.json: entries text |

## Paired model result sources

| Post count | Source file and field |
| --- | --- |
| 48/48 correct in each model arm | results/model-pair-2026-10-02T23-55-00-823Z/summary.json: systems.rawModel.correctTotal, systems.contextModel.correctTotal, total |
| 0/16 false done on failed and missing checks in each arm | Same summary: falseDoneFailed, falseDoneNotShown, classTotals |
| 15/16, 15/16, 16/16 receipt credit in each arm | Same summary: supportedByClass and classTotals |
| Receipt score 0.87890625 in each arm | Same summary: receiptScore |
| 46/48 credited receipts, two misses in each arm | Sum of supportedByClass; each arm case-scores file has two receiptSupported:false rows |
| Same two checkout misses; selected line 7, final summary line 8 | results/model-pair-2026-10-02T23-55-00-823Z/receipt-miss-note.json: misses |
| 96 recorded model answers in viewer | results/model-paired-ui-2026-10-02T23-56-39-014Z.json: answersCompared |
| Live deterministic Context: 48 correct, receipt score 1, zero retrieval failures | results/context-2026-10-02T23-55-32-803Z/summary.json: systems.structured, retrievalFailures |

Do not reuse deterministic counts as the same-model comparison.

## Doubts considered and dismissed
- Rates alone are sufficient. Publish the class counts and receipt numerators.
- A source budget of 96 means the entire dataset contains only 96 documents. The earlier dotted-ID copies remain; the indexed root source has 96.
- Perfect status accuracy means every receipt is credited. The pair has two receipt misses per arm under the fixed rule.
