# Local evaluation

Provider: local fixtures. AI harness: not run. No seal.

| System | Correct | False done, failed | False done, not shown | Receipt score |
| --- | --- | --- | --- | --- |
| structured | 48/48 | 0/16 | 0/16 | 1.000000 |
| keyword | 17/48 | 15/16 | 15/16 | 0.000000 |
| orderedRaw | 48/48 | 0/16 | 0/16 | 1.000000 |

Receipt factors are supportedByClass divided by classTotals in summary.json.
Per-record status and source receipts are in each prediction file. Misses and hits are in each case-scores file.
The keyword baseline is deliberately simple. The ordered raw comparator is the identical policy after text parsing.
These are development-corpus results. They do not show generalization or an independent AI result.

## Doubts considered and dismissed
- Local fixtures might be mistaken for Context. The provider is printed above and stored in the manifest.
- A constant cautious answer might score well. Each receipt factor is required, so a constant status scores zero.
