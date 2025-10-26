# 🚀 快速测试指南 - 10 个片段工作流

## 📋 前提条件
- ✅ 已部署到 Railway
- ✅ 服务正常运行
- ✅ 记录你的 Railway URL（例如：`https://your-app.railway.app`）

---

## 🧪 方法 1: 自动化脚本（推荐）

### Linux / macOS
```bash
# 赋予执行权限
chmod +x test-workflow.sh

# 运行测试
./test-workflow.sh https://your-app.railway.app
```

### Windows (PowerShell)
```powershell
# 运行测试
.\test-workflow.ps1 -RailwayUrl "https://your-app.railway.app"
```

### 脚本功能
1. ✅ 自动提交渲染任务
2. ✅ 实时显示进度
3. ✅ 自动下载完成的视频
4. ✅ 超时保护（10分钟）

---

## 🛠️ 方法 2: 手动测试（学习用）

### 步骤 1: 提交渲染任务

**cURL 命令：**
```bash
curl -X POST https://your-app.railway.app/render \
  -H "Content-Type: application/json" \
  -d '{
    "compositionId": "MyVideo",
    "inputProps": {
      "title": "10个片段测试",
      "subtitle": "极限内存模式 - Railway 512MB"
    },
    "outputFileName": "test-10-segments.mp4",
    "renderOptions": {
      "scale": 0.2,
      "crf": 40
    }
  }'
```

**PowerShell 命令：**
```powershell
$body = @{
    compositionId = "MyVideo"
    inputProps = @{
        title = "10个片段测试"
        subtitle = "极限内存模式"
    }
    outputFileName = "test-10-segments.mp4"
    renderOptions = @{
        scale = 0.2
        crf = 40
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://your-app.railway.app/render" `
  -Method Post -Body $body -ContentType "application/json"
```

**返回示例：**
```json
{
  "taskId": "abc123",
  "status": "queued",
  "message": "任务已加入队列"
}
```

---

### 步骤 2: 查询任务状态

**cURL 命令：**
```bash
curl https://your-app.railway.app/render/abc123
```

**PowerShell 命令：**
```powershell
Invoke-RestMethod -Uri "https://your-app.railway.app/render/abc123"
```

**返回示例（进行中）：**
```json
{
  "taskId": "abc123",
  "status": "rendering",
  "progress": 45.5,
  "message": "正在渲染: 45.5%"
}
```

**返回示例（完成）：**
```json
{
  "taskId": "abc123",
  "status": "completed",
  "progress": 100,
  "downloadUrl": "https://your-app.railway.app/output/test-10-segments.mp4"
}
```

---

### 步骤 3: 下载视频

**cURL 命令：**
```bash
curl -O https://your-app.railway.app/output/test-10-segments.mp4
```

**PowerShell 命令：**
```powershell
Invoke-WebRequest -Uri "https://your-app.railway.app/output/test-10-segments.mp4" `
  -OutFile "test-10-segments.mp4"
```

**浏览器：**
直接访问 `https://your-app.railway.app/output/test-10-segments.mp4`

---

## 📊 预期结果

### 正常情况
- ✅ **提交任务**: 立即返回 `taskId`
- ✅ **渲染时间**: 5-10 分钟（10个片段）
- ✅ **内存使用**: ~400-480MB（Railway 显示）
- ✅ **视频质量**: 384x216 分辨率（scale=0.2）
- ✅ **文件大小**: ~2-5MB（crf=40）

### 异常情况

#### 问题 1: OOM (Out of Memory)
**症状**: Railway 显示内存 >512MB，服务重启

**解决方案**:
```json
{
  "renderOptions": {
    "scale": 0.15,  // 降低到 15%
    "crf": 45       // 提高到 45
  }
}
```

#### 问题 2: 超时
**症状**: 30 分钟后任务仍未完成

**解决方案**:
1. 减少片段数量到 5 个
2. 拆分为多个小任务
3. 升级到 Railway Pro

#### 问题 3: 渲染失败
**症状**: `status: "failed"`

**调试步骤**:
1. 查看 Railway 日志
2. 访问 `/jobs` 查看详细错误
3. 检查 `inputProps` 是否正确

---

## 🎯 性能基准

### Railway 免费版 (512MB)

| 片段数 | Scale | CRF | 渲染时间 | 内存峰值 | 状态 |
|--------|-------|-----|----------|----------|------|
| 3      | 0.2   | 40  | ~2 分钟  | ~350MB   | ✅    |
| 5      | 0.2   | 40  | ~4 分钟  | ~400MB   | ✅    |
| 10     | 0.2   | 40  | ~8 分钟  | ~450MB   | ✅    |
| 15     | 0.2   | 40  | ~12 分钟 | ~480MB   | ⚠️    |
| 20     | 0.2   | 40  | ~18 分钟 | ~500MB   | ❌    |

> ⚠️ = 可能 OOM  
> ❌ = 必定 OOM

---

## 🔧 调优技巧

### 场景 1: 需要更高质量（少量片段）
```json
{
  "renderOptions": {
    "scale": 0.3,   // 提高到 30%
    "crf": 35       // 降低到 35
  }
}
```
**支持片段**: ~5 个  
**分辨率**: 576x324

---

### 场景 2: 需要更多片段（牺牲质量）
```json
{
  "renderOptions": {
    "scale": 0.15,  // 降低到 15%
    "crf": 45       // 提高到 45
  }
}
```
**支持片段**: ~15 个  
**分辨率**: 288x162

---

### 场景 3: 极限测试（最大片段数）
```json
{
  "renderOptions": {
    "scale": 0.1,   // 降低到 10%
    "crf": 51       // 最高压缩
  }
}
```
**支持片段**: ~20 个  
**分辨率**: 192x108  
**警告**: 视频质量极差

---

## 📈 监控内存使用

### Railway 平台
1. 打开 Railway Dashboard
2. 进入你的项目
3. 点击 **Metrics** 标签
4. 查看 **Memory Usage** 图表

### 正常范围
- **空闲**: 100-150MB
- **渲染中**: 400-480MB
- **危险**: >490MB（可能 OOM）

---

## 🚨 故障排查

### 1. 查看实时日志
```bash
# Railway CLI
railway logs -f

# 或者在 Railway Dashboard 中查看
```

### 2. 查看所有任务
```bash
curl https://your-app.railway.app/jobs
```

### 3. 清理失败的任务
```bash
# 重启服务
railway restart
```

### 4. 手动测试 API
```bash
# 测试服务是否运行
curl https://your-app.railway.app/

# 应返回 API 文档
```

---

## 🎓 学习资源

- **内存优化详解**: `MEMORY-OPTIMIZATION.md`
- **完整部署指南**: `DEPLOYMENT.md`
- **n8n 集成**: `N8N-READY.md`
- **Remotion 文档**: https://www.remotion.dev/docs

---

## ✅ 成功检查清单

- [ ] 服务成功部署到 Railway
- [ ] 访问根路径 `/` 返回 API 文档
- [ ] 提交任务返回 `taskId`
- [ ] 查询任务返回 `status: "rendering"`
- [ ] 渲染完成后返回 `downloadUrl`
- [ ] 成功下载视频文件
- [ ] 内存峰值 <500MB
- [ ] 渲染时间 <10 分钟

---

**准备好了？开始测试吧！** 🚀

```bash
# Linux/macOS
./test-workflow.sh https://your-app.railway.app

# Windows
.\test-workflow.ps1 -RailwayUrl "https://your-app.railway.app"
```

