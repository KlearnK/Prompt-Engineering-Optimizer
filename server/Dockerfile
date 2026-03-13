# 使用 Alpine
FROM node:20-alpine

# 使用国内镜像源
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

WORKDIR /app

# 安装依赖（添加 py3-setuptools 解决 distutils 问题）
RUN apk add --no-cache python3 py3-setuptools make g++ sqlite-dev sqlite curl

# 复制依赖
COPY package.json ./
RUN npm install --registry=https://registry.npmmirror.com

# 复制源代码
COPY . .

# 编译
RUN npm run build

# 创建数据目录
RUN mkdir -p /app/data && chmod 777 /app/data

ENV NODE_ENV=production PORT=3001 DB_PATH=/app/data/analytics.db LOG_LEVEL=info

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["node", "dist/index.js"]