import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Dices, Copy, Trash2, Check, ArrowRight, Sparkles, Flame, Undo2, Redo2 } from 'lucide-react';
import { Category, DBState } from '../types/prompter';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selections: Record<string, any>;
  onToggleElement: (path: string[], elId: string) => void;
  onRandomizeAll: () => void;
  onCopyPrompt: () => void;
  onClearAll: () => void;
  onToggleNsfw: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  nsfwOn: boolean;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  categories,
  selections,
  onToggleElement,
  onRandomizeAll,
  onCopyPrompt,
  onClearAll,
  onToggleNsfw,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  nsfwOn
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Flatten all elements across categories for fuzzy search
  const searchableItems = useMemo(() => {
    const list: {
      type: 'element';
      id: string;
      name: string;
      prompt: string;
      categoryName: string;
      path: string[];
      nsfw: boolean;
    }[] = [];

    categories.forEach((cat) => {
      if (cat.type === 'flat' && cat.els) {
        cat.els.forEach((el) => {
          list.push({
            type: 'element',
            id: el.id,
            name: el.name,
            prompt: el.prompt,
            categoryName: cat.name,
            path: [cat.id],
            nsfw: el.nsfw
          });
        });
      } else if (cat.subcats) {
        cat.subcats.forEach((sc) => {
          if (sc.type === 'flat' && sc.els) {
            sc.els.forEach((el) => {
              list.push({
                type: 'element',
                id: el.id,
                name: el.name,
                prompt: el.prompt,
                categoryName: `${cat.name} / ${sc.name}`,
                path: [cat.id, sc.id],
                nsfw: el.nsfw
              });
            });
          } else if (sc.rows) {
            sc.rows.forEach((row) => {
              row.els.forEach((el) => {
                list.push({
                  type: 'element',
                  id: el.id,
                  name: el.name,
                  prompt: el.prompt,
                  categoryName: `${cat.name} / ${row.name}`,
                  path: [cat.id, sc.id, row.id],
                  nsfw: el.nsfw
                });
              });
            });
          }
        });
      }
    });

    return list;
  }, [categories]);

  // Filter items based on query & NSFW visibility
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visibleElements = searchableItems.filter((item) => nsfwOn || !item.nsfw);
    if (!q) {
      return visibleElements.slice(0, 8);
    }
    return visibleElements
      .filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.prompt.toLowerCase().includes(q) ||
          item.categoryName.toLowerCase().includes(q)
      )
      .slice(0, 15);
  }, [query, searchableItems, nsfwOn]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Global keyboard listeners for Command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? filteredItems.length - 1 : prev - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = filteredItems[selectedIndex];
        if (item) {
          onToggleElement(item.path, item.id);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose, onToggleElement]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl bg-[#16141c] border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-white/[0.08] flex items-center gap-3">
          <Search className="w-4 h-4 text-white/50 stroke-[1.5] shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search prompt elements, outfits, lighting, styles..."
            className="w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-white/40 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>
          )}
          <kbd className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-mono text-white/40 shrink-0">
            ESC
          </kbd>
        </div>

        {/* Quick Command Actions */}
        {!query && (
          <div className="p-2 border-b border-white/[0.04] grid grid-cols-2 gap-1 text-xs">
            <button
              onClick={() => {
                if (canUndo) {
                  onUndo();
                  onClose();
                }
              }}
              disabled={!canUndo}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.06] text-white/80 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors text-left"
            >
              <Undo2 className="w-3.5 h-3.5 text-white/60 stroke-[1.5]" />
              <span>Undo Last Change (⌘Z)</span>
            </button>
            <button
              onClick={() => {
                if (canRedo) {
                  onRedo();
                  onClose();
                }
              }}
              disabled={!canRedo}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.06] text-white/80 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors text-left"
            >
              <Redo2 className="w-3.5 h-3.5 text-white/60 stroke-[1.5]" />
              <span>Redo Change (⌘⇧Z)</span>
            </button>
            <button
              onClick={() => {
                onRandomizeAll();
                onClose();
              }}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.06] text-white/80 hover:text-white transition-colors text-left"
            >
              <Dices className="w-3.5 h-3.5 text-white/60 stroke-[1.5]" />
              <span>Roll Random Prompt</span>
            </button>
            <button
              onClick={() => {
                onCopyPrompt();
                onClose();
              }}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.06] text-white/80 hover:text-white transition-colors text-left"
            >
              <Copy className="w-3.5 h-3.5 text-white/60 stroke-[1.5]" />
              <span>Copy Current Prompt</span>
            </button>
            <button
              onClick={() => {
                onToggleNsfw();
                onClose();
              }}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.06] text-white/80 hover:text-white transition-colors text-left"
            >
              <Flame className="w-3.5 h-3.5 text-white/60 stroke-[1.5]" />
              <span>Toggle NSFW Filter ({nsfwOn ? 'ON' : 'OFF'})</span>
            </button>
            <button
              onClick={() => {
                onClearAll();
                onClose();
              }}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.06] text-white/60 hover:text-rose-400 transition-colors text-left"
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Clear All Selections</span>
            </button>
          </div>
        )}

        {/* Search Results List */}
        <div className="max-h-[360px] overflow-y-auto p-2 space-y-1">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => {
              const isSelected = selectedIndex === index;
              return (
                <div
                  key={`${item.path.join('-')}-${item.id}`}
                  onClick={() => {
                    onToggleElement(item.path, item.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors text-left ${
                    isSelected
                      ? nsfwOn
                        ? 'bg-red-500/10 border border-red-500/40 text-white shadow-[0_0_10px_rgba(255,34,56,0.1)]'
                        : 'bg-orange-500/10 border border-orange-500/40 text-white shadow-[0_0_10px_rgba(255,102,0,0.1)]'
                      : 'hover:bg-white/[0.04] text-white/80 border border-transparent'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs text-white">
                        {item.name}
                      </span>
                      {item.nsfw && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                          NSFW
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-white/40 truncate mt-0.5">
                      {item.categoryName} ·{' '}
                      <span className="font-mono text-white/30">{item.prompt}</span>
                    </div>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-white/30 shrink-0" />
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-white/40">
              No matching prompt elements found for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
