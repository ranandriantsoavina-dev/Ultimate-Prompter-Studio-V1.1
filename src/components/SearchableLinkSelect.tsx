import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, ChevronDown, Check, Link2, Unlink } from 'lucide-react';
import { VisualThumbnail } from './VisualThumbnail';
import { ImgPos } from '../types/prompter';

export interface LinkableItemOption {
  id: string;
  name: string;
  image?: string;
  imgPos?: ImgPos;
  subcatName?: string;
}

interface SearchableLinkSelectProps {
  label: string;
  categoryIcon?: React.ReactNode;
  value?: string;
  onChange: (id: string) => void;
  items: LinkableItemOption[];
  placeholder?: string;
  accentColor?: string;
}

export const SearchableLinkSelect: React.FC<SearchableLinkSelectProps> = ({
  label,
  categoryIcon,
  value,
  onChange,
  items,
  placeholder = 'Select linked element...',
  accentColor = 'orange'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedItem = useMemo(() => {
    return items.find((item) => item.id === value);
  }, [items, value]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.subcatName && item.subcatName.toLowerCase().includes(q))
    );
  }, [items, query]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
          {categoryIcon && <span className="opacity-80">{categoryIcon}</span>}
          <span>{label}</span>
        </label>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            title="Unlink"
            className="flex items-center gap-1 text-[11px] text-white/40 hover:text-rose-400 transition-colors"
          >
            <Unlink className="w-3 h-3" />
            <span>Unlink</span>
          </button>
        )}
      </div>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl bg-black/50 border text-xs text-left transition-all cursor-pointer ${
          isOpen
            ? 'border-orange-500/60 ring-1 ring-orange-500/30'
            : selectedItem
            ? 'border-white/20 hover:border-white/30 text-white'
            : 'border-white/10 hover:border-white/20 text-white/50'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {selectedItem ? (
            <>
              <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-white/15 bg-black/40">
                <VisualThumbnail
                  image={selectedItem.image}
                  imgPos={selectedItem.imgPos}
                  name={selectedItem.name}
                  aspect="aspect-square"
                />
              </div>
              <div className="min-w-0 truncate">
                <span className="font-medium text-white truncate block">
                  {selectedItem.name}
                </span>
                {selectedItem.subcatName && (
                  <span className="text-[10px] text-white/40 block -mt-0.5 truncate">
                    {selectedItem.subcatName}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-white/40">
              <Link2 className="w-3.5 h-3.5 opacity-60" />
              <span>{placeholder}</span>
            </div>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-orange-400' : ''
          }`}
        />
      </button>

      {/* Searchable Dropdown Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-30 rounded-xl bg-[#18161e] border border-white/15 shadow-2xl overflow-hidden animate-in fade-in duration-150">
          {/* Search Field */}
          <div className="p-2 border-b border-white/[0.08] bg-black/40">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search items by name or subcategory..."
                className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-orange-500"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* List of items */}
          <div className="max-h-56 overflow-y-auto divide-y divide-white/[0.04] p-1">
            {/* Option to clear / unselect */}
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                !value
                  ? 'bg-white/10 text-white font-medium'
                  : 'hover:bg-white/[0.06] text-white/50 hover:text-white'
              }`}
            >
              <span className="italic">None (Unlinked)</span>
              {!value && <Check className="w-3.5 h-3.5 text-orange-400" />}
            </button>

            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const isSelected = item.id === value;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onChange(item.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-orange-500/20 text-orange-200 border border-orange-500/40 font-medium'
                        : 'hover:bg-white/[0.06] text-white/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-6 h-6 rounded overflow-hidden shrink-0 border border-white/10 bg-black/40">
                        <VisualThumbnail
                          image={item.image}
                          imgPos={item.imgPos}
                          name={item.name}
                          aspect="aspect-square"
                        />
                      </div>
                      <div className="min-w-0 truncate">
                        <span className="truncate block font-medium">{item.name}</span>
                        {item.subcatName && (
                          <span className="text-[10px] text-white/40 block truncate">
                            {item.subcatName}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-white/40">
                No items match "{query}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
