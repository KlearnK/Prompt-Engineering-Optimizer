# PromptCraft 本地部署指南

本指南帮助你在本地机器上通过 Docker Compose 一键启动 PromptCraft，并说明如何持续迭代更新。

---

## 前置要求

| 工具 | 最低版本 | 说明 |
|---|---|---|
| Docker | 24.0+ | 容器运行时 |
| Docker Compose | 2.20+ | 编排工具（通常随 Docker Desktop 一起安装） |
| Git | 任意 | 用于拉取代码和版本管理 |

验证安装：

```bash
docker --version
docker compose version
```

---

## 快速启动（5 分钟）

### 第 1 步：获取代码

从 Manus 代码面板下载项目压缩包并解压，或通过 GitHub 克隆（如果你已导出到 GitHub）：

```bash
# 解压下载的压缩包
unzip promptcraft.zip -d promptcraft
cd promptcraft
```

### 第 2 步：配置环境变量

复制环境变量模板并填写必要配置：

```bash
cp env-template.txt .env
```

然后用文本编辑器打开 `.env`，**至少修改以下两项**：

```ini
# 数据库密码（改成你自己的密码）
MYSQL_PASSWORD=your_secure_password

# JWT 密钥（随机生成一个长字符串）
JWT_SECRET=your_very_long_random_secret_string_here
```

生成随机 JWT 密钥的方法：

```bash
# macOS / Linux
openssl rand -base64 48

# 或者使用 Python
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

### 第 3 步：启动服务

```bash
docker compose up -d
```

Docker 会自动完成：构建应用镜像 → 启动 MySQL → 运行数据库迁移 → 启动应用服务器。

首次启动约需 3-5 分钟（需要下载基础镜像和构建代码）。

### 第 4 步：访问应用

打开浏览器访问：**http://localhost:8080**

查看启动日志：

```bash
docker compose logs -f app
```

---

## 关于 AI 模型配置

本工具支持在浏览器内配置 API Key，无需修改服务器配置。

首次点击「评估质量」或「一键优化」时，会弹出 API 配置对话框。推荐使用以下国内友好模型：

| 模型 | 获取 API Key | 特点 |
|---|---|---|
| **DeepSeek** | https://platform.deepseek.com | 性价比最高，推荐首选 |
| 通义千问 | https://dashscope.aliyun.com | 阿里云，稳定可靠 |
| 智谱 AI (GLM) | https://open.bigmodel.cn | 注册即送免费额度 |
| OpenAI | https://platform.openai.com | 需要科学上网 |

API Key 仅存储在你的本地浏览器中，不会上传到服务器。

---

## 持续迭代工作流

这是本地部署最大的优势——你可以随时修改代码并立即看到效果。

### 开发模式（热更新）

如果你想修改代码并实时预览，不需要 Docker，直接在本地运行开发服务器：

```bash
# 安装依赖（首次）
npm install -g pnpm
pnpm install

# 启动开发服务器（热更新）
pnpm dev
```

访问 http://localhost:3000 即可看到实时更新。

### 修改代码后更新生产部署

当你修改了代码并想更新本地的 Docker 部署时：

```bash
# 重新构建并重启应用（不影响数据库数据）
docker compose up -d --build app

# 查看更新进度
docker compose logs -f app
```

### 修改数据库 Schema 后迁移

当你在 `drizzle/schema.ts` 中添加了新表或字段：

```bash
# 方法一：在开发模式下直接推送
DATABASE_URL="mysql://promptcraft:your_password@localhost:3306/promptcraft" pnpm db:push

# 方法二：通过 Docker 运行迁移
docker compose run --rm migrate
```

---

## 数据备份与恢复

### 备份数据库

```bash
# 导出完整数据库
docker exec promptcraft-db mysqldump \
  -u promptcraft -p"your_password" promptcraft \
  > backup_$(date +%Y%m%d_%H%M%S).sql

echo "备份完成"
```

建议设置定时备份（crontab）：

```bash
# 每天凌晨 2 点自动备份，保留最近 7 天
0 2 * * * cd /path/to/promptcraft && docker exec promptcraft-db mysqldump -u promptcraft -p"your_password" promptcraft > backups/backup_$(date +\%Y\%m\%d).sql && find backups/ -name "*.sql" -mtime +7 -delete
```

### 恢复数据库

```bash
# 从备份文件恢复
docker exec -i promptcraft-db mysql \
  -u promptcraft -p"your_password" promptcraft \
  < backup_20240101_020000.sql
```

---

## 常用管理命令

```bash
# 查看所有服务状态
docker compose ps

# 查看应用日志（实时）
docker compose logs -f app

# 查看数据库日志
docker compose logs -f db

# 停止所有服务（保留数据）
docker compose stop

# 启动所有服务
docker compose start

# 完全停止并删除容器（数据库数据保留在 volume 中）
docker compose down

# 完全清理（包括数据库数据，谨慎使用！）
docker compose down -v

# 进入应用容器调试
docker exec -it promptcraft-app sh

# 进入数据库
docker exec -it promptcraft-db mysql -u promptcraft -p
```

---

## 端口冲突解决

如果 8080 端口被占用，修改 `.env` 中的 `APP_PORT`：

```ini
APP_PORT=9090
```

然后重启：`docker compose up -d`

---

## 升级到新版本

当有新版本代码时：

```bash
# 1. 拉取最新代码（如果使用 Git）
git pull origin main

# 2. 重新构建并部署（数据不丢失）
docker compose up -d --build

# 3. 如果有 Schema 变更，运行迁移
docker compose run --rm migrate
```

---

## 故障排查

**应用无法启动**

```bash
docker compose logs app
# 查找 ERROR 关键字，常见原因：数据库连接失败、端口占用
```

**数据库连接失败**

```bash
# 检查数据库是否健康
docker compose ps db
# 如果状态不是 healthy，查看数据库日志
docker compose logs db
```

**迁移失败**

```bash
# 手动运行迁移并查看详细错误
docker compose run --rm migrate
```

**重置所有数据（开发调试用）**

```bash
docker compose down -v
docker compose up -d
```
