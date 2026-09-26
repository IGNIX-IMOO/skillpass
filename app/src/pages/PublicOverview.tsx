import {
  ArrowRight,
  BadgeCheck,
  FileCheck2,
  Fingerprint,
  Github,
  KeyRound,
  LockKeyhole,
  Network,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import type { ViewKey } from "../components/AppShell";
import { ButtonLabel, PageTitle } from "../components/Bilingual";
import {
  CHAIN_CONFIG,
  PUBLIC_DEMO_EVIDENCE,
  REPOSITORY_URL,
} from "../config";

const flow = [
  {
    title: "SkillPassport",
    short: "技能护照",
    copy: "确认 Skill 身份、版本和 Creator Proof",
    icon: Fingerprint,
  },
  {
    title: "License + Gate",
    short: "许可与闸门",
    copy: "授权调用，并由 Circuit 决定是否放行",
    icon: ShieldCheck,
  },
  {
    title: "Receipt",
    short: "调用凭证",
    copy: "记录一次真实调用和执行结果",
    icon: ReceiptText,
  },
  {
    title: "Ownership Sale",
    short: "所有权买断",
    copy: "买方在站内直接买断完整资产",
    icon: BadgeCheck,
  },
  {
    title: "2-of-3 Delivery",
    short: "阈值交付",
    copy: "两个节点自动返回加密份额",
    icon: LockKeyhole,
  },
  {
    title: "Owner",
    short: "资产所有者",
    copy: "买方获得解密能力和链上所有权",
    icon: KeyRound,
  },
];

const lanes = [
  {
    label: "ON-CHAIN",
    title: "On-Chain",
    secondary: "已经上链",
    copy: "Processor、两枚 Circuit、Trust Registry、TapeOut Container 和公开验证页面。",
    items: ["Skill Gate", "License Quota", "Trust Registry", "Public Receipt"],
  },
  {
    label: "COMPETITION DEMO",
    title: "Competition Demo",
    secondary: "比赛演示",
    copy: "把买断和自动交付接在真实 SkillPass 闭环之后，使用本地测试付款。",
    items: ["Ownership Sale", "Node A / B / C", "2-of-3 delivery", "Browser decrypt"],
  },
  {
    label: "ROADMAP",
    title: "Roadmap",
    secondary: "后续网络",
    copy: "节点开放加入、多种代币质押、生产委员会、保险与治理。",
    items: ["Multi-token stake", "6-of-9", "8-of-11", "Insurance"],
  },
];

export function PublicOverview({
  onSelect,
}: {
  onSelect: (view: ViewKey) => void;
}) {
  return (
    <div className="page public-overview">
      <header className="page-head overview-head">
        <div>
          <span className="eyebrow">SkillPass · Agent Commerce IP</span>
          <PageTitle
            primary="From using a Skill to owning it."
            secondary="从一个技能的使用，到真正拥有它。"
          />
          <p>
            One continuous loop for identity, permission, proof, ownership and
            threshold delivery.
          </p>
        </div>
        <div className="page-actions">
          <button className="button primary" onClick={() => onSelect("demo")}>
            <ButtonLabel
              primary="Use a Skill"
              secondary="使用技能"
              icon={<ArrowRight size={15} />}
            />
          </button>
          <button className="button secondary" onClick={() => onSelect("ownership")}>
            <ButtonLabel primary="Own a Skill" secondary="拥有技能" />
          </button>
          <a
            className="button secondary"
            href={REPOSITORY_URL}
            target="_blank"
            rel="noreferrer"
          >
            <ButtonLabel
              primary="GitHub"
              secondary="查看源码"
              icon={<Github size={15} />}
            />
          </a>
        </div>
      </header>

      <section className="overview-status" aria-label="项目状态">
        <div>
          <small>Processor</small>
          <strong>Live on X Layer</strong>
          <span>{shortAddress(CHAIN_CONFIG.processorAddress)}</span>
        </div>
        <div>
          <small>Circuits</small>
          <strong>2 deployed</strong>
          <span>Skill Gate · License Quota</span>
        </div>
        <div>
          <small>Reference Skill</small>
          <strong>Research-to-Story</strong>
          <span>{PUBLIC_DEMO_EVIDENCE.service}</span>
        </div>
        <div>
          <small>Competition delivery</small>
          <strong>2-of-3</strong>
          <span>Node C intentionally offline</span>
        </div>
      </section>

      <section className="overview-section">
        <div className="section-head">
          <div>
            <h2>Commercial Loop</h2>
            <p>完整商业闭环 · 使用证明价值，买断交付能力，最后确认所有权。</p>
          </div>
          <Network size={18} />
        </div>
        <div className="overview-flow">
          {flow.map((item, index) => {
            const Icon = item.icon;
            return (
              <div className="overview-flow-item" key={item.title}>
                <span className="overview-flow-icon">
                  <Icon size={18} />
                </span>
                <small>0{index + 1}</small>
                <strong>{item.title}</strong>
                <span className="overview-flow-zh">{item.short}</span>
                <p>{item.copy}</p>
                {index < flow.length - 1 ? (
                  <ArrowRight className="overview-flow-arrow" size={16} />
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="overview-section">
        <div className="section-head">
          <div>
            <h2>Scope Boundaries</h2>
            <p>能力边界 · 真实链上、比赛演示和后续网络分别标记。</p>
          </div>
        </div>
        <div className="overview-lanes">
          {lanes.map((lane) => (
            <article className="overview-lane" key={lane.label}>
              <span>{lane.label}</span>
              <h3>{lane.title}</h3>
              <small className="overview-lane-zh">{lane.secondary}</small>
              <p>{lane.copy}</p>
              <ul>
                {lane.items.map((item) => (
                  <li key={item}>
                    <FileCheck2 size={14} />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="overview-next">
        <div>
          <small>Competition video · 2:45</small>
          <strong>Use → Prove → Buy → Deliver → Own</strong>
        </div>
        <button className="button primary" onClick={() => onSelect("demo")}>
          <ButtonLabel
            primary="Start Demo"
            secondary="开始演示"
            icon={<ArrowRight size={15} />}
          />
        </button>
      </section>
    </div>
  );
}

function shortAddress(value: string) {
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}
