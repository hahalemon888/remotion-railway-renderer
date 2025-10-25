# 🚀 详细部署指南

## 方法 1: 使用 GitHub（推荐）⭐

### 步骤 1: 准备 GitHub 仓库

1. **创建新仓库**
   ```bash
   git init
   git add .
   git commit -m "初始化 Remotion Railway 项目"
   git branch -M main
   git remote add origin https://github.com/你的用户名/你的仓库名.git
   git push -u origin main
   ```

### 步骤 2: 连接 Railway

1. 访问 [railway.app](https://railway.app)
2. 点击 **"Login"** 使用 GitHub 账号登录
3. 点击 **"New Project"**
4. 选择 **"Deploy from GitHub repo"**
5. 授权 Railway 访问你的 GitHub
6. 选择刚才创建的仓库
7. Railway 会自动检测 Dockerfile 并开始部署

### 步骤 3: 等待部署完成

- ⏱️ 首次部署大约需要 5-10 分钟
- 📊 可以在 "Deployments" 标签查看实时日志
- ✅ 看到 "🚀 Remotion 渲染服务器运行在端口 3000" 表示成功

### 步骤 4: 获取公开 URL

1. 在 Railway 项目中，点击 **"Settings"** 标签
2. 找到 **"Domains"** 部分
3. 点击 **"Generate Domain"**
4. 你会得到类似 `https://your-app.up.railway.app` 的 URL

### 步骤 5: 测试 API

```bash
# 健康检查
curl https://your-app.up.railway.app/health

# 获取组合列表
curl https://your-app.up.railway.app/compositions

# 渲染测试
curl -X POST https://your-app.up.railway.app/render \
  -H "Content-Type: application/json" \
  -d '{
    "compositionId": "MyVideo",
    "inputProps": {
      "title": "测试视频",
      "subtitle": "Railway 部署成功！"
    }
  }'
```

---

## 方法 2: 使用 Railway CLI

### 步骤 1: 安装 Railway CLI

```bash
# macOS / Linux
brew install railway

# Windows (使用 Scoop)
scoop install railway

# 或使用 npm
npm i -g @railway/cli
```

### 步骤 2: 登录

```bash
railway login
```

### 步骤 3: 初始化项目

```bash
# 在项目目录中
railway init
```

### 步骤 4: 部署

```bash
railway up
```

### 步骤 5: 查看部署

```bash
# 查看日志
railway logs

# 打开项目面板
railway open
```

---

## 🔧 环境变量配置

### 在 Railway 面板中设置

1. 进入项目 → **"Variables"** 标签
2. 添加以下变量（可选）：

```bash
NODE_ENV=production
PORT=3000
```

### 如果需要 API 认证：

```bash
API_KEY=your-secret-key-here
```

---

## 📦 更新部署

### 方法 1: Git Push（推荐）

```bash
# 修改代码后
git add .
git commit -m "更新视频组件"
git push

# Railway 会自动检测并重新部署！
```

### 方法 2: 使用 Railway CLI

```bash
railway up
```

### 方法 3: 手动触发

1. 进入 Railway 项目
2. 点击 **"Deployments"**
3. 点击 **"Redeploy"**

---

## 🔄 回滚到之前的版本

1. 进入 **"Deployments"** 标签
2. 找到想要回滚的版本
3. 点击 **"Redeploy"**

---

## 📊 监控和调试

### 查看实时日志

**方法 1: 在 Railway 面板**
- 进入项目 → **"Deployments"** → 选择当前部署 → 查看日志

**方法 2: 使用 CLI**
```bash
railway logs --tail
```

### 查看资源使用情况

1. 进入项目 → **"Metrics"** 标签
2. 查看：
   - CPU 使用率
   - 内存使用
   - 网络流量

### 设置告警（Pro 计划）

1. 进入 **"Settings"** → **"Alerts"**
2. 配置：
   - 内存使用超过 80%
   - CPU 使用超过 90%
   - 请求失败率过高

---

## 💡 优化建议

### 1. 减少 Docker 镜像大小

在 `Dockerfile` 中使用多阶段构建：

```dockerfile
# 构建阶段
FROM node:18-bullseye AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 运行阶段
FROM node:18-bullseye-slim
RUN apt-get update && apt-get install -y chromium
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
CMD ["npm", "start"]
```

### 2. 添加缓存

在 `server/index.js` 中缓存打包结果：

```javascript
let cachedBundle = null;

app.post('/render', async (req, res) => {
  if (!cachedBundle) {
    cachedBundle = await bundle({
      entryPoint: path.join(__dirname, '../src/Root.tsx'),
    });
  }
  // 使用 cachedBundle 进行渲染...
});
```

### 3. 清理旧文件

添加定时任务清理输出文件：

```javascript
import cron from 'node-cron';
import fs from 'fs';

// 每天凌晨 2 点清理超过 24 小时的文件
cron.schedule('0 2 * * *', () => {
  const outputDir = path.join(__dirname, '../output');
  const files = fs.readdirSync(outputDir);
  const now = Date.now();
  
  files.forEach(file => {
    const filePath = path.join(outputDir, file);
    const stats = fs.statSync(filePath);
    const age = now - stats.mtimeMs;
    
    if (age > 24 * 60 * 60 * 1000) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ 删除旧文件: ${file}`);
    }
  });
});
```

---

## 🐛 常见问题排查

### 问题 1: 部署失败 - "Failed to build Docker image"

**原因**: Dockerfile 语法错误或依赖安装失败

**解决**:
1. 检查 Dockerfile 语法
2. 本地测试 Docker 构建：
   ```bash
   docker build -t remotion-test .
   docker run -p 3000:3000 remotion-test
   ```

### 问题 2: 渲染失败 - "Chrome not found"

**原因**: Docker 镜像缺少 Chrome/Chromium

**解决**:
确保 Dockerfile 包含所有必要的系统依赖（已在提供的 Dockerfile 中包含）

### 问题 3: 请求超时

**原因**: Railway 免费版有 5 分钟请求超时

**解决**:
- 减少视频时长和复杂度
- 降低分辨率（1280x720 而不是 1920x1080）
- 升级到 Pro 计划（10 分钟超时）

### 问题 4: 内存不足 - "JavaScript heap out of memory"

**原因**: 视频渲染占用内存过大

**解决**:
1. 在 Railway 项目设置中增加内存配额（需要付费）
2. 优化视频组件，减少复杂计算
3. 分段渲染长视频

### 问题 5: 部署成功但无法访问

**原因**: 端口配置错误

**解决**:
确保 `server/index.js` 使用环境变量 `PORT`:
```javascript
const PORT = process.env.PORT || 3000;
```

---

## 🔐 安全最佳实践

### 1. 添加 API 密钥认证

见 README.md 中的 "添加 API 认证" 部分

### 2. 限制请求速率

安装 `express-rate-limit`:

```bash
npm install express-rate-limit
```

在 `server/index.js` 中：

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 10, // 限制 10 个请求
  message: '请求过于频繁，请稍后再试'
});

app.use('/render', limiter);
```

### 3. 输入验证

```javascript
import { body, validationResult } from 'express-validator';

app.post('/render', [
  body('compositionId').isString().notEmpty(),
  body('inputProps').isObject(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // ... 渲染逻辑
});
```

---

## 📈 性能测试

### 使用 Apache Bench

```bash
ab -n 10 -c 2 -p payload.json -T application/json \
  https://your-app.railway.app/render
```

`payload.json`:
```json
{
  "compositionId": "MyVideo",
  "inputProps": {
    "title": "性能测试",
    "subtitle": "测试中..."
  }
}
```

### 预期性能

基于 Railway 的默认配置：

| 视频长度 | 分辨率 | 预计渲染时间 |
|---------|-------|------------|
| 5秒 | 1920x1080 | ~10-15秒 |
| 10秒 | 1920x1080 | ~20-30秒 |
| 30秒 | 1920x1080 | ~60-90秒 |
| 5秒 | 1280x720 | ~5-10秒 |

---

## 💰 成本优化

### 1. 监控用量

在 Railway 面板查看每月账单：
- 进入项目 → **"Usage"** 标签

### 2. 设置预算告警

- 进入 **"Settings"** → **"Usage Alerts"**
- 设置月度预算上限

### 3. 优化渲染策略

- 缓存打包结果（见上面的优化建议）
- 使用较低的 FPS（24fps 而不是 30fps）
- 使用 JPEG 作为视频图像格式（已在 `remotion.config.ts` 中配置）

---

## 🎓 下一步学习

1. **学习 Remotion**
   - [官方教程](https://www.remotion.dev/docs/)
   - [示例项目](https://github.com/remotion-dev/remotion)

2. **优化 n8n 工作流**
   - 添加错误重试
   - 实现队列系统
   - 集成云存储

3. **扩展功能**
   - 添加 Webhook 回调
   - 支持多种视频格式
   - 实现视频模板管理

---

需要帮助？在项目 Issues 中提问！




