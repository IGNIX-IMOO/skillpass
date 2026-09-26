# 密钥托管网络参数基线 V1

状态：设计基线，待评审后实施

上位文档：

- `KEY_CUSTODY_NETWORK_V1.md`
- `SKILL_ASSET_ENCRYPTION_V1.md`
- `SKILLPASS_PRODUCT_V1.md`

压力测试：`KEY_CUSTODY_PARAMETER_STRESS_TEST_V1.md`

本文件只定义可治理参数。架构规则仍以 `KEY_CUSTODY_NETWORK_V1.md` 为准。

---

## 一、参数原则

1. 所有参数都必须可以治理修改。
2. 参数变更必须延迟生效，不能让管理员立即改变委员会。
3. 项目方代币可以质押，但不能仅凭代币数量取得无限权重。
4. 节点质押权重与资产委员会席位分开计算。
5. 价格、风险折扣和上限都在固定纪元快照。
6. 经济安全不足时，系统应降低节点权重或暂停新订单，不能扩大风险。

## 二、参考单位

使用 `Security Unit`，简称 `SU`：

```text
1 SU = 1 USD 等值的安全价值
```

`SU` 不是链上代币，只是统一估值单位。所有代币先转换为 SU，再进行折扣和上限处理。

## 三、网络阶段参数

| 参数 | 启动期 | 标准期 | 高价值期 |
| --- | --- | --- | --- |
| 委员会 | 3 | 9 | 11 |
| 阈值 | 2 | 6 | 8 |
| 允许单一运营方控制的节点数 | 3 | 最多 2 席 | 最多 2 席 |
| 适用资产价值 | 内部和低价值 | 标准资产 | 高价值资产 |
| 节点迁移 | 可以 | 可以 | 可以 |
| 买方确认 | 不需要 | 不需要 | 不需要 |

启动期的 `2-of-3` 只是技术启动参数。如果三个节点仍由 IMOO 控制，必须标记为
`bootstrap`，不能对外宣称已经形成独立多方托管。

## 四、资产风险等级

委员会等级按资产买断价格和卖方申报的更换价值中较高者判定：

| 等级 | 单次买断价值 | 委员会 | 阈值 |
| --- | --- | --- | --- |
| `LOW` | 小于 5,000 SU | 5 | 3 |
| `STANDARD` | 5,000 至 50,000 SU | 9 | 6 |
| `HIGH` | 大于 50,000 SU | 11 | 8 |
| `BOOTSTRAP` | 仅测试资产 | 3 | 2 |

这些阈值只是 V1 默认值。治理可以根据保险池和历史事故调整。

## 五、委员会参数

```text
epoch_duration = 7 days
stake_snapshot = 24 hours
standby_multiplier = 2
max_seats_per_operator = 2
max_operator_stake_share = 10%
max_single_token_share = 10%
max_issuer_group_share = 15%
minimum_committee_coverage_ratio = 100%
```

说明：

- 每个纪元重新选择委员会；
- 候补节点数量是委员会规模的两倍；
- 同一运营方在标准委员会最多占两席；
- 同一运营方不能控制超过全网 10% 的有效质押权重；
- 单一代币最多贡献全网 10% 的有效权重；
- 同一发行方或同一生态发行的多个代币合计最多贡献 15%。

高价值资产必须使用经济覆盖检查：

```text
required_stake_per_node =
  max(
    minimum_base_stake,
    ceil(asset_value * minimum_committee_coverage_ratio / threshold)
  )

threshold_collusion_capital =
  threshold * required_stake_per_node

committee_total_stake =
  committee_size * required_stake_per_node
```

例如 1,000,000 SU 的高价值资产使用 `8-of-11` 时：

```text
required_stake_per_node = 125,000 SU
threshold_collusion_capital = 1,000,000 SU
committee_total_stake = 1,375,000 SU
```

如果没有保险覆盖差额，不允许使用最低 10,000 SU 的普通节点托管高价值资产。

## 六、委员会选择公式

```text
selection_score =
  sqrt(effective_stake)
  * uptime_score
  * delivery_score
  * reputation_score
  * random_factor
```

使用平方根是为了降低单纯大额质押对委员会选择的统治力。

```text
uptime_score       = 30 天在线率
delivery_score     = 历史交付成功率
reputation_score   = 审计、争议和违规记录
random_factor      = 可验证随机数
```

选择流程：

```text
过滤不合格节点
-> 计算运营方有效权重
-> 应用单运营方席位上限
-> 按 score 加权随机抽取
-> 抽取候补节点
-> 公布委员会和 key_epoch
```

## 七、节点准入参数

### 7.1 基础要求

```text
minimum_base_stake = 10,000 SU
maximum_supplemental_weight_share = 50%
minimum_uptime_30d = 99.5%
minimum_reputation_score = 60 / 100
unbonding_period = 30 days
```

### 7.2 技术条件

建议最低配置：

```text
4 vCPU
8 GB RAM
200 GB NVMe
独立 KMS 或 HSM
至少两个独立 RPC 提供方
固定公网入口
签名节点软件版本
自动备份和告警
```

密钥份额体积很小，硬件成本主要来自密钥安全、在线率和监控。

### 7.3 运营独立性

同一运营方的节点必须：

- 使用不同节点身份和签名密钥；
- 使用独立 KMS/HSM 登录权限；
- 不能共享根管理员；
- 不能通过同一个单点控制全部节点；
- 至少一个节点故障不能导致其他节点同时失效。

## 八、多代币质押参数

### 8.1 V1 风险层级

| 层级 | 示例 | 折扣 | 基础质押资格 | 权重上限 |
| --- | --- | --- | --- | --- |
| A | OKB、主流稳定币 | 100% | 是 | 单代币 15% |
| B | IMOO、成熟高流动性代币 | 60% | 否 | 单代币 10% |
| C | 合作项目方代币 | 25% | 否 | 单代币 5% |
| D | 高风险或不可验证代币 | 0% | 否 | 不接受 |

### 8.2 基础质押

```text
minimum_base_stake = 10,000 SU
maximum_supplemental_weight_share = 50%
```

节点必须持续保持至少 `10,000 SU` 的 A 层基础质押。B 层和 C 层代币只能增加
选择权重，最多占选择权重的 50%，不能替代基础质押。

这样可以防止某个项目方发行大量低价值代币后控制委员会。

### 8.3 项目方代币准入

项目方代币申请进入 B 层时，建议至少满足：

```text
公开交易历史 >= 90 days
30 日平均日交易量 >= 500,000 SU
30 日平均流动性 >= 1,000,000 SU
合约经过独立审计
没有无限增发、黑名单或任意修改余额
价格来源至少有两个独立来源
发行方和节点运营方身份清楚
```

C 层可由治理单独批准，但建议：

```text
公开交易历史 >= 30 days
30 日平均流动性 >= 250,000 SU
单一代币全网权重 <= 5%
```

任何不满足风险要求的代币，权重可以设为 0。不能因为代币已经质押就永久保持
有效权重。

### 8.4 价格预言机

```text
minimum_oracle_sources = 2
preferred_oracle_sources = 3
oracle_aggregation = median
price_window = 1 hour TWAP
maximum_source_deviation = 5%
price_staleness_limit = 10 minutes
```

价格异常时：

```text
暂停提高该代币权重
-> 使用上一有效快照
-> 通知节点补仓
-> 必要时把权重降为 0
```

### 8.5 质押维护

```text
base_stake_ratio = base_stake / minimum_base_stake

>= 120%       正常
100% - 119%   警告
80% - 99%     48 小时补仓
< 80%         暂停委员会资格
```

节点在补仓期内可以继续完成已绑定订单，但不能参与新委员会选择。

## 九、密钥与交付参数

```text
content_key_per_version = true
share_scheme = verifiable secret sharing
share_storage = KMS or HSM
key_epoch_required = true
payment_finality_blocks = 12
delivery_timeout = 72 hours
delivery_retry_window = 24 hours
max_delivery_attempts = unlimited with backoff
```

交付规则：

- 付款确认不足 12 个区块，不交付；
- 达到阈值节点确认后自动结算；
- 72 小时内未达到阈值，自动退款；
- 同一订单的份额和结算只能执行一次；
- 节点不能自己更改买方公钥、版本或 key epoch。

## 十、服务费参数

### 10.1 默认收费结构

V1 建议：

```text
network_fee_rate = 1.0% of buyout value
```

费用从卖方收入中扣除，买方看到的是资产标价，不额外增加隐藏费用。

### 10.2 奖励分配

```text
参与交付委员会节点     70%
候补和在线节点         10%
保险池                 10%
持续存储基金            7%
协议治理基金            3%
```

这是初始建议，治理可以修改。任何比例变更必须延迟生效。

### 10.3 节点实际奖励

每个节点奖励由以下因素决定：

```text
effective_stake_snapshot
participated_delivery
uptime_score
delivery_score
asset_risk_level
storage_duration
recovery_contribution
```

只质押、不在线、不参与交付的节点不能获得完整节点奖励。

### 10.4 持续存储费

买断费不能支付永久存储。每个资产需要：

```text
storage_reserve_rate = 2.0% of buyout value
minimum_storage_reserve = 100 SU
initial_storage_reserve >= 24 months
renewal_period = 12 months
```

储备金可以由卖方在发布时预存，也可以在后续版本发布时补充。若储备金耗尽，资产
进入续费提醒，但已经交付给买方的历史密钥不受影响。

## 十一、惩罚参数

| 违规 | 初始惩罚 |
| --- | --- |
| 单次短期离线 | 0.5% 有效质押 |
| 30 天在线率低于要求 | 2% 有效质押 |
| 拒绝已批准交付 | 5% 有效质押 |
| 提交无效份额 | 20% 有效质押 |
| 同一订单矛盾响应 | 30% 有效质押 |
| 可证明的有组织作恶 | 50% 至 100% 有效质押 |
| 无法证明的密钥泄露 | 进入审计和保险流程 |

规则：

- 连续违规累计惩罚；
- 单月普通违规惩罚上限为有效质押的 10%；
- 重大作恶不受普通上限限制；
- 惩罚前保留证据和申诉窗口；
- 不允许一个管理员直接划走节点全部质押。

罚没顺序：

```text
违规相关代币头寸
-> 基础质押
-> 保险池
```

## 十二、解除质押

```text
unbonding_period = 30 days
last_delivery_obligation = must be completed
key_epoch_exit = no new assets
```

节点申请退出后：

1. 不再进入新委员会；
2. 完成已绑定交付或等待替代节点；
3. 30 天内保持可罚没状态；
4. 完成密钥份额迁移；
5. 解除剩余质押。

不能证明节点已经删除旧份额。高价值旧资产需要重分发或重新加密。

## 十三、治理参数

建议初始治理：

```text
parameter_multisig = 3-of-5
parameter_timelock = 72 hours
emergency_pause = 3-of-5
emergency_pause_max = 72 hours
```

治理成员初始可以来自：

```text
IMOO
IGNIX
独立安全成员
节点运营方代表
外部审计或法律成员
```

治理不能直接读取密钥份额，也不能代替阈值节点解密。

## 十四、参数变更流程

```text
提案
-> 参数模拟
-> 风险影响报告
-> 72 小时延迟
-> 3-of-5 签名
-> 新参数纪元生效
```

委员会、折扣、质押上限和服务费的变更，不能追溯修改已经完成的订单。

## 十五、V1 默认参数汇总

```text
启动委员会              2-of-3
标准委员会              6-of-9
高价值委员会            8-of-11
纪元                    7 days
基础安全质押            10,000 SU
补充质押权重上限        50%
单运营方权重上限        10%
单代币权重上限          10%
单发行方集团上限        15%
委员会资产覆盖率        100%
交付超时                72 hours
付款确认                12 blocks
解除质押                30 days
网络服务费              1.0%
节点奖励                参与节点 70%
持续存储储备            24 months
参数治理                3-of-5 + 72h
```

## 十六、待评审参数

以下参数需要人工确认后再进入实现：

1. A 层基础资产是否只接受 OKB 和稳定币；
2. IMOO 在 B 层的折扣是否固定为 60%；
3. 10,000 SU 最低质押是否适合启动期；
4. 标准委员会是否采用 `6-of-9`；
5. 网络服务费是否固定为 1.0%；
6. 参与节点、保险池和存储基金的比例；
7. 72 小时交付超时是否足够；
8. 30 天解除质押是否覆盖争议窗口。
