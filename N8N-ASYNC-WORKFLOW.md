# 🔄 n8n 异步渲染工作流配置指南

## 📋 概述

改造后的 Railway 渲染服务支持**异步模式**，适合处理复杂、耗时的视频渲染任务。

### 工作流程
```
1. POST /render → 立即返回 { taskId, status: "queued" }
2. GET /render/:taskId → 轮询查询状态 (queued/processing/completed/failed)
3. status === "completed" → 下载视频
```

---

## 🎯 n8n 工作流结构

```
Webhook (接收数据)
  ↓
合并提交参数
  ↓
提交任务 (返回 taskId)
  ↓
Wait (5秒)
  ↓
检查任务进度
  ↓
Switch (判断状态)
  ├─ completed → 下载视频 → 更新数据库(完成)
  ├─ processing → 返回 Wait (循环)
  └─ failed → 更新数据库(失败)
```

---

## 🔧 节点配置

### 1️⃣ 【提交任务】节点

**节点类型**: `HTTP Request`

#### Parameters

**Method**
```
POST
```

**URL**
```
https://remotion-railway-renderer-production.up.railway.app/render
```

**Body Content Type**
```
JSON
```

**Specify Body**: `Using JSON`  
**切换到 Expression 模式** 👈 重要！

**JSON** (Expression 模式):
```javascript
{
  "compositionId": "TestVideo",
  "inputProps": {{ $json }},
  "outputFileName": {{ $('Webhook').item.json.body.body.record_id + '.mp4' }}
}
```

#### 返回示例
```json
{
  "success": true,
  "message": "渲染任务已创建",
  "taskId": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "status": "queued"
}
```

---

### 2️⃣ 【Wait】节点

**节点类型**: `Wait`

#### Parameters

**Resume**: `After Time Interval`

**Wait Amount**: `5` 秒

**连接**: 
- 从【提交任务】连接到此节点
- 从【Switch】的 "processing" 分支也连接到此节点（形成循环）

---

### 3️⃣ 【检查任务进度】节点

**节点类型**: `HTTP Request`

#### Parameters

**Method**
```
GET
```

**URL** (Expression 模式):
```javascript
{{ 'https://remotion-railway-renderer-production.up.railway.app/render/' + $('提交任务').item.json.taskId }}
```

**Authentication**: `None`

**Send Query Parameters**: `OFF`

**Send Headers**: `OFF`

**Send Body**: `OFF`

#### 返回示例（处理中）
```json
{
  "success": true,
  "taskId": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "status": "processing",
  "progress": 45,
  "message": "正在渲染视频 45%...",
  "compositionId": "TestVideo"
}
```

#### 返回示例（完成）
```json
{
  "success": true,
  "taskId": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "status": "completed",
  "progress": 100,
  "message": "渲染完成",
  "data": {
    "outputPath": "/app/output/rec123.mp4",
    "outputFileName": "rec123.mp4",
    "compositionId": "TestVideo",
    "duration": "12.34秒",
    "width": 1280,
    "height": 720,
    "fps": 15,
    "durationInFrames": 60,
    "downloadUrl": "/output/rec123.mp4"
  }
}
```

---

### 4️⃣ 【Switch】节点

**节点类型**: `Switch`

#### Parameters

**Mode**: `Rules`

#### Rule 1 - 渲染完成 ✅

**Expression** (切换到 Expression 模式):
```javascript
{{ $json.status === "completed" }}
```

**Output**: 连接到【下载视频】节点

#### Rule 2 - 还在处理中 ⏳

**Expression**:
```javascript
{{ $json.status === "processing" || $json.status === "queued" }}
```

**Output**: 连接回【Wait】节点（形成循环）

#### Rule 3 (Fallback) - 渲染失败 ❌

**Fallback Output**: 连接到【渲染错误】节点

---

### 5️⃣ 【下载视频】节点（可选）

**节点类型**: `HTTP Request`

#### Parameters

**Method**
```
GET
```

**URL** (Expression 模式):
```javascript
{{ 'https://remotion-railway-renderer-production.up.railway.app' + $('检查任务进度').item.json.data.downloadUrl }}
```

**Response Format**: `File`

**Download File Name** (Expression 模式):
```javascript
{{ $('检查任务进度').item.json.data.outputFileName }}
```

---

## 📊 状态码说明

| 状态 | 说明 | n8n 操作 |
|------|------|----------|
| `queued` | 任务已创建，等待处理 | 继续轮询 |
| `processing` | 正在渲染中 | 继续轮询 |
| `completed` | 渲染完成 | 下载视频 |
| `failed` | 渲染失败 | 错误处理 |

---

## ⚙️ 优化建议

### 1. 调整轮询间隔

根据视频复杂度调整 Wait 节点的等待时间：

- **简单视频** (< 30秒): 每 3 秒轮询一次
- **中等视频** (30-60秒): 每 5 秒轮询一次
- **复杂视频** (> 60秒): 每 10 秒轮询一次

### 2. 添加超时机制

在 Switch 节点后添加判断，如果轮询超过 20 次（约 100 秒），标记为超时：

```javascript
{{ $('Loop Over Items').item.json.iteration > 20 }}
```

### 3. 添加进度显示

可以在【检查任务进度】节点后添加一个【Set】节点，记录进度：

```javascript
{
  "progress": {{ $json.progress }},
  "message": {{ $json.message }},
  "timestamp": {{ new Date().toISOString() }}
}
```

---

## 🎨 完整工作流 JSON

可以直接导入到 n8n 中（已包含在项目中）：

```
n8n-async-workflow.json
```

---

## 🔍 调试技巧

### 1. 查看所有任务

访问：
```
https://remotion-railway-renderer-production.up.railway.app/jobs
```

查看当前所有任务的状态。

### 2. 手动测试

#### 提交任务
```bash
curl -X POST https://remotion-railway-renderer-production.up.railway.app/render \
  -H "Content-Type: application/json" \
  -d '{
    "compositionId": "TestVideo",
    "inputProps": {
      "backgroundMusic": "https://...",
      "segments": [...]
    },
    "outputFileName": "test-video.mp4"
  }'
```

返回：
```json
{
  "success": true,
  "taskId": "abc-123",
  "status": "queued"
}
```

#### 查询状态
```bash
curl https://remotion-railway-renderer-production.up.railway.app/render/abc-123
```

---

## 🚀 部署到 Railway

### 1. 提交代码

```bash
git add server/index.js
git commit -m "feat: 改造为异步渲染模式"
git push
```

### 2. Railway 自动部署

Railway 会自动检测到代码变更并重新部署。

### 3. 验证部署

访问根路径查看 API 文档：
```
https://remotion-railway-renderer-production.up.railway.app/
```

应该看到：
```json
{
  "name": "Remotion Railway Renderer API (异步模式)",
  "version": "2.0.0",
  "mode": "async",
  ...
}
```

---

## ⚠️ 注意事项

1. **内存限制**: Railway 免费版有内存限制，渲染超长视频可能会被 kill
2. **任务清理**: 系统会自动清理 24 小时前的任务
3. **并发限制**: 当前设置为单并发（`concurrency: 1`），多个任务会排队
4. **文件存储**: 输出文件存储在容器中，重启后会丢失（建议上传到云存储）

---

## 📝 下一步优化

- [ ] 添加 Redis 持久化任务状态
- [ ] 实现任务队列（BullMQ）
- [ ] 添加 Webhook 回调（渲染完成后主动通知）
- [ ] 集成云存储（S3/R2）自动上传
- [ ] 添加认证机制

---

**🎉 现在你可以处理任意复杂度的视频渲染任务了！**




