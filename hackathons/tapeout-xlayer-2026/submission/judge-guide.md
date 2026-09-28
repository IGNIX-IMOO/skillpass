# Judge Guide

状态：参赛发布候选，全部实现证据已就绪

## 项目定位

SkillPass 是 Agent Company Protocol 的第一个可见产品。

Agent Standard Cells 是 SkillPass 使用的技术实现和 TapeOut Processor。

产品类别是 Agent Commerce IP Core Library。

它不复制 OKX.AI 市场，不创建第二套付款系统，也不与 Remembrance Seal 的
通用动作权限重复。

## 公开入口

- GitHub 源码与参赛材料：
  `https://github.com/IGNIX-IMOO/skillpass`
- 链上 Demo：
  `https://imoo.meme/skillpass/#/demo`
- 技术直连 Demo：
  `https://1-2-223.tapekit.org/#/demo`
- TapeOut 项目页：
  `https://tapeout.net/#l2/xlayer/0x6586c806b192b167e3d56ad669ee60fcb16c3082`
- GitHub Pages：
  `https://ignix-imoo.github.io/skillpass/`
- 演示视频：
  `https://github.com/IGNIX-IMOO/skillpass/releases/tag/competition-demo-v2`

## 评审维度映射

### 应用创新

让 Agent Skill 第一次拥有可查看的 Passport、License、Service、Receipt 和
权利记录，并把底层规则拆成可复用 TapeOut 标准单元。

### TapeOut 集成深度

- 真实 X Layer Processor；
- 真实 Circuit 流片；
- 使用 `eval` 和 `step`；
- 公开位序和真值表；
- 展示读取外部状态并返回下一状态；
- 不伪造 Circuit 持久状态。

### 产品完整度

- Skill Passport；
- License Desk；
- Service Console；
- Receipts；
- Rights & Revenue；
- Trust Registry；
- Skill Gate；
- License Quota Step；
- OKX.AI Service；
- 普通 Agent A/Agent B；
- IMOO 交付；
- Receipt；
- 公开 Demo。

### 资产发行设计

- Processor；
- Circuit；
- Capability Circuit；
- Skill Passport；
- License；
- Creator Proof；
- Ownership 与 Service Operation 分离。

### X Layer 集成

- X Layer 主网部署；
- OKB 支付；
- 公开 Processor 和 Circuit ID；
- OKLINK 可验证；
- 正确定位 X Layer 当前不支持子电路回铺的限制。

### 用户增长潜力

- 其他 Agent 可以复用相同标准单元；
- 游戏、支付、Vault 和 Agent 市场可以调用；
- IMOO 提供内容和 Telegram 分发。

### 合约与安全

- Circuit 只读；
- Circuit 不能调用其他合约；
- Circuit 不能写状态或转走资产；
- 私钥和模型 Key 永不公开；
- 持久状态由 Registry 更新；
- 不承诺固定收益。

## 与 Remembrance Seal 的差异

| Remembrance Seal | SkillPass |
| --- | --- |
| General Agent action permission | Skill capability and commercial routing |
| ALLOW-ONCE | SkillPassport + Skill Gate |
| DEADMAN | License lifecycle and revocation |
| Company seal | Capability, License, route, royalty, Receipt |

两者是互补关系，不把 DEADMAN 与额度计算直接画等号。

## X Layer 与 BNB 调研结论

项目设计参考了 TapeOut 上已有项目：

| 生态 / 项目 | 观察 | SkillPass 的响应 |
| --- | --- | --- |
| BNB IP Core | CPU、SHA-256、Keccak、NANDPU、PAYCORE 以可复用标准件形成网络 | 建立 Agent Commerce IP Core |
| Remembrance Seal | 权限记忆清楚但电路较浅 | 做许可、额度、路由、版税和 Receipt |
| LoteGate | 状态机深但叙事不清 | 保持产品入口清楚，同时允许多阶段状态 |
| DeSQL | 宣传超过电路能力 | 所有宣传只对应当前电路和证据 |

成功指标不是晶体管铸造量，而是：

- Circuit 数量；
- 外部 Agent 调用；
- 其他项目复用；
- Receipt 数量；
- 真实服务收入。

## 评委应验证的证据

```text
Processor 地址
部署钱包
部署交易
Circuit IDs
流片交易
BLIF
真值表
测试向量
Registry 状态变化
OKX.AI Job
交付结果
Receipt
公开 Demo
```

## 诚实边界

X Layer 当前不能把已流片 Circuit 重新作为画布子电路。V1 的标准单元组合由
外部 Registry 或应用合约完成，不宣称链上电路级组合已经可用。

`Standard Cell ID` 不等于 `SkillPassport ID`。通用 Skill Gate 不代表任何
一个具体 Skill。
