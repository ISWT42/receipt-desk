# Pre-registered weaker-model comparison

Status: done. The original GPT-6.1 tie stays the headline.

One run per model per arm. Same original user prompts, source records, and unchanged scorer. Provider default sampling. No selective retry. See the pre-call transport note for how the response schema was supplied.

| Arm | Correct status | False done on failed | False done on missing | Credited receipts: done, failed, missing | Receipt score |
| --- | --- | --- | --- | --- | --- |
| gemini-raw | 46/48 | 2/16 | 0/16 | 14/16, 11/16, 16/16 | 0.6015625 |
| gemini-context | 46/48 | 2/16 | 0/16 | 12/16, 12/16, 16/16 | 0.5625 |
| nano-raw | 47/48 | 1/16 | 0/16 | 13/16, 7/16, 4/16 | 0.0888671875 |
| nano-context | 47/48 | 0/16 | 1/16 | 13/16, 8/16, 11/16 | 0.279296875 |

| Prediction | Result | Observation |
| --- | --- | --- |
| P1 | HIT | 2 |
| P2 | MISS | 0 |
| P3 | MISS | [{"model":"google/gemini-3.7-flash","raw":2,"context":2}] |
| P4 | HIT | [{"model":"google/gemini-3.7-flash","raw":46,"context":46},{"model":"openai/gpt-5.4-nano","raw":47,"context":47}] |
| P5 | MISS | [{"model":"google/gemini-3.7-flash","raw":0.6015625,"context":0.5625},{"model":"openai/gpt-5.4-nano","raw":0.0888671875,"context":0.279296875}] |

Conservative cost upper bound: 0.773990991 USD. Actual charge is unknown. The approved guard counts reported input tokens plus output and reasoning tokens at the owner-supplied prices, or reserves the full pre-call maximum when token counts are missing. Cap: 2 USD. Stop reason: none.
All 192 retained attempts are included. The first reply was reused without another call; 191 new calls were made. The broker system file contains the unchanged frozen prompt followed by the unchanged schema. Bare JSON or one complete JSON code block is extracted from the original retained standard output, without repairing any answer field.
The predictions fingerprint matches the supplied sealed digest. The correction and proof sidecar are retained. No external calendar was contacted to verify the timestamp chain.

## Doubts considered and dismissed
- A P3 hit without qualifying cases proves error reduction. It is a vacuous conditional hit and provides no such evidence.
- This addition can replace the strong-model tie. The original comparison remains the headline.
- Missing or invalid replies can be omitted. All 48 records per arm remain in the unchanged scorer; coverage and invalid counts are reported separately.
- An interrupted test proves its predictions. Incomplete status is kept beside any mechanically calculated hit or miss.
