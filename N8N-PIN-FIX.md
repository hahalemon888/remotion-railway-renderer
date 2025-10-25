# 🔧 n8n Pin 数据问题修复指南

## 🐛 问题描述

当在 n8n 中 **Pin（固定）** 一个生成多个输出项的节点后，下游节点如果使用 `$('节点名').item.json` 只能获取到**第一个输出项**，导致所有数据都使用相同的值。

### 典型场景

**工作流结构**:
```
视频生成节点 (输出 3 个不同的视频)
  ↓
合并提交参数节点
  ↓
提交渲染任务
```

**问题表现**:
- 第一次运行：3 个视频链接不同 ✅
- Pin 视频生成节点后：3 个视频链接变成相同 ❌

---

## 🔍 根本原因

### n8n 的数据流模型

```javascript
// Pin 后的节点输出（示例）
[
  { json: { video: "https://video1.mp4" } },  // Item 0
  { json: { video: "https://video2.mp4" } },  // Item 1
  { json: { video: "https://video3.mp4" } }   // Item 2
]
```

### 错误的访问方式 ❌

```javascript
// 这种方式只会获取当前正在处理的 Item
const video = $('视频生成').item.json.video;

// 当下游节点循环处理 3 次时，每次都看到的是：
// 第 1 次: Item 0 (video1.mp4)
// 第 2 次: Item 0 (video1.mp4)  ← 错误！应该是 Item 1
// 第 3 次: Item 0 (video1.mp4)  ← 错误！应该是 Item 2
```

### 正确的访问方式 ✅

```javascript
// 一次性获取所有输入项
const allItems = $input.all();

// 遍历所有项
allItems.forEach((item, index) => {
  console.log(`视频 ${index}: ${item.json.video}`);
});
```

---

## ✅ 完整解决方案

### 1. 删除旧的"合并提交参数"节点

1. 在 n8n 工作流中删除现有的合并节点
2. 添加新的 **Code** 节点
3. 命名为 "合并提交参数"

---

### 2. 配置 Code 节点

#### Mode 设置
```
Run Once for All Items
```
👆 **重要**: 必须选择此模式，否则会为每个输入项运行一次

#### JavaScript Code

```javascript
/**
 * 合并视频渲染参数
 * 
 * 输入:
 * - 上游节点: 多个视频片段数据 (3-15 个)
 * - Webhook: 基础配置数据
 * 
 * 输出:
 * - 合并后的完整渲染参数
 */

// ========== 1. 获取所有输入数据 ==========
const videoItems = $input.all();
const webhookData = $('Webhook').item.json.body.body;

console.log('=== 开始合并视频参数 ===');
console.log(`输入视频片段数量: ${videoItems.length}`);

// ========== 2. 验证数据 ==========
if (videoItems.length === 0) {
  throw new Error('❌ 错误: 没有接收到任何视频片段数据');
}

if (videoItems.length > 15) {
  console.warn(`⚠️ 警告: 视频片段数量 (${videoItems.length}) 超过推荐值 (15)，可能导致渲染超时`);
}

// ========== 3. 构建 segments 数组 ==========
const segments = videoItems.map((item, index) => {
  console.log(`处理片段 ${index + 1}/${videoItems.length}`);
  
  // 提取视频数据
  const segment = {
    cameraEffects: item.json.cameraEffects || "",
    subtitles: item.json.subtitles || [],
    backgroundImages: [],
    font_style: item.json.font_style || "white-black-outline",
    speaker_audio: item.json.speaker_audio || []
  };
  
  // 处理 backgroundImages (可能是字符串或数组)
  if (item.json.backgroundImages) {
    segment.backgroundImages = Array.isArray(item.json.backgroundImages)
      ? item.json.backgroundImages
      : [item.json.backgroundImages];
  }
  
  // 验证必要字段
  if (segment.backgroundImages.length === 0) {
    console.warn(`⚠️ 警告: 片段 ${index + 1} 没有背景视频`);
  } else {
    console.log(`  ✓ 视频链接: ${segment.backgroundImages[0].substring(0, 50)}...`);
  }
  
  return segment;
});

// ========== 4. 构建完整的渲染参数 ==========
const renderParams = {
  compositionId: "ComplexVideo",
  inputProps: {
    fields: {
      episodeNumber: webhookData.episodeNumber || 0,
      segments: segments,
      backgroundMusic: webhookData.backgroundMusic || [],
      coverImageUrl: webhookData.coverImageUrl || ""
    }
  },
  outputFileName: `${webhookData.record_id || Date.now()}.mp4`,
  renderOptions: {
    scale: 0.5,  // 50% 分辨率，节省内存
    crf: 30      // 中等质量
  }
};

// ========== 5. 输出日志 ==========
console.log('=== 参数合并完成 ===');
console.log(`总片段数: ${segments.length}`);
console.log(`输出文件: ${renderParams.outputFileName}`);
console.log('---');

// ========== 6. 返回结果 ==========
return {
  json: renderParams
};
```

---

## 🧪 测试步骤

### 步骤 1: 取消 Pin（首次测试）

1. 点击视频生成节点
2. 点击右上角的 📌 图标，取消固定
3. 点击 **"Execute node"** 运行整个工作流
4. 查看"合并提交参数"节点的输出

**预期结果**:
```json
{
  "compositionId": "ComplexVideo",
  "inputProps": {
    "fields": {
      "segments": [
        {
          "backgroundImages": ["https://不同视频1.mp4"]
        },
        {
          "backgroundImages": ["https://不同视频2.mp4"]
        },
        {
          "backgroundImages": ["https://不同视频3.mp4"]
        }
      ]
    }
  }
}
```

✅ 三个视频链接应该**不同**

---

### 步骤 2: Pin 后再次测试

1. 点击视频生成节点
2. 点击 📌 图标固定输出
3. 重新运行工作流
4. 查看"合并提交参数"节点的输出

**预期结果**:
- 仍然是 3 个**不同**的视频链接 ✅
- 不会变成 3 个相同的链接

---

## 📊 对比：修复前 vs 修复后

### 修复前 ❌

```javascript
// 旧代码
{
  "backgroundMusic": ["{{$('Webhook').item.json.body.body.backgroundMusic}}"],
  "backgroundImages": ["{{$('视频生成').item.json.video}}"]
}
```

**问题**: 
- 使用 `item.json` 只能获取当前项
- Pin 后所有项都看到同一个数据

**结果**:
```json
{
  "segments": [
    { "backgroundImages": ["video1.mp4"] },
    { "backgroundImages": ["video1.mp4"] },  // ❌ 应该是 video2
    { "backgroundImages": ["video1.mp4"] }   // ❌ 应该是 video3
  ]
}
```

---

### 修复后 ✅

```javascript
// 新代码
const videoItems = $input.all();
const segments = videoItems.map(item => ({
  backgroundImages: [item.json.video]
}));
```

**优点**:
- 使用 `$input.all()` 获取所有输入项
- 正确遍历每个项

**结果**:
```json
{
  "segments": [
    { "backgroundImages": ["video1.mp4"] },
    { "backgroundImages": ["video2.mp4"] },  // ✅ 正确
    { "backgroundImages": ["video3.mp4"] }   // ✅ 正确
  ]
}
```

---

## 🎯 关键知识点

### 1. n8n 的数据访问方式

| 方式 | 获取内容 | 适用场景 |
|------|---------|---------|
| `$input.item` | 当前正在处理的项 | 逐项处理 |
| `$input.all()` | 所有输入项 | 批量处理 |
| `$('节点名').item` | 指定节点的当前项 | ❌ Pin 后有问题 |
| `$('节点名').all()` | 指定节点的所有项 | ✅ Pin 后正常 |

### 2. Code 节点的执行模式

| 模式 | 执行次数 | 适用场景 |
|------|---------|---------|
| `Run Once for Each Item` | 每个输入项执行一次 | 单项处理 |
| `Run Once for All Items` | 所有输入项只执行一次 | 合并/聚合 |

👉 **合并参数节点必须使用**: `Run Once for All Items`

---

## 🚨 常见错误

### 错误 1: 使用错误的访问方式

```javascript
// ❌ 错误
const video = $('上游节点').item.json.video;

// ✅ 正确
const videos = $input.all();
```

### 错误 2: 使用错误的执行模式

```
❌ Run Once for Each Item
✅ Run Once for All Items
```

### 错误 3: 忘记处理数组/字符串

```javascript
// ❌ 可能报错
backgroundImages: item.json.backgroundImages

// ✅ 安全处理
backgroundImages: Array.isArray(item.json.backgroundImages)
  ? item.json.backgroundImages
  : [item.json.backgroundImages]
```

---

## 📚 延伸阅读

### n8n 官方文档
- [Working with Data](https://docs.n8n.io/data/)
- [Code Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.code/)
- [Expression Resolution](https://docs.n8n.io/code-examples/expressions/)

### 相关文档
- `N8N-ASYNC-WORKFLOW.md` - 完整的工作流配置
- `TIMEOUT-OPTIMIZATION.md` - 超时优化
- `RAILWAY-DEPLOYMENT-GUIDE.md` - 部署指南

---

## 🎬 总结

### 问题
Pin 节点后，下游合并节点无法正确获取多个不同的输入项

### 原因
使用了 `$('节点名').item.json` 而不是 `$input.all()`

### 解决方案
1. 使用 **Code 节点** 替换原有合并节点
2. 设置为 **Run Once for All Items** 模式
3. 使用 `$input.all()` 获取所有输入项
4. 使用 `map()` 遍历并处理每个项

### 效果
✅ Pin 前后都能正确获取多个不同的视频链接
✅ 支持 3-15 个视频片段
✅ 带数据验证和日志输出

---

**最后更新**: 2025-10-25  
**适用版本**: n8n 1.0+  
**测试状态**: ✅ 已验证

