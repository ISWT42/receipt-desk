# Same-model evaluation plan
Written before any scored model answer on 2 October 2026.

## Main comparison
Use gpt-6.1-sol on the owner's existing ChatGPT/Codex plan, with high reasoning effort and standard speed. No paid API fallback. One fresh ephemeral session per record, per arm. Complete all 48 records in neutral-ID order in the raw arm, then all 48 in the Context arm when its setup is ready. This order is fixed for practical setup reasons. It is not randomized.

Raw arm: original log lines, numbered one through lineCount, supplied as one text field.
Context arm: the application retrieves the complete step record through hosted Sanity Context, verifies the original line digest, and supplies its ordered commands and output lines to the model.
Both arms receive the identical question, identifiers, URLs, line count, AI-PROMPT.txt, response schema, model, and reasoning effort. No deterministic verdict, previous model reply, answer label, or outcome-bearing case ID is supplied. Raw logs are reconstructed losslessly from the sanitized source lines.

Context retrieval happens in the application before model inference. The model does not choose a Context query or call the MCP endpoint itself. Name this architecture in the post. Do not describe the failed dynamic-tool interface as a working tool-calling agent.

## Isolation
Every model session is ephemeral, has an empty environment list, loads no local instruction files, and receives no dynamic tools. The runtime disables shell, browser, apps, plugins, memories, hooks, unrelated MCP servers, and its code host for each invocation. The model receives only the single public evidence record and the common instructions. No global Codex setting is changed. The controller never loads local labels. Only the separate score-model.mjs process does.

The original synthetic dynamic-tool test failed. Preserve it. A separate synthetic text-interface test passed before this plan. Neither used a benchmark case.

## Scoring and failures
The existing app/lib/score.mjs stays unchanged. Score each arm against all 48 local labels after both arms complete. Publish correct counts by class, confusion matrices, false done on failed checks, false done on missing checks, supported receipt counts, and their product score. Show every answer and each receipt miss beside the hits.

Do not repair a status, copied line, or receipt after inference. Invalid model output earns no credit. Preserve failed attempts and stop on a setup or provider failure instead of silently switching services. An interrupted arm may resume only for records not yet attempted, using the identical frozen settings; attempted cases are not rerun to improve scores. Do not inspect interim scores or tune the prompt between arms.

The receipt score is the product of supported receipts in each of the three classes divided by that class's count. A constant status scores zero. It does not measure calibrated probability or prove evidence outside the supplied record.

## Scope and limits
The builder already saw and developed against this public corpus. This is a development-corpus comparison, not a blinded holdout. Each arm is run once. No external seal or timestamp is authorized. Model equality and settings are recorded, but backend revisions and stochastic variation remain possible. If both arms tie, report the tie. Structure and hosted retrieval do not by themselves establish an accuracy gain.

The weak lexical baseline and deterministic ordered-raw control remain separate diagnostics. They are not the headline same-model comparison. Knowledge Base retrieval and claim-against-record views are separate product checks; they do not supply clues to either scored model arm.

## Doubts considered and dismissed
- A rule-based verdict could masquerade as an AI result. No verdict-generating policy is imported into the model controller or evidence formatter.
- Local labels could reach the model through filesystem access. The model has no environment or source files, and the controller never reads labels.
- A strong raw model could erase the proposed accuracy gain. That is a valid outcome and will be reported.
- A Context outage could be hidden by local fallback. The Context arm stops and retains the failure.
