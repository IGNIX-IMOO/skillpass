# 比赛演示录屏计划 V1

状态：方案 1 已确定

方案：

```text
本地录屏完整 2-of-3 交付
+ 公开 TapeOut 网站作为真实链上证据
```

---

## 一、目标

比赛第一提交版本用 `2 分 45 秒`展示完整链路；五分钟版本保留为扩展演示：

```text
SkillPass 身份
-> License
-> Skill Gate
-> License Quota
-> Service Receipt
-> Ownership Order
-> 2-of-3 自动交付
-> 浏览器本地解密
-> Owner 更新
-> 公开链上验证
```

不展示终端、私钥、环境变量、钱包地址余额、代理配置或内部项目文件。

## 二、录屏规格

```text
分辨率：1920 × 1080
页面视口：1440 × 900 或 1600 × 900
浏览器缩放：100%
语言：中文旁白，英文界面保留
主视频时长：2 分 35 秒至 2 分 50 秒
格式：原始 WebM，后期再配音和字幕
```

原始录屏只使用本地页面：

```text
http://127.0.0.1:4177/
```

公开 TapeOut 网站已经在真实浏览器中验证，后期使用已经截取的公开页面画面和真实链接
插入视频，不作为原始自动录屏的稳定依赖。

关闭书签栏、通知、扩展、密码提示和其他私人页面。

## 三、录屏前预检

```text
1. build-package.mjs 显示 Package is current
2. verify-package.mjs 通过
3. verify-node-service.mjs 通过
4. build:public 通过
5. Node A 运行在 4181
6. Node B 运行在 4182
7. Node C 未启动
8. 本地网站运行在 4177
9. 公开网站可以加载 #/overview
10. 浏览器共享 Registry 已重置
```

## 四、主视频镜头顺序

最终主视频按以下时间线提交：

```text
0:00 - 0:10  总览和定位
0:10 - 0:45  使用 Skill 与 Receipt
0:45 - 0:55  从使用进入拥有
0:55 - 1:55  完整买断和 2-of-3 自动交付
1:55 - 2:15  阈值托管图解
2:15 - 2:35  公开 TapeOut 证据
2:35 - 2:45  总 CTA
```

以下详细脚本保留为五分钟扩展演示版本：

### 扩展版 0:00 - 0:25 总览

打开：

```text
http://127.0.0.1:4177/#/overview
```

旁白：

> 这是 SkillPass，一个让 Agent Skill 可以被使用、被证明、被买断并最终被拥有的协议。
> 这不是另一个服务市场，OKX.AI 继续负责服务工作，SkillPass 负责能力资产。

### 扩展版 0:25 - 1:20 使用 Skill

打开本地：

```text
http://127.0.0.1:4177/#/demo
```

操作：

```text
运行一次使用流程
```

展示：

```text
Passport
License
Skill Gate
Quota 从 3 到 2
Service
Receipt
```

旁白：

> Agent B 先按次使用 Research-to-Story。
> Skill Gate 判断授权，License Quota 扣减额度，Service 完成一次任务，Receipt
> 记录真实使用。

### 扩展版 1:20 - 1:50 从使用进入拥有

点击：

```text
使用同一 Receipt 进入买断
```

展示：

```text
Shared Passport
Shared License
Linked Receipt
Current Owner
```

旁白：

> 买断没有去 OKX.AI。
> 它从同一份 Passport、License 和 Receipt 直接进入 Ownership Order。

### 扩展版 1:50 - 2:35 自动买断和阈值交付

点击：

```text
开始自动交付
```

展示：

```text
LISTED
FUNDED
DELIVERING
DELIVERED
COMPLETED
```

展示节点：

```text
Node A online
Node B online
Node C intentionally offline
2 / 3 shares
```

旁白：

> 买方只需要一次付款签名，之后没有买方确认，也没有 IMOO 审核。
> Node A 和 Node B 返回各自加密份额，Node C 保持离线。
> 任意两个份额就可以恢复内容密钥，单个节点无法恢复。

### 扩展版 2:35 - 3:15 本地解密

展示：

```text
Content decrypted
Research-to-Story v1.0.0
```

旁白：

> 浏览器本地重建内容密钥并解密正式技能包。
> 私钥、内容密钥和明文都不写入服务端。

### 扩展版 3:15 - 3:45 Ownership 更新

展示：

```text
Current Owner: Agent B
Ownership transferred
```

旁白：

> 达到交付阈值后，同一份 Registry 状态更新 Owner。
> 从使用能力到拥有资产，是一条连续状态，不是两个独立演示。

### 扩展版 3:45 - 4:30 链上证据

打开：

```text
http://127.0.0.1:4177/#/verify
```

展示：

```text
Processor
Skill Gate
License Quota
Trust Registry
TapeOut Container
```

再打开：

```text
http://127.0.0.1:4177/#/overview
```

旁白：

> Processor、两枚 Circuit 和 Registry 都可以公开验证。
> 最终公开网站本身也发布在 TapeOut Container。

### 扩展版 4:30 - 5:00 总结

返回总览页。

旁白：

> SkillPass 的第一阶段不是把所有网络功能一次做完。
> 它先证明一条完整商业闭环：能力可以被使用，被证明，被买断，并被真正拥有。
> 开放节点、多种代币质押和更大委员会是下一阶段。

## 五、不能出现在画面中的内容

```text
私钥
助记词
API Key
钱包余额
代理配置
终端命令
本地绝对路径
环境变量
个人通知
其他 Codex 窗口
```

## 六、原始录制方式

优先使用自动化 Playwright 视频录制，保证镜头一致。生成文件进入本地 `artifacts/`
目录，不提交 Git。原始录屏完成后再决定是否添加旁白、字幕和剪辑。

首次成功录制：

```text
artifacts/competition-demo/skillpass-local-demo-raw.webm
1600 × 900
VP8
36.6 seconds
```

这个版本用于验证自动操作和画面连续，不是最终成片。后续需要放慢关键状态、加入旁白、
字幕和公开网站截图。

最终比赛母版已经完成并更新到新版网站：

```text
videos/skillpass-competition-demo/renders/skillpass-competition-final-v2.mp4
1920 × 1080
30 fps
2 分 45 秒
H.264 + AAC
约 23 MB
```

第二版视频使用重新录制的本地新版界面，以及新版网站正式发布后的公开页面截图。

字幕统一为一个组件：

```text
粉底黑字
无外框
英文一行
中文一行
英文 28px，长句 25px
中文 20px
```

HyperFrames `delivery` 渲染和 ffprobe 校验均已通过。
