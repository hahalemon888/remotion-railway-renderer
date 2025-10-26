# ✅ 部署检查清单 - Railway 10片段工作流

## 📋 部署前检查

### 1. 代码准备
- [ ] 已更新所有配置文件
- [ ] `Dockerfile` 包含内存优化参数
- [ ] `server/index.js` 默认 `scale=0.2, crf=40`
- [ ] 所有文件已提交到 Git

```bash
git status
# 确保所有文件都已提交
```

---

### 2. Railway 账号准备
- [ ] 已注册 Railway 账号
- [ ] 已连接 GitHub 账号
- [ ] 已了解免费额度（$5/月）

**注册链接**: https://railway.app/

---

### 3. 代码推送到 GitHub
```bash
# 添加所有文件
git add .

# 提交更改
git commit -m "优化内存配置，支持10片段渲染"

# 推送到 GitHub
git push origin main
```

---

## 🚀 部署步骤

### 步骤 1: 创建 Railway 项目
1. 访问 https://railway.app/
2. 点击 **New Project**
3. 选择 **Deploy from GitHub repo**
4. 选择你的仓库

**预计时间**: 1 分钟

---

### 步骤 2: Railway 自动检测配置
Railway 会自动：
- ✅ 检测 `Dockerfile`
- ✅ 构建 Docker 镜像
- ✅ 分配公共 URL
- ✅ 启动服务

**预计时间**: 3-5 分钟

---

### 步骤 3: 获取服务 URL
1. 进入 Railway 项目
2. 点击 **Settings** 标签
3. 找到 **Public Networking**
4. 点击 **Generate Domain**
5. 复制生成的 URL（例如：`https://your-app.railway.app`）

**预计时间**: 30 秒

---

### 步骤 4: 验证服务运行
```bash
# 访问 API 根路径
curl https://your-app.railway.app/

# 应该返回 API 文档
```

**预期输出**:
```json
{
  "message": "Remotion 渲染服务器已就绪",
  "endpoints": {
    "POST /render": "提交渲染任务（异步）...",
    "GET /render/:taskId": "查询任务状态和进度",
    ...
  }
}
```

---

## 🧪 部署后测试

### 测试 1: API 健康检查
```bash
curl https://your-app.railway.app/
```

**状态**: [ ] 通过

---

### 测试 2: 提交渲染任务
```bash
curl -X POST https://your-app.railway.app/render \
  -H "Content-Type: application/json" \
  -d @test-10-segments.json
```

**预期输出**:
```json
{
  "taskId": "abc123",
  "status": "queued",
  "message": "任务已加入队列"
}
```

**状态**: [ ] 通过

---

### 测试 3: 查询任务状态
```bash
curl https://your-app.railway.app/render/{taskId}
```

**预期输出**:
```json
{
  "taskId": "abc123",
  "status": "rendering",
  "progress": 25.5
}
```

**状态**: [ ] 通过

---

### 测试 4: 完整工作流测试
```bash
# Linux/macOS
./test-workflow.sh https://your-app.railway.app

# Windows
.\test-workflow.ps1 -RailwayUrl "https://your-app.railway.app"
```

**预期结果**:
- ✅ 任务提交成功
- ✅ 渲染进度更新
- ✅ 渲染完成（5-10 分钟）
- ✅ 视频下载成功

**状态**: [ ] 通过

---

## 📊 性能监控

### 监控指标

#### 1. 内存使用
- **路径**: Railway Dashboard → Metrics → Memory
- **正常范围**: 400-480MB
- **警告阈值**: >490MB
- **状态**: [ ] 正常

#### 2. CPU 使用
- **路径**: Railway Dashboard → Metrics → CPU
- **正常范围**: 50-80%
- **警告阈值**: >90%（持续）
- **状态**: [ ] 正常

#### 3. 渲染时间
- **单个片段**: ~30-60 秒
- **10 个片段**: ~5-10 分钟
- **状态**: [ ] 符合预期

#### 4. 错误率
- **查看**: Railway Dashboard → Logs
- **正常**: 无 OOM 错误
- **状态**: [ ] 无错误

---

## 🔧 故障排查

### 问题 1: 部署失败
**症状**: Railway 显示 "Build Failed"

**检查步骤**:
1. [ ] 查看 Railway 构建日志
2. [ ] 确认 `Dockerfile` 语法正确
3. [ ] 确认 `package.json` 依赖完整
4. [ ] 尝试本地 Docker 构建

**解决方案**:
```bash
# 本地测试 Docker 构建
docker build -t remotion-server .
docker run -p 3000:3000 remotion-server
```

---

### 问题 2: 服务启动失败
**症状**: Railway 显示 "Crashed"

**检查步骤**:
1. [ ] 查看 Railway 运行日志
2. [ ] 确认端口正确（3000）
3. [ ] 确认环境变量设置

**解决方案**:
```bash
# 检查日志
railway logs -f

# 重启服务
railway restart
```

---

### 问题 3: OOM (内存溢出)
**症状**: Railway 显示内存 >512MB，服务重启

**检查步骤**:
1. [ ] 查看渲染的片段数量
2. [ ] 确认 `scale` 和 `crf` 参数
3. [ ] 查看 Railway Metrics

**解决方案**:
```bash
# 进一步降低内存使用
curl -X POST https://your-app.railway.app/render \
  -H "Content-Type: application/json" \
  -d '{
    "renderOptions": {
      "scale": 0.15,
      "crf": 45
    }
  }'
```

---

### 问题 4: 渲染超时
**症状**: 30 分钟后任务仍未完成

**检查步骤**:
1. [ ] 查看片段数量（是否 >15）
2. [ ] 查看视频时长（是否 >5 分钟）
3. [ ] 查看 Railway CPU 使用率

**解决方案**:
- 减少片段数量
- 拆分为多个小任务
- 升级到 Railway Pro（更多资源）

---

## 🎯 优化建议

### 已完成的优化
- ✅ Node.js 内存限制: 256MB
- ✅ Chromium 内存限制: 256MB
- ✅ 视频缓存降低: 32MB
- ✅ 默认质量降低: scale=0.2, crf=40
- ✅ Chromium 启动参数优化

### 可选的进一步优化
- [ ] 使用 Redis 缓存中间结果
- [ ] 实现任务队列（Bull）
- [ ] 添加结果 CDN 缓存
- [ ] 使用 Railway Pro（更多内存）

---

## 📚 相关文档

| 文档 | 用途 | 链接 |
|------|------|------|
| **快速测试** | 测试 10 片段工作流 | `QUICK-TEST.md` |
| **内存优化** | 详细优化措施 | `MEMORY-OPTIMIZATION.md` |
| **优化总结** | 性能对比 | `OPTIMIZATION-SUMMARY.md` |
| **部署指南** | 完整部署流程 | `DEPLOYMENT.md` |
| **n8n 集成** | n8n 工作流 | `N8N-READY.md` |

---

## ✅ 最终检查

### 部署成功标准
- [ ] Railway 服务状态: **Running**
- [ ] 访问根路径返回 API 文档
- [ ] 提交任务返回 `taskId`
- [ ] 渲染 10 片段成功
- [ ] 内存峰值 <500MB
- [ ] 渲染时间 <10 分钟
- [ ] 视频下载成功

### 全部通过？
如果所有检查都通过，恭喜！🎉

你的 Remotion 渲染服务已经成功部署，可以：
1. 集成到 n8n 工作流
2. 开始实际生产使用
3. 监控性能指标
4. 根据需要调整参数

---

## 🚨 紧急联系

### 如果遇到无法解决的问题：
1. 查看 Railway 日志
2. 查看 GitHub Issues
3. 查看 Remotion 文档
4. 降级到更低的片段数量

---

**最后更新**: 2025-10-26  
**目标**: Railway 免费版 (512MB) 支持 10 片段渲染  
**状态**: ✅ 已优化完成

---

## 🎉 下一步

1. **立即部署**: 推送代码到 GitHub，连接 Railway
2. **运行测试**: 使用 `test-workflow.sh` 验证
3. **集成 n8n**: 导入 `n8n-10-segments-workflow.json`
4. **监控性能**: 关注 Railway Metrics
5. **持续优化**: 根据实际使用情况调整参数

**准备好了？开始部署吧！** 🚀

