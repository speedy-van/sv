'use client';

interface SpeedyAIIconProps {
  size?: number;
}

export default function SpeedyAIIcon({ size = 60 }: SpeedyAIIconProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        maxWidth: size,
        maxHeight: size,
        aspectRatio: '1',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '20%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        webkit-playsinline="true"
        style={{
          width: '100%',
          height: '100%',
          minWidth: '100%',
          minHeight: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          display: 'block',
          margin: 0,
          padding: 0,
        }}
      >
        <source src="/logo/AB7D9FB6-5E70-43CC-A81F-A47E875EC79F-video.mp4" type="video/mp4" />
      </video>
    </div>
  );
}

