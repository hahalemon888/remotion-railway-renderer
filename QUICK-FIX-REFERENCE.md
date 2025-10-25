# ⚡ 超时问题快速修复参考卡

## 🔴 问题
```
错误: "Tried to download file ..., but the server sent no data for 20 seconds"
```

## ✅ 解决方案
将资源下载超时从 **20秒** 增加到 **180秒**

---

## 📝 修改的 3 个文件

### 1️⃣ `remotion.config.ts`
```typescript
Config.setDelayRenderTimeoutInMilliseconds(180000);  // 关键！
Config.setTimeoutInMilliseconds(1800000);
Config.setOffthreadVideoCacheSizeInBytes(512 * 1024 * 1024);
Config.setConcurrency(1);
```

### 2️⃣ `server/index.js`
```javascript
await renderMedia({
  delayRenderTimeoutInMilliseconds: 180000,  // 关键！
  timeoutInMilliseconds: 1800000,
  offthreadVideoCacheSizeInBytes: 512 * 1024 * 1024,
  chromiumOptions: {
    timeout: 180000,
  },
});
```

### 3️⃣ `src/ComplexVideo.tsx`
```typescript
<OffthreadVideo delayRenderTimeoutInMilliseconds={180000} />
<Img delayRenderTimeoutInMilliseconds={180000} />
<Audio delayRenderTimeoutInMilliseconds={180000} />
```

---

## 🎯 核心配置

| 配置项 | 值 | 说明 |
|-------|-----|------|
| **delayRenderTimeoutInMilliseconds** | 180000 | 单个资源下载超时（3分钟）⭐ |
| **timeoutInMilliseconds** | 1800000 | 整体渲染超时（30分钟） |
| **offthreadVideoCacheSizeInBytes** | 536870912 | 视频缓存大小（512MB） |
| **chromiumOptions.timeout** | 180000 | Puppeteer 超时（3分钟） |

---

## 🧪 测试命令

```bash
# 1. 提交渲染任务
curl -X POST http://localhost:3000/render \
  -H "Content-Type: application/json" \
  -d '{
    "compositionId": "ComplexVideo",
    "inputProps": {
      "segments": [{
        "backgroundImages": ["https://your-video.mp4"]
      }]
    }
  }'

# 返回: { "taskId": "xxx-xxx-xxx" }

# 2. 查询任务状态
curl http://localhost:3000/render/xxx-xxx-xxx

# 3. 下载视频（任务完成后）
curl -O http://localhost:3000/output/video.mp4
```

---

## ✅ 验证清单

- ✅ 不再出现 "20 seconds" 错误
- ✅ 视频下载时间 < 3分钟
- ✅ 整体渲染时间 < 30分钟
- ✅ 内存使用 < 512MB
- ✅ 渲染成功完成

---

## 🚨 如果还是超时

### 检查项
1. 视频 URL 是否可访问？
   ```bash
   curl -I https://your-video-url.mp4
   ```

2. 视频大小是否过大？
   ```bash
   curl -sI URL | grep -i content-length
   ```

3. 网络速度是否太慢？
   ```bash
   curl -o /dev/null -w "%{speed_download}" URL
   ```

### 临时增加超时
如果网络确实很慢，可以临时增加到 **300秒**（5分钟）：
```typescript
delayRenderTimeoutInMilliseconds: 300000
```

---

**创建时间**: 2025-10-25  
**配置版本**: v3.0

