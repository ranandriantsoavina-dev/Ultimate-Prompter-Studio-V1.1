import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  RotateCcw, 
  Trash2, 
  Check, 
  Flame, 
  ZoomIn, 
  Users, 
  ArrowRightLeft, 
  CheckCircle2,
  Palette,
  User,
  Shirt,
  Sparkles,
  Camera,
  Activity,
  Smile,
  MapPin,
  Sun,
  Aperture,
  Sliders
} from 'lucide-react';
import { ImgPos, PromptElement } from '../types/prompter';
import { getImgStyle } from './VisualThumbnail';
import { UserProfile } from './DevSettingsPage';

export const CATEGORY_ICONS = [
  { id: 'Palette', label: 'Style & Aesthetic', icon: <Palette className="w-4 h-4" /> },
  { id: 'User', label: 'Subject & Persona', icon: <User className="w-4 h-4" /> },
  { id: 'Shirt', label: 'Outfit & Wardrobe', icon: <Shirt className="w-4 h-4" /> },
  { id: 'Sparkles', label: 'Skin & Detail', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'Camera', label: 'Composition & Framing', icon: <Camera className="w-4 h-4" /> },
  { id: 'Activity', label: 'Pose & Action', icon: <Activity className="w-4 h-4" /> },
  { id: 'Smile', label: 'Expression & Mood', icon: <Smile className="w-4 h-4" /> },
  { id: 'MapPin', label: 'Environment & Setting', icon: <MapPin className="w-4 h-4" /> },
  { id: 'Sun', label: 'Lighting Setup', icon: <Sun className="w-4 h-4" /> },
  { id: 'Aperture', label: 'Camera & Optics', icon: <Aperture className="w-4 h-4" /> },
  { id: 'Sliders', label: 'Keywords & Fidelity', icon: <Sliders className="w-4 h-4" /> }
];

interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialName?: string;
  initialPrompt?: string;
  initialNsfw?: boolean;
  initialImage?: string;
  initialImgPos?: ImgPos;
  initialIcon?: string;
  isCategory?: boolean;
  showPromptField?: boolean;
  onSave: (data: {
    name: string;
    prompt?: string;
    nsfw?: boolean;
    image: string;
    imgPos?: ImgPos;
    icon?: string;
  }) => void | Promise<void>;
  onDelete?: () => void;
  users?: UserProfile[];
  activeUserId?: string;
  path?: string[];
  onTransferToUser?: (
    targetUserId: string,
    data: {
      name: string;
      prompt?: string;
      nsfw?: boolean;
      image: string;
      imgPos?: ImgPos;
      path: string[];
    }
  ) => void | Promise<void>;
}

export const CropModal: React.FC<CropModalProps> = ({
  isOpen,
  onClose,
  title,
  initialName = '',
  initialPrompt = '',
  initialNsfw = false,
  initialImage = '',
  initialImgPos,
  initialIcon = 'Palette',
  isCategory = false,
  showPromptField = true,
  onSave,
  onDelete,
  users,
  activeUserId,
  path = [],
  onTransferToUser
}) => {
  const [name, setName] = useState(initialName);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [nsfw, setNsfw] = useState(initialNsfw);
  const [image, setImage] = useState(initialImage);
  const [icon, setIcon] = useState<string>(initialIcon || 'Palette');
  const [crop, setCrop] = useState<ImgPos>(
    initialImgPos || { x: 50, y: 50, z: 1, ar: 1 }
  );
  const [transferSuccess, setTransferSuccess] = useState<string>('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [transferError, setTransferError] = useState('');

  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setPrompt(initialPrompt);
      setNsfw(initialNsfw);
      setImage(initialImage);
      setIcon(initialIcon || 'Palette');
      setCrop(initialImgPos || { x: 50, y: 50, z: 1, ar: 1 });
      setSaveError('');
      setTransferError('');
    }
  }, [isOpen, initialName, initialPrompt, initialNsfw, initialImage, initialImgPos, initialIcon]);

  if (!isOpen) return null;

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
        setCrop({ x: 50, y: 50, z: 1, ar });
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

    setCrop((prev) => ({ ...prev, x: +newX.toFixed(1), y: +newY.toFixed(1) }));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragStart.current = null;
  };

  const handleResetCrop = () => {
    setCrop((prev) => ({ ...prev, x: 50, y: 50, z: 1 }));
  };

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      // the parent writes the photo to the local data folder first; if that fails we stay open and show why
      await onSave({
        name: name.trim(),
        prompt: showPromptField ? prompt.trim() : undefined,
        nsfw: showPromptField ? nsfw : undefined,
        image,
        imgPos: image ? crop : undefined,
        icon: (isCategory || !showPromptField) ? icon : undefined
      });
      onClose();
    } catch (err: any) {
      setSaveError(`Could not save: ${err?.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-lg rounded-2xl bg-[#15131a] border border-white/[0.1] shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <h3 className="font-semibold text-base text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cinematic 35mm Portrait"
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Reference Image & Interactive Pan/Crop Preview */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Reference Thumbnail & Crop
            </label>
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-3.5 rounded-xl bg-black/40 border border-white/[0.08] space-y-3 transition-colors ${
                isDraggingOver ? 'border-orange-500/50 bg-orange-500/5' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-xs font-medium text-white transition-colors">
                  <Upload className="w-3.5 h-3.5 text-white/60 stroke-[1.5]" />
                  <span>Choose Image File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {image && (
                  <button
                    onClick={() => setImage('')}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Remove Image
                  </button>
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
                    className={`w-32 h-32 rounded-xl border border-white/20 shrink-0 cursor-grab active:cursor-grabbing select-none transition-shadow ${
                      isDragging ? 'ring-2 ring-white/40' : ''
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
                        onChange={(e) =>
                          setCrop((prev) => ({
                            ...prev,
                            z: parseFloat(e.target.value)
                          }))
                        }
                        className="w-full accent-white"
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
              ) : (
                <div className="h-24 rounded-lg border border-dashed border-white/10 flex items-center justify-center text-xs text-white/40">
                  No image selected (card will display modern stylized vector badge)
                </div>
              )}
            </div>
          </div>

          {/* Category Fallback Icon Selection */}
          {(isCategory || !showPromptField) && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-white/70">
                  Category Icon Selection
                </label>
                <span className="text-[10px] text-white/40">Fallback icon when no custom image is uploaded</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08]">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {CATEGORY_ICONS.map((ic) => (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => setIcon(ic.id)}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs text-left transition-all ${
                        icon === ic.id
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 font-semibold shadow-sm'
                          : 'bg-black/30 border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.05]'
                      }`}
                      title={ic.label}
                    >
                      <span className="shrink-0">{ic.icon}</span>
                      <span className="truncate">{ic.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Prompt Field */}
          {showPromptField && (
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Target Prompt String (injected into compiled prompt)
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. She is wearing an oversized chunky cream knit sweater..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-xs font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-[#ff5c1a] resize-none"
              />
            </div>
          )}

          {/* NSFW Checkbox */}
          {showPromptField && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="modalNsfw"
                checked={nsfw}
                onChange={(e) => setNsfw(e.target.checked)}
                className="w-4 h-4 rounded accent-[#ff2626] bg-black/40 border-white/20"
              />
              <label htmlFor="modalNsfw" className="text-xs text-white/70 flex items-center gap-1.5 cursor-pointer">
                <Flame className={`w-3.5 h-3.5 ${nsfw ? 'text-rose-400' : 'text-white/40'}`} />
                <span>Mark as NSFW (hidden unless NSFW toggle is enabled)</span>
              </label>
            </div>
          )}

          {/* Transfer Element to User Account Section */}
          {showPromptField && users && users.length > 0 && onTransferToUser && (
            <div className="pt-3 border-t border-white/[0.08] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-orange-400 stroke-[1.8]" />
                  <span>Transfer / Copy to Another User Database</span>
                </label>
                {transferSuccess && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{transferSuccess}</span>
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] space-y-2.5">
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Migrate this element with its prompt instructions, NSFW setting, thumbnail photo, and pan/zoom coordinates directly to another user's database.
                </p>

                {transferError && (
                  <p className="text-[11px] text-rose-400 leading-relaxed break-words">{transferError}</p>
                )}

                {users.filter((u) => u.id !== activeUserId).length > 0 ? (
                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    {users
                      .filter((u) => u.id !== activeUserId)
                      .map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={async () => {
                            if (!name.trim()) return;
                            setTransferError('');
                            setTransferSuccess(`Copying to ${u.name}…`);
                            try {
                              // success is only shown after the server confirmed the files/database were written
                              await onTransferToUser(u.id, {
                                name: name.trim(),
                                prompt: prompt.trim(),
                                nsfw,
                                image,
                                imgPos: image ? crop : undefined,
                                path: path || []
                              });
                              setTransferSuccess(`Copied to ${u.name}!`);
                            } catch (err: any) {
                              setTransferSuccess('');
                              setTransferError(`Transfer failed: ${err?.message || err}`);
                            }
                            setTimeout(() => setTransferSuccess(''), 3500);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-orange-500/20 text-white/85 hover:text-orange-200 border border-white/10 hover:border-orange-500/40 text-xs font-semibold transition-all active:scale-95"
                          title={`Copy element to ${u.name}'s account`}
                        >
                          <ArrowRightLeft className="w-3 h-3 text-orange-400" />
                          <span>Transfer to {u.name} {u.isMain ? '(Main)' : ''}</span>
                        </button>
                      ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-white/30 italic">
                    No other users created yet. Add new users in the Dev/Ollama console to transfer elements between accounts.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {saveError && (
          <div className="mb-3 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/25 p-2.5 rounded-xl break-words">
            {saveError}
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-2">
          {onDelete ? (
            <button
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-white/80 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-white/90 text-black font-semibold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{saving ? 'Saving…' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
