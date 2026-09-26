# SkillPass 比赛版部署记录 V1

状态：新版公开网站已发布，本地节点通道待处理

发布时间：2026-09-24

公开地址：

```text
https://1-2-223.tapekit.org/
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
assets/index-CICBPt4q.js
assets/index-Dt7zSrsy.css
assets/xlayer-C4R0iCWV.js
demo-assets/research-to-story/v1.0.0/encrypted-content.bin
demo-assets/research-to-story/v1.0.0/manifest.json
index.html
```

总大小：

```text
590,889 bytes
```

发布结果：

```text
6 files
29 chunks
27 transactions in the design-refresh publish
all uploaded files verified by size and SHA-256
```

## 二、关键文件哈希

```text
JS bundle
0f01cd3cc1908f957a835258117f1a1dc2eca62bec3432d8fb3578ddfc826b2a

CSS bundle
d63eafa410b9929780f8c621a72b4b34785980f93cbd15772135c87709d50dc2

X Layer reader
65b15e1ddbe83695edd596ee105725fbf23b0500387fc61e6019faab04239d29

Encrypted content
1ce684ce0903d5d41e28b31c9398ace289286a6cdc1fd2cb2e7569364275c69f

Manifest
0fe28f1c196861f3c6f3148da1895b3c37583b9b63301ace5918b5497a848a0d

index.html
d25cb17b20109298cb1d8f0df36f18692b2b0e4c643ac78e73e3dd3be0ebd535
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

## 五、正式比赛前必须二选一

### 方案 A：本地录屏

```text
本地网站
+ Node A / Node B 本地服务
+ Node C 离线
+ 完整 2-of-3 交付
+ 公开链上网站作为证据
```

优点是安全、简单、没有额外托管。缺点是评委无法从公开网页直接操作完整买断。

### 方案 B：公开 HTTPS 节点

```text
Node A 和 Node B 使用 HTTPS 反向代理或托管服务
网站通过 HTTPS URL 调用
Node C 保持离线
```

优点是完全公开可操作。缺点是必须部署和维护节点，并处理证书、CORS、限流和滥用。

比赛提交前必须明确选择其中一种，不能把本地节点伪装成公开可访问服务。

## 六、GitHub 托管状态

`IGNIX-IMOO` 账号、仓库读取、Git push 和 GitHub Actions 均正常。

```text
账号状态：正常
公开仓库：https://github.com/IGNIX-IMOO/skillpass
仓库权限：admin / push
Actions：enabled
Allowed actions：all
```

已创建 Release：

```text
https://github.com/IGNIX-IMOO/skillpass/releases/tag/competition-demo-v2
```

该 Release 和公开 GitHub 仓库均可作为评委查看源码与备份的地址。
比赛的主 Demo 继续使用无需 GitHub 的链上版本：

```text
网站：https://1-2-223.tapekit.org/
视频：必须上传到 YouTube unlisted、Vimeo 或其他匿名可播放的托管服务
```
