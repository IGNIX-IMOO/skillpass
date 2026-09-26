# SkillPass 比赛演示 V1

状态：范围冻结，待实现

上位文档：

- `SKILLPASS_PRODUCT_V1.md`
- `SKILL_ASSET_ENCRYPTION_V1.md`
- `KEY_CUSTODY_NETWORK_V1.md`

相关决定：`docs/adr/0007-unified-competition-demo.md`

---

## 一、比赛目标

比赛只证明一个完整商业闭环：

> Agent Skill 可以被调用，被证明有价值，被直接买断，并在付款后自动交付完整能力。

统一叙事：

```text
使用 Skill
-> 产生真实调用和 Receipt
-> 买断 Skill
-> 2-of-3 自动交付
-> 买方拥有资产
```

比赛不是开放质押网络发布会。多代币质押、委员会选举、奖励、惩罚、保险和治理不进入
比赛主流程。

## 二、一个统一产品

比赛网站是一个产品，不是多个互不相干的项目。

导航建议：

```text
运行总览
使用 Skill
拥有 Skill
公开验证
```

对应路由：

```text
#/overview
#/demo
#/ownership
#/verify
```

### 运行总览

展示：

- Agent Company Protocol；
- SkillPass；
- 已部署 Processor、两组 Circuit 和 Trust Registry；
- 完整闭环图；
- 当前真实链上数据。

### 使用 Skill

展示：

- Skill Passport；
- License；
- Skill Gate；
- License Quota；
- Service 调用；
- Receipt。

### 拥有 Skill

展示：

- 当前版本和内容哈希；
- 买断价格；
- 买方注册公钥；
- 站内付款；
- 2-of-3 自动交付；
- 买方本地重建密钥；
- Ownership 状态。

### 公开验证

展示：

- X Layer Processor；
- Skill Gate Circuit；
- License Quota Circuit；
- Trust Registry；
- TapeOut Container；
- 公开 Receipt；
- 所有权转移证据。

## 三、比赛技能

比赛只使用一个技能：

```text
Research-to-Story
```

它贯穿使用和拥有两个阶段：

```text
Agent B 调用 Research-to-Story
-> 得到一次 Research-to-Story 结果
-> Receipt 证明这次调用
-> Agent B 买断完整 Skill
-> Agent B 获得加密内容和所有权
```

## 四、比赛完整流程

```text
1. Agent A 创建 Research-to-Story SkillPassport
2. Agent A 发布 Skill Version 和公开说明
3. Agent B 获得一个 per-call License
4. Skill Gate 返回授权和路由
5. License Quota 计算下一次额度
6. Trust Registry 保存 stateOut
7. Service Operator 完成一次任务
8. Receipt 记录调用结果
9. Agent B 在站内发起所有权买断
10. Agent B 注册解密公钥
11. 买断款项进入站内 Ownership Sale 合约
12. 系统监听到付款确认
13. 2-of-3 演示节点验证订单
14. 任意两个节点返回加密份额
15. Agent B 在浏览器本地重建内容密钥
16. Agent B 解开完整资产
17. Ownership 转给 Agent B
18. 页面显示使用记录、买断记录和所有权结果
```

## 五、比赛版做

- 一个统一网站；
- 一个统一技能；
- 一次按次使用；
- 一次买断；
- 现有两枚 Circuit；
- 现有 Trust Registry；
- 站内 Ownership Sale；
- 三个演示密钥节点；
- `2-of-3` 自动交付；
- 普通钱包加密文件交付；
- 浏览器本地解密；
- 一个 Ownership Receipt 或状态证明。

## 六、比赛版不做

- 多代币质押；
- 项目方代币接入；
- `6-of-9` 和 `8-of-11`；
- 节点委员会选举；
- 候补节点；
- 跨纪元份额迁移；
- 奖励分配；
- 罚没；
- 保险池；
- 治理投票；
- DeWEB 和文件双主通道；
- 多链；
- 高价值资产覆盖率；
- 通用二级市场。

这些功能保留在 `POST_COMPETITION_ROADMAP.md`。

## 七、真实与演示必须分开标记

### 已上链

```text
Processor
Skill Gate
License Quota
Trust Registry
TapeOut Container
公开网站
公开验证脚本
```

### 比赛演示

```text
站内 Ownership Sale
2-of-3 自动交付
三个演示节点
普通钱包加密文件交付
浏览器本地重建密钥
```

### 后续路线

```text
开放节点加入
多代币质押
6-of-9 / 8-of-11
奖励和惩罚
保险和治理
```

演示节点即使运行在三个进程或三台机器上，也必须显示：

```text
当前模式：2-of-3 演示
生产目标：独立控制方
```

## 八、公开验证证据

比赛页面至少给出：

| 证据 | 来源 |
| --- | --- |
| Processor | X Layer |
| Skill Gate | X Layer Circuit |
| License Quota | X Layer Circuit |
| SkillPassport | Trust Registry |
| License | Trust Registry |
| Quota state | Trust Registry |
| Service Receipt | Trust Registry |
| Ownership Order | Ownership Sale 合约 |
| 支付交易 | X Layer |
| 交付证明 | 两个不同节点签名 |
| Ownership 转移 | X Layer |

## 九、主视频脚本

比赛第一提交版本为 `2 分 45 秒`。五分钟版本保留为扩展演示，不作为默认提交。

### 0:00 - 0:45：使用

```text
打开运行总览
说明 SkillPass 让能力拥有身份、许可、调用证明和所有权
```

### 0:45 - 1:20：调用

```text
Agent B 获得 License
Skill Gate 返回 allow
License Quota 扣减额度
Service 完成一次 Research-to-Story
Receipt 上链
```

### 1:20 - 2:05：买断

```text
Agent B 打开 Ownership Exchange
注册解密公钥
确认价格并付款
```

### 2:05 - 2:30：自动交付与链上证据

```text
页面显示付款确认
节点 A 和节点 B 返回加密份额
节点 C 保持离线
买方仍然成功重建密钥并解密
```

故意让节点 C 离线，可以证明一个节点故障不会阻断交付。

### 2:30 - 2:45：所有权和收尾

```text
页面显示 Ownership 已转移
打开公开验证页
展示 Circuit、Registry、Receipt、付款和交付证明
```

## 十、验收条件

1. 一个网站可以完成“使用到拥有”；
2. 使用流程和买断流程共用同一个 Skill；
3. 三个演示节点各保存一个份额；
4. 任意一个节点离线时仍能交付；
5. 一个节点不能重建完整密钥；
6. 买方付款后不需要再次确认；
7. 所有权只在达到阈值交付后转移；
8. 页面清楚区分真实链上证据和比赛演示；
9. 所有高级网络功能只显示为路线图；
10. 现有 57/59 提交成果不被破坏。

## 十一、成功标准

评委应该能在三分钟内回答：

```text
这个 Skill 是什么？
谁在使用它？
为什么可以证明它被使用？
怎么买断？
付款后为什么能自动得到内容？
为什么单一节点或 IMOO 不能单独解密？
所有权现在归谁？
哪些是链上真实证据？
哪些是比赛演示和后续计划？
```
