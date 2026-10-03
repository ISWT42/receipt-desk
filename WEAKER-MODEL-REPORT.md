# Pre-registered weaker-model comparison

Status: done. The original GPT-6.1 comparison remains the headline: 48/48 correct status and receipt score 0.87890625 in both arms. The weaker-model addition shows no status-accuracy gain from Context.

The four arms each attempted all 48 records once. All 192 replies are retained and valid under the unchanged response schema. The first Gemini raw reply is the original retained call. It was reused without another model invocation; the continuation made 191 new calls. There was no selective retry.

| Model and input | Correct status | False done on failed | False done on missing | Credited receipts: passed, failed, missing | Receipt score |
| --- | --- | --- | --- | --- | --- |
| google/gemini-3.7-flash, raw | 46/48 | 2/16 | 0/16 | 14/16, 11/16, 16/16 | 0.6015625 |
| google/gemini-3.7-flash, Context | 46/48 | 2/16 | 0/16 | 12/16, 12/16, 16/16 | 0.5625 |
| openai/gpt-5.4-nano, raw | 47/48 | 1/16 | 0/16 | 13/16, 7/16, 4/16 | 0.0888671875 |
| openai/gpt-5.4-nano, Context | 47/48 | 0/16 | 1/16 | 13/16, 8/16, 11/16 | 0.279296875 |

The five pre-registered predictions produced two hits beside three misses.

Context's one observed gain was nano's cited-receipt score, 0.09 to 0.28 after rounding. The exact scores are in the table. Credited receipts rose from 24/48 to 32/48, while status accuracy tied at 47/48. Gemini's receipt score fell.

## Sealed predictions

| Prediction | Result | Observation |
| --- | --- | --- |
| P1: Gemini raw has at least two false done on failed checks | HIT | Two of 16. |
| P2: nano raw has at least two false done on missing checks | MISS | Zero of 16. |
| P3: Context at least halves false done for each model with at least two in raw | MISS | Only Gemini qualifies. Its count stayed at two; the criterion required at most one. |
| P4: Context correct status is at least as high for each model | HIT | Gemini tied at 46/48; nano tied at 47/48. |
| P5: Context receipt score is at least as high for each model | MISS | Nano rose from 0.0888671875 to 0.279296875, but Gemini fell from 0.6015625 to 0.5625. |

P3 is not vacuous: Gemini has the required raw errors. Nano's raw error count is below the qualifying threshold. P4 counts a tie as a hit because the sealed criterion says "at least as high." It does not show improvement.

The supplied prediction fingerprint matches a72239f4cafe21e9402fbbc1dd161875548f0f6f20f64c56e2c4b3155f93409f. The sealed file, its time correction, and the proof sidecar are unchanged. No external calendar or chain service was used to verify the OpenTimestamps proof.

## Status misses beside hits

Gemini raw called record-3fa95fd9371e done while exactly quoting line 6, "Pages:           61", against a request for 24 printed pages. It also called record-b2f88daf0497 done while quoting the failed service status.

Gemini Context repeated the 61-page error. Its other false done is record-07af27f46aa2: it quotes line 7, "result: INVALID (column amount: expected decimal(18,2), found double)", but calls the task done.

Nano raw called record-b2f88daf0497 done while its own reason says the unit is not active. Its quoted text also has one extra leading space.

Nano Context called record-c69a5f22a694 done from "print_layout: 8 sheets set to landscape, 1 page wide". That record ends before PDF conversion and a page-count check. Its reason infers a page limit from layout settings.

Supported examples are retained beside these misses: Gemini raw correctly reports record-15d17b5e94dd failed with the exact final summary; Gemini Context, nano raw, and nano Context each correctly report record-3086075941d4 done with a credited receipt. Full replies, reasons, and all case grades are in the run and comparison folders.

## Receipt failures

The fixed score requires a correct status, exact copied text, correct source and step, complete coverage, and the predeclared deciding check when required. No answer or scoring rule was repaired.

| Arm | Uncredited receipts | Source fingerprint used as source ID | Non-exact copied text |
| --- | --- | --- | --- |
| Gemini raw | 7/48 | 5/48 | 0/48 |
| Gemini Context | 8/48 | 6/48 | 0/48 |
| Nano raw | 24/48 | 15/48 | 8/48 |
| Nano Context | 16/48 | 15/48 | 0/48 |

These columns can overlap. Nano raw also has two mismatched command-step references and an uncredited broad tox summary under the fixed named-environment criterion. Observable receipt comparisons do not replace the unchanged scorer. Receipt misses do not all mean invented evidence.

Nano's receipt score rose through Context. Its status accuracy tied, and its false done moved from one failed-check record to one missing-check record. Gemini's receipt score fell, and it retained two false done in each arm. This single trial does not establish a general Context effect.

## Protocol and cost

All 96 user prompts match the GPT-6.1 raw and Context prompt bytes. The original records, response schema, scorer, and frozen model files match their original fingerprints. Each request was fresh, with no tools or supplied history, at provider-default sampling. The fixed order was Gemini raw, Gemini Context, nano raw, and nano Context. This remains a known development corpus, not a blind holdout.

The user approved a separate system file containing unchanged AI-PROMPT.txt followed by unchanged app/answer-schema.json. Codex used its output-schema channel. The broker instead received the schema as system text. Both weaker models and both arms used the same copy. The CLI's unchanged stdout and stderr are retained. Bare JSON or one complete JSON code block is extracted without repairing any answer field.

The first cost stop is preserved. The user then approved conservative token-price accounting. The final bound is 0.773990991 USD, below the 2 USD cap. Actual billing is unknown. The controller reserved each next input bound plus 4,000 output tokens before calling, counted reported input, output, and reasoning tokens at the user-supplied prices, and stopped on a cap, broker exit 5, credit/key-limit error, or timeout. Missing usage would debit the full reservation. The final audit verified every pre-call reservation. No stop condition occurred during the continuation.

The final script and every broker child ended. No broker file, key, or ledger was opened. No viewer publication, KB action, new sign-in, repository push, or article post occurred. The paired viewer remains local, and the KB issues remain untouched.

## Exploratory note: different prompts and counting

Under this desk's three-answer, cite-the-line prompt, both weaker models stayed near zero false done in both arms. Gemini had two in each arm, and nano had one in each, across the 32 failed or missing checks. Those errors remain in the table and the retained replies.

The [published Kaggle benchmark](https://www.kaggle.com/datasets/iswt42/it-quoted-the-failure-evidence) reported Gemini false done on failed checks in 7 of 16 scenarios, and nano false done on checks that never ran in 6 of 16, under the plain-report prompt. Those were scenario counts across repeated runs. This desk counts individual replies in one run per arm.

This cross-study note is exploratory. It was not one of the five sealed predictions. The prompts and counting differ, so the contrast doesn't isolate a prompt effect. Low false done also appeared in the raw arms; Context alone doesn't explain it.

## Evidence and proving lines

- Run: results/weaker-models-2026-10-03T01-01-10-394Z.
- Scores and prediction observations: results/weaker-comparison-2026-10-03T01-23-00-984Z/summary.json.
- Individual grades and receipt explanation: the same folder's four case-scores files and receipt-analysis.json.
- Final budget and frozen-file audit: results/weaker-continuation-check-2026-10-03T01-22-44-885Z.json.
- Protocol: WEAKER-MODEL-TRANSPORT-BUDGET-2026-10-03.md and WEAKER-MODEL-CONTINUATION-ACCOUNTING-2026-10-03.md.
- Original GPT-6.1 pair: results/model-pair-2026-10-02T23-55-00-823Z/summary.json.

"WEAKER MODEL TEST ATTEMPTS COMPLETE: 192 retained attempts; four 48-record arms; no selective retries."
"WEAKER MODEL BUDGET VERIFIED: conservative cost upper bound 0.77399099 USD; cap 2 USD; actual charge unknown; results/weaker-models-2026-10-03T01-01-10-394Z"
"WEAKER MODEL COMPARISONS SCORED: two model pairs; unchanged scorer; P1 to P5 assessed; results/weaker-comparison-2026-10-03T01-23-00-984Z"
"P1: HIT"
"P2: MISS"
"P3: MISS"
"P4: HIT"
"P5: MISS"

## Doubts considered and dismissed

- Context improved status accuracy here. Each pair tied. A new, separately declared trial would be needed to support a different result.
- Better nano receipts satisfy P5. The prediction applies to each model, and Gemini's score fell.
- The first attempt was retried. Its original file digest and exact reply are preserved; the new run has no new request for that seed. A duplicate request would invalidate that statement.
- The bound proves actual billing. The broker reported no costUsd. The approved conservative price method is labelled as a bound.
- Every uncredited receipt is invented. The retained text shows wrong identifiers, altered spaces, wrong step references, and the fixed criterion, as well as wrong statuses.
- A matching proof fingerprint verifies the timestamp chain. No external chain verification occurred.

**Update, 3 October 2026, about 05:10 UTC.** The OpenTimestamps proof for `PREDICTIONS-WEAKER-MODELS.md` is now complete and checked against Bitcoin: block 969650, timestamped 00:20 UTC on 3 October 2026, with three calendar attestations whose merkle roots all match. That is before the first weaker-model call, which came after 00:36:49 UTC. The upgraded `.ots` file is in this repository; the sealed file and its correction are unchanged.
