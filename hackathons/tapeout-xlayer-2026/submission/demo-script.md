# SkillPass Demo Script

状态：最终演示脚本。公开视频的 2 分 45 秒成片按此流程制作。

## Demo 目标

在五分钟内展示：

1. Agent A 创建 Skill Passport；
2. Agent B 获得 License；
3. Agent 能力和 License 存在于 Trust Registry；
4. TapeOut Circuit 完成公开、只读、确定性的授权计算；
5. Registry 保存状态；
6. Agent B 通过 OKX.AI 完成真实调用；
7. Service Operator 完成交付；
8. Receipt 可公开查看；
9. IMOO 作为第一家真实 Agent Company 复用相同流程。

## Demo 前准备

- Processor 已部署；
- Skill Gate 已流片；
- License Quota Step 已流片并完成链上验证；
- Trust Registry 已创建；
- Research-to-Story Service 已发布；
- 普通 Agent A 和 Agent B 已准备好；
- 测试请求不会泄漏私钥、模型 Key 或私有数据。

## 场景

Agent A 提供一项通用研究 Skill。Agent B 需要把一组公开研究资料转换为一个
面向普通读者的短故事和图片提示词。

## 演示步骤

### 1. 展示 Skill Passport

显示：

```text
Skill: research_to_story
Version: 1
Owner: Agent A
Creator Proof: ...
OKX.AI Service: ...
Circuit ID: ...
```

### 2. 展示 License 和额度

显示 Registry 中的：

```text
Licensee: Agent B
License Type: per_call
Quota Remaining: N
Revoked: false
```

### 3. 调用 Skill Gate

展示输入和输出：

```text
skill_valid = 1
licensed = 1
service_available = 1
allow = 1
route_id = 1101
royalty_bucket = 00
```

### 4. 计算并保存下一状态

如果 License Quota Step 已启用，展示：

```text
quota_in = N
consume = 1
allow = 1
remaining = N-1
```

随后展示 Registry 已保存 `remaining = N-1`。

如果尚未启用，则明确展示 Registry 自行更新额度，不把该功能归功于 Circuit。

### 5. 发起 OKX.AI Service

展示：

- Service；
- Job ID；
- 请求摘要；
- 付款状态。

### 6. Service Operator 执行与交付

展示：

- 调研来源；
- 短故事；
- 图片提示词；
- 风险或不确定项。

### 7. 验证 Receipt

展示：

- Circuit ID；
- Skill 版本；
- License ID；
- OKX.AI Job ID；
- 结果哈希；
- Registry 和链上引用。

### 8. IMOO 复用展示

展示 IMOO 作为第一家真实 Agent Company 使用相同 SkillPass 流程。

## 失败场景演示

至少演示一种拒绝：

```text
License 无效
-> allow = 0
-> deny_reason = invalid_license
```

或：

```text
额度耗尽
-> allow = 0
-> deny_reason = quota_exhausted
```

## 禁止展示

- 私钥；
- 模型 Key；
- 用户隐私；
- 伪造交易；
- 不存在的收入；
- 固定收益；
- “Circuit 自己保存状态”的错误说法。
