import React from 'react';
import { 
  Copy, 
  Check, 
  Trash2, 
  Sparkles,
  FileText,
  Wand2,
  Plus,
  Shirt,
  Layers
} from 'lucide-react';
import { PromptEngine, PromptMode } from '../types/prompter';

interface PromptInspectorProps {
  promptText: string;
  tokenCount: number;
  wordCount: number;
  promptMode: PromptMode;
  onSetPromptMode: (mode: PromptMode) => void;
  promptEngine: PromptEngine;
  stylize: number;
  onSetStylize: (v: number) => void;
  onCopyPrompt: () => void;
  onClearSelections: () => void;
  onSaveToHistory: () => void;
  isCopied: boolean;
  selectedItemsCount: number;
  blocks?: { name: string; text: string }[];
  nsfwOn?: boolean;
  onRefinePrompt?: (promptText: string) => void;
  canCreateContextPreset?: boolean;
  canCreateOutfitPreset?: boolean;
  onCreateContextPreset?: () => void;
  onCreateOutfitPreset?: () => void;
  presetNotice?: string | null;
}

export const PromptInspector: React.FC<PromptInspectorProps> = ({
  promptText,
  tokenCount,
  wordCount,
  promptMode,
  onSetPromptMode,
  onCopyPrompt,
  onClearSelections,
  isCopied,
  selectedItemsCount,
  blocks = [],
  nsfwOn = false,
  onRefinePrompt,
  canCreateContextPreset = false,
  canCreateOutfitPreset = false,
  onCreateContextPreset,
  onCreateOutfitPreset,
  presetNotice
}) => {
  return (
    <aside className="w-full lg:w-[420px] bg-[#100e14]/95 backdrop-blur-md border-t lg:border-t-0 lg:border-l border-white/[0.08] flex flex-col h-auto lg:h-[calc(100vh-84px)] lg:sticky lg:top-[84px] select-none transition-colors duration-500">
      {/* Inspector Header */}
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-white/50 stroke-[1.5]" />
          <h2 className="font-semibold text-sm text-white">Prompt Inspector</h2>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-colors duration-500 ${
              nsfwOn
                ? 'bg-red-500/10 text-red-300 border-red-500/30'
                : 'bg-orange-500/10 text-orange-300 border-orange-500/30'
            }`}
          >
            {selectedItemsCount} tags
          </span>
        </div>

        {/* Structured (Blocks) vs Fluid (Paragraph) Toggle for Krea 2 */}
        <div className="flex items-center p-0.5 rounded-lg bg-black/60 border border-white/[0.06] text-xs">
          <button
            onClick={() => onSetPromptMode('warped')}
            className={`px-2.5 py-1 rounded-md transition-all font-semibold ${
              promptMode === 'warped'
                ? nsfwOn
                  ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(255,34,56,0.4)]'
                  : 'bg-orange-500 text-black shadow-[0_0_12px_rgba(255,102,0,0.4)]'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Fluid
          </button>
          <button
            onClick={() => onSetPromptMode('structured')}
            className={`px-2.5 py-1 rounded-md transition-all font-semibold ${
              promptMode === 'structured'
                ? nsfwOn
                  ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(255,34,56,0.4)]'
                  : 'bg-orange-500 text-black shadow-[0_0_12px_rgba(255,102,0,0.4)]'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Blocks
          </button>
        </div>
      </div>

      {/* Main Output Box Area */}
      <div className="p-4 flex-1 flex flex-col min-h-0 space-y-3 overflow-y-auto">
        <div className="relative flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-1.5 text-xs text-white/40 font-mono">
            <span>COMPILED KREA 2 PROMPT</span>
            <div className="flex items-center gap-3">
              <span>{wordCount} words</span>
              <span>·</span>
              <span className={tokenCount > 75 ? 'text-amber-400 font-bold' : ''}>
                ~{tokenCount} tokens
              </span>
            </div>
          </div>

          {/* Contributing Active Categories Strip with theme color badges */}
          {blocks.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              {blocks.map((b, i) => (
                <span
                  key={i}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border transition-colors duration-500 ${
                    nsfwOn
                      ? 'bg-red-950/40 text-red-300 border-red-500/35 shadow-[0_0_8px_rgba(255,34,56,0.15)]'
                      : 'bg-orange-950/40 text-orange-300 border-orange-500/35 shadow-[0_0_8px_rgba(255,102,0,0.15)]'
                  }`}
                >
                  {b.name}
                </span>
              ))}
            </div>
          )}

          {/* Compiled Output Container */}
          <div
            className={`relative flex-1 min-h-[170px] rounded-xl bg-black/70 border p-3.5 font-mono text-xs leading-relaxed text-[#ede6dd] overflow-y-auto transition-all duration-500 ${
              nsfwOn
                ? 'border-red-500/20 focus-within:border-red-500/50'
                : 'border-orange-500/20 focus-within:border-orange-500/50'
            }`}
          >
            {promptText ? (
              promptMode === 'structured' && blocks.length > 0 ? (
                /* Structured Mode: Render each category mention in glowing orange or red */
                <div className="space-y-2.5 select-text">
                  {blocks.map((block, idx) => (
                    <div key={idx} className="leading-relaxed">
                      <span
                        className={`font-bold tracking-wide transition-colors duration-500 inline-block mr-1.5 ${
                          nsfwOn
                            ? 'text-[#ff384d] drop-shadow-[0_0_8px_rgba(255,56,77,0.4)]'
                            : 'text-[#ff7824] drop-shadow-[0_0_8px_rgba(255,120,36,0.4)]'
                        }`}
                      >
                        {block.name}:
                      </span>
                      <span className="text-[#eee7de]">{block.text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Fluid Mode: Natural continuous paragraph */
                <p className="whitespace-pre-wrap select-text leading-relaxed text-[#eee7de]">
                  {promptText}
                </p>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-white/30 p-4">
                <Sparkles
                  className={`w-5 h-5 mb-2 stroke-[1.5] transition-colors duration-500 ${
                    nsfwOn ? 'text-red-400/50' : 'text-orange-400/50'
                  }`}
                />
                <p className="text-xs">No elements selected yet.</p>
                <p className="text-[11px] text-white/20 mt-1">
                  Pick cards from categories or roll a preset to assemble your prompt.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Preset Creation from Currently Selected Items */}
        <div className="pt-2 border-t border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between text-[11px] text-white/50 font-medium">
            <div className="flex items-center gap-1.5">
              <Sparkles className={`w-3.5 h-3.5 ${nsfwOn ? 'text-red-400' : 'text-orange-400'}`} />
              <span className="font-semibold uppercase tracking-wider text-[10px]">Create Preset From Selection</span>
            </div>
            {presetNotice && (
              <span className="text-[10px] text-emerald-400 font-mono font-semibold animate-pulse">
                {presetNotice}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onCreateContextPreset}
              title="Create Context Preset (from selected Outfit, Composition, Pose & Action, and Environment & Lighting)"
              className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all active:scale-95 group ${
                nsfwOn
                  ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-white shadow-[0_0_12px_rgba(255,34,56,0.1)]'
                  : 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 text-white shadow-[0_0_12px_rgba(255,102,0,0.1)]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Layers className={`w-3.5 h-3.5 ${nsfwOn ? 'text-red-400' : 'text-orange-400'}`} />
                <span>+ Context Preset</span>
              </div>
              <span className="text-[10px] text-white/40 mt-1 leading-tight group-hover:text-white/60">
                Outfit, Comp, Pose, Env & Light
              </span>
            </button>

            <button
              onClick={onCreateOutfitPreset}
              title="Create Outfit Preset (from selected (Top + Bottom) or One-Piece)"
              className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all active:scale-95 group ${
                nsfwOn
                  ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-white shadow-[0_0_12px_rgba(255,34,56,0.1)]'
                  : 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 text-white shadow-[0_0_12px_rgba(255,102,0,0.1)]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Shirt className={`w-3.5 h-3.5 ${nsfwOn ? 'text-red-400' : 'text-orange-400'}`} />
                <span>+ Outfit Preset</span>
              </div>
              <span className="text-[10px] text-white/40 mt-1 leading-tight group-hover:text-white/60">
                (Top + Bottom) or One-Piece
              </span>
            </button>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={onCopyPrompt}
            disabled={!promptText}
            className={`col-span-2 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none duration-300 shadow-sm ${
              isCopied
                ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : nsfwOn
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_18px_rgba(255,34,56,0.35)]'
                : 'bg-orange-500 hover:bg-orange-400 text-black shadow-[0_0_18px_rgba(255,102,0,0.35)]'
            }`}
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 stroke-[1.8]" />
                <span>Copy Full</span>
              </>
            )}
          </button>

          <button
            onClick={() => onRefinePrompt?.(promptText)}
            disabled={!promptText}
            title="Refine prompt with Ollama AI"
            className={`flex items-center justify-center gap-1 py-2.5 px-2 rounded-xl border font-semibold text-xs transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${
              nsfwOn
                ? 'bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20'
                : 'bg-orange-500/10 border-orange-500/30 text-orange-300 hover:bg-orange-500/20'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Refine</span>
          </button>

          <button
            onClick={onClearSelections}
            title="Clear all active selections"
            className="flex items-center justify-center gap-1 py-2.5 px-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/10 border border-white/[0.08] hover:border-rose-500/30 text-white/60 hover:text-rose-400 font-medium text-xs transition-all active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Clear</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
