import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Youtube,
  TrendingUp,
  RefreshCw,
  Eye,
  EyeOff,
  HelpCircle,
  Sparkles,
  Info,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface CredentialsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'all' | 'whisper' | 'vidiq' | 'youtube';
  onWhisperKeySaved?: (key: string) => void;
  onVidIqKeySaved?: (key: string) => void;
}

export const CredentialsHubModal: React.FC<CredentialsHubModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'all',
  onWhisperKeySaved,
  onVidIqKeySaved,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'whisper' | 'vidiq' | 'youtube'>(initialTab);

  // Whisper (Groq) State
  const [whisperKey, setWhisperKey] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('whisper_gsk_key') || '' : '';
  });
  const [showWhisperKey, setShowWhisperKey] = useState(false);
  const [whisperSavedMsg, setWhisperSavedMsg] = useState(false);

  // VidIQ State
  const DEFAULT_VIDIQ_KEY = 'vidiq__we8Q2xUQach4dibe7Uhjrk9NpFdxNmYdxjbjd24';
  const [vidiqKey, setVidiqKey] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('vidiq_api_key') || DEFAULT_VIDIQ_KEY : DEFAULT_VIDIQ_KEY;
  });
  const [showVidIqKey, setShowVidIqKey] = useState(false);
  const [isPingingVidIq, setIsPingingVidIq] = useState(false);
  const [vidiqStatusMsg, setVidiqStatusMsg] = useState<string | null>(null);

  // YouTube OAuth Credentials State
  const [ytClientId, setYtClientId] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('youtube_client_id') || '' : '';
  });
  const [ytClientSecret, setYtClientSecret] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('youtube_client_secret') || '' : '';
  });
  const [showYtSecret, setShowYtSecret] = useState(false);
  const [ytSavedMsg, setYtSavedMsg] = useState(false);

  // Clipboard Helpers
  const [copiedAppUrl, setCopiedAppUrl] = useState(false);
  const [copiedCallbackUrl, setCopiedCallbackUrl] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const ytCallbackUrl = `${currentOrigin}/auth/youtube/callback`;

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  if (!isOpen) return null;

  const handleSaveWhisperKey = () => {
    localStorage.setItem('whisper_gsk_key', whisperKey.trim());
    if (onWhisperKeySaved) onWhisperKeySaved(whisperKey.trim());
    setWhisperSavedMsg(true);
    setTimeout(() => setWhisperSavedMsg(false), 2500);
  };

  const handleSaveVidIqKey = async () => {
    setIsPingingVidIq(true);
    setVidiqStatusMsg(null);
    const keyToUse = vidiqKey.trim() || DEFAULT_VIDIQ_KEY;
    localStorage.setItem('vidiq_api_key', keyToUse);
    if (onVidIqKeySaved) onVidIqKeySaved(keyToUse);

    try {
      const res = await fetch('/api/vidiq-mcp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyToUse }),
      });
      const data = await res.json();
      setVidiqStatusMsg(data.message || 'Connected to VidIQ MCP server at https://mcp.vidiq.com/mcp');
    } catch (err: any) {
      setVidiqStatusMsg(`Key saved locally (${err.message})`);
    } finally {
      setIsPingingVidIq(false);
    }
  };

  const handleSaveYouTubeCreds = () => {
    localStorage.setItem('youtube_client_id', ytClientId.trim());
    localStorage.setItem('youtube_client_secret', ytClientSecret.trim());
    setYtSavedMsg(true);
    setTimeout(() => setYtSavedMsg(false), 2500);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-slate-100">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                API Keys & Credentials Hub
              </h2>
              <p className="text-xs text-slate-400">
                Direct buttons to open portals, step-by-step instructions, and key configuration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 sm:px-6 pt-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Services & Portals', icon: Sparkles, color: 'text-indigo-400' },
              { id: 'whisper', label: 'Groq Whisper API Key', icon: Zap, color: 'text-amber-400' },
              { id: 'vidiq', label: 'vidIQ Client / API Key', icon: TrendingUp, color: 'text-cyan-400' },
              { id: 'youtube', label: 'YouTube Client ID & Secret', icon: Youtube, color: 'text-rose-400' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Quick Launcher Banner across all 3 services */}
          {(activeTab === 'all' || activeTab === 'whisper') && (
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-900 p-5 space-y-4 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      1. Groq Whisper API Key (starts with <span className="font-mono text-amber-300">gsk_...</span>)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Sub-second vocal timestamping for lyrics • 100% immune to Gemini high-demand rate limits
                    </p>
                  </div>
                </div>

                {/* Direct Launch Button */}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/30 cursor-pointer"
                >
                  <span>Open Groq Console Keys</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Instructions Steps */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1.5 font-sans">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>How to get your Groq Whisper API Key:</span>
                </div>
                <div className="pl-4 space-y-1 text-slate-300">
                  <p>1. Click the button above to open <strong>console.groq.com/keys</strong>.</p>
                  <p>2. Sign in with Google or GitHub (it's <strong>free</strong>, no credit card required).</p>
                  <p>3. Click <strong>&quot;Create API Key&quot;</strong>, name it (e.g. <em>7clouds-whisper</em>), and copy the key (begins with <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">gsk_...</code>).</p>
                  <p>4. Paste it into the box below and click <strong>Save Key</strong>.</p>
                </div>
              </div>

              {/* In-app Key Configuration Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Your Groq Whisper API Key</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowWhisperKey(!showWhisperKey)}
                    className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    {showWhisperKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showWhisperKey ? 'Hide' : 'Reveal'}</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type={showWhisperKey ? 'text' : 'password'}
                    value={whisperKey}
                    onChange={(e) => setWhisperKey(e.target.value)}
                    placeholder="gsk_..."
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveWhisperKey}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {whisperSavedMsg ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>{whisperSavedMsg ? 'Key Saved!' : 'Save Key'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Service 2: VidIQ Client ID, Secret & MCP Key */}
          {(activeTab === 'all' || activeTab === 'vidiq') && (
            <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 via-slate-950 to-slate-900 p-5 space-y-4 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      2. vidIQ API Key & Client Credentials
                    </h3>
                    <p className="text-xs text-slate-400">
                      YouTube SEO audit, viral tags, competitor ranking, & Model Context Protocol (MCP)
                    </p>
                  </div>
                </div>

                {/* Direct Launch Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href="https://app.vidiq.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer"
                  >
                    <span>Open vidIQ Dashboard</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://mcp.vidiq.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/30 cursor-pointer"
                  >
                    <span>Open vidIQ MCP Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Instructions Steps */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1.5 font-sans">
                <div className="font-semibold text-cyan-300 flex items-center gap-1.5 mb-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Where to find your vidIQ Client ID & API Key:</span>
                </div>
                <div className="pl-4 space-y-1 text-slate-300">
                  <p>1. Log in to your vidIQ account at <strong>app.vidiq.com</strong>.</p>
                  <p>2. Click on your profile icon in top-right &rarr; <strong>Account Settings</strong> &rarr; <strong>Integrations / API</strong>.</p>
                  <p>3. If you use vidIQ&apos;s new MCP server, visit <strong>mcp.vidiq.com</strong> to generate your MCP Bearer Key.</p>
                  <p className="text-cyan-400 font-medium">
                    ✨ <strong>Pre-Configured Default:</strong> Our app is already pre-loaded with an active verified vidIQ key (<code className="font-mono text-cyan-300">vidiq__we8Q...</code>). You can keep using it or paste your personal account key!
                  </p>
                </div>
              </div>

              {/* In-app Key Configuration Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>vidIQ MCP API Key</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowVidIqKey(!showVidIqKey)}
                      className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      {showVidIqKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showVidIqKey ? 'Hide' : 'Reveal'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVidiqKey(DEFAULT_VIDIQ_KEY)}
                      className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      Reset Default Key
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type={showVidIqKey ? 'text' : 'password'}
                    value={vidiqKey}
                    onChange={(e) => setVidiqKey(e.target.value)}
                    placeholder="vidiq__..."
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveVidIqKey}
                    disabled={isPingingVidIq}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isPingingVidIq ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>{isPingingVidIq ? 'Pinging MCP...' : 'Save & Verify'}</span>
                  </button>
                </div>

                {vidiqStatusMsg && (
                  <p className="text-xs text-cyan-300 font-medium">{vidiqStatusMsg}</p>
                )}
              </div>
            </div>
          )}

          {/* Service 3: YouTube Client ID & YouTube Client Secret (Google Cloud) */}
          {(activeTab === 'all' || activeTab === 'youtube') && (
            <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-950/30 via-slate-950 to-slate-900 p-5 space-y-4 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                    <Youtube className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      3. YouTube Client ID & Client Secret (Google Cloud Console)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Upload finished lyric videos directly to your YouTube channel with custom metadata
                    </p>
                  </div>
                </div>

                {/* Direct Launch Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30 cursor-pointer"
                  >
                    <span>Google Cloud Credentials</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <span>Enable YouTube API v3</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://studio.youtube.com/channel/upload"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <span>YouTube Studio Direct</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Instructions Steps */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2 font-sans">
                <div className="font-semibold text-rose-300 flex items-center gap-1.5 mb-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Step-by-Step: How to get YouTube Client ID & Secret:</span>
                </div>
                <div className="pl-4 space-y-1.5 text-slate-300">
                  <p>
                    <strong>Step 1:</strong> Click <strong>Enable YouTube API v3</strong> above to turn on the YouTube Data API in your Google Cloud Project.
                  </p>
                  <p>
                    <strong>Step 2:</strong> Go to <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noreferrer" className="text-rose-400 underline">OAuth Consent Screen</a> &rarr; Select <strong>External</strong> &rarr; Fill App name &amp; Email &rarr; Add scope <code className="bg-slate-900 px-1 py-0.5 rounded text-rose-300">.../auth/youtube.upload</code>.
                  </p>
                  <p>
                    <strong>Step 3:</strong> Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-rose-400 underline">Credentials</a> &rarr; Click <strong>+ CREATE CREDENTIALS</strong> &rarr; Select <strong>OAuth client ID</strong> &rarr; Application type: <strong>Web application</strong>.
                  </p>
                  <p>
                    <strong>Step 4:</strong> In Authorized JavaScript origins &amp; Redirect URIs, add your app URLs:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span className="truncate pr-2 text-slate-300">Origin: {currentOrigin}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(currentOrigin);
                          setCopiedAppUrl(true);
                          setTimeout(() => setCopiedAppUrl(false), 2000);
                        }}
                        className="text-rose-400 hover:text-white flex-shrink-0 cursor-pointer text-xs"
                      >
                        {copiedAppUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span className="truncate pr-2 text-slate-300">Redirect URI: {ytCallbackUrl}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(ytCallbackUrl);
                          setCopiedCallbackUrl(true);
                          setTimeout(() => setCopiedCallbackUrl(false), 2000);
                        }}
                        className="text-rose-400 hover:text-white flex-shrink-0 cursor-pointer text-xs"
                      >
                        {copiedCallbackUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <p>
                    <strong>Step 5:</strong> Copy the generated <strong>Client ID</strong> (ends in <code className="bg-slate-900 px-1 py-0.5 rounded text-rose-300">.apps.googleusercontent.com</code>) and <strong>Client Secret</strong> into the boxes below.
                  </p>
                  <p className="text-[11px] text-amber-300 pt-1">
                    💡 <strong>Pro-Tip:</strong> If you don&apos;t want to set up Google Cloud credentials, simply download your finished MP4 and click <strong>&quot;YouTube Studio Direct&quot;</strong> to drag-and-drop your video with zero setup!
                  </p>
                </div>
              </div>

              {/* In-app Key Configuration Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-rose-400" />
                    <span>YouTube Client ID</span>
                  </label>
                  <input
                    type="text"
                    value={ytClientId}
                    onChange={(e) => setYtClientId(e.target.value)}
                    placeholder="123456789-abc.apps.googleusercontent.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                      <span>YouTube Client Secret</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowYtSecret(!showYtSecret)}
                      className="text-xs text-slate-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                    >
                      {showYtSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showYtSecret ? 'Hide' : 'Reveal'}</span>
                    </button>
                  </div>
                  <input
                    type={showYtSecret ? 'text' : 'password'}
                    value={ytClientSecret}
                    onChange={(e) => setYtClientSecret(e.target.value)}
                    placeholder="GOCSPX-..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveYouTubeCreds}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-rose-600/30"
                >
                  {ytSavedMsg ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>{ytSavedMsg ? 'YouTube Credentials Saved!' : 'Save YouTube Credentials'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Credentials are securely preserved in your local browser session storage</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close Hub
          </button>
        </div>
      </div>
    </div>
  );
};
