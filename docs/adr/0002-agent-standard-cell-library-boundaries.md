# ADR 0002: Agent Standard Cell Library Boundaries

状态：已接受，产品层级由 ADR 0003 补充；OKX.AI 商业边界由 ADR 0005 修正

## Context

Remembrance Seal already demonstrates a generic Agent action-permission
system on X Layer with ALLOW-ONCE and DEADMAN circuits.

TapeOut官方同时明确：

- Circuit 是 ERC-721 逻辑资产；
- Circuit 不能调用其他合约；
- Circuit 不能写入持久状态；
- 组合逻辑使用 `eval`；
- 时序逻辑使用 `step`；
- X Layer 当前不能把已经流片的 Circuit 重新作为画布子电路；
- X Layer 当前不能流片引用子电路的组合图。

原方案把整个项目压缩为一枚 `Agent Skill Entitlement Router`，容易与
Remembrance Seal 重复，也会让通用基础设施看起来像一颗普通门电路。

## Decision

1. 项目的上位定位是 `Agent Trust & Capability Standard`。
2. 核心产品是 `Agent Standard Cell Library`，不是单枚 Trust Cell。
3. 黑客松 Processor 使用 `Agent Standard Cells` 定位。
4. V1 至少交付 `Skill Gate` 和 `License Quota Step` 两枚标准单元。
5. `Route & Royalty` 和 `Receipt Mode` 按时间追加。
6. Circuit 只负责纯逻辑计算。
7. Trust Registry 保存 License、额度、撤销、所有权和 Receipt 引用。
8. Container 只承担资产和公开入口，不承担唯一状态权威。
9. OKX.AI 继续承担 Agent 服务市场、服务付款、服务交付和服务评价；资产所有权买断见
   ADR 0005。
10. Remembrance Seal 负责通用动作权限；本项目负责能力、许可证和商业路由。
11. X Layer V1 的单元组合在应用层完成，不宣称链上子电路组合。
12. 不得再用“Circuit 自己保存状态”描述系统行为。

## Consequences

正向：

- 项目恢复通用基础设施定位；
- 与已有项目形成明确差异；
- 技术描述与 TapeOut 官方能力一致；
- 允许多个 Agent、游戏、支付和 Vault 复用相同单元；
- 为 Genesis 标准留下足够叙事空间。

负向：

- X Layer V1 无法展示电路级黑盒组合；
- Trust Registry 成为必须开发的组件；
- 工作量比单枚 Circuit 更大；
- 必须控制范围，避免一次实现所有标准单元。

## Rejected Alternatives

### 只部署一枚 Trust Cell

拒绝。技术上可行，但定位过窄，且与 Remembrance Seal 高度重叠。

### 把所有状态放进 Circuit

拒绝。违反 TapeOut 官方技术边界。

### 直接复制 Remembrance Seal

拒绝。ALLOW-ONCE 和 DEADMAN 已经存在。

### 一次完成完整 Agent Economy

拒绝。范围过大，无法在黑客松周期内形成可信闭环。

### 宣称 X Layer 已支持子电路组合

拒绝。当前页面明确表示已在 X Layer 流片的电路不能重新铺回画布，引用子电路的图也不能流到该链。
