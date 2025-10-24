import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { createRequire } from 'module';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Remotion Railway Renderer'
  });
});

// 渲染端点
app.post('/render', async (req, res) => {
  const startTime = Date.now();
  console.log('📹 收到渲染请求:', req.body);

  try {
    const {
      compositionId = 'MyVideo',
      inputProps = {},
      outputFileName = `video-${Date.now()}.mp4`
    } = req.body;

    // 1. 打包 Remotion 项目
    console.log('📦 正在打包项目...');
    const bundleLocation = await bundle({
      entryPoint: path.join(__dirname, '../src/Root.tsx'),
      webpackOverride: (config) => config,
    });

    // 2. 获取组合信息
    console.log('🎬 获取视频组合信息...');
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps,
    });

    // 3. 准备输出路径
    const outputPath = path.join(__dirname, '../output', outputFileName);
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 4. 渲染视频
    console.log('🎥 开始渲染视频...');
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
      // 使用系统 Chromium
      chromiumOptions: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      },
      onProgress: ({ progress }) => {
        console.log(`渲染进度: ${(progress * 100).toFixed(1)}%`);
      },
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ 渲染完成! 用时: ${duration}秒`);

    // 5. 返回结果
    res.json({
      success: true,
      message: '视频渲染成功',
      data: {
        outputPath,
        outputFileName,
        compositionId,
        duration: `${duration}秒`,
        width: composition.width,
        height: composition.height,
        fps: composition.fps,
        durationInFrames: composition.durationInFrames,
      }
    });

  } catch (error) {
    console.error('❌ 渲染错误:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 获取可用的组合列表
app.get('/compositions', async (req, res) => {
  try {
    console.log('📋 获取组合列表...');
    
    const bundleLocation = await bundle({
      entryPoint: path.join(__dirname, '../src/Root.tsx'),
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

// 根路径 - API 文档
app.get('/', (req, res) => {
  res.json({
    name: 'Remotion Railway Renderer API',
    version: '1.0.0',
    endpoints: {
      'GET /health': '健康检查',
      'GET /compositions': '获取可用的视频组合列表',
      'POST /render': '渲染视频 - 参数: { compositionId, inputProps, outputFileName }'
    },
    example: {
      curl: `curl -X POST https://your-app.railway.app/render \\
  -H "Content-Type: application/json" \\
  -d '{
    "compositionId": "MyVideo",
    "inputProps": {
      "title": "你好世界",
      "subtitle": "这是由 Railway 渲染的视频"
    },
    "outputFileName": "my-video.mp4"
  }'`
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Remotion 渲染服务器运行在端口 ${PORT}`);
  console.log(`📍 健康检查: http://localhost:${PORT}/health`);
  console.log(`📹 渲染端点: http://localhost:${PORT}/render`);
});

