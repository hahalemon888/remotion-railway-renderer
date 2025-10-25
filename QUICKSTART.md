# ⚡ 5分钟快速开始

## 前置要求

- ✅ GitHub 账号
- ✅ Railway 账号（用 GitHub 登录即可）
- ✅ 本地已安装 Git

## 🚀 三步部署

### 第 1 步: Fork 项目到你的 GitHub（1分钟）

1. 点击本项目右上角的 **"Fork"** 按钮
2. 或者克隆到本地再推送到你的 GitHub：

```bash
# 克隆项目
git clone https://github.com/原作者/remotion-railway.git
cd remotion-railway

# 创建你自己的仓库并推送
git remote set-url origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

### 第 2 步: 部署到 Railway（3分钟）

1. 访问 [railway.app](https://railway.app)
2. 使用 GitHub 登录
3. 点击 **"New Project"**
4. 选择 **"Deploy from GitHub repo"**
5. 选择你刚才 Fork 的仓库
6. 等待自动部署（约 2-3 分钟）

### 第 3 步: 测试 API（1分钟）

1. 在 Railway 项目中点击 **"Settings"** → **"Generate Domain"**
2. 复制生成的 URL（例如：`https://your-app.railway.app`）
3. 测试 API：

```bash
# 替换成你的 Railway URL
curl https://your-app.railway.app/health
```

**看到成功响应？🎉 恭喜，部署完成！**

---

## 🎬 渲染你的第一个视频

### 使用 curl

```bash
curl -X POST https://your-app.railway.app/render \
  -H "Content-Type: application/json" \
  -d '{
    "compositionId": "MyVideo",
    "inputProps": {
      "title": "我的第一个视频",
      "subtitle": "由 Railway 渲染"
    }
  }'
```

### 使用 Postman

1. 方法: **POST**
2. URL: `https://your-app.railway.app/render`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "compositionId": "MyVideo",
  "inputProps": {
    "title": "我的第一个视频",
    "subtitle": "由 Railway 渲染"
  }
}
```

### 预期响应

```json
{
  "success": true,
  "message": "视频渲染成功",
  "data": {
    "outputPath": "/app/output/video-1234567890.mp4",
    "duration": "12.34秒",
    "width": 1920,
    "height": 1080
  }
}
```

---

## 🔗 集成到 n8n（5分钟）

### 方法 1: 导入现成的工作流

1. 在 n8n 中，点击 **"Import from File"**
2. 选择项目中的 `n8n-workflow-example.json`
3. 修改 HTTP Request 节点中的 URL 为你的 Railway URL
4. 激活工作流并测试

### 方法 2: 手动创建工作流

#### 节点 1: HTTP Request
- **Method**: POST
- **URL**: `https://your-app.railway.app/render`
- **Body**:
```json
{
  "compositionId": "MyVideo",
  "inputProps": {
    "title": "{{ $json.title }}",
    "subtitle": "{{ $json.subtitle }}"
  }
}
```

#### 测试

在 n8n 中点击 **"Execute Node"**，如果看到成功响应，大功告成！

---

## 📝 自定义视频内容

### 修改文字和样式

编辑 `src/Video.tsx`:

```tsx
export const MyVideo: React.FC<VideoProps> = ({ title, subtitle }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }}>
      <h1 style={{ color: '#00ff00' }}>{title}</h1>
      <p style={{ color: '#ffffff' }}>{subtitle}</p>
    </AbsoluteFill>
  );
};
```

### 提交更改

```bash
git add .
git commit -m "自定义视频样式"
git push
```

**Railway 会自动重新部署！** 🚀

---

## 🎯 接下来做什么？

- 📖 阅读完整的 [README.md](README.md) 了解所有功能
- 🔧 查看 [DEPLOYMENT.md](DEPLOYMENT.md) 学习高级配置
- 🎨 探索 [Remotion 文档](https://www.remotion.dev/docs/) 创建更复杂的视频

---

## ❓ 遇到问题？

### 问题: Railway 部署失败

**检查**:
- 确保 Dockerfile 在项目根目录
- 查看 Railway 的部署日志找出具体错误

### 问题: API 无法访问

**检查**:
- 确保已生成公开域名
- 检查 Railway 的服务状态（绿色=正常）

### 问题: 渲染失败

**检查**:
- 查看 Railway 日志，找出具体错误信息
- 确保 `inputProps` 格式正确

---

**还有问题？** 在 Issues 中提问！

**觉得有用？** 给项目点个 ⭐ Star！




