# Weaker-model test stopped for cost metadata

Status: partial. One Gemini raw call was completed and retained. The remaining 191 calls have not been sent. No model scores or P1-to-P5 results have been read. The first call will not be retried.

The broker returned exit code 0 and "[broker] OK". Its usage line reports 1078 input, 565 output, and 295 reasoning tokens, followed by "cost estimate unknown". No numeric costUsd was returned.

"WEAKER MODEL TEST INCOMPLETE: 1/192 attempts; BROKER_COST_UNKNOWN."

The printed returned-cost total of 0 is not a claim of a free request. Actual charge is unknown. The pre-call worst-case reservation was 0.020922 USD under the owner-supplied prices and 4000-output-token cap.

A tested proposed alternative uses the owner's list prices and reported usage, counting reasoning in addition to output even if already included. For this returned receipt the conservative bound is 0.0040335 USD. It is an upper bound, not an actual costUsd receipt. Approval of that accounting mode remains pending. The two candidate accounting tests passed.

The response schema copy was explicitly approved before the first call. Both frozen source files remain unchanged. All 96 user-evidence prompts match the GPT-6.1 arms. The first broker attempt, stopped batch, startup dependency failure, and earlier file snapshots remain unchanged. No broker or ledger file was opened. No credit or key-limit error was observed in this first returned receipt.

The original GPT-6.1 tie remains the headline. The post now begins with the Knowledge Base offering to make the models' claim standing truth. The paired recorded viewer remains local by owner choice. All nine KB issues and its first build remain unchanged.

## Doubts considered and dismissed

- A reported total of 0 proves a free call. The broker returned no numeric cost. Actual charge is unknown.
- Preparation establishes a completed weaker-model test. Only 1 of 192 calls has run.
- An accounting repair permits a repeat of the first case. That reply stays retained, and continuation can only use unattempted cases.
- The token-price calculation is verified billing. It is a conservative estimate using the owner's supplied prices.
