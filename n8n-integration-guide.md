# n8n 集成指南 - Remotion 视频渲染 API

## 🎯 概述
本指南将帮助你在 n8n 中调用 Remotion 视频渲染 API，实现自动化视频生成工作流。

## 📋 前提条件
- n8n 已安装并运行（本地或云端）
- API 地址：`https://remotion-railway-renderer-production.up.railway.app`

---

## 🚀 快速开始 - 基础工作流

### 方法 1：使用 HTTP Request 节点（推荐）

#### 步骤 1：添加 HTTP Request 节点
1. 在 n8n 画布中添加 **HTTP Request** 节点
2. 配置如下：

**基础配置：**
- **Method**: `POST`
- **URL**: `https://remotion-railway-renderer-production.up.railway.app/render`
- **Authentication**: `None`（当前无需认证）
- **Send Headers**: 启用
  - Name: `Content-Type`
  - Value: `application/json`

**请求体配置：**
- **Body Content Type**: `JSON`
- **Specify Body**: `Using JSON`
- **JSON Body**:
```json
{
  "compositionId": "TestVideo",
  "inputProps": {
    "title": "我的第一个视频",
    "subtitle": "由 n8n 自动生成"
  },
  "outputFileName": "n8n-test-video.mp4"
}
```

**响应配置：**
- **Response Format**: `JSON`
- **Full Response**: 可选启用（如需获取响应头）

---

## 📊 可用的视频组合

### 1. TestVideo（推荐用于测试）
轻量级视频，内存消耗低，渲染速度快

```json
{
  "compositionId": "TestVideo",
  "inputProps": {
    "title": "标题文字",
    "subtitle": "副标题文字"
  },
  "outputFileName": "test.mp4"
}
```

**规格：**
- 分辨率：1280×720 (720p)
- 帧率：15 FPS
- 时长：4 秒
- 渲染时间：约 30-60 秒

### 2. MyVideo（标准质量）
高质量视频，适合正式使用

```json
{
  "compositionId": "MyVideo",
  "inputProps": {
    "title": "标题文字",
    "subtitle": "副标题文字"
  },
  "outputFileName": "my-video.mp4"
}
```

**规格：**
- 分辨率：1920×1080 (1080p)
- 帧率：30 FPS
- 时长：5 秒
- 渲染时间：约 90-120 秒

---

## 🔄 完整工作流示例

### 示例 1：基础渲染 + 下载视频

```
触发器 → HTTP Request (渲染) → HTTP Request (下载) → 保存文件
```

**节点 1：触发器**
- 使用 **Webhook** 或 **Manual Trigger**

**节点 2：渲染视频**
- 类型：HTTP Request
- Method: POST
- URL: `.../render`
- Body: 
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

**节点 3：下载视频**
- 类型：HTTP Request
- Method: GET
- URL: `https://remotion-railway-renderer-production.up.railway.app{{$json.data.downloadUrl}}`
- Response Format: `File`

**节点 4：保存或处理**
- 可以保存到云存储（Google Drive、S3 等）
- 或通过邮件发送
- 或推送到其他服务

---

### 示例 2：批量生成视频

```
读取数据 → 循环 → HTTP Request (渲染) → 等待 → 收集结果
```

**节点配置：**

1. **数据源节点**（Google Sheets、Airtable 等）
   - 读取包含视频信息的列表

2. **Loop Over Items** 或 **Split In Batches**
   - 处理每一行数据

3. **HTTP Request (渲染)**
   - URL: `.../render`
   - Body:
   ```json
   {
     "compositionId": "TestVideo",
     "inputProps": {
       "title": "{{$json.title}}",
       "subtitle": "{{$json.subtitle}}"
     },
     "outputFileName": "video-{{$json.id}}.mp4"
   }
   ```

4. **Wait 节点**（可选）
   - 添加延迟避免过载

5. **聚合结果**
   - 收集所有视频的下载链接

---

## 🎨 动态内容示例

### 使用 n8n 表达式传递动态数据

```json
{
  "compositionId": "TestVideo",
  "inputProps": {
    "title": "{{$json.customerName}}",
    "subtitle": "订单 #{{$json.orderId}} - {{$now.format('YYYY-MM-DD')}}"
  },
  "outputFileName": "order-{{$json.orderId}}-{{$now.toUnixInteger()}}.mp4"
}
```

### 从 Webhook 接收数据

**Webhook 触发器：**
```json
{
  "title": "客户姓名",
  "subtitle": "订单信息",
  "compositionId": "TestVideo"
}
```

**HTTP Request 节点：**
```json
{
  "compositionId": "{{$json.compositionId}}",
  "inputProps": {
    "title": "{{$json.title}}",
    "subtitle": "{{$json.subtitle}}"
  },
  "outputFileName": "video-{{$now.format('YYYY-MM-DD-HHmmss')}}.mp4"
}
```

---

## 📦 API 响应结构

### 成功响应（200）
```json
{
  "success": true,
  "message": "视频渲染成功",
  "data": {
    "outputPath": "/app/out/video.mp4",
    "outputFileName": "video.mp4",
    "compositionId": "TestVideo",
    "duration": "45.23秒",
    "width": 1280,
    "height": 720,
    "fps": 15,
    "durationInFrames": 60,
    "downloadUrl": "/output/video.mp4"
  }
}
```

### 使用响应数据

在后续节点中访问：
- 下载链接：`{{$json.data.downloadUrl}}`
- 文件名：`{{$json.data.outputFileName}}`
- 渲染时间：`{{$json.data.duration}}`

---

## 🔍 调试技巧

### 1. 检查 API 健康状态
添加初始健康检查节点：
- Method: GET
- URL: `https://remotion-railway-renderer-production.up.railway.app/health`

### 2. 获取可用组合列表
- Method: GET
- URL: `https://remotion-railway-renderer-production.up.railway.app/compositions`

### 3. 错误处理
在 HTTP Request 节点中启用：
- **Continue On Fail**: 启用
- **Always Output Data**: 启用

添加 **IF** 节点检查响应：
```javascript
{{$json.success === true}}
```

---

## 🎯 实际应用场景

### 1. 自动化营销视频
- 触发：新客户注册
- 数据：客户名称、欢迎信息
- 输出：个性化欢迎视频

### 2. 订单确认视频
- 触发：订单完成
- 数据：订单号、产品信息
- 输出：订单确认视频通过邮件发送

### 3. 社交媒体内容
- 触发：定时任务
- 数据：每日统计、报价、新闻
- 输出：自动发布到社交媒体

### 4. 批量证书生成
- 触发：培训完成
- 数据：学员名单、证书信息
- 输出：个性化证书视频

---

## 📝 完整的 n8n 工作流 JSON

你可以直接导入这个工作流到 n8n：

```json
{
  "name": "Remotion 视频渲染工作流",
  "nodes": [
    {
      "parameters": {},
      "name": "手动触发",
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://remotion-railway-renderer-production.up.railway.app/render",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": []
        },
        "specifyBody": "json",
        "jsonBody": "{\n  \"compositionId\": \"TestVideo\",\n  \"inputProps\": {\n    \"title\": \"测试视频\",\n    \"subtitle\": \"由 n8n 生成\"\n  },\n  \"outputFileName\": \"n8n-test.mp4\"\n}",
        "options": {}
      },
      "name": "渲染视频",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "=https://remotion-railway-renderer-production.up.railway.app{{$json.data.downloadUrl}}",
        "options": {
          "response": {
            "response": {
              "responseFormat": "file"
            }
          }
        }
      },
      "name": "下载视频",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [650, 300]
    }
  ],
  "connections": {
    "手动触发": {
      "main": [[{"node": "渲染视频", "type": "main", "index": 0}]]
    },
    "渲染视频": {
      "main": [[{"node": "下载视频", "type": "main", "index": 0}]]
    }
  }
}
```

---

## ⚠️ 注意事项

### 渲染时间
- TestVideo：约 30-60 秒
- MyVideo：约 90-120 秒
- 建议设置 HTTP Request 超时时间为 180 秒

### 内存限制
- Railway 免费套餐有 512MB 内存限制
- 推荐使用 TestVideo 进行大批量渲染
- 批量渲染时添加适当延迟

### 文件存储
- 渲染的视频暂时存储在服务器
- 建议及时下载并存储到云端
- 服务器重启后文件会清空

### 并发处理
- 避免同时发起多个渲染请求
- 使用队列或批处理机制
- 单个渲染完成后再发起下一个

---

## 🔧 故障排查

### 1. 请求超时
- 增加 HTTP Request 节点的超时时间
- 使用轻量级 TestVideo 组合

### 2. 内存不足（OOM）
- 切换到 TestVideo（720p）
- 减少并发请求
- 联系管理员升级服务器

### 3. 文件下载失败
- 确认 downloadUrl 路径正确
- 检查网络连接
- 验证文件是否已生成

---

## 📞 支持与反馈

如有问题或建议，请查看：
- API 文档：访问根路径 `/`
- 健康检查：`/health`
- 组合列表：`/compositions`

---

## 🎉 开始使用

现在你已经准备好了！

**快速测试步骤：**
1. 在 n8n 中创建新工作流
2. 添加 Manual Trigger 节点
3. 添加 HTTP Request 节点并配置（参考上面的设置）
4. 点击 "Execute Workflow"
5. 等待 30-60 秒
6. 查看返回的 downloadUrl
7. 使用下载节点获取视频文件

祝你使用愉快！🚀




