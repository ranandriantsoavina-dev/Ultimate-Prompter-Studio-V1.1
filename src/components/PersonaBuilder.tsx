import React from 'react';
import { Check, Plus, RotateCcw } from 'lucide-react';
import { CategoryRow } from '../types/prompter';

interface PersonaBuilderProps {
  rows: CategoryRow[];
  basePath: string[];
  selections: Record<string, any>;
  onToggleElement: (path: string[], elId: string) => void;
  onAddElement: (path: string[]) => void;
  onEditElement: (path: string[], elId: string) => void;
  onClearRow?: (path: string[]) => void;
  nsfwOn?: boolean;
}

export const PersonaBuilder: React.FC<PersonaBuilderProps> = ({
  rows,
  basePath,
  selections,
  onToggleElement,
  onAddElement,
  onEditElement,
  onClearRow,
  nsfwOn = false
}) => {
  return (
    <div className="space-y-6">
      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
        <h3 className="text-xs font-semibold text-white/90">
          Custom Persona Builder
        </h3>
        <p className="text-[11px] text-white/40 mt-0.5">
          Select attributes across ethnicity, age, physique, hair, and distinctive features to assemble an exact subject.
        </p>
      </div>

      <div className="space-y-4">
        {rows.map((row) => {
          const rowPath = [...basePath, row.id];
          const rowSel = (selections[basePath[0]]?.[basePath[1]] || {})[row.id] || [];

          return (
            <div key={row.id} className="space-y-2">
              <div className="group/rowheader flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white/50 text-[11px] uppercase tracking-wider font-mono">
                    {row.name}
                  </span>
                  {rowSel.length > 0 && onClearRow && (
                    <button
                      onClick={() => onClearRow(rowPath)}
                      title={`Clear / Deselect all in ${row.name}`}
                      className="opacity-0 group-hover/rowheader:opacity-100 flex items-center gap-1 text-[10px] text-rose-400 hover:text-rose-200 transition-opacity"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Deselect</span>
                    </button>
                  )}
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded transition-colors duration-500 ${
                    rowSel.length > 0
                      ? nsfwOn
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                      : 'text-white/30'
                  }`}
                >
                  {rowSel.length > 0 ? `${rowSel.length} selected` : 'None'}
                </span>
              </div>

              {/* Horizontal Scrollable Chips Row */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-white/10">
                {row.els.map((el) => {
                  const isSelected = rowSel.includes(el.id);
                  return (
                    <button
                      key={el.id}
                      onClick={() => onToggleElement(rowPath, el.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        onEditElement(rowPath, el.id);
                      }}
                      className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all shrink-0 active:scale-95 duration-200 ${
                        isSelected
                          ? nsfwOn
                            ? 'bg-red-600 text-white border-red-500 shadow-[0_0_12px_rgba(255,34,56,0.3)]'
                            : 'bg-orange-500 text-black border-orange-400 shadow-[0_0_12px_rgba(255,102,0,0.3)]'
                          : 'bg-[#131116]/90 hover:bg-[#18161c] text-white/70 border-white/[0.06] hover:border-white/[0.15]'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      ) : (
                        <div className="w-1 h-1 rounded-full bg-white/25 group-hover:bg-white/60 transition-colors" />
                      )}
                      <span>{el.name}</span>
                    </button>
                  );
                })}

                {/* Add new option to this dimension */}
                <button
                  onClick={() => onAddElement(rowPath)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-dashed transition-colors shrink-0 ${
                    nsfwOn
                      ? 'border-red-500/25 hover:border-red-500/50 text-red-300/60 hover:text-red-200'
                      : 'border-orange-500/25 hover:border-orange-500/50 text-orange-300/60 hover:text-orange-200'
                  }`}
                  title={`Add custom ${row.name} trait`}
                >
                  <Plus className="w-3 h-3 stroke-[1.8]" />
                  <span>Add trait</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
