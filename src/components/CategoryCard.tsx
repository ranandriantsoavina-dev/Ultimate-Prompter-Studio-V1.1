import React from 'react';
import { Lock, Unlock, Dices, Edit3, ChevronRight, RotateCcw } from 'lucide-react';
import { Category } from '../types/prompter';
import { VisualThumbnail } from './VisualThumbnail';

interface CategoryCardProps {
  cat: Category;
  selectedCount: number;
  isLocked: boolean;
  onOpen: () => void;
  onToggleLock: () => void;
  onRandomize: () => void;
  onEdit: () => void;
  onClear?: () => void;
  index: number;
  nsfwOn?: boolean;
  dragProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  cat,
  selectedCount,
  isLocked,
  onOpen,
  onToggleLock,
  onRandomize,
  onEdit,
  onClear,
  nsfwOn = false,
  dragProps,
  isDragging = false
}) => {
  const hasSelections = selectedCount > 0;

  return (
    <div
      {...dragProps}
      onClick={onOpen}
      className={`group relative flex flex-col rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border text-left active:scale-[0.99] ${
        isDragging
          ? nsfwOn
            ? 'scale-105 z-30 shadow-[0_0_25px_rgba(255,34,56,0.5)] ring-2 ring-red-500 opacity-95 cursor-grabbing'
            : 'scale-105 z-30 shadow-[0_0_25px_rgba(255,102,0,0.5)] ring-2 ring-orange-500 opacity-95 cursor-grabbing'
          : hasSelections
          ? nsfwOn
            ? 'bg-[#181215]/90 border-red-500/50 shadow-[0_0_16px_rgba(255,34,56,0.15)]'
            : 'bg-[#181412]/90 border-orange-500/50 shadow-[0_0_16px_rgba(255,102,0,0.15)]'
          : 'bg-[#121116]/80 hover:bg-[#16151b] border-white/[0.06] hover:border-white/[0.15]'
      } ${dragProps?.className || ''}`}
    >
      {/* Top Toolbar overlay */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
        {/* Lock Button */}
        <button
          data-no-drag="true"
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          title={isLocked ? 'Category is locked from randomization' : 'Lock category from randomization'}
          className={`pointer-events-auto p-1.5 rounded-lg backdrop-blur-md transition-all ${
            isLocked
              ? nsfwOn
                ? 'bg-red-500 text-white font-medium shadow-sm'
                : 'bg-orange-500 text-black font-medium shadow-sm'
              : 'bg-black/50 hover:bg-black/80 text-white/40 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100'
          }`}
        >
          {isLocked ? (
            <Lock className="w-3 h-3 stroke-[1.8]" />
          ) : (
            <Unlock className="w-3 h-3 stroke-[1.5]" />
          )}
        </button>

        {/* Action icons: Clear / Deselect (when has selections) + Edit + Dice */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
          {hasSelections && onClear && (
            <button
              data-no-drag="true"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              title={`Clear / Deselect all ${selectedCount} selected in ${cat.name}`}
              className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 hover:text-white border border-rose-500/30 transition-colors"
            >
              <RotateCcw className="w-3 h-3 stroke-[2]" />
            </button>
          )}
          <button
            data-no-drag="true"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Edit category details and image"
            className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white/50 hover:text-white border border-white/10 transition-colors"
          >
            <Edit3 className="w-3 h-3 stroke-[1.5]" />
          </button>
          <button
            data-no-drag="true"
            onClick={(e) => {
              e.stopPropagation();
              onRandomize();
            }}
            title="Randomize this category"
            className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white/50 hover:text-white border border-white/10 transition-colors"
          >
            <Dices className="w-3 h-3 stroke-[1.5]" />
          </button>
        </div>
      </div>

      {/* Card Visual Artwork */}
      <VisualThumbnail
        image={cat.image}
        imgPos={cat.imgPos}
        name={cat.name}
        categoryIcon={cat.icon}
        aspect="aspect-[4/3]"
      />

      {/* Card Footer Info */}
      <div className="p-3 flex items-center justify-between gap-2 border-t border-white/[0.04] bg-[#121116]/90">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-xs text-white/95 truncate">
              {cat.name}
            </h3>
            {hasSelections && (
              <div className="flex items-center gap-1">
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold transition-colors duration-500 ${
                    nsfwOn
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                  }`}
                >
                  {selectedCount}
                </span>
                {onClear && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClear();
                    }}
                    title={`Clear / Deselect all in ${cat.name}`}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-white/40 hover:text-rose-400 transition-all"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            )}
          </div>
          {cat.description && (
            <p className="text-[11px] text-white/40 truncate mt-0.5">
              {cat.description}
            </p>
          )}
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all shrink-0 stroke-[1.5]" />
      </div>
    </div>
  );
};
