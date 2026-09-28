# Agent Standard Cell Library V1

状态：V1 核心已实现并完成主网部署；作为当前项目的技术唯一事实源。

中文名：智能体标准电路库 V1

上位标准：Agent Trust & Capability Standard

对外产品：SkillPass

产品类别：Agent Commerce IP Core Library

行业协议：Agent Company Protocol

黑客松 Processor 名称：Agent Standard Cells

## 一、项目裁决

本项目不是单枚权限电路，也不是另一个 Agent 市场。

项目要建立的是：

> 一套让 Agent 能力可以被拥有、许可、调用、路由、计费、证明和组合的标准电路库。

对外产品是 `SkillPass`。本文档描述它底层的技术标准、标准单元和 Registry
边界。

长期愿景：

```text
IGNIX Agent Economy
-> Agent Company Protocol
-> SkillPass
-> Agent Trust & Capability Standard
-> Agent Standard Cell Library
-> Agent Company、游戏、支付、Vault 和 OKX.AI 使用
```

IMOO 是第一个真实运行的样板公司，不是整个系统的边界。

产品、身份和状态权威的正式裁决见：

- `docs/adr/0003-skillpass-product-and-identity-authority.md`
- `docs/SKILLPASS_PRODUCT_V1.md`
- `docs/AGENT_COMPANY_PROTOCOL_V1.md`

## 二、为什么不能只做一枚 Circuit

单枚 `Skill Entitlement Router` 只能证明一个判断成立：

```text
Skill 有效
AND License 有效
AND Service 可用
-> Allow
```

它是有价值的基础单元，但不足以表达：

- Skill 是谁创造的；
- 当前 Skill 资产归谁；
- License 如何消耗；
- Service 使用哪条路线；
- Royalty 交给谁；
- 调用后留下什么证明；
- 所有权、运营权和信誉如何分离。

因此 V1 必须交付一组能够共同说明完整流程的标准单元，而不是只交付一枚孤立电路。

## 三、与 Remembrance Seal 的边界

Remembrance Seal 已经验证了以下方向：

- Agent 动作权限；
- X Layer；
- TapeOut Circuit；
- 一次授权；
- 心跳失效；
- 链上公司印章。

本项目不重复它的定位。

| 项目 | 解决的问题 |
| --- | --- |
| Remembrance Seal | Agent 能不能执行某类动作 |
| Agent Standard Cell Library | Skill 是什么、归谁、谁能用、走哪条 Service、如何计费和证明 |

Remembrance Seal 是动作权限层。

本项目是能力、许可证和商业路由层。

两者未来可以互补，但对外不能都描述成“通用 Agent 权限系统”。

## 四、与三个平台的关系

### IGNIX

负责：

- Agent Company 发射；
- Token 和 Vault；
- 社区与注意力；
- Genesis Transistor 的后续经济机制。

IGNIX 不负责：

- 运行 Agent；
- 保存 Skill License；
- 提供模型推理；
- 处理 OKX.AI 订单。

### TapeOut

负责：

- Processor；
- Transistor；
- Circuit；
- 永久公开逻辑；
- 免费只读调用；
- Container；
- 链上地址和资产承载。

TapeOut 不负责：

- 持久保存 Agent 状态；
- 调用 OKX.AI；
- 运行模型；
- 管理商业订单。

### OKX.AI

负责：

- Agent 身份；
- Service 发现；
- A2A 和 A2MCP；
- 付款；
- 交付；
- 退款与仲裁；
- 评价和商业信誉。

本项目不建立第二套 Agent 市场、托管付款、订单或评价系统。

### Agent Runtime

负责：

- 模型；
- 工具；
- API；
- 数据；
- 实际任务执行；
- 私有凭证。

私钥、模型 Key 和私有输入永不进入链路或公开 Receipt。

## 五、TapeOut 的真实技术边界

根据 TapeOut 官方白皮书和 X Layer 页面：

- Circuit 是 ERC-721 资产；
- Circuit 的逻辑是不可执行代码的链上数据；
- Circuit 只能用于计算；
- Circuit 没有调用其他合约的权利；
- Circuit 没有写入持久状态的权利；
- 组合电路使用 `eval`；
- 含时序单元的电路使用 `step`；
- 调用是只读查询，不需要钱包，不产生交易；
- 外部合约可以把 Circuit 当作一段逻辑使用；
- 已经流片的电路在 X Layer 当前不能重新作为画布子电路；
- 引用子电路的图在 X Layer 当前不能流片。

因此必须使用以下正确表述：

```text
Circuit 计算 next_state
Registry 保存 next_state
Container 承载资产和公开入口
OKX.AI 处理商业服务
```

禁止使用以下错误表述：

```text
Circuit 自己保存 License
Circuit 自动更新剩余次数
Circuit 自己控制资产
Circuit 直接调用 OKX.AI
```

## 六、X Layer V1 的组合方式

X Layer 当前不能把已流片 Circuit 作为子电路继续流片。

因此 V1 的“组合”发生在应用层：

```text
Application or Registry
  -> reads Skill Gate output
  -> reads License Quota Step output
  -> reads Route & Royalty output
  -> updates persistent Registry state
  -> invokes OKX.AI Service
  -> writes Receipt reference
```

标准单元库仍然成立，因为：

- 每枚 Circuit 有统一位序；
- 每枚 Circuit 有统一输入输出语义；
- 多枚 Circuit 可以由同一外部应用统一调用；
- 其他项目可以复制或调用同一标准；
- 未来 TapeOut 支持 X Layer 子电路后，可以升级为电路级组合。

## 七、总体架构

```text
Agent Company Protocol
├── SkillPass
│   ├── Skill Passport
│   ├── License Desk
│   ├── Service Console
│   ├── Ownership Exchange
│   ├── Receipts
│   └── Rights & Revenue
├── Agent Trust & Capability Standard
│   └── Agent Standard Cell Library
│       ├── Skill Gate Core
│       ├── License Quota Core
│       ├── Ownership Sale Step
│       ├── Route & Royalty Core
│       ├── Receipt Core
│       └── Future Reputation Core
├── Trust Registry
├── Service Binding
├── Runtime Adapter
└── Receipt Bridge
```

### X Layer 与 BNB 研究结论

BNB 上已经形成计算、密码学、支付和钱包类 IP Core 体系，例如：

- CPU；
- SHA-256；
- Keccak-256；
- NANDPU；
- PAYCORE；
- Wallet。

X Layer 目前更多集中在 Agent 权限、社区叙事和状态机项目。

因此本项目的定位不是复制某个应用，而是补齐 X Layer 缺少的：

> Agent Commerce IP Core Library。

成功指标不是晶体管售罄，而是：

- 真实流片了多少 Circuit；
- 外部 Agent 调用了多少；
- 多少 Circuit 被其他项目复用；
- 产生多少 Call Receipt；
- 产生多少真实服务收入。

Circuit Container 作为未来资产账户接口保留，但 V1 不宣称资产转出和提现已经可用。

## 八、领域对象

### Standard Cell

可复用、可验证、具有明确输入输出编码的 Circuit。

`Standard Cell ID` 只表示通用逻辑单元，不表示具体 Skill。

### Agent Commerce IP Core

面向 Agent 商业场景的标准单元。它封装清晰输入输出、真值表、测试、版本和
复用语义，可以被 Agent、钱包、支付、Vault、游戏和其他 Circuit 调用。

`Skill Gate`、`License Quota Step`、`Ownership Sale Step`、`Route & Royalty` 和
`Receipt Mode` 都属于 Agent Commerce IP Core。

### Capability Circuit

针对某个能力或能力族制作的 Circuit 或外部逻辑组合。

它可以是 Standard Cell 的实例化结果，但 X Layer V1 不假设存在链上子电路引用。

`Capability Circuit ID` 是可选绑定，不是所有 Skill 的必需身份。

### Skill Passport

面向用户的 Skill 视图，组合以下信息：

```text
Circuit ID
Processor Address
Skill Key
Version
Owner
Creator Proof
License Mode
Service Binding
Reputation
```

`SkillPassport ID` 是 Skill 的稳定经济身份。

推荐规则：

```text
SkillPassport ID = hash(skill_namespace + skill_key)
```

标准：

```text
Standard Cell ID != SkillPassport ID
SkillPassport ID != Service ID
Service ID != License ID
License ID != Receipt ID
```

### Trust Registry

保存持久状态的 X Layer 合约：

- Skill 定义；
- 版本；
- 当前所有者；
- Creator Proof；
- License；
- 剩余额度；
- 撤销；
- Service Binding；
- Receipt 引用。

X Layer Trust Registry 是权利状态的权威来源。本地数据库只负责缓存、搜索、
界面和任务编排，不得覆盖链上权利。

### Skill License

允许某个 Agent 在指定条件和时间内使用某个 Skill 的权利。

### Skill Service

发布在 OKX.AI 上的商业服务。

### Call Receipt

记录请求、Skill 版本、License、OKX.AI Job、结果哈希、状态和评价引用。

不包含私钥、模型 Key、完整私有输入或敏感数据。

## 九、V1 标准单元

### 1. Skill Gate

必做。

用途：

- 判断 Skill、License 和 Service 是否同时有效；
- 输出是否允许；
- 输出路由 ID；
- 输出 royalty bucket；
- 拒绝时输出归零。

输入：

```text
skill_id[3:0]
skill_valid
licensed
service_available
license_type[1:0]
```

输出：

```text
allow
route_id[3:0]
royalty_bucket[1:0]
```

状态：

组合逻辑，无时序位。

### 2. License Quota Step

必做。

用途：

- 接收当前剩余额度；
- 接收本次消费请求；
- 判断是否能消费；
- 返回本次是否允许；
- 计算下一额度。

输入：

```text
quota[3:0]
consume
license_valid
service_available
```

输出：

```text
allow
remaining[3:0]
deny_reason[1:0]
```

状态规则：

- 使用 `step`；
- 接收 `state_in`；
- 返回 `state_out`；
- Registry 负责保存 `state_out`。

### 3. Ownership Sale Step

状态交付后补充。用途：

- 接收买断订单当前状态和本次动作；
- 判断付款、阈值交付、退款、放款和所有权转移是否合法；
- 输出下一状态和拒绝原因；
- 不保存订单、不持有款项、不转移所有权。

输入：

```text
order_state[2:0]
action[2:0]
payment_ok
share_proof_count[3:0]
threshold_required[3:0]
delivery_expired
settlement_failed
```

输出：

```text
allow
next_state[2:0]
deny_reason[2:0]
release_payment
transfer_ownership
refund_buyer
```

真正的资金、订单持久状态和 Registry 所有权由外部 Ownership Sale 合约与 Trust
Registry 保存。Circuit 只计算合法状态转换。

### 4. Route & Royalty

条件开发。

用途：

- 根据 Skill ID 或 License 类型选择 Route；
- 选择 royalty bucket；
- 为外部合约提供稳定输出。

### 5. Receipt Mode

后续标准单元。

用途：

- 决定 Receipt 模式；
- 区分按次、订阅、独占和人工审核；
- 只返回模式，不保存 Receipt。

### 6. Reputation Cell

长期单元。

用途：

- 根据输入指标计算信誉分层；
- 不保存原始行为记录；
- 不替代 OKX.AI 评价。

## 十、Skill ID V1

| ID | Skill |
| --- | --- |
| `0000` | reserved |
| `0001` | web_research |
| `0010` | source_validation |
| `0011` | content_summary |
| `0100` | translation |
| `0101` | task_planning |
| `0110` | risk_review |
| `0111` | result_evaluation |
| `1000` | story_conversion |
| `1001` | image_prompt |
| `1010` | code_review |
| `1011` | data_cleaning |
| `1100` | market_analysis |
| `1101` | research_to_story |
| `1110` | agent_coordination |
| `1111` | future_extension |

## 十一、License 类型 V1

| ID | 类型 | 说明 |
| --- | --- | --- |
| `00` | per_call | 按次使用 |
| `01` | subscription | 订阅期内使用 |
| `10` | exclusive | 指定范围内独占 |
| `11` | admin | 管理或人工授权 |

服务调用的商业支付仍由 OKX.AI 负责。资产所有权买断由 SkillPass Ownership
Sale 在站内直接完成，两种订单不得混用。

## 十二、Trust Registry 最小数据

```text
skill_key
skill_version
circuit_id
processor_address
creator_proof
owner_address
license_id
license_mode
licensee_agent_id
quota_remaining
revoked
service_binding
receipt_ref
```

Registry 不保存：

- 私钥；
- 模型 Key；
- 用户完整隐私数据；
- OKX.AI 密码或会话；
- 未公开的提示词和内部业务数据。

## 十三、第一个真实闭环与 IMOO 样板

第一闭环不得依赖 IMOO：

```text
Agent A 创建 SkillPassport
-> Agent B 获得 License
-> Skill Gate 完成授权和路由
-> Registry 保存状态
-> OKX.AI 完成付款和交付
-> Service Operator 执行
-> Receipt 记录结果
```

第一闭环通过后，IMOO 使用完全相同的流程提供服务：

```text
Research-to-Story
```

IMOO 展示闭环：

```text
第二个 Agent 发现 Service
-> 获得或持有 License
-> Registry 提供 License 和 quota
-> Circuit 计算 allow、route 和 royalty
-> 如 Quota Step 已启用，再计算 remaining
-> Registry 保存状态
-> OKX.AI 完成付款和交付
-> IMOO Runtime 执行
-> Receipt 记录结果
-> 公开页面展示真实证据
```

## 十四、所有权与权利

必须分开：

| 权利 | 存放位置 |
| --- | --- |
| Creator Proof | Trust Registry |
| Skill Asset Owner | Registry 或 Capability Circuit 所有权 |
| License Administration | Registry 权限规则 |
| Service Operation | OKX.AI 和 Runtime 配置 |
| Skill Reputation | Registry 锚定，OKX.AI 提供原始评价 |
| Service Reputation | 保留在 OKX.AI |
| Runtime Credentials | 永不公开或上链 |

Circuit 的 ERC-721 所有权只代表该 Circuit 资产本身的当前持有人，不能自动等同于全部商业权利。

## 十五、经济闭环

```text
Skill 被调用
-> OKX.AI 产生真实服务收入
-> 收入进入约定财库
-> 按公开规则回购、投资、研发或分配
-> 产生公开战绩和内容
-> 吸引更多 Agent 使用 Skill
```

资产买断是独立经济路径：

```text
Skill / 知识资产被买断
-> 站内 Ownership Sale 完成付款、交付和所有权转移
-> 买断收入进入约定财库
-> 按公开规则分配
```

服务订单不属于 Skill 所有权买断；资产买断也不生成 OKX.AI Job。

不承诺固定回报，不使用新用户本金支付旧用户，不宣传 Skill 必然升值。

## 十六、黑客松 V1 交付范围

第一优先级：完整闭环。

- X Layer Processor：Agent Standard Cells；
- Skill Gate 真实流片；
- BLIF、真值表、测试向量和验证脚本；
- Trust Registry 最小实现；
- SkillPass 六个一级页面；
- 普通 Agent A/Agent B 无 IMOO 闭环；
- OKX.AI Research-to-Story Service；
- Receipt；
- 公开 Demo；
- 评委指南；
- 提交材料。

第二优先级：完整闭环通过后完成。

- License Quota Step 真实流片；
- 简单收入分账；
- Service 失败和退款状态。
- 站内 Ownership Sale 合约和超时退款。

第三优先级：

- Route & Royalty；
- Ownership Sale Step；
- Receipt Mode；
- Reputation Cell。

不做：

- 第二套 Agent 市场；
- 第二套 Agent 服务托管付款；
- 第二套评价系统；
- 链上大模型；
- Circuit 内持久状态；
- 自动代表用户签名；
- 固定收益或保本承诺；
- X API 自动发布。

## 十七、验收标准

1. Processor 地址不是钱包地址。
2. Circuit 是真实 X Layer 流片，不是伪造记录。
3. Skill Gate 全部输入组合通过。
4. 如果启用 License Quota Step，`state_in` 和 `state_out` 必须可复现；
   如果未启用，Registry 更新不得归功于 Circuit。
5. Registry 重启后状态保留。
6. Owner、Creator、Licensee 和 Operator 可以不同。
7. 拒绝调用有明确原因。
8. 普通 Agent A/Agent B 不依赖 IMOO 完成真实任务。
9. IMOO 可以复用相同流程。
10. Receipt 可以从公开链接验证。
11. 所有提交链接无需权限即可打开。
12. 链上文档不包含私钥、Key 或隐私数据。
13. 对外文案不使用“Circuit 自己保存状态”。
14. Standard Cell ID 与 SkillPassport ID 不混用。
15. 验证 Circuit 产生的派生或复用记录，而不是只看晶体管铸造量。
16. Container 只按当前平台真实能力展示，不宣称转出和提现已可用。
17. OKX.AI Service Order 和 SkillPass Ownership Order 不混用。
18. Ownership Sale 合约不能绕过交付状态直接转移所有权。

## 十八、开发顺序

```text
P0：技术验真和术语冻结
P1：SkillPass 产品界面与 Trust Registry
P2：Skill Gate
P3：OKX.AI Service 与 Runtime Bridge
P4：普通 Agent A/Agent B 与 Receipt
P5：License Quota Step
P6：Processor 与 Circuit 主网流片
P7：公开 Demo 和提交材料
P8：全真模拟与独立审查
```

主网交易只能在不可变参数最终确认后执行。

## 十九、长期演进

```text
V1：SkillPass + Skill Gate + Registry + OKX.AI
V2：Quota Step、Route、Royalty 和 Receipt
V3：Circuit 级组合、信誉单元和多 Agent 协调
V4：游戏、支付、Vault 和其他 IGNIX Agent Company 复用
```

最终目标不是让 IMOO 成为唯一使用者，而是让 IMOO 成为第一家有真实战绩的标准使用者。
