# Weaker-model schema transport and budget approval

Written before the first paid weaker-model call.

The owner approved a separate system-file copy containing the unchanged AI-PROMPT.txt followed by the unchanged app/answer-schema.json. The selected file is work/weaker-system-candidate-2026-10-03T00-27-28-065Z.txt. Its prefix is the original prompt, then a Response schema label and the original schema text. Neither source file is edited.

The user evidence prompt bytes match the original GPT-6.1 raw and Context arms exactly. The weaker-model system message adds the frozen schema as text because the broker CLI has no separate schema argument. Codex provided that same schema through its output-schema channel. This is a declared transport difference. Both weaker models and both arms use the identical system-file copy. Provider sampling stays at its default.

The owner says sanity-weak is only a ledger label. The controller enforces the 2 USD cap. Before each call it reserves the complete input UTF-8 byte bound plus 4096 framing tokens at the supplied list input price, plus 4000 output tokens at list output price. It adds that maximum to the rounded-up total of returned costUsd values. If the total would exceed 2 USD, no call is sent. Prices in USD per million tokens, supplied by the owner: Gemini input 0.75 and output 3.75; nano input 0.20 and output 1.25.

Broker exit code 5 or any credit/key-limit error stops the entire test without retry. Unknown cost, a timeout with uncertain cost, or a charge larger than its reservation also stops. A stopped or finished batch cannot resume. A one-case receipt-review pause is allowed solely to verify the broker envelope and cost field; the retained first case is skipped on continuation and never rerun. No labels or scores are inspected during this review.

Only the approved broker command, provider openrouter, two approved model names, prompt-file, system-file, and lane sanity-weak are passed. No broker file is opened. Only the public evidence record and common instructions go to a model; Context tokens are removed from the broker child environment. All calls are serial.

The sealed predictions and correction are unchanged. P1 to P5 will be assessed after all attempted arms finish, using the original score() function. The GPT-6.1 tie remains the headline. All KB issues and the first build remain unchanged. The recorded paired viewer stays local.

## Doubts considered and dismissed

- The schema copy is identical to the Codex schema channel. Its content is unchanged, but its channel differs and is disclosed.
- A ledger lane enforces a budget. The pre-call reservation and returned-cost guard do that here.
- A first-response review permits a retry. It only validates the envelope; the first attempt remains retained.
- A broker or Context token belongs in the public proof. No request headers, secrets, or session identifiers are retained.
