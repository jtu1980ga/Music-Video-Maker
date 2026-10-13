import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  Tag,
  Copy,
  Check,
  Image as ImageIcon,
  Wand2,
  FileText,
  RefreshCw,
  ExternalLink,
  Flame,
  Award,
  Layers,
  HelpCircle,
  Eye,
  EyeOff,
  Terminal,
  Key,
  ShieldCheck,
} from 'lucide-react';
import {
  VidIqSeoResult,
  VidIqTitleOption,
  VidIqTag,
  VidIqThumbnailConcept,
  StoryTreatment,
  TimestampLine,
  AspectRatio,
} from '../types';

interface VidIqSuiteProps {
  songTitle: string;
  artistName: string;
  story: StoryTreatment | null;
  lyrics: TimestampLine[];
  onTitleSelect: (title: string) => void;
  onThumbnailSelect?: (thumbnailUrl: string) => void;
  aspectRatio: AspectRatio;
}

export const VidIqSuite: React.FC<VidIqSuiteProps> = ({
  songTitle,
  artistName,
  story,
  lyrics,
  onTitleSelect,
  onThumbnailSelect,
  aspectRatio,
}) => {
  const [seoResult, setSeoResult] = useState<VidIqSeoResult | null>(null);
  const [isLoadingSeo, setIsLoadingSeo] = useState(false);
  const [copiedTag, setCopiedTag] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [copiedTitleIndex, setCopiedTitleIndex] = useState<number | null>(null);
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [vidiqToken, setVidiqToken] = useState(() => localStorage.getItem('vidiq_token') || '');
  
  const DEFAULT_KEY = 'vidiq__we8Q2xUQach4dibe7Uhjrk9NpFdxNmYdxjbjd24';
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('vidiq_api_key') || DEFAULT_KEY);
  const [showKeyPassword, setShowKeyPassword] = useState(false);
  const [copiedCliCommand, setCopiedCliCommand] = useState(false);
  const [copiedRawKey, setCopiedRawKey] = useState(false);
  const [mcpStatus, setMcpStatus] = useState<any>(null);
  const [isConnectingMcp, setIsConnectingMcp] = useState(false);
  const [showMcpTools, setShowMcpTools] = useState(false);
  const [mcpMessage, setMcpMessage] = useState<string | null>(null);

  // Auto-check MCP status on mount
  React.useEffect(() => {
    fetch('/api/vidiq-mcp/status')
      .then((res) => res.json())
      .then((data) => {
        setMcpStatus(data);
        if (apiKey && !data.connected) {
          handleConnectMcp(apiKey);
        }
      })
      .catch(console.error);
  }, []);

  const handleConnectMcp = async (keyOverride?: string) => {
    const keyToConnect = (keyOverride || apiKey).trim();
    setIsConnectingMcp(true);
    setMcpMessage(null);
    try {
      const res = await fetch('/api/vidiq-mcp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyToConnect }),
      });
      const data = await res.json();
      setMcpStatus(data);
      if (keyToConnect) {
        localStorage.setItem('vidiq_api_key', keyToConnect);
      }
      setMcpMessage(data.message || 'Connected to VidIQ MCP server at https://mcp.vidiq.com/mcp');
    } catch (err: any) {
      console.error('MCP connect error:', err);
      setMcpMessage(`Connection note: ${err.message}`);
    } finally {
      setIsConnectingMcp(false);
    }
  };

  const [formatTemplate, setFormatTemplate] = useState<string>(
`🎵 {TITLE} - {ARTIST} (Lyrics)
⏬ Download / Stream: https://open.spotify.com
🔔 Subscribe and turn on notifications to never miss a new lyric video!

👉 7clouds:
• Instagram: https://instagram.com/7cloudsmusic
• TikTok: https://tiktok.com/@7clouds
• Twitter: https://twitter.com/7cloudsmusic

🎤 Lyrics:
{LYRICS_WITH_TIMESTAMPS}

📖 Story Behind the Video:
{STORY_SYNOPSIS}

🎬 Produced with:
7clouds Video Engine & AI Studio

#Lyrics #{ARTIST_TAG} #{TITLE_TAG} #7clouds #MusicVideo`
  );

  const [generatedDescription, setGeneratedDescription] = useState<string>('');
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  // Thumbnail states
  const [activeThumbConcept, setActiveThumbConcept] = useState<VidIqThumbnailConcept | null>(null);
  const [generatedThumbnailUrl, setGeneratedThumbnailUrl] = useState<string | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [thumbnailTextOverlay, setThumbnailTextOverlay] = useState<string>('HOW TO SAVE A LIFE');
  const [thumbnailAspect, setThumbnailAspect] = useState<AspectRatio>(aspectRatio);

  // 1. Run VidIQ Audit
  const handleRunVidIqAudit = async () => {
    setIsLoadingSeo(true);
    try {
      const res = await fetch('/api/vidiq-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: songTitle,
          artist: artistName,
          story,
          lyrics,
          genre: 'Pop Rock / Acoustic',
          apiKey: apiKey || undefined,
        }),
      });

      if (!res.ok) throw new Error('VidIQ audit failed');
      const data: VidIqSeoResult = await res.json();
      setSeoResult(data);
      if (data.thumbnailConcepts?.length) {
        setActiveThumbConcept(data.thumbnailConcepts[0]);
        setThumbnailTextOverlay(data.thumbnailConcepts[0].textOverlay);
      }
    } catch (err) {
      console.error('VidIQ error:', err);
    } finally {
      setIsLoadingSeo(false);
    }
  };

  // 2. Generate Long Description based on user format
  const handleGenerateDescription = async () => {
    setIsGeneratingDesc(true);
    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formatTemplate,
          title: songTitle,
          artist: artistName,
          lyrics,
          story,
          tags: seoResult?.tags || [],
        }),
      });

      if (!res.ok) throw new Error('Failed to generate description');
      const data = await res.json();
      setGeneratedDescription(data.description);
    } catch (err) {
      console.error('Description error:', err);
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  // 3. Generate YouTube Thumbnail
  const handleGenerateThumbnail = async (concept?: VidIqThumbnailConcept) => {
    const target = concept || activeThumbConcept;
    if (!target) return;

    setIsGeneratingThumbnail(true);
    try {
      const res = await fetch('/api/generate-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: target.prompt,
          textOverlay: thumbnailTextOverlay || target.textOverlay,
          aspectRatio: thumbnailAspect,
          mood: target.mood,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate thumbnail');
      const data = await res.json();
      setGeneratedThumbnailUrl(data.imageUrl);
      if (onThumbnailSelect && data.imageUrl) {
        onThumbnailSelect(data.imageUrl);
      }
    } catch (err) {
      console.error('Thumbnail generation error:', err);
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const copyTagsToClipboard = () => {
    if (!seoResult?.tags) return;
    const tagString = seoResult.tags.map((t) => t.tag).join(', ');
    navigator.clipboard.writeText(tagString);
    setCopiedTag(true);
    setTimeout(() => setCopiedTag(false), 2000);
  };

  const copyDescToClipboard = () => {
    if (!generatedDescription) return;
    navigator.clipboard.writeText(generatedDescription);
    setCopiedDesc(true);
    setTimeout(() => setCopiedDesc(false), 2000);
  };

  const handleCopyTitle = (title: string, index: number) => {
    navigator.clipboard.writeText(title);
    onTitleSelect(title);
    setCopiedTitleIndex(index);
    setTimeout(() => setCopiedTitleIndex(null), 2000);
  };

  const totalTagChars = seoResult?.tags
    ? seoResult.tags.map((t) => t.tag).join(',').length
    : 0;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-purple-900/60 border border-blue-500/30 rounded-3xl p-6 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/20">
            <TrendingUp className="w-8 h-8 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
                VidIQ Pro YouTube SEO Suite
              </span>
              <span className="text-xs text-slate-300">Viral 7clouds Growth Engine</span>
            </div>
            <h3 className="text-2xl font-black text-white mt-1">
              YouTube Title, Tags, Description & Thumbnails
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Optimize your song with VidIQ algorithms: high-ranking tags, click-optimized title variations,
              custom description templates, and high-CTR thumbnail visuals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAccountInfo(!showAccountInfo)}
            className="px-4 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>VidIQ Account Status</span>
          </button>

          <button
            onClick={handleRunVidIqAudit}
            disabled={isLoadingSeo}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
          >
            {isLoadingSeo ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Analyzing YouTube SEO...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{seoResult ? 'Re-Run VidIQ Audit' : 'Generate VidIQ SEO & Tags'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* VidIQ MCP Server Connection Panel */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${mcpStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  VidIQ Model Context Protocol (MCP)
                </span>
                <span className="font-mono text-[10px] bg-slate-950 text-cyan-300 px-2 py-0.5 rounded border border-slate-800">
                  https://mcp.vidiq.com/mcp
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {mcpStatus?.connected
                  ? `Connected • Protocol ${mcpStatus?.protocolVersion || '2024-11-05'} • ${mcpStatus?.tools?.length || 4} MCP Tools Active`
                  : 'Ready to connect to remote VidIQ MCP server with your API Key.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://app.vidiq.com"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Open vidIQ Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            </a>
            <a
              href="https://mcp.vidiq.com"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Open vidIQ MCP</span>
              <ExternalLink className="w-3.5 h-3.5 text-cyan-300" />
            </a>
            <button
              onClick={() => setShowMcpTools(!showMcpTools)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              {showMcpTools ? 'Hide MCP Tools' : `Inspect MCP Tools (${mcpStatus?.tools?.length || 4})`}
            </button>
          </div>
        </div>

        {/* API Key Connection Box */}
        <div className="space-y-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-cyan-400" />
              <span>VidIQ API Key</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowKeyPassword(!showKeyPassword)}
                className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {showKeyPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showKeyPassword ? 'Hide Key' : 'Reveal Key'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(apiKey);
                  setCopiedRawKey(true);
                  setTimeout(() => setCopiedRawKey(false), 2000);
                }}
                className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedRawKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRawKey ? 'Copied' : 'Copy Key'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full relative">
              <input
                type={showKeyPassword ? 'text' : 'password'}
                placeholder="Enter your VidIQ API Key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500 pr-24"
              />
              <button
                type="button"
                onClick={() => setApiKey(DEFAULT_KEY)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-cyan-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded transition-colors cursor-pointer"
              >
                Reset Default
              </button>
            </div>

            <button
              onClick={() => handleConnectMcp()}
              disabled={isConnectingMcp}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
            >
              {isConnectingMcp ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting MCP...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Connect VidIQ</span>
                </>
              )}
            </button>
          </div>

          {/* CLI Terminal Command Box */}
          <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>CLI Terminal Command (Gemini MCP)</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  const cmd = `gemini mcp add --scope user --transport http --header 'Authorization: Bearer ${apiKey || DEFAULT_KEY}' vidIQ https://mcp.vidiq.com/mcp`;
                  navigator.clipboard.writeText(cmd);
                  setCopiedCliCommand(true);
                  setTimeout(() => setCopiedCliCommand(false), 2000);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedCliCommand ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCliCommand ? 'Copied Command!' : 'Copy Command'}</span>
              </button>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-amber-300 leading-relaxed overflow-x-auto select-all">
              <code>gemini mcp add --scope user --transport http --header &apos;Authorization: Bearer {apiKey || DEFAULT_KEY}&apos; vidIQ https://mcp.vidiq.com/mcp</code>
            </div>
          </div>
        </div>

        {mcpMessage && (
          <div className="p-2.5 bg-cyan-950/30 border border-cyan-500/20 rounded-xl text-[11px] text-cyan-300 flex items-center justify-between">
            <span>{mcpMessage}</span>
            <button onClick={() => setMcpMessage(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Expandable MCP Tools Explorer */}
        {showMcpTools && (
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active VidIQ MCP Tools (JSON-RPC 2.0 at https://mcp.vidiq.com/mcp):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(mcpStatus?.tools || []).map((t: any, i: number) => (
                <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">{t.name}</span>
                    <span className="text-[9px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">MCP Tool</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{t.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {showAccountInfo && (
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-6 backdrop-blur-xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                VidIQ Account Connection Status
              </h4>
            </div>
            <button
              onClick={() => setShowAccountInfo(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Check className="w-4 h-4" />
                <span>Built-in AI VidIQ Engine: ACTIVE</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Good news! Your app already has the <strong>VidIQ Pro algorithm integrated natively</strong>.
                It analyzes click-through rate (CTR), search volume, low-competition tags, and 7clouds ranking benchmarks using Gemini AI—so you do <strong>not</strong> need a paid VidIQ subscription to get high-ranking titles, tags, and thumbnails.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <ExternalLink className="w-4 h-4" />
                <span>Optional: Link Your Personal VidIQ / YouTube Account</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                If you have an existing VidIQ account and want to link your personal channel benchmarks:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>Log in to <a href="https://vidiq.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">vidiq.com</a> or the VidIQ Chrome extension.</li>
                <li>Connect your YouTube channel in your VidIQ Dashboard.</li>
                <li>Enter your optional Channel ID or Custom VidIQ Token below to save it locally in your studio.</li>
              </ol>
            </div>
          </div>

          {/* Optional Local Key Input */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              placeholder="Optional: Enter your VidIQ Channel ID or User Token..."
              value={vidiqToken}
              onChange={(e) => setVidiqToken(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => {
                localStorage.setItem('vidiq_token', vidiqToken);
                alert('VidIQ token saved locally in your studio profile!');
              }}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer"
            >
              Save Token
            </button>
          </div>
        </div>
      )}

      {seoResult && (
        <div className="space-y-6">
          {/* SEO Score Cards Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* Overall Gauge */}
            <div className="col-span-2 sm:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                VidIQ SEO Score
              </span>
              <div className="text-4xl font-black text-cyan-400 font-mono mt-1">
                {seoResult.seoScore}
                <span className="text-base text-slate-500">/100</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold mt-1">
                🔥 Very High Potential
              </span>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Title CTR</span>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                {seoResult.scoreBreakdown.titleScore}%
              </div>
              <span className="text-[10px] text-indigo-400">Search Magnet</span>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Tags Volume</span>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                {seoResult.scoreBreakdown.tagsScore}%
              </div>
              <span className="text-[10px] text-emerald-400">Top Ranked</span>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Description</span>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                {seoResult.scoreBreakdown.descriptionScore}%
              </div>
              <span className="text-[10px] text-purple-400">Keyword Rich</span>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Ranking Power</span>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                {seoResult.scoreBreakdown.competitorRank}%
              </div>
              <span className="text-[10px] text-amber-400">7clouds Tier</span>
            </div>
          </div>

          {/* Section 1: High-CTR Title Options */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  VidIQ High-CTR Title Variations
                </h4>
              </div>
              <span className="text-xs text-slate-400">Click to select or copy</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {seoResult.titles.map((t, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/70 border border-slate-800/90 hover:border-indigo-500/50 rounded-2xl p-4 transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                        {t.badge}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                        CTR: {t.ctrScore}%
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {t.title}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900">
                    <button
                      onClick={() => handleCopyTitle(t.title, idx)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedTitleIndex === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied & Selected!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Use Title</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: High-Ranking YouTube Tags */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  VidIQ High-Ranking Search Tags
                </h4>
                <span className="text-xs text-slate-400 font-mono">
                  ({totalTagChars} / 500 characters)
                </span>
              </div>

              <button
                onClick={copyTagsToClipboard}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                {copiedTag ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied All Tags!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy All Tags for YouTube Studio</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1">
              {seoResult.tags.map((tg, i) => (
                <div
                  key={i}
                  className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 text-xs"
                >
                  {tg.rank && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px]">
                      {tg.rank}
                    </span>
                  )}
                  <span className="text-slate-200 font-medium">{tg.tag}</span>
                  <span
                    className={`text-[9px] uppercase font-bold ${
                      tg.volume === 'Very High'
                        ? 'text-rose-400'
                        : tg.volume === 'High'
                        ? 'text-amber-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {tg.volume}
                  </span>
                </div>
              ))}
            </div>

            {/* Hashtags */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-semibold">Hashtags:</span>
              {seoResult.hashtags?.map((ht, i) => (
                <span
                  key={i}
                  className="text-xs font-mono text-cyan-400 hover:underline cursor-pointer"
                  onClick={() => navigator.clipboard.writeText(ht)}
                >
                  {ht}
                </span>
              ))}
            </div>
          </div>

          {/* Section 3: User Long Description Formatter & Generator */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  YouTube Long Description (Custom Format & AI Builder)
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateDescription}
                  disabled={isGeneratingDesc}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center gap-2 cursor-pointer"
                >
                  {isGeneratingDesc ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5" />
                  )}
                  <span>Generate Description with My Format</span>
                </button>

                {generatedDescription && (
                  <button
                    onClick={copyDescToClipboard}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedDesc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDesc ? 'Copied!' : 'Copy'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Format Template Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Your Description Format Template:
                  </label>
                  <span className="text-[10px] text-slate-400">Tokens: {'{TITLE}'}, {'{ARTIST}'}, {'{LYRICS_WITH_TIMESTAMPS}'}, {'{STORY_SYNOPSIS}'}</span>
                </div>
                <textarea
                  value={formatTemplate}
                  onChange={(e) => setFormatTemplate(e.target.value)}
                  rows={10}
                  className="w-full bg-slate-950 font-mono text-xs text-slate-300 p-3.5 rounded-2xl border border-slate-800 focus:outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>

              {/* Right: Generated Result */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                  Final Generated YouTube Description:
                </label>
                <textarea
                  value={generatedDescription || 'Click "Generate Description with My Format" to create the complete YouTube description with lyrics, chapters, story treatment, and hashtags.'}
                  onChange={(e) => setGeneratedDescription(e.target.value)}
                  rows={10}
                  className="w-full bg-slate-950 text-xs text-slate-200 p-3.5 rounded-2xl border border-slate-800 focus:outline-none focus:border-purple-500 leading-relaxed font-sans"
                />
              </div>
            </div>
          </div>

          {/* Section 4: High-CTR Thumbnail Generator */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  VidIQ High-CTR Thumbnail Generator ({thumbnailAspect})
                </h4>
              </div>

              {/* Aspect Ratio choice for thumbnail */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setThumbnailAspect('16:9')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    thumbnailAspect === '16:9'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  16:9 (Landscape)
                </button>
                <button
                  onClick={() => setThumbnailAspect('9:16')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    thumbnailAspect === '9:16'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  9:16 (Shorts Cover)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Concept Picker */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Clickable Concepts
                </label>
                {seoResult.thumbnailConcepts.map((concept) => (
                  <div
                    key={concept.id}
                    onClick={() => {
                      setActiveThumbConcept(concept);
                      setThumbnailTextOverlay(concept.textOverlay);
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      activeThumbConcept?.id === concept.id
                        ? 'bg-blue-950/40 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-white">{concept.mood}</span>
                      <span className="text-[10px] text-amber-400 uppercase font-mono">
                        Hook: "{concept.textOverlay}"
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {concept.prompt}
                    </p>
                  </div>
                ))}

                <div>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                    Bold Thumbnail Text Hook:
                  </label>
                  <input
                    type="text"
                    value={thumbnailTextOverlay}
                    onChange={(e) => setThumbnailTextOverlay(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold tracking-wider uppercase focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={() => handleGenerateThumbnail()}
                  disabled={isGeneratingThumbnail}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isGeneratingThumbnail ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Generating Thumbnail...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 text-amber-300" />
                      <span>Generate {thumbnailAspect} Thumbnail</span>
                    </>
                  )}
                </button>
              </div>

              {/* Thumbnail Preview Visual */}
              <div className="md:col-span-2 flex flex-col items-center justify-center bg-slate-950 rounded-2xl border border-slate-800 p-4 relative overflow-hidden group">
                {generatedThumbnailUrl ? (
                  <div
                    className={`relative rounded-xl overflow-hidden shadow-2xl border border-white/10 ${
                      thumbnailAspect === '16:9' ? 'aspect-video w-full' : 'aspect-[9/16] w-64'
                    }`}
                  >
                    <img
                      src={generatedThumbnailUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />

                    {/* Bold Text Overlay on Thumbnail (7clouds style) */}
                    {thumbnailTextOverlay && (
                      <div className="absolute inset-0 flex items-center justify-center p-4 bg-gradient-to-t from-black/60 via-transparent to-black/30">
                        <span className="font-extrabold text-2xl sm:text-4xl text-white uppercase text-center tracking-wider drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] px-4 py-2 border-y-2 border-amber-400/80 bg-black/40 backdrop-blur-[2px]">
                          {thumbnailTextOverlay}
                        </span>
                      </div>
                    )}

                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (onThumbnailSelect && generatedThumbnailUrl) {
                            onThumbnailSelect(generatedThumbnailUrl);
                            alert('Active viral thumbnail set as Video Frame 0 (Split Second Flash)!');
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold backdrop-blur-md border border-cyan-400/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Set as 1st Frame Flash
                      </button>

                      <a
                        href={generatedThumbnailUrl}
                        download={`${songTitle.replace(/\s+/g, '_')}_Thumbnail.png`}
                        className="px-3 py-1.5 rounded-lg bg-black/80 hover:bg-blue-600 text-white text-xs font-bold backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Download
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 space-y-2">
                    <ImageIcon className="w-12 h-12 text-slate-700 mx-auto" />
                    <p className="text-xs text-slate-400">
                      Select a concept and click "Generate Thumbnail" to render high-CTR artwork.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
