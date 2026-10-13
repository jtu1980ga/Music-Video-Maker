import React, { useState } from 'react';
import {
  Video,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Camera,
  Wand2,
  TrendingUp,
  Copy,
  Check,
  Upload,
  Film,
  ExternalLink,
  Layers,
  FileText,
} from 'lucide-react';
import { ScenePrompt } from '../types';
import { formatTime } from '../utils/audioUtils';

interface ScenesStoryboardProps {
  scenes: ScenePrompt[];
  onUpdateScene: (sceneId: string, updated: Partial<ScenePrompt>) => void;
  onGenerateSceneVisual: (scene: ScenePrompt) => Promise<void>;
  onGenerateAllVisuals: () => Promise<void>;
  isGeneratingAll: boolean;
  onProceedToStudio: () => void;
  onProceedToVidIq?: () => void;
}

export const ScenesStoryboard: React.FC<ScenesStoryboardProps> = ({
  scenes,
  onUpdateScene,
  onGenerateSceneVisual,
  onGenerateAllVisuals,
  isGeneratingAll,
  onProceedToStudio,
  onProceedToVidIq,
}) => {
  const [copiedSceneId, setCopiedSceneId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showFlowGuide, setShowFlowGuide] = useState(false);

  const completedFramesCount = scenes.filter((s) => s.imageUrl || s.userVideoUrl).length;
  const progressPercent = scenes.length ? Math.round((completedFramesCount / scenes.length) * 100) : 0;

  // Copy single scene prompt for Google Flow / Veo
  const handleCopyPrompt = (scene: ScenePrompt) => {
    const promptText = `Scene ${scene.sceneNumber} (${formatTime(scene.startTime)} - ${formatTime(scene.endTime)}): ${scene.videoPrompt}\nCamera Motion: ${scene.cameraMotion}\nLighting: ${scene.lighting}\nMood: ${scene.mood}`;
    navigator.clipboard.writeText(promptText);
    setCopiedSceneId(scene.id);
    setTimeout(() => setCopiedSceneId(null), 2500);
  };

  // Copy all 10-second scene prompts at once (Prompt Deck)
  const handleCopyAllPrompts = () => {
    const fullDeck = scenes
      .map(
        (s) =>
          `=== SCENE ${s.sceneNumber} [${formatTime(s.startTime)} - ${formatTime(s.endTime)}] ===\nPrompt: ${s.videoPrompt}\nCamera: ${s.cameraMotion}\nLighting: ${s.lighting}\nLyrics: "${s.lyricsExcerpt}"\n`
      )
      .join('\n\n');
    navigator.clipboard.writeText(fullDeck);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // User uploads their own video clip or image for a 10s scene
  const handleUserUploadClip = (sceneId: string, file: File) => {
    const fileUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video');

    onUpdateScene(sceneId, {
      userVideoUrl: fileUrl,
      userVideoFileName: file.name,
      imageUrl: isVideo ? undefined : fileUrl,
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
              Step 3 • 10-Second Google Flow Storyboard
            </span>
            <span className="text-xs text-slate-400">
              {completedFramesCount} of {scenes.length} Scenes Ready ({progressPercent}%)
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">
            Google Flow / Veo Video Scene Prompts
          </h3>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Copy All Prompts Button */}
          <button
            onClick={handleCopyAllPrompts}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Copy all 10-second prompts to paste into Google Flow, Veo, Sora, or Runway"
          >
            {copiedAll ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">All Prompts Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-indigo-400" />
                <span>Copy All 10s Prompts</span>
              </>
            )}
          </button>

          {/* AI Generate All Visuals */}
          <button
            onClick={onGenerateAllVisuals}
            disabled={isGeneratingAll}
            className="px-4 py-2.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-800/80 text-indigo-200 font-semibold text-xs border border-indigo-500/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isGeneratingAll ? (
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
            ) : (
              <Wand2 className="w-4 h-4 text-indigo-400" />
            )}
            {isGeneratingAll ? 'Generating Frames...' : 'AI Generate All Scenes'}
          </button>

          <button
            onClick={onProceedToVidIq || onProceedToStudio}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-xs tracking-wide uppercase transition-all shadow-lg shadow-blue-600/25 flex items-center gap-2 cursor-pointer"
          >
            <TrendingUp className="w-4 h-4 text-cyan-300" />
            <span>VidIQ YouTube SEO</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Google Flow / External Creation Explanation Card */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 p-4 rounded-2xl border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <span>Google Flow & Manual Video Workflow</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Flexible AI / Self-Made
              </span>
            </div>
            <p className="text-slate-400 mt-0.5">
              Each scene is timed to 10-second cinematic intervals. You can let AI render the visual frames directly, or click <span className="text-indigo-300 font-semibold">Copy Prompt</span> to generate videos in Google Flow / Veo / Sora, and re-upload your clips below!
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowFlowGuide(!showFlowGuide)}
          className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold underline underline-offset-2 self-start sm:self-center cursor-pointer whitespace-nowrap"
        >
          {showFlowGuide ? 'Hide Instructions' : 'How Google Flow works'}
        </button>
      </div>

      {/* Guide details if expanded */}
      {showFlowGuide && (
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-xs space-y-3 text-slate-300">
          <h4 className="font-bold text-white text-sm">Two Easy Ways to Produce Your 10-Second Scenes:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <span className="font-bold text-indigo-400">Method 1: Fully Automated AI Generation</span>
              <p className="text-slate-400">
                Click <strong>"AI Generate All Scenes"</strong> or individual <strong>"Render Frame"</strong> buttons. The built-in Google Gemini image/video model will generate high-fidelity 7clouds cinematic visuals for each scene automatically.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <span className="font-bold text-purple-400">Method 2: Google Flow / External Tool & Re-Upload</span>
              <p className="text-slate-400">
                1. Click <strong>"Copy Prompt"</strong> on any scene (or <strong>"Copy All 10s Prompts"</strong>).<br />
                2. Paste into Google Flow / Veo / Runway.<br />
                3. Download the generated video/image and click <strong>"Upload My Video Clip"</strong> on that scene card to attach it to your final lyric video!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center gap-4">
        <div className="flex-1 bg-slate-950 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-xs font-mono text-slate-400">{progressPercent}% Ready</span>
      </div>

      {/* Scenes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {scenes.map((scene) => {
          const isCopied = copiedSceneId === scene.id;
          const hasUserVideo = !!scene.userVideoUrl;

          return (
            <div
              key={scene.id}
              className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden backdrop-blur-md transition-all flex flex-col justify-between"
            >
              {/* Visual Frame Banner / Preview */}
              <div className="relative aspect-video bg-slate-950 overflow-hidden group">
                {hasUserVideo ? (
                  <video
                    src={scene.userVideoUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : scene.imageUrl ? (
                  <img
                    src={scene.imageUrl}
                    alt={`Scene ${scene.sceneNumber}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-950/80">
                    <ImageIcon className="w-10 h-10 text-slate-700 mb-2" />
                    <p className="text-xs text-slate-500 max-w-xs">
                      No visual frame yet. Render with AI or upload your own Google Flow video clip.
                    </p>
                  </div>
                )}

                {/* Badges on frame */}
                <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white font-mono text-xs font-bold border border-white/10">
                    Scene {scene.sceneNumber.toString().padStart(2, '0')}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-indigo-300 font-mono text-xs border border-white/10">
                    {formatTime(scene.startTime)} - {formatTime(scene.endTime)} ({scene.duration}s)
                  </span>
                  {hasUserVideo && (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/80 backdrop-blur-md text-white text-[10px] font-bold">
                      Custom Video
                    </span>
                  )}
                </div>

                {/* Camera Motion tag */}
                <div className="absolute bottom-3 left-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-slate-300 text-[11px] border border-white/10">
                    <Camera className="w-3 h-3 text-amber-400" />
                    {scene.cameraMotion}
                  </span>
                </div>

                {/* Re-generate button on frame */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyPrompt(scene)}
                    className="p-2 rounded-lg bg-black/80 hover:bg-slate-800 text-white transition-colors border border-white/10 shadow-lg cursor-pointer"
                    title="Copy 10-second prompt for Google Flow / Veo"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-indigo-300" />
                    )}
                  </button>

                  <button
                    onClick={() => onGenerateSceneVisual(scene)}
                    disabled={scene.isGenerating}
                    className="p-2 rounded-lg bg-black/80 hover:bg-indigo-600 text-white transition-colors border border-white/10 shadow-lg cursor-pointer disabled:opacity-50"
                    title="Generate/Refresh visual frame with Google AI"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${scene.isGenerating ? 'animate-spin text-indigo-400' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Scene details & prompt editor */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Lyric in this window */}
                  {scene.lyricsExcerpt && (
                    <div className="bg-indigo-950/20 border border-indigo-500/20 p-2.5 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-indigo-400 block tracking-wider">
                        Sung Lyrics in this 10s Window:
                      </span>
                      <p className="text-xs text-white font-medium italic mt-0.5">
                        "{scene.lyricsExcerpt}"
                      </p>
                    </div>
                  )}

                  {/* Narrative Beat */}
                  <div>
                    <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                      Narrative Story Beat
                    </label>
                    <textarea
                      value={scene.narrativeBeat}
                      onChange={(e) => onUpdateScene(scene.id, { narrativeBeat: e.target.value })}
                      rows={2}
                      className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Google Flow / Veo Prompt */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5" />
                        Google Flow / Veo 10s Video Prompt
                      </label>

                      <button
                        onClick={() => handleCopyPrompt(scene)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Prompt</span>
                          </>
                        )}
                      </button>
                    </div>

                    <textarea
                      value={scene.videoPrompt}
                      onChange={(e) => onUpdateScene(scene.id, { videoPrompt: e.target.value })}
                      rows={3}
                      className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs font-mono text-slate-300 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Bottom Action Row: Upload Custom Video or Generate Frame */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
                  {/* Upload my own video clip */}
                  <label className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-purple-400" />
                    <span>{hasUserVideo ? 'Replace Video Clip' : 'Upload Video Clip'}</span>
                    <input
                      type="file"
                      accept="video/*,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUserUploadClip(scene.id, file);
                      }}
                    />
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">
                      Mood: <span className="text-slate-400">{scene.mood}</span>
                    </span>
                    <button
                      onClick={() => onGenerateSceneVisual(scene)}
                      disabled={scene.isGenerating}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      {scene.isGenerating ? 'Rendering...' : 'Render with AI'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
