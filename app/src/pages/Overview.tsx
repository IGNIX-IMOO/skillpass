import {
  ArrowRight,
  Check,
  CircleSlash2,
  FileCheck2,
  Fingerprint,
  KeyRound,
  LoaderCircle,
  Play,
  ShieldCheck,
  SquareStack,
} from "lucide-react";
import { useState } from "react";
import type {
  CallReceipt,
  FlowLog,
  RegistryState,
  ResearchResult,
} from "../types";
import {
  CHAIN_CONFIG,
  DEFAULT_RESEARCH_SOURCES,
  DEFAULT_RESEARCH_TOPIC,
  DEMO_AGENTS,
} from "../config";
import { hashObject } from "../lib/registry";
import { ChainStatus } from "../components/ChainStatus";
import { Metric } from "../components/Metric";

const FLOW_STEPS = [
  { key: "passport", label: "Skill Passport", icon: Fingerprint },
  { key: "license", label: "License", icon: KeyRound },
  { key: "gate", label: "Skill Gate", icon: ShieldCheck },
  { key: "quota", label: "Quota Step", icon: SquareStack },
  { key: "service", label: "Service", icon: Check },
  { key: "receipt", label: "Receipt", icon: FileCheck2 },
];

function initialLogs(): FlowLog[] {
  return FLOW_STEPS.map((step) => ({
    id: step.key,
    label: step.label,
    detail: "等待运行",
    status: "pending",
  }));
}

function lastReceipt(
  registry: RegistryState,
  passportId: string,
): CallReceipt | undefined {
  return registry.receipts.find((item) => item.passportId === passportId);
}

function compactHex(value: string) {
  const trimmed = value.replace(/^0x/i, "").replace(/^0+/, "");
  return `0x${trimmed || "0"}`;
}

export function Overview({
  api,
}: {
  api: {
    registry: RegistryState;
    source: "loading" | "chain" | "local";
    error: string;
    pending: boolean;
    updateQuota: (
      licenseId: string,
      stateOut: number,
      receiptId: string,
    ) => Promise<boolean>;
    addReceipt: (
      input: Omit<CallReceipt, "receiptId" | "createdAt">,
      receiptId?: string,
    ) => Promise<boolean>;
  };
}) {
  const registry = api.registry;
  const [selectedPassportId, setSelectedPassportId] = useState(
    registry.passports[0]?.passportId ?? "",
  );
  const [logs, setLogs] = useState<FlowLog[]>(initialLogs);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [taskTopic, setTaskTopic] = useState(DEFAULT_RESEARCH_TOPIC);
  const [researchResult, setResearchResult] =
    useState<ResearchResult | null>(null);
  const busy = running || api.pending || api.source === "loading";

  const passport =
    registry.passports.find((item) => item.passportId === selectedPassportId) ??
    registry.passports[0];
  const license = registry.licenses.find(
    (item) => item.passportId === passport?.passportId && !item.revoked,
  );
  const service = registry.services.find(
    (item) => item.passportId === passport?.passportId,
  );
  const receipt = passport ? lastReceipt(registry, passport.passportId) : undefined;

  const updateLog = (id: string, patch: Partial<FlowLog>) => {
    setLogs((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const runFlow = async (reject = false) => {
    if (!passport || !license || !service || busy) {
      return;
    }

    setRunning(true);
    setError("");
    setLogs(initialLogs());
    setResearchResult(null);

    try {
      const { quotaToStateHex, readSkillGate, stepLicenseQuota } = await import(
        "../lib/xlayer"
      );
      updateLog("passport", {
        detail: `${passport.displayName} · ${passport.version}`,
        status: "success",
      });
      updateLog("license", {
        detail: reject
          ? "受控拒绝测试：不提交有效 License"
          : `${DEMO_AGENTS.buyer.displayName} · 剩余 ${license.quota}`,
        status: "success",
      });

      const gateInput = reject ? "0xd100" : "0xfb00";
      const gateStart = performance.now();
      const gate = await readSkillGate(gateInput);
      updateLog("gate", {
        detail: `${gate.raw} · allow=${gate.allow ? 1 : 0} · route=${gate.routeId}`,
        status: gate.allow || reject ? "success" : "error",
      });

      const quotaInput = reject ? "0x05" : "0x07";
      const quotaStart = performance.now();
      const quota = await stepLicenseQuota(
        quotaToStateHex(license.quota),
        quotaInput,
      );
      updateLog("quota", {
        detail: `stateOut=${quota.rawStateOut} · remaining=${quota.remaining} · deny=${quota.denyReason}`,
        status: reject ? "success" : quota.allow ? "success" : "error",
      });

      if (!reject && gate.allow && quota.allow) {
        const receiptId = `receipt:${crypto.randomUUID()}`;
        let delivery: ResearchResult;
        if (api.source === "chain") {
          const response = await fetch("/api/services/research-to-story", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              topic: taskTopic,
              sources: DEFAULT_RESEARCH_SOURCES,
            }),
          });
          const payload = await response.json();
          if (!response.ok || !payload.ok) {
            throw new Error(payload.error || "Research-to-Story task failed");
          }
          delivery = payload.data as ResearchResult;
        } else {
          const result = {
            brief:
              "Agent Skills need identity, licenses, quota, routing, and receipts to become accountable economic objects.",
            keyFacts: [
              "TapeOut Circuits compute deterministic authorization without storing state.",
              "The Trust Registry persists License and quota state.",
              "OKX.AI remains the commercial delivery and reputation layer.",
            ],
            risks: [
              "A receipt proves a recorded result, not the truth of every source.",
            ],
            contentAngles: [
              "A skill is more useful when it can prove who may use it.",
            ],
            story:
              "A small cow found a reusable skill floating inside the spacecraft. It could not take the skill with it, so it built a passport, borrowed a license, and left a receipt behind.",
            imagePrompt:
              "A tiny IMOO calf examining a glowing skill passport inside a quiet spacecraft.",
            citations: DEFAULT_RESEARCH_SOURCES.map((source) => ({
              title: source.title,
              url: source.url,
              claim: source.excerpt,
            })),
          };
          delivery = {
            provider: "local",
            model: "local-fallback",
            modelDisplayName: "Local fallback",
            topic: taskTopic,
            sources: DEFAULT_RESEARCH_SOURCES.map(({ title, url }) => ({
              title,
              url,
            })),
            result,
            resultHash: hashObject(result),
          };
        }
        setResearchResult(delivery);
        const receiptInput = {
          passportId: passport.passportId,
          licenseId: license.licenseId,
          requesterAgentId: DEMO_AGENTS.buyer.id,
          serviceId: service.serviceId,
          requestHash: hashObject({
            topic: taskTopic,
            sources: DEFAULT_RESEARCH_SOURCES.map(({ title, url }) => ({
              title,
              url,
            })),
          }),
          resultHash: delivery.resultHash,
          status: "DELIVERED",
          gateOutput: gate.raw,
          quotaStateOut: quota.rawStateOut,
          note: `${delivery.modelDisplayName} · 链上计算 ${Math.round(
            performance.now() - gateStart,
          )}ms / ${Math.round(performance.now() - quotaStart)}ms`,
        } satisfies Omit<CallReceipt, "receiptId" | "createdAt">;
        if (
          !(await api.updateQuota(
            license.licenseId,
            quota.remaining,
            receiptId,
          ))
        ) {
          throw new Error(api.error || "Quota state write failed");
        }
        if (!(await api.addReceipt(receiptInput, receiptId))) {
          throw new Error(api.error || "Receipt write failed");
        }
        updateLog("service", {
          detail: `${service.name} · ${delivery.modelDisplayName}`,
          status: "success",
        });
        updateLog("receipt", {
          detail:
            api.source === "chain"
              ? "Receipt 已写入 X Layer TrustRegistry"
              : "Receipt 已写入本地参考 Registry",
          status: "success",
        });
      } else {
        const receiptInput = {
          passportId: passport.passportId,
          licenseId: license.licenseId,
          requesterAgentId: DEMO_AGENTS.buyer.id,
          serviceId: service.serviceId,
          requestHash: hashObject({ rejectTest: true }),
          resultHash: hashObject({ rejected: true }),
          status: "REJECTED",
          gateOutput: gate.raw,
          quotaStateOut: quota.rawStateOut,
          note: "受控拒绝测试：License 无效",
        } satisfies Omit<CallReceipt, "receiptId" | "createdAt">;
        if (!(await api.addReceipt(receiptInput))) {
          throw new Error(api.error || "Rejected receipt write failed");
        }
        updateLog("service", {
          detail: "Service 未执行",
          status: "neutral",
        });
        updateLog("receipt", {
          detail: "已创建 REJECTED Receipt",
          status: "success",
        });
      }
    } catch (flowError) {
      const message =
        flowError instanceof Error ? flowError.message : String(flowError);
      setError(message);
      setLogs((current) =>
        current.map((item) =>
          item.status === "pending"
            ? { ...item, detail: "流程已停止", status: "error" }
            : item,
        ),
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>SkillPass Control Room</h1>
          <p>管理 Skill 身份、License、额度、路由和交付凭证。</p>
        </div>
        <div className="page-actions">
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => runFlow(true)}
          >
            <CircleSlash2 size={16} />
            拒绝场景
          </button>
          <button
            className="button primary"
            disabled={busy}
            onClick={() => runFlow(false)}
          >
            {busy ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <Play size={16} />
            )}
            运行受控闭环
          </button>
        </div>
      </header>

      <ChainStatus />

      <section className="metrics">
        <Metric
          label="Skill Passports"
          value={String(registry.passports.length)}
          detail="稳定经济身份"
        />
        <Metric
          label="Active Licenses"
          value={String(registry.licenses.filter((item) => !item.revoked).length)}
          detail="per-call / limited"
        />
        <Metric
          label="Receipts"
          value={String(registry.receipts.length)}
          detail="成功与拒绝均留痕"
          tone={registry.receipts.length ? "success" : "neutral"}
        />
        <Metric
          label="Registry"
          value={api.source === "chain" ? "X Layer" : "Local Cache"}
          detail={
            api.source === "chain" ? "TrustRegistry authority" : "Bridge unavailable"
          }
          tone={api.source === "chain" ? "success" : "warning"}
        />
      </section>

      <section className="task-composer">
        <label>
          <span>Research-to-Story 任务</span>
          <input
            value={taskTopic}
            onChange={(event) => setTaskTopic(event.target.value)}
            disabled={busy}
          />
        </label>
        <div>
          <small>Sources</small>
          <strong>{DEFAULT_RESEARCH_SOURCES.length} 条已核验摘录</strong>
        </div>
        <div>
          <small>Service</small>
          <strong>{service?.name ?? "research_to_story"}</strong>
        </div>
      </section>

      <section className="pipeline" aria-label="受控闭环">
        {FLOW_STEPS.map((step, index) => {
          const Icon = step.icon;
          const log = logs.find((item) => item.id === step.key);
          return (
            <div className="pipeline-segment" key={step.key}>
              <div className={`pipeline-node ${log?.status ?? "pending"}`}>
                <Icon size={17} />
                <span>
                  <strong>{step.label}</strong>
                  <small>{log?.detail}</small>
                </span>
              </div>
              {index < FLOW_STEPS.length - 1 && (
                <ArrowRight className="pipeline-arrow" size={16} />
              )}
            </div>
          );
        })}
      </section>

      {(error || api.error) && (
        <div className="error-banner">{error || api.error}</div>
      )}

      <div className="workspace">
        <section className="list-panel">
          <div className="section-head">
            <div>
              <h2>Skill Passports</h2>
              <p>选择一项能力查看当前商业状态。</p>
            </div>
            <span>{registry.passports.length} total</span>
          </div>
          <div className="skill-list">
            {registry.passports.map((item) => {
              const currentLicense = registry.licenses.find(
                (candidate) =>
                  candidate.passportId === item.passportId &&
                  !candidate.revoked,
              );
              return (
                <button
                  key={item.passportId}
                  className={
                    item.passportId === passport?.passportId ? "selected" : ""
                  }
                  onClick={() => setSelectedPassportId(item.passportId)}
                >
                  <span className="skill-icon">
                    <Fingerprint size={18} />
                  </span>
                  <span className="skill-copy">
                    <strong>{item.displayName}</strong>
                    <small>
                      {item.version} · {item.skillKey}
                    </small>
                  </span>
                  <span className={`status ${item.status.toLowerCase()}`}>
                    {currentLicense?.quota ?? 0} quota
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="detail-panel">
          {passport ? (
            <>
              <div className="section-head">
                <div>
                  <h2>{passport.displayName}</h2>
                  <p>{passport.passportId}</p>
                </div>
                <span className="status published">{passport.status}</span>
              </div>
              <dl className="definition-list">
                <div>
                  <dt>Owner</dt>
                  <dd>{passport.owner}</dd>
                </div>
                <div>
                  <dt>Version</dt>
                  <dd>{passport.version}</dd>
                </div>
                <div>
                  <dt>License</dt>
                  <dd>{passport.licenseMode}</dd>
                </div>
                <div>
                  <dt>Quota Remaining</dt>
                  <dd>{license?.quota ?? 0}</dd>
                </div>
                <div>
                  <dt>Service</dt>
                  <dd>{service?.available ? "Available" : "Unavailable"}</dd>
                </div>
                <div>
                  <dt>Capability Circuit</dt>
                  <dd>#{passport.capabilityCircuitId}</dd>
                </div>
              </dl>
              <div className="receipt-preview">
                <div>
                  <small>Last gate</small>
                  <strong>
                    {receipt?.gateOutput
                      ? compactHex(receipt.gateOutput)
                      : "未运行"}
                  </strong>
                </div>
                <div>
                  <small>Last stateOut</small>
                  <strong>{receipt?.quotaStateOut ?? "未运行"}</strong>
                </div>
                <div>
                  <small>Last receipt</small>
                  <strong>{receipt?.status ?? "未生成"}</strong>
                </div>
              </div>
              {researchResult && (
                <div className="service-result">
                  <div className="section-head">
                    <div>
                      <h2>Latest Service Result</h2>
                      <p>{researchResult.modelDisplayName}</p>
                    </div>
                    <span>{researchResult.sources.length} sources</span>
                  </div>
                  <p>{researchResult.result.brief}</p>
                  <blockquote>{researchResult.result.story}</blockquote>
                  <small>Prompt: {researchResult.result.imagePrompt}</small>
                </div>
              )}
              <a
                className="contract-link"
                href={`${CHAIN_CONFIG.explorerUrl}/address/${CHAIN_CONFIG.processorAddress}`}
                target="_blank"
                rel="noreferrer"
              >
                查看真实 Processor 合约
                <ArrowRight size={14} />
              </a>
            </>
          ) : (
            <div className="empty">尚未创建 Skill Passport。</div>
          )}
        </section>
      </div>
    </div>
  );
}
