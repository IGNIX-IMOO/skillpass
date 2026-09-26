import { ExternalLink, LoaderCircle, Search } from "lucide-react";
import { useState } from "react";
import { ButtonLabel, PageTitle, TwoLineLabel } from "../components/Bilingual";
import { CHAIN_CONFIG } from "../config";
import type { RegistryObject, RegistryObjectKind } from "../lib/xlayer";

// The Trust Registry answers by id only, so this index is maintained by hand
// rather than discovered. The lookup box accepts anything, including ids that
// are not listed here.
const KNOWN: Array<{ kind: RegistryObjectKind; ids: string[] }> = [
  { kind: "passport", ids: ["passport:research_to_story"] },
  {
    kind: "license",
    ids: ["license:research_to_story:refill_1", "license:controlled_demo_buyer"],
  },
  { kind: "service", ids: ["service:research_to_story"] },
  {
    kind: "receipt",
    ids: [
      "receipt:e21c4f79-1a67-4042-875a-4dd8e2ad9710",
      "receipt:ee3a9282-59b2-4676-9d31-f4c45d4d36b1",
      "receipt:d2fc62d5-24c6-4824-a892-0108fca105df",
      "receipt:00b3a70a-77bc-42b7-a932-71c7b062024b",
      "receipt:controlled_demo_1",
    ],
  },
];

const KIND_LABEL: Record<RegistryObjectKind, string> = {
  passport: "Skill Passport",
  license: "License",
  service: "Service",
  receipt: "Receipt",
};

const KIND_LABEL_ZH: Record<RegistryObjectKind, string> = {
  passport: "技能护照",
  license: "许可证",
  service: "服务",
  receipt: "调用凭证",
};

export function PublicVerify() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<RegistryObject | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function lookup(value: string) {
    const key = value.trim();
    if (!key || loading) return;
    setLoading(true);
    setError("");
    try {
      const { readRegistryObject } = await import("../lib/xlayer");
      setResult(await readRegistryObject(key));
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page public-verify">
      <header className="page-head">
        <div>
          <PageTitle primary="Verify on X Layer" secondary="链上核验" />
          <p>
            粘贴任意 ID，直接读 X Layer 上的原始记录。这个页面本身也存在链上，
            每个文件都按链上声明的 SHA-256 逐字节核对。
          </p>
        </div>
      </header>

      <section className="verify-lookup">
        <label>
          <span>对象 ID</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void lookup(query);
            }}
            placeholder="passport:research_to_story"
            spellCheck={false}
          />
        </label>
        <button
          className="button primary"
          disabled={loading || query.trim().length === 0}
          onClick={() => void lookup(query)}
        >
          <ButtonLabel
            primary="Verify"
            secondary="核验"
            icon={
              loading ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <Search size={16} />
              )
            }
          />
        </button>
      </section>

      {error ? (
        <div className="error-banner">{error}</div>
      ) : null}

      {result ? (
        <section className="panel verify-result">
          <div className="section-head">
            <div>
              <h2>{KIND_LABEL[result.kind]}</h2>
              <p className="section-zh">{KIND_LABEL_ZH[result.kind]}</p>
              <p>{result.key}</p>
            </div>
            <span>读取自 X Layer</span>
          </div>
          <dl className="definition-list">
            {result.fields.map((field) => (
              <div key={field.label}>
                <dt>{field.label}</dt>
                <dd style={field.mono ? { fontFamily: "ui-monospace, monospace" } : undefined}>
                  {field.value}
                </dd>
                {field.note ? <small className="verify-note">{field.note}</small> : null}
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <section className="panel verify-index">
        <div className="section-head">
          <div>
            <h2>Known Objects</h2>
            <p className="section-zh">已知对象</p>
            <p>合约只能按 ID 查询、不能枚举，所以这份清单是人工维护的索引。</p>
          </div>
          <span>{KNOWN.reduce((n, group) => n + group.ids.length, 0)} 个</span>
        </div>
        {KNOWN.map((group) => (
          <div className="verify-index-group" key={group.kind}>
            <h3>{KIND_LABEL[group.kind]}</h3>
            <small className="section-zh">{KIND_LABEL_ZH[group.kind]}</small>
            <div className="verify-index-ids">
              {group.ids.map((value) => (
                <button
                  key={value}
                  className={result?.key === value ? "active" : ""}
                  onClick={() => {
                    setQuery(value);
                    void lookup(value);
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="panel verify-chain">
        <div className="section-head">
          <div>
            <h2>This Page Is On-Chain</h2>
            <p className="section-zh">这条页面自己也是链上记录</p>
            <p>
              HTML、样式和脚本都存在电路 #1 的容器里，读取时逐个文件核对 SHA-256。
              没有服务器，没有域名，没有可以被关闭的账号。
            </p>
          </div>
        </div>
        <dl className="definition-list">
          <div>
            <dt><TwoLineLabel primary="Processor" secondary="处理器" /></dt>
            <dd style={{ fontFamily: "ui-monospace, monospace" }}>
              {CHAIN_CONFIG.processorAddress}
            </dd>
          </div>
          <div>
            <dt><TwoLineLabel primary="Trust Registry" secondary="注册表" /></dt>
            <dd style={{ fontFamily: "ui-monospace, monospace" }}>
              {CHAIN_CONFIG.trustRegistryAddress}
            </dd>
          </div>
        </dl>
        <a
          className="contract-link"
          href={`${CHAIN_CONFIG.explorerUrl}/address/${CHAIN_CONFIG.processorAddress}`}
          target="_blank"
          rel="noreferrer"
        >
          View Processor in Explorer
          <ExternalLink size={14} />
        </a>
      </section>
    </div>
  );
}
