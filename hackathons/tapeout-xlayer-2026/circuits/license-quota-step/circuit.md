# License Quota Step

状态：已 TapeOut 主网流片，Circuit ID 为 `2`

## 目标

在不依赖 Circuit 持久状态的前提下，根据当前额度和本次消费请求计算：

- 本次是否允许；
- 拒绝原因；
- 消费后的下一额度。

Circuit 不保存 `remaining`。Trust Registry 负责保存并提交下一次调用的
`quota` 输入。

## 输入

| 信号 | 位宽 | 含义 |
| --- | ---: | --- |
| `quota` | 4 | 当前剩余额度 |
| `consume` | 1 | 是否请求消费一次 |
| `license_valid` | 1 | License 是否有效 |
| `service_available` | 1 | Service 是否可用 |

## 输出

| 信号 | 位宽 | 含义 |
| --- | ---: | --- |
| `allow` | 1 | 是否允许本次消费 |
| `remaining` | 4 | 消费后的下一额度，同时作为 `stateOut` |
| `deny_reason` | 2 | 拒绝原因 |

## 拒绝编码

| ID | 含义 |
| --- | --- |
| `00` | none |
| `01` | invalid_license |
| `10` | service_unavailable |
| `11` | quota_exhausted |

## 逻辑

```text
if license_valid = 0:
  allow = 0
  remaining = quota
  deny_reason = invalid_license
else if service_available = 0:
  allow = 0
  remaining = quota
  deny_reason = service_unavailable
else if quota = 0:
  allow = 0
  remaining = 0000
  deny_reason = quota_exhausted
else if consume = 1:
  allow = 1
  remaining = quota - 1
  deny_reason = none
else:
  allow = 1
  remaining = quota
  deny_reason = none
```

## 时序

本单元属于 TapeOut 时序电路，计划使用 `step`：

```text
state_in + input
-> state_out + output
```

其中：

```text
state_in = quota
state_out = remaining
```

Registry 必须显式保存 `state_out`。Circuit 自身不保存。

X Layer 实测已经确认：

```solidity
step(uint256 circuitId, bytes stateIn, bytes input)
  view
  returns (bytes stateOut, bytes output)
```

函数选择器为 `0xe8281a1a`。实际链上调用确认：

- 第一个参数是 `stateIn`；
- 第二个参数是 `input`；
- 第一段返回值是 `stateOut`；
- 第二段返回值是当前 `output`。

详细证据见：

`docs/P0_TAPEOUT_TECHNICAL_VERIFICATION.md`

## 画布结果

```text
3 进 / 7 出
94 NAND + 4 LATCH
14 NAND 输出缓冲
实际消耗 108 NAND + 4 LATCH
772 B
初始状态 0
自检通过
```

## 本地文件

- `license-quota-step.blif`
- `verify.mjs`
- `truth-table.csv`
- `test-vectors.json`

## 必须验证

- License 无效时拒绝且额度不变；
- Service 不可用时拒绝且额度不变；
- 额度为零时拒绝；
- 请求消费且额度存在时减一；
- 不请求消费时只读返回；
- `state_out` 可以由下一次调用的 `state_in` 重新输入；
- 所有拒绝原因编码正确；
- 128 组输入组合全部通过。

## 不负责的事情

- 不保存额度；
- 不创建或撤销 License；
- 不处理付款；
- 不调用 OKX.AI；
- 不更新 Service 状态；
- 不替代 Trust Registry。

## 链上验证

- 已完成主网流片：Circuit ID `2`；
- 已完成 `consume / invalid_license / service_unavailable / quota_exhausted`
  四组链上调用验证。
