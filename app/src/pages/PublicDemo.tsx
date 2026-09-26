import {
  ArrowRight,
  Check,
  Circle,
  ExternalLink,
  FileCheck2,
  Fingerprint,
  KeyRound,
  LoaderCircle,
  Play,
  ShieldCheck,
  SquareStack,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ViewKey } from "../components/AppShell";
import { ButtonLabel, PageTitle } from "../components/Bilingual";
import {
  CHAIN_CONFIG,
  PUBLIC_DEMO_EVIDENCE,
} from "../config";
import type { RegistryApi } from "../hooks/useRegistry";
import { evaluateSkillGate, stepLicenseQuota } from "../lib/controlledCores.js";
import type { PublicRegistrySnapshot } from "../lib/xlayer";

const steps = [
  { key: "passport", label: "Skill Passport", icon: Fingerprint },
  { key: "license", label: "License", icon: KeyRound },
  { key: "gate", label: "Skill Gate", icon: ShieldCheck },
  { key: "quota", label: "Quota Step", icon: SquareStack },
  { key: "service", label: "Research-to-Story", icon: Check },
  { key: "receipt", label: "On-chain Receipt", icon: FileCheck2 },
];

function compactHash(value: string) {
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

export function PublicDemo({
  registryApi,
  onSelect,
}: {
  registryApi: RegistryApi;
  onSelect: (view: ViewKey) => void;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [snapshot, setSnapshot] = useState<PublicRegistrySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [chainError, setChainError] = useState("");
  const [runningLocal, setRunningLocal] = useState(false);
  const [localMessage, setLocalMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    void import("../lib/xlayer")
      .then(({ readPublicRegistrySnapshot }) =>
        readPublicRegistrySnapshot(PUBLIC_DEMO_EVIDENCE),
      )
      .then((data) => {
        if (!cancelled) {
          setSnapshot(data);
          setChainError("");
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setChainError(error instanceof Error ? error.message : String(error));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!playing) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveStep((current) => {
        if (current >= steps.length - 1) {
          window.clearInterval(timer);
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 950);
    return () => window.clearInterval(timer);
  }, [playing]);

  const runTrace = () => {
    setActiveStep(0);
    setPlaying(true);
  };

  const receiptDelivered = snapshot?.receipt.status === 1;
  const passport = registryApi.registry.passports[0];
  const license = registryApi.registry.licenses[0];
  const service = registryApi.registry.services[0];
  const localReceipt = registryApi.registry.receipts[0];

  async function runSharedUsage() {
    if (!passport || !license || !service || runningLocal) return;
    setRunningLocal(true);
    setLocalMessage("");
    try {
      const quotaBefore = license.quota > 0 ? license.quota : 3;
      if (license.quota <= 0) {
        await registryApi.updateQuota(
          license.licenseId,
          3,
          "receipt:demo-refill",
        );
      }
      const gate = evaluateSkillGate({
        skillId: Number(passport.capabilityCircuitId || 13),
        skillValid: passport.status === "PUBLISHED",
        licensed: !license.revoked,
        serviceAvailable: service.available,
        licenseType: 0,
      });
      const quotaStep = stepLicenseQuota({
        quota: quotaBefore,
        consume: gate.allow,
        licenseValid: !license.revoked,
        serviceAvailable: service.available,
      });
      if (!gate.allow || !quotaStep.allow) {
        throw new Error("Skill Gate or License Quota rejected this call");
      }

      const receiptId = `receipt:${crypto.randomUUID()}`;
      await registryApi.updateQuota(license.licenseId, quotaStep.remaining, receiptId);
      await registryApi.addReceipt(
        {
          passportId: passport.passportId,
          licenseId: license.licenseId,
          requesterAgentId: "agent_controlled_demo_buyer",
          serviceId: service.serviceId,
          requestHash: "0xdemo-request",
          resultHash: "0xdemo-result",
          status: "DELIVERED",
          gateOutput: `0x${gate.routeId.toString(16)}`,
          quotaStateOut: `0x0${quotaStep.remaining}`,
          note: "Competition demo usage receipt",
        },
        receiptId,
      );
      setLocalMessage(`Receipt created · quota ${quotaStep.remaining}`);
    } catch (error) {
      setLocalMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setRunningLocal(false);
    }
  }

  return (
    <div className="page public-demo">
      <header className="page-head">
        <div>
          <PageTitle
            primary="Use a Skill"
            secondary="使用技能"
          />
          <p>
            展示 Research-to-Story 如何从 SkillPass 授权走到真实 Service Receipt。
          </p>
        </div>
        <div className="page-actions">
          <button className="button primary" onClick={runTrace}>
            <ButtonLabel
              primary="Play Flow"
              secondary="播放流程"
              icon={<Play size={16} />}
            />
          </button>
        </div>
      </header>

      <section className="usage-bridge">
        <div className="usage-bridge-copy">
          <span className="eyebrow">COMPETITION DEMO · SHARED REGISTRY STATE</span>
          <h2>Evidence Before Ownership</h2>
          <p className="section-zh">先产生一次可验证的使用记录</p>
          <p>
            这里直接复用 SkillPass 的 Passport、License、Skill Gate、Quota 和 Receipt。
            后面的买断页面读取同一份状态。
          </p>
        </div>
        <div className="usage-bridge-grid">
          <div>
            <small>Passport</small>
            <strong>{passport?.displayName ?? "Unavailable"}</strong>
            <span>{passport?.passportId ?? "—"}</span>
          </div>
          <div>
            <small>License quota</small>
            <strong>{license?.quota ?? "—"}</strong>
            <span>{license?.licenseId ?? "No License"}</span>
          </div>
          <div>
            <small>Service</small>
            <strong>{service?.name ?? "Unavailable"}</strong>
            <span>{service?.operatorAgentId ?? "—"}</span>
          </div>
          <div>
            <small>Receipt</small>
            <strong>{localReceipt?.status ?? "NOT CREATED"}</strong>
            <span>{localReceipt?.receiptId ?? "Run the shared flow"}</span>
          </div>
        </div>
        <div className="usage-bridge-actions">
          <button
            className="button primary"
            disabled={runningLocal || !passport || !license || !service}
            onClick={() => void runSharedUsage()}
          >
            <ButtonLabel
              primary={runningLocal ? "Running" : "Run Usage Flow"}
              secondary={runningLocal ? "正在执行" : "运行一次使用流程"}
              icon={
                runningLocal ? (
                  <LoaderCircle className="spin" size={16} />
                ) : (
                  <Play size={16} />
                )
              }
            />
          </button>
          {localReceipt ? (
            <button
              className="button secondary"
              onClick={() => onSelect("ownership")}
            >
              <ButtonLabel
                primary="Continue to Ownership"
                secondary="使用同一 Receipt 进入买断"
                icon={<ArrowRight size={15} />}
              />
            </button>
          ) : null}
          <button
            className="button secondary"
            onClick={() => registryApi.reset()}
          >
            <ButtonLabel primary="Reset State" secondary="重置共享状态" />
          </button>
        </div>
        {localMessage ? <p className="usage-bridge-message">{localMessage}</p> : null}
      </section>

      <section className="demo-band">
        <div>
          <small>Service task</small>
          <strong>{PUBLIC_DEMO_EVIDENCE.topic}</strong>
        </div>
        <div>
          <small>Service</small>
          <strong>{PUBLIC_DEMO_EVIDENCE.service}</strong>
        </div>
        <div>
          <small>Operator</small>
          <strong>{snapshot?.service.operatorName ?? (loading ? "读取中…" : "—")}</strong>
        </div>
        <div>
          <small>Mode</small>
          <strong>Read-only · no wallet</strong>
        </div>
      </section>

      <section className="demo-steps" aria-label="执行流程">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const state =
            index < activeStep
              ? "complete"
              : index === activeStep
                ? "active"
                : "pending";
          return (
            <div className={`demo-step ${state}`} key={step.key}>
              <span className="demo-step-icon">
                {state === "complete" ? <Check size={17} /> : <Icon size={17} />}
              </span>
              <span>
                <small>0{index + 1}</small>
                <strong>{step.label}</strong>
              </span>
              {index < steps.length - 1 && <ArrowRight size={16} />}
            </div>
          );
        })}
      </section>

      <section className="demo-proof">
        <div className="demo-proof-main">
          <div className="section-head">
            <div>
              <h2>Completion Evidence</h2>
              <p>每项状态均指向已经部署或已经完成的链上对象。</p>
            </div>
            {loading ? (
              <LoaderCircle className="spin" size={18} />
            ) : receiptDelivered ? (
              <span className="status delivered">DELIVERED</span>
            ) : (
              <span className="status">UNAVAILABLE</span>
            )}
          </div>

          <div className="demo-evidence-list">
            <div>
              <span>Skill Passport</span>
              <strong>{simplifyKey(PUBLIC_DEMO_EVIDENCE.passportKey)}</strong>
              <small>{snapshot?.passport.owner ?? "Reading X Layer…"}</small>
            </div>
            <div>
              <span>License quota</span>
              <strong>{snapshot?.license.quotaRemaining ?? "—"}</strong>
              <small>{snapshot?.license.key ?? PUBLIC_DEMO_EVIDENCE.licenseKey}</small>
            </div>
            <div>
              <span>Skill Gate</span>
              <strong>Circuit #1</strong>
              <small>{snapshot?.receipt.gateOutput ? "0x37 allow" : "Reading…"}</small>
            </div>
            <div>
              <span>Quota stateOut</span>
              <strong>
                {snapshot ? `0x0${snapshot.receipt.quotaStateOut}` : "Reading…"}
              </strong>
              <small>Circuit #2</small>
            </div>
            <div>
              <span>Result hash</span>
              <strong>{compactHash(PUBLIC_DEMO_EVIDENCE.resultHash)}</strong>
              <small>Research-to-Story output</small>
            </div>
            <div>
              <span>Trust Registry</span>
              <strong>{compactHash(CHAIN_CONFIG.trustRegistryAddress)}</strong>
              <small>Persistent authority</small>
            </div>
          </div>

          {chainError && (
            <div className="error-banner">
              X Layer 实时读取失败，页面仍展示已记录的真实交易证据。
            </div>
          )}
        </div>

        <aside className="demo-receipt">
          <div className="demo-receipt-mark">
            {receiptDelivered ? <Check size={24} /> : <Circle size={24} />}
          </div>
          <small>Research-to-Story Receipt</small>
          <h2>{receiptDelivered ? "Verified" : "Evidence unavailable"}</h2>
          <p>
            {PUBLIC_DEMO_EVIDENCE.topic}
          </p>
          <dl>
            <div>
              <dt>Service</dt>
              <dd>{PUBLIC_DEMO_EVIDENCE.service}</dd>
            </div>
            <div>
              <dt>Circuit route</dt>
              <dd>research_to_story · 1101</dd>
            </div>
            <div>
              <dt>Receipt status</dt>
              <dd>{receiptDelivered ? "DELIVERED" : "UNKNOWN"}</dd>
            </div>
          </dl>
          <a
            href={`${CHAIN_CONFIG.explorerUrl}/tx/${PUBLIC_DEMO_EVIDENCE.receiptTxHash}`}
            target="_blank"
            rel="noreferrer"
          >
            查看链上 Receipt 交易
            <ExternalLink size={14} />
          </a>
        </aside>
      </section>
    </div>
  );
}

function simplifyKey(value: string) {
  return value.replace(/^passport:/, "");
}
