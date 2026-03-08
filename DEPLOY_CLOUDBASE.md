# PromptCraft 腾讯云 CloudBase 部署指南

> 适用于 CloudBase **免费体验版**（3000点/月），个人分享和小规模使用完全够用。

---

## 数据库选型说明

经过调研，CloudBase 免费版的数据库情况如下：

| 类型 | 说明 | 免费版 |
|---|---|---|
| **文档型数据库**（MongoDB 兼容） | CloudBase 内置，共享实例 | ✅ 免费 |
| **关系型数据库**（外部 MySQL） | 需配置 VPC，连接自有 MySQL | ❌ 免费版不支持 |

**结论：本项目在 CloudBase 上使用文档型数据库（MongoDB）存储提示词历史记录。**

当前 Manus 版本使用 MySQL（Drizzle ORM），CloudBase 版本已适配为 MongoDB 驱动。

---

## 部署架构

```
用户浏览器
    ↓ HTTPS
CloudBase 云托管（Node.js 容器，自动弹性伸缩）
    ├── Express + tRPC API
    ├── React 前端静态文件（内嵌）
    └── CloudBase Admin SDK
         ↓
CloudBase 文档型数据库（MongoDB）
    └── prompt_history 集合
```

---

## 前置条件

1. 腾讯云账号，已开通 CloudBase 免费环境
2. 本地安装 Node.js 18+、pnpm
3. 安装 CloudBase CLI：
   ```bash
   npm install -g @cloudbase/cli
   ```

---

## 第一步：获取环境 ID

1. 打开 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 点击你的免费环境
3. 在「环境概览」复制**环境 ID**（格式：`your-env-xxxxxx`）

---

## 第二步：安装 CloudBase SDK 并适配数据库

由于 CloudBase 免费版使用文档型数据库（MongoDB），需要安装 SDK：

```bash
cd prompt-optimizer-tool
pnpm add @cloudbase/node-sdk
```

然后修改 `server/db.ts`，将 MySQL 查询替换为 CloudBase SDK 调用（参见下方代码）。

### server/db.ts（CloudBase 版本）

```typescript
import CloudBase from "@cloudbase/node-sdk";

const app = CloudBase.init({
  env: process.env.CLOUDBASE_ENV_ID!,
  secretId: process.env.CLOUDBASE_SECRET_ID,
  secretKey: process.env.CLOUDBASE_SECRET_KEY,
});

const db = app.database();
const collection = db.collection("prompt_history");

export async function savePromptHistory(data: {
  userId: string;
  originalPrompt: string;
  optimizedPrompt?: string;
  assessmentScore?: number;
  title?: string;
}) {
  const result = await collection.add({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result;
}

export async function getUserPromptHistory(userId: string) {
  const result = await collection
    .where({ userId })
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();
  return result.data;
}

export async function deletePromptHistory(id: string, userId: string) {
  await collection.doc(id).remove();
}
```

---

## 第三步：配置 cloudbaserc.json

编辑项目根目录的 `cloudbaserc.json`，将 `{{YOUR_ENV_ID}}` 替换为你的环境 ID：

```json
{
  "envId": "your-env-xxxxxx",
  "framework": {
    "name": "prompt-optimizer-tool",
    "plugins": {
      "server": {
        "use": "@cloudbase/framework-plugin-container",
        "inputs": {
          "serviceName": "prompt-optimizer",
          "containerPort": 3000,
          "buildCommand": "npm install -g pnpm && pnpm install && pnpm build",
          "startCommand": "node dist/index.js",
          "cpu": 0.25,
          "mem": 0.5,
          "minNum": 0,
          "maxNum": 5
        }
      }
    }
  }
}
```

---

## 第四步：配置环境变量

在 CloudBase 控制台 → 云托管 → 你的服务 → 版本设置 → 环境变量，添加：

| 变量名 | 值 | 说明 |
|---|---|---|
| `NODE_ENV` | `production` | 运行模式 |
| `JWT_SECRET` | 随机32位字符串 | Session 签名密钥 |
| `CLOUDBASE_ENV_ID` | 你的环境 ID | CloudBase 环境标识 |
| `VITE_APP_ID` | 留空或填写 | Manus OAuth（CloudBase 上可不用） |

> **生成随机密钥**：`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## 第五步：部署

### 方式 A：控制台上传（推荐，无需 CLI）

1. 本地构建：
   ```bash
   pnpm install && pnpm build
   ```

2. 打包（排除 node_modules）：
   ```bash
   # macOS/Linux
   zip -r prompt-optimizer.zip . \
     --exclude "node_modules/*" \
     --exclude ".git/*" \
     --exclude ".manus-logs/*"
   ```

3. 在 CloudBase 控制台 → **云托管** → **新建服务**：
   - 服务名称：`prompt-optimizer`
   - 部署类型：**容器**（上传代码包）
   - 上传 `prompt-optimizer.zip`
   - 端口：`3000`
   - 构建命令：`npm install -g pnpm && pnpm install && pnpm build`
   - 启动命令：`node dist/index.js`

4. 点击「确认部署」，等待 3-5 分钟。

### 方式 B：CLI 一键部署

```bash
# 登录
tcb login

# 在项目根目录执行
tcb framework deploy
```

---

## 第六步：访问与分享

部署成功后，CloudBase 分配访问地址：
```
https://prompt-optimizer-xxxxxx.sh.run.tcloudbase.com
```

将此链接分享给他人。访客打开后：
1. 输入提示词
2. 点击「评估质量」或「一键优化」
3. 首次使用时填入自己的 API Key（推荐 DeepSeek，国内直连）
4. 即可独立使用全部功能

---

## 第七步：绑定自定义域名（可选）

1. 控制台 → 云托管 → 服务详情 → **域名管理**
2. 添加你的域名（如 `prompt.yourdomain.com`）
3. 按提示在 DNS 服务商添加 CNAME 记录
4. 等待 SSL 证书自动签发（5-10 分钟）

---

## 后续更新

每次更新代码后，重新打包上传或执行 `tcb framework deploy`，CloudBase 会自动滚动更新，零停机。

---

## 资源消耗估算

| 场景 | 月消耗资源点 |
|---|---|
| 无请求时（自动缩容到 0） | 0 点 |
| 100 次 API 调用 | 约 5-20 点 |
| 500 次 API 调用 | 约 25-100 点 |
| **免费版额度** | **3000 点/月** |

> 个人分享场景完全够用，资源点不足时可续费或升级套餐。
