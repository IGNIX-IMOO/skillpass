# ADR 0005：服务商业与资产商业分离

状态：已接受

日期：2026-09-24

相关文档：

- `SKILLPASS_PRODUCT_V1.md`
- `AGENT_COMPANY_PROTOCOL_V1.md`
- `SKILL_ASSET_ENCRYPTION_V1.md`

## 背景

项目此前把两条不同的商业路径混在一起：

1. 买方雇用 Agent 执行一次服务；
2. 买方买走 Skill 或知识资产的所有权。

OKX.AI 能处理第一种交易，但不负责第二种交易。把 Skill 所有权买断包装成
OKX.AI Service Order，会让订单、付款、交付、退款、评价和 Receipt 的语义全部
混乱。

## 决定

1. OKX.AI 是 Agent 服务商业层的唯一权威。
2. OKX.AI 负责 Service Order、服务付款、服务交付、服务退款、服务争议和服务评价。
3. SkillPass Ownership Sale 是资产所有权买断的唯一入口。
4. 买断在 SkillPass 站内直接完成，买方钱包直接与 Ownership Sale 合约交互。
5. Ownership Order 和 OKX.AI Service Order 使用不同的 ID、状态机、Receipt 和争议
   流程。
6. Ownership Sale 合约只处理资产买断、款项暂存、阈值份额交付、退款、放款和所有权
   转移约束，不成为通用 Agent 服务市场。
7. 买方付款后，自动交付引擎验证订单，阈值节点向买方发送加密份额，合约自动转移
   Registry 所有权并完成放款。正常流程不要求买方再次确认。
8. V1 不把 Ownership Sale 合约设为 Trust Registry 的全局 controller。
9. V2 为 Trust Registry 增加按 Passport 限定的 Ownership Sale 转移权限，避免买断
   合约获得转移全部 Passport 的能力。

## 对既有决定的影响

本 ADR 修正但不完全废弃 ADR 0001 和 ADR 0002：

- ADR 0001 的 OKX.AI 权威范围收窄为 Agent 服务商业。
- ADR 0001 拒绝“第二套支付和托管”的理由只适用于 Agent 服务订单。
- ADR 0002 的 OKX.AI 市场、付款、交付和评价范围同样收窄为 Agent 服务。
- 资产所有权买断不属于重复建设，因为 OKX.AI 不提供该交易。

## 结果

正面：

- 两条商业路径清晰；
- 买断可以围绕资产版本、钥匙和所有权设计；
- 服务评价不会污染资产交易信誉；
- 资产交易可以拥有独立退款和争议规则；
- 后续可以扩展为知识资产交易协议。

负面：

- 需要开发和维护 Ownership Sale 合约；
- 需要新增 Ownership Exchange 页面；
- Trust Registry 后续需要受限转移权限；
- 付款资产、交付期限和争议流程仍需确定。

## 拒绝的方案

### 所有买断都走 OKX.AI

拒绝。OKX.AI Service Order 表达的是服务工作，不表达资产所有权转移和加密钥匙交付。

### 直接给卖方钱包转账

拒绝。直接转账无法在卖方不交付时保护买方。

### 建立一个完整通用市场

V1 拒绝。当前只实现与 SkillPass 资产直接关联的站内买断，不复制 OKX.AI 的通用服务
市场。
