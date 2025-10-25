import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Video,
  OffthreadVideo,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from 'remotion';

// 定义数据结构
interface Subtitle {
  text: string;
  startTime: number;
  endTime: number;
}

interface Segment {
  cameraEffects?: string;
  subtitles?: Subtitle[];
  backgroundImages?: string[];
  font_style?: string;
  speaker_audio?: string[];
}

interface ComplexVideoProps {
  backgroundMusic?: string[];
  coverImageUrl?: string;
  episodeNumber?: number;
  segments?: Segment[];
}

// 判断 URL 是图片还是视频
const isVideoUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
};

export const ComplexVideo: React.FC<ComplexVideoProps> = ({
  backgroundMusic = [],
  coverImageUrl,
  segments = [],
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // 如果没有 segments，显示默认内容
  if (!segments || segments.length === 0) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: '#0f172a',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          fontSize: 60,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div>视频内容为空</div>
      </AbsoluteFill>
    );
  }

  // 计算每个 segment 的时长（平均分配）
  const framesPerSegment = Math.floor(durationInFrames / segments.length);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* 渲染每个 segment */}
      {segments.map((segment, index) => {
        const startFrame = index * framesPerSegment;
        const segmentDuration = framesPerSegment;

        return (
          <Sequence
            key={`segment-${index}`}
            from={startFrame}
            durationInFrames={segmentDuration}
          >
            <AbsoluteFill>
              {/* 背景图片/视频 */}
              {segment.backgroundImages &&
                segment.backgroundImages.length > 0 && (
                  <>
                    {isVideoUrl(segment.backgroundImages[0]) ? (
                      <OffthreadVideo
                        src={segment.backgroundImages[0]}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        muted
                        delayRenderTimeoutInMilliseconds={900000}
                      />
                    ) : (
                      <Img
                        src={segment.backgroundImages[0]}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        delayRenderTimeoutInMilliseconds={900000}
                      />
                    )}
                  </>
                )}

              {/* 字幕 */}
              {segment.subtitles && segment.subtitles.length > 0 && (
                <AbsoluteFill
                  style={{
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    paddingBottom: 100,
                  }}
                >
                  {segment.subtitles.map((subtitle, subIndex) => {
                    const subtitleStartFrame = Math.floor(
                      subtitle.startTime * fps
                    );
                    const subtitleEndFrame = Math.floor(subtitle.endTime * fps);
                    const currentSegmentFrame = frame - startFrame;

                    // 只显示当前时间范围内的字幕
                    if (
                      currentSegmentFrame >= subtitleStartFrame &&
                      currentSegmentFrame <= subtitleEndFrame
                    ) {
                      return (
                        <div
                          key={`subtitle-${subIndex}`}
                          style={{
                            fontSize: 48,
                            fontWeight: 'bold',
                            color: '#ffffff',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                            padding: '10px 20px',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            borderRadius: 8,
                            maxWidth: '80%',
                            textAlign: 'center',
                          }}
                        >
                          {subtitle.text}
                        </div>
                      );
                    }
                    return null;
                  })}
                </AbsoluteFill>
              )}

              {/* 音频 */}
              {segment.speaker_audio &&
                segment.speaker_audio.length > 0 &&
                segment.speaker_audio[0] && (
          <Audio 
            src={segment.speaker_audio[0]} 
            delayRenderTimeoutInMilliseconds={900000}
          />
                )}
            </AbsoluteFill>
          </Sequence>
        );
      })}

      {/* 背景音乐 */}
      {backgroundMusic && backgroundMusic.length > 0 && backgroundMusic[0] && (
        <Audio 
          src={backgroundMusic[0]} 
          volume={0.3}
          delayRenderTimeoutInMilliseconds={900000}
        />
      )}
    </AbsoluteFill>
  );
};

