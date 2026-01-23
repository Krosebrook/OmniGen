
import React, { useRef, useState, useEffect, useCallback } from 'react';

interface HeroVideoProps {
  src?: string;
  poster?: string;
  aspectRatio?: string; // e.g. "16/9"
  autoPlay?: boolean;
}

export const HeroVideo: React.FC<HeroVideoProps> = ({ 
  src = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", 
  poster, 
  aspectRatio = "16/9", 
  autoPlay = false 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);

  // Handle Aspect Ratio
  const ratioParts = aspectRatio.split('/').map(Number);
  const calculatedRatio = ratioParts.length === 2 ? `${ratioParts[0]} / ${ratioParts[1]}` : '16 / 9';

  // Keyboard Controls
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!videoRef.current) return;

    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        togglePlay();
        break;
      case 'm':
        e.preventDefault();
        toggleMute();
        break;
      case 'ArrowRight':
        e.preventDefault();
        videoRef.current.currentTime += 5;
        break;
      case 'ArrowLeft':
        e.preventDefault();
        videoRef.current.currentTime -= 5;
        break;
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(e => console.error("Play failed", e));
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(isNaN(p) ? 0 : p);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time = (Number(e.target.value) / 100) * videoRef.current.duration;
      videoRef.current.currentTime = time;
      setProgress(Number(e.target.value));
    }
  };

  // AutoPlay logic respecting reduced motion
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoPlay) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().then(() => setIsPlaying(true)).catch(() => {
              // Autoplay might be blocked by browser policy without mute
              video.muted = true;
              setIsMuted(true);
              video.play().then(() => setIsPlaying(true)).catch(e => console.log("Autoplay blocked", e));
            });
          } else {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [autoPlay]);

  if (error) {
    return (
      <div 
        className="w-full h-full flex flex-col items-center justify-center bg-slate-900 border border-slate-700 rounded-xl p-6 text-center"
        style={{ aspectRatio: calculatedRatio }}
      >
        <svg className="w-10 h-10 text-rose-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-slate-300 font-bold">Video Unavailable</p>
        <p className="text-slate-500 text-xs mt-1">Unable to load media source.</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative group w-full bg-black rounded-xl overflow-hidden focus:ring-2 focus:ring-cyan-400 focus:outline-none"
      style={{ aspectRatio: calculatedRatio }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Video Player"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        onTimeUpdate={handleTimeUpdate}
        onError={() => setError("Failed to load video")}
        onEnded={() => setIsPlaying(false)}
        playsInline
      />

      {/* Controls Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 flex flex-col justify-end p-4 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Seek Bar */}
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-400 mb-4 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          aria-label="Seek"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="text-white hover:text-cyan-400 transition-colors focus:text-cyan-400 focus:outline-none"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>

            <button
              onClick={toggleMute}
              className="text-white hover:text-cyan-400 transition-colors focus:text-cyan-400 focus:outline-none"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeDasharray="20 2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
              )}
            </button>
          </div>
          
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
             {isPlaying ? 'Playing' : 'Paused'}
          </div>
        </div>
      </div>
    </div>
  );
};
