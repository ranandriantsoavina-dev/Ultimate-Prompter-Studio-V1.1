import React from 'react';
import { Check, Edit3, Flame, GripVertical } from 'lucide-react';
import { PromptElement } from '../types/prompter';
import { VisualThumbnail } from './VisualThumbnail';

interface ElementCardProps {
  element: PromptElement;
  isSelected: boolean;
  onToggle: () => void;
  onEdit: () => void;
  nsfwOn: boolean;
  categoryIcon?: string;
  weight?: number;
  dragProps?: React.HTMLAttributes<HTMLDivElement>;
  handleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
}

export const ElementCard: React.FC<ElementCardProps> = ({
  element,
  isSelected,
  onToggle,
  onEdit,
  nsfwOn,
  categoryIcon,
  weight,
  dragProps,
  handleProps,
  isDragging = false
}) => {
  return (
    <div
      {...dragProps}
      onClick={onToggle}
      className={`group relative flex flex-col rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border text-left active:scale-[0.99] select-none ${
        isDragging
          ? nsfwOn
            ? 'scale-105 z-30 shadow-[0_0_25px_rgba(255,34,56,0.5)] ring-2 ring-red-500 opacity-95 cursor-grabbing bg-[#181215]'
            : 'scale-105 z-30 shadow-[0_0_25px_rgba(255,102,0,0.5)] ring-2 ring-orange-500 opacity-95 cursor-grabbing bg-[#181412]'
          : isSelected
          ? nsfwOn
            ? 'bg-[#181215]/95 border-red-500/60 shadow-[0_0_15px_rgba(255,34,56,0.2)]'
            : 'bg-[#181412]/95 border-orange-500/60 shadow-[0_0_15px_rgba(255,102,0,0.2)]'
          : 'bg-[#121116]/80 hover:bg-[#16151b] border-white/[0.06] hover:border-white/[0.15]'
      } ${dragProps?.className || ''}`}
    >
      {/* Selection Checkmark Badge with theme color */}
      {isSelected && (
        <div
          className={`absolute top-2 left-2 z-10 w-5 h-5 rounded-md flex items-center justify-center font-bold shadow-sm animate-in zoom-in-75 duration-100 transition-colors duration-500 ${
            nsfwOn ? 'bg-red-500 text-white' : 'bg-orange-500 text-black'
          }`}
        >
          <Check className="w-3 h-3 stroke-[2.5]" />
        </div>
      )}

      {/* Weight Badge (if adjusted) */}
      {weight && weight !== 1 && (
        <div className="absolute bottom-12 left-2 z-10 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-white/90 border border-white/20">
          {weight}x
        </div>
      )}

      {/* Top Right Controls (Grip Handle & NSFW Tag) */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 pointer-events-auto">
        {/* Grip Handle */}
        <div
          {...handleProps}
          title="Hold & drag to reorder element"
          className="p-1 rounded bg-black/60 hover:bg-black/90 text-white/40 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-3 h-3 stroke-[2]" />
        </div>

        {/* Minimalist NSFW Tag */}
        {element.nsfw && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-[9px] font-medium text-white/60 backdrop-blur-md">
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
        title="Edit element"
        className="absolute bottom-11 right-2 z-10 p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white/50 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
      >
        <Edit3 className="w-3 h-3 stroke-[1.5]" />
      </button>

      {/* Visual Artwork Thumbnail */}
      <VisualThumbnail
        image={element.image}
        imgPos={element.imgPos}
        name={element.name}
        categoryIcon={categoryIcon}
        nsfw={element.nsfw}
        nsfwOn={nsfwOn}
        aspect="aspect-square"
      />

      {/* Element Info */}
      <div className="p-2.5 flex flex-col justify-between flex-1 border-t border-white/[0.04] bg-[#121116]/90 pointer-events-none">
        <span className="font-semibold text-xs text-white/90 line-clamp-2 leading-tight">
          {element.name}
        </span>
        {element.prompt && (
          <span className="text-[10px] text-white/35 truncate mt-1 font-mono">
            {element.prompt}
          </span>
        )}
      </div>
    </div>
  );
};
