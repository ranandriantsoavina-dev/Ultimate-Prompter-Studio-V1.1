import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Trash2, Sparkles, Upload, Shirt, Camera, Palette, Sun, MapPin, Activity, Flame, RotateCcw, ZoomIn } from 'lucide-react';
import { Category, Preset, PresetPick, ImgPos } from '../types/prompter';
import { VisualThumbnail, getImgStyle } from './VisualThumbnail';

export interface PresetModalData {
  id?: string;
  name: string;
  description?: string;
  kind: 'outfit' | 'context' | 'full';
  picks: PresetPick[];
  image?: string;
  imgPos?: ImgPos;
  icon?: string;
  nsfw?: boolean;
}

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset: Preset | PresetModalData | null;
  kind: 'outfit' | 'context' | 'full';
  categories: Category[];
  nsfwOn: boolean;
  onSave: (presetData: { 
    id?: string; 
    name: string; 
    description?: string;
    kind: 'outfit' | 'context' | 'full'; 
    picks: PresetPick[];
    image?: string;
    imgPos?: ImgPos;
    icon?: string;
    nsfw?: boolean;
  }) => void | Promise<void>;
  onDelete?: (id: string) => void;
}

export const PresetModal: React.FC<PresetModalProps> = ({
  isOpen,
  onClose,
  preset,
  kind,
  categories,
  nsfwOn,
  onSave,
  onDelete
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [picks, setPicks] = useState<PresetPick[]>([]);
  const [image, setImage] = useState('');
  const [imgPos, setImgPos] = useState<ImgPos | undefined>(undefined);
  const [crop, setCrop] = useState<ImgPos>(
    imgPos || { x: 50, y: 50, z: 1, ar: 1 }
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Designated fixed default icon (Shirt for Outfit Presets, Sparkles for Context Presets)
  const fixedDefaultIcon = kind === 'outfit' ? 'Shirt' : 'Sparkles';
  const [nsfw, setNsfw] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (preset) {
        setName(preset.name);
        setDescription(preset.description || '');
        setPicks([...preset.picks]);
        setImage(preset.image || '');
        const initialPos = preset.imgPos || { x: 50, y: 50, z: 1, ar: 1 };
        setImgPos(preset.imgPos);
        setCrop(initialPos);
        setNsfw(preset.nsfw || false);
      } else {
        setName('');
        setDescription('');
        setPicks([]);
        setImage('');
        setImgPos(undefined);
        setCrop({ x: 50, y: 50, z: 1, ar: 1 });
        setNsfw(false);
      }
      setError('');
    }
  }, [isOpen, preset, kind]);

  if (!isOpen) return null;

  const outfitCat = categories.find((c) => c.id === 'outfit');
  const outfitSlots = outfitCat?.subcats && outfitCat.subcats.length > 0
    ? outfitCat.subcats.map((sc) => ({
        label: `Outfit — ${sc.name}`,
        cat: 'outfit',
        sub: sc.id
      }))
    : [
        { label: 'Outfit — Top', cat: 'outfit', sub: 'top' },
        { label: 'Outfit — Bottom', cat: 'outfit', sub: 'bottom' },
        { label: 'Outfit — One-Piece', cat: 'outfit', sub: 'onepiece' }
      ];

  const SLOTS = kind === 'outfit'
    ? outfitSlots
    : [
        ...outfitSlots,
        { label: 'Composition', cat: 'comp', sub: null },
        { label: 'Pose & Action', cat: 'pose', sub: null },
        { label: 'Environment', cat: 'env', sub: null },
        { label: 'Lighting', cat: 'light', sub: null }
      ];

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const ar = img.naturalWidth / img.naturalHeight;
        setImage(result);
        const newPos: ImgPos = { x: 50, y: 50, z: 1, ar };
        setCrop(newPos);
        setImgPos(newPos);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!image) return;
    dragStart.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStart.current || !boxRef.current) return;
    const W = boxRef.current.clientWidth;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    dragStart.current = { x: e.clientX, y: e.clientY };

    const ar = crop.ar || 1;
    const ovx = W * crop.z * Math.max(1, ar) - W;
    const ovy = W * crop.z * Math.max(1, 1 / ar) - W;

    let newX = crop.x;
    let newY = crop.y;

    if (ovx > 0.5) {
      newX = Math.min(100, Math.max(0, crop.x - (dx / ovx) * 100));
    }
    if (ovy > 0.5) {
      newY = Math.min(100, Math.max(0, crop.y - (dy / ovy) * 100));
    }

    const updated: ImgPos = { ...crop, x: +newX.toFixed(1), y: +newY.toFixed(1) };
    setCrop(updated);
    setImgPos(updated);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragStart.current = null;
  };

  const handleResetCrop = () => {
    const reset: ImgPos = { ...crop, x: 50, y: 50, z: 1 };
    setCrop(reset);
    setImgPos(reset);
  };

  const handlePickChange = (catId: string, subId: string | null, combinedVal: string) => {
    if (!combinedVal) {
      setPicks((prev) => prev.filter((p) => !(p.cat === catId && (subId ? p.sub === subId : true))));
      return;
    }
    const [actualSub, elId] = combinedVal.split('|');
    setPicks((prev) => {
      const filtered = prev.filter((p) => !(p.cat === catId && (subId ? p.sub === subId : true)));
      return [...filtered, { cat: catId, sub: actualSub || subId || null, el: elId }];
    });
  };

  const handleSave = async () => {
    if (saving) return;
    if (!name.trim()) {
      setError('Please provide a preset name.');
      return;
    }
    if (picks.length === 0) {
      setError('Please select at least one element for this preset.');
      return;
    }
    setSaving(true);
    try {
      // the parent writes the photo to the local data folder first; on failure we stay open and show why
      await onSave({
        id: preset?.id,
        name: name.trim(),
        description: description.trim(),
        kind,
        picks,
        image,
        imgPos: image ? crop : undefined,
        icon: kind === 'full' ? 'Sparkles' : (kind === 'outfit' ? 'Shirt' : 'Sparkles'),
        nsfw
      });
      onClose();
    } catch (err: any) {
      setError(`Could not save: ${err?.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-[#15131a] border border-white/[0.1] shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col z-10 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-white/50 stroke-[1.5]" />
            <h3 className="font-semibold text-base text-white">
              {preset?.id ? 'Edit' : 'Create'} {kind === 'outfit' ? 'Outfit' : 'Context'} Preset
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Preset Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="e.g. Tokyo Neon Cyberpunk"
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Preset Description Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-white/70">
                Preset Description (Environment, Pose, Framing & Scene Details)
              </label>
              <span className="text-[10px] text-emerald-400 font-mono">Editable</span>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                kind === 'context'
                  ? 'Describe the context, environment, pose, and composition for this preset...'
                  : 'Describe the outfit style and wearable elements...'
              }
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 resize-none font-sans leading-relaxed"
            />
          </div>

          {/* NSFW Possible Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <Flame className={`w-4 h-4 ${nsfw ? 'text-rose-400' : 'text-white/40'}`} />
              <div>
                <span className="block text-xs font-medium text-white/90">NSFW Possible Badge</span>
                <span className="block text-[10px] text-white/40">Mark this preset as containing adult/sensual elements</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNsfw(!nsfw)}
              className={`w-10 h-6 rounded-full transition-colors relative p-1 ${
                nsfw ? 'bg-rose-500' : 'bg-white/10'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                nsfw ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Preset Photo / Thumbnail & Image Editing Tool */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-white/70">
                Preset Thumbnail Photo & Crop Editor
              </label>
              {image && (
                <button
                  type="button"
                  onClick={() => {
                    setImage('');
                    setImgPos(undefined);
                  }}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Remove Photo
                </button>
              )}
            </div>

            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-3.5 rounded-xl bg-black/40 border border-white/[0.08] space-y-3 transition-colors ${
                isDraggingOver ? 'border-orange-500/50 bg-orange-500/5' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-xs font-medium text-white transition-colors">
                  <Upload className="w-3.5 h-3.5 text-white/60 stroke-[1.5]" />
                  <span>Choose Image File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {!image && (
                  <span className="text-[11px] text-white/40">
                    No image uploaded (uses fallback icon below)
                  </span>
                )}
              </div>

              {/* Crop drag box + zoom */}
              {image ? (
                <div className="flex items-start gap-4 pt-1">
                  <div
                    ref={boxRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    style={getImgStyle(image, crop)}
                    className={`w-28 h-28 rounded-xl border border-white/20 shrink-0 cursor-grab active:cursor-grabbing select-none transition-shadow ${
                      isDragging ? 'ring-2 ring-orange-500/60' : ''
                    }`}
                    title="Drag within the frame to position the photo"
                  />

                  <div className="flex-1 space-y-2.5">
                    <div className="text-[11px] text-white/50 leading-relaxed">
                      Drag image to adjust crop center. Use slider below to zoom.
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-white/60">
                        <span className="flex items-center gap-1">
                          <ZoomIn className="w-3 h-3 text-white/50 stroke-[1.5]" />
                          Zoom Level
                        </span>
                        <span className="font-mono">{crop.z.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.05"
                        value={crop.z}
                        onChange={(e) => {
                          const newZ = parseFloat(e.target.value);
                          const updated = { ...crop, z: newZ };
                          setCrop(updated);
                          setImgPos(updated);
                        }}
                        className="w-full accent-orange-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleResetCrop}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/[0.06] hover:bg-white/[0.1] text-[11px] text-white/70 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Pan & Zoom</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Designated Fixed Default Icon Info */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/70">
                {kind === 'outfit' ? <Shirt className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>
              <div>
                <span className="block text-xs font-medium text-white/90">
                  Default Fallback Icon: {kind === 'outfit' ? 'Outfit (Shirt)' : 'Context (Sparkles)'}
                </span>
                <span className="block text-[10px] text-white/40">
                  Locked designated icon displayed whenever no custom photo is uploaded
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/50 border border-white/10">
              Fixed
            </span>
          </div>

          <div className="space-y-3 pt-2 border-t border-white/[0.08]">
            <h4 className="text-xs font-semibold text-white/60 uppercase font-mono tracking-wider">Preset Slots & Elements</h4>
            {SLOTS.map((slot) => {
              const cat = categories.find((c) => c.id === slot.cat);
              if (!cat) return null;

              const currentPick = picks.find(
                (p) => p.cat === slot.cat && (slot.sub ? p.sub === slot.sub : true)
              );
              const currentValue = currentPick ? `${currentPick.sub || ''}|${currentPick.el}` : '';

              return (
                <div key={`${slot.cat}-${slot.sub || 'all'}`}>
                  <label className="block text-xs font-medium text-white/60 mb-1">
                    {slot.label}
                  </label>
                  <select
                    value={currentValue}
                    onChange={(e) => handlePickChange(slot.cat, slot.sub, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/[0.1] text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="">— None —</option>
                    {cat.type === 'flat' && cat.els && (
                      cat.els
                        .filter((el) => nsfwOn || !el.nsfw)
                        .map((el) => (
                          <option key={el.id} value={`|${el.id}`}>
                            {el.name} {el.nsfw ? '(NSFW)' : ''}
                          </option>
                        ))
                    )}
                    {cat.type === 'tabs' && cat.subcats && (
                      slot.sub ? (
                        cat.subcats
                          .filter((sub) => sub.id === slot.sub)
                          .map((sub) =>
                            (sub.els || []).filter((el) => nsfwOn || !el.nsfw).map((el) => (
                              <option key={el.id} value={`${sub.id}|${el.id}`}>
                                {el.name} {el.nsfw ? '(NSFW)' : ''}
                              </option>
                            ))
                          )
                      ) : (
                        cat.subcats.map((sub) => (
                          <optgroup key={sub.id} label={sub.name}>
                            {(sub.els || []).filter((el) => nsfwOn || !el.nsfw).map((el) => (
                              <option key={el.id} value={`${sub.id}|${el.id}`}>
                                {el.name} {el.nsfw ? '(NSFW)' : ''}
                              </option>
                            ))}
                          </optgroup>
                        ))
                      )
                    )}
                  </select>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
          {preset?.id && onDelete ? (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this preset?')) {
                  onDelete(preset.id!);
                  onClose();
                }
              }}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Preset</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white/70 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-black text-xs font-bold transition-colors shadow-lg disabled:opacity-60 disabled:pointer-events-none"
            >
              {saving ? 'Saving…' : preset?.id ? 'Save Changes' : 'Create Preset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
