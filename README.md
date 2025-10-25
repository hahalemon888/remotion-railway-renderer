# 🎬 Remotion Railway 渲染器

一个部署在 Railway 上的 Remotion 视频渲染服务，专为 n8n 集成设计。

## ⚡ 为什么选择 Railway？

### 🥇 Railway vs AWS Lambda

| 特性 | Railway | AWS Lambda |
|------|---------|-----------|
| **部署时间** | ⚡ 5分钟 | ⏰ 2-3小时（配置地狱） |
| **配置复杂度** | 😊 简单（连接GitHub即可） | 😰 复杂（IAM、S3、CloudFormation等） |
| **免费额度** | 💰 $5/月 | 💸 按需付费（可能更贵） |
| **调试体验** | 📊 实时日志 | 🤯 CloudWatch 复杂 |
| **回滚** | 🔄 一键回滚 | 😓 需要重新部署 |
| **分布式渲染** | ❌ 不支持 | ✅ 支持 |

### ✅ Railway 适合的场景：
- 中小型项目（每月渲染 <1000 个视频）
- 需要快速上线
- 不想折腾 AWS 配置
- 视频时长 < 5分钟

## 🚀 部署到 Railway（5分钟完成）

### 步骤 1: 准备代码

1. Fork 或克隆这个项目到你的 GitHub
2. 确保所有文件都已提交

### 步骤 2: 连接到 Railway

1. 访问 [railway.app](https://railway.app)
2. 使用 GitHub 登录
3. 点击 "New Project"
4. 选择 "Deploy from GitHub repo"
5. 选择这个项目仓库

### 步骤 3: 配置环境变量（可选）

在 Railway 项目设置中添加：
```
PORT=3000
NODE_ENV=production
```

### 步骤 4: 部署

Railway 会自动：
- ✅ 检测 Dockerfile
- ✅ 构建 Docker 镜像
- ✅ 部署服务
- ✅ 生成公开 URL（例如：`https://your-app.railway.app`）

**🎉 完成！你的渲染服务已上线！**

## 📡 API 端点

### 1. 健康检查
```bash
GET https://your-app.railway.app/health
```

### 2. 获取可用组合
```bash
GET https://your-app.railway.app/compositions
```

响应示例：
```json
{
  "success": true,
  "compositions": [
    {
      "id": "MyVideo",
      "width": 1920,
      "height": 1080,
      "fps": 30,
      "durationInFrames": 150,
      "durationInSeconds": "5.00"
    }
  ]
}
```

### 3. 渲染视频 ⭐
```bash
POST https://your-app.railway.app/render
Content-Type: application/json

{
  "compositionId": "MyVideo",
  "inputProps": {
    "title": "你好世界",
    "subtitle": "这是我的第一个视频"
  },
  "outputFileName": "my-video.mp4"
}
```

响应示例：
```json
{
  "success": true,
  "message": "视频渲染成功",
  "data": {
    "outputPath": "/app/output/my-video.mp4",
    "outputFileName": "my-video.mp4",
    "compositionId": "MyVideo",
    "duration": "12.34秒",
    "width": 1920,
    "height": 1080,
    "fps": 30,
    "durationInFrames": 150
  }
}
```

## 🔗 n8n 集成

### 在 n8n 中创建工作流：

1. **HTTP Request 节点** - 调用渲染 API
```json
{
  "method": "POST",
  "url": "https://your-app.railway.app/render",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "compositionId": "MyVideo",
    "inputProps": {
      "title": "{{ $json.title }}",
      "subtitle": "{{ $json.subtitle }}"
    },
    "outputFileName": "video-{{ $json.id }}.mp4"
  }
}
```

2. **处理响应**
- 渲染成功后，你会得到视频路径
- 可以进一步上传到云存储（S3、Cloudflare R2 等）

### n8n 工作流示例：

```
触发器（Webhook） 
  ↓
HTTP Request（调用 Railway 渲染）
  ↓
判断节点（检查是否成功）
  ↓
上传到云存储（可选）
  ↓
发送通知
```

## 🎨 自定义视频组件

### 1. 编辑视频组件

修改 `src/Video.tsx` 来自定义你的视频：

```tsx
export const MyVideo: React.FC<VideoProps> = ({ title, subtitle }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </AbsoluteFill>
  );
};
```

### 2. 添加新组合

在 `src/Root.tsx` 中添加新的 Composition：

```tsx
<Composition
  id="MyNewVideo"
  component={MyNewVideo}
  durationInFrames={300}
  fps={30}
  width={1280}
  height={720}
/>
```

### 3. 提交并推送

```bash
git add .
git commit -m "更新视频组件"
git push
```

Railway 会自动重新部署！🎉

## 💰 成本估算

### Railway 免费额度：
- $5/月免费额度
- 估计可以渲染：**50-100个短视频**（1-3分钟）

### 升级计划（如果需要）：
- Hobby: $5/月 + 用量
- Pro: $20/月 + 用量

### 成本对比：
| 平台 | 100个视频/月 | 500个视频/月 |
|------|-------------|-------------|
| Railway | ~$5-15 | ~$30-50 |
| AWS Lambda | ~$10-20 | ~$40-80 |
| 自建 VPS | ~$20（固定） | ~$20（固定） |

## 🐛 故障排查

### 问题 1: 渲染超时
**原因**: Railway 免费版有 5 分钟请求超时限制

**解决**:
- 减少视频时长
- 降低分辨率
- 升级到 Pro 计划（10分钟超时）

### 问题 2: 内存不足
**原因**: Railway 默认 512MB 内存

**解决**:
在 Railway 设置中增加内存（需要付费计划）

### 问题 3: Chrome 启动失败
**原因**: Docker 镜像缺少依赖

**解决**:
检查 Dockerfile 是否包含所有必要的系统库

## 📊 监控和日志

### 查看实时日志：
1. 进入 Railway 项目
2. 点击 "Deployments"
3. 查看实时日志输出

### 日志示例：
```
📹 收到渲染请求: { compositionId: 'MyVideo', ... }
📦 正在打包项目...
🎬 获取视频组合信息...
🎥 开始渲染视频...
渲染进度: 25.0%
渲染进度: 50.0%
渲染进度: 75.0%
渲染进度: 100.0%
✅ 渲染完成! 用时: 12.34秒
```

## 🔐 添加 API 认证（可选）

### 1. 修改 `server/index.js`

```javascript
// 添加认证中间件
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: '未授权' });
  }
  next();
};

// 保护渲染端点
app.post('/render', authenticate, async (req, res) => {
  // ... 渲染逻辑
});
```

### 2. 在 Railway 中设置环境变量
```
API_KEY=your-secret-key-here
```

### 3. 在 n8n 中添加 Header
```json
{
  "x-api-key": "your-secret-key-here"
}
```

## 🎯 下一步

- [ ] 添加视频上传到云存储功能
- [ ] 添加 Webhook 回调通知
- [ ] 实现渲染队列系统
- [ ] 添加更多视频模板

## 📚 相关资源

- [Remotion 官方文档](https://www.remotion.dev/docs/)
- [Railway 文档](https://docs.railway.app/)
- [n8n 文档](https://docs.n8n.io/)

## ❓ 常见问题

**Q: Railway 会不会比 Lambda 贵？**  
A: 对于中小型项目（<1000个视频/月），成本相近。但 Railway 节省了大量配置时间。

**Q: 可以用在生产环境吗？**  
A: 可以！但要注意：
- 监控渲染时间和成本
- 设置告警
- 定期清理输出文件

**Q: 支持并发渲染吗？**  
A: Railway 单实例默认不支持并发。但你可以：
- 升级实例配置
- 部署多个实例
- 使用队列系统

## 📝 许可

MIT License

---

**需要帮助？** 在 Issues 中提问或联系我！




