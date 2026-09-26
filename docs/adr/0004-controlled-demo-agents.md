# ADR 0004: Controlled Demo Agents

状态：已接受

## Context

V1 需要一个 Agent A / Agent B 闭环，但项目当前没有两个独立的外部 Agent
参与者。等待第三方接入会阻塞协议验证，也会让团队为了演示而伪造外部需求。

这里需要区分两件事：

- 两个独立的经济主体；
- 两个隔离的协议角色。

黑客松 V1 需要证明后者，不宣称前者。

## Decision

1. V1 使用两个 `Controlled Demo Agent`。
2. 两个 Demo Agent 可以由同一个 Operator 控制。
3. 每个 Demo Agent 必须拥有独立的 `agent_id`、状态命名空间和签名身份。
4. Agent A 固定为 `CREATOR / OWNER`，Agent B 固定为 `LICENSEE / BUYER`。
5. Demo Agent 不得共用凭证、License、Receipt 或运行状态。
6. UI 和 Receipt 必须明确标注 `controlled_demo=true`。
7. 内部调用可以验证协议，但不能被描述成第三方采用或外部付费需求。
8. 真正独立的第三方 Agent 接入属于 V1 之后的验证阶段。

## Consequences

正向：

- 不再依赖尚未存在的第三方 Agent；
- 可以真实验证身份隔离、授权、额度和 Receipt；
- Demo 可以完整复现；
- 后续把 Controlled Demo Agent 替换为外部 Agent 时，不需要更换协议模型。

限制：

- 不能宣称已有两个独立市场参与者；
- 不能把内部调用包装成外部收入；
- 公开材料必须显示 Demo 身份标签。
