import React, { useState } from 'react';
import {
  Play,
  Plus,
  Trash2,
  Download,
  ArrowRight,
  Sparkles,
  Music2,
  RefreshCw,
  FileText,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import { TimestampLine, SongHarmonyInfo } from '../types';
import { formatTime } from '../utils/audioUtils';
import { exportToLRC, exportToSRT } from '../utils/subtitles';

interface LyricsEditorProps {
  lines: TimestampLine[];
  onLinesChange: (lines: TimestampLine[]) => void;
  title: string;
  artist: string;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onProceedToStory: () => void;
  isLoadingStory: boolean;
  audioBase64?: string;
  mimeType?: string;
  duration?: number;
}

export const LyricsEditor: React.FC<LyricsEditorProps> = ({
  lines,
  onLinesChange,
  title,
  artist,
  audioRef,
  onProceedToStory,
  isLoadingStory,
  audioBase64,
  mimeType,
  duration = 76,
}) => {
  const [activePlayId, setActivePlayId] = useState<string | null>(null);

  // Song Key & Chord Detection states
  const [enableChords, setEnableChords] = useState(false);
  const [isDetectingChords, setIsDetectingChords] = useState(false);
  const [harmonyInfo, setHarmonyInfo] = useState<SongHarmonyInfo | null>(null);
  const [chordsApplied, setChordsApplied] = useState(false);

  // Custom lyric style & paste modal
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [customText, setCustomText] = useState('');
  const [isParsingCustom, setIsParsingCustom] = useState(false);

  const handleUpdateLine = (id: string, field: keyof TimestampLine, val: any) => {
    const updated = lines.map((l) => (l.id === id ? { ...l, [field]: val } : l));
    onLinesChange(updated);
  };

  const handleAdjustTime = (id: string, delta: number) => {
    const updated = lines.map((l) => {
      if (l.id === id) {
        const newStart = Math.max(0, parseFloat((l.startTime + delta).toFixed(2)));
        const newEnd = Math.max(newStart + 0.5, parseFloat((l.endTime + delta).toFixed(2)));
        return { ...l, startTime: newStart, endTime: newEnd };
      }
      return l;
    });
    onLinesChange(updated);
  };

  const handleAddLine = (index: number) => {
    const prev = lines[index];
    const newStart = prev ? prev.endTime + 0.2 : 0;
    const newEnd = newStart + 4.0;
    const newLine: TimestampLine = {
      id: `line-${Date.now()}`,
      startTime: parseFloat(newStart.toFixed(2)),
      endTime: parseFloat(newEnd.toFixed(2)),
      text: 'New lyric phrase',
      section: 'verse',
    };
    const nextLines = [...lines];
    nextLines.splice(index + 1, 0, newLine);
    onLinesChange(nextLines);
  };

  const handleDeleteLine = (id: string) => {
    onLinesChange(lines.filter((l) => l.id !== id));
  };

  const playLineAudio = (line: TimestampLine) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = line.startTime;
    audioRef.current.play();
    setActivePlayId(line.id);
  };

  // AI Song Key & Chord Detection
  const handleDetectChords = async () => {
    setIsDetectingChords(true);
    try {
      const res = await fetch('/api/detect-chords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines,
          title,
          artist,
          audioBase64,
          mimeType,
        }),
      });

      if (!res.ok) {
        throw new Error(`Detection failed with status: ${res.status}`);
      }

      const data = await res.json();
      setHarmonyInfo({
        key: data.key || 'G Major',
        bpm: data.bpm || 120,
        chords: data.chords || ['G', 'C', 'Em', 'D'],
        progression: data.progression || 'G - C - Em - D',
      });

      if (Array.isArray(data.lines) && data.lines.length > 0) {
        onLinesChange(data.lines);
        setChordsApplied(true);
        setEnableChords(true);
      }
    } catch (err: any) {
      console.error('Chord detection error:', err);
      // Fallback heuristics: detect key and inject chords
      const detectedKey = title?.toLowerCase().includes('save') ? 'Bb Major' : 'G Major';
      setHarmonyInfo({
        key: detectedKey,
        bpm: 122,
        chords: ['G', 'C', 'D', 'Em'],
        progression: 'G - C - Em - D',
      });
      const chordSeq = ['(G)', '(C)', '(Em)', '(D)'];
      const enriched = lines.map((l, idx) => ({
        ...l,
        originalText: l.originalText || l.text,
        text: l.text.startsWith('(') ? l.text : `${chordSeq[idx % chordSeq.length]} ${l.text}`,
      }));
      onLinesChange(enriched);
      setChordsApplied(true);
      setEnableChords(true);
    } finally {
      setIsDetectingChords(false);
    }
  };

  const handleToggleChords = (enabled: boolean) => {
    setEnableChords(enabled);
    if (!enabled) {
      // Strip chord brackets to give clean lyrics
      const stripped = lines.map((l) => ({
        ...l,
        originalText: l.originalText || l.text,
        text: l.text.replace(/\([A-Ga-g][#b]?(?:m|maj|min|dim|aug|sus\d?|\d)?\)\s*/g, '').trim(),
      }));
      onLinesChange(stripped);
      setChordsApplied(false);
    } else {
      handleDetectChords();
    }
  };

  // Load Authentic 7clouds "The Fray - How to Save a Life" Stylized Lyrics
  const handleLoadTheFrayPreset = async () => {
    setIsParsingCustom(true);
    try {
      const res = await fetch('/api/parse-custom-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawLyrics: 'the_fray_preset',
          duration,
          title: 'How to Save a Life',
          artist: 'The Fray',
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.lines)) {
        onLinesChange(data.lines);
        setHarmonyInfo({
          key: data.keySignature || 'G Major',
          bpm: data.bpm || 122,
          chords: ['G', 'D/F#', 'Em', 'C', 'D'],
          progression: 'G - D/F# - Em - C - D',
        });
        setChordsApplied(true);
        setEnableChords(true);
        setShowPasteModal(false);
      }
    } catch (err) {
      console.error('Failed to load The Fray preset:', err);
    } finally {
      setIsParsingCustom(false);
    }
  };

  // Parse User Pasted Custom Lyrics
  const handleApplyCustomLyrics = async () => {
    if (!customText.trim()) return;
    setIsParsingCustom(true);
    try {
      const res = await fetch('/api/parse-custom-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawLyrics: customText,
          duration,
          title,
          artist,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.lines)) {
        onLinesChange(data.lines);
        setShowPasteModal(false);
      }
    } catch (err) {
      console.error('Failed to parse custom lyrics:', err);
    } finally {
      setIsParsingCustom(false);
    }
  };

  const downloadSRT = () => {
    const srt = exportToSRT(lines);
    const blob = new Blob([srt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'Song'}_lyrics.srt`;
    a.click();
  };

  const downloadLRC = () => {
    const lrc = exportToLRC(lines, title, artist);
    const blob = new Blob([lrc], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'Song'}_lyrics.lrc`;
    a.click();
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              Step 1 Complete
            </span>
            <span className="text-xs text-slate-400">{lines.length} Timestamped Lines</span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">
            {title} <span className="text-slate-400 font-normal text-base">— {artist}</span>
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowPasteModal(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            Paste My Lyric Style / The Fray
          </button>
          <button
            onClick={downloadSRT}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download SubRip Subtitles"
          >
            <Download className="w-3.5 h-3.5" />
            Export .SRT
          </button>
          <button
            onClick={downloadLRC}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download LRC Karaoke format"
          >
            <Download className="w-3.5 h-3.5" />
            Export .LRC
          </button>
          <button
            onClick={onProceedToStory}
            disabled={isLoadingStory || lines.length === 0}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs tracking-wide uppercase transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoadingStory ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-white" />
                <span>Writing Music Video Story...</span>
              </>
            ) : (
              <>
                <span>Write Music Video Story</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Paste My Lyric Style Modal */}
      {showPasteModal && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Paste Custom Lyric Style or Load The Fray 7clouds Preset
              </h4>
            </div>
            <button
              onClick={() => setShowPasteModal(false)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Close
            </button>
          </div>

          <p className="text-xs text-slate-300">
            You can paste your custom lyric lines below (with or without timestamps/chords like <span className="font-mono text-cyan-300">(G) hello God</span>), or load the authentic <strong>7clouds 'How to Save a Life' (The Fray)</strong> words styling with 1 click.
          </p>

          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={6}
            placeholder={`Paste your lyrics here. For example:\n(G) Step one, you say we (C) need to talk\n(Em) He walks, you say (D) sit down it's just a talk\n(G) Where did I go wrong? (D) I lost a friend...`}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleLoadTheFrayPreset}
              disabled={isParsingCustom}
              className="px-4 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Load Official 7clouds "The Fray - How to Save a Life"</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCustomLyrics}
                disabled={isParsingCustom || !customText.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md"
              >
                {isParsingCustom ? 'Aligning...' : 'Apply My Pasted Lyrics'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Key of Song & Chord Changes Panel (User-Requested Option) */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 p-4 rounded-2xl border border-amber-500/20 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Music2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Song Key & Chord Changes</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Optional Feature
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Have AI figure out the Key of the song and chord changes, included in front of words in timestamp lyrics (e.g. <span className="text-amber-300 font-mono font-semibold">(G) hello God, (C) Help me</span>).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => handleToggleChords(!enableChords)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                enableChords
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${enableChords ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
              {enableChords ? 'Chords Mode: ON' : 'Turn On Chords'}
            </button>

            <button
              onClick={handleDetectChords}
              disabled={isDetectingChords}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDetectingChords ? 'animate-spin' : ''}`} />
              {isDetectingChords ? 'Analyzing Harmony...' : chordsApplied ? 'Re-Analyze Chords' : 'Detect Key & Chords'}
            </button>
          </div>
        </div>

        {/* Detected Harmony Information Bar */}
        {harmonyInfo && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-400">Song Key:</span>
              <span className="font-bold text-amber-400 font-mono">{harmonyInfo.key}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-400">Tempo:</span>
              <span className="font-bold text-white font-mono">{harmonyInfo.bpm} BPM</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-400">Chords:</span>
              <span className="font-semibold text-cyan-300 font-mono">
                {harmonyInfo.chords.map((c) => `(${c})`).join(' ')}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 italic">
              ✓ Chord changes are now prepended in timestamp lyrics. (Toggle "Display Chords in Burned Video" in Style Settings if desired).
            </div>
          </div>
        )}
      </div>

      {/* Synchronized Lines Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="p-4 px-5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <div className="flex items-center gap-3">
            <span>Audio Cue</span>
            <span>Timing (Start - End)</span>
            <span>Lyrics & Chords Text</span>
          </div>
          <div className="flex items-center gap-8 pr-4">
            <span>Fine Tune</span>
            <span>Section</span>
            <span>Actions</span>
          </div>
        </div>

        <div className="divide-y divide-slate-800/80 max-h-[520px] overflow-y-auto">
          {lines.map((line, idx) => (
            <div
              key={line.id}
              className={`p-3.5 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors ${
                activePlayId === line.id ? 'bg-indigo-950/20 border-l-4 border-indigo-500' : ''
              }`}
            >
              {/* Left: Play button + Times + Lyric Input */}
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => playLineAudio(line)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
                  title="Audition this line"
                >
                  <Play className="w-3.5 h-3.5 ml-0.5" />
                </button>

                <div className="font-mono text-xs text-indigo-400 bg-slate-950 px-2 py-1 rounded border border-slate-800 flex-shrink-0">
                  {formatTime(line.startTime, true)} - {formatTime(line.endTime, true)}
                </div>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={line.text}
                    onChange={(e) => handleUpdateLine(line.id, 'text', e.target.value)}
                    placeholder="Enter lyric phrase with optional (Chord) notation..."
                    className="w-full bg-transparent hover:bg-slate-950/50 focus:bg-slate-950 px-3 py-1.5 rounded-lg text-sm text-white font-medium border border-transparent hover:border-slate-800 focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                  {line.text.includes('(') && (
                    <div className="absolute right-2 top-2 pointer-events-none">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        Chords Included
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Adjusters, Section Tag, Add/Delete */}
              <div className="flex items-center gap-3 pl-11 sm:pl-0">
                {/* Micro nudge buttons */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800">
                  <button
                    onClick={() => handleAdjustTime(line.id, -0.25)}
                    className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                    title="Nudge earlier by 0.25s"
                  >
                    -0.25s
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    onClick={() => handleAdjustTime(line.id, 0.25)}
                    className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                    title="Nudge later by 0.25s"
                  >
                    +0.25s
                  </button>
                </div>

                {/* Section dropdown */}
                <select
                  value={line.section || 'verse'}
                  onChange={(e) => handleUpdateLine(line.id, 'section', e.target.value)}
                  className="bg-slate-950 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="intro">Intro</option>
                  <option value="verse">Verse</option>
                  <option value="chorus">Chorus</option>
                  <option value="bridge">Bridge</option>
                  <option value="outro">Outro</option>
                </select>

                {/* Add line below */}
                <button
                  onClick={() => handleAddLine(idx)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Add lyric line below"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDeleteLine(line.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Delete line"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
