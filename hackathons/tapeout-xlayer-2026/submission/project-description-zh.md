# SkillPass

状态：参赛发布候选，链上、视频和公开 Demo 证据已完成

## 项目名称

SkillPass

中文名：智能体技能许可证与商业路由协议

底层 Processor：Agent Standard Cells

产品类别：Agent Commerce IP Core Library

## 一句话介绍

一套让 Agent 能力可以被拥有、许可、调用、路由、分账和证明的产品，底层使用
Agent Standard Cells，商业服务接入 OKX.AI。

## 解决的问题

AI Agent 正在从工具变成可以接单、付款、交付和管理资产的独立执行者，但
Skill 的所有权、版本、License、额度、Service 路由和调用凭据仍主要存在于
后台数据库中。

SkillPass 把这些规则变成可查看、可许可、可调用和可证明的产品流程，并把
底层规则拆成可复用、永久公开、只读且不能作恶的 TapeOut Circuit。持久状态
由 Trust Registry 保存，商业付款、交付和评价继续由 OKX.AI 负责。

## Processor 的作用

该 Processor 为 SkillPass 提供一组统一接口的 Agent 能力标准单元。任何
Agent、游戏、支付应用、Vault 或其他合约都可以调用这些单元，而不需要复制
一套私有权限系统。

## V1 电路

### Skill Gate

```text
Skill 有效
AND License 有效
AND Service 可用
-> Allow
-> Route ID
-> Royalty Bucket
```

### License Quota Step（完整闭环通过后追加）

```text
当前额度 + 消费请求
-> Allow
-> Remaining
-> Deny Reason
```

Circuit 返回 `state_out`，Trust Registry 保存 `state_out`。

## 为什么使用 TapeOut

- Circuit 永久保存公开逻辑；
- 任何合约都能免费只读调用；
- 调用不需要钱包，也不产生交易；
- Circuit 不能转走资产或修改外部状态；
- 其他产品可以复用统一接口；
- 陌生人逻辑可以被安全使用；
- 未来可以扩展成更多标准单元。

## 与现有项目的关系

我们研究了 TapeOut 上已经存在的 X Layer 和 BNB 项目。

- BNB 已经形成 CPU、SHA-256、Keccak-256、NANDPU、PAYCORE 等可复用 IP Core；
- X Layer 更多集中在 Agent 权限、社区叙事和状态机；
- Remembrance Seal 主要解决权限记忆；
- LoteGate 展示了复杂状态机能力，但产品表达较弱；
- 很多项目只有铸造或故事，没有真实 Circuit 使用。

SkillPass 的定位不是再做一个权限开关，而是补齐 X Layer 缺少的
Agent Commerce IP Core Library。

## 用户如何使用

```text
Agent A 创建 Skill Passport
-> Agent B 获得 per-call License
-> Agent B 发现 OKX.AI Service
-> Trust Registry 提供 License 和 quota
-> Skill Gate 判断授权和路由
-> OKX.AI 完成付款和交付
-> Service Operator 执行任务
-> Receipt 公开可验证
```

完成这个无 IMOO 流程后，再展示 IMOO 作为第一家真实 Agent Company。

## 后续开发

- License Quota Step；
- Route & Royalty Cell；
- Receipt Mode；
- Reputation Cell；
- X Layer 子电路组合能力开放后的电路级组合；
- 游戏、支付、Vault 和其他 Agent Company 的标准复用。

## 链上资料

```text
Processor Address: 0x6586c806b192b167e3d56ad669ee60fcb16c3082
Deployment Wallet: 0x60fda8130b7341027147a1b88cd4c2a1af44ecd0
Deployment Tx: 0x457bec90ebf5294040779e9eb74575d3308bacd55be97b76f60c7937f534510c
Skill Gate Circuit ID: 1
Skill Gate Tape-out Tx: 0xcfd76f79153f173d3bbe2a59e19fe6a16f61fc16ddab14c748a2db3a1d8e8eb1
License Quota Step Circuit ID: 2
License Quota Step Tape-out Tx: 0x089b6e0ff30abc6142550c64f3d52757beefba8ba6f60d6f40eaa6a09f76dbb3
Trust Registry: 0xD4B5E16316cB0472C5446Fef4bf3960ae451094B
Trust Registry Deployment Tx: 0xe3c6eea7b18d4acc8f39710bc6cc61aee8ee5b6ed205dec1c79463cf2d5dc540
Research-to-Story Result Hash: 0xa7d333bbb3a328d05088fbaf9a0484df51303539fc5102901a058b965745acb8
Research-to-Story Receipt Tx: 0x4ef03a3dd516b7525d0f2363783eed1056d7e68c5588ec6045bd93041e46be91
Demo: https://1-2-223.tapekit.org/#/demo
GitHub: https://github.com/IGNIX-IMOO/skillpass
视频: https://github.com/IGNIX-IMOO/skillpass/releases/tag/competition-demo-v2
TapeOut: https://tapeout.net/#l2/xlayer/0x6586c806b192b167e3d56ad669ee60fcb16c3082
```
