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
  Sliders,
  AlertTriangle,
  Tags,
  ChevronDown,
  Link2
} from 'lucide-react';
import { ImgPos, PromptElement, Theme } from '../types/prompter';
import { getImgStyle } from './VisualThumbnail';
import { UserProfile } from './DevSettingsPage';
import { SubcategorySelector, SubcategoryOption } from './SubcategorySelector';
import { suggestPromptName } from '../utils/promptCompiler';
import { SearchableLinkSelect, LinkableItemOption } from './SearchableLinkSelect';

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
  initialPromptName?: string;
  catId?: string;
  initialPrompt?: string;
  initialNsfw?: boolean;
  initialImage?: string;
  initialImgPos?: ImgPos;
  initialIcon?: string;
  initialEnsembleId?: string;
  initialPairedElementId?: string;
  availableEnsemblePairs?: {
    id: string;
    name: string;
    image?: string;
    subcatName?: string;
    subcatId?: string;
  }[];
  availableSubcategories?: SubcategoryOption[];
  initialSubcatId?: string;
  categoryThemes?: Theme[];
  initialThemeIds?: string[];
  availableContextItems?: LinkableItemOption[];
  availablePoseItems?: LinkableItemOption[];
  availableEnvItems?: LinkableItemOption[];
  initialLinkedContextId?: string;
  initialLinkedPoseId?: string;
  initialLinkedEnvId?: string;
  isCategory?: boolean;
  showPromptField?: boolean;
  onSave: (data: {
    name: string;
    promptName?: string;
    prompt?: string;
    nsfw?: boolean;
    image: string;
    imgPos?: ImgPos;
    icon?: string;
    ensembleId?: string;
    pairedElementId?: string;
    subcategoryId?: string;
    themeIds?: string[];
    linkedContextId?: string;
    linkedPoseId?: string;
    linkedEnvId?: string;
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
  initialPromptName = '',
  catId,
  initialPrompt = '',
  initialNsfw = false,
  initialImage = '',
  initialImgPos,
  initialIcon = 'Palette',
  initialEnsembleId,
  initialPairedElementId,
  availableEnsemblePairs,
  availableSubcategories,
  initialSubcatId,
  categoryThemes,
  initialThemeIds,
  availableContextItems,
  availablePoseItems,
  availableEnvItems,
  initialLinkedContextId,
  initialLinkedPoseId,
  initialLinkedEnvId,
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
  const [promptName, setPromptName] = useState(initialPromptName);
  const promptNameModified = useRef(false);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [nsfw, setNsfw] = useState(initialNsfw);
  const [image, setImage] = useState(initialImage);
  const [icon, setIcon] = useState<string>(initialIcon || 'Palette');
  const [crop, setCrop] = useState<ImgPos>(
    initialImgPos || { x: 50, y: 50, z: 1, ar: 1 }
  );
  const [ensembleEnabled, setEnsembleEnabled] = useState<boolean>(false);
  const [pairedElementId, setPairedElementId] = useState<string>('');
  const [selectedSubcatId, setSelectedSubcatId] = useState<string>('');
  const [themeIds, setThemeIds] = useState<string[]>(initialThemeIds || []);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState<boolean>(false);
  const [linkedContextId, setLinkedContextId] = useState<string>(initialLinkedContextId || '');
  const [linkedPoseId, setLinkedPoseId] = useState<string>(initialLinkedPoseId || '');
  const [linkedEnvId, setLinkedEnvId] = useState<string>(initialLinkedEnvId || '');
  const [transferSuccess, setTransferSuccess] = useState<string>('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [transferError, setTransferError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currentCatId = catId || (path && path.length > 0 ? path[0] : '');
  const isEnvCategory = currentCatId === 'env' || currentCatId === 'environment';
  const isPoseCategory = currentCatId === 'pose';
  const isContextCategory = currentCatId === 'comp' || currentCatId === 'context' || (title && title.toLowerCase().includes('composition'));
  const isContextTargetCat = isEnvCategory || isPoseCategory || isContextCategory;

  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      const computedPromptName = initialPromptName || (isCategory ? suggestPromptName(initialName, catId) : '');
      setPromptName(computedPromptName);
      promptNameModified.current = !!initialPromptName;
      setPrompt(initialPrompt);
      setNsfw(initialNsfw);
      setImage(initialImage);
      setIcon(initialIcon || 'Palette');
      setCrop(initialImgPos || { x: 50, y: 50, z: 1, ar: 1 });
      const hasEnsemble = !!(initialPairedElementId || initialEnsembleId);
      setEnsembleEnabled(hasEnsemble);
      setPairedElementId(initialPairedElementId || '');
      
      const defaultSubcat = initialSubcatId || (path.length >= 2 ? path[1] : '') || (availableSubcategories && availableSubcategories[0]?.id) || '';
      setSelectedSubcatId(defaultSubcat);

      setThemeIds(initialThemeIds || []);
      setThemeDropdownOpen(false);
      setLinkedContextId(initialLinkedContextId || '');
      setLinkedPoseId(initialLinkedPoseId || '');
      setLinkedEnvId(initialLinkedEnvId || '');

      setSaveError('');
      setTransferError('');
      setShowDeleteConfirm(false);
    }
  }, [
    isOpen, 
    initialName, 
    initialPromptName,
    catId,
    initialPrompt, 
    initialNsfw, 
    initialImage, 
    initialImgPos, 
    initialIcon, 
    initialEnsembleId, 
    initialPairedElementId,
    initialSubcatId,
    initialThemeIds,
    initialLinkedContextId,
    initialLinkedPoseId,
    initialLinkedEnvId,
    availableSubcategories,
    path
  ]);

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
      let resolvedEnsembleId = initialEnsembleId;
      if (ensembleEnabled && pairedElementId) {
        resolvedEnsembleId = resolvedEnsembleId || `ens_${Date.now()}`;
      } else if (!ensembleEnabled) {
        resolvedEnsembleId = undefined;
      }

      // the parent writes the photo to the local data folder first; if that fails we stay open and show why
      await onSave({
        name: name.trim(),
        promptName: isCategory ? (promptName.trim() || suggestPromptName(name, catId)) : undefined,
        prompt: showPromptField ? prompt.trim() : undefined,
        nsfw: showPromptField ? nsfw : undefined,
        image,
        imgPos: image ? crop : undefined,
        icon: (isCategory || !showPromptField) ? icon : undefined,
        ensembleId: ensembleEnabled ? resolvedEnsembleId : undefined,
        pairedElementId: ensembleEnabled ? pairedElementId : undefined,
        subcategoryId: (!isCategory && availableSubcategories && availableSubcategories.length > 0) ? selectedSubcatId : undefined,
        themeIds: (!isCategory && categoryThemes && categoryThemes.length > 0) ? themeIds : undefined,
        linkedContextId: (!isCategory && isContextTargetCat) ? (linkedContextId || undefined) : undefined,
        linkedPoseId: (!isCategory && isContextTargetCat) ? (linkedPoseId || undefined) : undefined,
        linkedEnvId: (!isCategory && isContextTargetCat) ? (linkedEnvId || undefined) : undefined
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

        {showDeleteConfirm ? (
          /* Delete Confirmation Modal State with Delete and Cancel options */
          <div className="py-6 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                <AlertTriangle className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {isCategory ? 'Delete Category' : 'Delete Element'}
                </h3>
                <p className="text-[11px] text-white/50">{name || title}</p>
              </div>
            </div>

            <p className="text-xs text-white/80 leading-relaxed bg-black/40 p-3.5 rounded-xl border border-white/[0.06]">
              {isCategory
                ? 'Are you sure you want to delete this category and all elements inside it? This action cannot be undone.'
                : 'Are you sure you want to delete this element? This action cannot be undone.'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white/80 hover:text-white transition-colors"
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
          <>
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
              onChange={(e) => {
                const val = e.target.value;
                setName(val);
                if (isCategory && !promptNameModified.current) {
                  setPromptName(suggestPromptName(val, catId));
                }
              }}
              placeholder={isCategory ? 'e.g. Pose & Action' : 'e.g. Cinematic 35mm Portrait'}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Prompt Name Field (Main Categories Only - Directly below Display Name) */}
          {isCategory && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-white/80">
                  Prompt Name
                </label>
                <span className="text-[10px] text-orange-400 font-mono">Injected into prompt</span>
              </div>
              <input
                type="text"
                value={promptName}
                onChange={(e) => {
                  promptNameModified.current = true;
                  setPromptName(e.target.value);
                }}
                placeholder="e.g. subject, pose, environment"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-xs font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30"
              />
              <p className="text-[10px] text-white/40 mt-1 leading-relaxed">
                A short, simplified name used when this category is written into the generated prompt.
              </p>
            </div>
          )}

          {/* Subcategory / Theme Selector (Pose & Action and Environment & Setting Elements) */}
          {!isCategory && showPromptField && availableSubcategories && availableSubcategories.length > 0 && (
            <SubcategorySelector
              subcategories={availableSubcategories}
              value={selectedSubcatId}
              onChange={setSelectedSubcatId}
              categoryName={path[0] === 'pose' ? 'Pose & Action' : path[0] === 'env' ? 'Environment & Setting' : undefined}
              label={path[0] === 'pose' || path[0] === 'env' ? 'Theme / Subcategory' : 'Subcategory'}
              required
            />
          )}

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

          {/* Theme Dropdown Selector (Environment & Pose Items) */}
          {!isCategory && showPromptField && categoryThemes && categoryThemes.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                  <Tags className="w-3.5 h-3.5 text-orange-400" />
                  <span>Assigned Themes</span>
                </label>
                <span className="text-[10px] text-white/40">
                  {themeIds.length === 0 ? 'No themes assigned' : `${themeIds.length} theme${themeIds.length > 1 ? 's' : ''} assigned`}
                </span>
              </div>

              {/* Dropdown trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-black/50 border border-white/10 hover:border-white/20 text-xs text-white text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Tags className="w-3.5 h-3.5 text-white/40 shrink-0" />
                    <span className="truncate">
                      {themeIds.length === 0
                        ? 'Select themes to assign this item to...'
                        : categoryThemes
                            .filter((t) => themeIds.includes(t.id))
                            .map((t) => t.name)
                            .join(', ')}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 shrink-0 ${
                      themeDropdownOpen ? 'rotate-180 text-orange-400' : ''
                    }`}
                  />
                </button>

                {/* Dropdown List with On/Off Toggle per theme */}
                {themeDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-30 rounded-xl bg-[#18161e] border border-white/15 shadow-2xl overflow-hidden p-2 space-y-1 animate-in fade-in duration-150">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-white/40 px-2 py-1">
                      Toggle themes for this item
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                      {categoryThemes.map((theme) => {
                        const isAssigned = themeIds.includes(theme.id);
                        return (
                          <div
                            key={theme.id}
                            onClick={() => {
                              setThemeIds((prev) =>
                                isAssigned ? prev.filter((id) => id !== theme.id) : [...prev, theme.id]
                              );
                            }}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                              isAssigned
                                ? 'bg-orange-500/15 text-orange-200 border border-orange-500/30'
                                : 'hover:bg-white/[0.06] text-white/70 hover:text-white border border-transparent'
                            }`}
                          >
                            <span className="text-xs font-medium truncate pr-2">{theme.name}</span>
                            {/* On/Off Switch */}
                            <div
                              className={`w-8 h-4 rounded-full relative transition-colors duration-200 shrink-0 pointer-events-none ${
                                isAssigned ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-white/15'
                              }`}
                            >
                              <div
                                className={`w-3 h-3 rounded-full bg-white absolute top-[2px] transition-transform duration-200 shadow-sm ${
                                  isAssigned ? 'translate-x-[16px]' : 'translate-x-[2px]'
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Badges of currently assigned themes */}
              {themeIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {themeIds.map((tid) => {
                    const th = categoryThemes.find((t) => t.id === tid);
                    if (!th) return null;
                    return (
                      <span
                        key={tid}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-300 text-[11px] font-medium"
                      >
                        <span>{th.name}</span>
                        <button
                          type="button"
                          onClick={() => setThemeIds((prev) => prev.filter((id) => id !== tid))}
                          className="text-orange-400 hover:text-white p-0.5 rounded transition-colors"
                          title={`Remove ${th.name} theme`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Auto-Select Context Links (Context, Pose, and Environment Items) */}
          {isContextTargetCat && !isCategory && showPromptField && (
            <div className="pt-3 border-t border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <Link2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white/90 block">Auto-Select Context Links</span>
                    <span className="text-[10px] text-white/50">Bidirectional linking across Context, Pose, and Environment</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 opacity-70">
                  <span title="Context"><Camera className="w-3 h-3 text-amber-400" /></span>
                  <span title="Pose"><Activity className="w-3 h-3 text-sky-400" /></span>
                  <span title="Environment"><MapPin className="w-3 h-3 text-purple-400" /></span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/20 space-y-3">
                {/* If Environment Item: show Linked Pose and Linked Context */}
                {isEnvCategory && (
                  <>
                    <SearchableLinkSelect
                      label="Linked Pose"
                      categoryIcon={<Activity className="w-3.5 h-3.5 text-sky-400" />}
                      value={linkedPoseId}
                      onChange={setLinkedPoseId}
                      items={availablePoseItems || []}
                      placeholder="Choose complementary Pose item..."
                    />
                    <SearchableLinkSelect
                      label="Linked Context"
                      categoryIcon={<Camera className="w-3.5 h-3.5 text-amber-400" />}
                      value={linkedContextId}
                      onChange={setLinkedContextId}
                      items={availableContextItems || []}
                      placeholder="Choose complementary Context item..."
                    />
                  </>
                )}

                {/* If Pose Item: show Linked Environment and Linked Context */}
                {isPoseCategory && (
                  <>
                    <SearchableLinkSelect
                      label="Linked Environment"
                      categoryIcon={<MapPin className="w-3.5 h-3.5 text-purple-400" />}
                      value={linkedEnvId}
                      onChange={setLinkedEnvId}
                      items={availableEnvItems || []}
                      placeholder="Choose complementary Environment item..."
                    />
                    <SearchableLinkSelect
                      label="Linked Context"
                      categoryIcon={<Camera className="w-3.5 h-3.5 text-amber-400" />}
                      value={linkedContextId}
                      onChange={setLinkedContextId}
                      items={availableContextItems || []}
                      placeholder="Choose complementary Context item..."
                    />
                  </>
                )}

                {/* If Context / Composition Item: show Linked Environment and Linked Pose */}
                {isContextCategory && !isEnvCategory && !isPoseCategory && (
                  <>
                    <SearchableLinkSelect
                      label="Linked Environment"
                      categoryIcon={<MapPin className="w-3.5 h-3.5 text-purple-400" />}
                      value={linkedEnvId}
                      onChange={setLinkedEnvId}
                      items={availableEnvItems || []}
                      placeholder="Choose complementary Environment item..."
                    />
                    <SearchableLinkSelect
                      label="Linked Pose"
                      categoryIcon={<Activity className="w-3.5 h-3.5 text-sky-400" />}
                      value={linkedPoseId}
                      onChange={setLinkedPoseId}
                      items={availablePoseItems || []}
                      placeholder="Choose complementary Pose item..."
                    />
                  </>
                )}

                <p className="text-[10px] text-sky-300/70 leading-relaxed">
                  When Auto-Select Context is ON, selecting this item will automatically select its linked counterparts in the other categories.
                </p>
              </div>
            </div>
          )}

          {/* Ensemble Pairing (Outfit Section Only) */}
          {path && path[0] === 'outfit' && !isCategory && showPromptField && (
            <div className="pt-3 border-t border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white/90 block">Auto-Select Ensemble</span>
                    <span className="text-[10px] text-white/50">Pair complementary Top and Bottom items</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !ensembleEnabled;
                    setEnsembleEnabled(next);
                    if (!next) {
                      setPairedElementId('');
                    }
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    ensembleEnabled ? 'bg-purple-600' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      ensembleEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {ensembleEnabled && (
                <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/25 space-y-2.5 animate-in fade-in duration-150">
                  <label className="block text-[11px] font-medium text-purple-200">
                    Choose Paired {path[1] === 'top' ? 'Bottom' : path[1] === 'bottom' ? 'Top' : 'Outfit Item'}:
                  </label>
                  <select
                    value={pairedElementId}
                    onChange={(e) => setPairedElementId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-purple-500/30 text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="">-- Select paired complementary item --</option>
                    {availableEnsemblePairs && availableEnsemblePairs.length > 0 ? (
                      availableEnsemblePairs.map((pair) => (
                        <option key={pair.id} value={pair.id}>
                          {pair.name} {pair.subcatName ? `(${pair.subcatName})` : ''}
                        </option>
                      ))
                    ) : (
                      <option disabled value="">
                        No complementary items found in opposite category
                      </option>
                    )}
                  </select>
                  <p className="text-[10px] text-purple-300/70 leading-relaxed">
                    When Auto-Select Ensemble is active, picking this piece will automatically select the paired counterpart.
                  </p>
                </div>
              )}
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
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors"
              title={isCategory ? 'Delete Category' : 'Delete Element'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isCategory ? 'Delete Category' : 'Delete'}</span>
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
          </>
        )}
      </div>
    </div>
  );
};
