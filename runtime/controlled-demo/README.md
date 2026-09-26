# Controlled Demo Agents

This reference flow proves role separation without claiming that two independent
market participants already exist.

```text
Operator
  -> Agent A: CREATOR / OWNER
  -> Agent B: LICENSEE / BUYER
  -> IMOO: SERVICE OPERATOR
```

The agents have separate protocol IDs and state, but the same operator controls
the demo. Both are explicitly marked `controlled_demo=true`.

Run the full reference flow:

```bash
node run-flow.mjs
```

Run assertions:

```bash
node verify.mjs
```

This directory does not store private keys, seed phrases, model keys, or user
data. Chain and OKX.AI adapters are intentionally represented by local ports
until the Processor and Skill Gate Circuit are deployed.
