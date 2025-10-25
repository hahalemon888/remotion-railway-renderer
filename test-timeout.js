/**
 * 超时设置测试脚本
 * 用于验证 15 分钟超时配置是否正常工作
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// 测试数据 - 使用你提供的真实视频 URL
const testData = {
  compositionId: 'ComplexVideo',
  inputProps: {
    fields: {
      episodeNumber: 0,
      segments: [
        {
          cameraEffects: '',
          subtitles: [
            { text: '这是第一个测试片段', startTime: 0, endTime: 2 }
          ],
          backgroundImages: [
            'https://example.com/video1.mp4'  // 替换为你的实际视频 URL
          ],
          font_style: 'white-black-outline',
          speaker_audio: []
        },
        {
          cameraEffects: '',
          subtitles: [
            { text: '这是第二个测试片段', startTime: 0, endTime: 2 }
          ],
          backgroundImages: [
            'https://example.com/video2.mp4'  // 替换为你的实际视频 URL
          ],
          font_style: 'white-black-outline',
          speaker_audio: []
        },
        {
          cameraEffects: '',
          subtitles: [
            { text: '这是第三个测试片段', startTime: 0, endTime: 2 }
          ],
          backgroundImages: [
            'https://example.com/video3.mp4'  // 替换为你的实际视频 URL
          ],
          font_style: 'white-black-outline',
          speaker_audio: []
        }
      ]
    }
  },
  outputFileName: `test-timeout-${Date.now()}.mp4`,
  renderOptions: {
    scale: 0.5,
    crf: 30
  }
};

async function testRender() {
  console.log('🚀 开始测试超时配置...\n');
  console.log('📊 测试参数:');
  console.log(`   - 片段数量: ${testData.inputProps.fields.segments.length}`);
  console.log(`   - 分辨率缩放: ${testData.renderOptions.scale * 100}%`);
  console.log(`   - CRF 质量: ${testData.renderOptions.crf}`);
  console.log(`   - 预期超时: 900秒（15分钟）\n`);

  try {
    // 1. 提交渲染任务
    console.log('📤 提交渲染任务...');
    const submitResponse = await axios.post(`${BASE_URL}/render`, testData);
    
    if (!submitResponse.data.success) {
      console.error('❌ 提交失败:', submitResponse.data);
      return;
    }

    const taskId = submitResponse.data.taskId;
    console.log(`✅ 任务已创建: ${taskId}\n`);

    // 2. 轮询任务状态
    console.log('⏳ 监控渲染进度...\n');
    const startTime = Date.now();
    let lastProgress = 0;

    while (true) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // 每 3 秒查询一次

      const statusResponse = await axios.get(`${BASE_URL}/status/${taskId}`);
      const job = statusResponse.data;

      const elapsed = Math.round((Date.now() - startTime) / 1000);
      
      if (job.progress !== lastProgress) {
        console.log(`[${elapsed}s] ${job.status} - ${job.progress}% - ${job.message}`);
        lastProgress = job.progress;
      }

      // 检查是否完成
      if (job.status === 'completed') {
        console.log('\n✅ 渲染成功!');
        console.log(`⏱️  总用时: ${elapsed}秒 (${(elapsed / 60).toFixed(2)}分钟)`);
        console.log(`📹 输出文件: ${job.data.outputFileName}`);
        console.log(`📊 视频信息:`);
        console.log(`   - 分辨率: ${job.data.width}x${job.data.height}`);
        console.log(`   - 帧率: ${job.data.fps} fps`);
        console.log(`   - 总帧数: ${job.data.durationInFrames}`);
        console.log(`\n🌐 下载链接: ${BASE_URL}${job.data.downloadUrl}`);
        break;
      }

      // 检查是否失败
      if (job.status === 'failed') {
        console.log('\n❌ 渲染失败!');
        console.log(`⏱️  失败时间: ${elapsed}秒`);
        console.log(`❌ 错误信息: ${job.error}`);
        
        // 检查是否是超时错误
        if (job.error.includes('delayRender') && job.error.includes('not cleared')) {
          console.log('\n⚠️  这是一个超时错误!');
          console.log('💡 建议:');
          console.log('   1. 检查网络连接');
          console.log('   2. 验证视频 URL 是否有效');
          console.log('   3. 考虑进一步增加超时时间');
        }
        break;
      }

      // 超过 15 分钟仍在运行，发出警告
      if (elapsed > 900) {
        console.log('\n⚠️  警告: 已超过 15 分钟，但任务仍在运行...');
      }
    }

  } catch (error) {
    console.error('\n❌ 测试过程中出错:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
console.log('═══════════════════════════════════════════════════');
console.log('     Remotion 超时配置测试');
console.log('═══════════════════════════════════════════════════\n');

testRender().then(() => {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('测试完成');
  console.log('═══════════════════════════════════════════════════');
}).catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});

