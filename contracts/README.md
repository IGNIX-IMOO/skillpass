# TrustRegistry

SkillPass V1 persistent authority on X Layer.

```text
Network: X Layer
Chain ID: 196
Address: 0xD4B5E16316cB0472C5446Fef4bf3960ae451094B
Owner / Controller: 0x60fda8130b7341027147a1b88cd4c2a1af44ecd0
```

The contract stores:

- Skill Passport identity and version references
- Creator Proof
- Passport ownership and status
- Licenses, quota state, revocation, and royalty bucket
- Service bindings and availability
- Receipt references and outcomes

It does not process payments, run models, or replace OKX.AI.

Build and test:

```bash
npm install
npm run build
npm test
```

Deploy through the standard CREATE2 proxy:

```bash
npm run deploy
```

Seed the first controlled demo records:

```bash
npm run seed
```

`seed` is idempotent and skips records that already exist.
