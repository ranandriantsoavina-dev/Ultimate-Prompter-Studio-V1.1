import React from 'react';
import { X, History, Copy, RotateCcw, Trash2, Sparkles } from 'lucide-react';
import { PromptHistoryItem } from '../types/prompter';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: PromptHistoryItem[];
  onRestore: (item: PromptHistoryItem) => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onRestore,
  onClearHistory
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl bg-[#15131a] border border-white/[0.1] shadow-2xl p-6 overflow-hidden max-h-[85vh] flex flex-col z-10 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-white/50 stroke-[1.5]" />
            <h3 className="font-semibold text-base text-white">Prompt Generation History</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-3 overflow-y-auto flex-1">
          {history.length > 0 ? (
            history.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] hover:border-white/[0.15] transition-all space-y-2"
              >
                <div className="flex items-center justify-between text-[11px] text-white/40">
                  <span className="font-mono">
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-white/[0.06] text-white/60 uppercase">
                      {item.engine}
                    </span>
                  </div>
                </div>

                <p className="text-xs font-mono text-white/80 line-clamp-3 select-text leading-relaxed">
                  {item.prompt}
                </p>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(item.prompt);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-white/80 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-white/40">
              <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-30 text-[#ff5c1a]" />
              No history recorded yet. Copying or assembling prompts will automatically log them here.
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="pt-4 border-t border-white/[0.08] flex justify-between items-center">
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-medium text-white transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
