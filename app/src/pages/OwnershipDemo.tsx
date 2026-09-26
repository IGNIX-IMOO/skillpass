import {
  ArrowRight,
  BadgeCheck,
  Check,
  Circle,
  FileLock2,
  Fingerprint,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Play,
  RotateCcw,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ViewKey } from "../components/AppShell";
import { ButtonLabel, PageTitle } from "../components/Bilingual";
import type { RegistryApi } from "../hooks/useRegistry";
import {
  OWNERSHIP_STATES,
  beginOwnershipDelivery,
  completeOwnershipOrder,
  createOwnershipOrder,
  fundOwnershipOrder,
  recordDeliveryAttestation,
  type OwnershipOrder,
} from "../lib/ownershipOrder.js";
import {
  combineDemoShares,
  createDemoBuyerKey,
  decryptDemoContent,
  openShareEnvelope,
  sha256Hex,
  type DemoContent,
  type ShareEnvelope,
} from "../lib/demoThresholdCrypto.js";

const stages = [
  {
    key: "LISTED",
    title: "Listed",
    secondary: "资产待买断",
    copy: "卖方发布加密版本、价格和交付条件。",
  },
  {
    key: "FUNDED",
    title: "Funded",
    secondary: "测试付款已确认",
    copy: "本地付款事件触发 Ownership Order，不接真实资金。",
  },
  {
    key: "DELIVERING",
    title: "Delivering",
    secondary: "节点自动交付",
    copy: "Node A 和 Node B 返回不同份额，Node C 故意离线。",
  },
  {
    key: "DELIVERED",
    title: "Delivered",
    secondary: "阈值已满足",
    copy: "两个独立份额足以在浏览器本地重建内容密钥。",
  },
  {
    key: "COMPLETED",
    title: "Completed",
    secondary: "所有权已转移",
    copy: "买方自动获得解密能力和 Ownership 状态，无需再次确认。",
  },
] as const;

export function OwnershipDemo({
  registryApi,
  onSelect,
}: {
  registryApi: RegistryApi;
  onSelect: (view: ViewKey) => void;
}) {
  const [order, setOrder] = useState<OwnershipOrder>(createDemoOrder);
  const [playing, setPlaying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [sceneError, setSceneError] = useState("");
  const [decryptedText, setDecryptedText] = useState("");
  const sceneRef = useRef<DemoScene | null>(null);
  const transferRecordedRef = useRef(false);
  const passport = registryApi.registry.passports[0];
  const license = registryApi.registry.licenses[0];
  const linkedReceipt = registryApi.registry.receipts[0];

  useEffect(() => {
    if (!playing || !sceneRef.current) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void advanceDemoScene(order, sceneRef.current!)
        .then((next) => {
          if (cancelled) return;
          setOrder(next.order);
          if (next.plaintext) setDecryptedText(next.plaintext);
          if (next.order.state === OWNERSHIP_STATES.COMPLETED) {
            setPlaying(false);
            if (!transferRecordedRef.current && passport) {
              transferRecordedRef.current = true;
              registryApi.transferPassportOwnership(passport.passportId, "Agent B");
            }
          }
        })
        .catch(() => {
          if (!cancelled) setPlaying(false);
        });
    }, 900);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [order, passport, playing, registryApi]);

  const start = async () => {
    setStarting(true);
    setPlaying(false);
    setDecryptedText("");
    setSceneError("");
    transferRecordedRef.current = false;
    try {
      const prepared = await prepareDemoRun();
      sceneRef.current = prepared.scene;
      setOrder(prepared.order);
      setPlaying(true);
    } catch (error) {
      setSceneError(error instanceof Error ? error.message : String(error));
    } finally {
      setStarting(false);
    }
  };

  const reset = () => {
    setPlaying(false);
    setStarting(false);
    setDecryptedText("");
    setSceneError("");
    transferRecordedRef.current = false;
    sceneRef.current = null;
    setOrder(createDemoOrder());
  };

  const activeStep = STATE_STEP[order.state] ?? 0;
  const complete = order.state === OWNERSHIP_STATES.COMPLETED;
  const nodeDeliveryStarted =
    activeStep >= 2 && order.state !== OWNERSHIP_STATES.REFUNDED;
  const nodeDeliveryComplete =
    order.state === OWNERSHIP_STATES.DELIVERED || complete;
  const deliveredShares = Object.keys(order.attestations).length;

  return (
    <div className="page ownership-demo">
      <header className="page-head">
        <div>
          <span className="eyebrow">COMPETITION DEMO · NO WALLET · NO REAL FUNDS</span>
          <PageTitle primary="Own a Skill" secondary="拥有技能" />
          <p>
            买方从 SkillPass 的真实调用记录进入站内买断，并观察 2-of-3 自动交付。
          </p>
        </div>
        <div className="page-actions">
          <button
            className="button primary"
            disabled={starting || !linkedReceipt}
            onClick={() => void start()}
          >
            <ButtonLabel
              primary={
                starting
                  ? "Preparing"
                  : complete
                    ? "Replay"
                    : linkedReceipt
                      ? "Start Delivery"
                      : "Complete Usage First"
              }
              secondary={
                starting
                  ? "准备节点和份额"
                  : complete
                    ? "重新播放"
                    : linkedReceipt
                      ? "开始自动交付"
                      : "先完成使用流程"
              }
              icon={
                starting ? (
                  <LoaderCircle className="spin" size={16} />
                ) : complete ? (
                  <RotateCcw size={16} />
                ) : (
                  <Play size={16} />
                )
              }
            />
          </button>
          <button className="button secondary" onClick={reset}>
            <ButtonLabel primary="Reset" secondary="重置" />
          </button>
        </div>
      </header>

      {sceneError ? <div className="error-banner">{sceneError}</div> : null}

      <section className="ownership-link-state">
        <div>
          <small>Shared Passport</small>
          <strong>{passport?.displayName ?? "Unavailable"}</strong>
          <span>{passport?.passportId ?? "—"}</span>
        </div>
        <div>
          <small>Shared License</small>
          <strong>{license ? `${license.quota} remaining` : "No License"}</strong>
          <span>{license?.licenseId ?? "—"}</span>
        </div>
        <div>
          <small>Linked Receipt</small>
          <strong>{linkedReceipt?.status ?? "NOT CREATED"}</strong>
          <span>{linkedReceipt?.receiptId ?? "从“使用 Skill”开始"}</span>
        </div>
        <div>
          <small>Current Owner</small>
          <strong>{passport?.owner ?? "—"}</strong>
          <span>{complete ? "Ownership transferred" : "Waiting for delivery"}</span>
        </div>
        {!linkedReceipt ? (
          <button className="button secondary" onClick={() => onSelect("demo")}>
            <ButtonLabel
              primary="Use a Skill"
              secondary="前往使用流程"
              icon={<ArrowRight size={15} />}
            />
          </button>
        ) : null}
      </section>

      <section className="ownership-band">
        <div>
          <small>Asset</small>
          <strong>Research-to-Story · v1.0.0</strong>
        </div>
        <div>
          <small>Buyer</small>
          <strong>Agent B</strong>
        </div>
        <div>
          <small>Payment</small>
          <strong>LOCAL TEST VALUE</strong>
        </div>
        <div>
          <small>Delivery</small>
          <strong>2-of-3 · encrypted file</strong>
        </div>
      </section>

      <section className="ownership-layout">
        <div className="ownership-main">
          <div className="section-head">
            <div>
              <h2>Ownership Order</h2>
              <p>付款后自动推进，没有买方确认状态，也没有运营审核。</p>
            </div>
            <span className={`ownership-state ${complete ? "complete" : ""}`}>
              {order.state}
            </span>
          </div>

          <div className="ownership-stages">
            {stages.map((stage, index) => {
              const state =
                index < activeStep
                  ? "complete"
                  : index === activeStep
                    ? playing
                      ? "active"
                      : "current"
                    : "pending";
              return (
                <div
                  key={stage.key}
                  className={`ownership-stage ${state}`}
                >
                  <span className="ownership-stage-icon">
                    {index < activeStep ? (
                      <Check size={16} />
                    ) : index === activeStep && playing ? (
                      <LoaderCircle className="spin" size={16} />
                    ) : (
                      <Circle size={13} />
                    )}
                  </span>
                  <small>0{index + 1}</small>
                  <strong>{stage.title}</strong>
                  <span className="ownership-stage-zh">{stage.secondary}</span>
                  <p>{stage.copy}</p>
                </div>
              );
            })}
          </div>

          <section className="custody-section">
            <div className="section-head">
              <div>
              <h2>Custodian Nodes</h2>
                <p>三个演示节点使用本地独立份额，任何一个节点都不能单独重建密钥。</p>
              </div>
            </div>
            <div className="custody-nodes">
              {[
                {
                  id: "Node A",
                  share: "share-a",
                  online: true,
                  delivered: Boolean(order.attestations["node-a"]),
                },
                {
                  id: "Node B",
                  share: "share-b",
                  online: true,
                  delivered: Boolean(order.attestations["node-b"]),
                },
                {
                  id: "Node C",
                  share: "share-c",
                  online: false,
                  delivered: false,
                },
              ].map((node) => (
                <article
                  className={`custody-node ${
                    node.online ? "online" : "offline"
                  } ${node.delivered ? "delivered" : ""}`}
                  key={node.id}
                >
                  <span className="custody-node-icon">
                    {node.online ? <ShieldCheck size={18} /> : <WifiOff size={18} />}
                  </span>
                  <div>
                    <small>{node.online ? "ONLINE" : "INTENTIONALLY OFFLINE"}</small>
                    <strong>{node.id}</strong>
                  </div>
                  <span className="custody-share">
                    {node.delivered
                      ? "ENCRYPTED SHARE SENT"
                      : node.online && nodeDeliveryStarted
                        ? "VERIFYING ORDER"
                        : node.online
                          ? "STANDBY"
                          : "NO DELIVERY"}
                  </span>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="ownership-proof">
          <div className={`proof-seal ${complete ? "complete" : ""}`}>
            {complete ? <BadgeCheck size={24} /> : <LockKeyhole size={24} />}
          </div>
          <small>Ownership result</small>
          <h2>{complete ? "Owned by Agent B" : "Not transferred"}</h2>
          <p>
            {complete
              ? "买方已在本地重建密钥，演示所有权只会在阈值交付后完成。"
              : "所有权、付款和交付保持锁定，直到订单完成。"}
          </p>

          <dl>
            <div>
              <dt>Buyer public key</dt>
              <dd>
                <Fingerprint size={14} />
                0xB…demo
              </dd>
            </div>
            <div>
              <dt>Delivered shares</dt>
              <dd>{deliveredShares} / {order.committee.length}</dd>
            </div>
            <div>
              <dt>Threshold</dt>
              <dd>2 required</dd>
            </div>
            <div>
              <dt>Plaintext key stored</dt>
              <dd>No</dd>
            </div>
          </dl>

          <div className="ownership-result-row">
            {complete ? <KeyRound size={18} /> : <FileLock2 size={18} />}
            <span>
              <strong>
                {decryptedText
                  ? "Content decrypted"
                  : complete
                    ? "Key reconstructed"
                    : "Content encrypted"}
              </strong>
              <small>Browser-local reconstruction only</small>
            </span>
          </div>

          {decryptedText ? (
            <blockquote className="ownership-decrypted">
              {decryptedText}
            </blockquote>
          ) : null}
        </aside>
      </section>
    </div>
  );
}

interface DemoScene {
  buyerPrivateKey: Uint8Array;
  buyerPublicKey: Uint8Array;
  assetId: string;
  packageId: string;
  content: DemoContent;
  envelopes: Partial<Record<"node-a" | "node-b", ShareEnvelope>>;
}

const DEMO_ASSET_BASE = `${import.meta.env.BASE_URL}demo-assets/research-to-story/v1.0.0/`;
const NODE_URLS = {
  "node-a": "http://127.0.0.1:4181",
  "node-b": "http://127.0.0.1:4182",
} as const;

const STATE_STEP: Record<string, number> = {
  [OWNERSHIP_STATES.LISTED]: 0,
  [OWNERSHIP_STATES.FUNDED]: 1,
  [OWNERSHIP_STATES.DELIVERING]: 2,
  [OWNERSHIP_STATES.DELIVERED]: 3,
  [OWNERSHIP_STATES.COMPLETED]: 4,
  [OWNERSHIP_STATES.DELIVERY_TIMEOUT]: 0,
  [OWNERSHIP_STATES.REFUNDED]: 0,
};

function createDemoOrder(
  buyerPublicKeyHash = "0xbuyerpublickey",
): OwnershipOrder {
  const now = Date.now();
  return createOwnershipOrder({
    orderId: `ownership:research_to_story:${now}`,
    passportId: "passport:research_to_story",
    version: "1.0.0",
    buyer: "agent_b",
    buyerPublicKeyHash,
    price: 100,
    paymentAsset: "LOCAL_TEST_VALUE",
    keyEpoch: "demo-epoch-1",
    committee: ["node-a", "node-b", "node-c"],
    threshold: 2,
  });
}

async function prepareDemoRun(): Promise<{
  order: OwnershipOrder;
  scene: DemoScene;
}> {
  const buyer = createDemoBuyerKey();
  const order = createDemoOrder(await sha256Hex(buyer.publicKey));
  const manifestResponse = await fetch(`${DEMO_ASSET_BASE}manifest.json`);
  if (!manifestResponse.ok) {
    throw new Error("The encrypted competition asset package is unavailable.");
  }
  const manifest = (await manifestResponse.json()) as {
    assetId: string;
    packageId: string;
    keyEpoch: string;
    contentNonce: string;
    ciphertextHash: string;
    plaintextHash: string;
  };
  await Promise.all(
    Object.entries(NODE_URLS).map(async ([nodeId, url]) => {
      const response = await fetch(`${url}/health`);
      if (!response.ok) {
        throw new Error(`${nodeId} is not available at ${url}`);
      }
      const health = (await response.json()) as {
        packageId?: string;
      };
      if (health.packageId !== manifest.packageId) {
        throw new Error(`${nodeId} is serving an old asset package.`);
      }
    }),
  );
  const ciphertextResponse = await fetch(
    `${DEMO_ASSET_BASE}encrypted-content.bin`,
  );
  if (!ciphertextResponse.ok) {
    throw new Error("The encrypted competition content is unavailable.");
  }
  const ciphertext = new Uint8Array(
    await ciphertextResponse.arrayBuffer(),
  );

  return {
    order,
    scene: {
      buyerPrivateKey: buyer.privateKey,
      buyerPublicKey: buyer.publicKey,
      assetId: manifest.assetId,
      packageId: manifest.packageId,
      content: {
        assetId: manifest.assetId,
        keyEpoch: manifest.keyEpoch,
        nonce: manifest.contentNonce,
        ciphertext: bytesToBase64(ciphertext),
        ciphertextHash: manifest.ciphertextHash,
        plaintextHash: manifest.plaintextHash,
      },
      envelopes: {},
    },
  };
}

async function advanceDemoScene(
  order: OwnershipOrder,
  scene: DemoScene,
): Promise<{ order: OwnershipOrder; plaintext?: string }> {
  switch (order.state) {
    case OWNERSHIP_STATES.LISTED:
      return {
        order: fundOwnershipOrder(order, {
          eventId: `${order.orderId}:payment`,
          confirmedAt: Date.now(),
        }),
      };
    case OWNERSHIP_STATES.FUNDED:
      return { order: beginOwnershipDelivery(order) };
    case OWNERSHIP_STATES.DELIVERING:
      if (!order.attestations["node-a"]) {
        return {
          order: await deliverShare(order, scene, "node-a"),
        };
      }
      if (!order.attestations["node-b"]) {
        return {
          order: await deliverShare(order, scene, "node-b"),
        };
      }
      return { order };
    case OWNERSHIP_STATES.DELIVERED:
      return {
        order: completeOwnershipOrder(order, {
          ownershipTxId: `${order.orderId}:ownership`,
        }),
        plaintext: await decryptScene(order, scene),
      };
    default:
      return { order };
  }
}

async function deliverShare(
  order: OwnershipOrder,
  scene: DemoScene,
  nodeId: "node-a" | "node-b",
) {
  const response = await fetch(`${NODE_URLS[nodeId]}/deliver`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assetId: scene.assetId,
      packageId: scene.packageId,
      orderId: order.orderId,
      keyEpoch: order.keyEpoch,
      buyerPublicKey: bytesToBase64(scene.buyerPublicKey),
    }),
  });
  if (!response.ok) {
    throw new Error(`${nodeId} failed to deliver its encrypted share.`);
  }
  const delivery = (await response.json()) as ShareEnvelope;
  scene.envelopes[nodeId] = delivery;
  return recordDeliveryAttestation(order, {
    nodeId,
    shareHash: delivery.shareHash,
    signature: delivery.signature,
    createdAt: Date.now(),
  });
}

async function decryptScene(order: OwnershipOrder, scene: DemoScene) {
  const envelopeA = scene.envelopes["node-a"];
  const envelopeB = scene.envelopes["node-b"];
  if (!envelopeA || !envelopeB) {
    throw new Error("threshold envelopes are missing");
  }
  const shareA = await openShareEnvelope({
    nodeId: "node-a",
    assetId: scene.assetId,
    packageId: scene.packageId,
    orderId: order.orderId,
    keyEpoch: order.keyEpoch,
    envelope: envelopeA.envelope,
    buyerPrivateKey: scene.buyerPrivateKey,
  });
  const shareB = await openShareEnvelope({
    nodeId: "node-b",
    assetId: scene.assetId,
    packageId: scene.packageId,
    orderId: order.orderId,
    keyEpoch: order.keyEpoch,
    envelope: envelopeB.envelope,
    buyerPrivateKey: scene.buyerPrivateKey,
  });
  const contentKey = await combineDemoShares([shareA, shareB]);
  const plaintext = await decryptDemoContent(scene.content, contentKey);
  contentKey.fill(0);
  shareA.fill(0);
  shareB.fill(0);
  scene.buyerPrivateKey.fill(0);
  return plaintext;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
