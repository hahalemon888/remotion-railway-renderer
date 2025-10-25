# 🔥 Remotion 超时配置完整指南

## 问题诊断
**错误信息**: `"Tried to download file ..., but the server sent no data for 20 seconds"`

**根本原因**: Remotion 默认的资源下载超时时间是 **20秒**，对于慢速网络或大文件下载不够用。

---

## ✅ 已修复的所有超时设置

### 1️⃣ **全局配置** (`remotion.config.ts`)
```typescript
// 整体渲染超时: 30分钟
Config.setTimeoutInMilliseconds(1800000);

// 单个资源下载超时: 180秒（3分钟）
Config.setDelayRenderTimeoutInMilliseconds(180000);

// 并发渲染: 单线程（节省内存）
Config.setConcurrency(1);

// 视频缓存大小: 512MB
Config.setOffthreadVideoCacheSizeInBytes(512 * 1024 * 1024);
```

### 2️⃣ **服务器端渲染配置** (`server/index.js`)
```javascript
await renderMedia({
  // 1. 整体渲染超时: 30分钟
  timeoutInMilliseconds: 1800000,
  
  // 2. 单个资源下载超时: 180秒（关键！）
  delayRenderTimeoutInMilliseconds: 180000,
  
  // 3. 视频缓存大小: 512MB
  offthreadVideoCacheSizeInBytes: 512 * 1024 * 1024,
  
  chromiumOptions: {
    // 4. Puppeteer 超时: 180秒
    timeout: 180000,
    args: [
      // ... Chromium 启动参数
      '--timeout=180000',
      '--disable-hang-monitor',
    ],
  },
});
```

### 3️⃣ **组件级别配置** (`src/ComplexVideo.tsx`)
```typescript
// OffthreadVideo 组件
<OffthreadVideo
  src={url}
  delayRenderTimeoutInMilliseconds={180000}  // 3分钟
/>

// Img 组件
<Img
  src={url}
  delayRenderTimeoutInMilliseconds={180000}  // 3分钟
/>

// Audio 组件
<Audio
  src={url}
  delayRenderTimeoutInMilliseconds={180000}  // 3分钟
/>
```

---

## 📊 超时配置层级

| 层级 | 配置位置 | 作用范围 | 优先级 |
|-----|---------|---------|-------|
| **全局** | `remotion.config.ts` | 所有渲染 | 低 |
| **服务器** | `server/index.js` renderMedia() | 服务器端渲染 | 中 |
| **组件** | `src/ComplexVideo.tsx` 各组件 | 单个资源 | 高 |

**原则**: 组件级别 > 服务器级别 > 全局级别

---

## 🎯 配置说明

### 为什么是 180 秒？
- **20秒（默认）**: 太短，慢速网络必定失败 ❌
- **60秒**: 可能仍然不够 ⚠️
- **180秒（3分钟）**: 适合大多数情况 ✅
- **900秒（15分钟）**: 过长，可能掩盖真正的错误 ⚠️

### 为什么整体渲染是 30 分钟？
- 15个视频片段 × 每个最多2分钟下载 = 30分钟
- 留有余量，避免临界超时

### 为什么限制视频缓存为 512MB？
- Railway 免费版内存限制: 512MB
- 避免内存溢出（OOM）导致渲染失败

---

## 🚀 测试建议

### 1. 快速测试（1个片段）
```json
{
  "segments": [
    {
      "backgroundImages": ["https://...video1.mp4"]
    }
  ]
}
```
**预期**: 3分钟内完成

### 2. 中等测试（3个片段）
```json
{
  "segments": [
    { "backgroundImages": ["https://...video1.mp4"] },
    { "backgroundImages": ["https://...video2.mp4"] },
    { "backgroundImages": ["https://...video3.mp4"] }
  ]
}
```
**预期**: 10分钟内完成

### 3. 完整测试（15个片段）
```json
{
  "segments": [ /* 15个片段 */ ]
}
```
**预期**: 30分钟内完成

---

## 🔧 如果仍然超时怎么办？

### 方案 A: 增加超时时间（不推荐）
```typescript
// 改为 5 分钟
delayRenderTimeoutInMilliseconds: 300000
```

### 方案 B: 检查网络问题
1. 检查视频 URL 是否可访问
2. 测试下载速度: `curl -O <video_url>`
3. 确认 URL 没有过期

### 方案 C: 优化视频源
1. 使用 CDN 加速
2. 压缩视频文件大小
3. 使用更稳定的存储服务

### 方案 D: 预下载视频（最佳）
```javascript
// 在渲染前先下载所有视频到本地
const localPath = await downloadVideo(remoteUrl);
// 然后使用本地路径渲染
```

---

## 📝 配置清单

- ✅ `remotion.config.ts` - 全局超时 30分钟
- ✅ `remotion.config.ts` - 资源下载 180秒
- ✅ `server/index.js` - renderMedia 超时 30分钟
- ✅ `server/index.js` - delayRender 超时 180秒
- ✅ `server/index.js` - Puppeteer 超时 180秒
- ✅ `server/index.js` - 视频缓存 512MB
- ✅ `src/ComplexVideo.tsx` - OffthreadVideo 超时 180秒
- ✅ `src/ComplexVideo.tsx` - Img 超时 180秒
- ✅ `src/ComplexVideo.tsx` - Audio 超时 180秒

---

## 💡 最佳实践

1. **分段测试**: 先测试1个片段，再逐步增加
2. **监控日志**: 观察哪个片段下载慢
3. **设置合理**: 不要设置过长的超时（会掩盖问题）
4. **网络优化**: 使用稳定的 CDN 和压缩的视频
5. **错误重试**: 超时后自动重试 2-3 次

---

**修改完成时间**: 2025-10-25  
**配置版本**: v3.0 - 完整超时配置

