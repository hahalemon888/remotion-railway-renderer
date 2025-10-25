# 🚀 Railway 低内存渲染优化指南

## 问题说明

Railway 免费套餐只提供 **512MB RAM**，这对于视频渲染来说非常有限。当渲染 1920x1080 的高清视频时，会因为内存不足而被系统杀死（SIGKILL 错误）。

## 解决方案

我们添加了 **分辨率缩放** 和 **质量控制** 功能，可以大幅降低内存使用。

---

## 📐 渲染选项说明

### 1. `scale` - 分辨率缩放比例

控制输出视频的分辨率，范围 `0.1` - `1.0`

| 值 | 说明 | 示例（原始 1920x1080） | 内存使用 |
|---|---|---|---|
| `0.5` | 50% 分辨率（默认） | 960x540 | 🟢 低 (~200MB) |
| `0.75` | 75% 分辨率 | 1440x810 | 🟡 中 (~400MB) |
| `1.0` | 100% 原始分辨率 | 1920x1080 | 🔴 高 (~800MB+) |

### 2. `crf` - 视频质量参数

CRF (Constant Rate Factor) 控制视频质量，范围 `0` - `51`

| 值 | 说明 | 文件大小 | 质量 |
|---|---|---|---|
| `30` | 低质量（默认） | 小 | 可接受 |
| `25` | 中等质量 | 中 | 良好 |
| `20` | 高质量 | 大 | 优秀 |
| `18` | 视觉无损 | 很大 | 极佳 |

> **注意**: CRF 值越高，质量越低，但文件越小，内存使用也越少

---

## 🎯 推荐配置

### 配置 1: 低内存模式（默认）✅
**适合**: Railway 免费套餐 (512MB RAM)

```json
{
  "renderOptions": {
    "scale": 0.5,
    "crf": 30
  }
}
```

- **输出分辨率**: 960x540 (原始 1920x1080)
- **内存使用**: ~200MB
- **质量**: 可接受（适合社交媒体预览）
- **成功率**: 🟢 高

### 配置 2: 平衡模式
**适合**: Railway Hobby Plan (8GB RAM) 或更高

```json
{
  "renderOptions": {
    "scale": 0.75,
    "crf": 25
  }
}
```

- **输出分辨率**: 1440x810
- **内存使用**: ~400MB
- **质量**: 良好
- **成功率**: 🟡 中等（需要升级套餐）

### 配置 3: 高质量模式
**适合**: 2GB+ RAM 的服务器

```json
{
  "renderOptions": {
    "scale": 1.0,
    "crf": 20
  }
}
```

- **输出分辨率**: 1920x1080（原始）
- **内存使用**: ~800MB+
- **质量**: 优秀
- **成功率**: 🔴 低（Railway 免费套餐会失败）

---

## 🔧 使用方法

### 方法 1: 直接 API 调用

```bash
curl -X POST https://your-app.railway.app/render \
  -H "Content-Type: application/json" \
  -d '{
    "compositionId": "MyVideo",
    "inputProps": {
      "segments": [...]
    },
    "outputFileName": "my-video.mp4",
    "renderOptions": {
      "scale": 0.5,
      "crf": 30
    }
  }'
```

### 方法 2: n8n 工作流

在 n8n 的 "提交渲染任务" 节点中，添加 `renderOptions` 参数：

```json
{
  "compositionId": "MyVideo",
  "inputProps": { ... },
  "outputFileName": "video.mp4",
  "renderOptions": {
    "scale": 0.5,
    "crf": 30
  }
}
```

或者使用表达式动态设置：

```javascript
{
  "renderOptions": {
    "scale": {{ $json.scale || 0.5 }},
    "crf": {{ $json.crf || 30 }}
  }
}
```

---

## 📊 内存使用对比

| 配置 | 分辨率 | 内存峰值 | Railway 免费套餐 |
|---|---|---|---|
| scale=0.5, crf=30 | 960x540 | ~200MB | ✅ 可用 |
| scale=0.75, crf=25 | 1440x810 | ~400MB | ⚠️ 边缘 |
| scale=1.0, crf=20 | 1920x1080 | ~800MB | ❌ 失败 |

---

## 🐛 故障排除

### 问题 1: 仍然出现 SIGKILL 错误

**解决方案**:
1. 降低 `scale` 到 `0.4` 或 `0.3`
2. 提高 `crf` 到 `32` 或 `35`
3. 考虑升级到 Railway Hobby Plan ($5/月)

### 问题 2: 视频质量太差

**解决方案**:
1. 提高 `scale` 到 `0.6` 或 `0.75`
2. 降低 `crf` 到 `25` 或 `28`
3. 如果内存不足，需要升级服务器

### 问题 3: 渲染时间太长

**原因**: 我们使用了 `ultrafast` 预设和低线程数来节省内存

**解决方案**:
- 这是内存优化的代价
- 升级服务器后可以获得更快的渲染速度

---

## 💡 最佳实践

1. **开发测试**: 使用 `scale=0.3, crf=35` 快速测试
2. **预览版本**: 使用 `scale=0.5, crf=30` (默认)
3. **最终版本**: 升级服务器后使用 `scale=1.0, crf=20`

4. **视频时长建议**:
   - 免费套餐: ≤ 30 秒
   - Hobby Plan: ≤ 2 分钟
   - Pro Plan: ≤ 5 分钟

---

## 🚀 升级建议

如果你需要高质量视频渲染，建议升级到：

### Railway Hobby Plan
- **价格**: $5/月
- **内存**: 8GB RAM
- **适合**: 中小型项目
- **可渲染**: 1080p 视频，2-3 分钟

### Railway Pro Plan
- **价格**: $20/月
- **内存**: 32GB RAM
- **适合**: 商业项目
- **可渲染**: 4K 视频，10+ 分钟

---

## 📝 测试命令

测试不同配置的内存使用：

```bash
# 低内存模式
curl -X POST https://your-app.railway.app/render \
  -H "Content-Type: application/json" \
  -d '{"compositionId":"MyVideo","inputProps":{},"renderOptions":{"scale":0.5,"crf":30}}'

# 平衡模式
curl -X POST https://your-app.railway.app/render \
  -H "Content-Type: application/json" \
  -d '{"compositionId":"MyVideo","inputProps":{},"renderOptions":{"scale":0.75,"crf":25}}'

# 高质量模式
curl -X POST https://your-app.railway.app/render \
  -H "Content-Type: application/json" \
  -d '{"compositionId":"MyVideo","inputProps":{},"renderOptions":{"scale":1.0,"crf":20}}'
```

---

## 🎓 技术细节

我们的优化包括：

1. **分辨率缩放**: 使用 Remotion 的 `scale` 参数
2. **FFmpeg 优化**:
   - `-preset ultrafast`: 最快编码速度
   - `-threads 2`: 限制线程数
   - `-bufsize 1M`: 限制缓冲区
   - `-maxrate 2M`: 限制比特率
3. **Chromium 优化**:
   - `--single-process`: 单进程模式
   - `--disable-gpu`: 禁用 GPU
   - `--disable-dev-shm-usage`: 减少共享内存使用
4. **Node.js 优化**:
   - `--max-old-space-size=1024`: 限制堆内存
   - `concurrency: 1`: 单线程渲染

---

## 📞 需要帮助？

如果遇到问题，请检查：
1. Railway 日志中的内存使用情况
2. 渲染进度是否卡在某个百分比
3. 是否出现 SIGKILL 错误

记住：**降低分辨率是在免费套餐上成功渲染的关键！** 🎯

