import React from 'react';
import { Check, Edit3, Flame, GripVertical, Link2 } from 'lucide-react';
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
  readOnly?: boolean;
  showLinkedBadge?: boolean;
  linkedTooltip?: string;
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
  isDragging = false,
  readOnly = false,
  showLinkedBadge = true,
  linkedTooltip
}) => {
  const hasLinks = Boolean(
    showLinkedBadge &&
    (element.linkedPoseId || element.linkedContextId || element.linkedEnvId)
  );
  return (
    <div
      {...(!readOnly ? dragProps : {})}
      onClick={!readOnly ? onToggle : undefined}
      className={`group relative flex flex-col rounded-xl overflow-hidden transition-all duration-200 border text-left select-none ${
        readOnly
          ? 'cursor-default active:scale-100'
          : 'cursor-pointer active:scale-[0.99]'
      } ${
        isDragging
          ? nsfwOn
            ? 'scale-105 z-30 shadow-[0_0_25px_rgba(255,34,56,0.5)] ring-2 ring-red-500 opacity-95 cursor-grabbing bg-[#181215]'
            : 'scale-105 z-30 shadow-[0_0_25px_rgba(255,102,0,0.5)] ring-2 ring-orange-500 opacity-95 cursor-grabbing bg-[#181412]'
          : isSelected
          ? nsfwOn
            ? 'bg-[#181215]/95 border-red-500/60 shadow-[0_0_15px_rgba(255,34,56,0.2)]'
            : 'bg-[#181412]/95 border-orange-500/60 shadow-[0_0_15px_rgba(255,102,0,0.2)]'
          : 'bg-[#121116]/80 hover:bg-[#16151b] border-white/[0.06] hover:border-white/[0.15]'
      } ${!readOnly ? dragProps?.className || '' : ''}`}
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
        {/* Grip Handle (hidden in readOnly) */}
        {!readOnly && (
          <div
            {...handleProps}
            title="Hold & drag to reorder element"
            className="p-1 rounded bg-black/60 hover:bg-black/90 text-white/40 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-3 h-3 stroke-[2]" />
          </div>
        )}

        {/* Minimalist NSFW Tag */}
        {element.nsfw && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-[9px] font-medium text-white/60 backdrop-blur-md">
            <Flame className="w-2.5 h-2.5 text-rose-400 stroke-[1.5]" />
            <span>NSFW</span>
          </div>
        )}
      </div>

      {/* Minimalist Edit Trigger (hidden in readOnly) */}
      {!readOnly && (
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
      )}

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
        <div>
          <span className="font-semibold text-xs text-white/90 line-clamp-2 leading-tight">
            {element.name}
          </span>
          {element.prompt && (
            <span className="text-[10px] text-white/35 truncate mt-1 block font-mono">
              {element.prompt}
            </span>
          )}
        </div>

        {/* Ensemble Indicator, Linked Badge or Primary Tag */}
        {(element.ensembleId || hasLinks || (element.tags && element.tags.length > 0)) && (
          <div className="mt-1.5 flex items-center gap-1.5 overflow-hidden flex-wrap">
            {element.ensembleId && (
              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/[0.05] text-white/50 border border-white/[0.08] shrink-0">
                <Link2 className="w-2.5 h-2.5 text-emerald-400 stroke-[2]" />
                <span>Ensemble</span>
              </span>
            )}
            {hasLinks && (
              <div className="group/linked relative inline-flex items-center pointer-events-auto">
                <span
                  title={linkedTooltip || "Linked item"}
                  className="inline-flex items-center gap-1 text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/[0.05] text-cyan-300/80 border border-cyan-500/25 shrink-0"
                >
                  <Link2 className="w-2.5 h-2.5 text-cyan-400 stroke-[2]" />
                  <span>Linked</span>
                </span>
                {linkedTooltip && (
                  <div className="pointer-events-none absolute bottom-full left-0 mb-1.5 z-40 hidden group-hover/linked:block whitespace-nowrap rounded-lg bg-[#18161f] border border-cyan-500/30 shadow-2xl px-2.5 py-1 text-[10px] text-white/95 font-sans animate-in fade-in zoom-in-95 duration-100">
                    {linkedTooltip}
                  </div>
                )}
              </div>
            )}
            {element.tags && element.tags.length > 0 && (
              <span className="text-[9px] font-mono text-white/40 truncate max-w-[120px]">
                {element.tags[0]}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
