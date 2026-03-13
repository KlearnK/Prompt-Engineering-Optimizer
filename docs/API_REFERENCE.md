# API 参考文档

> 自动生成于 2026/3/9 09:55:48

## 基础信息

- 基础 URL: http://localhost:3001/api
- 内容类型: application/json

## 认证

当前版本无需认证（个人本地使用）。

## 端点列表

### 提示词优化

#### POST /optimize
优化提示词。

**请求体:**
```json
{
  "prompt": "原始提示词",
  "model": "deepseek-chat",
  "skill": "code-review"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "optimized": "优化后的提示词",
    "iterations": 3,
    "improvements": ["改进点1", "改进点2"]
  }
}
```

### Skill 管理

#### GET /skills
获取所有 Skill 列表。

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "name": "code-review",
      "description": "代码审查助手",
      "version": "1.0.0"
    }
  ]
}
```

#### POST /skills/:name/execute
执行指定 Skill。

#### POST /skills/auto-execute
自动选择并执行合适的 Skill。

#### POST /skills/import
导入 .skill 文件。

**请求:** multipart/form-data
- file: .skill 文件

#### GET /skills/export/list
获取已导出的 Skill 列表。

### 数据分析

#### GET /analytics/overview
获取使用概览。

#### GET /analytics/preferences
获取偏好分析。

#### GET /analytics/insights
获取洞察报告。

### 数据备份

#### POST /backup/export
创建数据备份。

#### POST /backup/import
导入备份数据。

#### GET /backup/list
获取备份列表。

#### GET /backup/download/:filename
下载备份文件。

## 错误处理

所有错误响应格式:
```json
{
  "success": false,
  "error": "错误描述",
  "code": "ERROR_CODE"
}
```

## 状态码

- 200: 成功
- 400: 请求参数错误
- 404: 资源不存在
- 500: 服务器内部错误
