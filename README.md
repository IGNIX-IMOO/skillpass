# SkillPass

Agent Commerce IP Core library for SkillPass, TapeOut, X Layer, and OKX.AI.

Live competition build:

```text
https://1-2-223.tapekit.org/
```

## Position

```text
Vision: IGNIX Agent Economy
Protocol: Agent Company Protocol
Product: SkillPass
Category: Agent Commerce IP Core Library
Processor: Agent Standard Cells
Symbol: ACELL
```

SkillPass is not another Agent service marketplace. OKX.AI remains the
commercial Service layer for work requests and service delivery. SkillPass
handles Skill and knowledge asset ownership sales directly on its own station.
TapeOut remains the on-chain manufacturing and Circuit layer.

## V1 Cores

### Skill Gate Core

Checks whether a Skill, License, and Service are valid. It returns:

```text
allow
route_id[3:0]
royalty_bucket[1:0]
```

Canvas verification:

```text
9 inputs / 7 outputs
62 NAND
434 bytes
```

### License Quota Core

Receives the current quota and a consume request. It returns the current
decision and `stateOut`. The Trust Registry must persist `stateOut`.

Canvas verification:

```text
3 inputs / 7 outputs
108 NAND + 4 LATCH
772 bytes
```

## Repository

Public source and competition materials:

`https://github.com/IGNIX-IMOO/skillpass`

GitHub Pages:

`https://ignix-imoo.github.io/skillpass/`

Public demo video and release:

`https://github.com/IGNIX-IMOO/skillpass/releases/tag/competition-demo-v2`

## Repository Layout

```text
docs/
  AGENT_COMPANY_PROTOCOL_V1.md
  AGENT_STANDARD_CELL_LIBRARY_V1.md
  SKILLPASS_PRODUCT_V1.md
  SKILL_ASSET_ENCRYPTION_V1.md
  KEY_CUSTODY_NETWORK_V1.md
  KEY_CUSTODY_PARAMETERS_V1.md
  KEY_CUSTODY_PARAMETER_STRESS_TEST_V1.md
  COMPETITION_DEMO_V1.md
  COMPETITION_IMPLEMENTATION_V1.md
  COMPETITION_DEPLOYMENT_V1.md
  COMPETITION_RECORDING_PLAN_V1.md
  POST_COMPETITION_ROADMAP.md
  P0_TAPEOUT_TECHNICAL_VERIFICATION.md
hackathons/tapeout-xlayer-2026/
  circuits/
  submission/
  processor-config.draft.json
runtime/
  controlled-demo/  SkillPass reference flow without external Agent dependencies
  key-custody-sim/  Deterministic parameter and attack stress tests
  ownership-demo/   Local competition order state machine and verification
  tapeout/          BLIF compiler and netlist verification
app/                React control room and local reference Trust Registry
contracts/          X Layer TrustRegistry contract, compiler, and tests
```

## Verify

```bash
cd hackathons/tapeout-xlayer-2026/circuits/skill-gate
node verify.mjs

cd ../license-quota-step
node verify.mjs

cd ../../../runtime/controlled-demo
node verify.mjs

cd ../tapeout
node verify.mjs

cd ../key-custody-sim
node simulate.mjs

cd ../ownership-demo
node build-package.mjs
node verify-package.mjs
node verify-node-service.mjs
node verify.mjs

cd ../../app
npm install
npm run build
npm run test:e2e
npm run verify:onchain   # read-only: proves both Circuits answer on X Layer

cd ../contracts
npm install
npm run build
npm test
```

## Publish to the circuit container

Circuit #1 on X Layer (processor #223) owns a TapeOut container at
`0xfdBa7FeDeD2A665B3c7601bEf8CDDDAF162E1836`. Files written under that
container are served as a website with no server and no DNS, addressed as
`1.2.223.tape` (`<#ID>.<area>.<processor>.tape`, X Layer area code 2).

```bash
cd app
npm run build:public        # static bundle that lands on #/demo, plus per-file SHA-256
node scripts/publish-onchain.mjs \
  --container 0xfdBa7FeDeD2A665B3c7601bEf8CDDDAF162E1836 \
  --from      0x60fda8130b7341027147a1b88cd4c2a1af44ecd0 \
  --dry-run                 # drop --dry-run to send
```

`build:public` differs from `build` in one way: an empty hash lands on `#/demo`
instead of the Control Room, because the Control Room reads a local registry
bridge that does not exist on chain.

`publish-onchain.mjs` splits each file into 24,000-byte chunks, writes the
first with `putFile` and the rest with `appendChunk`, verifies size and hash
after every file, and resumes from the on-chain chunk count so a retry never
double-appends. Signing goes through the `onchainos` wallet CLI.

Display is gated by a separate activation payment: the official gateway only
shows containers that have paid through `DomainBinding`. This container is
paid up to 2026-12-23.

Start the local control room:

```bash
cd app
npm run dev -- --host 127.0.0.1 --port 4174
```

Open `http://127.0.0.1:4174/`.

Public repository:

`https://github.com/IGNIX-IMOO/skillpass`

GitHub account access is active, the repository is public, and Actions is
enabled. The on-chain demo below remains the primary judge-facing deployment.

**On-chain public demo (live):**

`https://1-2-223.tapekit.org/#/demo`

This one does not depend on GitHub Pages. The same static bundle is stored
byte for byte in the container of circuit #1 on X Layer, and Tapekit reads it
straight from the chain, verifying every file against the SHA-256 declared on
chain. See "Publish to the circuit container" below.

The published bundle carries two pages, and only two, because those are the
only ones that work without a registry bridge:

| Route | What it is |
| --- | --- |
| `#/demo` | One real task traced end to end, read from X Layer |
| `#/verify` | Paste any Passport / License / Service / Receipt id and read its on-chain record |

The Control Room pages stay in the local console, where the bridge exists.

The development server uses the X Layer registry bridge by default. It requires
`onchainos` to be installed and signed in as the IMOO controller account.
The Research-to-Story service reads the existing local DeepSeek provider config
from `~/IMOO/IMOO-Agent-Data/provider.json` unless
`IMOO_PROVIDER_CONFIG_PATH` is set.

For an offline UI-only fallback:

```bash
SKILLPASS_REGISTRY_MODE=local npm run dev -- --host 127.0.0.1 --port 4174
```

No wallet, private key, model key, Telegram session, private memory, or user
data belongs in this repository.
