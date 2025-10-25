# ✅ n8n 集成就绪！

## 🎉 测试结果

**API 状态**: ✅ 运行正常  
**渲染测试**: ✅ 成功（耗时 23.7 秒）  
**文件下载**: ✅ 成功（197.59 KB）  
**集成状态**: ✅ 完全可用

---

## 🚀 立即开始使用

### 快速集成 3 步骤

#### 1️⃣ 在 n8n 中导入工作流
选择以下任一工作流文件导入到 n8n：

- **`n8n-quick-start.json`** - 基础工作流（推荐新手）
  - 手动触发
  - 渲染视频
  - 下载文件
  
- **`n8n-advanced-workflow.json`** - 高级工作流（推荐生产环境）
  - Webhook 触发
  - 动态内容
  - 错误处理
  - 自动响应

#### 2️⃣ 配置 HTTP Request 节点

**基础配置**（已预配置在工作流中）：
```
Method: POST
URL: https://remotion-railway-renderer-production.up.railway.app/render
Headers: Content-Type: application/json
Timeout: 180 秒
```

**请求体**：
```json
{
  "compositionId": "TestVideo",
  "inputProps": {
    "title": "你的标题",
    "subtitle": "你的副标题"
  },
  "outputFileName": "my-video.mp4"
}
```

#### 3️⃣ 运行并获取视频

点击 "Execute Workflow"，等待 30-60 秒，即可获得：
- ✅ 视频下载链接
- ✅ 渲染详情
- ✅ 可下载的视频文件

---

## 📊 API 端点

### 基础端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/compositions` | GET | 获取可用视频列表 |
| `/render` | POST | 渲染视频 |
| `/output/:filename` | GET | 下载视频文件 |

### 完整 API 地址
```
https://remotion-railway-renderer-production.up.railway.app
```

---

## 🎬 可用视频组合

### TestVideo（轻量级 - 推荐）
```json
{
  "compositionId": "TestVideo",
  "inputProps": {
    "title": "标题文字",
    "subtitle": "副标题文字"
  }
}
```

**规格**：
- 📐 分辨率：1280×720 (720p)
- 🎞️ 帧率：15 FPS
- ⏱️ 时长：4 秒
- ⚡ 渲染时间：约 30-60 秒
- 💾 文件大小：约 200 KB

### MyVideo（标准质量）
```json
{
  "compositionId": "MyVideo",
  "inputProps": {
    "title": "标题文字",
    "subtitle": "副标题文字"
  }
}
```

**规格**：
- 📐 分辨率：1920×1080 (1080p)
- 🎞️ 帧率：30 FPS
- ⏱️ 时长：5 秒
- ⚡ 渲染时间：约 90-120 秒
- 💾 文件大小：约 500 KB

---

## 💡 实际测试结果

### 刚才的测试
```
请求参数:
{
  "compositionId": "TestVideo",
  "inputProps": {
    "title": "n8n 测试",
    "subtitle": "API 集成测试"
  },
  "outputFileName": "n8n-test.mp4"
}

响应结果:
✅ 渲染成功
⏱️ 耗时：23.70 秒
📐 分辨率：1280×720
🎞️ 帧数：60 帧 @ 15fps
💾 文件大小：197.59 KB
🔗 下载链接：/output/n8n-test.mp4
```

---

## 🎯 n8n 使用场景

### 1. 自动化营销视频
```
触发：新客户注册
↓
获取客户信息（姓名、邮箱）
↓
渲染个性化欢迎视频
↓
发送邮件附带视频
```

### 2. 订单确认视频
```
触发：订单完成
↓
获取订单详情
↓
渲染订单确认视频
↓
WhatsApp/邮件发送
```

### 3. 社交媒体内容
```
触发：定时任务（每天 8:00）
↓
获取每日数据/报价
↓
渲染视频内容
↓
自动发布到 Instagram/Twitter
```

### 4. 批量证书生成
```
触发：CSV 文件上传
↓
循环处理每一行
↓
为每个学员渲染证书视频
↓
保存到 Google Drive
```

---

## 📝 n8n 节点配置示例

### HTTP Request 节点 - 渲染视频

**基础设置**：
- Authentication: None
- Method: POST
- URL: `https://remotion-railway-renderer-production.up.railway.app/render`

**Headers**：
```
Content-Type: application/json
```

**Body (JSON)**：
```json
{
  "compositionId": "TestVideo",
  "inputProps": {
    "title": "{{$json.title}}",
    "subtitle": "{{$json.subtitle}}"
  },
  "outputFileName": "video-{{$now.format('YYYY-MM-DD-HHmmss')}}.mp4"
}
```

**Options**：
- Timeout: 180000 (3 分钟)

---

### HTTP Request 节点 - 下载视频

**基础设置**：
- Method: GET
- URL: `https://remotion-railway-renderer-production.up.railway.app{{$json.data.downloadUrl}}`

**Response**：
- Response Format: File

---

## 🔄 完整工作流示例

### 基础流程
```
手动触发
    ↓
渲染视频 (POST /render)
    ↓
下载视频 (GET /output/xxx.mp4)
    ↓
保存到云存储
```

### 高级流程（带错误处理）
```
Webhook 触发
    ↓
渲染视频 (POST /render)
    ↓
检查状态 (IF 节点)
    ├─ 成功 → 下载视频 → 返回成功响应
    └─ 失败 → 返回错误响应
```

---

## 🎨 动态内容示例

### 使用 Webhook 传递数据

**Webhook 接收**：
```json
{
  "title": "张三",
  "subtitle": "订单 #12345",
  "compositionId": "TestVideo"
}
```

**在渲染节点中使用**：
```json
{
  "compositionId": "{{$json.compositionId}}",
  "inputProps": {
    "title": "欢迎 {{$json.title}}",
    "subtitle": "{{$json.subtitle}} - {{$now.format('YYYY-MM-DD')}}"
  },
  "outputFileName": "video-{{$json.title}}-{{$now.toUnixInteger()}}.mp4"
}
```

---

## 📦 响应数据结构

### 成功响应
```json
{
  "success": true,
  "message": "视频渲染成功",
  "data": {
    "outputPath": "/app/output/video.mp4",
    "outputFileName": "video.mp4",
    "compositionId": "TestVideo",
    "duration": "23.70秒",
    "width": 1280,
    "height": 720,
    "fps": 15,
    "durationInFrames": 60,
    "downloadUrl": "/output/video.mp4"
  }
}
```

### 在 n8n 中访问数据
- 下载链接：`{{$json.data.downloadUrl}}`
- 文件名：`{{$json.data.outputFileName}}`
- 渲染时间：`{{$json.data.duration}}`
- 视频宽度：`{{$json.data.width}}`
- 视频高度：`{{$json.data.height}}`

---

## ⚠️ 重要提示

### ⏱️ 渲染时间
- **TestVideo**：约 30-60 秒
- **MyVideo**：约 90-120 秒
- **建议**：设置 HTTP Request 超时时间为 180 秒

### 💾 文件存储
- 渲染的视频临时存储在服务器
- **建议**：渲染完成后立即下载并保存到云端
- **注意**：服务器重启后临时文件会清空

### 🔄 并发限制
- **避免**：同时发起多个渲染请求
- **推荐**：使用队列或批处理
- **原因**：Railway 免费套餐内存限制（512MB）

### 🎯 最佳实践
1. 测试时优先使用 **TestVideo**（更快、更省资源）
2. 批量渲染时添加适当延迟（如 Wait 节点）
3. 使用错误处理节点捕获异常
4. 渲染完成后及时下载到云存储

---

## 🔧 故障排查

### 问题 1: 请求超时
**症状**：n8n 报错 "Request timeout"

**解决方案**：
1. 增加 HTTP Request 节点超时时间到 180 秒
2. 使用 TestVideo 代替 MyVideo
3. 检查网络连接

### 问题 2: 内存不足
**症状**：返回 "Memory exceeded" 或 OOM 错误

**解决方案**：
1. 使用 TestVideo（720p 而非 1080p）
2. 减少并发请求数量
3. 添加请求间隔

### 问题 3: 下载失败
**症状**：无法下载视频文件

**解决方案**：
1. 确认 downloadUrl 路径正确
2. 检查渲染是否真正完成
3. 验证 URL 格式：需要加上域名前缀

---

## 🎓 学习资源

### 文档
- **完整集成指南**：`n8n-integration-guide.md`
- **快速开始工作流**：`n8n-quick-start.json`
- **高级工作流示例**：`n8n-advanced-workflow.json`

### API 测试
```bash
# 健康检查
curl https://remotion-railway-renderer-production.up.railway.app/health

# 获取可用组合
curl https://remotion-railway-renderer-production.up.railway.app/compositions

# 渲染视频
curl -X POST https://remotion-railway-renderer-production.up.railway.app/render \
  -H "Content-Type: application/json" \
  -d '{"compositionId":"TestVideo","inputProps":{"title":"测试","subtitle":"n8n"}}'
```

---

## 📞 技术支持

### API 信息
- **服务名称**: Remotion Railway Renderer API
- **版本**: 1.0.0
- **状态页面**: https://remotion-railway-renderer-production.up.railway.app/
- **健康检查**: https://remotion-railway-renderer-production.up.railway.app/health

### 有用的命令
```powershell
# PowerShell - 测试 API
Invoke-WebRequest -Uri "https://remotion-railway-renderer-production.up.railway.app/health"

# PowerShell - 渲染视频
$body = @{ compositionId = "TestVideo" } | ConvertTo-Json
Invoke-WebRequest -Uri "https://remotion-railway-renderer-production.up.railway.app/render" -Method POST -Body $body -ContentType "application/json"
```

---

## 🎉 开始创建你的自动化视频工作流！

1. **导入工作流**：在 n8n 中导入 `n8n-quick-start.json`
2. **点击执行**：运行工作流测试
3. **查看结果**：获取渲染好的视频
4. **自定义**：根据需求修改标题和内容

**祝你使用愉快！** 🚀

---

*最后更新：2025-10-24*  
*测试状态：✅ 全部通过*  
*API 状态：✅ 运行正常*




