import React, { useState, useRef } from 'react';
import {
  Upload,
  Music,
  Sparkles,
  Disc3,
  Play,
  Pause,
  RefreshCw,
  FileAudio,
  Cloud,
  ShieldCheck,
  Zap,
  Key,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { AudioTrackInfo } from '../types';
import { fileToBase64, formatTime, generateDemoAcousticSong } from '../utils/audioUtils';
import { CloudAudioVault } from './CloudAudioVault';

interface AudioUploaderProps {
  onAudioLoaded: (info: AudioTrackInfo) => void;
  onTranscribe: (engine?: 'gemini' | 'whisper') => void;
  isLoading: boolean;
  audioInfo: AudioTrackInfo | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onSongDetailsChange?: (title: string, artist: string) => void;
  whisperApiKey: string;
  onWhisperKeyChange: (key: string) => void;
  onLoadOfficialPresetLyrics?: () => void;
  isHighDemand?: boolean;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  onAudioLoaded,
  onTranscribe,
  isLoading,
  audioInfo,
  audioRef,
  onSongDetailsChange,
  whisperApiKey,
  onWhisperKeyChange,
  onLoadOfficialPresetLyrics,
  isHighDemand,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
  const [activeUploadMethod, setActiveUploadMethod] = useState<'vault' | 'local'>('vault');
  const [selectedEngine, setSelectedEngine] = useState<'whisper' | 'gemini'>('whisper');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAudioFile(file);
  };

  const processAudioFile = async (file: File) => {
    const url = URL.createObjectURL(file);
    const base64 = await fileToBase64(file);

    // Parse title & artist from filename if possible
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    if (onSongDetailsChange) {
      if (nameWithoutExt.includes('-')) {
        const parts = nameWithoutExt.split('-');
        onSongDetailsChange(parts.slice(1).join('-').trim(), parts[0].trim());
      } else {
        onSongDetailsChange(nameWithoutExt, 'Unknown Artist');
      }
    }

    // Read duration
    const tempAudio = new Audio(url);
    tempAudio.onloadedmetadata = () => {
      const dur = tempAudio.duration || 60;
      setDuration(dur);
      onAudioLoaded({
        fileName: file.name,
        fileSize: file.size,
        duration: dur,
        audioUrl: url,
        base64Data: base64,
        mimeType: file.type || 'audio/mp3',
      });
    };
  };

  const handleLoadDemo = async () => {
    setIsGeneratingDemo(true);
    try {
      const demo = await generateDemoAcousticSong();
      setDuration(demo.duration);
      if (onSongDetailsChange) {
        onSongDetailsChange('How to Save a Life', 'The Fray');
      }
      onAudioLoaded({
        fileName: 'The Fray - How to Save a Life (Acoustic Demo).wav',
        fileSize: demo.blob.size,
        duration: demo.duration,
        audioUrl: demo.url,
        base64Data: demo.base64,
        mimeType: 'audio/wav',
      });
    } catch (err) {
      console.error('Failed to generate demo:', err);
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  const handleVaultSelectTrack = (trackInfo: AudioTrackInfo, trackTitle: string, trackArtist: string) => {
    setDuration(trackInfo.duration);
    if (onSongDetailsChange) {
      onSongDetailsChange(trackTitle, trackArtist);
    }
    onAudioLoaded(trackInfo);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Hidden file input for local uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/mp3,audio/wav,audio/m4a,audio/ogg,audio/aac"
        className="hidden"
      />

      {/* Hero Intro */}
      <div className="text-center space-y-2 mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          7clouds Music Video AI Engine
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Turn Any MP3/WAV into a 7clouds Lyric Video
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-xs sm:text-sm">
          Extract precise vocal timestamps with Groq Whisper API or Gemini AI, direct an emotional screenplay,
          and render an authentic 7clouds video with signature typography.
        </p>
      </div>

      {/* DISA / Enterprise Network Restriction Alert & Quick Relay Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900/80 to-blue-950/60 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Work / DISA Network Upload Restrictions?</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-900/80 text-[10px] text-cyan-300 font-mono">
                Bypass Enabled
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Upload songs from your personal phone or select previously saved songs from your <strong>Cloud Vault</strong> below!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveUploadMethod('vault')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeUploadMethod === 'vault'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Cloud & Mobile Sync</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveUploadMethod('local')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeUploadMethod === 'local'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Local PC File</span>
          </button>
        </div>
      </div>

      {/* If Audio is Already Loaded, Display the Master Audio Card */}
      {audioInfo && (
        <div className="bg-slate-900/90 border border-indigo-500/40 rounded-2xl p-6 backdrop-blur-md space-y-5 shadow-2xl animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-md shadow-indigo-500/20">
                <Music className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">
                  ✓ Active Track Ready for Video Creation
                </span>
                <h4 className="text-white font-extrabold text-base truncate max-w-md">
                  {audioInfo.fileName}
                </h4>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                  <span>Duration: {formatTime(audioInfo.duration, true)}</span>
                  <span>•</span>
                  <span>Size: {(audioInfo.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                  <span>•</span>
                  <span className="text-cyan-400 uppercase">{audioInfo.mimeType.split('/')[1]}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveUploadMethod('vault')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors cursor-pointer"
              >
                Change from Cloud Vault
              </button>
            </div>
          </div>

          {/* Simple Player Bar */}
          <div className="flex items-center gap-4 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors shadow-md shadow-indigo-600/30 flex-shrink-0 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            <div className="flex-1 space-y-1">
              <input
                type="range"
                min={0}
                max={audioInfo.duration || 100}
                step={0.1}
                value={currentTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCurrentTime(val);
                  if (audioRef.current) audioRef.current.currentTime = val;
                }}
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(audioInfo.duration)}</span>
              </div>
            </div>
          </div>

          {/* Transcription Engine Selection & Whisper Key input */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Transcription Engine
                </span>
                {isHighDemand && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Gemini High Demand Active
                  </span>
                )}
              </div>

              {/* Engine Switcher Buttons */}
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedEngine('whisper')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedEngine === 'whisper'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Groq Whisper (gsk_ Key)</span>
                  <span className="text-[10px] bg-amber-950 text-amber-300 px-1.5 py-0.2 rounded font-mono">Fast</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedEngine('gemini')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedEngine === 'gemini'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Gemini Multimodal</span>
                </button>
              </div>
            </div>

            {/* Whisper Key Field */}
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Groq Whisper API Key (`gsk_...`):</span>
                  {whisperApiKey && (
                    <span className="text-emerald-400 text-[10px] flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => setShowKeyInput(!showKeyInput)}
                  className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                >
                  {showKeyInput ? 'Hide' : whisperApiKey ? 'Edit Key' : 'Configure Key'}
                </button>
              </div>

              {(showKeyInput || !whisperApiKey || selectedEngine === 'whisper') && (
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={whisperApiKey}
                    onChange={(e) => onWhisperKeyChange(e.target.value)}
                    placeholder="Enter Groq Whisper API Key (starts with gsk_...)"
                    className="flex-1 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono outline-none"
                  />
                  {whisperApiKey && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowKeyInput(false);
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 cursor-pointer"
                    >
                      Save
                    </button>
                  )}
                </div>
              )}

              {/* Direct Open Button for Groq Keys */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[11px] font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Get Free Groq Whisper Key (console.groq.com/keys)</span>
                  <ExternalLink className="w-3 h-3 text-amber-400" />
                </a>
                <span className="text-[10px] text-slate-400">Free, instant, no credit card required</span>
              </div>

              <p className="text-[10px] text-slate-400">
                {selectedEngine === 'whisper'
                  ? '⚡ Groq Whisper processes the entire song with word & segment timestamps in < 1 second. Zero high-demand throttling.'
                  : 'Gemini AI analyzes audio directly. If Gemini reports high demand, Groq Whisper is automatically used as fallback.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Quick 1-Click The Fray 7clouds Template */}
            {onLoadOfficialPresetLyrics && (
              <button
                type="button"
                onClick={onLoadOfficialPresetLyrics}
                disabled={isLoading}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Load The Fray (7clouds Stylings) Lyrics Directly</span>
              </button>
            )}

            <button
              onClick={() => onTranscribe(selectedEngine)}
              disabled={isLoading}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                selectedEngine === 'whisper'
                  ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-500/25'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>
                    {selectedEngine === 'whisper'
                      ? 'Groq Whisper Transcribing Timestamps...'
                      : 'Gemini Transcribing Audio...'}
                  </span>
                </>
              ) : (
                <>
                  {selectedEngine === 'whisper' ? (
                    <Zap className="w-4 h-4 text-amber-200" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  )}
                  <span>
                    {selectedEngine === 'whisper'
                      ? 'Get Timestamp Lyrics via Whisper (gsk Key)'
                      : 'Get Timestamp Lyrics via Gemini AI'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Method 1: Cloud Audio Vault & Mobile Sync Relay */}
      {activeUploadMethod === 'vault' && (
        <CloudAudioVault
          onSelectTrack={handleVaultSelectTrack}
          currentAudioId={audioInfo?.fileName}
        />
      )}

      {/* Method 2: Local File Upload & Built-In Synthesized Demo */}
      {activeUploadMethod === 'local' && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-3xl p-10 text-center cursor-pointer transition-all duration-300 bg-slate-900/40 hover:bg-slate-900/70 backdrop-blur-sm group"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-600/20 transition-all duration-300 mb-4 shadow-lg shadow-indigo-500/5">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            Choose an audio file from this computer
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm mb-4">
            Supports MP3, WAV, M4A, OGG up to 50MB (if work network permits)
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm transition-colors shadow-lg shadow-indigo-600/25 flex items-center gap-2 cursor-pointer"
            >
              <FileAudio className="w-4 h-4" />
              Browse Work PC File
            </button>

            <span className="text-slate-600 text-xs font-medium">OR</span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleLoadDemo();
              }}
              disabled={isGeneratingDemo}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs sm:text-sm transition-colors flex items-center gap-2 cursor-pointer"
            >
              {isGeneratingDemo ? (
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              ) : (
                <Disc3 className="w-4 h-4 text-rose-400" />
              )}
              {isGeneratingDemo ? 'Synthesizing...' : 'Load The Fray Style Demo Song'}
            </button>
          </div>
        </div>
      )}

      {/* Hidden HTML audio element for master playback & canvas sync */}
      <audio
        ref={audioRef}
        src={audioInfo?.audioUrl}
        onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
    </div>
  );
};
