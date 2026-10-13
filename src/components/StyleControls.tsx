import React from 'react';
import { Sliders, Type, Sparkles, Sun, Eye, Film, Layers } from 'lucide-react';
import { VideoStyleSettings } from '../types';

interface StyleControlsProps {
  settings: VideoStyleSettings;
  onChange: (updated: VideoStyleSettings) => void;
}

export const StyleControls: React.FC<StyleControlsProps> = ({ settings, onChange }) => {
  const presets = [
    {
      id: '7clouds_classic',
      name: '7clouds: The Fray (How to Save a Life)',
      desc: 'Authentic 7clouds bold Montserrat typography, glowing pure white lyrics, floating dust motes, split-second thumbnail intro, and dark atmospheric vignette',
      config: {
        preset: '7clouds_classic' as const,
        fontFamily: 'Montserrat',
        fontSize: 42,
        textPosition: 'center' as const,
        textColor: '#FFFFFF',
        glowColor: 'rgba(255, 255, 255, 0.45)',
        glowIntensity: 24,
        backgroundDim: 45,
        floatingParticles: true,
        particleSpeed: 1.0,
        filmGrain: true,
        kenBurnsEffect: true,
        showTitleCard: true,
        titleCardDuration: 4.5,
        showWatermark: true,
        watermarkText: '7clouds Lyrics',
      },
    },
    {
      id: 'the_fray_moody',
      name: 'The Fray Rainy Dusk',
      desc: 'Moody 35mm anamorphic aesthetic with cinematic lower-third typography',
      config: {
        preset: 'the_fray_moody' as const,
        fontFamily: 'Bebas Neue',
        fontSize: 54,
        textPosition: 'lower_third' as const,
        textColor: '#F8FAFC',
        glowColor: 'rgba(56, 189, 248, 0.35)',
        glowIntensity: 18,
        backgroundDim: 55,
        floatingParticles: true,
        particleSpeed: 0.8,
        filmGrain: true,
        kenBurnsEffect: true,
        showTitleCard: true,
        titleCardDuration: 5.0,
        showWatermark: true,
        watermarkText: 'The Fray (Lyrics)',
      },
    },
    {
      id: 'cinematic_warm',
      name: 'Golden Hour Bokeh',
      desc: 'Warm amber glow, gentle slow push-in, intimate acoustic warmth',
      config: {
        preset: 'cinematic_warm' as const,
        fontFamily: 'Montserrat',
        fontSize: 40,
        textPosition: 'center' as const,
        textColor: '#FFFBEB',
        glowColor: 'rgba(251, 191, 36, 0.40)',
        glowIntensity: 25,
        backgroundDim: 40,
        floatingParticles: true,
        particleSpeed: 1.2,
        filmGrain: false,
        kenBurnsEffect: true,
        showTitleCard: true,
        titleCardDuration: 4.0,
        showWatermark: true,
        watermarkText: '7clouds Acoustic',
      },
    },
  ];

  const applyPreset = (presetConfig: Partial<VideoStyleSettings>) => {
    onChange({ ...settings, ...presetConfig });
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-6">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
        <Sliders className="w-4 h-4 text-indigo-400" />
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
          7clouds Lyric Video Style Controls
        </h4>
      </div>

      {/* Preset cards */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          Aesthetic Style Presets
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {presets.map((p) => {
            const isSelected = settings.preset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p.config)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-white">{p.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                  {p.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fine-Tuning Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-slate-800/80 text-xs">
        {/* Font Family & Size */}
        <div className="space-y-3">
          <div>
            <label className="text-slate-400 font-medium block mb-1">Typography Font</label>
            <select
              value={settings.fontFamily}
              onChange={(e) => onChange({ ...settings, fontFamily: e.target.value })}
              className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="Montserrat">Montserrat (Signature 7clouds)</option>
              <option value="Inter">Inter (Ultra Clean Modern)</option>
              <option value="Bebas Neue">Bebas Neue (Bold Cinematic Sans)</option>
              <option value="Playfair Display">Playfair Display (Poetic Editorial)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Font Size</span>
              <span className="font-mono text-indigo-400">{settings.fontSize}px</span>
            </div>
            <input
              type="range"
              min={24}
              max={64}
              value={settings.fontSize}
              onChange={(e) => onChange({ ...settings, fontSize: parseInt(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>

          <div>
            <label className="text-slate-400 font-medium block mb-1">Canvas Aspect Ratio</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...settings, aspectRatio: '16:9' })}
                className={`py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                  settings.aspectRatio === '16:9'
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                16:9 (Landscape)
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...settings, aspectRatio: '9:16' })}
                className={`py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                  settings.aspectRatio === '9:16'
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                9:16 (Shorts)
              </button>
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-medium block mb-1">Text Position</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...settings, textPosition: 'center' })}
                className={`py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                  settings.textPosition === 'center'
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Center
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...settings, textPosition: 'lower_third' })}
                className={`py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                  settings.textPosition === 'lower_third'
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Lower-Third
              </button>
            </div>
          </div>
        </div>

        {/* Glow, Dim & Atmosphere */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Halo Glow Intensity</span>
              <span className="font-mono text-indigo-400">{settings.glowIntensity}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={45}
              value={settings.glowIntensity}
              onChange={(e) => onChange({ ...settings, glowIntensity: parseInt(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Background Dim Overlay</span>
              <span className="font-mono text-indigo-400">{settings.backgroundDim}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={85}
              value={settings.backgroundDim}
              onChange={(e) => onChange({ ...settings, backgroundDim: parseInt(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Toggles */}
          <div className="pt-2 space-y-2">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.floatingParticles}
                onChange={(e) => onChange({ ...settings, floatingParticles: e.target.checked })}
                className="accent-indigo-500 rounded"
              />
              <span>Floating 7clouds Bokeh Dust Motes</span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.kenBurnsEffect}
                onChange={(e) => onChange({ ...settings, kenBurnsEffect: e.target.checked })}
                className="accent-indigo-500 rounded"
              />
              <span>Dynamic Ken Burns Camera Push-in</span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showTitleCard}
                onChange={(e) => onChange({ ...settings, showTitleCard: e.target.checked })}
                className="accent-indigo-500 rounded"
              />
              <span>Intro Song & Artist Title Card (0-4s)</span>
            </label>

            <label className="flex items-center gap-2 text-cyan-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.flashThumbnailIntro ?? true}
                onChange={(e) => onChange({ ...settings, flashThumbnailIntro: e.target.checked })}
                className="accent-cyan-500 rounded"
              />
              <span>Flash Viral Thumbnail for Split Second (Frame 0)</span>
            </label>

            <label className="flex items-center gap-2 text-amber-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showChordsInVideo ?? false}
                onChange={(e) => onChange({ ...settings, showChordsInVideo: e.target.checked })}
                className="accent-amber-500 rounded"
              />
              <span>Show Chord Changes in Video (e.g. (G) Hello, (C) Help me)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
