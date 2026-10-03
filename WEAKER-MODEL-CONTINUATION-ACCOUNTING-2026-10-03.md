# Approved weaker-model continuation accounting

Written before any of the remaining 191 calls.

The owner approved conservative token-price accounting. The first call remains in results/weaker-models-2026-10-03T00-36-49-176Z and is never repeated. The stopped batch and its original placeholders are retained. A new continuation uses that exact returned text and token receipt as the first seed, then only unattempted records.

The controller debits a conservative USD upper bound using the supplied model list prices and returned input, output, and reasoning counts. Reasoning is counted again even if included in output. The first bound is 0.0040335 USD. Where this token bound is larger than the previously reserved maximum, use the smaller of these two valid upper bounds. If counts are unavailable, debit the complete pre-call maximum. An inconsistent broker model, timeout, broker exit code 5, or credit/key-limit error stops further requests. No retry is allowed. The next call's full worst-case reservation must fit under the 2 USD cumulative bound before sending.

Actual charges remain unknown. Report this as conservative upper-bound accounting, not returned costUsd or verified billing.

The observed broker CLI writes model text to stdout and diagnostics to stderr, rather than a JSON API envelope. Read one JSON object from the unchanged stdout, allowing a single JSON code block as presentation framing. Reject prose, multiple objects, arrays, malformed JSON, and any object that fails the unchanged frozen response schema. No status, receipt field, quote, identifier, coverage, or reason is repaired. Preserve all original stdout and stderr. The first ungraded reply is decoded through this same adapter, with no new model invocation.

The raw and Context user prompts, common system-file copy, source records, schema, predictions, and score() remain unchanged. No labels or scores were read before this transport and accounting correction. All four arms use the same decoder and accounting mode. The original GPT-6.1 tie stays the headline. The viewer remains local; the first KB build and its nine issues remain untouched.

## Doubts considered and dismissed

- Using the first call as a seed repeats it. Only the retained text and usage are read; no API invocation is made for that record.
- A JSON presentation wrapper changes the answer. The object fields and original raw text remain identical; malformed or extra content still fails.
- The bound is actual billing. It is a conservative list-price estimate and is labelled that way.
- Missing usage permits zero debit. The full pre-call maximum is debited instead.
