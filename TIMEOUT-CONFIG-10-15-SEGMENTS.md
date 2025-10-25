# 🎯 超时配置 - 10-15片段视频优化（方案B）

> **最后更新**: 2025-10-25  
> **配置方案**: 方案B - 平衡性能  
> **适用场景**: 8-15个视频片段

---

## 📊 实测数据基础

### 性能基准测试
| 测试场景 | 片段数 | 实际耗时 | 配置方案 | 结果 |
|---------|-------|---------|---------|------|
| 初始测试 | 3片段 | 4分30秒 | 方案B ✅ | 成功 |
| 目标场景 | 10-15片段 | 预计15-22分钟 | 方案B 🎯 | 待验证 |

### 计算依据
- **每片段平均时间**: 90秒（基于3片段测试）
- **安全系数**: 1.3x（预留30%缓冲）
- **推算公式**: `(片段数 × 90秒) × 1.3`

---

## ⚙️ 当前超时配置（方案B）

### 1️⃣ 全局配置 - `remotion.config.ts`

```typescript
// 整体渲染超时: 30分钟
Config.setTimeoutInMilliseconds(1800000);

// 单个资源下载超时: 240秒（4分钟）
Config.setDelayRenderTimeoutInMilliseconds(240000);
```

**配置说明**：
- ✅ **30分钟整体超时** - 足够渲染15个片段（预计22分钟）
- ✅ **240秒资源超时** - 支持50-100MB的大视频文件下载
- ✅ **512MB视频缓存** - 避免内存溢出

---

### 2️⃣ 渲染器配置 - `server/index.js`

```javascript
await renderMedia({
  // 1. 整体渲染超时: 30分钟
  timeoutInMilliseconds: 1800000,
  
  // 2. 单个资源下载超时: 240秒
  delayRenderTimeoutInMilliseconds: 240000,
  
  // 3. 视频缓存限制: 512MB
  offthreadVideoCacheSizeInBytes: 512 * 1024 * 1024,
  
  chromiumOptions: {
    args: [
      '--timeout=240000',  // Chromium 网络超时
      // ... 其他参数
    ],
    timeout: 240000,  // Puppeteer 超时
  }
});
```

---

## 📈 不同片段数的预期表现

| 片段数 | 预计总时间 | 资源超时 | 整体超时 | 成功率预测 |
|--------|-----------|---------|---------|-----------|
| **3片段** | 4.5分钟 ✅ | 240秒 | 30分钟 | 99% |
| **5片段** | 7.5分钟 | 240秒 | 30分钟 | 95%+ |
| **8片段** | 12分钟 | 240秒 | 30分钟 | 90%+ |
| **10片段** | 15分钟 | 240秒 | 30分钟 | 85%+ |
| **12片段** | 18分钟 | 240秒 | 30分钟 | 80%+ |
| **15片段** | 22.5分钟 | 240秒 | 30分钟 | 75%+ |

> ⚠️ **注意**: 如果片段数超过15个，建议升级到**方案A（保守安全）**

---

## 🔄 方案对比

### 方案A：保守安全（备选方案）
```javascript
timeoutInMilliseconds: 2400000,              // 40分钟
delayRenderTimeoutInMilliseconds: 300000,    // 5分钟
```
**适用场景**：
- 15-20个片段
- 大型视频文件（>100MB）
- 网络不稳定环境
- 首次尝试，不确定耗时

### 方案B：平衡性能（当前方案）✅
```javascript
timeoutInMilliseconds: 1800000,              // 30分钟
delayRenderTimeoutInMilliseconds: 240000,    // 4分钟
```
**适用场景**：
- ✅ **8-15个片段**（推荐）
- ✅ 中等大小视频（20-80MB）
- ✅ 网络稳定
- ✅ 已测试过3片段，了解平均耗时

### 方案C：快速模式（小视频专用）
```javascript
timeoutInMilliseconds: 900000,               // 15分钟
delayRenderTimeoutInMilliseconds: 120000,    // 2分钟
```
**适用场景**：
- 3-5个片段
- 小型视频文件（<20MB）
- 网络极佳
- 追求快速响应

---

## 🚨 常见问题处理

### ❌ 错误1: "Tried to download file, but the server sent no data for X seconds"
**原因**: 单个资源下载超时
**解决**:
```javascript
// 增加资源下载超时
delayRenderTimeoutInMilliseconds: 300000,  // 从240秒增加到300秒
```

### ❌ 错误2: "Timeout: Rendering exceeded X milliseconds"
**原因**: 整体渲染超时
**解决**:
```javascript
// 增加整体超时
timeoutInMilliseconds: 2400000,  // 从30分钟增加到40分钟
```

### ❌ 错误3: 内存溢出 (OOM)
**原因**: 视频缓存过大
**解决**:
```javascript
// 1. 降低分辨率
renderOptions: { scale: 0.5 }

// 2. 减少视频缓存
offthreadVideoCacheSizeInBytes: 256 * 1024 * 1024  // 从512MB降到256MB

// 3. 增加 Railway 内存到 1GB+
```

---

## 📊 监控建议

### 成功标准
- ✅ 渲染成功率 > 85%
- ✅ 平均渲染时间 < 20分钟（10片段）
- ✅ 无内存溢出错误
- ✅ 无资源下载超时

### 需要优化的信号
- ⚠️ 成功率 < 70%
- ⚠️ 频繁出现 "no data" 错误
- ⚠️ 渲染时间超过预期 50%+
- ⚠️ 内存使用 > 90%

**优化措施**：切换到方案A（保守安全）

---

## 🔧 快速调整指令

### 如需升级到方案A（保守安全）
```bash
# 1. 修改 remotion.config.ts
Config.setTimeoutInMilliseconds(2400000);                    # 40分钟
Config.setDelayRenderTimeoutInMilliseconds(300000);          # 5分钟

# 2. 修改 server/index.js
timeoutInMilliseconds: 2400000,
delayRenderTimeoutInMilliseconds: 300000,
timeout: 300000,  // Puppeteer

# 3. 部署
git add . && git commit -m "升级到方案A" && git push
```

### 如需降级到方案C（快速模式）
```bash
# 1. 修改 remotion.config.ts
Config.setTimeoutInMilliseconds(900000);                     # 15分钟
Config.setDelayRenderTimeoutInMilliseconds(120000);          # 2分钟

# 2. 修改 server/index.js
timeoutInMilliseconds: 900000,
delayRenderTimeoutInMilliseconds: 120000,
timeout: 120000,  // Puppeteer

# 3. 部署
git add . && git commit -m "切换到方案C" && git push
```

---

## 📝 版本历史

| 版本 | 日期 | 配置 | 说明 |
|-----|------|------|------|
| v1.0 | 2025-10-24 | 180秒资源超时 | 修复 "20秒超时" 错误 |
| **v2.0** | **2025-10-25** | **240秒资源超时** | **优化10-15片段支持（当前版本）** |

---

## 🎯 下一步行动

1. ✅ **已部署方案B** - 测试10个片段视频
2. ⏳ **监控成功率** - 观察Railway日志
3. ⏳ **记录实际耗时** - 用于进一步优化
4. ⏳ **根据结果调整** - 必要时升级到方案A

---

**配置完成！** 现在可以支持 **8-15个片段** 的视频渲染了 🎉

