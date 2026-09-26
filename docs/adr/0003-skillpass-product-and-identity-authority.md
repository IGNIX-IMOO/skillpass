# ADR 0003: SkillPass Product and Identity Authority

状态：已接受

## Context

Agent Standard Cell Library 解决了技术实现层，但不能单独作为比赛产品名称。

当前同时存在以下概念：

- Agent Standard Cell Library；
- Agent Skill Foundry；
- SkillPass；
- Skill Circuit；
- Skill Passport；
- Standard Cell。

如果不明确层级和身份权威，会出现：

- 产品看起来像开发工具；
- 通用 Skill Gate 被错误当成所有 Skill 的身份；
- 链上 Registry 与本地数据库争夺状态权威；
- Demo 依赖 IMOO，无法证明通用性；
- 标准单元数量与完整产品闭环混淆。

## Decision

1. 最终愿景使用 `IGNIX Agent Economy`。
2. 行业协议使用 `Agent Company Protocol`。
3. 对外产品使用 `SkillPass`。
4. 接口标准使用 `Agent Trust & Capability Standard`。
5. TapeOut 实现使用 `Agent Standard Cell Library`。
6. 黑客松 Processor 名称保留为 `Agent Standard Cells`。
7. `SkillPassport ID` 是 Skill 的稳定经济身份。
8. `Skill Version` 独立于 SkillPassport。
9. `Capability Circuit ID` 可以是 Skill 可选绑定的专用 Circuit。
10. `Standard Cell ID` 只标识通用逻辑单元，不标识具体 Skill。
11. X Layer 的 `TrustRegistry` 是持久状态的权威。
12. 本地数据库只做缓存、界面、索引和编排，不能成为链上权利权威。
13. IMOO 是第一个真实租户，不是 SkillPass 的运行前提。
14. V1 必须有一个普通 Agent A/Agent B 闭环，不依赖 IMOO。
15. 第一优先级是 Skill Gate 加完整闭环；License Quota Step 是第二优先级。
16. X Layer V1 不宣称电路级子组合。

## Identity Model

```text
SkillPassport ID
= hash(namespace + skill_key)

Skill Version
= semantic version of one Skill definition

Capability Circuit ID
= optional Circuit bound to a Skill or Skill family

Standard Cell ID
= Circuit ID of a reusable logic unit such as Skill Gate
```

标准：

```text
Standard Cell ID != SkillPassport ID
SkillPassport ID != Service ID
Service ID != License ID
License ID != Receipt ID
```

## Authority Model

```text
TrustRegistry on X Layer
持久状态权威

Local Agent Data
界面、缓存、检索、编排、私密运行数据

OKX.AI
Agent Service、Service Order、服务付款、服务交付和服务评价权威

SkillPass Ownership Sale
Skill / 知识资产买断、钥匙交付和所有权交易权威

TapeOut
Circuit、Processor、Container 和链上逻辑权威
```

## Consequences

正向：

- 产品、标准和实现各有明确名称；
- Skill 身份不再依赖通用 Circuit；
- 通用 Demo 可以脱离 IMOO；
- 链上权威不会退化成普通后台；
- 黑客松范围和长期愿景能够分开表达。

负向：

- 需要开发和维护最小 Trust Registry；
- 本地数据层需要同步和冲突处理；
- SkillPass 的产品界面必须真实实现；
- V1 不能只交一枚 Circuit。

## Rejected Alternatives

### 用 Agent Standard Cells 作为最终产品名

拒绝。它准确但过于工程化，无法让普通用户理解产品。

### 用通用 Skill Gate Circuit ID 作为 Skill 身份

拒绝。通用单元会服务多个 Skill，无法代表具体 Skill。

### 只使用本地数据库保存 License

拒绝。这会破坏可验证和通用基础设施定位。

### 强制依赖 IMOO

拒绝。IMOO 是首家样板公司，不是系统前提。
