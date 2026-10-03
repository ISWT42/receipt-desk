# Receipt Desk
A challenge candidate prepared for local review. Public production content, the checked Studio deployment, live Context, and the paired model comparison are complete. The overall entry remains partial: human acceptance, final public links, and Knowledge Base source and issue review remain pending. Use Node 22 or later and the already installed Codex command signed in with ChatGPT. No paid API is used.

## Main model route
The app retrieves a complete record through hosted Sanity Context, verifies its original line digest, and supplies that record to gpt-6.1-sol. The model has no environment, receives no dynamic tools, and loads no local instruction files. It uses AI-PROMPT.txt and app/answer-schema.json. It receives no deterministic verdict or historical model claim.

The Context query is chosen by the application before inference. This is not model-selected MCP tool calling. The original synthetic dynamic-tool check failed; the synthetic text-only check passed. Both receipts are retained.

With the configured schema, Context endpoint, and organization Context Viewer token, and approval for a fresh run:
```powershell
$env:RECEIPT_DESK_ALLOW_CONTEXT='yes'
$env:RECEIPT_DESK_ALLOW_MODEL='yes'
node --env-file=.env app/scripts/ask.mjs record-07af27f46aa2
```
ask retrieves historical claims after inference and presents conflicts beside the model's receipt. It never supplies those claims as evidence for the scored status.

## Core comparison
AI-EVAL-PLAN.md fixes one raw arm and one Context arm, with 48 fresh sessions each, the same prompt, the same model, and high reasoning effort:
```powershell
$env:RECEIPT_DESK_ALLOW_MODEL='yes'
node app/scripts/model-evaluate.mjs --arm raw
$env:RECEIPT_DESK_ALLOW_CONTEXT='yes'
node --env-file=.env app/scripts/model-evaluate.mjs --arm context
node app/scripts/score-model.mjs results/model-raw-RUN_STAMP results/model-context-RUN_STAMP
```
Use the actual retained run paths for scoring. Only score-model.mjs loads local labels. It verifies that both arms used the same frozen prompt, model code, response format, inputs, and scorer. Model outputs are not repaired after inference. No scores are inspected between arms.

A copied receipt and a correct status are separate counts. The original scorer requires canonical final-check output for done or failed, exact source and step identity, and complete supplied-record coverage. A constant status scores zero.


Both model arms completed all 48 cases, and the unchanged scorer scored them together in results/model-pair-2026-10-02T23-55-00-823Z. Each arm has 48/48 correct statuses, zero false done on failed or missing checks, 46/48 credited receipts, and receipt score 0.87890625. The same two real checkout test lines on line 7 missed the fixed final-summary criterion on line 8. This is a tie, with no demonstrated accuracy gain. No answer or scorer was repaired.

The first KB build and all nine owner-reported conflict issues remain unchanged. Selected entry reads succeeded, but one generated reply count failed source verification, 57 versus 54. See the protocol notes and KB-QUALITY-FINDING-2026-10-03.md before any proposed issue or rebuild action. None of that generated content entered the model inputs.

## Content and diagnostics
The original five public source files are required only for local preparation and scoring. They are not shipped to the runtime or repository export. Download source material separately and keep labels local.

```powershell
node app/scripts/prepare.mjs
node app/scripts/prepare-public.mjs
node app/scripts/check.mjs
node app/scripts/evaluate.mjs
node app/scripts/demo.mjs results/local-2026-10-02T19-47-56-993Z
node app/scripts/ui-check.mjs
```
prepare verifies input and archived-run hashes, reads the archive in memory, and never executes archived code. Changed generated snapshots are not overwritten.

public/demo.html is the offline diagnostic viewer. It opens without a login, server, remote script, or network access. It shows deterministic policies and historical claims. The separate recorded same-model viewer is public/model-demo-2026-10-02T21-18-17-071Z-paired.html. It contains all 96 retained answers, exact copied evidence, per-case credit, and miss filters. The owner chose local review. The UI check uses installed Microsoft Edge headlessly and closes it.

The bounded policy MCP server in app/mcp-server.mjs remains a separate diagnostic. Its assess_record tool supplies a deterministic verdict. Do not use it as the evidence tool for the main model comparison.

## Upload, schema, and Context
Follow JOSHUA-STEPS.md. The confirmed project is ixoe9uvf, with public dataset production.
```powershell
node --env-file=.env app/scripts/upload.mjs
$env:RECEIPT_DESK_ALLOW_UPLOAD='yes'
node --env-file=.env app/scripts/upload.mjs --send
node app/scripts/verify-dataset.mjs
$env:RECEIPT_DESK_ALLOW_SCHEMA='yes'
node --env-file=.env app/scripts/deploy-schema.mjs
```
The uploader uses create-if-absent mutations. The active snapshot has root IDs without dots. Earlier dotted-ID copies remain preserved. Use the configured root-path filter for the 96-document Context and Knowledge Base source.

Tokens stay in runtime environment values: SANITY_WRITE_TOKEN for upload, SANITY_SCHEMA_TOKEN with Developer permission for schema, and SANITY_CONTEXT_TOKEN with organization Context Viewer permission. Never open, print, copy, or commit .env.

After read approval:
```powershell
$env:RECEIPT_DESK_ALLOW_CONTEXT='yes'
node --env-file=.env app/scripts/context-check.mjs record-07af27f46aa2
node --env-file=.env app/scripts/evaluate.mjs --context
```
The latter is the deterministic live-retrieval diagnostic, not the main AI comparison. Retrieval failures earn no engineering verdict. Neither the agent nor the Context model arm falls back to local source records.

## Review and export
The approved 30-file Studio is deployed at https://receipt-desk-ixoe9uvf.sanity.studio. The recorded viewer stays local by owner choice. No repository push, recorded-viewer publication, DEV post, optional external seal, new sign-in, or Knowledge Base write has been performed. The original corpus was visible during implementation. These are development results, not a blinded holdout.

The portable review export excludes app/scripts/deploy-studio-checked.mjs and app/scripts/publish-recorded-viewer.mjs because they contain this computer's absolute task paths. Their checked originals remain in the local task folder. This exclusion changes no runtime answer, test, scorer, deployed bytes, or owner publication decision.

Source: [It Quoted the Failure: Benchmark Evidence](https://www.kaggle.com/datasets/iswt42/it-quoted-the-failure-evidence), CC BY 4.0.

## Doubts considered and dismissed
- An existing ChatGPT plan is a paid API permission. It is the authorized plan route, with no API fallback.
- The deterministic MCP tool can prove model quality. Its verdict is excluded from the scored model inputs.
- A recorded public viewer supports arbitrary new questions. It replays retained cases; fresh answers require the user's own approved plan and local Context credentials.
