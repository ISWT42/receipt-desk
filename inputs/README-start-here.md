# How to verify "It Quoted the Failure"

This dataset holds the receipts for the DEV post "It Quoted the Failure: Two Kinds of False 'Done'", written for the Kaggle Benchmarking Challenge (October 2026).

It supports three kinds of check:
- **checked by `check-everything.py`**, the script in this dataset;
- **checked by you, by hand**: recounting the results;
- **outside checks**: the Bitcoin timestamps, and Kaggle's own records.

## Files

| File | What it is |
| --- | --- |
| `sealed-manifest.json` | The sealed manifest: 32 hashed items |
| `sealed-manifest.json.ots` | OpenTimestamps proof for the manifest |
| `sealed-predictions.md` | The sealed predictions, run plan, title rules and both possible opening paragraphs |
| `sealed-predictions-addendum.md` | Sealed predictions for the two larger models and GPT-6.1 |
| `sealed-predictions-addendum.md.ots` | Its proof |
| The six `task-...py` files | The four sealed task files (the logs, prompts and scorer are inside each), the two unsealed copies with a 16,000-token output cap, and `cap16k.diff` |
| `the-48-logs.jsonl` | The 48 logs |
| `prompts-T1-plain-report.json` to `T4.json` | The 48 prompts each arm sends, in case order |
| `kaggle-runs.zip` | The 58 run files of these six tasks, as downloaded from Kaggle |
| `run-list.csv` | Each run: task, version, model, run ID, start time, counted or not, and the SHA-256 of its file |
| `analysis-results.txt` | The analysis output the post quotes |
| `check-everything.py` | The checks below (Python 3, standard library only); it exits 1 if any check fails |
| `recount-the-numbers.py` | Recounts the post's Kaggle numbers from the run files with the scorer printed in the task file |
| `statistics-paired-tests.py` | Not sealed, exploratory: every paired exact McNemar test (3 measures, 6 prompt pairs, 4 models) with Holm's correction; run `python statistics-paired-tests.py .` |
| `statistics-more.py` | Not sealed, exploratory: exact intervals, Cochran's Q, the task-form Fisher test, run agreement, the 13-scenario check and bootstrap intervals; run `python statistics-more.py .` |

## 1. Checked by check-everything.py

Run `python check-everything.py` in this folder. On the published files it prints 84 passing checks and 15 private items, and no failures.

- **The two stamped files.** The manifest's SHA-256 is `3928d5249adb224ec621d8dad757ac623421c1eaa65f58be4f960beec6b96553`. The addendum's is `9cf308ce46d4aad0149d7c387488ddbaf209641d7950b84c0cb1225339064fb8`.
- **Every manifest item this dataset contains:**
  - the four sealed task files, the logs file and the predictions file;
  - the predictions block and its four marked sections;
  - the four rendered-prompt digests, recomputed from the four `prompts-...json` files;
  - the run plan and stop-time values.

  Item hashes are SHA-256 after Windows line endings (CRLF) are turned into LF. A prompt digest is SHA-256 over the arm's 48 prompts in case order, each followed by one zero byte. A value's hash is SHA-256 of compact JSON with sorted keys.
- **The two capped copies.** Undo their three documented edits (a two-line header, the task names, the 16,000-token cap) and the sealed T1 and T3 files come back exactly.
- **The run list and the zip:**
  - the paths are relative and safe;
  - no run ID or file appears twice;
  - `kaggle-runs.zip` holds exactly the listed files.
- **Each of the 58 run files:**
  - its hash matches the run list;
  - its recorded task, version, model, run ID and start time match the run list;
  - its recorded task definition appears in the task file;
  - it sent only sealed prompts of its arm, each log answered at most once, with no empty prompts.
- **Which runs count.** These are recomputed from the sealed run plan: the first 3 usable runs per model and arm (6 for GPT-5.4 nano on T2 and T4), started before the stop time. A run is usable when at most 3 of its 48 logs got no reply and every prompt is sealed. The result must match the run list: 54 counted runs. The other 4 rows are single runs of the two larger models on the capped copies, which the sealed run plan never counts.

## 2. Recounted by recount-the-numbers.py, and by you if you like

- **The counts.** `python recount-the-numbers.py` scores every counted reply with the scorer printed in the task file, then applies the sealed counting rules (`sealed-predictions.md`, "What is counted"). It prints for every arm and model:
  - failed-check, never-ran and passed "done" scenarios, on the 16 and the 13;
  - the mean receipt score;
  - how many T1 failed-check "done" replies cite a failing line.
- It uses none of the private analysis code. It loads the task file with a stand-in for Kaggle's library, so nothing is sent anywhere.
- On these files its output matches `analysis-results.txt` and every count in the post, including 35 of 35 for the citation rule.
- You can also score replies by hand: the scorer is the `score` function in each task file.

## 3. Outside checks

- **The timestamps.** Check each `.ots` file against its file at opentimestamps.org, or with `ots verify` and a Bitcoin node.
  - The manifest is in block 969401 (about 05:50 UTC on 1 October 2026), the addendum in block 969403 (about 06:02 UTC).
  - The first counted run started at 07:09:21 UTC. Miners set block times, so they are approximate; the gap is over an hour.
- **Kaggle's records.** The run files are copies of what Kaggle returned. `check-everything.py` checks that they agree with each other and with the sealed files, not that Kaggle produced them. The public benchmark and task pages on Kaggle are the outside reference.

## Not included

The manifest also hashes items that stay private:
- the source modules the task files were generated from;
- the dry-run harness and the analysis script;
- the seal tool;
- the design notes.

`check-everything.py` lists all 15 as private. The checks above do not need them.

GPT-6.1 was run off Kaggle, through an API and through Codex, so its replies are not among these run files. Those replies are not included.

## What no check can show

A timestamp proves a file existed by that block. It cannot prove that no other version was sealed and set aside.
- For the triplet benchmark's predictions I made one seal and one addendum. That is my statement; no proof can show it.
- Earlier tests for this entry, a persona test and a value test, had their own sealed predictions, stamped on 29 September in block 969217. Their results are not part of this post.

Joshua Bauer / ISWT42


## File names

The files here carry plain names. Sealed files are byte-for-byte the sealed originals, so their hashes and Bitcoin proofs match; their text may still use the original names. Kaggle task names cannot change without losing their counted runs, so they keep their original names:

- `task-T1-plain-report.py` is the Kaggle task `receipt-triplets-t1-report-bare`
- `task-T2-with-definitions.py` is the Kaggle task `receipt-triplets-t2-report-defs`
- `task-T3-do-the-work.py` is the Kaggle task `receipt-triplets-t3-do-bare`
- `task-T4-with-proof-sentence.py` is the Kaggle task `receipt-triplets-t4-report-proof`
- `task-T1-plain-report-capped.py` is the Kaggle task `receipt-triplets-t1-report-bare-cap16k`
- `task-T3-do-the-work-capped.py` is the Kaggle task `receipt-triplets-t3-do-bare-cap16k`
- `sealed-manifest.json` was `SEAL-MANIFEST-2026-10-01.json`; `sealed-predictions.md` was `TRIPLETS-PREDICTIONS.md`; `sealed-predictions-addendum.md` was `TRIPLETS-PREDICTIONS-ADDENDUM-2026-10-01.md`; `the-48-logs.jsonl` was `data/triplet_cases.jsonl`.
- On Kaggle, `kaggle-runs.zip` appears unpacked as the `kaggle-runs` folder, so you can open each run file there. `check-everything.py` and `recount-the-numbers.py` read either form.
