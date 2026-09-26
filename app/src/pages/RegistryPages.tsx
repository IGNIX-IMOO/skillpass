import { Plus, RotateCcw, ShieldOff, ToggleLeft, ToggleRight } from "lucide-react";
import type { ReactNode } from "react";
import type { RegistryState, SkillPassport } from "../types";
import { DEMO_AGENTS } from "../config";

function compactHex(value: string) {
  const trimmed = value.replace(/^0x/i, "").replace(/^0+/, "");
  return `0x${trimmed || "0"}`;
}

function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="page-actions">{action}</div>}
    </header>
  );
}

export function PassportsPage({
  registry,
  onCreate,
}: {
  registry: RegistryState;
  onCreate: (
    input: Omit<SkillPassport, "passportId" | "creatorProof" | "updatedAt">,
  ) => Promise<boolean>;
}) {
  const addPassport = async () => {
    await onCreate({
      namespace: "ignix.skillpass.demo",
      skillKey: `content_router_${registry.passports.length + 1}`,
      displayName: `Content Router ${registry.passports.length + 1}`,
      version: "0.1.0",
      creatorAgentId: DEMO_AGENTS.creator.id,
      owner: DEMO_AGENTS.creator.displayName,
      status: "PUBLISHED",
      licenseMode: "per_call",
      serviceId: `service:content_router_${registry.passports.length + 1}`,
      capabilityCircuitId: "1",
    });
  };

  return (
    <div className="page">
      <PageHeader
        title="Skill Passport"
        description="Skill 的稳定经济身份。Circuit ID 与 Passport ID 保持分离。"
        action={
          <button className="button primary" onClick={addPassport}>
            <Plus size={16} />
            新建 Demo Passport
          </button>
        }
      />
      <DataTable
        headers={["Skill", "Passport ID", "Version", "Owner", "Circuit", "Status"]}
        rows={registry.passports.map((item) => [
          item.displayName,
          item.passportId,
          item.version,
          item.owner,
          `#${item.capabilityCircuitId}`,
          item.status,
        ])}
      />
    </div>
  );
}

export function LicensesPage({
  registry,
  onIssue,
  onRevoke,
}: {
  registry: RegistryState;
  onIssue: (
    passportId: string,
    agentId: string,
    quota?: number,
  ) => Promise<boolean>;
  onRevoke: (licenseId: string) => Promise<boolean>;
}) {
  const addLicense = async () => {
    const passport = registry.passports[0];
    if (!passport) return;
    await onIssue(passport.passportId, DEMO_AGENTS.buyer.id, 3);
  };

  const revoke = async (licenseId: string) => {
    await onRevoke(licenseId);
  };

  return (
    <div className="page">
      <PageHeader
        title="License Desk"
        description="发放、查看和撤销 License。额度状态由 Registry 保存。"
        action={
          <button className="button primary" onClick={addLicense}>
            <Plus size={16} />
            发放 License
          </button>
        }
      />
      <DataTable
        headers={["License", "Licensee", "Mode", "Quota", "Royalty", "State", ""]}
        rows={registry.licenses.map((item) => [
          item.licenseId,
          item.licenseeAgentId,
          item.mode,
          String(item.quota),
          String(item.royaltyBucket),
          item.revoked ? "REVOKED" : "ACTIVE",
          item.revoked ? null : (
            <button
              className="icon-button"
              title="撤销 License"
              onClick={() => revoke(item.licenseId)}
            >
              <ShieldOff size={15} />
            </button>
          ),
        ])}
      />
    </div>
  );
}

export function ServicesPage({
  registry,
  onToggle,
}: {
  registry: RegistryState;
  onToggle: (serviceId: string) => Promise<boolean>;
}) {
  const toggle = async (serviceId: string) => {
    await onToggle(serviceId);
  };

  return (
    <div className="page">
      <PageHeader
        title="Service Console"
        description="展示 OKX.AI Service 绑定、运营方与可用性。"
      />
      <DataTable
        headers={["Service", "Operator", "Binding", "Price", "Success", "Available"]}
        rows={registry.services.map((item) => [
          item.name,
          item.operatorAgentId,
          item.endpointReference,
          item.price,
          `${Math.round(item.successRate * 100)}%`,
          <button
            className="toggle-button"
            onClick={() => toggle(item.serviceId)}
          >
            {item.available ? <ToggleRight size={29} /> : <ToggleLeft size={29} />}
            {item.available ? "Available" : "Paused"}
          </button>,
        ])}
      />
    </div>
  );
}

export function ReceiptsPage({ registry }: { registry: RegistryState }) {
  return (
    <div className="page">
      <PageHeader
        title="Receipts"
        description="每次成功或拒绝都留下可审计记录。"
      />
      {registry.receipts.length === 0 ? (
        <div className="empty large">运行一次受控闭环后，Receipt 会出现在这里。</div>
      ) : (
        <DataTable
          headers={["Receipt", "Requester", "Gate", "StateOut", "Result", "Status"]}
          rows={registry.receipts.map((item) => [
            item.receiptId,
            item.requesterAgentId,
            compactHex(item.gateOutput),
            item.quotaStateOut ?? "—",
            item.resultHash,
            item.status,
          ])}
        />
      )}
    </div>
  );
}

export function RightsPage({
  registry,
  onReset,
  canReset,
}: {
  registry: RegistryState;
  onReset: () => void;
  canReset: boolean;
}) {
  return (
    <div className="page">
      <PageHeader
        title="Rights & Revenue"
        description="V1 展示权利与分账规则，不展示或承诺收益。"
        action={
          <button
            className="button secondary"
            onClick={onReset}
            disabled={!canReset}
          >
            <RotateCcw size={16} />
            {canReset ? "重置本地 Registry" : "链上 Registry 不可重置"}
          </button>
        }
      />
      <div className="rights-grid">
        <section>
          <span>Creator Proof</span>
          <strong>{registry.passports[0]?.creatorProof ?? "—"}</strong>
          <p>创作者证明不可转移，所有权变化不会修改 Creator Proof。</p>
        </section>
        <section>
          <span>Royalty Bucket</span>
          <strong>{registry.licenses[0]?.royaltyBucket ?? 0}</strong>
          <p>当前 Demo 使用桶 0，最终分账由 Route & Royalty Cell 决定。</p>
        </section>
        <section>
          <span>Revenue Recipient</span>
          <strong>{registry.passports[0]?.owner ?? "—"}</strong>
          <p>收入权利与 Service 运营权独立记录。</p>
        </section>
        <section>
          <span>Registry Authority</span>
          <strong>X Layer TrustRegistry</strong>
          <p>持久权利、License、额度和 Receipt 均从链上状态读取。</p>
        </section>
      </div>
    </div>
  );
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<Array<ReactNode>>;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
