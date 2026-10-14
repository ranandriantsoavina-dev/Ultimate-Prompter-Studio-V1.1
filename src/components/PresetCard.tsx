import React from 'react';
import { Edit3, Check, Flame, GripVertical } from 'lucide-react';
import { Preset } from '../types/prompter';
import { VisualThumbnail } from './VisualThumbnail';

interface PresetCardProps {
  preset: Preset;
  isActive: boolean;
  onToggle: () => void;
  onEdit: () => void;
  nsfwOn?: boolean;
  dragProps?: any;
  handleProps?: any;
  isDragging?: boolean;
}

export const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  isActive,
  onToggle,
  onEdit,
  nsfwOn = false,
  dragProps,
  handleProps,
  isDragging = false
}) => {
  return (
    <div
      {...dragProps}
      onClick={onToggle}
      className={`group relative flex flex-col rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border text-left select-none ${
        isDragging
          ? nsfwOn
            ? 'scale-105 z-30 shadow-[0_0_25px_rgba(255,34,56,0.5)] ring-2 ring-red-500 opacity-95 bg-[#181215] cursor-grabbing'
            : 'scale-105 z-30 shadow-[0_0_25px_rgba(255,102,0,0.5)] ring-2 ring-orange-500 opacity-95 bg-[#181412] cursor-grabbing'
          : isActive
          ? nsfwOn
            ? 'bg-[#181215]/90 border-red-500/50 shadow-[0_0_16px_rgba(255,34,56,0.25)]'
            : 'bg-[#181412]/90 border-orange-500/50 shadow-[0_0_16px_rgba(255,102,0,0.25)]'
          : 'bg-[#121116]/80 hover:bg-[#16151b] border-white/[0.06] hover:border-white/[0.15]'
      } ${dragProps?.className || ''}`}
    >
      {/* Active Indicator Badge */}
      {isActive && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-orange-500 text-black font-bold text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1">
          <Check className="w-3 h-3 stroke-[2.5]" />
          <span>Active</span>
        </div>
      )}

      {/* Top Right Controls (Grip handle & NSFW badge) */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 pointer-events-auto">
        {/* Grip Handle */}
        <div
          {...handleProps}
          title="Hold & drag to reorder preset"
          className="p-1 rounded bg-black/60 hover:bg-black/90 text-white/40 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-3 h-3 stroke-[2]" />
        </div>

        {/* NSFW Possible Badge */}
        {preset.nsfw && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-[9px] font-medium text-white/70 backdrop-blur-md">
            <Flame className="w-2.5 h-2.5 text-rose-400 stroke-[1.5]" />
            <span>NSFW</span>
          </div>
        )}
      </div>

      {/* Minimalist Edit Trigger (Hover) */}
      <button
        data-no-drag="true"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        title="Edit preset details and image"
        className="absolute bottom-11 right-2 z-10 p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white/50 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
      >
        <Edit3 className="w-3 h-3 stroke-[1.5]" />
      </button>

      {/* Card Visual Artwork (Square) */}
      <VisualThumbnail
        image={preset.image}
        imgPos={preset.imgPos}
        name={preset.name}
        categoryIcon={preset.kind === 'outfit' ? 'Shirt' : 'Sparkles'}
        aspect="aspect-square"
      />

      {/* Card Footer Info */}
      <div className="p-3 flex items-center justify-between gap-2 border-t border-white/[0.04] bg-[#121116]/90 pointer-events-none">
        <div className="min-w-0">
          <h3 className="font-semibold text-xs text-white/95 truncate">
            {preset.name}
          </h3>
          {preset.description ? (
            <p className="text-[11px] text-white/40 truncate mt-0.5">
              {preset.description}
            </p>
          ) : (
            <p className="text-[11px] text-white/30 truncate mt-0.5 capitalize">
              {preset.kind} Preset ({preset.picks.length} items)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
