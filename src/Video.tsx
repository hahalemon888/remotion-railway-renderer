import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from 'remotion';

interface VideoProps {
  title: string;
  subtitle: string;
}

export const MyVideo: React.FC<VideoProps> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = spring({
    frame,
    fps,
    config: {
      damping: 100,
    },
  });

  const subtitleOpacity = spring({
    frame: frame - 20,
    fps,
    config: {
      damping: 100,
    },
  });

  const scale = interpolate(frame, [0, 30], [0.8, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: 100,
            fontWeight: 'bold',
            color: '#ffffff',
            margin: 0,
            opacity: titleOpacity,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 50,
            color: '#94a3b8',
            margin: '20px 0 0 0',
            opacity: subtitleOpacity,
          }}
        >
          {subtitle}
        </p>
      </div>
    </AbsoluteFill>
  );
};




