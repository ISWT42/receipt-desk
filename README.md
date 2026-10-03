# Receipt Desk

**Show me the line, or it isn't done.**

Receipt Desk is a status desk that won't take an AI agent's word for "done". Ask it whether a piece of engineering work is done, and it answers one of three things: **done, failed, or not shown**. Every answer comes with the command step, the exact output line it copied, and a link back to the original record. It reads that record through [Sanity Context](https://www.sanity.io/docs/ai/sanity-context), never from the agent's own account.

It's part of my method, **The Watched Check**: watch the check, not the agent's account of it.

By Joshua Bauer (ISWT42). Built for the DEV Sanity Challenge, Path One, in October 2026.

## Try it

- **The recorded demo:** open `docs/index.html`, or the GitHub Pages copy of it. It replays the GPT-6.1 comparison, 48 answers from raw logs and 48 through Context, with every copied receipt, its credit, and filters for the misses. It makes no network calls and no model requests.
- **The write-up:** the DEV post for this entry. It holds the full results, the two hits and three misses of my sealed predictions, and the Knowledge Base finding.

## What I found, in short

- **GPT-6.1 tied:** 48 of 48 correct statuses both from raw logs and through Sanity Context, with a receipt score of 0.87890625 in both arms.
- **Two weaker models, Gemini 3.7 Flash and GPT-5.4 nano,** made very few false "done" at this desk, and Context didn't reduce them further. It did help nano cite the right line: its credited receipts rose from 24 of 48 to 32 of 48. My five sealed predictions scored two hits and three misses, all reported in `WEAKER-MODEL-REPORT.md`.
- **Sanity's Knowledge Base** flagged two separate records as one "conflict", and offered to settle it by making the models' claim the standing truth. I left it untouched. The details are in `KB-QUALITY-FINDING-2026-10-03.md`.

## Run it yourself

You need Node 22 or newer.

```
npm ci
npm run prepare:data     # rebuilds the sanitized records from inputs/ (checked against inputs.sha256)
npm run check            # the deterministic policy and the scorer
node --test app/tests    # unit tests
npm run build            # the Sanity Studio, built locally
```

- `inputs/` holds the five original files from my dataset, byte for byte. They are [It Quoted the Failure: Benchmark Evidence](https://www.kaggle.com/datasets/iswt42/it-quoted-the-failure-evidence), CC BY 4.0. The model never sees them: it reads only the sanitized records, one at a time, through Context.
- **Live runs need your own setup:** your own Sanity project, Context access and a model service. Their tokens go in a local `.env` file, which git ignores. The scripts that use one are `upload`, `schema:deploy`, `model:context` and `ask`.

## What's here

| Path | What it is |
| --- | --- |
| `app/` | The schema, content builder, Context adapters, model harness, scorer and tests |
| `results/` | Every retained run: answers, grades, receipts and checks |
| `weaker-preparation/` | The frozen inputs and receipts for the weaker-model test |
| `PREDICTIONS-WEAKER-MODELS.md` and its `.ots` | My predictions, sealed with OpenTimestamps before the weaker-model calls, plus a dated time correction in a separate file |
| `*-PROTOCOL-*`, `*-FINDING-*`, `*-NOTE-*` | Dated notes, written before the runs they govern |
| `docs/` | The recorded demo |
| `public/` | The sanitized content and earlier viewers |

The sealed file's SHA-256 is `a72239f4cafe21e9402fbbc1dd161875548f0f6f20f64c56e2c4b3155f93409f`. You can check it with `sha256sum PREDICTIONS-WEAKER-MODELS.md`, and check the timestamp with `ots verify`.

## Limits

- This is a known development set of 48 logs, not a blind holdout.
- Each arm ran once, the raw arm first, and backend changes or sampling could change another run.
- The weaker-model costs are an upper bound, because the broker reported tokens, not charges.
- The comparison with my earlier benchmark is exploratory: the prompts and counting differ.

## Licence

The code is under the MIT licence; see `LICENSE`. The data comes from my dataset under CC BY 4.0; see `SOURCE-NOTICE.md`.
