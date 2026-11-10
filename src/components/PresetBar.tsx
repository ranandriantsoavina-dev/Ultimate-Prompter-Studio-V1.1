import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Preset } from '../types/prompter';
import { PresetCard } from './PresetCard';
import { useHoldAndSlide } from '../hooks/useHoldAndSlide';

interface PresetBarProps {
  presets: Preset[];
  activePreset: string | null;
  onTogglePreset: (id: string) => void;
  onAddPreset: (kind: 'outfit' | 'context') => void;
  onEditPreset: (preset: Preset) => void;
  onReorderPresets?: (newPresets: Preset[]) => void;
  nsfwOn: boolean;
}

export const PresetBar: React.FC<PresetBarProps> = ({
  presets,
  activePreset,
  onTogglePreset,
  onAddPreset,
  onEditPreset,
  onReorderPresets,
  nsfwOn
}) => {
  const [outfitFolded, setOutfitFolded] = useState(false);
  const [contextFolded, setContextFolded] = useState(false);

  // Filter presets strictly by main NSFW toggle: completely hide NSFW presets when nsfwOn is false
  const visiblePresets = presets.filter((p) => nsfwOn || p.nsfw !== true);
  const outfitPresets = visiblePresets.filter((p) => p.kind === 'outfit');
  const contextPresets = visiblePresets.filter((p) => p.kind === 'context');

  // Hold-and-slide reordering for outfit presets
  const outfitReorder = useHoldAndSlide<Preset>({
    groupId: 'presets-outfit',
    items: outfitPresets,
    onReorder: (newOutfitPresets) => {
      if (!onReorderPresets) return;
      let outfitIdx = 0;
      const updated = presets.map((p) => {
        if (p.kind === 'outfit' && (nsfwOn || p.nsfw !== true)) {
          return newOutfitPresets[outfitIdx++] || p;
        }
        return p;
      });
      onReorderPresets(updated);
    }
  });

  // Hold-and-slide reordering for context presets
  const contextReorder = useHoldAndSlide<Preset>({
    groupId: 'presets-context',
    items: contextPresets,
    onReorder: (newContextPresets) => {
      if (!onReorderPresets) return;
      let contextIdx = 0;
      const updated = presets.map((p) => {
        if (p.kind === 'context' && (nsfwOn || p.nsfw !== true)) {
          return newContextPresets[contextIdx++] || p;
        }
        return p;
      });
      onReorderPresets(updated);
    }
  });

  return (
    <div className="space-y-6 mb-6 p-4 rounded-2xl bg-[#121116]/80 backdrop-blur-md border border-white/[0.06]">
      {/* Outfit presets section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setOutfitFolded(!outfitFolded)}
            className="flex items-center gap-2 text-xs font-semibold text-white/70 hover:text-white tracking-wide uppercase font-mono transition-colors group"
          >
            <span>Outfit Presets ({outfitPresets.length})</span>
            <div className="w-5 h-5 rounded-md bg-white/[0.04] group-hover:bg-white/[0.08] flex items-center justify-center transition-colors">
              {outfitFolded ? (
                <ChevronDown className="w-3.5 h-3.5 text-white/50" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-white/50" />
              )}
            </div>
          </button>
          <button
            onClick={() => onAddPreset('outfit')}
            className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
              nsfwOn 
                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30' 
                : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/30'
            }`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2]" />
            <span>New outfit preset</span>
          </button>
        </div>

        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5 transition-all duration-300 ease-in-out ${
          outfitFolded ? 'max-h-0 opacity-0 overflow-hidden mb-0' : 'max-h-[2000px] opacity-100'
        }`}>
          {outfitPresets.map((preset, index) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isActive={activePreset === preset.id}
              onToggle={() => {
                if (outfitReorder.justDragged.current) return;
                onTogglePreset(preset.id);
              }}
              onEdit={() => onEditPreset(preset)}
              nsfwOn={nsfwOn}
              dragProps={outfitReorder.getItemProps(index)}
              handleProps={outfitReorder.getHandleProps(index)}
              isDragging={outfitReorder.dragIndex === index}
            />
          ))}
          {/* Add Outfit Preset Card Button */}
          <button
            onClick={() => onAddPreset('outfit')}
            className={`rounded-xl border border-dashed p-6 flex flex-col items-center justify-center gap-2 transition-all group min-h-[160px] duration-300 ${
              nsfwOn
                ? 'border-white/10 hover:border-red-500/50 bg-[#121116]/80 hover:bg-[#181215] text-white/40 hover:text-red-300'
                : 'border-white/10 hover:border-orange-500/50 bg-[#121116]/80 hover:bg-[#181412] text-white/40 hover:text-orange-300'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center transition-colors ${
              nsfwOn ? 'group-hover:bg-red-500/10 group-hover:text-red-400' : 'group-hover:bg-orange-500/10 group-hover:text-orange-400'
            }`}>
              <Plus className="w-4 h-4 stroke-[1.8]" />
            </div>
            <span className="text-xs font-semibold">New Outfit Preset</span>
          </button>
        </div>
      </div>

      <div className="h-[1px] bg-white/[0.06]" />

      {/* Context presets section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setContextFolded(!contextFolded)}
            className="flex items-center gap-2 text-xs font-semibold text-white/70 hover:text-white tracking-wide uppercase font-mono transition-colors group"
          >
            <span>Context & Scene Presets ({contextPresets.length})</span>
            <div className="w-5 h-5 rounded-md bg-white/[0.04] group-hover:bg-white/[0.08] flex items-center justify-center transition-colors">
              {contextFolded ? (
                <ChevronDown className="w-3.5 h-3.5 text-white/50" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-white/50" />
              )}
            </div>
          </button>
          <button
            onClick={() => onAddPreset('context')}
            className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
              nsfwOn 
                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30' 
                : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/30'
            }`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2]" />
            <span>New context preset</span>
          </button>
        </div>

        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5 transition-all duration-300 ease-in-out ${
          contextFolded ? 'max-h-0 opacity-0 overflow-hidden mb-0' : 'max-h-[2000px] opacity-100'
        }`}>
          {contextPresets.map((preset, index) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isActive={activePreset === preset.id}
              onToggle={() => {
                if (contextReorder.justDragged.current) return;
                onTogglePreset(preset.id);
              }}
              onEdit={() => onEditPreset(preset)}
              nsfwOn={nsfwOn}
              dragProps={contextReorder.getItemProps(index)}
              handleProps={contextReorder.getHandleProps(index)}
              isDragging={contextReorder.dragIndex === index}
            />
          ))}
          {/* Add Context Preset Card Button */}
          <button
            onClick={() => onAddPreset('context')}
            className={`rounded-xl border border-dashed p-6 flex flex-col items-center justify-center gap-2 transition-all group min-h-[160px] duration-300 ${
              nsfwOn
                ? 'border-white/10 hover:border-red-500/50 bg-[#121116]/80 hover:bg-[#181215] text-white/40 hover:text-red-300'
                : 'border-white/10 hover:border-orange-500/50 bg-[#121116]/80 hover:bg-[#181412] text-white/40 hover:text-orange-300'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center transition-colors ${
              nsfwOn ? 'group-hover:bg-red-500/10 group-hover:text-red-400' : 'group-hover:bg-orange-500/10 group-hover:text-orange-400'
            }`}>
              <Plus className="w-4 h-4 stroke-[1.8]" />
            </div>
            <span className="text-xs font-semibold">New Context Preset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
