# ADR 0001: Agent Skill Foundry Boundaries

状态：部分被 ADR 0002 取代；OKX.AI 商业边界由 ADR 0005 修正

保留有效内容：OKX.AI 边界、Skill 领域模型、Circuit ID 权威和
Creator/Owner/Licensee/Operator 分离。

已被 ADR 0002 修正：项目不再压缩为单枚 Entitlement Router，Circuit
不再承担持久状态，X Layer V1 不假设电路级子组合。

## Context

OKX.AI already provides Agent identity, service discovery, A2A and A2MCP
invocation, commercial pricing, escrow, delivery, refunds, arbitration,
ratings, and Agent reputation.

TapeOut provides an on-chain Processor, transistor resources, Circuit assets,
containers, and verifiable on-chain data.

The proposed product must use both without creating duplicate infrastructure and
without limiting generic Agent Skills to IMOO.

## Decision

1. OKX.AI remains the canonical Agent marketplace, commercial Service layer,
   payment layer, delivery layer, and rating layer.
2. TapeOut remains the canonical on-chain manufacturing and asset layer for
   Processor, Transistor, and Circuit.
3. Agent Skill Foundry owns Skill identity, version, ownership, license,
   entitlement, routing, Service binding, call receipt, and transfer rules.
4. A Skill Circuit is not an AI model or runtime. It is a Skill passport and
   deterministic rule asset.
5. IMOO is the first Skill creator, Licensee, Service operator, and public demo.
   IMOO is not the boundary or exclusive owner of generic Skills.
6. Creator Proof, Skill ownership, License administration, Service operation,
   and reputation are separate rights.
7. V1 uses OKX.AI A2A services first. A2MCP is added only when a stable public
   HTTPS endpoint exists.
8. The first circuit is `Agent Skill Entitlement Router`, not a one-off
   IMOO-only decoder.
9. The first reference Service is `Research-to-Story`.
10. Circuit ID is the canonical on-chain identity of a Skill. A local registry,
    container proof, or future registry contract may store extended state, but
    must not replace the Circuit with a second Skill identity asset.

## Consequences

Positive:

- The product complements OKX.AI instead of competing with it.
- Generic Skills can be reused by other Agents.
- Ownership and transfer have clear boundaries.
- TapeOut receives a real deterministic circuit use case.
- IMOO supplies a strong first case and distribution surface.
- The architecture can expand from IMOO to a wider Agent economy.

Negative:

- Skill ownership cannot automatically enforce external runtime behavior.
- Exclusive licenses require Service-side enforcement.
- Reputation cannot be transferred blindly between operators.
- The system needs coordination across two external platforms.
- More governance is required before secondary-market economics are enabled.

## Rejected Alternatives

### Build a new Agent marketplace

Rejected because it duplicates OKX.AI discovery, payment, delivery, ratings,
and identity.

### Put the AI model on chain

Rejected because circuits are deterministic logic assets. Model inference,
private inputs, tools, and API credentials remain off chain.

### Make all Skills belong to IMOO

Rejected because it prevents reuse by other Agents and makes the product a
feature instead of an ecosystem layer.

### Treat a Skill Circuit as a complete service

Rejected because Circuit ownership, commercial Service operation, runtime
execution, and reputation are separate concerns.

### Create a second payment and escrow layer

Rejected because OKX.AI already owns commercial settlement.
