# Local Ownership Order Runtime

This is the Slice 2 state machine for the competition demo. It does not connect
to a wallet, contract, payment network, or key-custody node.

Run:

```bash
node runtime/ownership-demo/build-package.mjs
node runtime/ownership-demo/verify-package.mjs
node runtime/ownership-demo/verify-node-service.mjs
node runtime/ownership-demo/verify.mjs
```

It verifies:

- encrypted skill package build and manifest hashes;
- each pair of shares can reconstruct the content key;
- one share cannot reconstruct the content key;
- tampered ciphertext fails authentication;
- Node A and Node B expose independent local HTTP delivery services;
- the browser receives only encrypted envelopes, never raw shares;
- listed, funded, delivering, delivered, completed;
- threshold delivery with Node C offline;
- idempotent payment and attestation replay;
- conflicting share rejection;
- completion before threshold rejection;
- delivery timeout and refund.
- three custodian nodes with Node C offline;
- X25519 encrypted share envelopes;
- browser-side reconstruction of a 2-of-3 key;
- XChaCha20-Poly1305 content decryption.

Generated public content and node shares are written under
`runtime/ownership-demo/.generated/`, which is intentionally ignored by Git.

Start the online demo nodes:

```bash
node runtime/ownership-demo/start-nodes.mjs
```

Node A listens on `4181`, Node B on `4182`, and Node C is intentionally offline.
