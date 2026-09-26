# Skill Gate

状态：已 TapeOut 主网流片，Circuit ID 为 `1`

历史名称：Agent Skill Entitlement Router

## 解决的问题

Agent 在调用一项 Skill 之前，需要一个统一、可验证、低成本的判断：

- Skill 是否有效；
- 调用者是否持有 License；
- Service 是否可用；
- 应该路由到哪一个 Skill；
- 使用哪一档 royalty 规则。

Circuit 只做确定性判断。模型推理、工具调用、私有数据和 API Key 都留在链下。

## 输入

| 信号 | 位宽 | 含义 |
| --- | ---: | --- |
| `skill_id` | 4 | Skill 编号 |
| `skill_valid` | 1 | Skill 和版本是否有效 |
| `licensed` | 1 | 调用者是否持有有效 License |
| `service_available` | 1 | 绑定 Service 是否可用 |
| `license_type` | 2 | 许可和版税类型 |

## 输出

| 信号 | 位宽 | 含义 |
| --- | ---: | --- |
| `allow` | 1 | 是否允许调用 |
| `route_id` | 4 | 允许时等于 `skill_id`，拒绝时为 `0000` |
| `royalty_bucket` | 2 | 允许时等于 `license_type`，拒绝时为 `00` |

## 逻辑

```text
allow = skill_valid AND licensed AND service_available
route_id = allow ? skill_id : 0000
royalty_bucket = allow ? license_type : 00
```

## Skill ID

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

## 在标准单元库中的位置

`Skill Gate` 是 Agent Standard Cell Library 的第一枚组合逻辑标准单元。

X Layer 当前不支持把已流片 Circuit 作为画布子电路继续流片，因此 V1 中的
组合发生在外部 Trust Registry 或应用合约：它们读取本单元输出，再调用其他
标准单元并保存持久状态。

## 实现约束

- 纯组合逻辑；
- 只使用 NAND 等价逻辑；
- 本地逻辑描述使用 16 个 BLIF 组合块；
- 画布综合后实际消耗 62 NAND；
- 不需要 LATCH，不保存状态；
- 拒绝调用时所有路由和版税输出归零。

## 画布结果

```text
9 进 / 7 出
48 NAND + 14 输出缓冲
实际消耗 62 NAND
434 B
自检通过
```

## 必须验证

- 合法 Skill、有效 License、可用 Service 可以调用；
- 无 License 时拒绝；
- Service 不可用时拒绝；
- Skill 无效时拒绝；
- 拒绝时 `route_id=0000`；
- 拒绝时 `royalty_bucket=00`；
- 允许时路由和版税与输入一致。

## 不负责的事情

- 不验证事实真实性；
- 不运行模型；
- 不保存完整 License；
- 不处理付款、退款、仲裁或评价；
- 不替代 OKX.AI Service；
- 不替代本地 Skill Registry 的扩展数据。
