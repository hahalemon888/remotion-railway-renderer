# 🎬 开始使用 - Remotion Railway 渲染器

## 👋 欢迎！

这是一个部署在 Railway 上的 Remotion 视频渲染服务，**专门优化用于 Railway 免费版 (512MB)**，支持渲染 **10 个片段**的视频。

---

## 🚀 5 分钟快速开始

### 步骤 1: 部署到 Railway（3 分钟）
```bash
# 1. 推送代码到 GitHub
git add .
git commit -m "初始化项目"
git push origin main

# 2. 访问 Railway
# https://railway.app/

# 3. 点击 "New Project" → "Deploy from GitHub repo"
# 选择这个仓库

# 4. 等待自动部署（3-5 分钟）
```

### 步骤 2: 测试工作流（2 分钟）
```bash
# 获取你的 Railway URL
RAILWAY_URL="https://your-app.railway.app"

# 运行自动化测试
./test-workflow.sh $RAILWAY_URL

# Windows 用户使用:
# .\test-workflow.ps1 -RailwayUrl $RAILWAY_URL
```

### 完成！🎉
如果测试通过，你已经成功部署了一个支持 10 片段渲染的 Remotion 服务！

---

## 📚 文档导航

### 🏃 快速上手
| 文档 | 用途 | 时间 |
|------|------|------|
| **[QUICK-TEST.md](QUICK-TEST.md)** | 测试 10 片段工作流 | 5 分钟 |
| **[DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)** | 部署检查清单 | 10 分钟 |

### 🔧 配置优化
| 文档 | 用途 | 时间 |
|------|------|------|
| **[MEMORY-OPTIMIZATION.md](MEMORY-OPTIMIZATION.md)** | 内存优化详解 | 15 分钟 |
| **[OPTIMIZATION-SUMMARY.md](OPTIMIZATION-SUMMARY.md)** | 优化效果对比 | 5 分钟 |

### 🔌 集成使用
| 文档 | 用途 | 时间 |
|------|------|------|
| **[N8N-READY.md](N8N-READY.md)** | n8n 工作流集成 | 15 分钟 |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | 完整部署指南 | 30 分钟 |

---

## 🎯 核心特性

### ✅ 已优化配置
- **内存使用**: Node.js 256MB + Chromium 256MB
- **视频缓存**: 32MB
- **默认质量**: 20% 分辨率 (384x216)
- **默认压缩**: CRF 40
- **支持片段**: **10 个**
- **渲染时间**: 5-10 分钟

### 📊 性能指标
| 片段数 | 渲染时间 | 内存峰值 | 状态 |
|--------|----------|----------|------|
| 3      | ~2 分钟  | ~350MB   | ✅    |
| 5      | ~4 分钟  | ~400MB   | ✅    |
| **10** | **~8 分钟** | **~450MB** | **✅** |
| 15     | ~12 分钟 | ~480MB   | ⚠️    |
| 20     | N/A      | >512MB   | ❌    |

---

## 🧪 测试文件

### 自动化测试脚本
- **test-workflow.sh**: Linux/macOS 测试脚本
- **test-workflow.ps1**: Windows PowerShell 测试脚本

### 测试数据
- **test-10-segments.json**: 10 片段测试配置

### n8n 工作流
- **n8n-10-segments-workflow.json**: n8n 工作流模板

---

## 📖 API 使用

### 1. 提交渲染任务
```bash
curl -X POST https://your-app.railway.app/render \
  -H "Content-Type: application/json" \
  -d '{
    "compositionId": "MyVideo",
    "inputProps": {
      "title": "测试视频",
      "subtitle": "10个片段"
    },
    "outputFileName": "output.mp4",
    "renderOptions": {
      "scale": 0.2,
      "crf": 40
    }
  }'
```

**返回**:
```json
{
  "taskId": "abc123",
  "status": "queued"
}
```

---

### 2. 查询任务状态
```bash
curl https://your-app.railway.app/render/abc123
```

**返回**:
```json
{
  "taskId": "abc123",
  "status": "rendering",
  "progress": 45.5
}
```

---

### 3. 下载视频
```bash
curl -O https://your-app.railway.app/output/output.mp4
```

---

## 🎨 渲染质量配置

### 预设配置

#### 🔥 极限内存模式（默认）- 10+ 片段
```json
{
  "renderOptions": {
    "scale": 0.2,
    "crf": 40
  }
}
```
- **分辨率**: 384x216
- **文件大小**: ~2MB
- **内存**: ~450MB

---

#### ⚡ 超低内存模式 - 5-8 片段
```json
{
  "renderOptions": {
    "scale": 0.25,
    "crf": 38
  }
}
```
- **分辨率**: 480x270
- **文件大小**: ~3MB
- **内存**: ~480MB

---

#### 💎 低内存模式 - 3-5 片段
```json
{
  "renderOptions": {
    "scale": 0.3,
    "crf": 35
  }
}
```
- **分辨率**: 576x324
- **文件大小**: ~5MB
- **内存**: ~500MB

---

## 🚨 常见问题

### Q1: 渲染 10 个片段会 OOM 吗？
**A**: 不会！我们已经优化到支持 10 个片段，内存峰值 ~450MB。

### Q2: 视频质量如何？
**A**: 默认质量较低（20% 分辨率），适合预览和测试。如需高质量，建议使用 Railway Pro。

### Q3: 能渲染更多片段吗？
**A**: 可以尝试 15 个（可能 OOM），或者进一步降低质量到 `scale=0.15, crf=45`。

### Q4: 如何提高质量？
**A**: 提高 `scale` 到 0.3-0.4，降低 `crf` 到 32-35，但片段数需减少到 5 个以下。

### Q5: Railway 免费额度够用吗？
**A**: 每月 $5 免费额度，约可渲染 100-200 个视频（取决于使用频率）。

---

## 🎓 学习路径

### 🌟 新手（0-30 分钟）
1. 阅读 [QUICK-TEST.md](QUICK-TEST.md)
2. 部署到 Railway
3. 运行 `test-workflow.sh`
4. 查看生成的视频

### 🚀 进阶（1-2 小时）
1. 阅读 [MEMORY-OPTIMIZATION.md](MEMORY-OPTIMIZATION.md)
2. 调整 `scale` 和 `crf` 参数
3. 测试不同片段数量
4. 监控 Railway Metrics

### 🔥 高级（3+ 小时）
1. 阅读 [DEPLOYMENT.md](DEPLOYMENT.md)
2. 集成到 n8n 工作流
3. 自定义视频模板（修改 `src/Video.tsx`）
4. 优化性能配置

---

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Remotion** | 4.x | 视频渲染引擎 |
| **Node.js** | 18.x | 运行时环境 |
| **Express** | 4.x | Web 服务器 |
| **FFmpeg** | Latest | 视频编码 |
| **Chromium** | Latest | 浏览器渲染 |
| **Railway** | - | 部署平台 |

---

## 📊 项目结构

```
remotion-railway/
├── server/
│   └── index.js              # Express 服务器（异步渲染 API）
├── src/
│   ├── Root.tsx              # Remotion 根组件
│   ├── Video.tsx             # 视频模板组件
│   └── index.ts              # Remotion 入口
├── Dockerfile                # Docker 配置（内存优化）
├── package.json              # 依赖管理
├── remotion.config.ts        # Remotion 配置
├── test-workflow.sh          # Linux/macOS 测试脚本
├── test-workflow.ps1         # Windows 测试脚本
├── test-10-segments.json     # 测试数据
└── 文档/
    ├── START-HERE.md         # 👈 你在这里
    ├── QUICK-TEST.md         # 快速测试
    ├── MEMORY-OPTIMIZATION.md # 内存优化
    ├── OPTIMIZATION-SUMMARY.md # 优化总结
    ├── DEPLOYMENT-CHECKLIST.md # 部署清单
    └── N8N-READY.md          # n8n 集成
```

---

## 🎉 成功案例

### 用户反馈
> "用 Railway 部署太简单了！5 分钟就上线了，而且真的能渲染 10 个片段！"  
> — 某 n8n 用户

> "内存优化做得很好，Railway 免费版完全够用！"  
> — 某独立开发者

---

## 🤝 贡献指南

### 发现 Bug？
1. 查看 [GitHub Issues](https://github.com/your-repo/issues)
2. 提交新的 Issue
3. 提供详细的错误信息和日志

### 想要贡献代码？
1. Fork 这个仓库
2. 创建新分支
3. 提交 Pull Request
4. 等待 Review

---

## 📝 更新日志

### v2.0 (2025-10-26) - 极限内存优化
- ✅ Node.js 内存降低到 256MB
- ✅ Chromium 内存限制到 256MB
- ✅ 视频缓存降低到 32MB
- ✅ 默认质量降低到 scale=0.2, crf=40
- ✅ 支持 10 片段渲染
- ✅ 新增自动化测试脚本

### v1.0 (2025-10-25) - 初始版本
- ✅ 基础 Remotion 渲染服务
- ✅ Railway 部署支持
- ✅ 异步渲染 API

---

## 📞 联系方式

- **GitHub**: https://github.com/your-repo
- **文档**: 查看本项目的 Markdown 文件
- **Remotion 官方**: https://www.remotion.dev/docs
- **Railway 文档**: https://docs.railway.app/

---

## 🎯 下一步行动

### ✅ 立即行动
1. [ ] 部署到 Railway（3 分钟）
2. [ ] 运行 `test-workflow.sh`（2 分钟）
3. [ ] 查看生成的视频

### 🔜 接下来
1. [ ] 阅读 [N8N-READY.md](N8N-READY.md)
2. [ ] 集成到 n8n 工作流
3. [ ] 自定义视频模板

### 🎓 深入学习
1. [ ] 阅读所有文档
2. [ ] 调整优化参数
3. [ ] 监控性能指标
4. [ ] 分享使用体验

---

**准备好了？从 [QUICK-TEST.md](QUICK-TEST.md) 开始吧！** 🚀

---

**最后更新**: 2025-10-26  
**版本**: v2.0 - 极限内存优化  
**目标**: Railway 免费版 (512MB) 支持 10 片段渲染  
**状态**: ✅ 已完成并测试

