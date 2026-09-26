# Key Custody Parameter Simulation

This workspace evaluates the V1 key-custody defaults without touching production
contracts or wallets.

Run:

```bash
node runtime/key-custody-sim/simulate.mjs
```

The simulation covers:

- committee capture under different colluding-node shares;
- threshold availability under different node uptime rates;
- effective-stake loss after project-token price shocks;
- buyout fee distribution;
- storage-reserve coverage;
- coalition stake cost versus asset value.

The output is deterministic JSON so the same inputs produce the same result.
