# Receipt Desk design
Updated 2 October 2026. Public content is verified; the live Context path is pending setup.

## Job
Give done, failed, or not shown for the requested engineering outcome. Attach the command step, an exact output line, neutral document identity, and source links. Not shown concerns the supplied record only.

## Content
The source is It Quoted the Failure: Benchmark Evidence, CC BY 4.0. The builder verifies the five input hashes and the archived run hashes, reads archived JSON as data, and never executes archived code. Only public questions, original log lines, and historical assistant reply text enter Sanity.

The indexed source has 48 root-level records and 48 referenced claim bundles, or 96 documents within the 150-document Knowledge Base limit. Ordered steps preserve every original line number. The source filter includes only root IDs of these two types. Earlier dotted-ID copies remain preserved and excluded.

Scoring labels stay local. Neutral record IDs contain no outcome suffix. The model has no environment, loads no local instruction files, and receives one record at a time. The model controller never reads labels. Only the separate scorer does.

## Agent and main comparison
The application fetches the full step record through Sanity Context, verifies its source digest, and then asks gpt-6.1-sol on the existing ChatGPT plan. The model receives the evidence and the common status prompt. It does not receive a deterministic verdict or historical model claims.

The same model answers all 48 questions from numbered raw logs in one arm and from Context step records in the other. Each answer has a fresh ephemeral session with high reasoning effort. The original scorer stays fixed. No paid API or local evidence fallback is used in the Context arm.

This is application-orchestrated retrieval before inference. The model does not choose the GROQ query or call the MCP endpoint itself. The first synthetic dynamic-tool interface failed and is retained. The synthetic text-only interface passed.

Knowledge Base tools provide discovery and claim-conflict browsing as a separate path. Original records decide status; KB summaries and historical replies never establish completion. GROQ and Knowledge Base modes use separate endpoint URLs.

## Demo and evidence
public/demo.html is the existing offline diagnostic viewer. It shows deterministic policies and archived claims, opens without a login, and makes no network calls. It is not yet the recorded model-comparison viewer. The public Sanity documents can be read without a token.

The deterministic structured and ordered-raw controls both reach 48/48 on the known development corpus. The deliberately weak lexical baseline reaches 17/48. These remain diagnostics, not the headline AI comparison.

## Limits
The builder saw this corpus and its labels. One same-model run cannot establish generalization. No external seal is authorized. Equal model-arm results are a valid result. A public demo can replay retained model answers; running new model answers requires the user's own approved plan and local Context credentials. Public hosting and review remain owner actions.

## Doubts considered and dismissed
- Structure guarantees an accuracy gain. The raw arm may tie the Context arm, and that tie must be reported.
- A rule-based status can be copied by the model. The scored model inputs exclude it.
- A hosted data source proves the whole agent works. Live Context, Knowledge Base, model answers, and review each need separate receipts.
