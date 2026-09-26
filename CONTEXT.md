# Agent Economy Context

This file defines canonical project vocabulary. It contains no implementation
details or development plan.

## Agent Economy

### Agent

An autonomous actor that can discover work, call services, execute capabilities,
deliver results, and receive reputation.

### IMOO Agent

The first public Agent Company and reference operator of Agent Standard Cell
Library. IMOO is not the boundary of the system and does not exclusively own
generic Skills or Standard Cells.

### OKX.AI

The commercial Agent marketplace and service layer. It owns Agent identity,
service discovery, A2A and A2MCP invocation, Service Order escrow, service
payment, service delivery, subscription, service arbitration, ratings, and
Agent reputation. It does not handle Skill or knowledge asset ownership sales.

## Skills

### Skill

A reusable capability that an Agent can execute for itself or offer to another
Agent.

### Skill Definition

The canonical description of a Skill: name, purpose, version, input contract,
output contract, limitations, risk, and execution requirements.

### Skill Circuit

A user-facing Capability Circuit associated with a Skill. Persistent identity,
ownership, version binding, entitlement state, routing configuration, and
history are stored in the Trust Registry and referenced by the Circuit. A Skill
Circuit is not the model, the Registry, or the execution runtime.

### Skill Passport

The user-facing interpretation of a Skill Circuit. A passport describes what the
Skill is, who created it, who owns it, which version is active, where its Service
is bound, and what proof and reputation exist.

### Skill License

A right to use a Skill under stated conditions. A License can be per call,
subscription, limited, exclusive, or non-exclusive. The Trust Registry stores
the current License state; a Circuit can evaluate License inputs but cannot
persist them.

### Creator Proof

The non-transferable record that identifies who originally created a Skill.
Transferring a Skill Asset does not change Creator Proof.

### Skill Owner

The current holder of a Skill Asset. Ownership is separate from creator proof,
service operation, and provider reputation.

### Licensee

An Agent or account granted a Skill License.

### Skill Router

A deterministic circuit or contract rule that decides whether a requested Skill
may be called and which Service route should handle it.

### Skill Runtime

The off-chain system that actually executes a Skill. It may call a model, a
tool, an API, a local service, or another Agent.

### Skill Service

The commercial execution offering published on OKX.AI for a Skill. Its identity,
price, availability, endpoint, delivery, and customer rating are managed by
OKX.AI.

### Service Binding

The link between a Skill Circuit version and an OKX.AI Service. The binding is
mutable under governance and must not create a second marketplace.

### Call Receipt

A record that a Skill was requested and what outcome followed. A receipt may
contain identifiers, hashes, result references, latency, success state, and
feedback references. It does not contain private keys or private model data.

### Skill Reputation

The performance record of a Skill or operator. Creator reputation, Skill
reputation, Service reputation, and current operator reputation are distinct.

## TapeOut

### TapeOut

An on-chain manufacturing system for deploying Processors, minting transistor
resources, producing Circuit assets, and binding on-chain containers.

### Processor

The project-level or standard-level factory that defines how Skill Circuits are
created, versioned, priced, capped, and transferred.

### Transistor

A foundational logic resource used during Processor and Circuit construction.

### Circuit

A concrete ERC-721 logic asset produced on a Processor. A Circuit is a pure
function: it can compute, but it cannot call other contracts or persist state.
In Agent Standard Cell Library, a Circuit may implement a Standard Cell or a
user-facing Capability Circuit.

### Container

The on-chain account and application space associated with a Circuit. It may
host a verifiable on-chain page, hold assets, and receive payments. It is not
the canonical persistent store for Skills, Licenses, or business state.

### Genesis Transistor

The transistor design adopted by Ignix from the hackathon winner. It becomes a
future standard and reference point for related Ignix vault and circuit
mechanisms.

## Ownership And Transfer

### Skill Transfer

The transfer of Skill Asset ownership. A full transfer may also include License
administration and Service operation, but those are separate rights.

### Ownership Sale

The direct SkillPass flow for selling Skill or knowledge asset ownership. The
buyer pays the station's Ownership Sale contract, receives the encrypted key
envelope, confirms decryption, and then receives Registry ownership. It is not
an OKX.AI Service Order.

### Ownership Order

The persistent order record for one Ownership Sale. It tracks the buyer public
key, asset version, payment, threshold-share delivery, refund, settlement, and
ownership transfer.

## Key Custody

### Custodian Node

An independently operated node that stores one threshold share of an asset
version key, verifies Ownership Orders, and sends the encrypted share to the
authorized buyer.

### Key Committee

A randomly selected group of Custodian Nodes responsible for one asset version
or key epoch. A `t-of-n` threshold must be reached for delivery.

### Effective Stake

The risk-adjusted voting and selection weight of a stake position after oracle
pricing, haircut, liquidity, volatility, correlation, token caps, and operator
caps are applied. Raw token amounts are never added directly.

### Key Epoch

The version of the committee, threshold policy, and key-share set for one asset
version. Orders bind to a specific key epoch.

### Delivery Attestation

A Custodian Node's signed proof that it sent its encrypted threshold share for a
specific Ownership Order. A contract counts distinct valid committee
attestations and settles automatically after the threshold is reached.

### Full Handover

A transfer that includes Skill Asset ownership, License administration, Service
operation, endpoint control, and the obligations attached to those rights.

### Reputation Split

The rule that keeps creator history, Skill history, Service history, and
operator history distinguishable after ownership or operation changes.

### Exclusive License

A License that prevents other Licensees from using the Skill during the stated
scope and period. Exclusivity requires enforcement in the Router, Service, and
operator policy.

## Products

### Agent Company Protocol

The upper-level protocol for creating, operating, licensing, settling, and
proving an Agent Company. It connects IGNIX, SkillPass, Agent Standard Cell
Library, OKX.AI, Agent Runtime, Vaults, and reputation.

### SkillPass

The user-facing product of Agent Company Protocol. SkillPass manages Skill
Passports, Licenses, Service Bindings, usage Receipts, rights, and revenue
rules.

### Agent Trust & Capability Standard

The upper-level standard for Agent capability identity, Licenses, quota,
routing, royalty, receipts, ownership, and transfer across the Ignix Agent
Economy.

### Agent Standard Cell Library

The implementation library of reusable, versioned, deterministic Circuits and
interfaces that implement Agent Trust & Capability Standard. It is the technical
implementation below SkillPass; a single Cell is not the whole product.

### Agent Commerce IP Core

A reusable Circuit or standard cell for Agent commerce, licensing, routing,
quota, settlement, receipts, or related economic rules. A Core has a clear input
and output contract, truth table, tests, version, and reuse semantics.

Examples:

- Skill Gate Core
- License Quota Core
- Ownership Sale Step
- Route & Royalty Core
- Receipt Core
- Container Finance Core

### SkillPassport ID

The stable economic identity of one Skill. Recommended derivation:

```text
hash(skill_namespace + skill_key)
```

It is not a Standard Cell ID, Service ID, License ID, or Receipt ID.

### Capability Circuit ID

The optional TapeOut Circuit ID bound to a Skill or Skill family. It is not
required for every Skill and is not the same as the stable SkillPassport ID.

### Standard Cell

A reusable Circuit with a documented bit encoding, input/output contract,
truth table, tests, and composition semantics. Examples include Skill Gate,
License Quota Step, Route & Royalty, and Receipt Mode.

### Capability Circuit

A user-facing Circuit associated with a Skill, capability family, or Agent
Company. Its current ERC-721 holder is the Circuit asset holder, but commercial
rights remain separately described in the Trust Registry.

### Trust Registry

The persistent state system for Skill identity, versions, Creator Proof,
ownership references, Licenses, quota, revocation, Service Binding, and
Receipt references. It does not replace OKX.AI's service marketplace.
Ownership purchases are handled by SkillPass Ownership Sale and recorded as
ownership state here.

In V1, the X Layer Trust Registry is the authority for persistent rights.
Local Agent data is a cache, interface, search index, and orchestration layer,
not the canonical rights store.

### Agent Skill Foundry

The historical reference application name. New user-facing work should use
`SkillPass`. Agent Skill Foundry remains only as an explanatory or migration
term where needed.

### Research-to-Story

The first reference Skill: turn a researched topic into a sourced brief, key
facts, risks, content angles, a short story, and an image prompt.

## Non-Canonical Terms

The following terms must not be used as short forms for the canonical terms:

- `Trust Cell` for the entire project
- `Agent Standard Cells` for the full SkillPass product
- `Library` as the user-facing product name
- `Circuit state` when persistence is actually stored in the Trust Registry
- `Skill NFT` for a Skill Circuit
- `Marketplace` for SkillPass
- `Payment layer` for TapeOut
- `Agent identity layer` for TapeOut
- `AI on chain` for a Skill Circuit
- `Ownership` when the intended meaning is License, Service operation, or
  Reputation
