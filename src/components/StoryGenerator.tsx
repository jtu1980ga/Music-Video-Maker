import React, { useState } from 'react';
import { Film, Palette, Users, Sparkles, ArrowRight, RefreshCw, Feather, BookOpen, Layers } from 'lucide-react';
import { StoryTreatment } from '../types';

interface StoryGeneratorProps {
  story: StoryTreatment;
  onUpdateStory: (updated: StoryTreatment) => void;
  onRegenerateStory: (moodPrompt?: string) => void;
  isRegenerating: boolean;
  onProceedToScenes: () => void;
  isLoadingScenes: boolean;
}

export const StoryGenerator: React.FC<StoryGeneratorProps> = ({
  story,
  onUpdateStory,
  onRegenerateStory,
  isRegenerating,
  onProceedToScenes,
  isLoadingScenes,
}) => {
  const [selectedMood, setSelectedMood] = useState('7clouds Atmospheric');

  const moods = [
    '7clouds Rainy Dusk & Tungsten Warmth',
    'Golden Hour Nostalgia & Friendship',
    '35mm Anamorphic Melancholy',
    'Cyberpunk Twilight Neon Mist',
    'Acoustic Warmth & Floating Sunlight',
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              Step 2 • Music Video Treatment
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">
            {story.title} <span className="text-slate-400 font-normal text-base">— Narrative Screenplay</span>
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onProceedToScenes}
            disabled={isLoadingScenes}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs tracking-wide uppercase transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoadingScenes ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-white" />
                <span>Splitting into 10s Prompts...</span>
              </>
            ) : (
              <>
                <span>Split into 10s Scene Prompts</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid: Concept details & Visual Direction */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Logline & Synopsis */}
        <div className="md:col-span-2 space-y-6">
          {/* Logline Box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
              <Film className="w-4 h-4" />
              Core Narrative Concept & Logline
            </div>
            <textarea
              value={story.logline}
              onChange={(e) => onUpdateStory({ ...story, logline: e.target.value })}
              rows={2}
              className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded-xl p-3.5 text-white font-medium text-base focus:outline-none transition-colors"
            />
          </div>

          {/* Three-Act Synopsis */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400">
                <BookOpen className="w-4 h-4" />
                Screenplay Arc (Synchronized with Lyrics)
              </div>
            </div>
            <textarea
              value={story.synopsis}
              onChange={(e) => onUpdateStory({ ...story, synopsis: e.target.value })}
              rows={6}
              className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded-xl p-3.5 text-slate-200 text-sm leading-relaxed focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Right Col: Style, Palette, Motifs */}
        <div className="space-y-6">
          {/* Visual Style & 7clouds Aesthetics */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Palette className="w-4 h-4" />
              7clouds Visual Aesthetic
            </div>

            <textarea
              value={story.visualStyle}
              onChange={(e) => onUpdateStory({ ...story, visualStyle: e.target.value })}
              rows={3}
              className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-300 focus:outline-none transition-colors leading-relaxed"
            />

            {/* Color Palette Swatches */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Color Palette Grading
              </span>
              <div className="flex items-center gap-2">
                {story.colorPalette?.map((color, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <div
                      className="w-full h-8 rounded-lg border border-white/10 shadow-sm transition-transform group-hover:scale-105"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[10px] font-mono text-slate-500">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Characters & Motifs */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Layers className="w-4 h-4" />
              Visual Motifs & Characters
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-slate-400 font-semibold block">Key Motifs:</span>
              <div className="flex flex-wrap gap-1.5">
                {story.keyMotifs?.map((motif, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 text-[11px]"
                  >
                    {motif}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-slate-400 font-semibold text-xs block">Characters:</span>
              <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                {story.characters?.map((char, i) => (
                  <li key={i} className="truncate">{char}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Regenerate story with preset mood */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
            <span className="text-xs font-medium text-slate-400 block">Regenerate with a different mood:</span>
            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
            >
              {moods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <button
              onClick={() => onRegenerateStory(selectedMood)}
              disabled={isRegenerating}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-indigo-400' : ''}`} />
              {isRegenerating ? 'Crafting New Arc...' : 'Re-roll Screenplay'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
