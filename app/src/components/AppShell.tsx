import type { ReactNode } from "react";
import {
  CircleDot,
  FileCheck2,
  Fingerprint,
  Github,
  KeyRound,
  Presentation,
  RadioTower,
  Scale,
  SearchCheck,
} from "lucide-react";
import { PUBLIC_BUILD, REPOSITORY_URL } from "../config";

export type ViewKey =
  | "overview"
  | "demo"
  | "ownership"
  | "verify"
  | "passports"
  | "licenses"
  | "services"
  | "receipts"
  | "rights";

const NAV_ITEMS: Array<{
  key: ViewKey;
  label: string;
  secondary: string;
  icon: typeof CircleDot;
}> = [
  { key: "overview", label: "Overview", secondary: "运行总览", icon: CircleDot },
  { key: "demo", label: "Use a Skill", secondary: "使用技能", icon: Presentation },
  { key: "ownership", label: "Own a Skill", secondary: "拥有技能", icon: KeyRound },
  { key: "verify", label: "Verify", secondary: "公开验证", icon: SearchCheck },
  { key: "passports", label: "Skill Passport", secondary: "技能护照", icon: Fingerprint },
  { key: "licenses", label: "License Desk", secondary: "许可证", icon: KeyRound },
  { key: "services", label: "Service Console", secondary: "服务控制台", icon: RadioTower },
  { key: "receipts", label: "Receipts", secondary: "调用凭证", icon: FileCheck2 },
  { key: "rights", label: "Rights & Revenue", secondary: "权利与收入", icon: Scale },
];

// The published bundle has no registry bridge. Everything except the read-only
// pages would open with local fallback data, so those entries are hidden
// rather than shown broken.
const CONSOLE_VIEWS: ViewKey[] = [
  "passports",
  "licenses",
  "services",
  "receipts",
  "rights",
];

const VISIBLE_ITEMS = PUBLIC_BUILD
  ? NAV_ITEMS.filter((item) => !CONSOLE_VIEWS.includes(item.key))
  : NAV_ITEMS;

export function AppShell({
  activeView,
  onSelect,
  children,
}: {
  activeView: ViewKey;
  onSelect: (view: ViewKey) => void;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => onSelect("overview")}>
          <span className="brand-mark">
            S<i>P</i>
          </span>
          <span>
            <strong>SkillPass</strong>
            <small>Agent Commerce IP</small>
          </span>
        </button>

        <nav className="nav">
          {VISIBLE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={activeView === item.key ? "active" : ""}
                onClick={() => onSelect(item.key)}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span className="nav-copy">
                  <strong>{item.label}</strong>
                  <small>{item.secondary}</small>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <span className="status-dot" />
          <span>
            <strong>Controlled Demo</strong>
            <small>受控演示 · 角色隔离</small>
          </span>
        </div>
        <a
          className="sidebar-source"
          href={REPOSITORY_URL}
          target="_blank"
          rel="noreferrer"
        >
          <Github size={15} />
          <span>
            <strong>GitHub Repository</strong>
            <small>公开源码与参赛材料</small>
          </span>
        </a>
      </aside>

      <main className="main">{children}</main>
    </div>
  );
}
