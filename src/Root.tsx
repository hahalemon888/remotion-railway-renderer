import React from 'react';
import { Composition } from 'remotion';
import { MyVideo } from './Video';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyVideo"
        component={MyVideo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'Hello Remotion',
          subtitle: 'Rendered on Railway'
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

