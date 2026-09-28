# SkillPass

Status: competition release candidate; on-chain, video, and public demo evidence complete

## One-Line Description

A product for owning, licensing, routing, and proving Agent Skills, built on
Agent Standard Cells and integrated with OKX.AI.

Processor: Agent Standard Cells

Category: Agent Commerce IP Core Library

## Problem

AI Agents can increasingly execute work, manage assets, and pay for services.
However, Skill ownership, versions, Licenses, quota, Service routing, and work
receipts mostly live in private application databases.

SkillPass turns these rules into a visible, licensable, callable, and provable
product flow. The underlying rules are reusable, permanently public, read-only
Circuits that cannot move assets or modify external state. Persistent state
remains in a Trust Registry. OKX.AI remains the commercial marketplace, payment,
delivery, and reputation layer.

## Processor

The Processor provides SkillPass with a shared interface for Agent capability
and commercial trust cells. Agents, games, payment applications, Vaults, and
other contracts can call the same cells instead of rebuilding private permission
systems.

## V1 Cells

### Skill Gate

```text
skill_valid AND licensed AND service_available
-> allow
-> route_id
-> royalty_bucket
```

### License Quota Step (added after the primary closed loop passes)

```text
current_quota + consume_request
-> allow
-> remaining
-> deny_reason
```

The Circuit returns `state_out`; the Trust Registry persists it.

## TapeOut Integration

- Permanent public logic.
- Free read-only invocation.
- No wallet required for evaluation.
- No ability to transfer assets or write external state.
- Shared interfaces for reuse by other products.
- Safe execution of logic produced by other teams.
- Extensible standard-cell library.

## Relationship to Existing Projects

Research across TapeOut X Layer and BNB shows two different patterns:

- BNB already has CPU, SHA-256, Keccak-256, NANDPU, PAYCORE, and Wallet IP
  Cores.
- X Layer is more focused on Agent permissions, community narratives, and
  state machines.
- Remembrance Seal owns the permission-memory category.
- LoteGate demonstrates deeper state machines but has a less clear product
  story.
- Many projects have minted supply but no Circuits.

SkillPass is not another permission memory. It is the beginning of an Agent
Commerce IP Core Library for X Layer.

## Product Flow

```text
Agent A creates a Skill Passport
-> Agent B obtains a per-call License
-> Agent B discovers a Service on OKX.AI
-> Trust Registry provides License and quota
-> Skill Gate authorizes and routes
-> OKX.AI handles payment and delivery
-> Service Operator executes
-> Public Receipt records the result
```

After the non-IMOO flow passes, IMOO is shown as the first live Agent Company.

## Roadmap

- License Quota Step
- Route & Royalty Cell
- Receipt Mode
- Reputation Cell
- Circuit-level composition after X Layer enables it
- Reuse by games, payment applications, Vaults, and other Agent Companies

## On-Chain References

```text
Processor Address: 0x6586c806b192b167e3d56ad669ee60fcb16c3082
Deployment Wallet: 0x60fda8130b7341027147a1b88cd4c2a1af44ecd0
Deployment Tx: 0x457bec90ebf5294040779e9eb74575d3308bacd55be97b76f60c7937f534510c
Skill Gate Circuit ID: 1
Skill Gate Tape-out Tx: 0xcfd76f79153f173d3bbe2a59e19fe6a16f61fc16ddab14c748a2db3a1d8e8eb1
License Quota Step Circuit ID: 2
License Quota Step Tape-out Tx: 0x089b6e0ff30abc6142550c64f3d52757beefba8ba6f60d6f40eaa6a09f76dbb3
Trust Registry: 0xD4B5E16316cB0472C5446Fef4bf3960ae451094B
Trust Registry Deployment Tx: 0xe3c6eea7b18d4acc8f39710bc6cc61aee8ee5b6ed205dec1c79463cf2d5dc540
Research-to-Story Result Hash: 0xa7d333bbb3a328d05088fbaf9a0484df51303539fc5102901a058b965745acb8
Research-to-Story Receipt Tx: 0x4ef03a3dd516b7525d0f2363783eed1056d7e68c5588ec6045bd93041e46be91
Demo: https://1-2-223.tapekit.org/#/demo
GitHub: https://github.com/IGNIX-IMOO/skillpass
Video: https://github.com/IGNIX-IMOO/skillpass/releases/tag/competition-demo-v2
```
