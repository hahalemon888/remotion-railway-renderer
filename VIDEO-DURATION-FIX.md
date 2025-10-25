# 🎬 视频时长问题修复说明

> **问题**: 10个片段的视频总时长只有5秒，而不是预期的50秒  
> **原因**: `durationInFrames` 被硬编码为150帧，导致每个片段只有0.5秒  
> **解决**: 使用 `calculateMetadata` 动态计算总时长

---

## 🐛 问题分析

### 问题现象
```
期望结果:
- 10个片段 × 5秒/片段 = 50秒总时长
- 每个片段完整播放5秒

实际结果:
- 10个片段一闪而过 = 5秒总时长 ❌
- 每个片段只有0.5秒（150帧 ÷ 10片段 ÷ 30fps）
```

### 根本原因

#### 之前的代码逻辑（错误）

**1. Root.tsx 硬编码总时长**
```typescript
// ❌ 错误：无论有多少片段，总时长都是150帧（5秒）
<Composition
  id="MyVideo"
  durationInFrames={150}  // 固定值
  // ...
/>
```

**2. ComplexVideo.tsx 平均分配帧数**
```typescript
// ❌ 错误：将固定的150帧平均分给所有片段
const framesPerSegment = Math.floor(150 / segments.length);

// 当有10个片段时：
// framesPerSegment = 150 ÷ 10 = 15帧
// 每个片段时长 = 15帧 ÷ 30fps = 0.5秒 ❌
```

---

## ✅ 解决方案

### 核心思路
**让总时长根据片段数量动态计算，每个片段固定5秒（150帧）**

```
总时长 = 片段数量 × 每片段帧数
       = 10 × 150帧
       = 1500帧
       = 50秒（@ 30fps）✅
```

---

## 🛠️ 代码修改

### 1️⃣ Root.tsx - 添加 `calculateMetadata`

**修改位置**: `src/Root.tsx`

```typescript
<Composition
  id="MyVideo"
  component={ComplexVideo}
  durationInFrames={150}  // 默认值（用于无片段时）
  fps={30}
  width={1080}
  height={1920}
  defaultProps={{
    backgroundMusic: [],
    segments: []
  }}
  // ⭐ 新增：动态计算总时长
  calculateMetadata={({ props }) => {
    // 每个片段150帧（5秒 @ 30fps）
    const segmentCount = props.segments?.length || 1;
    const framesPerSegment = 150;
    const totalDuration = segmentCount * framesPerSegment;
    
    return {
      durationInFrames: totalDuration,  // 动态计算
      fps: 30,
      width: 1080,
      height: 1920,
    };
  }}
/>
```

**工作原理**:
- `calculateMetadata` 在渲染前执行
- 根据实际的 `props.segments` 数量计算总帧数
- 覆盖默认的 `durationInFrames: 150`

---

### 2️⃣ ComplexVideo.tsx - 固定每片段时长

**修改位置**: `src/ComplexVideo.tsx`

```typescript
// ❌ 修改前：平均分配（错误）
const framesPerSegment = Math.floor(durationInFrames / segments.length);

// ✅ 修改后：固定每片段150帧（5秒）
const framesPerSegment = 150;
```

**为什么这样改？**
- 之前的逻辑：将总帧数平均分给所有片段
- 现在的逻辑：每个片段固定5秒，总时长由片段数决定
- 配合 `calculateMetadata`，总时长会自动调整

---

### 3️⃣ server/index.js - 无需修改 ✅

**检查结果**: 
- ✅ 未覆盖 `durationInFrames`
- ✅ `calculateMetadata` 会自动生效
- ✅ 渲染器会使用动态计算的时长

---

## 📊 修复前后对比

### 修复前（错误）

| 片段数 | 总帧数 | 每片段帧数 | 每片段时长 | 总时长 |
|--------|--------|-----------|-----------|--------|
| 3 | 150 | 50帧 | 1.67秒 | 5秒 ❌ |
| 5 | 150 | 30帧 | 1秒 | 5秒 ❌ |
| 10 | 150 | 15帧 | **0.5秒** | **5秒** ❌ |
| 15 | 150 | 10帧 | 0.33秒 | 5秒 ❌ |

> ❌ **问题**: 无论多少片段，总时长都是5秒，导致片段数越多，每个片段越短

---

### 修复后（正确）✅

| 片段数 | 总帧数 | 每片段帧数 | 每片段时长 | 总时长 |
|--------|--------|-----------|-----------|--------|
| 3 | **450** | 150帧 | **5秒** | **15秒** ✅ |
| 5 | **750** | 150帧 | **5秒** | **25秒** ✅ |
| 10 | **1500** | 150帧 | **5秒** | **50秒** ✅ |
| 15 | **2250** | 150帧 | **5秒** | **75秒** ✅ |

> ✅ **正确**: 每个片段固定5秒，总时长随片段数增加

---

## 🎯 验证方法

### 方法1：检查渲染日志

查看 Railway 日志中的输出：

```bash
[taskId] 🎬 获取视频组合信息...
Composition: MyVideo
- Width: 1080
- Height: 1920
- FPS: 30
- Duration: 1500 frames  # ⭐ 应该是 片段数 × 150
- Duration (seconds): 50s  # ⭐ 应该是 片段数 × 5
```

### 方法2：播放生成的视频

下载视频后检查：
- ✅ 总时长应该是 `片段数 × 5秒`
- ✅ 每个片段应该完整播放5秒
- ✅ 片段之间平滑过渡（无闪烁）

### 方法3：使用 ffprobe 检查

```bash
ffprobe -i output.mp4 -show_format -v quiet | grep duration

# 期望输出（10片段）:
# duration=50.000000
```

---

## 🧪 测试场景

### 测试1：3个片段（基准测试）
```json
{
  "compositionId": "MyVideo",
  "inputProps": {
    "segments": [
      {"backgroundImages": ["https://video1.mp4"]},
      {"backgroundImages": ["https://video2.mp4"]},
      {"backgroundImages": ["https://video3.mp4"]}
    ]
  }
}
```
**期望结果**: 总时长 15秒（3 × 5秒）

---

### 测试2：10个片段（你的场景）
```json
{
  "compositionId": "MyVideo",
  "inputProps": {
    "segments": [
      {"backgroundImages": ["https://video1.mp4"]},
      {"backgroundImages": ["https://video2.mp4"]},
      // ... 共10个
    ]
  }
}
```
**期望结果**: 总时长 50秒（10 × 5秒）✅

---

### 测试3：1个片段（边界测试）
```json
{
  "compositionId": "MyVideo",
  "inputProps": {
    "segments": [
      {"backgroundImages": ["https://video1.mp4"]}
    ]
  }
}
```
**期望结果**: 总时长 5秒（1 × 5秒）

---

## 📝 配置说明

### 调整每片段时长

如果你想改变每个片段的时长（比如改为3秒或10秒），只需修改两处：

#### 1. Root.tsx
```typescript
calculateMetadata={({ props }) => {
  const segmentCount = props.segments?.length || 1;
  const framesPerSegment = 90;  // ⬅️ 改为90帧（3秒 @ 30fps）
  const totalDuration = segmentCount * framesPerSegment;
  // ...
}}
```

#### 2. ComplexVideo.tsx
```typescript
const framesPerSegment = 90;  // ⬅️ 改为90帧（3秒）
```

**重要**: 两处的值必须一致！

---

## 🔢 帧数计算参考表

| 时长 | 帧数 (30fps) | 帧数 (60fps) |
|------|-------------|-------------|
| 1秒 | 30帧 | 60帧 |
| 3秒 | 90帧 | 180帧 |
| **5秒** | **150帧** | **300帧** |
| 10秒 | 300帧 | 600帧 |
| 15秒 | 450帧 | 900帧 |

当前配置: **5秒/片段 @ 30fps = 150帧**

---

## ⚠️ 注意事项

### 1. 超时配置可能需要调整

如果片段数很多（>15个），总时长可能超过30分钟的超时限制：

```
15片段 × 5秒 = 75秒视频
渲染时间 ≈ 75秒 × 15倍 = 18.75分钟（在30分钟内）✅

20片段 × 5秒 = 100秒视频
渲染时间 ≈ 100秒 × 15倍 = 25分钟（在30分钟内）✅

25片段 × 5秒 = 125秒视频
渲染时间 ≈ 125秒 × 15倍 = 31.25分钟（可能超时）⚠️
```

**如果片段数 > 20**，建议升级到**方案A**（40分钟超时）

---

### 2. 内存使用会增加

更长的视频 = 更多内存占用：

```
5秒视频 ≈ 50MB 内存
50秒视频 ≈ 200MB 内存（当前配置）
75秒视频 ≈ 300MB 内存
```

如果遇到内存问题，可以：
- 降低分辨率: `scale: 0.4`（当前是0.5）
- 增加 CRF: `crf: 32`（当前是30）
- 使用 Railway 的更大内存实例

---

### 3. 每个片段的背景视频不会自动循环

如果背景视频本身时长 < 5秒，会出现黑屏：

```typescript
// 背景视频: 3秒
// 片段时长: 5秒
// 结果: 前3秒有画面，后2秒黑屏 ⚠️
```

**解决方案**: 
- 确保背景视频时长 ≥ 5秒
- 或者在 `OffthreadVideo` 添加 `loop={true}` 属性

---

## 🚀 部署步骤

### 1. 提交代码
```bash
git add src/Root.tsx src/ComplexVideo.tsx
git commit -m "修复视频时长问题：动态计算总时长，每片段5秒"
git push origin main
```

### 2. 等待 Railway 部署
- 预计 5-7 分钟
- 查看 Railway Dashboard 确认部署成功

### 3. 测试验证
使用之前的10片段视频再测试一次：
- ✅ 总时长应该是 **50秒**（而不是5秒）
- ✅ 每个片段应该播放 **5秒**（而不是0.5秒）

---

## 📊 预期渲染时间（修复后）

| 片段数 | 视频时长 | 预计渲染时间 | 超时配置 | 状态 |
|--------|---------|-------------|---------|------|
| 3 | 15秒 | 4-5分钟 | 30分钟 | ✅ |
| 5 | 25秒 | 7-8分钟 | 30分钟 | ✅ |
| **10** | **50秒** | **12-15分钟** | **30分钟** | ✅ |
| 15 | 75秒 | 18-22分钟 | 30分钟 | ✅ |
| 20 | 100秒 | 25-30分钟 | 30分钟 | ⚠️ 接近极限 |

---

## 💡 技术细节

### calculateMetadata 的工作原理

`calculateMetadata` 是 Remotion 的一个特殊函数，在渲染前执行：

```typescript
// 执行流程：
1. n8n 发送请求 → server/index.js
2. server.js 调用 selectComposition({ inputProps })
3. Remotion 执行 calculateMetadata({ props })
   └── props = inputProps（来自 n8n）
4. calculateMetadata 返回新的配置
   └── durationInFrames: 1500（覆盖默认的150）
5. 使用新配置渲染视频
```

**优势**：
- ✅ 完全动态，不需要手动计算
- ✅ 基于实际数据（segments 数量）
- ✅ 无需修改 server.js

---

## 🎉 总结

### 问题根源
- ❌ 总帧数被硬编码为150（5秒）
- ❌ 片段数增加时，每个片段被压缩

### 解决方案
- ✅ 使用 `calculateMetadata` 动态计算总帧数
- ✅ 每个片段固定150帧（5秒）
- ✅ 总时长 = 片段数 × 5秒

### 修改文件
- ✅ `src/Root.tsx` - 添加 calculateMetadata
- ✅ `src/ComplexVideo.tsx` - 固定 framesPerSegment = 150
- ✅ `server/index.js` - 无需修改（已正确）

### 下一步
- ⏳ 部署到 Railway
- ⏳ 重新测试10片段视频
- ⏳ 验证总时长为50秒

---

**修复完成！现在每个片段都会完整播放5秒了** 🎬✨

