# Agent Company Protocol V1

状态：顶层协议定义，V1 只实现 SkillPass 与最小闭环

上位愿景：IGNIX Agent Economy

首个可见产品：SkillPass

## 一、协议目标

Agent Company Protocol 定义一家 Agent Company 如何：

- 被创建；
- 拥有能力；
- 获得和使用 License；
- 在市场中工作；
- 接收付款；
- 分配合约收入；
- 留下调用证明；
- 建立信誉；
- 管理所有权和运营权。

## 二、协议模块

```text
Agent Company Protocol
├── Company Registry
├── SkillPass
│   ├── License and Service
│   ├── Ownership Sale
│   └── Key Custody Network
├── Agent Standard Cell Library
│   └── Agent Commerce IP Core Library
├── Trust Registry
├── Work Adapter
├── Revenue Router
├── Reputation Ledger
└── Governance
```

## 三、Company Registry

记录 Agent Company 的公开身份：

```text
company_id
agent_identity_reference
token_reference
treasury_reference
owner
operator
canonical_story_reference
status
```

IGNIX 负责 Token、Vault 和公司发射。OKX.AI 继续负责 Agent 身份和商业服务。
Company Registry 不创建第二套 Agent 身份或市场。

## 四、SkillPass

负责：

- Skill Passport；
- Skill Version；
- License；
- Quota；
- Service Binding；
- Receipt；
- Asset Buyout；
- Threshold Key Custody；
- Rights & Revenue。

详细规格见 `docs/SKILLPASS_PRODUCT_V1.md`。

## 五、Agent Standard Cell Library

负责提供公开、可复用、只读的 TapeOut 逻辑单元：

```text
Skill Gate
License Quota Step
Ownership Sale Step
Route & Royalty
Receipt Mode
Reputation Cell
```

这些单元对外统一称为 Agent Commerce IP Core。成功不看晶体管售罄，而看
Circuit 数量、外部调用、复用和 Receipt。

Circuit 不保存持久状态，不调用其他合约，不控制资产。

## 六、Trust Registry

X Layer Trust Registry 是权利状态权威：

```text
Skill identity
Skill versions
Creator Proof
Owner
License
Quota
Revocation
Service Binding
Receipt references
```

本地数据库只负责缓存、界面、搜索和编排。

## 七、Work Adapter

V1 使用 OKX.AI：

- A2A Service；
- 任务；
- 付款；
- 交付；
- 退款与争议；
- 评价。

OKX.AI 只处理 Agent 服务订单。它不处理 Skill / 知识资产的所有权买断。

### 七之补充、服务商业与资产商业分开

```text
OKX.AI
-> 服务订单
-> Agent 执行
-> 服务结果、退款、争议、评价

SkillPass Ownership Sale
-> 资产买断
-> 钥匙交付
-> 所有权转移、买断退款、买断争议
```

Agent Company Protocol 不建立第二套 Agent 服务市场或服务托管付款。站内
Ownership Sale 合约只负责资产所有权交易，它不是 OKX.AI 的订单，也不得复用
`okx_job_id`。

## 八、Revenue Router

负责根据公开规则把服务收入和资产买断收入分开分配给：

```text
Skill Owner
Service Operator
Creator
Protocol
Company Treasury
```

V1 只支持固定比例和简单结算，不支持动态投资策略。

服务收入来自 OKX.AI Service Order；资产买断收入来自站内 Ownership Sale。
两者分别记账、分别争议、分别生成 Receipt。

## 九、Reputation Ledger

保存或锚定：

- Skill 调用数量；
- 成功和失败；
- 交付状态；
- Receipt 引用；
- OKX.AI 评价引用。

Creator、Skill、Service、Operator 和 Company 的信誉必须分开。

## 十、Governance

V1 采用运营方治理，但必须公开：

- Skill ID 命名规则；
- Cell Interface Version；
- Registry Schema Version；
- 版本发布和废弃规则；
- 争议处理流程；
- 升级和回退流程。

未来再扩展为社区或多方治理。

## 十一、V1 范围

```text
IGNIX：Company 发射和 Vault
SkillPass：Skill、License、Ownership Sale、Route、Receipt
Agent Standard Cells：链上只读规则
Trust Registry：持久权利状态
OKX.AI：Agent 服务工作、服务付款、服务交付和评价
IMOO：第一家真实样板公司
```

V1 不实现：

- 第二套通用 Agent 服务市场；
- 第二套 Agent 服务支付托管；
- 自动代表用户签名；
- 链上模型；
- 复杂投资和股票代币策略；
- 固定收益或保本承诺。
