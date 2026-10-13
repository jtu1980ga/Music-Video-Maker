import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw, Download, Sparkles } from 'lucide-react';
import { TimestampLine, ScenePrompt, StoryTreatment, VideoStyleSettings } from '../types';
import { drawVideoFrame } from '../utils/videoRenderer';
import { formatTime } from '../utils/audioUtils';

interface VideoPreviewPlayerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  totalDuration: number;
  scenes: ScenePrompt[];
  lyrics: TimestampLine[];
  story: StoryTreatment | null;
  settings: VideoStyleSettings;
  onOpenExportModal: () => void;
}

export const VideoPreviewPlayer: React.FC<VideoPreviewPlayerProps> = ({
  audioRef,
  totalDuration,
  scenes,
  lyrics,
  story,
  settings,
  onOpenExportModal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  // Render loop
  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const audio = audioRef.current;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const time = audio ? audio.currentTime : 0;
          setCurrentTime(time);
          drawVideoFrame(
            ctx,
            canvas.width,
            canvas.height,
            time,
            totalDuration || 60,
            scenes,
            lyrics,
            story,
            settings
          );
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [scenes, lyrics, story, settings, totalDuration, audioRef]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const handleSeek = (newTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    audio.play().catch(console.error);
    setIsPlaying(true);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  const isVertical = settings.aspectRatio === '9:16';
  const canvasWidth = isVertical ? 1080 : 1920;
  const canvasHeight = isVertical ? 1920 : 1080;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Dynamic 16:9 or 9:16 Video Canvas Frame */}
      <div
        ref={containerRef}
        className={`relative w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800 group ${
          isVertical ? 'aspect-[9/16] max-w-xs sm:max-w-sm mx-auto' : 'aspect-video w-full'
        }`}
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
        />

        {/* Big play button overlay when paused */}
        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center cursor-pointer transition-opacity"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-xl shadow-indigo-600/40 hover:scale-110 transition-transform">
              <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 text-white" />
            </div>
          </div>
        )}

        {/* Bottom Control Bar on Hover */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2">
          {/* Scrubber bar */}
          <input
            type="range"
            min={0}
            max={totalDuration || 60}
            step={0.05}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 h-1.5 bg-white/20 rounded-lg cursor-pointer"
          />

          <div className="flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={handleRestart}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Restart"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 pl-2">
                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    if (audioRef.current) audioRef.current.volume = v;
                  }}
                  className="w-16 accent-indigo-500 h-1 bg-white/20 rounded cursor-pointer"
                />
              </div>
              <span className="font-mono text-slate-300 text-[11px] pl-2">
                {formatTime(currentTime, true)} / {formatTime(totalDuration, true)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-slate-300">
            Live 7clouds Preview • Synchronized Audio & Typography
          </span>
        </div>

        <button
          onClick={onOpenExportModal}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Burn Lyrics & Export MP4 Video</span>
        </button>
      </div>
    </div>
  );
};
