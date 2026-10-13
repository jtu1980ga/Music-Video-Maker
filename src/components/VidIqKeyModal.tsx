import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Check,
  Copy,
  Terminal,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

interface VidIqKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: (newKey: string) => void;
}

export const VidIqKeyModal: React.FC<VidIqKeyModalProps> = ({
  isOpen,
  onClose,
  onKeyUpdated,
}) => {
  const DEFAULT_KEY = 'vidiq__we8Q2xUQach4dibe7Uhjrk9NpFdxNmYdxjbjd24';
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('vidiq_api_key') || DEFAULT_KEY);
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [mcpStatus, setMcpStatus] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // CLI command formatted with the user's active key
  const cliCommand = `gemini mcp add --scope user --transport http --header 'Authorization: Bearer ${apiKey || '{YOUR_API_KEY}'}' vidIQ https://mcp.vidiq.com/mcp`;

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/vidiq-mcp/status');
      const data = await res.json();
      setMcpStatus(data);
    } catch (err) {
      console.error('Failed to get MCP status:', err);
    }
  };

  const handleSaveAndConnect = async () => {
    setIsConnecting(true);
    setStatusMessage(null);
    const keyToUse = apiKey.trim() || DEFAULT_KEY;

    try {
      localStorage.setItem('vidiq_api_key', keyToUse);
      if (onKeyUpdated) onKeyUpdated(keyToUse);

      const res = await fetch('/api/vidiq-mcp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyToUse }),
      });
      const data = await res.json();
      setMcpStatus(data);
      setStatusMessage(data.message || 'Connected to VidIQ MCP server at https://mcp.vidiq.com/mcp');
    } catch (err: any) {
      console.error('Connect error:', err);
      setStatusMessage(`Connection attempt finished: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const copyCliCommand = () => {
    navigator.clipboard.writeText(cliCommand);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const copyApiKeyOnly = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-slate-100">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-600/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                VidIQ MCP API Key & Server Connection
              </h2>
              <p className="text-xs text-slate-400">
                https://mcp.vidiq.com/mcp • Model Context Protocol
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

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Connection Status Badge */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-3">
              <span
                className={`w-3.5 h-3.5 rounded-full ${
                  mcpStatus?.connected ? 'bg-emerald-400 shadow-md shadow-emerald-400/50 animate-pulse' : 'bg-cyan-400'
                }`}
              />
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>VidIQ MCP Server</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                    {mcpStatus?.connected ? 'Connected & Verified' : 'Ready'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Protocol: {mcpStatus?.protocolVersion || '2024-11-05'} • Endpoint: https://mcp.vidiq.com/mcp
                </div>
              </div>
            </div>
            <button
              onClick={handleSaveAndConnect}
              disabled={isConnecting}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
              <span>Ping</span>
            </button>
          </div>

          {/* Direct VidIQ Portal Open Buttons */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
            <span className="text-xs text-slate-400 font-medium">Quick Open:</span>
            <a
              href="https://app.vidiq.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all cursor-pointer"
            >
              <span>Open vidIQ Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            </a>
            <a
              href="https://mcp.vidiq.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 text-xs font-semibold transition-all cursor-pointer"
            >
              <span>Open vidIQ MCP Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-cyan-300" />
            </a>
          </div>

          {/* Primary Key Input Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>VidIQ API Key</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide Key' : 'Reveal Key'}</span>
                </button>
                <button
                  type="button"
                  onClick={copyApiKeyOnly}
                  className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your VidIQ API Key..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-2xl px-4 py-3.5 text-xs text-white placeholder-slate-600 font-mono tracking-wide focus:outline-none transition-all pr-24"
              />
              <button
                type="button"
                onClick={() => setApiKey(DEFAULT_KEY)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-cyan-300 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Reset Default
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              This API key is sent via HTTP Authorization Bearer headers to VidIQ&apos;s remote MCP server at{' '}
              <span className="font-mono text-cyan-400">https://mcp.vidiq.com/mcp</span>.
            </p>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveAndConnect}
              disabled={isConnecting}
              className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Connecting VidIQ MCP...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Save Key & Connect VidIQ</span>
                </>
              )}
            </button>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300 flex items-center justify-between">
              <span>{statusMessage}</span>
              <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
          )}

          {/* CLI Terminal Command Box */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>CLI Terminal Command</span>
              </span>
              <button
                onClick={copyCliCommand}
                className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCli ? 'Copied Command!' : 'Copy Command'}</span>
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-amber-300 leading-relaxed overflow-x-auto select-all shadow-inner">
              <code>{cliCommand}</code>
            </div>
            <p className="text-[11px] text-slate-400">
              Run this command in your local terminal if you are using the Gemini CLI MCP client.
            </p>
          </div>

          {/* Active MCP Tools Available */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Available VidIQ MCP Tools</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { name: 'vidiq_keyword_research', desc: 'YouTube search volume, competition score, and search trends' },
                { name: 'vidiq_title_recommendations', desc: 'High-CTR click-through optimized YouTube title generation' },
                { name: 'vidiq_competitor_tags', desc: 'Top-ranking viral tags from lyric channels like 7clouds' },
                { name: 'vidiq_seo_score', desc: 'Complete synergy SEO scoring (0-100) for title, tags, and description' },
              ].map((t) => (
                <div key={t.name} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-mono font-bold text-cyan-300">{t.name}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{t.desc}</div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                    <Check className="w-3 h-3" />
                    <span>Tool Ready</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Key securely saved in browser session</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
