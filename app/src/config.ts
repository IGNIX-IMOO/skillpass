export const CHAIN_CONFIG = {
  chainId: 196,
  chainName: "X Layer",
  rpcUrl: "https://rpc.xlayer.tech",
  explorerUrl: "https://www.oklink.com/xlayer",
  factoryAddress: "0x1f09daefa827f02cbb40967cc91b259763760761",
  processorAddress: "0x6586c806b192b167e3d56ad669ee60fcb16c3082",
  transistorsAddress: "0x4e73a827c375f291a23797bfcd77eeaf8e5653ca",
  trustRegistryAddress: "0xD4B5E16316cB0472C5446Fef4bf3960ae451094B",
  skillGateCircuitId: 1,
  licenseQuotaCircuitId: 2,
} as const;

export const REPOSITORY_URL = "https://github.com/IGNIX-IMOO/skillpass";

export const DEMO_AGENTS = {
  creator: {
    id: "agent_controlled_demo_creator",
    displayName: "SkillPass Demo Creator",
    role: "CREATOR_OWNER",
  },
  buyer: {
    id: "agent_controlled_demo_buyer",
    displayName: "SkillPass Demo Buyer",
    role: "LICENSEE_BUYER",
  },
  operator: {
    id: "agent_imoo_operator",
    displayName: "IMOO Service Operator",
    role: "SERVICE_OPERATOR",
  },
} as const;

export const DEMO_OWNER_ADDRESS =
  "0x60fda8130b7341027147a1b88cd4c2a1af44ecd0";

export const DEFAULT_RESEARCH_TOPIC =
  "Why Agent Skills need licenses and verifiable receipts";

export const DEFAULT_RESEARCH_SOURCES = [
  {
    title: "SkillPass Product V1",
    url: "https://github.com/IGNIX-IMOO/skillpass/blob/main/docs/SKILLPASS_PRODUCT_V1.md",
    excerpt:
      "SkillPass gives each Skill identity, version, Creator Proof, Owner, License, Quota, Service Binding, Royalty Rule, Usage Receipt and Reputation. TapeOut Circuits provide deterministic, public, read-only decisions. Persistent state belongs to the Trust Registry.",
  },
  {
    title: "TapeOut P0 Technical Verification",
    url: "https://github.com/IGNIX-IMOO/skillpass/blob/main/docs/P0_TAPEOUT_TECHNICAL_VERIFICATION.md",
    excerpt:
      "TapeOut Circuits are read-only and do not persist state. eval handles combinational logic. step receives stateIn and input, then returns stateOut and output. The caller must save stateOut.",
  },
] as const;

export const PUBLIC_DEMO_EVIDENCE = {
  passportKey: "passport:research_to_story",
  licenseKey: "license:research_to_story:refill_1",
  serviceKey: "service:research_to_story",
  receiptKey: "receipt:d2fc62d5-24c6-4824-a892-0108fca105df",
  service: "research_to_story · v1.0.0",
  topic: DEFAULT_RESEARCH_TOPIC,
  resultHash:
    "0xa7d333bbb3a328d05088fbaf9a0484df51303539fc5102901a058b965745acb8",
  receiptTxHash:
    "0x4ef03a3dd516b7525d0f2363783eed1056d7e68c5588ec6045bd93041e46be91",
} as const;

// Set by `npm run build:public`. In that bundle only the read-only pages are
// reachable, because everything else talks to a registry bridge that does not
// exist once the site is served from the circuit container.
export const PUBLIC_BUILD = import.meta.env.VITE_PUBLIC_BUILD === "1";
