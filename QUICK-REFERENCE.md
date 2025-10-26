# 🚀 快速参考卡片

## 📊 核心配置（一目了然）

```
┌─────────────────────────────────────────────────┐
│  🎯 目标: Railway 免费版 (512MB) 渲染 10 片段   │
├─────────────────────────────────────────────────┤
│  Node.js 内存:     256MB                         │
│  Chromium 内存:    256MB                         │
│  视频缓存:         32MB                          │
│  默认分辨率:       20% (384x216)                │
│  默认 CRF:         40                            │
│  并发数:           1                             │
├─────────────────────────────────────────────────┤
│  支持片段:         10 个                         │
│  渲染时间:         5-10 分钟                    │
│  内存峰值:         ~450MB                       │
│  文件大小:         ~2MB                          │
└─────────────────────────────────────────────────┘
```

---

## 🚀 快速命令

### 部署
```bash
# Linux/macOS
chmod +x deploy.sh
./deploy.sh "初始部署"

# Windows
.\deploy.ps1 -CommitMessage "初始部署"
```

### 测试
```bash
# Linux/macOS
chmod +x test-workflow.sh
./test-workflow.sh https://your-app.railway.app

# Windows
.\test-workflow.ps1 -RailwayUrl "https://your-app.railway.app"
```

### API 测试
```bash
# 1. 提交任务
curl -X POST https://your-app.railway.app/render \
  -H "Content-Type: application/json" \
  -d @test-10-segments.json

# 2. 查询状态
curl https://your-app.railway.app/render/{taskId}

# 3. 下载视频
curl -O https://your-app.railway.app/output/test-10-segments.mp4
```

---

## 🎨 质量预设

### 极限内存（10+ 片段）⭐ 默认
```json
{ "scale": 0.2, "crf": 40 }
```

### 超低内存（5-8 片段）
```json
{ "scale": 0.25, "crf": 38 }
```

### 低内存（3-5 片段）
```json
{ "scale": 0.3, "crf": 35 }
```

---

## 📚 文档快速导航

| 文档 | 用途 | 时间 |
|------|------|------|
| [START-HERE.md](START-HERE.md) | 项目总览 | 5min |
| [QUICK-TEST.md](QUICK-TEST.md) | 快速测试 | 5min |
| [MEMORY-OPTIMIZATION.md](MEMORY-OPTIMIZATION.md) | 内存优化 | 15min |
| [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md) | 部署清单 | 10min |
| [N8N-READY.md](N8N-READY.md) | n8n 集成 | 15min |

---

## 🔧 关键文件位置

```
项目根目录/
├── Dockerfile              ← Node.js 内存配置
├── server/index.js         ← 渲染配置和 API
├── src/Video.tsx           ← 视频模板
├── test-10-segments.json   ← 测试数据
├── test-workflow.sh/.ps1   ← 自动化测试
└── deploy.sh/.ps1          ← 一键部署
```

---

## 📊 性能基准

```
片段数 │ 渲染时间 │ 内存 │ 状态
───────┼──────────┼──────┼─────
  3    │  ~2min   │ 350MB│  ✅
  5    │  ~4min   │ 400MB│  ✅
 10    │  ~8min   │ 450MB│  ✅  ← 目标
 15    │ ~12min   │ 480MB│  ⚠️
 20    │   N/A    │ >512 │  ❌
```

---

## 🚨 故障排查速查

### OOM (内存溢出)
```json
{ "scale": 0.15, "crf": 45 }
```

### 渲染超时
- 减少片段数
- 拆分为多个任务

### 质量太差
```json
{ "scale": 0.3, "crf": 35 }
```
（但片段数需 ≤5）

---

## ✅ 成功检查

- [ ] Railway 状态: Running
- [ ] API 返回 JSON
- [ ] 10 片段渲染成功
- [ ] 内存 <500MB
- [ ] 时间 <10min
- [ ] 视频可下载

---

## 🔗 重要链接

- **Railway**: https://railway.app/
- **Remotion**: https://www.remotion.dev/docs
- **n8n**: https://docs.n8n.io/

---

**版本**: v2.0.0  
**日期**: 2025-10-26  
**状态**: ✅ 生产就绪

