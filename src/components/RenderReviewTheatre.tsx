import React, { useState } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  Film,
  ExternalLink,
  FileText,
  Sparkles,
  Smartphone,
  Tv,
  Share2,
  Image as ImageIcon,
  Tag,
  MessageSquare,
  TrendingUp,
  Eye,
  Check,
  Copy,
} from 'lucide-react';
import { AspectRatio, StoryTreatment, TimestampLine, VideoStyleSettings } from '../types';
import { exportToLRC, exportToSRT } from '../utils/subtitles';

interface RenderReviewTheatreProps {
  videoUrl: string;
  videoBlob: Blob | null;
  videoFormat: string;
  aspectRatio: AspectRatio;
  duration: number;
  story: StoryTreatment | null;
  lyrics: TimestampLine[];
  songTitle?: string;
  artistName?: string;
  settings?: VideoStyleSettings;
  thumbnailUrl?: string;
  onReRender: () => void;
  onUploadToYouTube: () => void;
  onOpenChat?: () => void;
  onOpenVidIq?: () => void;
}

export const RenderReviewTheatre: React.FC<RenderReviewTheatreProps> = ({
  videoUrl,
  videoBlob,
  videoFormat,
  aspectRatio,
  duration,
  story,
  lyrics,
  songTitle = 'How to Save a Life',
  artistName = 'The Fray',
  settings,
  thumbnailUrl,
  onReRender,
  onUploadToYouTube,
  onOpenChat,
  onOpenVidIq,
}) => {
  const [downloaded, setDownloaded] = useState(false);
  const [copiedMetadata, setCopiedMetadata] = useState(false);
  const [activeTab, setActiveTab] = useState<'video' | 'metadata'>('video');

  const activeThumbnail = thumbnailUrl || settings?.thumbnailUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&q=80';
  const youtubeTitle = `${artistName} - ${songTitle} (Lyrics)`;
  const tagsList = ['7clouds', songTitle.toLowerCase(), `${artistName.toLowerCase()} lyrics`, 'sad songs', 'music video', 'official lyrics'];

  const handleDownload = () => {
    const cleanTitle = (songTitle || 'Song').replace(/[^a-zA-Z0-9_-]/g, '_');
    const aspectSuffix = aspectRatio === '9:16' ? '_Shorts_9x16' : '_16x9';
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `${cleanTitle}${aspectSuffix}_7clouds_Lyric_Video.${videoFormat}`;
    a.click();
    setDownloaded(true);
  };

  const downloadSRT = () => {
    const srt = exportToSRT(lyrics);
    const blob = new Blob([srt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${songTitle || 'Song'}_lyrics.srt`;
    a.click();
  };

  const downloadLRC = () => {
    const lrc = exportToLRC(lyrics, songTitle, artistName);
    const blob = new Blob([lrc], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${songTitle || 'Song'}_lyrics.lrc`;
    a.click();
  };

  const handleCopyMetadata = () => {
    const metaText = `Title: ${youtubeTitle}\n\nTags: ${tagsList.join(', ')}\n\nDescription:\n🎵 ${youtubeTitle}\nProduced with 7clouds Video Studio & VidIQ MCP\n\nLyrics:\n${lyrics.slice(0, 10).map((l) => l.text).join('\n')}`;
    navigator.clipboard.writeText(metaText);
    setCopiedMetadata(true);
    setTimeout(() => setCopiedMetadata(false), 2500);
  };

  const isVertical = aspectRatio === '9:16';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              Render Complete • Post-Render Review Theatre
            </span>
          </div>
          <h3 className="text-xl font-black text-white mt-1">
            Review Rendered Video, Thumbnail & Metadata
          </h3>
          <p className="text-xs text-slate-400">
            Preview the burned 7clouds typography, split-second intro thumbnail, title, tags, and description.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onReRender}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Adjust & Re-Render</span>
          </button>
        </div>
      </div>

      {/* Main Review Theater Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Video Theatre Player */}
        <div className="lg:col-span-2 bg-black/90 rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-2xl flex flex-col items-center justify-center">
          <div
            className={`relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 ${
              isVertical ? 'aspect-[9/16] w-64 sm:w-80' : 'aspect-video w-full'
            }`}
          >
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain bg-black"
            />
          </div>

          {/* Quality specs badge row */}
          <div className="flex items-center gap-3 pt-4 text-xs text-slate-400 flex-wrap justify-center">
            <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              {isVertical ? <Smartphone className="w-3.5 h-3.5 text-indigo-400" /> : <Tv className="w-3.5 h-3.5 text-indigo-400" />}
              Format: <strong className="text-white">{aspectRatio}</strong>
            </span>
            <span className="bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              Duration: <strong className="text-white">{duration.toFixed(1)}s</strong>
            </span>
            <span className="bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              1st Frame: <strong className="text-cyan-400">Viral Thumbnail (0.25s)</strong>
            </span>
            <span className="bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              Container: <strong className="text-white uppercase">{videoFormat}</strong>
            </span>
          </div>
        </div>

        {/* Right Col: Thumbnail & Metadata Preview Card */}
        <div className="space-y-4">
          {/* Thumbnail preview */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                Viral Thumbnail (1st Split Second)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold">
                CTR Magnet
              </span>
            </div>

            <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 group bg-slate-950">
              <img
                src={activeThumbnail}
                alt="Viral Thumbnail Preview"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
                <span className="text-[11px] font-bold text-white uppercase drop-shadow-md">
                  {songTitle}
                </span>
                <span className="text-[10px] text-slate-300">
                  Flashes on Frame 0 for instant YouTube detection
                </span>
              </div>
            </div>
          </div>

          {/* YouTube Metadata Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                YouTube Title & SEO
              </span>
              <button
                onClick={handleCopyMetadata}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                {copiedMetadata ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedMetadata ? 'Copied' : 'Copy All'}
              </button>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Optimized Title:</span>
              <p className="font-semibold text-white mt-0.5 text-xs">{youtubeTitle}</p>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-xs space-y-1">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">VidIQ Tags:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {tagsList.slice(0, 5).map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] font-mono"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Action 1: Download MP4 File */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between gap-4 transition-all">
          <div className="space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
              <Download className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Download Finished Video File</h4>
            <p className="text-xs text-slate-400">
              Save the complete high-definition video file directly to your device with all burned-in timestamp lyrics, thumbnail intro flash, and synced audio.
            </p>
          </div>

          <button
            onClick={handleDownload}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{downloaded ? 'Downloaded! Click to Save Again' : `Download Video (.${videoFormat.toUpperCase()})`}</span>
          </button>
        </div>

        {/* Action 2: Upload Straight to YouTube */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-rose-500/40 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between gap-4 transition-all">
          <div className="space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-2">
              <Upload className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Upload Straight to YouTube</h4>
            <p className="text-xs text-slate-400">
              Publish directly to your YouTube channel as a standard Video or YouTube Short with optimized title, description, and tags.
            </p>
          </div>

          <button
            onClick={onUploadToYouTube}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Configure & Upload to YouTube</span>
          </button>
        </div>
      </div>

      {/* Subtitles & Extras */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <span>Need subtitle files for YouTube closed captions?</span>
        <div className="flex items-center gap-3">
          <button
            onClick={downloadSRT}
            className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" /> Download .SRT
          </button>
          <span>•</span>
          <button
            onClick={downloadLRC}
            className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" /> Download .LRC
          </button>
        </div>
      </div>
    </div>
  );
};
