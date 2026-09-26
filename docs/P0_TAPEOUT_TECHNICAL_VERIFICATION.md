# P0 TapeOut Technical Verification

状态：链上接口、画布导入和主网流片均已完成

日期：2026-09-23

网络：X Layer Mainnet，Chain ID 196

样本合约：

`0x0dba1bcb8abdc1be2a0a2f9d9ddc745f32297239`

## 一、验证目标

- 确认组合电路调用方式；
- 确认时序电路调用方式；
- 确认输入、输出和状态字节顺序；
- 确认 Circuit 是否保存状态；
- 确认 `state_out` 是否需要外部保存；
- 为 License Quota Step 确定可实现的接口。

## 二、函数签名

### 组合电路

```solidity
function eval(uint256 circuitId, bytes input) view returns (bytes output);
```

函数选择器：

```text
0x934d06ea
```

在含 LATCH 的 Circuit 上调用时，实际回退信息为：

```text
has latch: use step
```

### 时序电路

```solidity
function step(
  uint256 circuitId,
  bytes stateIn,
  bytes input
) view returns (bytes stateOut, bytes output);
```

函数选择器：

```text
0xe8281a1a
```

OpenChain 已收录完全相同的已验证函数签名。

## 三、调用测试

测试 Circuit：

```text
Circuit 1
2 inputs / 1 output / 1 latch

Circuit 2
2 inputs / 1 output / 1 latch
```

输入和状态均使用一个字节：

```text
0x00 = 00
0x01 = 01
0x02 = 10
0x03 = 11
```

Circuit 1 结果：

| stateIn | input | stateOut | output |
| --- | --- | --- | --- |
| `00` | `0` | `0` | `0` |
| `01` | `0` | `1` | `1` |
| `10` | `0` | `0` | `0` |
| `11` | `0` | `1` | `1` |
| `00` | `1` | `0` | `0` |
| `01` | `1` | `1` | `1` |
| `10` | `1` | `0` | `0` |
| `11` | `1` | `1` | `1` |

Circuit 2 结果：

| stateIn | input | stateOut | output |
| --- | --- | --- | --- |
| `00` | `0` | `0` | `0` |
| `01` | `0` | `0` | `1` |
| `10` | `0` | `0` | `0` |
| `11` | `0` | `0` | `1` |
| `00` | `1` | `1` | `0` |
| `01` | `1` | `1` | `1` |
| `10` | `1` | `1` | `0` |
| `11` | `1` | `1` | `1` |

## 四、已确认结果

1. Circuit 是只读计算，不需要钱包，也不产生交易。
2. `eval` 不能调用含时序位的 Circuit。
3. `step` 的实际参数顺序是 `stateIn`，然后是 `input`。
4. 返回 tuple 的第一段是下一状态 `stateOut`。
5. 返回 tuple 的第二段是当前输出 `output`。
6. Circuit 不保存或更新状态。
7. 调用方必须保存 `stateOut`，并在下一次调用时作为 `stateIn` 传入。
8. bytes 使用小端位序；`0x01` 对应最低位，`0x02` 对应下一位。
9. X Layer 当前仍然限制已流片 Circuit 的回铺和子电路流片。

## 五、对 License Quota Step 的结论

可以实现为 `step` Circuit。

### stateIn

```text
quota[3:0]
```

占一个 byte 的低四位。

### input

```text
bit 0: consume
bit 1: license_valid
bit 2: service_available
```

### output

```text
bit 0: allow
bit 1-2: deny_reason[1:0]
```

### stateOut

```text
remaining[3:0]
```

Trust Registry 必须保存 `stateOut`。Circuit 本身不保存。

## 六、主网验证

- License Quota Step 流片后 `step` 顺序已按实际链上行为校正；
- Skill Gate 主网 Circuit ID 为 `1`；
- License Quota Step 主网 Circuit ID 为 `2`；
- 两枚 Circuit 均已通过主网调用验证。

画布导入、自检和主网流片均已完成。

## 七、画布 BLIF 规则

从 TapeOut 官方前端 bundle 读取到的当前导入规则：

- 只支持单个 `.model`；
- 支持 `.names` 和 `.latch`；
- `.latch` 至少写成 `.latch input output`；
- 显式时钟只支持边沿触发 `re` / `fe`；
- 整个设计只能有一个隐式时钟域；
- 链上初始状态一律为 `0`；
- 初值 `1` 暂不支持；
- 未定义或未知初值按 `0` 处理；
- `.names` 最多 8 个输入，最多 512 个乘积项；
- 文件、引脚和单元数量均有上限；
- 已流片 Circuit 在 X Layer 的铺回和子组合仍受限。

License Quota Step 采用无显式时钟的 `.latch input output` 写法，符合单隐式
时钟域规则。

## 八、画布导入结果

### Skill Gate

```text
引脚：9 进 / 7 出
网表逻辑：48 NAND
输出缓冲：14 NAND
实际消耗：62 NAND
时序单元：0
上链字节：434 B
自检：通过
```

### License Quota Step

```text
引脚：3 进 / 7 出
网表逻辑：94 NAND + 4 LATCH
输出缓冲：14 NAND
实际消耗：108 NAND + 4 LATCH
上链字节：772 B
初始状态：0
自检：通过
```

画布确认：

- `.latch` BLIF 可以正常解析；
- 4 个时序单元被正确识别；
- 单隐式时钟域检查通过；
- 初始未知值按链上规则归零；
- 两个文件均未发送任何交易。
