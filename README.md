# Cloudflare Drop

基于 Cloudflare Worker、D1Database 和 KV 实现的轻量级文件分享工具。

<img src="assets/IMG_5810.png" width="200">
<img src="assets/IMG_5811.png" width="200">
<img src="assets/IMG_5812.png" width="200">
<img src="assets/IMG_5813.png" width="200">

## 自动部署

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/oustn/cloudflare-drop)

1. 点击按钮，跳转到自动部署页面
2. 根据页面指引，关联 GitHub & Cloudflare，配置 Cloudflare Account ID & API Key
3. Fork 仓库
4. 开启 Action
5. 部署

> 创建 Cloudflare API Key 时，如果使用 worker 模板创建，请记得添加 D1 的编辑权限。

## 配置 GitHub Action Secret

1. 在初次部署完成后，还需要创建 [D1Database](https://developers.cloudflare.com/d1/get-started/#2-create-a-database) & [KV](https://developers.cloudflare.com/kv/get-started/#2-create-a-kv-namespace)，参考对应文档。
2. 配置 Secret：在 forked 的仓库 -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**
3. 配置以下 Secret：
   - CUSTOM_DOMAIN （可选，域名，如 drop.example.cn）
   - D1_ID (D1Database ID)
   - D1_NAME (D1Database Name)
   - KV_ID (KV Namespace ID)
4. 重新运行 Github Actions

## 其他配置

### 文件大小限制

默认文件限制为 10M，限制配置分为前端限制和后端接口限制，需要单独配置。

1. 前端：新增 `SHARE_MAX_SIZE_IN_MB` Action 变量，值为最大允许的 MB 数字，配置路径：在 forked 的仓库 -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository variable**
2. 后端：在 Cloudflare 的 worker 控制台，新增 `SHARE_MAX_SIZE_IN_MB` Action 变量，值为最大允许的 MB 数字，配置路径：cloudflare-drop-production worker -> **设置** -> **变量和机密** -> **添加** -> **部署**

### 分享过期时间配置

分享默认有效期是一个小时，可以通过配置变量来修改。

在 Cloudflare 的 worker 控制台，新增 `SHARE_MAX_SIZE_IN_MB` Action 变量，值为最大允许的 MB 数字，配置路径：cloudflare-drop-production worker -> **设置** -> **变量和机密** -> **添加** -> **部署**

配置格式为 `数值+单位`，比如 (5minute)，支持的单位有 `minute`, `hour`, `day`, `week`, `month`, `year`, `hour`

## 过期清理

Worker 添加了一个 10 分钟的定时任务，自动清理过期的 KV 存储和 D1 中的记录。
