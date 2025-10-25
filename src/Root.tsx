import React from 'react';
import { Composition } from 'remotion';
import { MyVideo } from './Video';
import { ComplexVideo } from './ComplexVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 原始简单视频 */}
      <Composition
        id="MyVideo"
        component={ComplexVideo}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          backgroundMusic: [],
          segments: []
        }}
        calculateMetadata={({ props }) => {
          // 动态计算总时长：每个片段150帧（5秒 @ 30fps）
          const segmentCount = props.segments?.length || 1;
          const framesPerSegment = 150;
          const totalDuration = segmentCount * framesPerSegment;
          
          return {
            durationInFrames: totalDuration,
            fps: 30,
            width: 1080,
            height: 1920,
          };
        }}
      />
      {/* 轻量级测试视频 - 适合低内存环境 */}
      <Composition
        id="TestVideo"
        component={MyVideo}
        durationInFrames={60}
        fps={15}
        width={1280}
        height={720}
        defaultProps={{
          title: 'Test Video',
          subtitle: 'Low Memory Test'
        }}
      />
    </>
  );
};

