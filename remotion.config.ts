import { Config } from '@remotion/cli/config';

// 视频输出配置
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setCodec('h264');

// ========== 🔥 全局超时配置（方案B：平衡性能，适合10-15片段）==========
// 1. 整体渲染超时: 30分钟（支持10-15个片段）
Config.setTimeoutInMilliseconds(1800000);

// 2. 单个资源下载超时: 240秒（4分钟，支持大文件下载）
Config.setDelayRenderTimeoutInMilliseconds(240000);

// 3. Chromium 启动超时: 90秒
Config.setChromiumOpenGlRenderer('egl');

// 4. 并发渲染设置（单线程，节省内存）
Config.setConcurrency(1);

// 5. 视频缓存大小限制: 512MB
Config.setOffthreadVideoCacheSizeInBytes(512 * 1024 * 1024);



