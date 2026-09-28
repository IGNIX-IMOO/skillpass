# SkillPass Product V1

状态：产品设计定稿，V1 比赛实现已完成并公开验证。

上位协议：Agent Company Protocol

产品类别：Agent Commerce IP Core Library

技术标准：Agent Trust & Capability Standard

技术实现：Agent Standard Cell Library

## 一、一句话定位

> Agent Skill 的许可证、资产买断与商业路由协议。

英文：

> SkillPass is the license, ownership, routing, and proof layer for Agent Skills.

## 二、产品解决的问题

Agent Skill 目前通常只是：

- Prompt；
- API；
- 后台配置；
- 平台 Service；
- Agent 内部经验。

SkillPass 让每个 Skill 拥有：

```text
身份
版本
Creator Proof
Owner
License
Quota
Service Binding
Royalty Rule
Usage Receipt
Reputation
```

## 二之补充、V1 必须证明的闭环

V1 先使用普通 Agent A 和 Agent B，不依赖 IMOO：

```text
Agent A 创建 SkillPassport
-> Agent B 获得 per-call License
-> Skill Gate Core 返回授权和路由
-> License Quota Core 计算下一额度
-> Trust Registry 保存 next_state
-> Agent B 调用 Service
-> Service Operator 完成交付
-> Receipt Core 记录结果
```

IMOO 是第二段展示，证明第一家真实 Agent Company 可以复用完全相同的流程。

## 二之补充、Agent Commerce IP Core

SkillPass 的底层不是单个应用，而是一组 Agent Commerce IP Core：

```text
Skill Gate Core
License Quota Core
Ownership Sale Core
Route & Royalty Core
Receipt Core
Container Finance Core
```

每个 Core 必须有：

- 清晰名称；
- 确定性输入输出；
- 真值表和测试；
- 版本；
- 可复用接口；
- 公开验证证据。

成功指标不是铸造了多少晶体管，而是：

- 产生多少 Circuit；
- 被多少外部 Agent 调用；
- 被多少其他 Circuit 或应用复用；
- 形成多少 Receipt；
- 产生多少真实服务收入。

## 三、产品角色

| 角色 | 主要操作 |
| --- | --- |
| Skill Creator | 创建 Skill、发布版本、获得 Creator Proof |
| Skill Owner | 管理 Skill 资产、License 和收入权利 |
| License Administrator | 发放、暂停、撤销和更新 License |
| Licensee Agent | 获得 License 并调用 Skill |
| Asset Buyer | 在站内买断 Skill / 知识资产并取得钥匙与所有权 |
| Service Operator | 在 OKX.AI 运营服务并交付结果 |
| Runtime Operator | 运行模型、工具和任务 |
| Reviewer | 处理风险、争议和版本晋级 |

V1 可以由同一个用户同时拥有多个角色，但系统内部必须分别记录。

## 四、核心对象

### SkillPassport

稳定身份：

```text
skill_namespace
skill_key
skill_passport_id
current_version
creator_proof
owner_address
status
created_at
```

### SkillVersion

```text
skill_passport_id
semantic_version
input_schema
output_schema
risk_level
definition_hash
cell_interface_version
published_at
```

### Capability Circuit Binding

```text
skill_passport_id
skill_version
capability_circuit_id
processor_address
binding_status
```

普通 V1 Skill 可以不绑定专用 Capability Circuit，只使用通用 Standard Cell。

### License

```text
license_id
skill_passport_id
skill_version
licensee_agent_id
license_mode
quota
starts_at
expires_at
revoked
royalty_bucket
```

### Service Binding

```text
skill_passport_id
skill_version
okx_service_id
service_operator_agent_id
endpoint_reference
status
```

### Ownership Order

```text
ownership_order_id
skill_passport_id
skill_version
buyer_address
buyer_public_key_hash
price
payment_asset
content_manifest_hash
key_epoch
delivery_attestations
status
delivery_deadline
settlement_deadline
created_at
```

Ownership Order 只存在于 SkillPass 的站内买断流程，不属于 OKX.AI Service Order。

### Call Receipt

```text
receipt_id
skill_passport_id
skill_version
license_id
requester_agent_id
okx_job_id
request_hash
result_hash
status
created_at
```

## 五、六个一级页面

### 1. Skill Passport

展示：

- Skill 名称和用途；
- 当前版本；
- Creator Proof；
- Owner；
- License 类型；
- Service 绑定；
- Circuit 绑定；
- 调用和信誉。

### 2. License Desk

允许：

- 创建 License；
- 购买或领取 License；
- 查看额度；
- 暂停或撤销；
- 查看过期和耗尽状态。

### 3. Service Console

展示：

- OKX.AI Service；
- Operator；
- 价格；
- 可用性；
- 最近调用；
- 成功率。

### 4. Receipts

展示：

- 请求；
- Skill 版本；
- License；
- OKX.AI Job；
- 交付结果引用；
- 结果哈希；
- 成功、失败或退款。

### 5. Ownership Exchange

允许：

- 查看可买断资产和价格；
- 注册买方解密公钥；
- 在站内直接付款买断；
- 查看交付、结算、退款和争议状态；
- 下载或读取满足阈值的加密份额；
- 查看最终所有权和版本哈希。

### 6. Rights & Revenue

展示：

- 所有权；
- Creator Proof；
- 收入接收方；
- Royalty Bucket；
- 分账规则；
- 已结算记录。

V1 只展示规则和测试结算，不承诺收益。

## 六、核心状态机

### SkillPassport

```text
DRAFT
-> PUBLISHED
-> PAUSED
-> RETIRED
```

### License

```text
ISSUED
-> ACTIVE
-> EXHAUSTED
-> EXPIRED
-> REVOKED
```

### Call

```text
REQUESTED
-> AUTHORIZED
-> PAID
-> EXECUTING
-> DELIVERED
-> COMPLETED
```

失败路径：

```text
REQUESTED -> REJECTED
PAID -> FAILED -> REFUNDED
DELIVERED -> DISPUTED
```

### Ownership Order

```text
LISTED
-> FUNDED
-> DELIVERING
-> DELIVERED
-> COMPLETED
```

失败与超时路径：

```text
FUNDED -> DELIVERY_TIMEOUT -> REFUNDED
DELIVERING -> DELIVERY_FAILED -> REFUNDED
DELIVERED -> SETTLEMENT_FAILED -> RETRY / DISPUTED
```

### Receipt

```text
PENDING
-> ANCHORED
-> VERIFIED
-> DISPUTED
```

## 七、无 IMOO 的必做流程

```text
Agent A 创建 SkillPassport
-> Agent A 发布一个通用 Skill
-> Agent B 获得 per-call License
-> Agent B 通过 OKX.AI 调用
-> Skill Gate 返回授权和路由
-> Service Operator 完成任务
-> Receipt 记录调用
```

这个流程不得依赖 IMOO。

资产买断使用独立流程，不能再塞进 OKX.AI：

```text
Skill Owner 发布可买断版本和价格
-> Asset Buyer 注册解密公钥
-> Asset Buyer 在站内付款到 Ownership Sale
-> 阈值节点自动交付加密份额
-> 合约自动放款并转移所有权
```

调用服务产生 OKX.AI Job；买断资产产生 Ownership Order。两者不得共用一个状态机。
正常买断不需要买方确认，也不需要 IMOO 作为专有执行者。

IMOO 只作为第二段演示：

```text
IMOO 提供 Research-to-Story
-> 展示第一家真实 Agent Company
```

## 八、V1 收入规则

V1 支持两种独立收入模型：

```text
调用收入
├── Service Operator
├── Skill Owner
└── Protocol Fee

买断收入
├── Skill Owner
├── Creator
├── Service / Runtime Operator（如有后续交付义务）
└── Protocol Fee
```

所有比例在 License、Service 或 Ownership Listing 发布时确定。服务收入和买断收入
分开记账。V1 不实现动态投资和复杂 Vault 策略。

失败处理：

- 未付款：不执行；
- 任务失败：按 OKX.AI 规则退款；
- 请求被 Circuit 拒绝：不付款、不执行；
- License 撤销：未来请求拒绝，已交付任务按原规则处理。

## 九、安全要求

必须防止：

- 伪造 Skill Owner；
- 修改已发布版本；
- 重放 Receipt；
- License 盗用；
- Quota 并发重复消费；
- Service Binding 被静默替换；
- Operator 冒充 Owner；
- 重复交付或重复转移所有权；
- 节点提交与订单不匹配的加密份额；
- 本地数据库覆盖链上权利；
- 在公开文档泄漏模型 Key 和私有数据。

V1 必须至少实现：

- Registry 权限检查；
- Receipt 唯一 ID；
- License 撤销检查；
- 版本哈希；
- Service Binding 变更日志。
- Ownership Order 唯一 ID 和幂等状态转换；
- 份额证明、节点签名与版本哈希校验。

## 十、V1 交付优先级

### P0 必须完成

- SkillPass 产品页面；
- TrustRegistry 最小实现；
- Skill Gate；
- OKX.AI Service；
- 普通 Agent A/Agent B；
- Receipt；
- IMOO 第二展示案例。
- Ownership Sale 合约和站内买断页面。

### P1 时间允许时完成

- License Quota Step；
- 简单收入分账；
- Service 失败和退款状态。
- Ownership Sale 的超时退款和争议状态。

### P2 后续

- Route & Royalty Cell；
- Ownership Sale Step；
- Reputation Cell；
- 电路级组合；
- 复杂 Vault 和股票代币策略。

## 十一、V1 验收

1. 无 IMOO 的 Agent A/Agent B 闭环通过。
2. IMOO 可以复用同一流程。
3. SkillPassport ID 与 Standard Cell ID 不混用。
4. 本地清空缓存后可以从 Registry 恢复权利状态。
5. 无 License 或撤销 License 被拒绝。
6. Receipt 可以从公开链接验证。
7. 所有统一术语与 ADR 0003 一致。
8. OKX.AI Service Order 与 Ownership Order 不混用。
9. 完成一次站内买断、过期退款和重复交付测试。
