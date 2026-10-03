# Source notice
Derived benchmark content comes from It Quoted the Failure: Benchmark Evidence:
https://www.kaggle.com/datasets/iswt42/it-quoted-the-failure-evidence

The supplied dataset metadata lists CC BY 4.0. The derivation separates command steps, replaces outcome-bearing IDs with neutral IDs, strips scoring fields, and extracts historical model replies from counted runs. It preserves exact log and reply text.

The five original files from the dataset are in inputs/, byte for byte, with their SHA-256 hashes in inputs.sha256, so npm run prepare:data can rebuild the sanitized records. They are already public on Kaggle under CC BY 4.0. Sanity uploads contain only the sanitized export, and the model reads only sanitized records, one at a time, through Sanity Context.

The application code is under the MIT licence (see LICENSE). The 48 logs and the historical model replies come from the dataset "It Quoted the Failure: Benchmark Evidence" by Joshua Bauer (ISWT42), CC BY 4.0, https://www.kaggle.com/datasets/iswt42/it-quoted-the-failure-evidence.

## Doubts considered and dismissed
- A source licence also licences the new application. They are separate choices.
- A public archive can be uploaded unchanged. This archive includes hidden scoring fields and task definitions.
