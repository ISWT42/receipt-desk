# Weaker-model preparation protocol

Status: partial. Written before any weaker-model inference. The owner's approved test is a separate pre-registered addition. The GPT-6.1 tie remains the headline.

## Immutable predictions

PREDICTIONS-WEAKER-MODELS.md must retain SHA-256 a72239f4cafe21e9402fbbc1dd161875548f0f6f20f64c56e2c4b3155f93409f. PREDICTIONS-WEAKER-MODELS-CORRECTION.md corrects the stated approval time. Neither file is edited. The OpenTimestamps sidecar is preserved locally; presence and its fingerprint are checked without contacting a calendar. External timestamp verification has not been performed.

## Frozen evidence

Reuse the original AI-PROMPT.txt, app/answer-schema.json, modelEvidence and modelPrompt functions, source records, questions, and app/lib/score.mjs. Verify all nine original frozen hashes. Prepare 48 raw prompt files from the approved public snapshot. Retrieve all 48 Context records through the existing read-only endpoint, require complete canonical arrays and exact original source digests, and prepare 48 Context prompt files. Compare every prompt byte string with the corresponding original GPT-6.1 input. Both weaker models receive these same prepared files. No local fallback, historical reply, KB entry, issue, protocol note, or answer label enters inference.

The first KB build and all nine owner-reported issues remain unchanged. The existing handling notes and numeric finding stay outside every model prompt. No issue action, purpose change, or rebuild is authorized.

## Broker route and budget gate

Only google/gemini-3.7-flash and openai/gpt-5.4-nano are approved, using the owner's broker, provider openrouter, and lane sanity-weak. Never open the broker or its files. No other model, service, sign-in, or paid route is approved.

The total budget is 2 USD. Stop all paid calls at that cap or broker exit code 5. Before paid inference, confirm how the approved invocation enforces the hard cap, including a request that could cross it. No paid call is authorized outside that limit. Budget confirmation remains pending at preparation.

The approved CLI has prompt-file and optional system-file arguments. Codex supplied the frozen response schema through a separate response-schema channel. Confirm how the broker receives that unchanged schema, or obtain approval for a separately generated system-file copy containing the original prompt and unchanged schema. Do not modify either frozen source. No schema or prompt transport decision is inferred from elapsed time.

## Run and score

Fixed order: Gemini raw, Gemini Context, nano raw, nano Context. One invocation per record, in neutral-ID order. No tools, no conversation history supplied by the controller, provider default sampling, no selective retry. Retain every reply and failed attempt. Complete all four attempted arms before inspecting scores. More than four missing or invalid replies makes an arm incomplete. A budget stop or broker exit code 5 ends the entire test. Mark unattempted records as missing for the unchanged scorer, while reporting incomplete coverage separately.

A new reporting wrapper may call the original score() function because the existing ChatGPT report wrapper hard-codes the provider and writes the existing headline summary. Do not edit either scorer or the original report wrapper. The broker results need their own provider and budget receipts.

P1 and P2 use their stated class thresholds. P3 checks every qualifying model with at least two raw false done across both negative classes, requiring Context false done <= raw false done / 2. If no model qualifies, report hit by the conditional rule with zero qualifying models, explicitly a vacuous hit that does not demonstrate error reduction. P4 and P5 require both models to meet their respective non-decrease conditions. Publish per-model comparisons beside the overall hit or miss. Incomplete coverage is not silently treated as a completed test or as a falsified prediction.

## Completion check

Expected proving lines after successful inference and scoring:
- WEAKER MODEL TEST COMPLETE: 192 retained attempts; four 48-record arms; no selective retries.
- WEAKER MODEL COMPARISONS SCORED: two model pairs; unchanged scorer; P1 to P5 assessed.
- WEAKER MODEL BUDGET VERIFIED: total reported USD <= 2; broker exit code 5 stops further calls.

These are expected checks, not results.

## Doubts considered and dismissed

- A supplied fingerprint verifies an external timestamp. It verifies current bytes. Calendar-chain verification was not performed.
- Equal prompt filenames establish equal model input. Every generated prompt is compared with the original prompt string and fingerprint.
- A later schema transport adjustment can be hidden. Record it before the first paid case, and report it as a limitation.
- A conditional P3 hit establishes an accuracy gain without qualifying cases. A vacuous hit is explicitly labelled and provides no such evidence.
