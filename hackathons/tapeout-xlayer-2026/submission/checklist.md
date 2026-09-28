# Submission Checklist

状态：发布候选。代码、链上对象、Demo、视频、GitHub Pages 和提交材料已完成；仅剩 X 发布和 Contact Email 两个提交人动作。

## 本地设计

- [x] X Layer / BNB Agent Commerce IP Core 调研
- [x] Skill Gate BLIF 完成
- [x] Skill Gate 512 组输入验证
- [x] Skill Gate 画布导入和自检
- [x] SkillPass 五个一级页面 — 控制台实际有 7 个一级视图（公开演示 / 运行总览 / Skill Passport / License Desk / Service Console / Receipts / Rights & Revenue）
- [x] SkillPassport ID 与 Standard Cell ID 分离 — 见 `docs/AGENT_STANDARD_CELL_LIBRARY_V1.md:317`
- [x] Trust Registry 权威模型确认 — “X Layer Trust Registry 是权利状态权威”，见 `docs/AGENT_COMPANY_PROTOCOL_V1.md:89`

## 可选的第二枚电路

- [x] License Quota Step 规格确认
- [x] License Quota Step BLIF 完成
- [x] License Quota Step 128 组输入验证
- [x] License Quota Step 画布导入、4 LATCH 识别和自检

## X Layer

- [x] 最终选择稀缺或公共标准供应参数
- [x] 创建 IMOO Standard Deployer
- [x] Processor 参数最终确认
- [x] Processor 主网部署
- [x] Skill Gate 铸造晶体管
- [x] Skill Gate 流片
- [x] License Quota Step 完成主网流片和链上调用验证
- [x] Processor 地址保存
- [x] Circuit IDs 保存
- [x] 交易哈希保存并列入 `SUBMISSION_VALUES.md`

## 产品

- [x] Skill Passport 页面
- [x] License Desk 页面
- [x] Service Console 页面
- [x] Receipts 页面
- [x] Rights & Revenue 页面
- [x] Trust Registry 合约部署
- [x] License 创建和撤销
- [x] Quota 持久化
- [x] Skill Service Binding
- [x] Research-to-Story Service 本地真实模型闭环
- [x] 普通 Agent A/Agent B 无 IMOO 闭环
- [x] IMOO 第二展示案例 — 链上服务 `service:research_to_story` 的运营方就是 `agent:imoo_operator`，两个公开页面现在都显式显示 `Operator: IMOO Service Operator`。注：目前与第一段共用同一批链上对象，区别在展示的身份；若需要一套完全独立的 IMOO 对象，另行创建
- [x] 真实任务
- [x] 交付结果
- [x] Receipt

## Demo

- [x] 中文 Demo 页面
- [x] 英文技术说明
- [x] 拒绝场景 — 链上已有 `REJECTED` 凭证 `receipt:ee3a9282-59b2-4676-9d31-f4c45d4d36b1`
- [x] 成功场景
- [x] Demo 视频 — GitHub Release `competition-demo-v2` 中的 `skillpass-competition-final.mp4`（1920×1080，165s / 2分45秒，英文配音 + 中英双字幕）
- [x] 公开链接无需申请权限 — `https://imoo.meme/skillpass/#/demo` 已上线：Gateway 将 `/skillpass/*` 路由到独立容器 `0xfdBa7FeDeD2A665B3c7601bEf8CDDDAF162E1836`；技术直连为 `https://1-2-223.tapekit.org/#/demo`
- [x] GitHub Pages — `https://ignix-imoo.github.io/skillpass/`
- [x] 公开视频 — `https://github.com/IGNIX-IMOO/skillpass/releases/tag/competition-demo-v2`

## 提交

- [x] 公开 GitHub 仓库
- [x] GitHub 仓库地址已加入公开 Demo 页面
- [x] Project Name
- [x] Project Description
- [x] Processor Address
- [x] Deployment Wallet
- [x] Product Demo
- [x] Circuit IDs
- [x] Tape-out Transactions

> 以上字段的取值见 `SUBMISSION_VALUES.md`，已逐条对源核验（含 X Layer 节点只读复检）。

- [ ] X Post — 文案已准备：`submission/x-post.md`，等待实际发布
- [ ] Contact Email

## 安全

- [x] 无私钥 — 已扫描已提交文件，无任何私钥或助记词
- [x] 无模型 Key — 模型配置在仓库外的 `IMOO-Agent-Data/provider.json`
- [x] 无用户隐私
- [x] 无伪造交易 — 5 笔交易已对 X Layer 节点只读复检，全部 `status 0x1`
- [x] 无固定收益承诺
- [x] 无 Circuit 持久状态的错误描述 — 视频明说「The circuit never does」
- [x] 无 SkillPassport ID / Standard Cell ID 混用
