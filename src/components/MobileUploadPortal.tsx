import React, { useState } from 'react';
import {
  Upload,
  Music,
  CheckCircle2,
  Smartphone,
  ArrowLeft,
  Sparkles,
  FileAudio,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { fileToBase64, formatTime } from '../utils/audioUtils';

interface MobileUploadPortalProps {
  onBackToApp?: () => void;
  presetSyncCode?: string;
}

export const MobileUploadPortal: React.FC<MobileUploadPortalProps> = ({
  onBackToApp,
  presetSyncCode,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [duration, setDuration] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setErrorMessage(null);

    // Auto-fill title from filename
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    if (!title) {
      if (nameWithoutExt.includes('-')) {
        const parts = nameWithoutExt.split('-');
        setArtist(parts[0].trim());
        setTitle(parts.slice(1).join('-').trim());
      } else {
        setTitle(nameWithoutExt);
      }
    }

    // Determine audio duration via Audio object
    try {
      const audioUrl = URL.createObjectURL(file);
      const audio = new Audio(audioUrl);
      audio.onloadedmetadata = () => {
        setDuration(audio.duration || 0);
      };
    } catch (e) {
      console.warn('Audio metadata load warning:', e);
    }
  };

  const handleUploadToVault = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select an audio file first.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const base64Data = await fileToBase64(selectedFile);

      const res = await fetch('/api/vault/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || selectedFile.name.replace(/\.[^/.]+$/, ''),
          artist: artist.trim() || 'Unknown Artist',
          fileName: selectedFile.name,
          mimeType: selectedFile.type || 'audio/mpeg',
          base64Data,
          duration,
          syncCode: presetSyncCode,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Upload failed (HTTP ${res.status})`);
      }

      const data = await res.json();
      setUploadSuccess(data);
    } catch (err: any) {
      console.error('Mobile upload error:', err);
      setErrorMessage(err.message || 'Failed to upload song.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col p-4 sm:p-6 font-sans">
      {/* Top Header */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-600/30">
            <Smartphone className="w-5 h-5 text-cyan-200" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white">Mobile Audio Sync</h1>
            <p className="text-[11px] text-slate-400">Bypass work / DISA upload restrictions</p>
          </div>
        </div>

        {onBackToApp && (
          <button
            onClick={onBackToApp}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Full Studio</span>
          </button>
        )}
      </div>

      <div className="max-w-md mx-auto w-full my-auto py-6 space-y-6">
        {uploadSuccess ? (
          /* Upload Success Screen */
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/30 text-center space-y-5 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                Upload Successful!
              </span>
              <h2 className="text-xl font-black text-white">Song Saved to Cloud Vault</h2>
              <p className="text-xs text-slate-300 mt-2">
                Your song is ready to open immediately on your work computer without any file upload blocks.
              </p>
            </div>

            {/* Sync Code Display */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Your Work Computer Sync Code:
              </span>
              <div className="text-3xl font-black font-mono tracking-widest text-cyan-400 flex items-center justify-center gap-2">
                <span>{uploadSuccess.syncCode}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(uploadSuccess.syncCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Enter code <strong className="text-white font-mono">{uploadSuccess.syncCode}</strong> on your work computer screen, or simply refresh your Cloud Library!
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setUploadSuccess(null);
                  setSelectedFile(null);
                  setTitle('');
                  setArtist('');
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-600/30 cursor-pointer"
              >
                Upload Another Song
              </button>
            </div>
          </div>
        ) : (
          /* Mobile Upload Form */
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-2xl backdrop-blur-md">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-white">Upload from Mobile Device</h2>
              <p className="text-xs text-slate-400">
                Pick an MP3 or WAV file from your phone. It will be stored in your Cloud Vault for your work computer.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            {/* File Picker Zone */}
            <label className="block relative border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-slate-950/70 rounded-2xl p-6 text-center cursor-pointer transition-all group">
              <input
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.ogg"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                  <FileAudio className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">
                    {selectedFile ? selectedFile.name : 'Tap to Choose Audio File'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {selectedFile
                      ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • ${duration > 0 ? formatTime(duration) : 'Loading...'}`
                      : 'MP3, WAV, M4A from Files or Library'}
                  </span>
                </div>
              </div>
            </label>

            {/* Song Metadata Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Song Title</label>
                <input
                  type="text"
                  placeholder="e.g. How to Save a Life"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Artist Name</label>
                <input
                  type="text"
                  placeholder="e.g. The Fray"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUploadToVault}
              disabled={!selectedFile || isUploading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xl shadow-cyan-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Uploading to Cloud Vault...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload to Cloud Vault</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="max-w-md mx-auto w-full text-center text-[10px] text-slate-500 pt-4">
        7clouds Video Studio • Cloud Storage Relay for Enterprise & Government Networks
      </div>
    </div>
  );
};
