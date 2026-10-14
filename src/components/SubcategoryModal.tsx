import React, { useState, useEffect, useRef } from 'react';
import { Trash2, X, Check, FolderPlus, Edit3, AlertTriangle } from 'lucide-react';
import { SubCategory } from '../types/prompter';

interface SubcategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  subcat?: SubCategory | null;
  onSave: (name: string) => void;
  onDelete?: () => void;
  nsfwOn?: boolean;
}

export const SubcategoryModal: React.FC<SubcategoryModalProps> = ({
  isOpen,
  onClose,
  mode,
  subcat,
  onSave,
  onDelete,
  nsfwOn = false
}) => {
  const [name, setName] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(mode === 'edit' && subcat ? subcat.name : '');
      setShowDeleteConfirm(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, mode, subcat]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-sm rounded-2xl bg-[#141217] border border-white/[0.1] shadow-2xl overflow-hidden z-10 animate-scaleUp">
        {showDeleteConfirm ? (
          /* Delete Confirmation Modal State */
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                <AlertTriangle className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Subcategory</h3>
                <p className="text-[11px] text-white/50">{subcat?.name}</p>
              </div>
            </div>

            <p className="text-xs text-white/80 leading-relaxed bg-black/40 p-3.5 rounded-xl border border-white/[0.06]">
              Are you sure you want to delete this subcategory and all existing elements inside it?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-white/70 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete?.();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(225,29,72,0.4)]"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          /* Minimal Subcategory Edit / Create Interface: Name input field and Delete icon */
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                {mode === 'edit' ? (
                  <Edit3 className={`w-4 h-4 ${nsfwOn ? 'text-red-400' : 'text-orange-400'}`} />
                ) : (
                  <FolderPlus className={`w-4 h-4 ${nsfwOn ? 'text-red-400' : 'text-orange-400'}`} />
                )}
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  {mode === 'edit' ? 'Edit Subcategory' : 'Add Subcategory'}
                </h3>
              </div>

              <div className="flex items-center gap-1">
                {mode === 'edit' && onDelete && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    title="Delete subcategory"
                    className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 stroke-[1.8]" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-white/60">Subcategory Name</label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. One-Piece, Footwear, Outerwear..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-white/70 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:pointer-events-none ${
                  nsfwOn
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_14px_rgba(255,34,56,0.35)]'
                    : 'bg-orange-500 hover:bg-orange-400 text-black shadow-[0_0_14px_rgba(255,102,0,0.35)]'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{mode === 'edit' ? 'Save' : 'Create'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
