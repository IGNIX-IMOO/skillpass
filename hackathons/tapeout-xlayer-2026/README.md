# TapeOut X Layer Hackathon

## Submission

Project:

> SkillPass

One-line description:

> An Agent Company Protocol product for owning, licensing, routing, and proving
> Agent Skills, built on Agent Standard Cells and integrated with OKX.AI.

Category:

> Agent Commerce IP Core Library

Chinese:

> 一套让 Agent 能力可以被拥有、许可、调用、路由、分账和证明的产品，
> 底层使用 Agent Standard Cells，商业服务接入 OKX.AI。

## Required Deliverables

- X Layer Processor
- `Skill Gate Core` tape-out
- SkillPass product pages
- Trust Registry
- Agent A/Agent B flow without IMOO dependency
- `License Quota Core` after the primary closed loop is complete
- BLIF and test evidence for every taped-out Circuit
- Public Demo
- `Research-to-Story` OKX.AI Service
- One real call from Agent B in the non-IMOO flow
- Processor address, Circuit ID, and public receipt

## Scope Boundary

This submission does not create a second Agent marketplace, payment layer,
rating system, or Agent identity system. OKX.AI remains the commercial Service
layer. TapeOut remains the on-chain manufacturing and asset layer.

IMOO is the first live Agent Company, Skill Owner, and Service operator. It is
not the boundary of the Skill system.

## Files

- `processor-config.draft.json`
- `external-parameters.md`
- `circuits/skill-gate/circuit.md`
- `circuits/skill-gate/skill-gate.blif`
- `circuits/skill-gate/verify.mjs`
- `circuits/license-quota-step/circuit.md`
- `circuits/license-quota-step/license-quota-step.blif`
- `circuits/license-quota-step/verify.mjs`
- `submission/project-description-zh.md`
- `submission/project-description-en.md`
- `submission/demo-script.md`
- `submission/judge-guide.md`
- `submission/checklist.md`

Run verification:

```bash
cd hackathons/tapeout-xlayer-2026/circuits/skill-gate
node verify.mjs
```
