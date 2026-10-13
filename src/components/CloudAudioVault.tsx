import React, { useState, useEffect, useRef } from 'react';
import {
  Cloud,
  Smartphone,
  QrCode,
  Link as LinkIcon,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Check,
  Copy,
  Download,
  Music,
  ExternalLink,
  ShieldCheck,
  Radio,
  FileAudio,
  Sparkles,
} from 'lucide-react';
import { VaultTrackInfo, AudioTrackInfo } from '../types';
import { formatTime } from '../utils/audioUtils';

interface CloudAudioVaultProps {
  onSelectTrack: (trackInfo: AudioTrackInfo, trackTitle: string, trackArtist: string) => void;
  currentAudioId?: string;
}

export const CloudAudioVault: React.FC<CloudAudioVaultProps> = ({
  onSelectTrack,
  currentAudioId,
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'mobile_sync' | 'url_import'>('library');
  const [tracks, setTracks] = useState<VaultTrackInfo[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [syncCodeInput, setSyncCodeInput] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // URL import state
  const [importUrl, setImportUrl] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [importArtist, setImportArtist] = useState('');
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // Audio audition player
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioAuditionRef = useRef<HTMLAudioElement | null>(null);

  // Copy helpers
  const [copiedMobileLink, setCopiedMobileLink] = useState(false);

  // Auto-listen polling toggle
  const [isListeningForUploads, setIsListeningForUploads] = useState(true);

  // Compute mobile URL
  const mobilePortalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?view=mobile-upload`
    : '';

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(mobilePortalUrl)}&margin=4`;

  // Fetch all vault tracks
  const fetchVaultTracks = async () => {
    setIsLoadingTracks(true);
    try {
      const res = await fetch('/api/vault/tracks');
      if (res.ok) {
        const data = await res.json();
        setTracks(data.tracks || []);
      }
    } catch (err) {
      console.warn('Failed to fetch vault tracks:', err);
    } finally {
      setIsLoadingTracks(false);
    }
  };

  useEffect(() => {
    fetchVaultTracks();
  }, []);

  // Auto-poll for new uploads when on mobile_sync or library tab
  useEffect(() => {
    if (!isListeningForUploads) return;

    const interval = setInterval(() => {
      fetch('/api/vault/tracks')
        .then((res) => res.json())
        .then((data) => {
          if (data.tracks && data.tracks.length > tracks.length) {
            setTracks(data.tracks);
          }
        })
        .catch(() => {});
    }, 4000);

    return () => clearInterval(interval);
  }, [isListeningForUploads, tracks.length]);

  // Handle loading a track into the main app
  const handleLoadTrack = async (track: VaultTrackInfo) => {
    try {
      // Fetch full details with base64 data
      const res = await fetch(`/api/vault/track/${track.id}`);
      if (!res.ok) throw new Error('Failed to load track from vault');

      const data = await res.json();
      const audioInfo: AudioTrackInfo = {
        fileName: data.fileName || `${data.title}.mp3`,
        fileSize: data.size || 0,
        duration: data.duration || 60,
        audioUrl: data.audioUrl || `/api/vault/audio/${data.id}`,
        base64Data: data.base64Data,
        mimeType: data.mimeType || 'audio/mpeg',
      };

      onSelectTrack(audioInfo, data.title, data.artist);
    } catch (err: any) {
      console.error('Error loading vault track:', err);
      alert('Error loading track: ' + err.message);
    }
  };

  // Handle sync code lookup
  const handleSyncByCode = async () => {
    const code = syncCodeInput.trim().toUpperCase();
    if (!code) return;

    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const res = await fetch('/api/vault/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncCode: code }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `No track found for code ${code}`);
      }

      const data = await res.json();
      setSyncMessage(`Found: "${data.title}" by ${data.artist}! Loading into project...`);

      const audioInfo: AudioTrackInfo = {
        fileName: data.fileName || `${data.title}.mp3`,
        fileSize: data.size || 0,
        duration: data.duration || 60,
        audioUrl: data.audioUrl || `/api/vault/audio/${data.id}`,
        base64Data: data.base64Data,
        mimeType: data.mimeType || 'audio/mpeg',
      };

      setTimeout(() => {
        onSelectTrack(audioInfo, data.title, data.artist);
        fetchVaultTracks();
      }, 600);
    } catch (err: any) {
      setSyncMessage(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle URL import
  const handleImportFromUrl = async () => {
    if (!importUrl) return;

    setIsImportingUrl(true);
    setImportMessage(null);

    try {
      const res = await fetch('/api/vault/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: importUrl.trim(),
          title: importTitle.trim(),
          artist: importArtist.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to download audio from URL');
      }

      const data = await res.json();
      setImportMessage(`Audio downloaded to Cloud Vault! Sync Code: ${data.syncCode}`);
      setImportUrl('');
      setImportTitle('');
      setImportArtist('');

      // Refresh library & auto load
      await fetchVaultTracks();
      if (data.track?.id) {
        const trackRes = await fetch(`/api/vault/track/${data.track.id}`);
        const fullTrack = await trackRes.json();
        const audioInfo: AudioTrackInfo = {
          fileName: fullTrack.fileName || `${fullTrack.title}.mp3`,
          fileSize: fullTrack.size || 0,
          duration: fullTrack.duration || 60,
          audioUrl: fullTrack.audioUrl || `/api/vault/audio/${fullTrack.id}`,
          base64Data: fullTrack.base64Data,
          mimeType: fullTrack.mimeType || 'audio/mpeg',
        };
        onSelectTrack(audioInfo, fullTrack.title, fullTrack.artist);
      }
    } catch (err: any) {
      setImportMessage(err.message);
    } finally {
      setIsImportingUrl(false);
    }
  };

  const handleDeleteTrack = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this track from your Cloud Vault?')) return;

    try {
      await fetch(`/api/vault/track/${id}`, { method: 'DELETE' });
      setTracks((prev) => prev.filter((t) => t.id !== id));
      if (playingTrackId === id && audioAuditionRef.current) {
        audioAuditionRef.current.pause();
        setPlayingTrackId(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const toggleAuditionPlay = (track: VaultTrackInfo, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingTrackId === track.id) {
      audioAuditionRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      if (audioAuditionRef.current) {
        audioAuditionRef.current.src = track.audioUrl || `/api/vault/audio/${track.id}`;
        audioAuditionRef.current.play().catch(console.warn);
        setPlayingTrackId(track.id);
      }
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      {/* Hidden audio element for preview audition */}
      <audio
        ref={audioAuditionRef}
        onEnded={() => setPlayingTrackId(null)}
        onError={() => setPlayingTrackId(null)}
      />

      {/* Header and Disa Network Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-600/30">
            <Cloud className="w-6 h-6 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                Cloud Audio Vault & Mobile Relay
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-[10px] text-cyan-300 font-mono font-bold">
                Bypass Work Firewalls
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Upload from your phone outside DISA restrictions • Instantly open on your work computer
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'library'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Cloud Library ({tracks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('mobile_sync')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'mobile_sync'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile QR Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('url_import')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'url_import'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Import Web Link</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Cloud Library of Previously Uploaded Tracks */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Your Stored Audio Tracks</span>
              <span className="text-slate-500 text-[11px] font-normal">
                (Saved in cloud • Accessible from any device)
              </span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchVaultTracks}
                disabled={isLoadingTracks}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingTracks ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {tracks.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-bold text-white">No Cloud Songs Yet</h4>
                <p className="text-xs text-slate-400">
                  Switch to the <strong className="text-cyan-300">Mobile QR Sync</strong> tab to scan and upload a song directly from your smartphone, or use <strong className="text-purple-300">Import Web Link</strong>!
                </p>
              </div>
              <button
                onClick={() => setActiveTab('mobile_sync')}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/25 cursor-pointer"
              >
                Open Mobile Upload QR Code
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {tracks.map((track) => {
                const isPlaying = playingTrackId === track.id;
                return (
                  <div
                    key={track.id}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => toggleAuditionPlay(track, e)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                          isPlaying
                            ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/40'
                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                        }`}
                        title={isPlaying ? 'Pause audition' : 'Audition audio'}
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-300 font-bold border border-slate-700">
                            {track.syncCode}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{track.artist}</span>
                          <span>•</span>
                          <span>{formatTime(track.duration)}</span>
                          <span>•</span>
                          <span>{(track.size / (1024 * 1024)).toFixed(1)} MB</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => handleLoadTrack(track)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Load into Studio</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteTrack(track.id, e)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remove track from vault"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Mobile QR Code & 4-Digit Sync */}
      {activeTab === 'mobile_sync' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* QR Code Block */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3 flex flex-col items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <QrCode className="w-4 h-4" />
                <span>Scan with Personal Phone</span>
              </span>

              <div className="p-3 bg-white rounded-2xl shadow-xl shadow-cyan-500/10 border-4 border-slate-900">
                <img
                  src={qrCodeUrl}
                  alt="Scan on mobile to upload audio"
                  className="w-44 h-44 object-contain"
                />
              </div>

              <div className="space-y-1.5 max-w-xs">
                <p className="text-[11px] text-slate-300">
                  Point your phone camera here to open the Mobile Audio Upload Portal on 5G/home WiFi outside work firewalls.
                </p>
                <div className="flex items-center gap-1 justify-center pt-1">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(mobilePortalUrl);
                      setCopiedMobileLink(true);
                      setTimeout(() => setCopiedMobileLink(false), 2000);
                    }}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedMobileLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedMobileLink ? 'Link Copied!' : 'Copy Mobile Link'}</span>
                  </button>
                  <a
                    href={mobilePortalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open in Tab</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Sync Code & Radar Listener */}
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Real-Time Cloud Relay Active</span>
                </div>
                <p className="text-xs text-slate-300">
                  When you upload on your phone, this screen automatically receives the song. You can also enter the 4-digit code shown on your phone below:
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. J8X2"
                    value={syncCodeInput}
                    onChange={(e) => setSyncCodeInput(e.target.value.toUpperCase())}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-center font-mono font-bold text-sm tracking-widest text-cyan-300 uppercase focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={handleSyncByCode}
                    disabled={!syncCodeInput.trim() || isSyncing}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider flex-shrink-0 cursor-pointer disabled:opacity-40"
                  >
                    {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Fetch Track'}
                  </button>
                </div>

                {syncMessage && (
                  <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-xs text-cyan-300">
                    {syncMessage}
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <strong className="text-slate-200 block">How This Bypasses DISA Restrictions:</strong>
                <div>1. The audio file travels from your mobile phone directly to the Cloud Run server.</div>
                <div>2. Your work computer only receives lightweight text commands and streams playback via standard HTTPS GET.</div>
                <div>3. Zero file upload is initiated from your work workstation!</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Import via Web URL */}
      {activeTab === 'url_import' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <LinkIcon className="w-4 h-4 text-purple-400" />
              <span>Fetch Audio Server-Side from Remote Link</span>
            </h4>
            <p className="text-xs text-slate-400">
              Paste a public Google Drive link, Dropbox link, Discord audio URL, or any HTTPS MP3/WAV. The Cloud Run server downloads it directly, completely bypassing local work network upload restrictions.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Audio Link / Google Drive / Dropbox URL
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/file/d/... or https://dropbox.com/s/... or direct .mp3"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Song Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. How to Save a Life"
                  value={importTitle}
                  onChange={(e) => setImportTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Artist (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. The Fray"
                  value={importArtist}
                  onChange={(e) => setImportArtist(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <button
              onClick={handleImportFromUrl}
              disabled={!importUrl.trim() || isImportingUrl}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {isImportingUrl ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Cloud Server is Downloading Audio...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Audio on Server & Open in Project</span>
                </>
              )}
            </button>

            {importMessage && (
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/20 text-xs text-purple-300">
                {importMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
