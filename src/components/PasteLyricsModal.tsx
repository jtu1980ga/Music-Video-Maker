import React, { useState } from 'react';
import {
  FileText,
  X,
  Sparkles,
  Check,
  Copy,
  Clock,
  Music,
  HelpCircle,
  Layers,
  ArrowRight,
  ClipboardCopy,
  FileCheck,
  CheckCheck,
} from 'lucide-react';
import { TimestampLine } from '../types';
import {
  parseExternalLyrics,
  cleanLyricText,
  alignExternalLyricsToExistingTimestamps,
} from '../utils/lyricsCleaner';
import { exportToLRCWithoutHeader, exportToPlainText, exportToSRT } from '../utils/subtitles';

interface PasteLyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyLyrics: (lines: TimestampLine[], title?: string, artist?: string) => void;
  totalDuration: number;
  currentTitle: string;
  currentArtist: string;
  currentLines?: TimestampLine[];
}

type TabType = 'paste' | 'copy' | 'fray_preset';

export const PasteLyricsModal: React.FC<PasteLyricsModalProps> = ({
  isOpen,
  onClose,
  onApplyLyrics,
  totalDuration = 76,
  currentTitle,
  currentArtist,
  currentLines = [],
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('paste');
  const [inputText, setInputText] = useState('');
  const [songTitle, setSongTitle] = useState(currentTitle || 'How to Save a Life');
  const [songArtist, setSongArtist] = useState(currentArtist || 'The Fray');
  const [previewLines, setPreviewLines] = useState<TimestampLine[]>([]);
  const [detectedFormat, setDetectedFormat] = useState<string>('');
  const [alignmentMode, setAlignmentMode] = useState<'align_to_audio' | 'distribute'>('align_to_audio');
  
  // Copy notification states
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const showCopyNotice = (msg: string) => {
    setCopyFeedback(msg);
    setTimeout(() => {
      setCopyFeedback(null);
    }, 2500);
  };

  const handleCopyPlainLyrics = () => {
    const textToCopy = currentLines.length > 0 
      ? exportToPlainText(currentLines) 
      : previewLines.length > 0 
        ? exportToPlainText(previewLines)
        : '';
    
    if (!textToCopy) {
      showCopyNotice('No lyrics to copy yet!');
      return;
    }

    navigator.clipboard.writeText(textToCopy);
    showCopyNotice(`✓ Copied plain lyrics (${currentLines.length || previewLines.length} lines) to clipboard!`);
  };

  const handleCopyTimestampLyrics = () => {
    const lrcToCopy = currentLines.length > 0
      ? exportToLRCWithoutHeader(currentLines)
      : previewLines.length > 0
        ? exportToLRCWithoutHeader(previewLines)
        : '';

    if (!lrcToCopy) {
      showCopyNotice('No timestamped lyrics to copy yet!');
      return;
    }

    navigator.clipboard.writeText(lrcToCopy);
    showCopyNotice(`✓ Copied [mm:ss.xx] timestamped lyrics to clipboard!`);
  };

  const handleCopySrtLyrics = () => {
    const linesToUse = currentLines.length > 0 ? currentLines : previewLines;
    if (linesToUse.length === 0) {
      showCopyNotice('No lyrics to copy yet!');
      return;
    }

    const srtToCopy = exportToSRT(linesToUse);
    navigator.clipboard.writeText(srtToCopy);
    showCopyNotice(`✓ Copied SRT Subtitles to clipboard!`);
  };

  // Real-time parser whenever user types or pastes text
  const handleTextChange = (text: string, overrideAlignment?: 'align_to_audio' | 'distribute') => {
    setInputText(text);
    if (!text.trim()) {
      setPreviewLines([]);
      setDetectedFormat('');
      return;
    }

    const currentMode = overrideAlignment || alignmentMode;

    // Check if timestamped or plain
    const isTimestamped = /\[\d{1,2}:\d{2}/.test(text) || text.includes('-->');

    if (isTimestamped) {
      const { lines, detectedFormat: format } = parseExternalLyrics(text, totalDuration);
      setPreviewLines(lines);
      setDetectedFormat(format);
    } else {
      // Plain lyrics
      if (currentMode === 'align_to_audio' && currentLines.length > 0) {
        const aligned = alignExternalLyricsToExistingTimestamps(text, currentLines, totalDuration);
        setPreviewLines(aligned);
        setDetectedFormat(`Plain Lyrics (Aligned to ${currentLines.length} Audio Timestamps)`);
      } else {
        const { lines } = parseExternalLyrics(text, totalDuration);
        setPreviewLines(lines);
        setDetectedFormat('Plain Lyrics (Evenly Distributed)');
      }
    }
  };

  const handleAlignmentChange = (newMode: 'align_to_audio' | 'distribute') => {
    setAlignmentMode(newMode);
    if (inputText.trim()) {
      handleTextChange(inputText, newMode);
    }
  };

  const handleApply = () => {
    if (previewLines.length === 0 && inputText.trim()) {
      const { lines } = parseExternalLyrics(inputText, totalDuration);
      if (lines.length > 0) {
        onApplyLyrics(lines, songTitle, songArtist);
        onClose();
        return;
      }
    }

    if (previewLines.length > 0) {
      onApplyLyrics(previewLines, songTitle, songArtist);
      onClose();
    }
  };

  // 1-Click Load The Fray 7clouds Authentic Preset
  const handleLoadTheFray = () => {
    const frayTemplate = `[00:00.00] (G) Step one, you say we (C) need to talk
[00:07.50] (Em) He walks, you say (D) sit down it's just a talk
[00:13.00] (G) He smiles politely (C) back at you
[00:18.50] (Em) You stare politely (D) right on through
[00:24.00] (G) Some sort of window (C) to your right
[00:29.50] (Em) As he goes left and (D) you stay right
[00:35.00] (G) Between the lines of (C) fear and blame
[00:40.50] (Em) You begin to wonder (D) why you came
[00:46.00] (G) Where did I go wrong? (D) I lost a friend
[00:52.00] (Em) Somewhere along in the (C) bitterness
[00:58.00] (G) And I would have stayed up (D) with you all night
[01:04.00] (Em) Had I known (C) how to save a life`;

    setSongTitle('How to Save a Life');
    setSongArtist('The Fray');
    setActiveTab('paste');
    handleTextChange(frayTemplate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Lyrics Hub: Copy & Paste Central
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Universal Clipboard & Timestamps
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Copy transcribed plain/timestamped lyrics, or paste external lyrics from Genius, Spotify, AZLyrics, LRC, or SRT.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Toast / Feedback Notification */}
        {copyFeedback && (
          <div className="bg-emerald-600/90 text-white text-xs font-bold px-4 py-2 flex items-center justify-between animate-fade-in shadow-inner">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-200" />
              {copyFeedback}
            </span>
            <button
              onClick={() => setCopyFeedback(null)}
              className="text-emerald-200 hover:text-white text-xs underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800/80 bg-slate-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'paste'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>📥 Paste External Lyrics (Plain or Timestamped)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('copy')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'copy'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>📋 Copy Transcribed Lyrics</span>
            {currentLines.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-900/60 text-emerald-300">
                {currentLines.length} Lines
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleLoadTheFray}
            className="ml-auto px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950 to-blue-950 hover:from-cyan-900 hover:to-blue-900 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>1-Click The Fray 7clouds Preset</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* TAB 1: PASTE EXTERNAL LYRICS */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              {/* Song Title & Artist Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Song Title
                  </label>
                  <input
                    type="text"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    placeholder="Song Title"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Artist Name
                  </label>
                  <input
                    type="text"
                    value={songArtist}
                    onChange={(e) => setSongArtist(e.target.value)}
                    placeholder="Artist Name"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Supported Formats Info Banner */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Paste either plain text or timestamped formats below:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px] text-slate-400">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-cyan-300 font-bold block mb-0.5">1. Plain Lyrics</span>
                    Step one, you say we talk<br />
                    Where did I go wrong?<br />
                    <span className="text-[10px] text-slate-500 font-sans">(From Genius, AZLyrics, Spotify)</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-cyan-300 font-bold block mb-0.5">2. LRC Timestamps</span>
                    [00:07.50] Step one, you say...<br />
                    [00:13.00] He walks, you say...<br />
                    <span className="text-[10px] text-slate-500 font-sans">(Karaoke LRC format)</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-cyan-300 font-bold block mb-0.5">3. Chords & Lead Sheet</span>
                    (G) Step one, you say (C) we talk<br />
                    (Em) He walks, you say (D)...<br />
                    <span className="text-[10px] text-slate-500 font-sans">(7clouds chord bracket style)</span>
                  </div>
                </div>
              </div>

              {/* Audio Timing Alignment Option (When current lines exist) */}
              {currentLines.length > 0 && !/\[\d{1,2}:\d{2}/.test(inputText) && (
                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                  <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>How would you like to time the pasted plain lyrics?</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAlignmentChange('align_to_audio')}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        alignmentMode === 'align_to_audio'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-indigo-300 flex items-center justify-between">
                        <span>Align to Audio Timestamps (Recommended)</span>
                        {alignmentMode === 'align_to_audio' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Uses the real audio start & end times from transcription, replacing only the words with your pasted lyrics.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAlignmentChange('distribute')}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        alignmentMode === 'distribute'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                        <span>Evenly Distribute Over Track</span>
                        {alignmentMode === 'distribute' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Divides lines evenly across the {Math.round(totalDuration)} second duration.
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Paste Lyrics Here:</span>
                    {detectedFormat && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono">
                        {detectedFormat}
                      </span>
                    )}
                  </label>
                  {previewLines.length > 0 && (
                    <span className="text-slate-400 text-[11px]">
                      {previewLines.length} pure lines parsed
                    </span>
                  )}
                </div>

                <textarea
                  value={inputText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  rows={8}
                  placeholder={`Paste your lyrics here...\n\nExample Plain Lyrics:\nStep one, you say we need to talk\nHe walks, you say sit down it's just a talk\n\nExample Timestamped (LRC):\n[00:07.50] (G) Step one, you say we (C) need to talk\n[00:13.00] (Em) He walks, you say (D) sit down it's just a talk`}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-2xl p-4 text-xs font-mono text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Clean Preview Table */}
              {previewLines.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Sanitized Lyrics Preview (All noise, headers & chatter stripped):</span>
                    </h4>
                  </div>

                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/90 divide-y divide-slate-850">
                    {previewLines.map((line) => (
                      <div key={line.id} className="p-2.5 px-3.5 flex items-center justify-between text-xs gap-3">
                        <div className="flex items-center gap-2 font-mono text-[11px] text-cyan-400 flex-shrink-0">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{line.startTime.toFixed(2)}s - {line.endTime.toFixed(2)}s</span>
                        </div>
                        <div className="flex-1 text-white font-medium truncate">
                          {line.text}
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-400">
                          {line.section}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: COPY TRANSCRIBED LYRICS */}
          {activeTab === 'copy' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Copy className="w-4 h-4 text-emerald-400" />
                      <span>Copy Current Song Lyrics to Clipboard</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {currentLines.length > 0
                        ? `Currently ${currentLines.length} lines available in the project.`
                        : 'No lyrics transcribed yet. Transcribe an audio file or paste lyrics to copy.'}
                    </p>
                  </div>

                  {/* 1-Click Copy Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleCopyPlainLyrics}
                      disabled={currentLines.length === 0 && previewLines.length === 0}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-40"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Plain Words Only</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyTimestampLyrics}
                      disabled={currentLines.length === 0 && previewLines.length === 0}
                      className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-cyan-600/30 cursor-pointer disabled:opacity-40"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Copy Timestamped (LRC)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopySrtLyrics}
                      disabled={currentLines.length === 0 && previewLines.length === 0}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy .SRT Format</span>
                    </button>
                  </div>
                </div>

                {/* Inspectable & Selectable Text Area for User Copying */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">
                      Plain Lyrics (Ready to Paste to External Document or Genius):
                    </span>
                    <span>{(currentLines.length > 0 ? currentLines : previewLines).length} lines</span>
                  </div>
                  <textarea
                    readOnly
                    value={
                      currentLines.length > 0
                        ? exportToPlainText(currentLines)
                        : previewLines.length > 0
                          ? exportToPlainText(previewLines)
                          : 'No transcribed lyrics available yet. Transcribe your song or paste lyrics.'
                    }
                    rows={6}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 select-all focus:outline-none"
                  />
                </div>

                {/* Timestamped LRC Text Area */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-cyan-300">
                      Timestamped Lyrics [mm:ss.xx] (Karaoke LRC format):
                    </span>
                    <span>Ready for external subtitle / media players</span>
                  </div>
                  <textarea
                    readOnly
                    value={
                      currentLines.length > 0
                        ? exportToLRCWithoutHeader(currentLines)
                        : previewLines.length > 0
                          ? exportToLRCWithoutHeader(previewLines)
                          : 'No timestamped lyrics available yet.'
                    }
                    rows={6}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-cyan-300/90 select-all focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>

          {activeTab === 'paste' ? (
            <button
              type="button"
              onClick={handleApply}
              disabled={previewLines.length === 0 && !inputText.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-cyan-600/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply {previewLines.length > 0 ? `${previewLines.length} Clean Lyrics` : 'Lyrics'} to Video</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyPlainLyrics}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Plain Words</span>
              </button>
              <button
                type="button"
                onClick={handleCopyTimestampLyrics}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Copy Timestamped (LRC)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
