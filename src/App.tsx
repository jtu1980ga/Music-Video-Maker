import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Music,
  FileText,
  Film,
  Clapperboard,
  Video,
  Download,
  Check,
  AlertCircle,
  TrendingUp,
  Upload,
  Bot,
  RotateCcw,
  Key,
  Smartphone,
} from 'lucide-react';
import {
  AudioTrackInfo,
  TimestampLine,
  StoryTreatment,
  ScenePrompt,
  VideoStyleSettings,
  AspectRatio,
  VideoDurationMode,
} from './types';
import { AudioUploader } from './components/AudioUploader';
import { LyricsEditor } from './components/LyricsEditor';
import { StoryGenerator } from './components/StoryGenerator';
import { ScenesStoryboard } from './components/ScenesStoryboard';
import { StyleControls } from './components/StyleControls';
import { VideoPreviewPlayer } from './components/VideoPreviewPlayer';
import { ExportModal } from './components/ExportModal';
import { VidIqSuite } from './components/VidIqSuite';
import { AiDirectorChat } from './components/AiDirectorChat';
import { RenderReviewTheatre } from './components/RenderReviewTheatre';
import { VidIqKeyModal } from './components/VidIqKeyModal';
import { MobileUploadPortal } from './components/MobileUploadPortal';
import { CredentialsHubModal } from './components/CredentialsHubModal';

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [audioInfo, setAudioInfo] = useState<AudioTrackInfo | null>(null);
  const [lyrics, setLyrics] = useState<TimestampLine[]>([]);
  const [songTitle, setSongTitle] = useState<string>('How to Save a Life');
  const [artistName, setArtistName] = useState<string>('The Fray');
  const [story, setStory] = useState<StoryTreatment | null>(null);
  const [scenes, setScenes] = useState<ScenePrompt[]>([]);
  const [durationMode, setDurationMode] = useState<VideoDurationMode>('full');

  // Loading states
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isLoadingStory, setIsLoadingStory] = useState(false);
  const [isLoadingScenes, setIsLoadingScenes] = useState(false);
  const [isGeneratingAllFrames, setIsGeneratingAllFrames] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Rendered video post-review state
  const [renderedVideoData, setRenderedVideoData] = useState<{
    url: string;
    blob: Blob | null;
    format: string;
    duration: number;
    aspectRatio: AspectRatio;
  } | null>(null);

  // Export Modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  // VidIQ MCP Key Modal state
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  // All-in-One Credentials & API Keys Hub state
  const [isCredentialsHubOpen, setIsCredentialsHubOpen] = useState(false);
  const [credentialsHubTab, setCredentialsHubTab] = useState<'all' | 'whisper' | 'vidiq' | 'youtube'>('all');
  // Dedicated Mobile Upload View (e.g., when scanned via phone QR code)
  const [isMobileUploadView, setIsMobileUploadView] = useState(() => {
    return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === 'mobile-upload';
  });

  // Audio element reference for master playback & canvas sync
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 7clouds Video Style Settings
  const [styleSettings, setStyleSettings] = useState<VideoStyleSettings>({
    preset: '7clouds_classic',
    fontFamily: 'Montserrat',
    fontSize: 42,
    textPosition: 'center',
    textColor: '#FFFFFF',
    glowColor: 'rgba(255, 255, 255, 0.45)',
    glowIntensity: 24,
    karaokeHighlight: true,
    backgroundDim: 45,
    floatingParticles: true,
    particleSpeed: 1.0,
    filmGrain: true,
    kenBurnsEffect: true,
    showTitleCard: true,
    titleCardDuration: 4.5,
    showWatermark: true,
    watermarkText: '7clouds Lyrics',
    aspectRatio: '16:9',
    flashThumbnailIntro: true,
    thumbnailFlashDuration: 0.25,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&q=80',
    showChordsInVideo: false,
  });

  // Whisper API (Groq) key state
  const [whisperApiKey, setWhisperApiKey] = useState(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('whisper_gsk_key') || '') : '';
  });
  const [isHighDemandActive, setIsHighDemandActive] = useState(false);

  const handleWhisperKeyChange = (key: string) => {
    setWhisperApiKey(key);
    if (typeof window !== 'undefined') {
      localStorage.setItem('whisper_gsk_key', key);
    }
  };

  // Step 1: Transcribe Audio with Whisper API (gsk_ key) or Gemini AI
  const handleTranscribe = async (engine: 'gemini' | 'whisper' = 'whisper') => {
    if (!audioInfo?.base64Data) {
      setErrorMessage('Please upload or generate an audio track first.');
      return;
    }

    setIsTranscribing(true);
    setErrorMessage(null);
    setIsHighDemandActive(false);

    try {
      const res = await fetch('/api/transcribe-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: audioInfo.base64Data,
          mimeType: audioInfo.mimeType,
          duration: audioInfo.duration,
          whisperApiKey: whisperApiKey.trim(),
          engine,
          hintTitle: songTitle,
          hintArtist: artistName,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.isHighDemand || data.requiresWhisperKey) {
          setIsHighDemandActive(true);
        }
        throw new Error(data.error || `HTTP error ${res.status}`);
      }

      setLyrics(data.lines || []);
      if (data.title) setSongTitle(data.title);
      if (data.artist) setArtistName(data.artist);

      setCurrentStep(2);
    } catch (err: any) {
      console.error('Transcription error:', err);
      setErrorMessage(err.message || 'Failed to transcribe lyrics. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  // Instant 1-Click Load: The Fray (7clouds Stylings) Official Lyric Stems
  const handleLoadOfficialPresetLyrics = async () => {
    setIsTranscribing(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/parse-custom-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawLyrics: 'the_fray_preset',
          duration: audioInfo?.duration || 76,
          title: 'How to Save a Life',
          artist: 'The Fray',
        }),
      });
      const data = await res.json();
      setLyrics(data.lines || []);
      setSongTitle(data.title || 'How to Save a Life');
      setArtistName(data.artist || 'The Fray');
      setCurrentStep(2);
    } catch (err: any) {
      console.error('Preset error:', err);
      setErrorMessage('Failed to load official preset.');
    } finally {
      setIsTranscribing(false);
    }
  };

  // Step 2 -> 3: Generate Story based on Timestamp Lyrics
  const handleGenerateStory = async (customMood?: string) => {
    setIsLoadingStory(true);
    setErrorMessage(null);

    try {
      const lyricsText = lyrics
        .map((l) => `[${l.startTime.toFixed(1)}s - ${l.endTime.toFixed(1)}s] ${l.text}`)
        .join('\n');

      const res = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lyricsText,
          title: songTitle,
          artist: artistName,
          duration: audioInfo?.duration || 60,
          customMood,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate screenplay');
      const data = await res.json();
      setStory(data);
      setCurrentStep(3);
    } catch (err: any) {
      console.error('Story error:', err);
      setErrorMessage(err.message || 'Failed to generate story.');
    } finally {
      setIsLoadingStory(false);
    }
  };

  // Step 3 -> 4: Split Story into 10-Second Scene Prompts
  const handleGenerateScenes = async () => {
    if (!story) return;
    setIsLoadingScenes(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/generate-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story,
          lyrics,
          duration: audioInfo?.duration || 60,
        }),
      });

      if (!res.ok) throw new Error('Failed to create 10-second scene prompts');
      const data = await res.json();
      setScenes(data);
      setCurrentStep(4);
    } catch (err: any) {
      console.error('Scenes error:', err);
      setErrorMessage(err.message || 'Failed to split scenes.');
    } finally {
      setIsLoadingScenes(false);
    }
  };

  // Step 4: Generate visual frame for single scene
  const handleGenerateSceneVisual = async (targetScene: ScenePrompt) => {
    setScenes((prev) =>
      prev.map((s) => (s.id === targetScene.id ? { ...s, isGenerating: true } : s))
    );

    try {
      const res = await fetch('/api/generate-scene-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoPrompt: targetScene.videoPrompt,
          visualStyle: story?.visualStyle,
          mood: targetScene.mood,
          sceneNumber: targetScene.sceneNumber,
        }),
      });

      if (!res.ok) throw new Error('Failed to render frame visual');
      const data = await res.json();

      setScenes((prev) =>
        prev.map((s) =>
          s.id === targetScene.id ? { ...s, imageUrl: data.imageUrl, isGenerating: false } : s
        )
      );
    } catch (err: any) {
      console.error('Frame error:', err);
      setScenes((prev) =>
        prev.map((s) => (s.id === targetScene.id ? { ...s, isGenerating: false } : s))
      );
    }
  };

  // Step 4: Generate visual frames for all scenes sequentially
  const handleGenerateAllVisuals = async () => {
    setIsGeneratingAllFrames(true);
    for (const scene of scenes) {
      if (!scene.imageUrl) {
        await handleGenerateSceneVisual(scene);
      }
    }
    setIsGeneratingAllFrames(false);
  };

  // AI Copilot State Edit Handlers
  const handleApplyStyleEdit = (updatedStyle: Partial<VideoStyleSettings>) => {
    setStyleSettings((prev) => ({ ...prev, ...updatedStyle }));
  };

  const handleApplySceneEdit = (sceneNumber: number, updatedScene: Partial<ScenePrompt>) => {
    setScenes((prev) =>
      prev.map((s) => (s.sceneNumber === sceneNumber ? { ...s, ...updatedScene } : s))
    );
  };

  const steps = [
    { num: 1, label: 'Upload Audio', icon: Music },
    { num: 2, label: 'Timestamp Lyrics', icon: FileText },
    { num: 3, label: 'Video Story', icon: Film },
    { num: 4, label: '10s Scene Prompts', icon: Clapperboard },
    { num: 5, label: 'VidIQ YouTube SEO', icon: TrendingUp },
    { num: 6, label: '7clouds Studio & Export', icon: Video },
  ];

  if (isMobileUploadView) {
    return (
      <MobileUploadPortal
        onBackToApp={() => {
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/');
          }
          setIsMobileUploadView(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-16">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
                7clouds <span className="text-indigo-400 font-medium">Video Studio</span>
              </h1>
              <p className="text-[10px] text-slate-400 -mt-0.5">
                AI Copilot • Pre/Post Preview • VidIQ SEO • 16:9 & 9:16 Shorts • YouTube Direct Upload
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileUploadView(true)}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 font-semibold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              title="Open mobile upload portal outside work network"
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Phone Upload Portal</span>
            </button>

            <button
              onClick={() => {
                setCredentialsHubTab('all');
                setIsCredentialsHubOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/15 via-cyan-500/15 to-rose-500/15 hover:from-amber-500/25 hover:to-rose-500/25 border border-amber-500/30 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ring-1 ring-white/10"
              title="Open API Keys & Portals (Groq Whisper, VidIQ, YouTube)"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Keys &amp; Portals</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </button>

            <button
              onClick={() => setIsKeyModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 font-semibold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              title="Configure or enter VidIQ API Key & inspect MCP status"
            >
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">vidIQ MCP</span>
            </button>

            {/* Direct Export Shortcut if scenes ready */}
            {scenes.length > 0 && lyrics.length > 0 && (
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export / YouTube Upload</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Stepper Wizard Bar */}
      <div className="max-w-5xl mx-auto px-4 w-full mt-6 mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 bg-slate-800 z-0" />
          {steps.map((st) => {
            const Icon = st.icon;
            const isCompleted = currentStep > st.num;
            const isActive = currentStep === st.num;
            const isAccessible =
              st.num === 1 ||
              (st.num === 2 && lyrics.length > 0) ||
              (st.num === 3 && story !== null) ||
              (st.num === 4 && scenes.length > 0) ||
              (st.num === 5 && scenes.length > 0) ||
              (st.num === 6 && scenes.length > 0);

            return (
              <button
                key={st.num}
                onClick={() => isAccessible && setCurrentStep(st.num)}
                disabled={!isAccessible}
                className={`relative z-10 flex flex-col items-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed ${
                  isActive ? 'scale-105' : ''
                }`}
              >
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm border transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/40 ring-4 ring-indigo-500/20'
                      : isCompleted
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 text-white" /> : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className={`text-[10px] sm:text-[11px] font-semibold hidden md:block ${
                    isActive ? 'text-indigo-400' : isCompleted ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {st.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error alert banner */}
      {errorMessage && (
        <div className="max-w-4xl mx-auto px-4 w-full mb-6">
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{errorMessage}</span>
            </div>
            <div className="flex items-center gap-2">
              {isHighDemandActive && (
                <button
                  onClick={() => handleTranscribe('whisper')}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/30 cursor-pointer"
                >
                  ⚡ Transcribe via Whisper API (gsk_ Key)
                </button>
              )}
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-400 hover:text-white text-xs underline font-medium px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Step Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        {currentStep === 1 && (
          <AudioUploader
            onAudioLoaded={setAudioInfo}
            onTranscribe={handleTranscribe}
            isLoading={isTranscribing}
            audioInfo={audioInfo}
            audioRef={audioRef}
            whisperApiKey={whisperApiKey}
            onWhisperKeyChange={handleWhisperKeyChange}
            onLoadOfficialPresetLyrics={handleLoadOfficialPresetLyrics}
            isHighDemand={isHighDemandActive}
            onSongDetailsChange={(t, a) => {
              setSongTitle(t);
              setArtistName(a);
            }}
          />
        )}

        {currentStep === 2 && (
          <LyricsEditor
            lines={lyrics}
            onLinesChange={setLyrics}
            title={songTitle}
            artist={artistName}
            audioRef={audioRef}
            onProceedToStory={() => handleGenerateStory()}
            isLoadingStory={isLoadingStory}
            audioBase64={audioInfo?.base64Data}
            mimeType={audioInfo?.mimeType}
            duration={audioInfo?.duration}
          />
        )}

        {currentStep === 3 && story && (
          <StoryGenerator
            story={story}
            onUpdateStory={setStory}
            onRegenerateStory={(mood) => handleGenerateStory(mood)}
            isRegenerating={isLoadingStory}
            onProceedToScenes={handleGenerateScenes}
            isLoadingScenes={isLoadingScenes}
          />
        )}

        {currentStep === 4 && (
          <ScenesStoryboard
            scenes={scenes}
            onUpdateScene={(id, updated) =>
              setScenes((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)))
            }
            onGenerateSceneVisual={handleGenerateSceneVisual}
            onGenerateAllVisuals={handleGenerateAllVisuals}
            isGeneratingAll={isGeneratingAllFrames}
            onProceedToStudio={() => setCurrentStep(6)}
            onProceedToVidIq={() => setCurrentStep(5)}
          />
        )}

        {currentStep === 5 && (
          <div className="space-y-6">
            <VidIqSuite
              songTitle={songTitle}
              artistName={artistName}
              story={story}
              lyrics={lyrics}
              onTitleSelect={(newTitle) => setSongTitle(newTitle)}
              onThumbnailSelect={(url) => setStyleSettings((prev) => ({ ...prev, thumbnailUrl: url }))}
              aspectRatio={styleSettings.aspectRatio}
            />

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setCurrentStep(6)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
              >
                <span>Proceed to 7clouds Video Studio & Preview</span>
                <Video className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-8">
            {/* If Video Has Been Rendered, Show Post-Render Review Theatre */}
            {renderedVideoData ? (
              <RenderReviewTheatre
                videoUrl={renderedVideoData.url}
                videoBlob={renderedVideoData.blob}
                videoFormat={renderedVideoData.format}
                aspectRatio={renderedVideoData.aspectRatio}
                duration={renderedVideoData.duration}
                story={story}
                lyrics={lyrics}
                songTitle={songTitle}
                artistName={artistName}
                settings={styleSettings}
                thumbnailUrl={styleSettings.thumbnailUrl}
                onReRender={() => setRenderedVideoData(null)}
                onUploadToYouTube={() => setIsExportModalOpen(true)}
              />
            ) : (
              /* Pre-Render Studio: Live Canvas Preview + AI Director Chat Copilot + Style Controls */
              <div className="space-y-8">
                {/* Pre-Render Interactive Player */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 backdrop-blur-md">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Pre-Render Live Studio Preview (Real-Time 60fps)
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400">
                      Scrub, test typography, and preview before burning
                    </span>
                  </div>

                  <VideoPreviewPlayer
                    audioRef={audioRef}
                    totalDuration={audioInfo?.duration || 60}
                    scenes={scenes}
                    lyrics={lyrics}
                    story={story}
                    settings={styleSettings}
                    onOpenExportModal={() => setIsExportModalOpen(true)}
                  />
                </div>

                {/* AI Video Director Copilot Chat section */}
                <AiDirectorChat
                  currentVideoState={{
                    styleSettings,
                    story,
                    scenes,
                    lyrics,
                    songTitle,
                    artistName,
                    durationMode,
                  }}
                  onApplyStyleEdit={handleApplyStyleEdit}
                  onApplySceneEdit={handleApplySceneEdit}
                  onApplyDurationMode={setDurationMode}
                  onApplyTitleEdit={setSongTitle}
                />

                {/* Style Controls with Aspect Ratio & Presets */}
                <StyleControls
                  settings={styleSettings}
                  onChange={setStyleSettings}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Export MP4 & YouTube Upload Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        audioRef={audioRef}
        totalDuration={audioInfo?.duration || 60}
        scenes={scenes}
        lyrics={lyrics}
        story={story}
        settings={styleSettings}
        defaultTitle={`${artistName} - ${songTitle} (Lyrics)`}
        defaultDescription={`🎵 ${songTitle} - ${artistName} (Lyrics)\nProduced with 7clouds Video Studio`}
        defaultTags={['7clouds', songTitle.toLowerCase(), `${artistName.toLowerCase()} lyrics`, 'music video']}
        initialAspectRatio={styleSettings.aspectRatio}
        onRenderComplete={(result) => {
          setRenderedVideoData(result);
          setIsExportModalOpen(false);
        }}
        onOpenCredentialsHub={() => {
          setCredentialsHubTab('youtube');
          setIsCredentialsHubOpen(true);
        }}
      />

      {/* VidIQ MCP Key & Connection Modal */}
      <VidIqKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
      />

      {/* Comprehensive API Keys & Credentials Hub Modal */}
      <CredentialsHubModal
        isOpen={isCredentialsHubOpen}
        onClose={() => setIsCredentialsHubOpen(false)}
        initialTab={credentialsHubTab}
        onWhisperKeySaved={(key) => setWhisperApiKey(key)}
      />
    </div>
  );
}
