import { Activity, Boxes, Cpu, Database, ExternalLink } from "lucide-react";
import { CHAIN_CONFIG } from "../config";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function ChainStatus() {
  return (
    <section className="chain-status" aria-label="链上状态">
      <div className="chain-title">
        <Activity size={18} />
        <span>
          <strong>{CHAIN_CONFIG.chainName} 已连接</strong>
          <small>只读调用，不触发钱包交易</small>
        </span>
      </div>

      <div className="chain-item">
        <Cpu size={16} />
        <span>
          <small>Processor</small>
          <strong>{shortAddress(CHAIN_CONFIG.processorAddress)}</strong>
        </span>
        <a
          href={`${CHAIN_CONFIG.explorerUrl}/address/${CHAIN_CONFIG.processorAddress}`}
          target="_blank"
          rel="noreferrer"
          aria-label="查看 Processor"
        >
          <ExternalLink size={14} />
        </a>
      </div>

      <div className="chain-item">
        <Boxes size={16} />
        <span>
          <small>Standard Cells</small>
          <strong>Gate #{CHAIN_CONFIG.skillGateCircuitId} · Quota #{CHAIN_CONFIG.licenseQuotaCircuitId}</strong>
        </span>
      </div>

      <div className="chain-item">
        <Database size={16} />
        <span>
          <small>Trust Registry</small>
          <strong>{shortAddress(CHAIN_CONFIG.trustRegistryAddress)}</strong>
        </span>
        <a
          href={`${CHAIN_CONFIG.explorerUrl}/address/${CHAIN_CONFIG.trustRegistryAddress}`}
          target="_blank"
          rel="noreferrer"
          aria-label="查看 Trust Registry"
        >
          <ExternalLink size={14} />
        </a>
      </div>
    </section>
  );
}
