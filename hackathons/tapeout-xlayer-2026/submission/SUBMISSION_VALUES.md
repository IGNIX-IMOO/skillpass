# Submission field sheet

Every value below was read from the running product or verified directly
against the X Layer node on 2026-09-28. Copy from here into the submission
form; do not retype by hand.

## Identity

| Field | Value |
| --- | --- |
| Project Name | `SkillPass` |
| Category | Agent Commerce IP Core Library |
| Protocol | Agent Company Protocol |
| Symbol (core library) | `ACELL` |
| Repository | `https://github.com/IGNIX-IMOO/skillpass` (public) |

## On-chain objects

| Field | Value |
| --- | --- |
| Chain | X Layer mainnet (`chainId 196`) |
| Explorer | `https://www.oklink.com/xlayer` |
| Processor | `0x6586c806b192b167e3d56ad669ee60fcb16c3082` |
| Standard Cells | `0x4e73a827c375f291a23797bfcd77eeaf8e5653ca` |
| Trust Registry | `0xD4B5E16316cB0472C5446Fef4bf3960ae451094B` |
| Processor Factory | `0x1f09daefa827f02cbb40967cc91b259763760761` |
| Deployment wallet | `0x60fda8130b7341027147a1b88cd4c2a1af44ecd0` |
| TapeOut project | `https://tapeout.net/#l2/xlayer/0x6586c806b192b167e3d56ad669ee60fcb16c3082` |

## Circuits

| Circuit | ID | Tape-out transaction | Block |
| --- | ---: | --- | ---: |
| Skill Gate | `1` | `0xcfd76f79153f173d3bbe2a59e19fe6a16f61fc16ddab14c748a2db3a1d8e8eb1` | 71398704 |
| License Quota Step | `2` | `0x089b6e0ff30abc6142550c64f3d52757beefba8ba6f60d6f40eaa6a09f76dbb3` | 71398766 |

The Processor also contains auxiliary Circuit ID `3` (18 NAND, 2 inputs / 1
output). It is not used by SkillPass and is not part of the claimed product
flow.

## Deployment transactions

| Object | Transaction |
| --- | --- |
| Processor deployment | `0x457bec90ebf5294040779e9eb74575d3308bacd55be97b76f60c7937f534510c` |
| Trust Registry deployment | `0xe3c6eea7b18d4acc8f39710bc6cc61aee8ee5b6ed205dec1c79463cf2d5dc540` |

## Real task evidence

| Field | Value |
| --- | --- |
| Service | `research_to_story` v1.0.0 |
| Topic | Why Agent Skills need licenses and verifiable receipts |
| Receipt id | `receipt:d2fc62d5-24c6-4824-a892-0108fca105df` |
| Result hash | `0xa7d333bbb3a328d05088fbaf9a0484df51303539fc5102901a058b965745acb8` |
| Receipt transaction | `0x4ef03a3dd516b7525d0f2363783eed1056d7e68c5588ec6045bd93041e46be91` |
| Gate output | `0x37` → `allow = 1`, `route_id = 1101` (`research_to_story`), `royalty_bucket = 10` |
| Quota state out | `0x02` (3 → 2) |

## Demo artifacts

| Field | Value |
| --- | --- |
| Demo video | `https://github.com/IGNIX-IMOO/skillpass/releases/download/competition-demo-v2/skillpass-competition-final.mp4` — 1920x1080, 165s / 2分45秒 |
| Video release | `https://github.com/IGNIX-IMOO/skillpass/releases/tag/competition-demo-v2` |
| Source project | `https://github.com/IGNIX-IMOO/skillpass` |
| Public repository | `https://github.com/IGNIX-IMOO/skillpass` |
| Public demo URL | `https://1-2-223.tapekit.org/#/demo` |
| GitHub Pages | `https://ignix-imoo.github.io/skillpass/` |
| Static bundle | GitHub Actions workflow `deploy-public-demo`; every deployment is built from `main` |

## On-chain public demo (live, use this one)

| Field | Value |
| --- | --- |
| URL | `https://1-2-223.tapekit.org/#/demo` |
| On-chain name | `1.2.223.tape` (`<#ID>.<area>.<processor>.tape`; X Layer area code 2) |
| Processor number | `223` (on the X Layer TapeOut factory) |
| Container | `0xfdBa7FeDeD2A665B3c7601bEf8CDDDAF162E1836` |
| Container opened | tx `0x627c4b4b2feddd192fd37b8048ebe342c61f0eeba406763b51e1c687a7ded192` |
| Activation paid | tx `0x5d3a9b735f0d77faec7cc030840f8afb6ef1a063e747329a58908785828baf7e` |
| Paid until | 2026-12-23 |
| Files | 6 files / 592,120 bytes / 29 chunks, every SHA-256 verified on read |

This URL has no server, no DNS and no GitHub dependency. Tapekit reads the
files straight from X Layer and rejects any byte that does not match the hash
declared on chain.

### Who runs it

The service `service:research_to_story` is operated by `agent:imoo_operator`,
shown on both public pages as **IMOO Service Operator**. That is the second
showcase case: IMOO as a real Agent Company running the same flow as the
neutral Agent A / Agent B demo.

The registry stores `keccak256(agent id)` rather than the id itself, so the
readable name comes from a small hand-maintained map in
`app/src/lib/xlayer.ts` (`KNOWN_AGENT_IDS`). Anything not in that map is shown
as its hash instead of a guessed name.

## Release readiness

| Field | Status |
| --- | --- |
| Public demo URL | Complete: on-chain and GitHub Pages are both public |
| Public video | Complete: GitHub Release asset is public |
| X Post | Draft ready in `submission/x-post.md`; awaiting posting |
| Contact Email | Submitter must choose the public or submission email |

## Verification log

Read-only checks run against `https://rpc.xlayer.tech`:

```text
Processor 部署      block 71398484 status 1
Skill Gate 流片     block 71398704 status 1
License Quota 流片  block 71398766 status 1
TrustRegistry 部署  block 71400756 status 1
真实任务 Receipt    block 71401895 status 1
Processor        bytecode 295 bytes   deployed
TrustRegistry    bytecode 8071 bytes  deployed
```

All five transactions confirmed with status `0x1`; both contracts hold bytecode.
