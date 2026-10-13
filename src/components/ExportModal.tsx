import React, { useState } from 'react';
import {
  X,
  Download,
  Film,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  FileText,
  Upload,
  Globe,
  Lock,
  EyeOff,
  ExternalLink,
  Sparkles,
  Smartphone,
  Tv,
  Clock,
} from 'lucide-react';
import {
  TimestampLine,
  ScenePrompt,
  StoryTreatment,
  VideoStyleSettings,
  AspectRatio,
  VideoDurationMode,
} from '../types';
import { renderVideoToBlob } from '../utils/videoRenderer';
import { exportToLRC, exportToSRT } from '../utils/subtitles';
import { formatTime } from '../utils/audioUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  totalDuration: number;
  scenes: ScenePrompt[];
  lyrics: TimestampLine[];
  story: StoryTreatment | null;
  settings: VideoStyleSettings;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultTags?: string[];
  initialAspectRatio?: AspectRatio;
  onRenderComplete?: (result: { url: string; blob: Blob | null; format: string; duration: number; aspectRatio: AspectRatio }) => void;
  onOpenCredentialsHub?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  audioRef,
  totalDuration,
  scenes,
  lyrics,
  story,
  settings,
  defaultTitle,
  defaultDescription,
  defaultTags,
  initialAspectRatio = '16:9',
  onRenderComplete,
  onOpenCredentialsHub,
}) => {
  // Video Options
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(initialAspectRatio);
  const [durationMode, setDurationMode] = useState<VideoDurationMode>('full');
  const [customStartTime, setCustomStartTime] = useState<number>(0);
  const [customEndTime, setCustomEndTime] = useState<number>(Math.min(60, totalDuration || 60));
  const [quality, setQuality] = useState<'1080p' | '720p'>('1080p');

  // Active Tab: Download MP4 vs Upload to YouTube
  const [actionTab, setActionTab] = useState<'download' | 'youtube'>('download');

  // YouTube Upload Form states
  const [ytTitle, setYtTitle] = useState(defaultTitle || `${story?.title || 'Song'} - ${story?.artist || 'Artist'} (Lyrics)`);
  const [ytDescription, setYtDescription] = useState(defaultDescription || `🎵 ${story?.title || 'Song'} (Lyrics)\nProduced with 7clouds Video Studio`);
  const [ytPrivacy, setYtPrivacy] = useState<'public' | 'unlisted' | 'private'>('unlisted');
  const [ytTags, setYtTags] = useState<string>((defaultTags || ['7clouds', 'lyrics', 'music']).join(', '));
  const [isUploadingToYt, setIsUploadingToYt] = useState(false);
  const [ytUploadSuccess, setYtUploadSuccess] = useState<{ videoUrl: string; videoId: string } | null>(null);

  // Rendering states
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState('');
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [exportedFormat, setExportedFormat] = useState('mp4');

  if (!isOpen) return null;

  // Compute active clip range
  let effectiveStart = 0;
  let effectiveEnd = totalDuration || 60;
  if (durationMode === '30s') {
    effectiveEnd = Math.min(30, totalDuration || 60);
  } else if (durationMode === '60s') {
    effectiveEnd = Math.min(60, totalDuration || 60);
  } else if (durationMode === 'custom') {
    effectiveStart = customStartTime;
    effectiveEnd = Math.min(customEndTime, totalDuration || 60);
  }
  const effectiveDuration = Math.max(1, effectiveEnd - effectiveStart);

  // Compute resolution based on aspect ratio & quality
  const getResolutionDimensions = () => {
    if (aspectRatio === '16:9') {
      return quality === '1080p' ? { width: 1920, height: 1080 } : { width: 1280, height: 720 };
    } else {
      // 9:16 vertical
      return quality === '1080p' ? { width: 1080, height: 1920 } : { width: 720, height: 1280 };
    }
  };

  const handleStartRender = async () => {
    if (!audioRef.current) return;
    setIsRendering(true);
    setProgress(0);
    setExportedVideoUrl(null);
    setExportedBlob(null);
    setRenderStatus('Initializing canvas engine & preloading scene visuals...');

    const resConfig = getResolutionDimensions();

    try {
      setRenderStatus(`Rendering ${aspectRatio} video (${effectiveDuration.toFixed(1)}s) with burned lyrics...`);
      const result = await renderVideoToBlob(
        audioRef.current,
        totalDuration,
        scenes,
        lyrics,
        story,
        { ...settings, aspectRatio },
        resConfig,
        (percent, currTime) => {
          setProgress(percent);
          setRenderStatus(`Rendering: ${percent}% • Time: ${formatTime(currTime, true)}`);
        },
        { startTime: effectiveStart, endTime: effectiveEnd }
      );

      setExportedVideoUrl(result.url);
      setExportedBlob(result.blob);
      setExportedFormat(result.format);
      setIsRendering(false);
      setRenderStatus('Video render complete!');

      if (onRenderComplete) {
        onRenderComplete({
          url: result.url,
          blob: result.blob,
          format: result.format,
          duration: effectiveDuration,
          aspectRatio,
        });
      }
    } catch (err: any) {
      console.error('Rendering error:', err);
      setIsRendering(false);
      setRenderStatus(`Rendering failed: ${err.message || 'Unknown error'}`);
    }
  };

  const handleDownloadVideo = () => {
    if (!exportedVideoUrl) return;
    const cleanTitle = (story?.title || 'Song').replace(/[^a-zA-Z0-9_-]/g, '_');
    const aspectSuffix = aspectRatio === '9:16' ? '_Shorts_9x16' : '_16x9';
    const a = document.createElement('a');
    a.href = exportedVideoUrl;
    a.download = `${cleanTitle}${aspectSuffix}_7clouds_Lyric_Video.${exportedFormat}`;
    a.click();
  };

  // Direct YouTube Upload
  const handleUploadToYouTube = async () => {
    setIsUploadingToYt(true);
    setYtUploadSuccess(null);

    try {
      // Convert video blob to base64 if available
      let videoBase64 = '';
      if (exportedBlob) {
        const buffer = await exportedBlob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        videoBase64 = btoa(binary);
      }

      const res = await fetch('/api/youtube-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: ytTitle,
          description: ytDescription,
          tags: ytTags.split(',').map((t) => t.trim()),
          privacy: ytPrivacy,
          videoBase64,
        }),
      });

      if (!res.ok) throw new Error('YouTube upload failed');
      const data = await res.json();
      setYtUploadSuccess({
        videoUrl: data.videoUrl,
        videoId: data.videoId,
      });
    } catch (err: any) {
      console.error('Upload error:', err);
      alert(`YouTube Upload note: ${err.message || 'Please use YouTube Studio quick-publish'}`);
    } finally {
      setIsUploadingToYt(false);
    }
  };

  const openYouTubeStudio = () => {
    // Open YouTube upload dashboard
    window.open('https://studio.youtube.com/channel/upload', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isRendering}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Film className="w-3.5 h-3.5" />
            7clouds Publishing Studio
          </div>
          <h3 className="text-2xl font-black text-white">
            Export Video or Upload Straight to YouTube
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm">
            Configure your video format (16:9 Landscape vs 9:16 Shorts), clip duration (Whole song, 30s, 60s),
            and choose whether to download the finished MP4 or upload to YouTube.
          </p>
        </div>

        {/* Main Format & Timing Configuration Box */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Aspect Ratio Selector */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-indigo-400" />
                Aspect Ratio
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    aspectRatio === '16:9'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs text-white">16:9 Landscape</div>
                  <div className="text-[10px] text-slate-400">YouTube Video / TV</div>
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    aspectRatio === '9:16'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs text-white">9:16 Vertical</div>
                  <div className="text-[10px] text-slate-400">YouTube Shorts / Reels</div>
                </button>
              </div>
            </div>

            {/* 2. Video Duration Selector */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                Video Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDurationMode('full')}
                  className={`py-2 px-1 rounded-xl border text-center text-xs font-bold cursor-pointer transition-all ${
                    durationMode === 'full'
                      ? 'bg-purple-600/20 border-purple-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Whole Song
                </button>
                <button
                  type="button"
                  onClick={() => setDurationMode('30s')}
                  className={`py-2 px-1 rounded-xl border text-center text-xs font-bold cursor-pointer transition-all ${
                    durationMode === '30s'
                      ? 'bg-purple-600/20 border-purple-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  30 Seconds
                </button>
                <button
                  type="button"
                  onClick={() => setDurationMode('60s')}
                  className={`py-2 px-1 rounded-xl border text-center text-xs font-bold cursor-pointer transition-all ${
                    durationMode === '60s'
                      ? 'bg-purple-600/20 border-purple-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  60 Seconds
                </button>
              </div>

              <div className="text-[11px] text-slate-400 mt-2 font-mono flex justify-between">
                <span>Selected Duration:</span>
                <span className="text-purple-300 font-bold">{effectiveDuration.toFixed(1)} seconds</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selector: Download MP4 vs Upload to YouTube */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActionTab('download')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all flex items-center justify-center gap-2 ${
              actionTab === 'download'
                ? 'border-indigo-500 text-white bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            Option 1: Download MP4 Video
          </button>
          <button
            onClick={() => setActionTab('youtube')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all flex items-center justify-center gap-2 ${
              actionTab === 'youtube'
                ? 'border-rose-500 text-white bg-rose-500/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4 text-rose-400" />
            Option 2: Upload to YouTube
          </button>
        </div>

        {/* TAB 1: Download MP4 Finished Video */}
        {actionTab === 'download' && (
          <div className="space-y-4">
            {!isRendering && !exportedVideoUrl && (
              <div className="space-y-4">
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Resolution:</span>
                    <span className="text-white font-mono">{aspectRatio === '16:9' ? '1920 × 1080 (16:9)' : '1080 × 1920 (9:16 Shorts)'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Export Duration:</span>
                    <span className="text-white font-mono">{effectiveDuration.toFixed(1)} seconds ({durationMode})</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Burned Lyrics:</span>
                    <span className="text-indigo-400 font-mono">7clouds Halo Typography + Sync</span>
                  </div>
                </div>

                <button
                  onClick={handleStartRender}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Film className="w-4 h-4" />
                  <span>Render & Burn Lyrics ({aspectRatio} • {durationMode})</span>
                </button>
              </div>
            )}

            {isRendering && (
              <div className="py-6 text-center space-y-4">
                <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
                <div className="text-3xl font-black text-white font-mono">{progress}%</div>
                <p className="text-xs text-slate-400">{renderStatus}</p>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {exportedVideoUrl && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-semibold">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Your video is ready with burned timestamp lyrics!</span>
                </div>

                <div className={`mx-auto bg-black rounded-xl overflow-hidden border border-slate-800 shadow-xl ${aspectRatio === '16:9' ? 'aspect-video w-full' : 'aspect-[9/16] w-56'}`}>
                  <video src={exportedVideoUrl} controls autoPlay className="w-full h-full object-contain" />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleDownloadVideo}
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download MP4 Video</span>
                  </button>
                  <button
                    onClick={() => setExportedVideoUrl(null)}
                    className="px-4 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                  >
                    Render Again
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Upload Straight to YouTube */}
        {actionTab === 'youtube' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  YouTube Video Title
                </label>
                <input
                  type="text"
                  value={ytTitle}
                  onChange={(e) => setYtTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  YouTube Description
                </label>
                <textarea
                  value={ytDescription}
                  onChange={(e) => setYtDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Privacy Setting
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setYtPrivacy('public')}
                      className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        ytPrivacy === 'public' ? 'bg-rose-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Public
                    </button>
                    <button
                      type="button"
                      onClick={() => setYtPrivacy('unlisted')}
                      className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        ytPrivacy === 'unlisted' ? 'bg-rose-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Unlisted
                    </button>
                    <button
                      type="button"
                      onClick={() => setYtPrivacy('private')}
                      className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        ytPrivacy === 'private' ? 'bg-rose-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Private
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    YouTube Tags
                  </label>
                  <input
                    type="text"
                    value={ytTags}
                    onChange={(e) => setYtTags(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Direct Google Cloud & YouTube Portal Buttons */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-rose-400" />
                  <span>Where to get YouTube Client ID &amp; Secret:</span>
                </span>
                {onOpenCredentialsHub && (
                  <button
                    type="button"
                    onClick={onOpenCredentialsHub}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold underline cursor-pointer"
                  >
                    Open Credentials Hub
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                You can generate OAuth credentials in Google Cloud Console, or upload in seconds via YouTube Studio:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <span>Google Cloud Credentials</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  <span>Enable YouTube API v3</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://studio.youtube.com/channel/upload"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
                >
                  <span>YouTube Studio (Zero Setup)</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>

            {ytUploadSuccess && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>YouTube Publishing Package Ready!</span>
                </div>
                <p className="text-xs text-slate-300">
                  Video ID: <span className="font-mono text-white">{ytUploadSuccess.videoId}</span>
                </p>
                <a
                  href={ytUploadSuccess.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:underline font-bold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View on YouTube
                </a>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleUploadToYouTube}
                disabled={isUploadingToYt}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isUploadingToYt ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>Upload Straight to YouTube</span>
              </button>

              <button
                onClick={openYouTubeStudio}
                className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-slate-400" />
                <span>Open YouTube Studio</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
