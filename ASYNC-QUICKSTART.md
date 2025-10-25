# 🚀 异步渲染模式 - 快速开始

## ✅ 已完成的改造

你的 Railway 渲染服务已经成功改造为**异步模式**！

### 主要变化

#### 改造前（同步模式）
```
POST /render → 等待... → 返回完整结果（可能超时）
```

#### 改造后（异步模式）
```
POST /render → 立即返回 taskId
GET /render/:taskId → 轮询查询状态
status = "completed" → 下载视频
```

---

## 📦 部署到 Railway

### 1. 提交代码到 Git

```bash
# 查看修改
git status

# 添加修改的文件
git add server/index.js N8N-ASYNC-WORKFLOW.md

# 提交
git commit -m "feat: 改造为异步渲染模式，支持长时间视频渲染"

# 推送到 Railway
git push
```

### 2. 等待 Railway 部署

Railway 会自动检测到代码变更，大约 2-3 分钟后部署完成。

### 3. 验证部署

访问你的 Railway URL：
```
https://remotion-railway-renderer-production.up.railway.app/
```

应该看到：
```json
{
  "name": "Remotion Railway Renderer API (异步模式)",
  "version": "2.0.0",
  "mode": "async",
  "endpoints": {
    "POST /render": "提交渲染任务（异步）...",
    "GET /render/:taskId": "查询任务状态和进度",
    ...
  }
}
```

---

## 🧪 测试异步渲染

### 测试 1：提交任务

```bash
curl -X POST https://remotion-railway-renderer-production.up.railway.app/render \
  -H "Content-Type: application/json" \
  -d '{
    "compositionId": "TestVideo",
    "inputProps": {
      "backgroundMusic": "https://example.com/music.mp3",
      "segments": []
    },
    "outputFileName": "test-async.mp4"
  }'
```

**预期返回**：
```json
{
  "success": true,
  "message": "渲染任务已创建",
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued"
}
```

### 测试 2：查询状态

复制上面返回的 `taskId`，然后查询：

```bash
curl https://remotion-railway-renderer-production.up.railway.app/render/550e8400-e29b-41d4-a716-446655440000
```

**可能的返回**：

#### 还在队列中
```json
{
  "success": true,
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "progress": 0,
  "message": "任务已创建，等待处理..."
}
```

#### 正在处理
```json
{
  "success": true,
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "progress": 45,
  "message": "正在渲染视频 45%..."
}
```

#### 渲染完成
```json
{
  "success": true,
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "progress": 100,
  "message": "渲染完成",
  "data": {
    "outputPath": "/app/output/test-async.mp4",
    "outputFileName": "test-async.mp4",
    "compositionId": "TestVideo",
    "duration": "12.34秒",
    "width": 1280,
    "height": 720,
    "fps": 15,
    "durationInFrames": 60,
    "downloadUrl": "/output/test-async.mp4"
  }
}
```

### 测试 3：下载视频

```bash
curl -O https://remotion-railway-renderer-production.up.railway.app/output/test-async.mp4
```

---

## 🔧 配置 n8n 工作流

### 方法 1：手动配置（推荐，学习用）

按照 `N8N-ASYNC-WORKFLOW.md` 文档逐步配置每个节点。

### 方法 2：导入 JSON（快速）

1. 在 n8n 中点击 **Import from File**
2. 选择 `n8n-async-complete-workflow.json`
3. 修改节点中的 URL（如果你的 Railway URL 不同）

---

## 🎯 n8n 节点快速配置清单

### ✅ 【提交任务】节点

- Method: `POST`
- URL: `https://your-railway-url/render`
- Body (JSON, Expression 模式):
```javascript
{
  "compositionId": "TestVideo",
  "inputProps": {{ $json }},
  "outputFileName": {{ $json.recordId + '.mp4' }}
}
```

### ✅ 【Wait】节点

- Resume: `After Time Interval`
- Wait Amount: `5` seconds

### ✅ 【检查任务进度】节点

- Method: `GET`
- URL (Expression 模式):
```javascript
{{ 'https://your-railway-url/render/' + $('提交任务').item.json.taskId }}
```

### ✅ 【Switch】节点

- Mode: `Rules`
- Rule 1 - 完成: `{{ $json.status === "completed" }}`
- Rule 2 - 处理中: `{{ $json.status === "processing" || $json.status === "queued" }}`
- Fallback - 失败

---

## 📊 监控和调试

### 查看所有任务

```bash
curl https://remotion-railway-renderer-production.up.railway.app/jobs
```

返回：
```json
{
  "success": true,
  "total": 3,
  "jobs": [
    {
      "taskId": "abc-123",
      "status": "completed",
      "progress": 100,
      "message": "渲染完成",
      "compositionId": "TestVideo",
      "createdAt": 1729728000000,
      "completedAt": 1729728015000
    },
    {
      "taskId": "def-456",
      "status": "processing",
      "progress": 60,
      "message": "正在渲染视频 60%...",
      "compositionId": "TestVideo",
      "createdAt": 1729728030000
    }
  ]
}
```

### 查看 Railway 日志

1. 打开 Railway Dashboard
2. 选择你的项目
3. 点击 **View Logs**

你应该能看到：
```
[abc-123] 📦 正在打包项目...
[abc-123] 🎬 获取视频组合信息...
[abc-123] 🎥 开始渲染视频...
[abc-123] 渲染进度: 15%
[abc-123] 渲染进度: 30%
[abc-123] 渲染进度: 45%
...
[abc-123] ✅ 渲染完成! 用时: 12.34秒
```

---

## 🎨 工作流可视化

```
┌─────────────┐
│   Webhook   │ 接收渲染请求
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  提交任务    │ POST /render → 返回 taskId
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Wait     │ 等待 5 秒
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 检查任务进度 │ GET /render/:taskId
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Switch    │ 判断状态
└──────┬──────┘
       │
       ├─ completed ──────┐
       │                  ▼
       │           ┌─────────────┐
       │           │  下载视频    │
       │           └──────┬──────┘
       │                  │
       │                  ▼
       │           ┌─────────────┐
       │           │ 更新数据库   │ 成功
       │           └─────────────┘
       │
       ├─ processing ─────┐
       │                  │
       │                  └──────┐
       │                         │
       │            (循环回 Wait) │
       │                         │
       └─ failed ────────┐       │
                         ▼       │
                  ┌─────────────┐│
                  │ 更新数据库   ││ 失败
                  └─────────────┘│
                                 │
                                 ▼
```

---

## ⚡ 性能优化建议

### 1. 调整轮询间隔

根据视频复杂度：
- 简单视频（<30秒）：每 3 秒
- 中等视频（30-60秒）：每 5 秒
- 复杂视频（>60秒）：每 10 秒

### 2. 添加最大轮询次数

避免无限循环，建议最多轮询 40 次（约 3 分钟）。

在 n8n 的 Switch 节点中添加计数器。

### 3. 批量处理

如果有多个视频需要渲染，可以：
- 并行提交多个任务
- 统一轮询查询
- 批量下载

---

## 🔐 可选：添加 API 认证

### 1. 在 Railway 中设置环境变量

```
API_KEY=your-secret-key-12345
```

### 2. 修改 `server/index.js`（可选）

在 POST /render 端点前添加认证中间件：

```javascript
// 认证中间件
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: '未授权' });
  }
  next();
};

// 使用认证
app.post('/render', authenticate, async (req, res) => {
  // ...
});
```

### 3. 在 n8n 中添加 Header

在【提交任务】节点中：
- Send Headers: `ON`
- Header: `x-api-key: your-secret-key-12345`

---

## 🎉 完成！

现在你的渲染服务可以：

✅ 处理任意复杂度的视频（不会超时）  
✅ 实时追踪渲染进度  
✅ 支持并发任务（多个视频同时渲染）  
✅ 自动清理旧任务（节省存储空间）  
✅ 提供详细的状态信息

---

## 📞 需要帮助？

- 查看完整文档：`N8N-ASYNC-WORKFLOW.md`
- 查看工作流示例：`n8n-async-complete-workflow.json`
- Railway 日志：Dashboard → View Logs
- 任务列表：`GET /jobs`

开始渲染你的第一个异步视频吧！🚀




