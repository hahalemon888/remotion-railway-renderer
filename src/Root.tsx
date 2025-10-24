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
    </>
  );
};

