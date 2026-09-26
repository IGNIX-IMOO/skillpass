# TapeOut X Layer External Parameters

Observed from the TapeOut X Layer creation page on 2026-09-23.

## Chain

| Item | Value |
| --- | --- |
| Network | X Layer |
| Chain ID | 196 |
| Native/fee asset | OKB |
| UI status | X Layer testing phase |
| Audit status | Contracts are not sealed and have not passed an independent audit |

## Processor Creation

| Item | Value |
| --- | --- |
| Creation fee | 0.0066 OKB, read from the chain before sending |
| Minimum transistor supply | 10,000 |
| Suggested minimum mint price | 0.000066 OKB per transistor |
| Revenue recipient | The connected deployment wallet, claimed from the Processor page |
| Supply mutability | Immutable after creation |
| Unit-price mutability | Immutable after creation |
| Share-rule mutability | Immutable after creation |

## Draft Values

The values in `processor-config.draft.json` are recommendations. They must not
be treated as final until the operator confirms them immediately before the
wallet transaction.

## Circuit Execution

Observed from the TapeOut project page and official whitepaper:

| Item | Value |
| --- | --- |
| Combinational call | `eval(uint256 circuitId, bytes input) returns (bytes output)` |
| Combinational selector | `0x934d06ea` |
| Sequential call | `step(uint256 circuitId, bytes stateIn, bytes input) returns (bytes stateOut, bytes output)` |
| Sequential selector | `0xe8281a1a` |
| Call type | Read-only `view`; no transaction and no wallet required |
| Bit order | Inputs and outputs are packed as bytes in little-endian order |
| Sequential state | Caller supplies `stateIn` and must persist returned `stateOut` |
| Circuit state | A Circuit cannot persist state writes |
| Contract calls | A Circuit cannot call another contract |
| X Layer child circuits | Already-taped X Layer Circuits cannot currently be placed back on the canvas |
| X Layer composition | A graph referencing child Circuits cannot currently be taped out to X Layer |

### BLIF Import

Current TapeOut canvas rules:

| Item | Value |
| --- | --- |
| Models | One `.model` only |
| Supported statements | `.names`, `.latch`, metadata, `.end` |
| Latch syntax | `.latch input output [re|fe] [clock] [init]` |
| Latch type | Edge-triggered only when a type is provided |
| Initial state | Always `0` on chain |
| Initial value `1` | Not supported |
| Clock domains | One implicit clock domain |
| `.names` inputs | Maximum 8 |
| `.names` cubes | Maximum 512 |

These limitations must be reflected in the product and may change only after
new official confirmation.

## Live Verification

Verified on 2026-09-23 against:

`0x0dba1bcb8abdc1be2a0a2f9d9ddc745f32297239`

- `eval` reverted on a sequential Circuit with `has latch: use step`;
- `step(uint256,bytes,bytes)` executed successfully;
- the first argument is the current state and the second argument is the input;
- the first returned `bytes` value is `stateOut`;
- the second returned `bytes` value is the current output;
- `0x01` addresses the least-significant input bit and `0x02` the next bit.

Detailed evidence: `docs/P0_TAPEOUT_TECHNICAL_VERIFICATION.md`.
