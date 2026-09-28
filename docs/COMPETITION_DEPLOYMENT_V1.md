# SkillPass 比赛版部署记录 V1

状态：最终参赛版本。链上网站、GitHub Pages、公开视频和提交材料均已发布。

发布时间：2026-09-26

最终复核：2026-09-28

公开地址：

```text
https://imoo.meme/skillpass/#/demo
```

技术直连地址：

```text
https://1-2-223.tapekit.org/#/demo
```

`imoo.meme/skillpass/*` 会由自定义 Gateway 映射到 `1.2.223.tape`，读取与
技术直连相同的独立容器；它不会复制或回退到 IMOO 首页所在的 `3.2.223.tape`。

TapeOut 项目页：

```text
https://tapeout.net/#l2/xlayer/0x6586c806b192b167e3d56ad669ee60fcb16c3082
```

链上名称：

```text
1.2.223.tape
```

Container：

```text
0xfdBa7FeDeD2A665B3c7601bEf8CDDDAF162E1836
```

---

## 一、发布内容

```text
assets/index-BRivpf6i.js
assets/index-B1zyes0h.css
assets/xlayer-D1v7Es1d.js
demo-assets/research-to-story/v1.0.0/encrypted-content.bin
demo-assets/research-to-story/v1.0.0/manifest.json
index.html
```

总大小：

```text
592,120 bytes
```

发布结果：

```text
6 files
29 chunks
14 replacement transactions in the final public refresh
all uploaded files verified by size and SHA-256
```

## 二、关键文件哈希

```text
JS bundle
0edff40f4dcc476f1f7932dcd8802d9d4d0f3ede6d31a5ec2e94a2018ec7862b

CSS bundle
7e28895d832750fa5fe83d4959ba9a72dfbdd37d0696292676923de93cf5722a

X Layer reader
e6f9aa3b17c956a2c1c0e9a7845a45431967c426705d339af93338894a402336

Encrypted content
0d94938bfefc193c82aabb0e66d31eabd830baf8ab51dbe175c02750d6f0c6bd

Manifest
21e0a8869f30d86f2a5ced28d749c11fb5a9216d848fd71bdc63585eb15fe36d

index.html
12f9deb8e836c44c1bda5c55e0d3312a63e23083c990ca7da77c14ccab242023
```

## 三、公开网站验证

使用真实 Chromium 浏览器打开公开地址后，Service Worker 从链上读取文件并显示：

```text
运行总览
使用 Skill
拥有 Skill
公开验证
```

总览页显示：

```text
English-primary product hierarchy
Chinese secondary labels
Processor live on X Layer
2 Circuits deployed
Research-to-Story reference skill
2-of-3 competition delivery
```

普通 `curl` 返回网关引导页属于预期行为。公开网站内容必须由浏览器中的 Service Worker
从链上读取。

## 四、已知限制

公开 HTTPS 页面受浏览器 CSP 限制：

```text
connect-src 'self' blob: data: https: wss:
```

因此不能从公开页面直接访问：

```text
http://127.0.0.1:4181
http://127.0.0.1:4182
```

结果是：

- 公开总览、使用流程和链上验证可正常使用；
- 公开买断页面可以读取 Manifest；
- 公开页面不能直接连接本地 HTTP 节点；
- 本地浏览器开发版可以完整执行 2-of-3 自动交付；
- 比赛录屏可以在本地节点运行时完成。

## 五、正式比赛交付选择（已确定）

最终比赛使用本地录屏和已发布的公开链上页面作为证据：

```text
本地网站
+ Node A / Node B 本地服务
+ Node C 离线
+ 完整 2-of-3 交付
+ 公开链上网站作为证据
```

公开展示边界保持诚实：评委可以查看链上网站、源码、视频和链上证据；完整 2-of-3
买断交付在视频和本地验证中演示，不把本地节点伪装成公开可访问服务。公开 HTTPS
节点留到竞赛后的生产部署。

## 六、GitHub 托管状态

`IGNIX-IMOO` 账号、仓库读取、Git push 和 GitHub Actions 均正常。

```text
账号状态：正常
公开仓库：https://github.com/IGNIX-IMOO/skillpass
仓库权限：admin / push
Actions：enabled
Allowed actions：all
```

已创建公开 Release：

```text
https://github.com/IGNIX-IMOO/skillpass/releases/tag/competition-demo-v2
```

GitHub Pages：

```text
https://ignix-imoo.github.io/skillpass/
```

公开视频：

```text
https://github.com/IGNIX-IMOO/skillpass/releases/download/competition-demo-v2/skillpass-competition-final.mp4
```

该 Release、GitHub Pages 和公开 GitHub 仓库均可作为评委查看源码、视频与备份的地址。
比赛的主 Demo 继续使用无需 GitHub 的链上版本：

```text
网站：https://1-2-223.tapekit.org/
友好入口：https://imoo.meme/skillpass/#/demo
```
