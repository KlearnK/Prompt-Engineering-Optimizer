# email-optimizer Skill 文档

## 基本信息

- **名称**: email-optimizer
- **版本**: 1.0.0
- **描述**: 暂无描述
- **作者**: Anonymous


## 标签

无

## 使用方法

### 直接执行

```bash
curl -X POST http://localhost:3001/api/skills/email-optimizer/execute   -H "Content-Type: application/json"   -d '{
    "input": "你的输入内容",
    "options": {}
  }'
```

### 自动选择

系统会根据输入内容自动判断是否适合使用此 Skill。

## 配置选项

```json
{}
```

## 示例

### 示例 1: 基础使用

```javascript
const result = await fetch('/api/skills/email-optimizer/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: '示例输入',
    options: {}
  })
});
```

## 源码

文件位置: `data/skills/email-optimizer.skill.js`

## 更新历史

- 2026-03-09T09:55:48.079Z: 创建文档

---

> 自动生成，请勿手动修改
