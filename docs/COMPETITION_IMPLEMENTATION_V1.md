# 比赛演示实施清单 V1

状态：Slice 1 至 Slice 4 和资产包流水线已完成，Slice 5 待开发

上位文档：

- `COMPETITION_DEMO_V1.md`
- `POST_COMPETITION_ROADMAP.md`
- `SKILLPASS_PRODUCT_V1.md`
- `SKILL_ASSET_ENCRYPTION_V1.md`

---

## 一、唯一目标

比赛演示必须在同一个网站、同一个技能和同一个故事中完成：

```text
SkillPass 身份认证
-> License 授权
-> Skill Gate 放行
-> License Quota 扣减
-> Service 调用
-> Receipt
-> 站内买断
-> 2-of-3 自动交付
-> 买方本地解密
-> Ownership 转移
```

不增加第二条演示故事。

## 二、固定演示角色

| 角色 | 固定值 |
| --- | --- |
| Creator | IMOO |
| Skill | Research-to-Story |
| Licensee | Agent B |
| Asset Buyer | Agent B |
| Service Operator | IMOO Demo Operator |
| 密钥节点 | Node A、Node B、Node C |
| 正常在线节点 | Node A、Node B |
| 故意离线节点 | Node C |
| 交付方式 | 普通钱包 + 加密文件 |

使用 Agent B 先调用服务，再买断完整资产，证明同一个能力可以从“使用”走到“拥有”。

## 三、固定网站结构

```text
#/overview   运行总览
#/demo       使用 Skill
#/ownership  拥有 Skill
#/verify     公开验证
```

### 运行总览

只展示：

- 一句话定位；
- 使用到拥有的完整图；
- 当前真实链上组件；
- 比赛演示与后续路线图标签；
- 进入演示的主按钮。

### 使用 Skill

只展示：

- SkillPassport；
- 当前版本；
- Creator Proof；
- License；
- Skill Gate 的输入和输出；
- License Quota 的 before / after；
- 一次 Service 结果；
- Receipt。

### 拥有 Skill

只展示：

- 买断价格；
- 内容哈希；
- 当前 Owner；
- 注册解密公钥；
- 付款；
- Node A、Node B 交付证明；
- Node C 离线；
- 买方重建密钥；
- Ownership 转移结果。

### 公开验证

只展示：

| 项目 | 必须显示 |
| --- | --- |
| Processor | 地址和网络 |
| Skill Gate | Circuit 地址、输入、输出 |
| License Quota | state in / state out |
| SkillPassport | ID、Owner、Version |
| License | License ID、额度、状态 |
| Receipt | Receipt ID、结果哈希、状态 |
| Ownership Order | 订单 ID、状态、买方公钥哈希 |
| Payment | 交易哈希、确认状态 |
| Delivery | Node A、Node B、Node C 状态和签名 |
| Ownership | 转移前后的 Owner |

## 四、固定演示数据

```text
skill_namespace = skillpass.demo
skill_key = research_to_story
skill_version = 1.0.0

creator = IMOO
licensee = Agent B
buyer = Agent B

license_mode = per_call
license_quota = 3
consume = 1
quota_before = 3
quota_after = 2

service_result = research_to_story_v1_demo
receipt_status = DELIVERED

buyout_price = demo_value
payment_asset = local_test_asset
key_epoch = demo-epoch-1

node_a = online
node_b = online
node_c = offline
```

`demo_value` 和 `local_test_asset` 不代表真实价格或真实付款。

## 五、页面状态

### SkillPass

```text
DRAFT
-> PUBLISHED
-> LICENSED
-> USED
-> RECEIPTED
-> FOR_SALE
-> OWNED_BY_BUYER
```

### License

```text
ISSUED
-> ACTIVE
-> CONSUMED
```

### Call / Receipt

```text
REQUESTED
-> AUTHORIZED
-> PAID
-> EXECUTING
-> DELIVERED
```

### Ownership Order

```text
LISTED
-> FUNDED
-> DELIVERING
-> DELIVERED
-> COMPLETED
```

异常路径：

```text
FUNDED -> DELIVERY_TIMEOUT -> REFUNDED
DELIVERED -> SETTLEMENT_FAILED -> RETRY
```

不得出现 `BUYER_CONFIRMED` 状态。

## 六、最小技术组件

### 复用现有组件

```text
Skill Gate Circuit
License Quota Circuit
Trust Registry
Controlled Demo Flow
Public Site
TapeOut Container
```

### 比赛新增组件

```text
Ownership Demo Page
Ownership Order Runtime
Local Payment Adapter
Three Custodian Nodes
2-of-3 Share Delivery
Browser Key Reconstruction
Ownership Demo Receipt
```

### 明确不做

```text
真实资金
多代币质押
6-of-9
8-of-11
节点委员会
奖励
惩罚
保险
治理
DeWEB 主通道
多链
二级市场
```

## 七、真实与模拟标记

网站上所有相关模块必须显示以下标签之一：

```text
ON-CHAIN
COMPETITION DEMO
ROADMAP
```

对应关系：

| 模块 | 标签 |
| --- | --- |
| Processor | ON-CHAIN |
| Skill Gate | ON-CHAIN |
| License Quota | ON-CHAIN |
| Trust Registry | ON-CHAIN |
| TapeOut Container | ON-CHAIN |
| Ownership Sale 本地流程 | COMPETITION DEMO |
| Node A/B/C | COMPETITION DEMO |
| 2-of-3 自动交付 | COMPETITION DEMO |
| 多代币质押 | ROADMAP |
| 6-of-9 / 8-of-11 | ROADMAP |
| 奖励、惩罚、保险 | ROADMAP |

## 八、自动交付验收

必须按以下顺序测试：

1. Agent B 获得 per-call License；
2. Skill Gate 返回允许；
3. License Quota 从 3 变为 2；
4. Service 返回固定结果；
5. Receipt 记录 `DELIVERED`；
6. 买方注册公钥；
7. 本地付款成功；
8. Node A 和 Node B 收到订单；
9. Node C 保持离线；
10. Node A、B 返回两个不同份额；
11. 买方本地重建密钥；
12. 加密内容解密成功；
13. Ownership 转移给 Agent B；
14. 页面自动更新，不需要买方确认；
15. 重复付款事件不会产生第二套有效份额；
16. Node C 恢复后看到订单已经完成；
17. 公开验证页展示完整证据；
18. 所有模拟模块都有标签。

## 九、实施顺序

### Slice 1：演示数据和页面骨架

交付：

- 四个页面路由；
- 固定角色和固定数据；
- 所有状态可切换；
- 全部使用模拟数据；
- 不影响现有 `#/demo` 和 `#/verify`。

完成条件：

- 不接钱包；
- 不接真实付款；
- 评委可以完整看懂故事。

### Slice 2：Ownership Order 本地运行

交付：

- LISTED；
- FUNDED；
- DELIVERING；
- DELIVERED；
- COMPLETED；
- 超时退款；
- 幂等保护。

完成条件：

- 一个订单只能完成一次；
- 不需要买方确认；
- 没有开放质押和奖励。

### Slice 3：2-of-3 自动交付

交付：

- 三个本地节点；
- 三个独立份额；
- 节点 A、B 在线；
- 节点 C 离线；
- 文件份额交付；
- 浏览器本地重建密钥。

完成条件：

- 一个节点无法重建密钥；
- 任意两个节点可以完成；
- 一个节点离线不阻断交付。

### Slice 4：连接现有 SkillPass 流程

交付：

- 复用 Skill Gate；
- 复用 License Quota；
- 复用 Trust Registry；
- 复用 Receipt；
- 在同一网站展示使用和拥有。

完成条件：

- 原有链上验证继续通过；
- 新流程不修改已部署 Circuit；
- 公开证据链接仍可访问。

### Slice 5：公开演示和视频

交付：

- 公网页面；
- `2 分 45 秒`比赛主视频；
- 保留现有 `68 秒`社交预告片；
- `5 分钟`扩展演示作为问答备用；
- 录屏；
- 评委指南；
- 真实和模拟清单。

完成条件：

- 所有链接无需权限；
- 视频没有内部术语泄露；
- 不把比赛演示宣传成生产网络。

## 十、每次开发前检查

```text
是否属于比赛闭环？
是否复用现有组件？
是否增加新市场或新付款体系？
是否属于后续路线图？
是否会破坏现有提交？
是否清楚标记真实或模拟？
```

任何无法通过这六项检查的功能，不进入比赛版。

## 十一、当前下一步

Slice 1 已完成：

```text
统一网站页面骨架
固定演示数据
使用到拥有的状态切换
真实链上证据占位
比赛演示占位
```

Slice 2 已完成：

```text
本地 Ownership Order
LISTED
FUNDED
DELIVERING
DELIVERED
COMPLETED
DELIVERY_TIMEOUT
REFUNDED
幂等付款、重复交付和冲突份额保护
```

Slice 3 已完成：

```text
三个本地节点
三个独立份额
Node A / B 在线
Node C 离线
X25519 加密份额信封
浏览器本地 2-of-3 重建密钥
XChaCha20-Poly1305 解密内容
```

资产包流水线已完成：

```text
Research-to-Story 源文件
版本化 Manifest
加密内容密文
Node A / B / C 独立 share 文件
Manifest、Source、Ciphertext SHA-256
任意两份额解密测试
单份额拒绝测试
密文篡改拒绝测试
```

公开文件和节点份额生成在 `.generated/`，不提交 Git。进入 TapeOut Container 的只能是
`public/` 目录下的 Manifest 和密文，三个节点份额必须分开存放。

资产包和本地节点已经接入浏览器：

```text
网站读取 public Manifest 和密文
浏览器注册临时买方公钥
Node A / Node B 通过本地 HTTP 返回加密份额
浏览器本地重建密钥和解密
Node C 不启动
```

浏览器不再持有三个原始份额。TapeOut Container dry-run 已通过，当前构建包含 6 个文件、
29 个分块，未发送任何链上交易。

当前构建已经正式发布到 TapeOut Container，并记录在
`COMPETITION_DEPLOYMENT_V1.md`。公开 HTTPS 页面不能直接连接本地 HTTP 节点，正式提交
前必须选择本地录屏或部署 HTTPS 节点。

Slice 4 已完成：

```text
复用 Skill Gate
复用 License Quota
复用 Trust Registry
复用 Receipt
使用流程与拥有流程共享同一份本地 Registry
买断完成后更新同一本 Passport 的 Owner
```

下一步进入 Slice 5：

```text
公网页面
2 分 45 秒比赛主视频
68 秒社交预告片
5 分钟扩展演示备用
录屏
评委指南
真实和模拟清单
```
