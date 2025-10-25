import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { createRequire } from 'module';
import fs from 'fs';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ========== 任务存储系统 ==========
// 存储所有渲染任务的状态
const jobs = new Map();

// 生成唯一任务 ID
function generateTaskId() {
  return crypto.randomUUID();
}

// 清理旧任务（24小时后自动清理）
function cleanupOldJobs() {
  const now = Date.now();
  const MAX_AGE = 24 * 60 * 60 * 1000; // 24小时
  
  for (const [taskId, job] of jobs.entries()) {
    if (now - job.createdAt > MAX_AGE) {
      console.log(`🧹 清理旧任务: ${taskId}`);
      jobs.delete(taskId);
      
      // 如果有输出文件，也删除
      if (job.data?.outputPath && fs.existsSync(job.data.outputPath)) {
        fs.unlinkSync(job.data.outputPath);
      }
    }
  }
}

// 每小时清理一次
setInterval(cleanupOldJobs, 60 * 60 * 1000);

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务 - 提供输出视频的下载
app.use('/output', express.static(path.join(__dirname, '../output')));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Remotion Railway Renderer'
  });
});

// ========== 异步渲染函数 ==========
async function performRender(taskId, compositionId, inputProps, outputFileName, renderOptions = {}) {
  const startTime = Date.now();
  
  try {
    // 更新状态为处理中
    jobs.set(taskId, {
      ...jobs.get(taskId),
      status: 'processing',
      message: '正在打包项目...',
      progress: 0
    });

    // 1. 打包 Remotion 项目
    console.log(`[${taskId}] 📦 正在打包项目...`);
    const bundleLocation = await bundle({
      entryPoint: path.join(__dirname, '../src/index.ts'),
      webpackOverride: (config) => config,
    });

    // 2. 获取组合信息
    console.log(`[${taskId}] 🎬 获取视频组合信息...`);
    jobs.set(taskId, {
      ...jobs.get(taskId),
      message: '正在获取视频信息...',
      progress: 10
    });
    
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps,
    });

    // 处理分辨率缩放（用于节省内存）
    const scale = renderOptions.scale || 1.0;
    const targetWidth = Math.round(composition.width * scale);
    const targetHeight = Math.round(composition.height * scale);
    
    if (scale !== 1.0) {
      console.log(`[${taskId}] 📐 分辨率缩放: ${composition.width}x${composition.height} → ${targetWidth}x${targetHeight} (${Math.round(scale * 100)}%)`);
    }

    // 3. 准备输出路径
    const outputPath = path.join(__dirname, '../output', outputFileName);
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 4. 渲染视频
    console.log(`[${taskId}] 🎥 开始渲染视频...`);
    jobs.set(taskId, {
      ...jobs.get(taskId),
      message: '正在渲染视频...',
      progress: 15
    });
    
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
      
      // 应用分辨率缩放
      ...(scale !== 1.0 && {
        scale,
      }),
      
      // ========== 🔥 所有超时配置（方案B：平衡性能，支持10-15片段）==========
      // 1. 整体渲染超时: 30分钟（支持10-15个片段）
      timeoutInMilliseconds: 1800000,
      
      // 2. 单个资源下载超时: 240秒（4分钟，支持大文件）
      delayRenderTimeoutInMilliseconds: 240000,
      
      // 3. 视频缓存大小: 512MB（避免内存溢出）
      offthreadVideoCacheSizeInBytes: 512 * 1024 * 1024,
      
      chromiumOptions: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        // 4. Chromium 启动参数 - 增加超时和网络配置
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions',
          // 网络优化
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-blink-features=AutomationControlled',
          // 增加网络超时容忍度
          '--timeout=240000',
          '--disable-hang-monitor',
        ],
        // 5. Puppeteer 默认超时: 240秒（4分钟）
        timeout: 240000,
      },
      
      // 内存优化设置
      concurrency: 1,  // 单线程渲染
      frameRange: null,  // 渲染全部帧
      everyNthFrame: 1,  // 每帧都渲染
      numberOfGifLoops: null,
      
      // 视频质量设置（降低以节省内存）
      crf: renderOptions.crf || 28,  // 提高 CRF 值（降低质量但减少内存）
      pixelFormat: 'yuv420p',
      
      // FFmpeg 优化参数
      ffmpegOverride: ({ args }) => {
        return [
          ...args.filter(arg => 
            !arg.includes('-preset') && 
            !arg.includes('-threads')
          ),
          '-preset', 'ultrafast',  // 最快编码速度
          '-threads', '2',  // 限制线程数
          '-bufsize', '1M',  // 限制缓冲区大小
          '-maxrate', '2M',  // 限制最大比特率
        ];
      },
      
      enforceAudioTrack: false,
      onProgress: ({ progress }) => {
        const percentage = Math.round(15 + progress * 80); // 15% - 95%
        console.log(`[${taskId}] 渲染进度: ${percentage}%`);
        
        jobs.set(taskId, {
          ...jobs.get(taskId),
          progress: percentage,
          message: `正在渲染视频 ${percentage}%...`
        });
      },
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[${taskId}] ✅ 渲染完成! 用时: ${duration}秒`);

    // 更新为完成状态
    jobs.set(taskId, {
      ...jobs.get(taskId),
      status: 'completed',
      progress: 100,
      message: '渲染完成',
      data: {
        outputPath,
        outputFileName,
        compositionId,
        duration: `${duration}秒`,
        width: targetWidth,
        height: targetHeight,
        originalWidth: composition.width,
        originalHeight: composition.height,
        scale: scale,
        fps: composition.fps,
        durationInFrames: composition.durationInFrames,
        downloadUrl: `/output/${outputFileName}`,
      },
      completedAt: Date.now()
    });

  } catch (error) {
    console.error(`[${taskId}] ❌ 渲染错误:`, error);
    
    // 更新为失败状态
    jobs.set(taskId, {
      ...jobs.get(taskId),
      status: 'failed',
      message: '渲染失败',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      failedAt: Date.now()
    });
  }
}

// ========== 提交渲染任务端点（异步） ==========
app.post('/render', async (req, res) => {
  console.log('📹 收到渲染请求:', req.body);

  try {
    const {
      compositionId = 'MyVideo',
      inputProps = {},
      outputFileName = `video-${Date.now()}.mp4`,
      renderOptions = {}
    } = req.body;

    // 生成任务 ID
    const taskId = generateTaskId();
    console.log(`✨ 创建任务: ${taskId}`);
    
    // 渲染选项（用于内存优化）
    const options = {
      scale: renderOptions.scale || 0.5,  // 默认 50% 分辨率（节省内存）
      crf: renderOptions.crf || 30,  // 默认 CRF 30（降低质量节省内存）
      ...renderOptions
    };
    
    console.log(`📐 渲染选项: scale=${options.scale}, crf=${options.crf}`);

    // 初始化任务状态
    jobs.set(taskId, {
      taskId,
      status: 'queued',
      message: '任务已创建，等待处理...',
      progress: 0,
      compositionId,
      inputProps,
      outputFileName,
      renderOptions: options,
      createdAt: Date.now()
    });

    // 立即返回任务 ID
    res.json({
      success: true,
      message: '渲染任务已创建',
      taskId,
      status: 'queued',
      renderOptions: options
    });

    // 后台异步执行渲染
    performRender(taskId, compositionId, inputProps, outputFileName, options);

  } catch (error) {
    console.error('❌ 创建任务错误:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========== 查询任务状态端点 ==========
app.get('/render/:taskId', (req, res) => {
  const { taskId } = req.params;
  const job = jobs.get(taskId);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: '任务不存在',
      message: `找不到任务 ID: ${taskId}`
    });
  }

  // 返回任务信息
  res.json({
    success: true,
    ...job
  });
});

// 获取可用的组合列表
app.get('/compositions', async (req, res) => {
  try {
    console.log('📋 获取组合列表...');
    
    const bundleLocation = await bundle({
      entryPoint: path.join(__dirname, '../src/index.ts'),
      webpackOverride: (config) => config,
    });

    const { getCompositions } = await import('@remotion/renderer');
    const compositions = await getCompositions(bundleLocation);

    res.json({
      success: true,
      compositions: compositions.map(comp => ({
        id: comp.id,
        width: comp.width,
        height: comp.height,
        fps: comp.fps,
        durationInFrames: comp.durationInFrames,
        durationInSeconds: (comp.durationInFrames / comp.fps).toFixed(2),
        defaultProps: comp.defaultProps,
      }))
    });

  } catch (error) {
    console.error('❌ 获取组合列表错误:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取所有任务列表（可选，用于调试）
app.get('/jobs', (req, res) => {
  const allJobs = Array.from(jobs.values()).map(job => ({
    taskId: job.taskId,
    status: job.status,
    progress: job.progress,
    message: job.message,
    compositionId: job.compositionId,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    failedAt: job.failedAt
  }));

  res.json({
    success: true,
    total: allJobs.length,
    jobs: allJobs
  });
});

// 根路径 - API 文档
app.get('/', (req, res) => {
  res.json({
    name: 'Remotion Railway Renderer API (异步模式 + 内存优化)',
    version: '2.1.0',
    mode: 'async',
    endpoints: {
      'GET /health': '健康检查',
      'GET /compositions': '获取可用的视频组合列表',
      'POST /render': '提交渲染任务（异步）- 参数: { compositionId, inputProps, outputFileName, renderOptions }',
      'GET /render/:taskId': '查询任务状态和进度',
      'GET /jobs': '获取所有任务列表（调试用）',
      'GET /output/:filename': '下载渲染好的视频文件'
    },
    renderOptions: {
      scale: '分辨率缩放比例 (0.1-1.0)，默认 0.5 (50%)，用于节省内存',
      crf: 'CRF 质量参数 (0-51)，默认 30，值越高文件越小但质量越低',
      presets: {
        'low-memory': { scale: 0.5, crf: 30, description: '低内存模式 (默认) - 适合 512MB RAM' },
        'balanced': { scale: 0.75, crf: 25, description: '平衡模式 - 需要 1GB+ RAM' },
        'high-quality': { scale: 1.0, crf: 20, description: '高质量模式 - 需要 2GB+ RAM' }
      }
    },
    workflow: [
      '1. POST /render → 返回 { taskId }',
      '2. GET /render/:taskId → 轮询查询状态',
      '3. status === "completed" → 使用 downloadUrl 下载视频'
    ],
    statusCodes: {
      'queued': '任务已创建，等待处理',
      'processing': '正在渲染中',
      'completed': '渲染完成',
      'failed': '渲染失败'
    },
    example: {
      step1_submit_default: `curl -X POST https://your-app.railway.app/render \\
  -H "Content-Type: application/json" \\
  -d '{
    "compositionId": "MyVideo",
    "inputProps": {
      "title": "你好世界",
      "subtitle": "这是由 Railway 渲染的视频"
    },
    "outputFileName": "my-video.mp4"
  }'`,
      step1_submit_custom: `curl -X POST https://your-app.railway.app/render \\
  -H "Content-Type: application/json" \\
  -d '{
    "compositionId": "MyVideo",
    "inputProps": { "title": "测试" },
    "outputFileName": "my-video.mp4",
    "renderOptions": {
      "scale": 0.75,
      "crf": 25
    }
  }'`,
      step2_check: `curl https://your-app.railway.app/render/YOUR_TASK_ID`,
      step3_download: `curl -O https://your-app.railway.app/output/my-video.mp4`
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Remotion 渲染服务器运行在端口 ${PORT}`);
  console.log(`📍 健康检查: http://localhost:${PORT}/health`);
  console.log(`📹 渲染端点: http://localhost:${PORT}/render`);
});

