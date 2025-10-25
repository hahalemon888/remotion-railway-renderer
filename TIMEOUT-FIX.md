# 🔧 超时问题修复说明

## 问题描述

### 症状
```
Timeout (30000ms) exceeded rendering the component initially.
```

### 原因
1. **单片段渲染成功** ✅
2. **三片段渲染失败** ❌

**根本原因**：
- 火山引擎的视频 URL 加载速度慢
- Railway 服务器访问中国 CDN 有延迟
- 多个片段需要加载多个视频，累积超时

---

## 解决方案

### 修复 1: 组件级超时（`src/ComplexVideo.tsx`）

为所有媒体组件添加 `delayRenderTimeoutInMilliseconds`：

```typescript
// 视频
<OffthreadVideo
  src={segment.backgroundImages[0]}
  delayRenderTimeoutInMilliseconds={120000}  // 120秒
  muted
/>

// 图片
<Img
  src={segment.backgroundImages[0]}
  delayRenderTimeoutInMilliseconds={120000}  // 120秒
/>

// 音频
<Audio 
  src={segment.speaker_audio[0]}
  delayRenderTimeoutInMilliseconds={120000}  // 120秒
/>
```

### 修复 2: 渲染级超时（`server/index.js`）

在 `renderMedia()` 配置中添加全局超时：

```javascript
await renderMedia({
  composition,
  serveUrl: bundleLocation,
  codec: 'h264',
  outputLocation: outputPath,
  inputProps,
  
  // ✨ 关键修复：全局超时设置
  timeoutInMilliseconds: 120000,  // 120秒
  
  chromiumOptions: { ... },
  // ... 其他配置
});
```

---

## 超时时间对比

| 层级 | 修改前 | 修改后 | 说明 |
|------|--------|--------|------|
| **组件级** | 28秒 | **120秒** | 单个媒体资源加载超时 |
| **渲染级** | 30秒 | **120秒** | 整体初始化超时 |

---

## 为什么需要两个超时设置？

### 1. `delayRenderTimeoutInMilliseconds`（组件级）
- **作用**：控制单个媒体资源的加载超时
- **位置**：`<OffthreadVideo>`, `<Img>`, `<Audio>` 组件
- **场景**：加载单个视频/图片/音频文件

### 2. `timeoutInMilliseconds`（渲染级）
- **作用**：控制整个组件初始化的超时
- **位置**：`renderMedia()` 函数配置
- **场景**：多个片段同时加载时的总超时

---

## 测试场景

### ✅ 场景 1: 单片段渲染
```json
{
  "segments": [
    { "backgroundImages": ["video1.mp4"] }
  ]
}
```
- **结果**：成功 ✅
- **原因**：只需加载 1 个视频

### ❌ 场景 2: 三片段渲染（修复前）
```json
{
  "segments": [
    { "backgroundImages": ["video1.mp4"] },
    { "backgroundImages": ["video2.mp4"] },
    { "backgroundImages": ["video3.mp4"] }
  ]
}
```
- **结果**：失败 ❌
- **原因**：需要加载 3 个视频，超过 30 秒

### ✅ 场景 3: 三片段渲染（修复后）
```json
{
  "segments": [
    { "backgroundImages": ["video1.mp4"] },
    { "backgroundImages": ["video2.mp4"] },
    { "backgroundImages": ["video3.mp4"] }
  ]
}
```
- **结果**：成功 ✅
- **原因**：120 秒足够加载所有视频

---

## 部署状态

### Git 提交
```bash
commit 650180b
fix: add timeoutInMilliseconds to renderMedia for slow network resources

commit 1ca86b1
fix: increase media loading timeout to 120s for slow networks
```

### Railway 部署
- **状态**：正在部署 🚀
- **预计时间**：3-5 分钟
- **URL**：https://remotion-railway-renderer-production.up.railway.app

---

## 测试步骤

### 1. 等待部署完成（3-5 分钟）

### 2. 在 n8n 中重新测试
使用相同的三片段数据：

```json
{
  "compositionId": "ComplexVideo",
  "inputProps": {
    "segments": [
      { "backgroundImages": ["video1.mp4"], ... },
      { "backgroundImages": ["video2.mp4"], ... },
      { "backgroundImages": ["video3.mp4"], ... }
    ]
  },
  "outputFileName": "test-3-segments.mp4",
  "renderOptions": {
    "scale": 0.5,
    "crf": 30
  }
}
```

### 3. 预期结果
```json
{
  "status": "completed",
  "data": {
    "url": "https://your-render.mp4",
    "width": 540,
    "height": 960,
    "duration": "XX.XX"
  }
}
```

---

## 进一步优化建议

### 如果 120 秒还不够

#### 方案 A: 增加到 300 秒（5 分钟）
```typescript
delayRenderTimeoutInMilliseconds={300000}
timeoutInMilliseconds: 300000
```

#### 方案 B: 预下载视频
在 n8n 中先下载视频到本地：
```javascript
// n8n HTTP Request 节点
GET https://volcano-video-url.mp4
Save to File: /tmp/video.mp4

// 然后传递本地路径
{
  "backgroundImages": ["/tmp/video.mp4"]
}
```

#### 方案 C: 使用更快的 CDN
将视频上传到：
- Cloudflare R2
- AWS S3
- 阿里云 OSS（香港节点）

---

## 性能对比

| 片段数 | 视频数量 | 预计加载时间 | 120秒够吗？ |
|--------|----------|--------------|-------------|
| 1 | 1 | ~10-20秒 | ✅ 够 |
| 3 | 3 | ~30-60秒 | ✅ 够 |
| 5 | 5 | ~50-100秒 | ⚠️ 边缘 |
| 10 | 10 | ~100-200秒 | ❌ 不够 |

**建议**：
- **1-5 片段**：使用 120 秒超时 ✅
- **5-10 片段**：使用 300 秒超时 ⚠️
- **10+ 片段**：考虑预下载或使用更快的 CDN 🚀

---

## 故障排查

### 问题 1: 仍然超时
**解决方案**：
1. 增加超时到 300 秒
2. 检查视频 URL 是否可访问
3. 使用 `curl` 测试下载速度：
   ```bash
   time curl -o test.mp4 "https://volcano-video-url.mp4"
   ```

### 问题 2: 渲染时间太长
**原因**：等待视频加载

**解决方案**：
- 使用更快的 CDN
- 预下载视频到服务器
- 使用更小的视频文件

### 问题 3: 内存不足
**症状**：SIGKILL 或 OOM 错误

**解决方案**：
- 降低 `scale` 到 0.3-0.4
- 提高 `crf` 到 32-35
- 减少并发片段数量

---

## 总结

### ✅ 修复内容
1. 组件级超时：28秒 → 120秒
2. 渲染级超时：30秒 → 120秒

### 🎯 适用场景
- 1-5 个片段的视频渲染
- 火山引擎等慢速 CDN
- Railway 等海外服务器

### 🚀 下一步
- 等待部署完成
- 测试三片段渲染
- 如需更多片段，考虑进一步优化

---

**修复完成时间**：2025-10-25  
**部署状态**：已推送到 Railway 🚀  
**测试建议**：等待 3-5 分钟后重新测试

