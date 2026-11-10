import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Sparkles, 
  Dices, 
  Plus, 
  ChevronLeft, 
  Search, 
  SlidersHorizontal,
  Layers,
  ArrowLeft,
  Flame,
  LayoutGrid,
  CheckCircle2,
  Home,
  RotateCcw,
  XCircle,
  Edit3,
  Database,
  GripVertical,
  CheckSquare,
  Shirt,
  Activity,
  Camera,
  MapPin,
  Tags,
  Link2
} from 'lucide-react';
import { 
  Category, 
  DBState, 
  ImgPos, 
  Preset, 
  PresetPick,
  PromptEngine, 
  PromptMode, 
  AspectRatio, 
  PromptHistoryItem,
  PromptElement,
  SubCategory,
  Theme
} from './types/prompter';
import { 
  INITIAL_DB_STATE, 
  INITIAL_CATEGORIES, 
  isDefaultCategory, 
  isDefaultSubcategory,
  DEFAULT_CATEGORY_IDS,
  DEFAULT_SUBCATEGORY_IDS,
  DEFAULT_ENV_THEMES,
  DEFAULT_POSE_THEMES,
  DEFAULT_OUTFIT_THEMES
} from './data/initialData';
import { 
  compilePrompt, 
  getSelArr, 
  resolveElement,
  EXCLUSIVE_TABBED, 
  SINGLE_PER_SUBCAT, 
  SINGLE_FLAT 
} from './utils/promptCompiler';
import { 
  playClickSound, 
  playDiceRollSound, 
  playCopySuccessSound 
} from './utils/soundEffects';
import { DesktopTitlebar } from './components/DesktopTitlebar';
import { CategoryCard } from './components/CategoryCard';
import { ElementCard } from './components/ElementCard';
import { PresetBar } from './components/PresetBar';
import { PersonaBuilder } from './components/PersonaBuilder';
import { PromptInspector } from './components/PromptInspector';
import { CropModal } from './components/CropModal';
import { CommandPalette } from './components/CommandPalette';
import { HistoryModal } from './components/HistoryModal';
import { PresetModal } from './components/PresetModal';
import { SubcategoryModal } from './components/SubcategoryModal';
import { ThemeModal } from './components/ThemeModal';
import { LinkableItemOption } from './components/SearchableLinkSelect';
import { GlowBackground } from './components/GlowBackground';
import { DevSettingsPage, UserProfile } from './components/DevSettingsPage';
import { FullExportImportModal } from './components/FullExportImportModal';
import { SettingsModal } from './components/SettingsModal';
import { AppTheme } from './types/prompter';
import { suggestPromptName, DEFAULT_CATEGORY_PROMPT_NAMES, getCategoryPromptName } from './utils/promptCompiler';
import { api, ensureImageFor, externalizeImages, inlineImages, migrateLocalStorage } from './utils/storage';
import { useHoldAndSlide } from './hooks/useHoldAndSlide';


export default function App() {
  // Multi-user state. Everything persists to the local Rust server (data/ folder), not to the browser.
  const [users, setUsers] = useState<UserProfile[]>([
    { id: 'main', name: 'Main User', isMain: true, createdAt: Date.now() }
  ]);
  const [activeUserId, setActiveUserId] = useState<string>('main');
  const [booted, setBooted] = useState<boolean>(false); // first load from the server finished
  const [ready, setReady] = useState<boolean>(false); // autosave allowed (false while loading / switching users)
  const [bootError, setBootError] = useState<string | null>(null);
  const [bootAttempt, setBootAttempt] = useState<number>(0);

  const [devActivePreset, setDevActivePreset] = useState<'extractor' | 'refiner' | 'chat'>('extractor');
  const [refinePromptInput, setRefinePromptInput] = useState<string>('');

  const ensureOnePieceInCats = (cats: Category[]): Category[] => {
    return cats.map((cat) => {
      if (cat.id === 'outfit' && cat.type === 'tabs' && cat.subcats) {
        const hasOnePiece = cat.subcats.some(
          (s) => s.id === 'onepiece' || s.id === 'one_piece' || s.id === 'one-piece'
        );
        if (!hasOnePiece) {
          const initialOutfit = INITIAL_CATEGORIES.find((c) => c.id === 'outfit');
          const initialOnePiece = initialOutfit?.subcats?.find(
            (s) => s.id === 'onepiece'
          );
          if (initialOnePiece) {
            const newSubcats = [...cat.subcats];
            const bottomIdx = newSubcats.findIndex((s) => s.id === 'bottom');
            if (bottomIdx !== -1) {
              newSubcats.splice(bottomIdx + 1, 0, initialOnePiece);
            } else {
              newSubcats.push(initialOnePiece);
            }
            return { ...cat, subcats: newSubcats };
          }
        }
      }
      return cat;
    });
  };

  const ensureDefaultSubcategoriesInCats = (cats: Category[]): Category[] => {
    return cats.map((cat: any) => {
      const initialCat = INITIAL_CATEGORIES.find((c) => c.id === cat.id);
      if (!initialCat || !initialCat.subcats) return cat;

      const existingSubcats = cat.subcats || [];
      const missingDefaults = initialCat.subcats.filter(
        (initSub) => !existingSubcats.some((s: any) => s.id === initSub.id)
      );

      if (missingDefaults.length === 0) return cat;

      const newSubcats = [...existingSubcats];
      for (const defSub of missingDefaults) {
        newSubcats.push({
          id: defSub.id,
          name: defSub.name,
          type: defSub.type || 'flat',
          els: []
        });
      }
      return { ...cat, subcats: newSubcats };
    });
  };

  const ensureThemesInCats = (cats: Category[]): Category[] => {
    return cats.map((cat: any) => {
      let themes = cat.themes ? [...cat.themes] : undefined;
      if ((!themes || themes.length === 0) && cat.id === 'env') {
        themes = [...DEFAULT_ENV_THEMES];
      } else if ((!themes || themes.length === 0) && cat.id === 'pose') {
        themes = [...DEFAULT_POSE_THEMES];
      } else if ((!themes || themes.length === 0) && cat.id === 'outfit') {
        themes = [...DEFAULT_OUTFIT_THEMES];
      }

      // Migrate existing elements: if el has no themeIds, match tags/ensembleId to themes
      if (themes && themes.length > 0) {
        const populateElThemes = (els: any[]) => {
          (els || []).forEach((el: any) => {
            if (!el.themeIds || el.themeIds.length === 0) {
              const matched = new Set<string>();
              if (el.tags && el.tags.length > 0) {
                themes!.forEach((t: any) => {
                  const tLow = t.name.toLowerCase();
                  if (el.tags.some((tag: string) => {
                    const tagLow = tag.toLowerCase();
                    return tagLow === tLow || tag === t.id || tLow.includes(tagLow) || tagLow.includes(tLow);
                  })) {
                    matched.add(t.id);
                  }
                });
              }
              // Also map outfit ensemble prefixes to outfit themes if applicable
              if (cat.id === 'outfit' && el.ensembleId) {
                if (el.ensembleId.startsWith('ens_cas')) matched.add('theme-outfit-casual-streetwear');
                else if (el.ensembleId.startsWith('ens_uni')) matched.add('theme-outfit-university-preppy');
                else if (el.ensembleId.startsWith('ens_eve')) matched.add('theme-outfit-events-nightlife');
                else if (el.ensembleId.startsWith('ens_fit')) matched.add('theme-outfit-fitness-active');
                else if (el.ensembleId.startsWith('ens_swm')) matched.add('theme-outfit-swimwear-resort');
                else if (el.ensembleId.startsWith('ens_nsf')) matched.add('theme-outfit-lingerie-sensual');
              }
              if (matched.size > 0) {
                el.themeIds = Array.from(matched);
              }
            }
          });
        };

        if (cat.type === 'flat') populateElThemes(cat.els);
        if (cat.subcats) {
          cat.subcats.forEach((sc: any) => {
            if (sc.els) populateElThemes(sc.els);
            if (sc.rows) sc.rows.forEach((r: any) => populateElThemes(r.els));
          });
        }
      }

      return {
        ...cat,
        ...(themes ? { themes } : {})
      };
    });
  };

  const getEmptyCategories = (): Category[] => {
    return ensureThemesInCats(
      ensureDefaultSubcategoriesInCats(
        ensureOnePieceInCats(
          INITIAL_CATEGORIES.map((cat: any) => ({
            ...cat,
            els: cat.els ? [] : undefined,
            subcats: cat.subcats ? cat.subcats.map((sub: any) => ({ ...sub, els: [] })) : undefined
          }))
        )
      )
    );
  };

  const getEmptyDbState = (): DBState => ({
    ...INITIAL_DB_STATE,
    cats: getEmptyCategories(),
    selections: {
      style: [],
      outfit: {},
      comp: {},
      pose: {},
      env: {},
      light: []
    },
    presets: [],
    activePreset: "",
    autoSelectContext: true,
    history: []
  });

  const normalizeDb = (parsed: any, userId: string): DBState => {
    const rawCats = parsed.cats || (userId === 'main' ? INITIAL_DB_STATE.cats : getEmptyCategories());
    const withDefaults = ensureThemesInCats(ensureDefaultSubcategoriesInCats(ensureOnePieceInCats(rawCats)));
    const migratedCats = withDefaults.map((cat: any) => ({
      ...cat,
      promptName: cat.promptName || DEFAULT_CATEGORY_PROMPT_NAMES[cat.id] || suggestPromptName(cat.name, cat.id)
    }));
    return {
      ...INITIAL_DB_STATE,
      ...parsed,
      cats: migratedCats,
      presets: parsed.presets || (userId === 'main' ? INITIAL_DB_STATE.presets : []),
      selections: parsed.selections || INITIAL_DB_STATE.selections,
      autoSelectContext: parsed.autoSelectContext !== undefined ? parsed.autoSelectContext : true
    };
  };


  const getSequentialPresetName = (presets: Preset[], prefix: string): string => {
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escaped}\\s*\\((\\d+)\\)$`, 'i');
    let maxNum = 0;
    for (const p of presets || []) {
      const match = (p.name || '').trim().match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    return `${prefix} (${maxNum + 1})`;
  };

  // Loads a user's database from the server folder (or a fresh default if they have none yet).
  const loadUserDb = async (userId: string): Promise<DBState> => {
    const raw = await api.getDb(userId);
    if (raw) return normalizeDb(raw, userId);
    return userId === 'main' ? JSON.parse(JSON.stringify(INITIAL_DB_STATE)) : getEmptyDbState();
  };

  const [db, setDb] = useState<DBState>(INITIAL_DB_STATE);

  // Boot: (optional one-time localStorage -> disk migration), then load users + active user's db from the server.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setBootError(null);
        await migrateLocalStorage();
        const serverUsers = await api.listUsers();
        let activeId = localStorage.getItem('ultimate_prompter_active_user') || 'main';
        if (!serverUsers.some((u) => u.id === activeId)) activeId = 'main';
        const loaded = await loadUserDb(activeId);
        if (cancelled) return;
        setUsers(serverUsers);
        setActiveUserId(activeId);
        setDb(loaded);
        setBooted(true);
        setReady(true);
      } catch (err: any) {
        if (!cancelled) setBootError(err?.message || String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bootAttempt]);

  const switchUser = async (targetUserId: string) => {
    if (targetUserId === activeUserId) return;
    setReady(false); // freezes autosave + shows the switching overlay
    try {
      clearTimeout(saveTimer.current);
      await api.putDb(activeUserId, dbRef.current); // flush the current user's pending changes first
      const loaded = await loadUserDb(targetUserId);
      setUndoStack([]); // undo history belongs to one database only
      setRedoStack([]);
      setView({ catId: null, subcatId: null });
      setActiveUserId(targetUserId);
      localStorage.setItem('ultimate_prompter_active_user', targetUserId);
      setDb(loaded);
    } catch (err: any) {
      alert(`Could not switch user: ${err?.message || err}`);
    } finally {
      setReady(true);
    }
  };

  const handleCreateUser = async (name: string) => {
    try {
      const newUser = await api.createUser(name);
      setUsers((prev) => [...prev.filter((u) => u.id !== newUser.id), newUser]);
      await switchUser(newUser.id);
    } catch (err: any) {
      alert(`Could not create user: ${err?.message || err}`);
    }
  };

  const handleRenameUser = async (userId: string, newName: string) => {
    try {
      const updated = await api.updateUser(userId, newName);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, name: updated.name } : u)));
    } catch (err: any) {
      throw new Error(`Could not rename user: ${err?.message || err}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === 'main') return;
    try {
      if (activeUserId === userId) {
        await switchUser('main');
      }
      await api.deleteUser(userId);
      setUsers((prev) => prev.filter((x) => x.id !== userId));
    } catch (err: any) {
      alert(`Could not delete user: ${err?.message || err}`);
    }
  };

  // Routes extracted (Ollama vision) data into a user's database. Throws on failure and returns what was
  // actually added, so the UI can only ever report a success that really happened.
  const handleExtractToUser = async (
    targetUserId: string,
    rawData: any,
    categoryFilter: string | string[] = 'all'
  ): Promise<{ added: number; presets: number }> => {
    try {
      // Models are inconsistent with key casing ("Subject", "Outfit", "pose action" ...) — normalise top-level keys.
      const data: any = {};
      Object.keys(rawData || {}).forEach((k) => {
        data[k.trim().toLowerCase().replace(/[\s-]+/g, '_')] = rawData[k];
      });
      data._image = rawData?._image;

      // Always work on the freshest copy: in-memory for the active user, the server file for everyone else.
      let targetDb: DBState =
        targetUserId === activeUserId ? dbRef.current : await loadUserDb(targetUserId);

      // ONE photo file in the target user's folder, shared by every element/preset created below.
      const imageUrl = await ensureImageFor(targetUserId, data.image || data._image);

      let added = 0;
      let presetsAdded = 0;

      const catsCopy = JSON.parse(JSON.stringify(targetDb.cats || (targetUserId === 'main' ? INITIAL_DB_STATE.cats : getEmptyCategories())));
      const selectionsCopy = JSON.parse(JSON.stringify(targetDb.selections || {}));
      const presetsCopy: Preset[] = JSON.parse(JSON.stringify(targetDb.presets || []));
      targetDb = { ...targetDb, presets: presetsCopy };

      const addElToSubcat = (catId: string, subcatId: string, name: string, promptText: string) => {
        const cat = catsCopy.find((c: any) => c.id === catId);
        if (!cat) return null;
        const newEl = {
          id: 'extracted_' + Date.now() + Math.random().toString(36).substr(2, 4),
          name: name.slice(0, 30),
          prompt: promptText,
          nsfw: false,
          image: imageUrl
        };
        if (cat.type === 'tabs' && cat.subcats) {
          const sc = cat.subcats.find((s: any) => s.id === subcatId) || cat.subcats[0];
          if (sc) {
            sc.els = sc.els || [];
            sc.els.unshift(newEl);
            added++;
            // respect the selection rules the UI enforces (one tab at a time / subject general vs mine)
            if (EXCLUSIVE_TABBED.includes(cat.id)) {
              selectionsCopy[cat.id] = {};
            } else if (cat.id === 'subject') {
              selectionsCopy[cat.id] = { ...(selectionsCopy[cat.id] || {}), general: [] };
            }
            selectionsCopy[cat.id] = selectionsCopy[cat.id] || {};
            selectionsCopy[cat.id][sc.id] = [newEl.id];
          }
        } else if (cat.type === 'flat') {
          cat.els = cat.els || [];
          cat.els.unshift(newEl);
          added++;
          selectionsCopy[cat.id] = [newEl.id];
        }
        return newEl.id;
      };

      const parseItem = (itemData: any, defaultTitle: string) => {
        if (!itemData) return null;
        if (typeof itemData === 'object') {
          const name = itemData.name || itemData.title || itemData.label || defaultTitle;
          const prompt = itemData.prompt || itemData.description || itemData.value || JSON.stringify(itemData);
          return { name: String(name).slice(0, 30), prompt: String(prompt) };
        }
        if (typeof itemData === 'string') {
          const trimmed = itemData.trim();
          const words = trimmed.split(/\s+/);
          const smartName = words.length > 0 ? words.slice(0, 3).join(' ').replace(/[^a-zA-Z0-9 ]/g, '') : defaultTitle;
          return {
            name: (smartName.length > 0 ? smartName : defaultTitle).slice(0, 30),
            prompt: trimmed
          };
        }
        return null;
      };

      const shouldProcess = (cat: string) => {
        if (categoryFilter === 'all') return true;
        const list = Array.isArray(categoryFilter) ? categoryFilter : [categoryFilter];
        if (list.length === 0) return true;
        if (cat === 'environment' || cat === 'env') return list.includes('environment') || list.includes('env');
        if (cat === 'composition' || cat === 'comp') return list.includes('composition') || list.includes('comp') || list.includes('camera');
        if (cat === 'lighting' || cat === 'light') return list.includes('lighting') || list.includes('light');
        if (cat === 'pose') return list.includes('pose');
        return list.includes(cat);
      };

      // 1. Subject Description: Physique/person details only (face, head details, body type, specific physical traits)
      if (shouldProcess('subject')) {
        const subj = parseItem(data.subject || data.subject_description, 'Subject');
        if (subj) addElToSubcat('subject', 'mine', subj.name, subj.prompt);
      }

      // 2. Outfit: Clothing and accessories only
      let topElId: string | null = null;
      let bottomElId: string | null = null;
      let onePieceElId: string | null = null;
      let accElId: string | null = null;
      let parsedTop: any = null;
      let parsedOnePiece: any = null;
      let parsedBottom: any = null;

      if (shouldProcess('outfit')) {
        const outfitData = data.outfit;
        if (outfitData) {
          if (typeof outfitData === 'object') {
            if (outfitData.one_piece || outfitData.onepiece || outfitData.onePiece) {
              parsedOnePiece = parseItem(outfitData.one_piece || outfitData.onepiece || outfitData.onePiece, 'One-Piece Outfit');
              if (parsedOnePiece) onePieceElId = addElToSubcat('outfit', 'onepiece', parsedOnePiece.name, parsedOnePiece.prompt);
            }
            if (outfitData.top || outfitData.outerwear) {
              parsedTop = parseItem(outfitData.top || outfitData.outerwear, 'Outfit Top');
              if (parsedTop) topElId = addElToSubcat('outfit', 'top', parsedTop.name, parsedTop.prompt);
            }
            if (outfitData.bottom) {
              parsedBottom = parseItem(outfitData.bottom, 'Outfit Bottom');
              if (parsedBottom) bottomElId = addElToSubcat('outfit', 'bottom', parsedBottom.name, parsedBottom.prompt);
            }
            if (outfitData.accessories_and_footwear || outfitData.accessories || outfitData.footwear || outfitData.other) {
              const parsedAcc = parseItem(outfitData.accessories_and_footwear || outfitData.accessories || outfitData.footwear || outfitData.other, 'Accessories & Footwear');
              if (parsedAcc) accElId = addElToSubcat('outfit', 'other', parsedAcc.name, parsedAcc.prompt);
            }
          } else {
            parsedTop = parseItem(outfitData, 'Outfit');
            if (parsedTop) {
              topElId = addElToSubcat('outfit', 'top', parsedTop.name, parsedTop.prompt);
            }
          }
        }

        if (data.one_piece || data.onepiece) {
          parsedOnePiece = parseItem(data.one_piece || data.onepiece, 'One-Piece Outfit');
          if (parsedOnePiece) onePieceElId = addElToSubcat('outfit', 'onepiece', parsedOnePiece.name, parsedOnePiece.prompt);
        }
        if ((data.top || data.outerwear) && !topElId) {
          parsedTop = parseItem(data.top || data.outerwear, 'Outfit Top');
          if (parsedTop) topElId = addElToSubcat('outfit', 'top', parsedTop.name, parsedTop.prompt);
        }
        if (data.bottom && !bottomElId) {
          parsedBottom = parseItem(data.bottom, 'Outfit Bottom');
          if (parsedBottom) bottomElId = addElToSubcat('outfit', 'bottom', parsedBottom.name, parsedBottom.prompt);
        }
        if ((data.accessories_and_footwear || data.accessories || data.footwear || data.other) && !accElId) {
          const parsedAcc = parseItem(data.accessories_and_footwear || data.accessories || data.footwear || data.other, 'Accessories & Footwear');
          if (parsedAcc) accElId = addElToSubcat('outfit', 'other', parsedAcc.name, parsedAcc.prompt);
        }

        // Create Outfit Preset if items were added (either Top+Bottom or One-Piece, + accessories)
        if (onePieceElId || topElId || bottomElId) {
          const outfitObj = data.outfit;
          let presetName = 'Scanned Outfit Preset';
          if (onePieceElId && parsedOnePiece?.name) {
            presetName = parsedOnePiece.name;
          } else if (outfitObj) {
            if (typeof outfitObj === 'object') {
              if (outfitObj.name || outfitObj.title) {
                presetName = outfitObj.name || outfitObj.title;
              } else if (outfitObj.top && typeof outfitObj.top === 'object' && outfitObj.top.name) {
                presetName = outfitObj.top.name;
              } else if (parsedTop && parsedTop.name) {
                presetName = parsedTop.name;
              }
            } else if (typeof outfitObj === 'string') {
              presetName = outfitObj.slice(0, 30);
            }
          } else if (data.name || data.title) {
            presetName = data.name || data.title;
          } else if (parsedTop && parsedTop.name) {
            presetName = parsedTop.name;
          }

          const presetImage = imageUrl;
          const outfitDescription = onePieceElId
            ? [parsedOnePiece?.prompt ? `One-Piece: ${parsedOnePiece.prompt}` : ''].filter(Boolean).join(' | ') || 'Auto-generated one-piece outfit preset'
            : [
                parsedTop?.prompt ? `Top: ${parsedTop.prompt}` : '',
                parsedBottom?.prompt ? `Bottom: ${parsedBottom.prompt}` : ''
              ].filter(Boolean).join(' | ') || 'Auto-generated outfit preset from Ollama vision scan';

          const newPreset = {
            id: 'preset_' + Date.now() + Math.random().toString(36).substr(2, 4),
            name: String(presetName).slice(0, 35),
            kind: 'outfit' as const,
            picks: onePieceElId
              ? [
                  { cat: 'outfit', sub: 'onepiece', el: onePieceElId },
                  ...(accElId ? [{ cat: 'outfit', sub: 'other', el: accElId }] : [])
                ]
              : [
                  ...(topElId ? [{ cat: 'outfit', sub: 'top', el: topElId }] : []),
                  ...(bottomElId ? [{ cat: 'outfit', sub: 'bottom', el: bottomElId }] : []),
                  ...(accElId ? [{ cat: 'outfit', sub: 'other', el: accElId }] : [])
                ],
            description: outfitDescription,
            image: presetImage,
            icon: 'Shirt'
          };
          targetDb.presets = targetDb.presets || [];
          targetDb.presets.unshift(newPreset);
          presetsAdded++;
        }
      }

      // 3. Pose: Body position, stance, and action only (strictly isolated from environment)
      let poseElId: string | null = null;
      let parsedPose: any = null;
      let poseSubcatId = 'standing';
      if (shouldProcess('pose')) {
        parsedPose = parseItem(data.pose || data.pose_action, 'Pose');
        if (parsedPose) {
          // Element Isolation: sanitize accidental environment bleeding
          let cleanPosePrompt = parsedPose.prompt
            .replace(/\b(?:sitting|seated|standing|leaning)\s+(?:at|in|on)\s+(?:a|an|the)\s+[^,.]*(?:table|car|restaurant|house|room|cafe|street|bar|beach|apartment|kitchen|couch|chair)[^,.]*/gi, (m: string) => {
              if (/sitting|seated/i.test(m)) return 'seated with poised upright posture';
              if (/standing/i.test(m)) return 'standing poised';
              if (/leaning/i.test(m)) return 'leaning relaxed';
              return '';
            })
            .trim();
          if (!cleanPosePrompt) cleanPosePrompt = parsedPose.prompt;

          const poseRaw = data.pose || data.pose_action;
          let chosenPoseSubcat = 'standing';
          if (typeof poseRaw === 'object' && poseRaw !== null) {
            const explicitType = String(poseRaw.type || poseRaw.subcat || poseRaw.category || '').toLowerCase();
            if (explicitType.includes('sit')) chosenPoseSubcat = 'sitting';
            else if (explicitType.includes('ly') || explicitType.includes('lie') || explicitType.includes('reclin')) chosenPoseSubcat = 'lying';
            else if (explicitType.includes('move') || explicitType.includes('walk') || explicitType.includes('stride')) chosenPoseSubcat = 'movement';
            else if (explicitType.includes('stand')) chosenPoseSubcat = 'standing';
          }
          if (chosenPoseSubcat === 'standing') {
            const text = `${parsedPose.name} ${parsedPose.prompt}`.toLowerCase();
            if (/\b(sitting|seated|cross-legged|kneeling|straddling|perched|crouch|squat)\b/.test(text)) {
              chosenPoseSubcat = 'sitting';
            } else if (/\b(lying|laying|reclining|stretched out|on back|on stomach|supine|prone)\b/.test(text)) {
              chosenPoseSubcat = 'lying';
            } else if (/\b(walking|mid-stride|stride|spinning|running|jumping|stride)\b/.test(text)) {
              chosenPoseSubcat = 'movement';
            }
          }

          poseSubcatId = chosenPoseSubcat;
          poseElId = addElToSubcat('pose', poseSubcatId, parsedPose.name, cleanPosePrompt);
        }
      }

      // 4. Composition: Granular distribution across "angle", "framing", and "style" (exactly one subcategory)
      let compElId: string | null = null;
      let parsedComp: any = null;
      let compSubcatId = 'framing';
      if (shouldProcess('composition')) {
        parsedComp = parseItem(data.composition || data.comp || data.camera, 'Composition');
        if (parsedComp) {
          const compRaw = data.composition || data.comp || data.camera;
          let chosenSubcat: 'angle' | 'framing' | 'style' | null = null;

          if (typeof compRaw === 'object' && compRaw !== null) {
            const explicitType = String(compRaw.type || compRaw.subcat || compRaw.category || '').toLowerCase();
            if (explicitType === 'angle' || explicitType === 'camera_angle' || explicitType === 'camera angle') chosenSubcat = 'angle';
            else if (explicitType === 'style' || explicitType === 'perspective' || explicitType === 'view') chosenSubcat = 'style';
            else if (explicitType === 'framing' || explicitType === 'shot_framing' || explicitType === 'shot framing') chosenSubcat = 'framing';
            else if (compRaw.angle) chosenSubcat = 'angle';
            else if (compRaw.style || compRaw.perspective) chosenSubcat = 'style';
            else if (compRaw.framing) chosenSubcat = 'framing';
          }

          if (!chosenSubcat) {
            const text = `${parsedComp.name} ${parsedComp.prompt}`.toLowerCase();
            const angleScore = (text.match(/\b(angle|eye-level|eye level|low angle|high angle|bird'?s-eye|overhead|top-down|dutch angle|tilted|tilt|worm'?s eye|ground level|looking up|looking down|canted)\b/g) || []).length;
            const styleScore = (text.match(/\b(pov|point of view|first-person|mirror|selfie|reflection|over-the-shoulder|over the shoulder|profile|side profile|rear view|back view|from behind|silhouette|candid|doorway|window|glance)\b/g) || []).length;
            const framingScore = (text.match(/\b(close-up|closeup|macro|headshot|portrait|cowboy shot|half-body|half body|waist-up|waist up|mid-thigh|full-body|full body|head-to-toe|wide shot|medium shot|extreme close-up|crop|framing)\b/g) || []).length;

            if (angleScore > framingScore && angleScore >= styleScore) {
              chosenSubcat = 'angle';
            } else if (styleScore > framingScore && styleScore > angleScore) {
              chosenSubcat = 'style';
            } else {
              chosenSubcat = 'framing';
            }
          }

          compSubcatId = chosenSubcat;
          compElId = addElToSubcat('comp', compSubcatId, parsedComp.name, parsedComp.prompt);
        }
      }

      // 5. Environment: Intelligent routing to either "Outdoor Location" (outdoor) or "Indoor Settings" (indoor)
      let envElId: string | null = null;
      let parsedEnv: any = null;
      let envSubcatId = 'outdoor';
      if (shouldProcess('environment')) {
        parsedEnv = parseItem(data.environment || data.env, 'Environment');
        if (parsedEnv) {
          const envRaw = data.environment || data.env;
          let detectedType = '';
          if (typeof envRaw === 'object' && envRaw !== null) {
            const t = String(envRaw.type || envRaw.subcat || envRaw.category || '').toLowerCase();
            if (t === 'indoor' || envRaw.indoor) detectedType = 'indoor';
            else if (t === 'outdoor' || envRaw.outdoor) detectedType = 'outdoor';
          }
          if (!detectedType) {
            const combinedText = `${parsedEnv.name} ${parsedEnv.prompt}`.toLowerCase();
            const indoorMatches = (combinedText.match(/\b(indoor|interior|room|bedroom|living room|kitchen|bathroom|studio|loft|hallway|office|bar|cafe|restaurant|gym|elevator|closet|atelier|laundromat|suite|penthouse|cove|indoor pool|lounge|spa|hotel room|palace|gallery)\b/g) || []).length;
            const outdoorMatches = (combinedText.match(/\b(outdoor|exterior|beach|street|forest|mountain|park|rooftop|garden|lake|ocean|sea|road|dune|desert|balcony|poolside|sky|crossing|alley|plaza|field|meadow|nature|waterfall|vineyard)\b/g) || []).length;
            detectedType = indoorMatches > outdoorMatches ? 'indoor' : 'outdoor';
          }
          envSubcatId = detectedType === 'indoor' ? 'indoor' : 'outdoor';
          envElId = addElToSubcat('env', envSubcatId, parsedEnv.name, parsedEnv.prompt);
        }
      }

      // 6. Lighting: Time of day, light sources, shadow, mood, and atmosphere (strictly isolated from scenery/location)
      let lightElId: string | null = null;
      if (shouldProcess('lighting')) {
        const light = parseItem(data.lighting || data.light, 'Lighting');
        if (light) {
          let cleanLightPrompt = light.prompt
            .replace(/\b(?:inside|in)\s+(?:a|an|the)\s+[^,.]*(?:room|house|restaurant|cafe|studio|hallway|apartment|building)[^,.]*/gi, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
          if (!cleanLightPrompt) cleanLightPrompt = light.prompt;
          lightElId = addElToSubcat('light', 'light', light.name, cleanLightPrompt);
        }
      }

      // Context Preset Generation: Automatically combine extracted Environment, Pose, and Composition into a single Context Preset
      if (envElId || poseElId || compElId) {
        let contextPresetName = 'Scanned Context Preset';
        if (parsedEnv?.name && parsedPose?.name) {
          contextPresetName = `${parsedEnv.name} • ${parsedPose.name}`;
        } else if (parsedEnv?.name) {
          contextPresetName = `${parsedEnv.name} Context`;
        } else if (parsedPose?.name) {
          contextPresetName = `${parsedPose.name} Pose`;
        } else if (parsedComp?.name) {
          contextPresetName = `${parsedComp.name} Composition`;
        }

        const descParts: string[] = [];
        if (parsedEnv?.prompt) descParts.push(`Environment: ${parsedEnv.prompt}`);
        if (parsedPose?.prompt) descParts.push(`Pose: ${parsedPose.prompt}`);
        if (parsedComp?.prompt) descParts.push(`Composition: ${parsedComp.prompt}`);
        const combinedDescription = descParts.join(' | ') || 'Combined Environment, Pose, and Composition context preset';

        const contextPresetImage = imageUrl;
        const newContextPreset = {
          id: 'preset_' + Date.now() + Math.random().toString(36).substr(2, 4),
          name: String(contextPresetName).slice(0, 35),
          kind: 'context' as const,
          picks: [
            ...(onePieceElId ? [{ cat: 'outfit', sub: 'onepiece', el: onePieceElId }] : []),
            ...(topElId ? [{ cat: 'outfit', sub: 'top', el: topElId }] : []),
            ...(bottomElId ? [{ cat: 'outfit', sub: 'bottom', el: bottomElId }] : []),
            ...(compElId ? [{ cat: 'comp', sub: compSubcatId, el: compElId }] : []),
            ...(poseElId ? [{ cat: 'pose', sub: poseSubcatId, el: poseElId }] : []),
            ...(envElId ? [{ cat: 'env', sub: envSubcatId, el: envElId }] : []),
            ...(lightElId ? [{ cat: 'light', el: lightElId }] : [])
          ],
          description: combinedDescription,
          image: contextPresetImage,
          icon: 'MapPin'
        };

        targetDb.presets = targetDb.presets || [];
        targetDb.presets.unshift(newContextPreset);
        presetsAdded++;
      }

      if (added === 0) {
        // nothing usable in the model reply -> do not write anything and let the UI say so
        return { added: 0, presets: 0 };
      }

      const updatedTargetDb: DBState = {
        ...targetDb,
        cats: catsCopy,
        selections: selectionsCopy,
        activePreset: null
      };

      if (targetUserId === activeUserId) {
        setDb(updatedTargetDb);
      }
      await api.putDb(targetUserId, updatedTargetDb); // throws if the file could not be written
      return { added, presets: presetsAdded };
    } catch (err) {
      console.error('Error extracting to user database:', err);
      throw err;
    }
  };

  // Copies one element (text + photo file + crop) into another user's database/folder.
  const handleTransferElementToUser = async (
    targetUserId: string,
    data: {
      name: string;
      prompt?: string;
      nsfw?: boolean;
      image: string;
      imgPos?: ImgPos;
      path: string[];
    }
  ): Promise<void> => {
    const path = data.path || [];
    if (!path[0]) {
      throw new Error('This element has no category path — save it into a category first.');
    }

    // 1. the photo is COPIED into the target user's own folder (so deleting either user never breaks the other)
    const image = await ensureImageFor(targetUserId, data.image);

    // 2. freshest copy of the target database
    const targetDb: DBState =
      targetUserId === activeUserId ? dbRef.current : await loadUserDb(targetUserId);
    const catsCopy: any[] = JSON.parse(JSON.stringify(targetDb.cats || []));

    // 3. find (or create an empty copy of) the category in the target
    let cat: any = catsCopy.find((c) => c.id === path[0]);
    if (!cat) {
      const sourceCat = dbRef.current.cats.find((c) => c.id === path[0]);
      if (!sourceCat) throw new Error(`Category "${path[0]}" does not exist.`);
      cat = JSON.parse(JSON.stringify(sourceCat));
      if (cat.els) cat.els = [];
      (cat.subcats || []).forEach((sc: any) => {
        if (sc.els) sc.els = [];
        (sc.rows || []).forEach((r: any) => {
          r.els = [];
        });
      });
      catsCopy.push(cat);
    }

    const newEl = {
      id: 'imported_' + Date.now() + Math.random().toString(36).slice(2, 6),
      name: data.name,
      prompt: data.prompt || '',
      nsfw: !!data.nsfw,
      image,
      imgPos: image ? data.imgPos : undefined
    };

    // 4. drop it into the right list (flat category, tab, or persona row)
    if (cat.type === 'flat' || !cat.subcats || cat.subcats.length === 0) {
      cat.els = cat.els || [];
      cat.els.unshift(newEl);
    } else {
      const sc =
        cat.subcats.find((s: any) => s.id === path[1]) ||
        cat.subcats.find((s: any) => s.type === 'flat') ||
        cat.subcats[0];
      if (sc.type === 'rows' && sc.rows && sc.rows.length > 0) {
        const row = sc.rows.find((r: any) => r.id === path[2]) || sc.rows[0];
        row.els = row.els || [];
        row.els.unshift(newEl);
      } else {
        sc.els = sc.els || [];
        sc.els.unshift(newEl);
      }
    }

    const updatedTargetDb: DBState = { ...targetDb, cats: catsCopy };
    if (targetUserId === activeUserId) {
      setDb(updatedTargetDb);
    }
    await api.putDb(targetUserId, updatedTargetDb);
  };

  // Navigation View State
  const [view, setView] = useState<{ catId: string | null; subcatId: string | null }>({
    catId: null,
    subcatId: null
  });

  // Undo / Redo history stacks
  const [undoStack, setUndoStack] = useState<DBState[]>([]);
  const [redoStack, setRedoStack] = useState<DBState[]>([]);
  const dbRef = useRef<DBState>(db);
  dbRef.current = db;

  // Snapshot recording before mutating selection state
  const recordHistory = () => {
    setUndoStack((prev) => [...prev.slice(-35), JSON.parse(JSON.stringify(dbRef.current))]);
    setRedoStack([]);
  };

  // Undo execution
  const handleUndo = () => {
    setUndoStack((currentPast) => {
      if (currentPast.length === 0) return currentPast;
      const previousState = currentPast[currentPast.length - 1];
      const newPast = currentPast.slice(0, currentPast.length - 1);

      setRedoStack((currentFuture) => [
        JSON.parse(JSON.stringify(dbRef.current)),
        ...currentFuture.slice(0, 35)
      ]);

      setDb(previousState);
      playClickSound(dbRef.current.soundEnabled, false);
      return newPast;
    });
  };

  // Redo execution
  const handleRedo = () => {
    setRedoStack((currentFuture) => {
      if (currentFuture.length === 0) return currentFuture;
      const nextState = currentFuture[0];
      const newFuture = currentFuture.slice(1);

      setUndoStack((currentPast) => [
        ...currentPast.slice(-35),
        JSON.parse(JSON.stringify(dbRef.current))
      ]);

      setDb(nextState);
      playClickSound(dbRef.current.soundEnabled, true);
      return newFuture;
    });
  };

  // UI States
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDevPage, setIsDevPage] = useState<boolean>(false);
  const [rootViewMode, setRootViewMode] = useState<'categories' | 'presets' | 'selected'>('categories');
  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('ultimate_prompter_theme');
    if (saved === 'minimal-dark' || saved === 'minimal-light' || saved === 'glow') {
      return saved;
    }
    if (saved === 'light') return 'minimal-light';
    return 'glow';
  });

  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);

  // Modals for editing
  const [cropModalData, setCropModalData] = useState<{
    isOpen: boolean;
    title: string;
    path: string[];
    elId?: string;
    isCategory?: boolean;
    catId?: string;
    initialName?: string;
    initialPromptName?: string;
    initialPrompt?: string;
    initialNsfw?: boolean;
    initialImage?: string;
    initialImgPos?: ImgPos;
    initialIcon?: string;
    initialEnsembleId?: string;
    initialPairedElementId?: string;
    availableSubcategories?: { id: string; name: string }[];
    initialSubcatId?: string;
    initialThemeIds?: string[];
    initialLinkedContextId?: string;
    initialLinkedPoseId?: string;
    initialLinkedEnvId?: string;
  }>({
    isOpen: false,
    title: '',
    path: []
  });

  const [presetModalData, setPresetModalData] = useState<{
    isOpen: boolean;
    preset: Preset | (Omit<Preset, 'id'> & { id?: string }) | null;
    kind: 'outfit' | 'context' | 'full';
  }>({
    isOpen: false,
    preset: null,
    kind: 'outfit'
  });

  const [subcatModalData, setSubcatModalData] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    subcat: SubCategory | null;
  }>({
    isOpen: false,
    mode: 'create',
    subcat: null
  });

  const [themeModalData, setThemeModalData] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    theme: Theme | null;
  }>({
    isOpen: false,
    mode: 'create',
    theme: null
  });

  const isContextCategory = (c: Category | null | undefined) => {
    if (!c) return false;
    return c.id === 'comp' || c.id === 'context' || c.name.toLowerCase().includes('context') || c.name.toLowerCase().includes('composition');
  };
  const isPoseCategory = (c: Category | null | undefined) => {
    if (!c) return false;
    return c.id === 'pose' || c.name.toLowerCase().includes('pose');
  };
  const isEnvCategory = (c: Category | null | undefined) => {
    if (!c) return false;
    return c.id === 'env' || c.id === 'environment' || c.name.toLowerCase().includes('environment') || c.name.toLowerCase().includes('setting');
  };
  const isContextTargetCategory = (c: Category | null | undefined) => {
    return isContextCategory(c) || isPoseCategory(c) || isEnvCategory(c);
  };

  const contextCat = useMemo(() => {
    return db.cats.find((c) => c.id === 'context' || c.name.toLowerCase().includes('context')) ||
           db.cats.find((c) => c.id === 'comp');
  }, [db.cats]);

  const poseCat = useMemo(() => {
    return db.cats.find((c) => c.id === 'pose' || c.name.toLowerCase().includes('pose'));
  }, [db.cats]);

  const envCat = useMemo(() => {
    return db.cats.find((c) => c.id === 'env' || c.id === 'environment' || c.name.toLowerCase().includes('environment'));
  }, [db.cats]);

  const getAllElementsInCat = useCallback((cat: any): PromptElement[] => {
    if (!cat) return [];
    const list: PromptElement[] = [];
    if (Array.isArray(cat.els)) list.push(...cat.els);
    if (Array.isArray(cat.subcats)) {
      for (const sub of cat.subcats) {
        if (Array.isArray(sub.els)) list.push(...sub.els);
        if (Array.isArray(sub.rows)) {
          for (const row of sub.rows) {
            if (Array.isArray(row.els)) list.push(...row.els);
          }
        }
      }
    }
    return list;
  }, []);

  const getCategoryItems = useCallback((cat: Category | undefined): LinkableItemOption[] => {
    if (!cat) return [];
    const items: LinkableItemOption[] = [];
    if (cat.type === 'flat' && cat.els) {
      cat.els.forEach((el) => {
        items.push({
          id: el.id,
          name: el.name,
          image: el.image,
          imgPos: el.imgPos,
          subcatName: cat.name
        });
      });
    }
    if (cat.subcats) {
      cat.subcats.forEach((sc) => {
        if (sc.els) {
          sc.els.forEach((el) => {
            items.push({
              id: el.id,
              name: el.name,
              image: el.image,
              imgPos: el.imgPos,
              subcatName: sc.name
            });
          });
        }
        if (sc.rows) {
          sc.rows.forEach((row) => {
            row.els.forEach((el) => {
              items.push({
                id: el.id,
                name: el.name,
                image: el.image,
                imgPos: el.imgPos,
                subcatName: `${sc.name} · ${row.name}`
              });
            });
          });
        }
      });
    }
    return items;
  }, []);

  const availableContextItems = useMemo(() => getCategoryItems(contextCat), [contextCat, getCategoryItems]);
  const availablePoseItems = useMemo(() => getCategoryItems(poseCat), [poseCat, getCategoryItems]);
  const availableEnvItems = useMemo(() => getCategoryItems(envCat), [envCat, getCategoryItems]);

  const linkedItemsNameMap = useMemo(() => {
    const map = new Map<string, string>();
    availableContextItems.forEach((i) => map.set(i.id, i.name));
    availablePoseItems.forEach((i) => map.set(i.id, i.name));
    availableEnvItems.forEach((i) => map.set(i.id, i.name));
    return map;
  }, [availableContextItems, availablePoseItems, availableEnvItems]);

  const getLinkedTooltip = useCallback((el: PromptElement): string | undefined => {
    const parts: string[] = [];
    if (el.linkedPoseId) {
      const name = linkedItemsNameMap.get(el.linkedPoseId) || 'Linked Pose';
      parts.push(`Pose - ${name}`);
    }
    if (el.linkedContextId) {
      const name = linkedItemsNameMap.get(el.linkedContextId) || 'Linked Context';
      parts.push(`Context - ${name}`);
    }
    if (el.linkedEnvId) {
      const name = linkedItemsNameMap.get(el.linkedEnvId) || 'Linked Environment';
      parts.push(`Environment - ${name}`);
    }
    return parts.length > 0 ? `Linked: ${parts.join(', ')}` : undefined;
  }, [linkedItemsNameMap]);

  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState<boolean>(false);
  const [fullExportImportModal, setFullExportImportModal] = useState<{ isOpen: boolean; tab: 'export' | 'import' }>({
    isOpen: false,
    tab: 'export'
  });
  const [presetNotice, setPresetNotice] = useState<string | null>(null);


  const availableEnsemblePairs = useMemo(() => {
    if (cropModalData.path && cropModalData.path[0] === 'outfit') {
      const currentSubId = cropModalData.path[1];
      const targetSubId = currentSubId === 'top' ? 'bottom' : currentSubId === 'bottom' ? 'top' : null;
      if (targetSubId) {
        const outfitCat = db.cats.find((c) => c.id === 'outfit');
        const targetSub = outfitCat?.subcats?.find((s) => s.id === targetSubId);
        if (targetSub?.els) {
          return targetSub.els.map((e) => ({
            id: e.id,
            name: e.name,
            image: e.image,
            subcatName: targetSub.name,
            subcatId: targetSub.id
          }));
        }
      }
    }
    return [];
  }, [cropModalData.path, db.cats]);

  const handleFullImportSuccess = (restoredDb: any) => {
    recordHistory();
    const normalized = normalizeDb(restoredDb, activeUserId);
    setDb(normalized);
    setSaveStatus('Restored full database!');
    setTimeout(() => setSaveStatus(''), 3500);
  };

  // Restore Database (restores from actual data / backup dataset)
  const handleRestoreMainUserDB = async () => {
    try {
      setSaveStatus('Restoring…');
      const restoredDb = await api.restoreDb(activeUserId);
      const normalized = normalizeDb(restoredDb, activeUserId);
      setDb(normalized);
      setUndoStack([]);
      setRedoStack([]);
      if (activeUserId === 'main') {
        setView({ catId: null, subcatId: null });
      }
      setSaveStatus('Restored');
      setTimeout(() => setSaveStatus(''), 2000);
      alert('Database has been restored to the actual dataset state.');
    } catch (err: any) {
      setSaveStatus('');
      alert(`Failed to restore database: ${err?.message || err}`);
    }
  };

  // Debounced auto-save to the local server folder (db JSON only — photos are already files)
  const saveTimer = useRef<any>(null);
  useEffect(() => {
    if (!ready) return;
    clearTimeout(saveTimer.current);
    setSaveStatus('Saving…');
    const uid = activeUserId;
    const snapshot = db;
    saveTimer.current = setTimeout(async () => {
      try {
        await api.putDb(uid, snapshot);
        setSaveStatus('Saved');
        setTimeout(() => setSaveStatus(''), 1500);
      } catch (err) {
        console.error('Save to local server failed:', err);
        setSaveStatus('⚠ Save failed');
      }
    }, 350);
  }, [db, activeUserId, ready]);

  // Keyboard shortcut listener for Command palette (Cmd+K) and Undo/Redo (Cmd+Z / Cmd+Shift+Z / Cmd+Y)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
        return;
      }

      // Check if user is typing in an input or textarea
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (
        (e.metaKey || e.ctrlKey) &&
        ((e.shiftKey && e.key.toLowerCase() === 'z') || e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Compute total selected items count
  const selectedItemsCount = useMemo(() => {
    let count = 0;
    const countNode = (node: any) => {
      if (!node) return;
      if (Array.isArray(node)) {
        count += node.length;
      } else if (typeof node === 'object') {
        Object.values(node).forEach(countNode);
      }
    };
    countNode(db.selections);
    return count;
  }, [db.selections]);

  // Compile current prompt
  const compiled = useMemo(() => {
    return compilePrompt(db);
  }, [db]);

  // Helper to count selections in a category
  const catSelCount = (cat: Category): number => {
    if (cat.type === 'flat') {
      return (db.selections[cat.id] || []).length;
    }
    let n = 0;
    (cat.subcats || []).forEach((sc) => {
      if (sc.type === 'flat') {
        n += ((db.selections[cat.id] || {})[sc.id] || []).length;
      } else if (sc.rows) {
        sc.rows.forEach((row) => {
          n += ((((db.selections[cat.id] || {})[sc.id]) || {})[row.id] || []).length;
        });
      }
    });
    return n;
  };

  // Memoized flat list of currently selected elements across all categories (for Selected Elements live preview)
  const selectedElementsList = useMemo(() => {
    const list: Array<{
      element: any;
      categoryName: string;
      categoryIcon?: string;
      categoryAccent?: string;
      subcategoryName?: string;
      rowName?: string;
      weight?: number;
    }> = [];

    db.cats.forEach((cat) => {
      if (cat.type === 'flat') {
        const selIds: string[] = (db.selections[cat.id] as string[]) || [];
        selIds.forEach((elId) => {
          const el = (cat.els || []).find((e) => e.id === elId);
          if (el) {
            list.push({
              element: el,
              categoryName: cat.name,
              categoryIcon: cat.icon,
              categoryAccent: cat.accent,
              weight: db.elementWeights?.[elId]
            });
          }
        });
      } else if (cat.type === 'tabs' && cat.subcats) {
        cat.subcats.forEach((sub) => {
          if (sub.type === 'flat') {
            const selIds: string[] = (db.selections[cat.id]?.[sub.id] as string[]) || [];
            selIds.forEach((elId) => {
              const el = (sub.els || []).find((e) => e.id === elId);
              if (el) {
                list.push({
                  element: el,
                  categoryName: cat.name,
                  categoryIcon: cat.icon,
                  categoryAccent: cat.accent,
                  subcategoryName: sub.name,
                  weight: db.elementWeights?.[elId]
                });
              }
            });
          } else if (sub.type === 'rows' && sub.rows) {
            sub.rows.forEach((row) => {
              const selIds: string[] = (db.selections[cat.id]?.[sub.id]?.[row.id] as string[]) || [];
              selIds.forEach((elId) => {
                const el = (row.els || []).find((e) => e.id === elId);
                if (el) {
                  list.push({
                    element: el,
                    categoryName: cat.name,
                    categoryIcon: cat.icon,
                    categoryAccent: cat.accent,
                    subcategoryName: sub.name,
                    rowName: row.name,
                    weight: db.elementWeights?.[elId]
                  });
                }
              });
            });
          }
        });
      }
    });

    return list;
  }, [db.cats, db.selections, db.elementWeights]);

  // Selection toggle logic
  const toggleSel = (path: string[], elId: string) => {
    recordHistory();
    setDb((prev) => {
      const selectionsCopy = JSON.parse(JSON.stringify(prev.selections || {}));

      // Helper to set array at path
      const setPathSel = (p: string[], ids: string[]) => {
        let node = selectionsCopy;
        for (let i = 0; i < p.length - 1; i++) {
          node[p[i]] = node[p[i]] || {};
          node = node[p[i]];
        }
        node[p[p.length - 1]] = ids;
      };

      const getPathSel = (p: string[]): string[] => {
        let node = selectionsCopy;
        for (let i = 0; i < p.length - 1; i++) {
          if (!node[p[i]]) return [];
          node = node[p[i]];
        }
        return Array.isArray(node[p[p.length - 1]]) ? node[p[p.length - 1]] : [];
      };

      // Exclusivity rules:
      if (path.length === 1 && SINGLE_FLAT.includes(path[0])) {
        const cur = getPathSel(path);
        const wasSelected = cur.includes(elId);
        playClickSound(prev.soundEnabled, !wasSelected);
        setPathSel(path, wasSelected ? [] : [elId]);
        return { ...prev, selections: selectionsCopy, activePreset: null };
      }

      if (path.length === 2 && path[0] === 'subject' && (path[1] === 'general' || path[1] === 'mine')) {
        const cur = getPathSel(path);
        const wasSelected = cur.includes(elId);
        playClickSound(prev.soundEnabled, !wasSelected);
        setPathSel(['subject', 'general'], []);
        setPathSel(['subject', 'mine'], []);
        if (!wasSelected) setPathSel(path, [elId]);
        return { ...prev, selections: selectionsCopy, activePreset: null };
      }

      if (path.length === 2 && EXCLUSIVE_TABBED.includes(path[0])) {
        const cur = getPathSel(path);
        const wasSelected = cur.includes(elId);
        playClickSound(prev.soundEnabled, !wasSelected);
        selectionsCopy[path[0]] = {};
        if (!wasSelected) {
          setPathSel(path, [elId]);

          // Auto-Select Context: Automatically select linked items in other connected categories
          if (prev.autoSelectContext !== false) {
            const currentCatId = path[0];
            const isComp = currentCatId === 'comp' || currentCatId === 'context';
            const isPose = currentCatId === 'pose';
            const isEnv = currentCatId === 'env' || currentCatId === 'environment';

            if (isComp || isPose || isEnv) {
              const contextCategory = prev.cats.find((c) => c.id === 'context' || c.name.toLowerCase().includes('context')) ||
                                     prev.cats.find((c) => c.id === 'comp');
              const poseCategory = prev.cats.find((c) => c.id === 'pose' || c.name.toLowerCase().includes('pose'));
              const envCategory = prev.cats.find((c) => c.id === 'env' || c.id === 'environment' || c.name.toLowerCase().includes('environment'));

              const currentCat = prev.cats.find((c) => c.id === currentCatId);
              const currentEl = currentCat ? resolveElement(currentCat, elId) : undefined;

              if (currentEl) {
                const selectInTargetCat = (targetCat: Category | undefined, targetElId: string | undefined) => {
                  if (!targetCat || !targetElId) return;
                  if (targetCat.type === 'flat') {
                    if (targetCat.els?.some((e) => e.id === targetElId)) {
                      selectionsCopy[targetCat.id] = [targetElId];
                    }
                  } else if (targetCat.subcats) {
                    for (const sc of targetCat.subcats) {
                      if (sc.els?.some((e) => e.id === targetElId)) {
                        selectionsCopy[targetCat.id] = { [sc.id]: [targetElId] };
                        break;
                      }
                      if (sc.rows) {
                        for (const row of sc.rows) {
                          if (row.els?.some((e) => e.id === targetElId)) {
                            selectionsCopy[targetCat.id] = { [sc.id]: { [row.id]: [targetElId] } };
                            break;
                          }
                        }
                      }
                    }
                  }
                };

                const findReciprocalId = (cat: Category | undefined, field: 'linkedContextId' | 'linkedPoseId' | 'linkedEnvId'): string | undefined => {
                  if (!cat) return undefined;
                  const all = (cat.type === 'flat' ? cat.els : cat.subcats?.flatMap((s) => s.els || s.rows?.flatMap((r) => r.els) || [])) || [];
                  const found = all.find((e: any) => e[field] === elId);
                  return found?.id;
                };

                if (isEnv) {
                  const targetPoseId = currentEl.linkedPoseId || findReciprocalId(poseCategory, 'linkedEnvId');
                  selectInTargetCat(poseCategory, targetPoseId);
                  const targetContextId = currentEl.linkedContextId || findReciprocalId(contextCategory, 'linkedEnvId');
                  selectInTargetCat(contextCategory, targetContextId);
                } else if (isPose) {
                  const targetEnvId = currentEl.linkedEnvId || findReciprocalId(envCategory, 'linkedPoseId');
                  selectInTargetCat(envCategory, targetEnvId);
                  const targetContextId = currentEl.linkedContextId || findReciprocalId(contextCategory, 'linkedPoseId');
                  selectInTargetCat(contextCategory, targetContextId);
                } else if (isComp) {
                  const targetEnvId = currentEl.linkedEnvId || findReciprocalId(envCategory, 'linkedContextId');
                  selectInTargetCat(envCategory, targetEnvId);
                  const targetPoseId = currentEl.linkedPoseId || findReciprocalId(poseCategory, 'linkedContextId');
                  selectInTargetCat(poseCategory, targetPoseId);
                }
              }
            }
          }
        }
        return { ...prev, selections: selectionsCopy, activePreset: null };
      }


      if (path.length === 2 && SINGLE_PER_SUBCAT.includes(path[0])) {
        const cur = getPathSel(path);
        const wasSelected = cur.includes(elId);
        playClickSound(prev.soundEnabled, !wasSelected);

        if (path[0] === 'outfit') {
          const subId = path[1];
          if (subId === 'onepiece' || subId === 'one_piece' || subId === 'one-piece') {
            if (!wasSelected) {
              setPathSel(['outfit', 'top'], []);
              setPathSel(['outfit', 'bottom'], []);
            }
          } else if (subId === 'top' || subId === 'bottom') {
            if (!wasSelected) {
              setPathSel(['outfit', 'onepiece'], []);
              setPathSel(['outfit', 'one_piece'], []);
              setPathSel(['outfit', 'one-piece'], []);

              // Smart Ensemble Auto-Selection strictly between Top and Bottom
              if (prev.autoSelectEnsemble !== false) {
                const outfitCat = prev.cats.find((c) => c.id === 'outfit');
                const thisSub = outfitCat?.subcats?.find((s) => s.id === subId);
                const selectedEl = thisSub?.els?.find((e) => e.id === elId);
                const targetSubId = subId === 'top' ? 'bottom' : 'top';
                const targetSub = outfitCat?.subcats?.find((s) => s.id === targetSubId);

                if (selectedEl && targetSub?.els) {
                  let matchingEl = selectedEl.pairedElementId
                    ? targetSub.els.find((e) => e.id === selectedEl.pairedElementId)
                    : undefined;

                  if (!matchingEl && selectedEl.ensembleId) {
                    matchingEl = targetSub.els.find((e) => e.ensembleId === selectedEl.ensembleId);
                  }

                  // Fallback match by shared primary theme tag
                  if (!matchingEl && selectedEl.tags && selectedEl.tags.length > 0) {
                    matchingEl = targetSub.els.find((e) =>
                      e.tags && e.tags.some((t) => selectedEl.tags!.includes(t))
                    );
                  }

                  if (matchingEl) {
                    setPathSel(['outfit', targetSubId], [matchingEl.id]);
                  }
                }
              }
            }
          }
        }

        setPathSel(path, wasSelected ? [] : [elId]);
        return { ...prev, selections: selectionsCopy, activePreset: null };
      }

      const arr = getPathSel(path);
      const idx = arr.indexOf(elId);
      const isSelecting = idx === -1;
      playClickSound(prev.soundEnabled, isSelecting);

      if (idx > -1) {
        arr.splice(idx, 1);
      } else {
        arr.push(elId);
      }
      setPathSel(path, arr);

      return { ...prev, selections: selectionsCopy, activePreset: null };
    });
  };

  // Helper to pick random item
  const pickRandom = (arr: any[], n: number) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, n);
  };

  // Randomize a single category
  const randomizeCat = (catId: string, skipHistory: boolean = false) => {
    if (db.locks[catId]) return;
    const cat = db.cats.find((c) => c.id === catId);
    if (!cat) return;

    if (!skipHistory) {
      recordHistory();
    }

    setDb((prev) => {
      const selectionsCopy = JSON.parse(JSON.stringify(prev.selections || {}));
      const visible = (els: any[]) => (els || []).filter((e) => prev.nsfwOn || !e.nsfw);

      const setPathSel = (p: string[], ids: string[]) => {
        let node = selectionsCopy;
        for (let i = 0; i < p.length - 1; i++) {
          node[p[i]] = node[p[i]] || {};
          node = node[p[i]];
        }
        node[p[p.length - 1]] = ids;
      };

      if (catId === 'subject') {
        const sc = cat.subcats?.find((s) => s.id === 'general');
        if (sc?.els) {
          const ids = pickRandom(visible(sc.els), 1).map((e) => e.id);
          setPathSel(['subject', 'mine'], []);
          setPathSel(['subject', 'general'], ids);
        }
      } else if (catId === 'outfit' && cat.subcats) {
        const isOnePieceSub = (sId: string) => {
          const lower = sId.toLowerCase();
          return lower === 'onepiece' || lower === 'one_piece' || lower === 'one-piece' || lower.includes('dress') || lower.includes('one piece');
        };
        const isTopSub = (sId: string) => {
          const lower = sId.toLowerCase();
          return lower === 'top' || lower.includes('top');
        };
        const isBottomSub = (sId: string) => {
          const lower = sId.toLowerCase();
          return lower === 'bottom' || lower.includes('bottom');
        };

        const topSub = cat.subcats.find((s) => isTopSub(s.id));
        const bottomSub = cat.subcats.find((s) => isBottomSub(s.id));
        const onePieceSub = cat.subcats.find((s) => isOnePieceSub(s.id));

        const topEls = topSub?.els ? visible(topSub.els) : [];
        const bottomEls = bottomSub?.els ? visible(bottomSub.els) : [];
        const onePieceEls = onePieceSub?.els ? visible(onePieceSub.els) : [];

        const canDoTwoPiece = topEls.length > 0 && bottomEls.length > 0;
        const canDoOnePiece = onePieceEls.length > 0;

        // Mutual exclusivity: Option A (top + bottom) vs Option B (one piece only)
        let chooseOptionA = false;
        if (canDoTwoPiece && canDoOnePiece) {
          chooseOptionA = Math.random() < 0.5;
        } else if (canDoTwoPiece) {
          chooseOptionA = true;
        } else if (canDoOnePiece) {
          chooseOptionA = false;
        } else if (topEls.length > 0) {
          chooseOptionA = true;
        }

        if (chooseOptionA) {
          // Option A: 1 item from top AND 1 item from bottom; leave one-piece UNSELECTED
          if (topSub) {
            setPathSel(['outfit', topSub.id], pickRandom(topEls, 1).map((e) => e.id));
          }
          if (bottomSub) {
            setPathSel(['outfit', bottomSub.id], pickRandom(bottomEls, 1).map((e) => e.id));
          }
          if (onePieceSub) {
            setPathSel(['outfit', onePieceSub.id], []);
          }
        } else {
          // Option B: 1 item from one-piece ONLY; leave top and bottom UNSELECTED
          if (onePieceSub) {
            setPathSel(['outfit', onePieceSub.id], pickRandom(onePieceEls, 1).map((e) => e.id));
          }
          if (topSub) {
            setPathSel(['outfit', topSub.id], []);
          }
          if (bottomSub) {
            setPathSel(['outfit', bottomSub.id], []);
          }
        }

        // Randomize any other subcategories in outfit (e.g. accessories, footwear)
        cat.subcats.forEach((sc) => {
          if (!isTopSub(sc.id) && !isBottomSub(sc.id) && !isOnePieceSub(sc.id)) {
            if (sc.els) {
              const ids = pickRandom(visible(sc.els), 1).map((e) => e.id);
              setPathSel(['outfit', sc.id], ids);
            }
          }
        });
      } else if (catId === 'kw' && cat.type === 'flat') {
        const ids = pickRandom(visible(cat.els || []), 3).map((e) => e.id);
        setPathSel(['kw'], ids);
      } else if (cat.type === 'flat') {
        const ids = pickRandom(visible(cat.els || []), 1).map((e) => e.id);
        setPathSel([cat.id], ids);
      } else if (cat.subcats) {
        const flatSubcats = cat.subcats.filter(
          (s) => s.type === 'flat' && visible(s.els || []).length > 0
        );
        if (flatSubcats.length > 0) {
          const pickedSub = flatSubcats[Math.floor(Math.random() * flatSubcats.length)];
          const ids = pickRandom(visible(pickedSub.els || []), 1).map((e) => e.id);
          selectionsCopy[cat.id] = {};
          setPathSel([cat.id, pickedSub.id], ids);
        }
      }

      return { ...prev, selections: selectionsCopy, activePreset: null };
    });
  };

  // Randomize all unlocked categories
  const handleRandomizeAll = () => {
    setIsRolling(true);
    playDiceRollSound(db.soundEnabled);
    recordHistory();

    // Roll categories sequentially for tactile feeling
    const catsToRoll = db.cats.map((c) => c.id).filter((id) => !db.locks[id]);
    catsToRoll.forEach((catId) => {
      randomizeCat(catId, true);
    });

    setTimeout(() => {
      setIsRolling(false);
    }, 450);
  };

  // Lock toggle
  const toggleLock = (catId: string) => {
    setDb((prev) => ({
      ...prev,
      locks: {
        ...prev.locks,
        [catId]: !prev.locks[catId]
      }
    }));
  };

  // Clear selections
  const handleClearAll = () => {
    playClickSound(db.soundEnabled, false);
    recordHistory();
    setDb((prev) => ({
      ...prev,
      selections: {},
      activePreset: null
    }));
  };

  // Clear all selections within a specific category
  const handleClearCategory = (catId: string) => {
    playClickSound(db.soundEnabled, false);
    recordHistory();
    setDb((prev) => {
      const selectionsCopy = JSON.parse(JSON.stringify(prev.selections || {}));
      delete selectionsCopy[catId];
      return {
        ...prev,
        selections: selectionsCopy,
        activePreset: null
      };
    });
  };

  // Clear selections within a specific row/subpath (e.g. in PersonaBuilder)
  const handleClearRow = (path: string[]) => {
    playClickSound(db.soundEnabled, false);
    recordHistory();
    setDb((prev) => {
      const selectionsCopy = JSON.parse(JSON.stringify(prev.selections || {}));
      if (path.length === 3 && selectionsCopy[path[0]]?.[path[1]]) {
        delete selectionsCopy[path[0]][path[1]][path[2]];
      }
      return {
        ...prev,
        selections: selectionsCopy,
        activePreset: null
      };
    });
  };

  // Presets toggling
  const handleTogglePreset = (presetId: string) => {
    const p = db.presets.find((x) => x.id === presetId);
    if (!p) return;

    playClickSound(db.soundEnabled, true);
    recordHistory();

    setDb((prev) => {
      const selectionsCopy = JSON.parse(JSON.stringify(prev.selections || {}));

      // If already active, toggle off
      if (prev.activePreset === presetId) {
        p.picks.forEach((k) => {
          if (EXCLUSIVE_TABBED.includes(k.cat)) {
            selectionsCopy[k.cat] = {};
          } else if (k.sub) {
            if (selectionsCopy[k.cat]) selectionsCopy[k.cat][k.sub] = [];
          } else {
            selectionsCopy[k.cat] = [];
          }
        });
        return { ...prev, selections: selectionsCopy, activePreset: null };
      }

      // Apply preset picks
      p.picks.forEach((k) => {
        if (EXCLUSIVE_TABBED.includes(k.cat)) {
          selectionsCopy[k.cat] = {};
        }
        if (k.sub) {
          selectionsCopy[k.cat] = selectionsCopy[k.cat] || {};
          selectionsCopy[k.cat][k.sub] = [k.el];
        } else {
          selectionsCopy[k.cat] = [k.el];
        }
      });

      return { ...prev, selections: selectionsCopy, activePreset: presetId };
    });
  };

  // Copy prompt handler with history logging
  const handleCopyPrompt = () => {
    if (!compiled.raw) return;
    navigator.clipboard.writeText(compiled.raw);
    setIsCopied(true);
    playCopySuccessSound(db.soundEnabled);

    // Log to history
    const historyItem: PromptHistoryItem = {
      id: 'h' + Date.now(),
      timestamp: Date.now(),
      prompt: compiled.raw,
      engine: db.promptEngine
    };

    setDb((prev) => ({
      ...prev,
      history: [historyItem, ...(prev.history || []).slice(0, 24)]
    }));

    setTimeout(() => {
      setIsCopied(false);
    }, 1600);
  };

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Toggle Auto-Select Ensemble
  const handleToggleAutoSelectEnsemble = () => {
    recordHistory();
    const nextVal = db.autoSelectEnsemble === false ? true : false;
    playClickSound(db.soundEnabled, nextVal);
    setDb((prev) => ({
      ...prev,
      autoSelectEnsemble: nextVal
    }));
  };

  // Toggle Auto-Select Context
  const handleToggleAutoSelectContext = () => {
    recordHistory();
    const nextVal = db.autoSelectContext === false ? true : false;
    playClickSound(db.soundEnabled, nextVal);
    setDb((prev) => ({
      ...prev,
      autoSelectContext: nextVal
    }));
  };

  // Theme Management Handlers (Environment and Pose themes)
  const handleSaveTheme = (name: string) => {
    if (!activeCat) return;
    recordHistory();
    setDb((prev) => {
      const catsCopy = JSON.parse(JSON.stringify(prev.cats));
      const cat = catsCopy.find((c: any) => c.id === activeCat.id);
      if (cat) {
        cat.themes = cat.themes || [];
        if (themeModalData.mode === 'edit' && themeModalData.theme) {
          const oldName = themeModalData.theme.name;
          const th = cat.themes.find((t: any) => t.id === themeModalData.theme!.id);
          if (th) th.name = name;
          // Also update any tags on elements that had oldName
          const updateTags = (els: any[]) => {
            (els || []).forEach((el: any) => {
              if (el.tags && el.tags.includes(oldName)) {
                el.tags = el.tags.map((t: string) => (t === oldName ? name : t));
              }
            });
          };
          if (cat.type === 'flat') updateTags(cat.els);
          if (cat.subcats) {
            cat.subcats.forEach((sc: any) => {
              if (sc.els) updateTags(sc.els);
              if (sc.rows) sc.rows.forEach((r: any) => updateTags(r.els));
            });
          }
        } else {
          const newId = `th_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          cat.themes.push({ id: newId, name });
        }
      }
      return { ...prev, cats: catsCopy };
    });
  };

  const handleDeleteTheme = () => {
    if (!activeCat || !themeModalData.theme) return;
    const themeId = themeModalData.theme.id;
    const themeName = themeModalData.theme.name;
    recordHistory();
    setDb((prev) => {
      const catsCopy = JSON.parse(JSON.stringify(prev.cats));
      const cat = catsCopy.find((c: any) => c.id === activeCat.id);
      if (cat) {
        cat.themes = (cat.themes || []).filter((t: any) => t.id !== themeId);
        // Unassign from elements, DO NOT delete items!
        const unassign = (els: any[]) => {
          (els || []).forEach((el: any) => {
            if (el.themeIds) {
              el.themeIds = el.themeIds.filter((tid: string) => tid !== themeId && tid !== themeName);
            }
            if (el.tags) {
              el.tags = el.tags.filter((t: string) => t !== themeName && t !== themeId);
            }
          });
        };
        if (cat.type === 'flat') unassign(cat.els);
        if (cat.subcats) {
          cat.subcats.forEach((sc: any) => {
            if (sc.els) unassign(sc.els);
            if (sc.rows) sc.rows.forEach((r: any) => unassign(r.els));
          });
        }
      }
      return { ...prev, cats: catsCopy };
    });
    if (selectedThemeId === themeId) {
      setSelectedThemeId('all');
    }
  };


  // Export DB — photos are inlined so the backup is one self-contained, portable file
  const handleExportDB = async () => {
    try {
      setSaveStatus('Exporting…');
      const portable = await inlineImages(db);
      const blob = new Blob([JSON.stringify(portable, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = `prompter-studio-backup-${Date.now()}.json`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setSaveStatus('');
    } catch (err: any) {
      setSaveStatus('');
      alert(`Export failed: ${err?.message || err}`);
    }
  };

  // Import DB — embedded photos are written to the data folder as real files
  const handleImportDB = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const imported = JSON.parse(evt.target?.result as string);
          if (!imported || !Array.isArray(imported.cats)) {
            throw new Error('This file is not a Prompter workspace backup (no "cats" list).');
          }
          setSaveStatus('Importing photos…');
          const converted = await externalizeImages(activeUserId, imported);
          recordHistory();
          setDb(normalizeDb(converted, activeUserId));
          setSaveStatus('');
          alert('Workspace JSON loaded successfully!');
        } catch (err: any) {
          setSaveStatus('');
          alert(`Import failed: ${err?.message || err}`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Active category / subcategory resolution
  const activeCat = db.cats.find((c) => c.id === view.catId);
  const activeSubcat = activeCat?.subcats?.find(
    (s) => s.id === (view.subcatId || activeCat.subcats?.[0]?.id)
  );

  const activeSubcats = useMemo(() => activeCat?.subcats || [], [activeCat]);
  const currentElements = useMemo(() => {
    if (!activeCat) return [];
    if (activeCat.type === 'flat') return activeCat.els || [];
    return activeSubcat?.els || [];
  }, [activeCat, activeSubcat]);

  // Hold-and-slide reordering for categories
  const categoryReorder = useHoldAndSlide({
    groupId: 'categories',
    items: db.cats,
    onReorder: (newCats) => {
      setDb((prev) => ({ ...prev, cats: newCats }));
    },
    onCommit: () => {
      recordHistory();
    }
  });

  // Hold-and-slide reordering for subcategories
  const subcatReorder = useHoldAndSlide({
    groupId: 'subcategories',
    items: activeSubcats,
    onReorder: (newSubcats) => {
      if (!activeCat) return;
      setDb((prev) => {
        const catsCopy = JSON.parse(JSON.stringify(prev.cats));
        const cat = catsCopy.find((c: any) => c.id === activeCat.id);
        if (cat) cat.subcats = newSubcats;
        return { ...prev, cats: catsCopy };
      });
    },
    onCommit: () => {
      recordHistory();
    }
  });

  // Hold-and-slide reordering for individual item elements
  const visibleElements = useMemo(() => {
    return currentElements.filter((e) => db.nsfwOn || !e.nsfw);
  }, [currentElements, db.nsfwOn]);

  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('all');

  // Reset tag and theme filter when switching category or subcategory
  useEffect(() => {
    setSelectedTagFilter('all');
    setSelectedThemeId('all');
  }, [view.catId, view.subcatId]);

  // Hold-and-slide reordering for themes
  const themeReorder = useHoldAndSlide({
    groupId: `themes-${activeCat?.id || 'none'}`,
    items: activeCat?.themes || [],
    onReorder: (newThemes) => {
      if (!activeCat) return;
      setDb((prev) => {
        const catsCopy = JSON.parse(JSON.stringify(prev.cats));
        const cat = catsCopy.find((c: any) => c.id === activeCat.id);
        if (cat) cat.themes = newThemes;
        return { ...prev, cats: catsCopy };
      });
    },
    onCommit: () => {
      recordHistory();
    }
  });

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    visibleElements.forEach((el) => {
      if (el.tags && el.tags.length > 0) {
        set.add(el.tags[0]);
      }
    });
    return Array.from(set);
  }, [visibleElements]);

  const displayedElements = useMemo(() => {
    if (activeCat?.themes) {
      if (selectedThemeId === 'all' || activeCat.themes.length === 0) return visibleElements;
      const theme = activeCat.themes.find((t) => t.id === selectedThemeId);
      if (!theme) return visibleElements;
      return visibleElements.filter((el) => {
        if (el.themeIds && el.themeIds.length > 0) {
          return el.themeIds.includes(theme.id) || el.themeIds.includes(theme.name);
        }
        return Boolean(el.tags && (el.tags.includes(theme.name) || el.tags.includes(theme.id)));
      });
    }
    if (selectedTagFilter === 'all') return visibleElements;
    return visibleElements.filter((el) => el.tags && el.tags.includes(selectedTagFilter));
  }, [visibleElements, selectedThemeId, selectedTagFilter, activeCat?.themes]);

  const elementReorder = useHoldAndSlide({
    groupId: activeSubcat 
      ? `elements-${activeCat?.id}-${activeSubcat.id}-${selectedThemeId}-${selectedTagFilter}` 
      : `elements-${activeCat?.id || 'flat'}-${selectedThemeId}-${selectedTagFilter}`,
    items: displayedElements,

    onReorder: (newVisibleEls) => {
      if (!activeCat) return;
      setDb((prev) => {
        const catsCopy = JSON.parse(JSON.stringify(prev.cats));
        const cat = catsCopy.find((c: any) => c.id === activeCat.id);
        if (cat) {
          const targetList = cat.type === 'flat' ? cat.els : cat.subcats?.find((s: any) => s.id === activeSubcat?.id)?.els;
          if (targetList) {
            if (selectedTagFilter === 'all') {
              let visIdx = 0;
              const updated = targetList.map((el: any) => {
                if (db.nsfwOn || !el.nsfw) {
                  return newVisibleEls[visIdx++] || el;
                }
                return el;
              });
              if (cat.type === 'flat') {
                cat.els = updated;
              } else {
                const sc = cat.subcats?.find((s: any) => s.id === activeSubcat?.id);
                if (sc) sc.els = updated;
              }
            } else {
              const remaining = targetList.filter(
                (el: any) => !displayedElements.some((de) => de.id === el.id)
              );
              const updated = [...newVisibleEls, ...remaining];
              if (cat.type === 'flat') {
                cat.els = updated;
              } else {
                const sc = cat.subcats?.find((s: any) => s.id === activeSubcat?.id);
                if (sc) sc.els = updated;
              }
            }
          }
        }
        return { ...prev, cats: catsCopy };
      });
    },
    onCommit: () => {
      recordHistory();
    }
  });

  // Helper to determine if Outfit Preset can be created:
  // Rule: Base it on either (Outfit-Top + Outfit-Bottom) OR (One-Piece + Accessories & Footwear if present)
  const canCreateOutfitPreset = useMemo(() => {
    const outfitSel = db.selections?.outfit || {};
    const hasTop = Array.isArray(outfitSel.top) && outfitSel.top.length > 0;
    const hasBottom = Array.isArray(outfitSel.bottom) && outfitSel.bottom.length > 0;
    const hasOnePiece =
      (Array.isArray(outfitSel.onepiece) && outfitSel.onepiece.length > 0) ||
      (Array.isArray(outfitSel['one_piece']) && outfitSel['one_piece'].length > 0) ||
      (Array.isArray(outfitSel['one-piece']) && outfitSel['one-piece'].length > 0);

    return (hasTop && hasBottom) || hasOnePiece;
  }, [db.selections]);

  // Helper to determine if Context Preset can be created:
  // Rule: Base it on the currently selected Outfit-Top, Outfit-Bottom (or One-Piece), Composition, Pose & Action, and Environment & Lighting
  const canCreateContextPreset = useMemo(() => {
    const sel = db.selections || {};
    const outfitSel = sel.outfit || {};
    const hasTop = Array.isArray(outfitSel.top) && outfitSel.top.length > 0;
    const hasBottom = Array.isArray(outfitSel.bottom) && outfitSel.bottom.length > 0;
    const hasOnePiece =
      (Array.isArray(outfitSel.onepiece) && outfitSel.onepiece.length > 0) ||
      (Array.isArray(outfitSel['one_piece']) && outfitSel['one_piece'].length > 0) ||
      (Array.isArray(outfitSel['one-piece']) && outfitSel['one-piece'].length > 0);

    const hasOutfit = (hasTop && hasBottom) || hasOnePiece || hasTop || hasBottom;

    const hasAnyComp = Object.values(sel.comp || {}).some(
      (arr: any) => Array.isArray(arr) && arr.length > 0
    );
    const hasAnyPose = Object.values(sel.pose || {}).some(
      (arr: any) => Array.isArray(arr) && arr.length > 0
    );
    const hasAnyEnv = Object.values(sel.env || {}).some(
      (arr: any) => Array.isArray(arr) && arr.length > 0
    );
    const hasAnyLight = Array.isArray(sel.light)
      ? sel.light.length > 0
      : Object.values(sel.light || {}).some((arr: any) => Array.isArray(arr) && arr.length > 0);

    return hasOutfit || hasAnyComp || hasAnyPose || hasAnyEnv || hasAnyLight;
  }, [db.selections]);

  // Sequential preset name generator: New Outfit Preset (1), New Context Preset (1), etc.
  const getNextPresetName = (kind: 'context' | 'outfit'): string => {
    const prefix = kind === 'context' ? 'New Context Preset' : 'New Outfit Preset';
    const regex = new RegExp(`^${prefix} \\((\\d+)\\)$`);
    let maxNum = 0;
    (db.presets || []).forEach((p) => {
      const match = p.name.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    return `${prefix} (${maxNum + 1})`;
  };

  // Create Outfit Preset directly from currently selected items in Prompt Inspector
  const handleCreateOutfitPreset = () => {
    const outfitSel = db.selections?.outfit || {};
    const hasOnePiece =
      (Array.isArray(outfitSel.onepiece) && outfitSel.onepiece.length > 0) ||
      (Array.isArray(outfitSel['one_piece']) && outfitSel['one_piece'].length > 0) ||
      (Array.isArray(outfitSel['one-piece']) && outfitSel['one-piece'].length > 0);

    const picks: PresetPick[] = [];
    const descParts: string[] = [];

    const findEl = (catId: string, subId: string | undefined, elId: string) => {
      const cat = db.cats.find((c) => c.id === catId);
      if (!cat) return null;
      if (subId && cat.subcats) {
        const sc = cat.subcats.find((s) => s.id === subId);
        return sc?.els?.find((e) => e.id === elId) || null;
      }
      return cat.els?.find((e) => e.id === elId) || null;
    };

    if (hasOnePiece) {
      const opKey =
        Array.isArray(outfitSel.onepiece) && outfitSel.onepiece.length > 0
          ? 'onepiece'
          : Array.isArray(outfitSel['one_piece']) && outfitSel['one_piece'].length > 0
          ? 'one_piece'
          : 'one-piece';
      const opId = outfitSel[opKey][0];
      picks.push({ cat: 'outfit', sub: opKey, el: opId });
      const el = findEl('outfit', opKey, opId);
      if (el) descParts.push(el.name);
    } else {
      if (outfitSel.top?.[0]) {
        picks.push({ cat: 'outfit', sub: 'top', el: outfitSel.top[0] });
        const el = findEl('outfit', 'top', outfitSel.top[0]);
        if (el) descParts.push(el.name);
      }
      if (outfitSel.bottom?.[0]) {
        picks.push({ cat: 'outfit', sub: 'bottom', el: outfitSel.bottom[0] });
        const el = findEl('outfit', 'bottom', outfitSel.bottom[0]);
        if (el) descParts.push(el.name);
      }
    }

    // Accessories & Footwear (or any extra outfit subcategories)
    Object.keys(outfitSel).forEach((subKey) => {
      if (
        subKey !== 'top' &&
        subKey !== 'bottom' &&
        subKey !== 'onepiece' &&
        subKey !== 'one_piece' &&
        subKey !== 'one-piece'
      ) {
        const arr = outfitSel[subKey];
        if (Array.isArray(arr)) {
          arr.forEach((elId: string) => {
            picks.push({ cat: 'outfit', sub: subKey, el: elId });
            const el = findEl('outfit', subKey, elId);
            if (el) descParts.push(el.name);
          });
        }
      }
    });

    const name = getNextPresetName('outfit');
    // Open existing PresetModal prefilled with active selected items and default sequential name
    setPresetModalData({
      isOpen: true,
      kind: 'outfit',
      preset: {
        name,
        kind: 'outfit',
        description: descParts.join(' + ') || 'Custom Outfit Preset',
        picks,
        icon: 'Shirt'
      }
    });
  };

  // Create Context Preset directly from currently selected items in Prompt Inspector
  const handleCreateContextPreset = () => {
    const sel = db.selections || {};
    const picks: PresetPick[] = [];
    const descParts: string[] = [];

    const findEl = (catId: string, subId: string | undefined, elId: string) => {
      const cat = db.cats.find((c) => c.id === catId);
      if (!cat) return null;
      if (subId && cat.subcats) {
        const sc = cat.subcats.find((s) => s.id === subId);
        return sc?.els?.find((e) => e.id === elId) || null;
      }
      return cat.els?.find((e) => e.id === elId) || null;
    };

    // Outfit: Top, Bottom or One-Piece
    const outfitSel = sel.outfit || {};
    const hasOnePiece =
      (Array.isArray(outfitSel.onepiece) && outfitSel.onepiece.length > 0) ||
      (Array.isArray(outfitSel['one_piece']) && outfitSel['one_piece'].length > 0) ||
      (Array.isArray(outfitSel['one-piece']) && outfitSel['one-piece'].length > 0);

    if (hasOnePiece) {
      const opKey =
        Array.isArray(outfitSel.onepiece) && outfitSel.onepiece.length > 0
          ? 'onepiece'
          : Array.isArray(outfitSel['one_piece']) && outfitSel['one_piece'].length > 0
          ? 'one_piece'
          : 'one-piece';
      picks.push({ cat: 'outfit', sub: opKey, el: outfitSel[opKey][0] });
      const el = findEl('outfit', opKey, outfitSel[opKey][0]);
      if (el) descParts.push(el.name);
    } else {
      if (outfitSel.top?.[0]) {
        picks.push({ cat: 'outfit', sub: 'top', el: outfitSel.top[0] });
        const el = findEl('outfit', 'top', outfitSel.top[0]);
        if (el) descParts.push(el.name);
      }
      if (outfitSel.bottom?.[0]) {
        picks.push({ cat: 'outfit', sub: 'bottom', el: outfitSel.bottom[0] });
        const el = findEl('outfit', 'bottom', outfitSel.bottom[0]);
        if (el) descParts.push(el.name);
      }
    }

    // Composition
    if (sel.comp) {
      Object.entries(sel.comp).forEach(([subId, ids]) => {
        if (Array.isArray(ids)) {
          ids.forEach((elId: string) => {
            picks.push({ cat: 'comp', sub: subId, el: elId });
            const el = findEl('comp', subId, elId);
            if (el) descParts.push(el.name);
          });
        }
      });
    }

    // Pose & Action
    if (sel.pose) {
      Object.entries(sel.pose).forEach(([subId, ids]) => {
        if (Array.isArray(ids)) {
          ids.forEach((elId: string) => {
            picks.push({ cat: 'pose', sub: subId, el: elId });
            const el = findEl('pose', subId, elId);
            if (el) descParts.push(el.name);
          });
        }
      });
    }

    // Environment
    if (sel.env) {
      Object.entries(sel.env).forEach(([subId, ids]) => {
        if (Array.isArray(ids)) {
          ids.forEach((elId: string) => {
            picks.push({ cat: 'env', sub: subId, el: elId });
            const el = findEl('env', subId, elId);
            if (el) descParts.push(el.name);
          });
        }
      });
    }

    // Lighting
    if (Array.isArray(sel.light)) {
      sel.light.forEach((elId: string) => {
        picks.push({ cat: 'light', el: elId });
        const el = findEl('light', undefined, elId);
        if (el) descParts.push(el.name);
      });
    } else if (sel.light && typeof sel.light === 'object') {
      Object.entries(sel.light).forEach(([subId, ids]) => {
        if (Array.isArray(ids)) {
          ids.forEach((elId: string) => {
            picks.push({ cat: 'light', sub: subId, el: elId });
            const el = findEl('light', subId, elId);
            if (el) descParts.push(el.name);
          });
        }
      });
    }

    const name = getNextPresetName('context');
    // Open existing PresetModal prefilled with active selected items and default sequential name
    setPresetModalData({
      isOpen: true,
      kind: 'context',
      preset: {
        name,
        kind: 'context',
        description: descParts.slice(0, 4).join(' • ') || 'Custom Context Preset',
        picks,
        icon: 'Layers'
      }
    });
  };

  if (!booted) {
    return (
      <div className="min-h-screen bg-[#07070a] text-[#f4efe8] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full rounded-2xl bg-[#121116] border border-white/[0.08] p-6 space-y-3 text-center">
          {bootError ? (
            <>
              <h1 className="text-base font-bold text-rose-300">Local server not reachable</h1>
              <p className="text-xs text-white/60 leading-relaxed break-words">{bootError}</p>
              <p className="text-xs text-white/50 leading-relaxed">
                Start it with <span className="font-mono text-emerald-300">cd server &amp;&amp; cargo run --release</span>,
                then retry. Your data and photos live in the server&apos;s <span className="font-mono">data/</span> folder.
              </p>
              <button
                onClick={() => {
                  setBootError(null);
                  setBootAttempt((n) => n + 1);
                }}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-black text-xs font-bold transition-colors"
              >
                Retry
              </button>
            </>
          ) : (
            <p className="text-xs text-white/60">Loading your workspace from the local server…</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans relative transition-colors duration-300 ${
        db.nsfwOn ? 'theme-nsfw' : 'theme-orange'
      } theme-${theme} ${
        theme === 'minimal-light'
          ? 'theme-light text-slate-900 bg-white'
          : theme === 'minimal-dark'
          ? 'theme-dark text-white bg-black'
          : 'theme-dark text-[#f4efe8] bg-[#07070a]'
      }`}
    >
      {/* Orange Glowing Moving Background with smooth color transition to Red in NSFW mode */}
      <GlowBackground nsfwOn={db.nsfwOn} theme={theme} />

      {!ready && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm text-sm text-white/80">
          Loading user database…
        </div>
      )}

      {/* Desktop Workstation Titlebar */}
      {(() => {
        const activeUserObj = users.find(u => u.id === activeUserId);
        const activeUserName = activeUserObj ? activeUserObj.name : 'Main User';
        return (
          <DesktopTitlebar
            onSearchOpen={() => setSearchOpen(true)}
            onRandomizeAll={handleRandomizeAll}
            onClearAll={handleClearAll}
            canUndo={undoStack.length > 0}
            canRedo={redoStack.length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
            nsfwOn={db.nsfwOn}
            onToggleNsfw={() => setDb((prev) => ({ ...prev, nsfwOn: !prev.nsfwOn }))}
            soundEnabled={db.soundEnabled}
            onToggleSound={() => setDb((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
            promptEngine={db.promptEngine}
            onChangeEngine={(engine) => setDb((prev) => ({ ...prev, promptEngine: engine }))}
            onOpenHistory={() => setHistoryOpen(true)}
            onOpenDevSettings={() => setIsDevPage(true)}
            onFullExport={() => setFullExportImportModal({ isOpen: true, tab: 'export' })}
            onFullImport={() => setFullExportImportModal({ isOpen: true, tab: 'import' })}
            onExportDB={handleExportDB}
            onImportDB={handleImportDB}
            onRestoreMainDB={() => setRestoreConfirmOpen(true)}
            saveStatus={saveStatus}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            isRolling={isRolling}
            activeUserName={activeUserName}
            onOpenSettings={() => setSettingsModalOpen(true)}
          />
        );
      })()}

      {/* Floating Settings Modal (Users, Sound, Theme Switcher, Full Archive) */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        users={users}
        activeUserId={activeUserId}
        onSwitchUser={switchUser}
        onRenameUser={handleRenameUser}
        onCreateUser={handleCreateUser}
        onDeleteUser={handleDeleteUser}
        soundEnabled={db.soundEnabled}
        onToggleSound={() => {
          setDb((prev) => {
            const nextSound = !prev.soundEnabled;
            playClickSound(nextSound, nextSound);
            return { ...prev, soundEnabled: nextSound };
          });
        }}
        theme={theme}
        onChangeTheme={(newTheme) => {
          setTheme(newTheme);
          localStorage.setItem('ultimate_prompter_theme', newTheme);
        }}
        onFullExport={() => setFullExportImportModal({ isOpen: true, tab: 'export' })}
        onFullImport={() => setFullExportImportModal({ isOpen: true, tab: 'import' })}
      />

      <div className={isDevPage ? 'flex-1 flex flex-col w-full' : 'hidden'}>
        <DevSettingsPage
          db={db}
          onUpdateDb={setDb}
          onBack={() => setIsDevPage(false)}
          nsfwOn={db.nsfwOn}
          users={users}
          activeUserId={activeUserId}
          onSwitchUser={switchUser}
          onCreateUser={handleCreateUser}
          onDeleteUser={handleDeleteUser}
          onExtractToUser={handleExtractToUser}
          initialActivePreset={devActivePreset}
          initialRefinePrompt={refinePromptInput}
          onRestoreMainDB={() => setRestoreConfirmOpen(true)}
          onFullExport={() => setFullExportImportModal({ isOpen: true, tab: 'export' })}
          onFullImport={() => setFullExportImportModal({ isOpen: true, tab: 'import' })}
        />
      </div>

      <div className={!isDevPage ? 'flex-1 flex flex-col lg:flex-row relative z-10 max-w-[1700px] w-full mx-auto' : 'hidden'}>
        {/* Left Decks & Cards Work Area */}
        <main className="flex-1 p-4 lg:p-6 min-w-0 flex flex-col">
          {/* Breadcrumbs & Navigation Header */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <button
                onClick={() => setView({ catId: null, subcatId: null })}
                className={`flex items-center gap-1.5 transition-colors ${
                  !view.catId ? 'text-white font-semibold' : 'hover:text-white'
                }`}
              >
                <Home className="w-3.5 h-3.5 text-white/50 stroke-[1.5]" />
                <span>Main Page</span>
              </button>

              {activeCat && (
                <>
                  <span className="text-white/20">/</span>
                  <div className="group/breadcrumb relative inline-flex items-center gap-1.5">
                    <button
                      onClick={() => setView({ catId: activeCat.id, subcatId: null })}
                      className={`font-semibold transition-colors ${
                        !view.subcatId ? 'text-white' : 'text-white/70 hover:text-white'
                      }`}
                    >
                      {activeCat.name}
                    </button>
                    {catSelCount(activeCat) > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearCategory(activeCat.id);
                        }}
                        title={`Clear All / Deselect elements in ${activeCat.name}`}
                        className="opacity-0 group-hover/breadcrumb:opacity-100 p-0.5 rounded text-white/40 hover:text-rose-400 transition-opacity cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </>
              )}

              {activeSubcat && activeCat?.type === 'tabs' && (
                <>
                  <span className="text-white/20">/</span>
                  <span className="text-white font-semibold">
                    {activeSubcat.name}
                  </span>
                </>
              )}
            </div>

            {view.catId && (
              <button
                onClick={() => setView({ catId: null, subcatId: null })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-white/70 hover:text-white border border-white/[0.06] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Categories</span>
              </button>
            )}
          </div>

          {/* Root View: View Switcher + Animated Category/Preset View */}
          {!view.catId ? (
            <div className="space-y-6">
              {/* View Switcher Button */}
              <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06] w-fit">
                <button
                  onClick={() => {
                    playClickSound(db.soundEnabled, false);
                    setRootViewMode('categories');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                    rootViewMode === 'categories'
                      ? db.nsfwOn ? 'bg-red-500/20 text-red-300 shadow-sm' : 'bg-orange-500/20 text-orange-300 shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Category View</span>
                </button>
                <button
                  onClick={() => {
                    playClickSound(db.soundEnabled, false);
                    setRootViewMode('presets');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                    rootViewMode === 'presets'
                      ? db.nsfwOn ? 'bg-red-500/20 text-red-300 shadow-sm' : 'bg-orange-500/20 text-orange-300 shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Preset View</span>
                </button>
                <button
                  onClick={() => {
                    playClickSound(db.soundEnabled, false);
                    setRootViewMode('selected');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                    rootViewMode === 'selected'
                      ? db.nsfwOn ? 'bg-red-500/20 text-red-300 shadow-sm' : 'bg-orange-500/20 text-orange-300 shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Selected Elements</span>
                  {selectedElementsList.length > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      rootViewMode === 'selected'
                        ? db.nsfwOn ? 'bg-red-500/30 text-white' : 'bg-orange-500/30 text-black'
                        : 'bg-white/10 text-white/70'
                    }`}>
                      {selectedElementsList.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Animated Switcher Container */}
              <div className="transition-all duration-300 ease-in-out">
                {rootViewMode === 'categories' ? (
                  <div className="animate-fadeIn space-y-6">
                    {/* Category Grid Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5">
                      {db.cats.map((cat, index) => (
                        <CategoryCard
                          key={cat.id}
                          cat={cat}
                          index={index}
                          selectedCount={catSelCount(cat)}
                          isLocked={!!db.locks[cat.id]}
                          onOpen={() => {
                            if (categoryReorder.justDragged.current) return;
                            playClickSound(db.soundEnabled, true);
                            setView({
                              catId: cat.id,
                              subcatId: cat.subcats?.[0]?.id || null
                            });
                          }}
                          onToggleLock={() => toggleLock(cat.id)}
                          onRandomize={() => randomizeCat(cat.id)}
                          onClear={() => handleClearCategory(cat.id)}
                          onEdit={() => {
                            setCropModalData({
                              isOpen: true,
                              title: `Edit Category: ${cat.name}`,
                              path: [cat.id],
                              isCategory: true,
                              catId: cat.id,
                              initialName: cat.name,
                              initialPromptName: cat.promptName || suggestPromptName(cat.name, cat.id),
                              initialImage: cat.image,
                              initialImgPos: cat.imgPos,
                              initialIcon: cat.icon
                            });
                          }}
                          nsfwOn={db.nsfwOn}
                          dragProps={categoryReorder.getItemProps(index)}
                          isDragging={categoryReorder.dragIndex === index}
                        />
                      ))}

                      {/* Add Category Card */}
                      <button
                        onClick={() => {
                          setCropModalData({
                            isOpen: true,
                            title: 'Create New Category',
                            path: [],
                            isCategory: true,
                            catId: undefined,
                            initialName: '',
                            initialPromptName: '',
                            initialImage: '',
                            initialIcon: 'Palette'
                          });
                        }}
                        className={`rounded-xl border border-dashed p-6 flex flex-col items-center justify-center gap-2 transition-all group min-h-[180px] duration-300 ${
                          db.nsfwOn
                            ? 'border-white/10 hover:border-red-500/50 bg-[#121116]/80 hover:bg-[#181215] text-white/40 hover:text-red-300'
                            : 'border-white/10 hover:border-orange-500/50 bg-[#121116]/80 hover:bg-[#181412] text-white/40 hover:text-orange-300'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center transition-colors ${
                          db.nsfwOn ? 'group-hover:bg-red-500/10 group-hover:text-red-400' : 'group-hover:bg-orange-500/10 group-hover:text-orange-400'
                        }`}>
                          <Plus className="w-4 h-4 stroke-[1.8]" />
                        </div>
                        <span className="text-xs font-semibold">New Category</span>
                      </button>
                    </div>
                  </div>
                ) : rootViewMode === 'presets' ? (
                  <div className="animate-fadeIn space-y-6">
                    {/* Preset Quick Chips / Cards */}
                    <PresetBar
                      presets={db.nsfwOn ? db.presets : db.presets.filter((p) => p.nsfw !== true)}
                      activePreset={db.activePreset}
                      onTogglePreset={handleTogglePreset}
                      onAddPreset={(kind) => {
                        if (kind === 'outfit') {
                          handleCreateOutfitPreset();
                        } else {
                          handleCreateContextPreset();
                        }
                      }}
                      onEditPreset={(preset) =>
                        setPresetModalData({ isOpen: true, preset, kind: preset.kind })
                      }
                      onReorderPresets={(newPresets) => {
                        setDb((prev) => ({ ...prev, presets: newPresets }));
                        recordHistory();
                      }}
                      nsfwOn={db.nsfwOn}
                    />
                  </div>
                ) : (
                  /* Selected Elements View: Live preview showing all currently selected elements with editing/modification disabled */
                  <div className="animate-fadeIn space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2.5">
                        <CheckSquare className={`w-4 h-4 ${db.nsfwOn ? 'text-red-400' : 'text-orange-400'}`} />
                        <h2 className="text-sm font-bold text-white">Selected Elements Live Preview</h2>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                          {selectedElementsList.length} active
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/40 border border-white/10">
                          Read-Only
                        </span>
                      </div>
                    </div>

                    {selectedElementsList.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center flex flex-col items-center justify-center gap-3 bg-[#121116]/60">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center text-white/30">
                          <CheckSquare className="w-6 h-6 stroke-[1.5]" />
                        </div>
                        <h3 className="text-sm font-semibold text-white">No Elements Currently Selected</h3>
                        <p className="text-xs text-white/40 max-w-md">
                          Select traits, styles, outfits, or locations from Category View or Preset View to see their live preview here.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5">
                        {selectedElementsList.map((item, idx) => (
                          <div key={`${item.element.id}_${idx}`} className="flex flex-col">
                            <div className="text-[10px] font-semibold text-white/40 mb-1.5 truncate flex items-center gap-1">
                              <span className="text-white/70">{item.categoryName}</span>
                              {(item.subcategoryName || item.rowName) && (
                                <>
                                  <span className="text-white/20">›</span>
                                  <span className="truncate">{item.rowName || item.subcategoryName}</span>
                                </>
                              )}
                            </div>
                            <ElementCard
                              element={item.element}
                              isSelected={true}
                              onToggle={() => {}}
                              onEdit={() => {}}
                              nsfwOn={db.nsfwOn}
                              categoryIcon={item.categoryIcon}
                              weight={item.weight}
                              readOnly={true}
                              showLinkedBadge={Boolean(item.element.linkedContextId || item.element.linkedPoseId || item.element.linkedEnvId)}
                              linkedTooltip={getLinkedTooltip(item.element)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Inside a Category View */
            <div className="flex-1 flex flex-col">
              {/* Category Header Bar with Title, Selection Count, and Hover Clear All Action */}
              <div className="group/cathead flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    {activeCat?.name}
                  </h2>
                  {activeCat && catSelCount(activeCat) > 0 && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        db.nsfwOn
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                      }`}
                    >
                      {catSelCount(activeCat)} selected
                    </span>
                  )}

                  {/* Clear All / Deselect icon that appears on mouse hover over category header */}
                  {activeCat && catSelCount(activeCat) > 0 && (
                    <button
                      onClick={() => handleClearCategory(activeCat.id)}
                      title={`Clear All / Deselect elements in ${activeCat.name}`}
                      className="opacity-0 group-hover/cathead:opacity-100 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 hover:text-rose-100 border border-rose-500/25 text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95"
                    >
                      <RotateCcw className="w-3 h-3 stroke-[2]" />
                      <span>Deselect Category</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Auto-Select Ensemble Toggle Switch (Category View) */}
                  {activeCat?.id === 'outfit' && (
                    <div
                      className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border transition-all duration-300 ${
                        db.autoSelectEnsemble !== false
                          ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.18)]'
                          : 'bg-black/40 border-white/[0.08]'
                      }`}
                      title="Auto-select complementary top & bottom pieces when picking wardrobe items"
                    >
                      <Shirt
                        className={`w-3.5 h-3.5 transition-colors duration-300 ${
                          db.autoSelectEnsemble !== false
                            ? 'text-emerald-400'
                            : 'text-white/40'
                        }`}
                      />
                      <span
                        className={`text-xs font-semibold tracking-wide transition-colors duration-300 ${
                          db.autoSelectEnsemble !== false
                            ? 'text-emerald-300'
                            : 'text-white/50'
                        }`}
                      >
                        Auto-Select Ensemble
                      </span>
                      <button
                        type="button"
                        onClick={handleToggleAutoSelectEnsemble}
                        role="switch"
                        aria-checked={db.autoSelectEnsemble !== false}
                        className={`w-9 h-5 rounded-full transition-all duration-300 relative cursor-pointer ${
                          db.autoSelectEnsemble !== false
                            ? 'bg-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-transform duration-300 shadow-sm ${
                            db.autoSelectEnsemble !== false ? 'translate-x-[18px]' : 'translate-x-[3px]'
                          }`}
                        />
                      </button>
                    </div>
                  )}

                  {/* Auto-Select Context Toggle Switch (Context, Pose, and Environment Categories) */}
                  {isContextTargetCategory(activeCat) && (
                    <div
                      className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border transition-all duration-300 ${
                        db.autoSelectContext !== false
                          ? 'bg-sky-950/30 border-sky-500/50 shadow-[0_0_12px_rgba(56,189,248,0.18)]'
                          : 'bg-black/40 border-white/[0.08]'
                      }`}
                      title="Auto-select linked items across Context, Pose, and Environment when choosing an item"
                    >
                      <div className="flex items-center gap-1">
                        <span title="Context Category">
                          <Camera
                            className={`w-3.5 h-3.5 transition-colors duration-300 ${
                              db.autoSelectContext !== false ? 'text-amber-400' : 'text-white/30'
                            }`}
                          />
                        </span>
                        <span title="Pose Category">
                          <Activity
                            className={`w-3.5 h-3.5 transition-colors duration-300 ${
                              db.autoSelectContext !== false ? 'text-sky-400' : 'text-white/30'
                            }`}
                          />
                        </span>
                        <span title="Environment Category">
                          <MapPin
                            className={`w-3.5 h-3.5 transition-colors duration-300 ${
                              db.autoSelectContext !== false ? 'text-purple-400' : 'text-white/30'
                            }`}
                          />
                        </span>
                      </div>
                      <span
                        className={`text-xs font-semibold tracking-wide transition-colors duration-300 ${
                          db.autoSelectContext !== false
                            ? 'text-sky-300'
                            : 'text-white/50'
                        }`}
                      >
                        Auto-Select Context
                      </span>
                      <button
                        type="button"
                        onClick={handleToggleAutoSelectContext}
                        role="switch"
                        aria-checked={db.autoSelectContext !== false}
                        className={`w-9 h-5 rounded-full transition-all duration-300 relative cursor-pointer ${
                          db.autoSelectContext !== false
                            ? 'bg-sky-600 shadow-[0_0_12px_rgba(56,189,248,0.6)]'
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-transform duration-300 shadow-sm ${
                            db.autoSelectContext !== false ? 'translate-x-[18px]' : 'translate-x-[3px]'
                          }`}
                        />
                      </button>
                    </div>
                  )}


                  {activeCat && catSelCount(activeCat) > 0 && (
                    <button
                      onClick={() => handleClearCategory(activeCat.id)}
                      title={`Clear All / Deselect elements in ${activeCat.name}`}
                      className="flex items-center gap-1 text-[11px] text-white/40 hover:text-rose-400 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span className="hidden sm:inline">Deselect All</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Category Subtabs (if category has tabs) */}
              {activeCat?.type === 'tabs' && activeCat.subcats && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-none border-b border-white/[0.06]">
                  {activeCat.subcats.map((sc, scIdx) => {
                    const isActive = (view.subcatId || activeCat.subcats?.[0]?.id) === sc.id;
                    const isDraggingThis = subcatReorder.dragIndex === scIdx;
                    return (
                      <div
                        key={sc.id}
                        {...subcatReorder.getItemProps(scIdx)}
                        onClick={() => {
                          if (subcatReorder.justDragged.current) return;
                          playClickSound(db.soundEnabled, true);
                          setView((prev) => ({ ...prev, subcatId: sc.id }));
                        }}
                        className={`group/subtab relative inline-flex items-center shrink-0 rounded-lg select-none px-3 py-1.5 text-xs font-semibold gap-1.5 transition-all duration-200 cursor-pointer ${
                          isDraggingThis
                            ? db.nsfwOn
                              ? 'scale-105 z-30 shadow-[0_0_20px_rgba(255,34,56,0.5)] ring-2 ring-red-500 bg-red-600 text-white cursor-grabbing opacity-95'
                              : 'scale-105 z-30 shadow-[0_0_20px_rgba(255,102,0,0.5)] ring-2 ring-orange-500 bg-orange-500 text-black cursor-grabbing opacity-95'
                            : isActive
                            ? db.nsfwOn
                              ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(255,34,56,0.35)]'
                              : 'bg-orange-500 text-black shadow-[0_0_12px_rgba(255,102,0,0.35)]'
                            : 'bg-[#151419]/90 hover:bg-[#1a1920] text-white/60 hover:text-white border border-white/[0.04]'
                        }`}
                      >
                        {/* Drag Handle */}
                        <span
                          {...subcatReorder.getHandleProps(scIdx)}
                          title="Hold & drag to reorder subcategory"
                          className={`p-0.5 -ml-1 rounded transition-opacity cursor-grab active:cursor-grabbing ${
                            isActive
                              ? db.nsfwOn ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'
                              : 'text-white/30 hover:text-white/70'
                          }`}
                        >
                          <GripVertical className="w-3 h-3 stroke-[2]" />
                        </span>

                        {/* Subcategory Name / Header */}
                        <span className="pointer-events-none tracking-wide select-none">
                          {sc.name}
                        </span>

                        {/* Edit Icon Button */}
                        <button
                          type="button"
                          data-no-drag="true"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSubcatModalData({
                              isOpen: true,
                              mode: 'edit',
                              subcat: sc
                            });
                          }}
                          title={`Edit ${sc.name} subcategory`}
                          className={`p-0.5 rounded transition-all cursor-pointer ${
                            isActive
                              ? db.nsfwOn
                                ? 'hover:bg-black/20 text-white/80 hover:text-white'
                                : 'hover:bg-black/20 text-black/80 hover:text-black'
                              : 'opacity-0 group-hover/subtab:opacity-100 hover:bg-white/10 text-white/40 hover:text-white'
                          }`}
                        >
                          <Edit3 className="w-3 h-3 stroke-[2]" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Add Subcategory Button */}
                  <button
                    onClick={() => {
                      setSubcatModalData({
                        isOpen: true,
                        mode: 'create',
                        subcat: null
                      });
                    }}
                    title="Add new subcategory"
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed text-xs font-semibold shrink-0 transition-colors ${
                      db.nsfwOn
                        ? 'border-red-500/30 hover:border-red-500/60 text-red-300/70 hover:text-red-200 bg-red-500/5 hover:bg-red-500/10'
                        : 'border-orange-500/30 hover:border-orange-500/60 text-orange-300/70 hover:text-orange-200 bg-orange-500/5 hover:bg-orange-500/10'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2]" />
                    <span className="hidden sm:inline">Add Subcategory</span>
                  </button>
                </div>
              )}

              {/* Subcategory View: Rows (Persona Builder) or Flat Grid */}
              {activeSubcat?.type === 'rows' && activeSubcat.rows ? (
                <PersonaBuilder
                  rows={activeSubcat.rows}
                  basePath={[activeCat!.id, activeSubcat.id]}
                  selections={db.selections}
                  onToggleElement={toggleSel}
                  onClearRow={handleClearRow}
                  nsfwOn={db.nsfwOn}
                  onAddElement={(path) => {
                    const availableSubcats = activeCat?.subcats
                      ? activeCat.subcats.map((s) => ({ id: s.id, name: s.name }))
                      : undefined;
                    setCropModalData({
                      isOpen: true,
                      title: 'Add Trait Option',
                      path,
                      initialName: '',
                      initialPrompt: '',
                      availableSubcategories: availableSubcats,
                      initialSubcatId: path[1],
                      initialThemeIds: selectedThemeId !== 'all' ? [selectedThemeId] : []
                    });
                  }}
                  onEditElement={(path, elId) => {
                    const row = activeSubcat.rows?.find((r) => r.id === path[path.length - 1]);
                    const el = row?.els.find((e) => e.id === elId);
                    if (el) {
                      const availableSubcats = activeCat?.subcats
                        ? activeCat.subcats.map((s) => ({ id: s.id, name: s.name }))
                        : undefined;
                      setCropModalData({
                        isOpen: true,
                        title: `Edit Trait: ${el.name}`,
                        path,
                        elId,
                        initialName: el.name,
                        initialPrompt: el.prompt,
                        initialNsfw: el.nsfw,
                        initialImage: el.image,
                        initialImgPos: el.imgPos,
                        initialEnsembleId: el.ensembleId,
                        initialPairedElementId: el.pairedElementId,
                        availableSubcategories: availableSubcats,
                        initialSubcatId: path[1],
                        initialThemeIds: el.themeIds || (el.tags ? activeCat?.themes?.filter(t => el.tags?.includes(t.name) || el.tags?.includes(t.id)).map(t => t.id) : []),
                        initialLinkedContextId: el.linkedContextId,
                        initialLinkedPoseId: el.linkedPoseId,
                        initialLinkedEnvId: el.linkedEnvId
                      });
                    }
                  }}
                />
              ) : (
                <div className="flex flex-col">
                  {/* Category Themes Filter & Management Bar */}
                  {activeCat?.themes ? (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-3.5 scrollbar-none">
                      {/* Built-in, non-deletable "All" chip */}
                      <button
                        type="button"
                        onClick={() => setSelectedThemeId('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                          selectedThemeId === 'all'
                            ? db.nsfwOn
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                              : 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm'
                            : 'bg-white/[0.04] text-white/50 hover:text-white border border-white/[0.06]'
                        }`}
                      >
                        All ({visibleElements.length})
                      </button>

                      {/* Manageable Theme Chips with drag-and-drop reordering */}
                      {activeCat.themes.map((theme, thIdx) => {
                        const isThemeSelected = selectedThemeId === theme.id;
                        const isDraggingThis = themeReorder.dragIndex === thIdx;
                        const count = visibleElements.filter((el) => {
                          if (el.themeIds && el.themeIds.length > 0) {
                            return el.themeIds.includes(theme.id) || el.themeIds.includes(theme.name);
                          }
                          return Boolean(el.tags && (el.tags.includes(theme.name) || el.tags.includes(theme.id)));
                        }).length;

                        return (
                          <div
                            key={theme.id}
                            {...themeReorder.getItemProps(thIdx)}
                            onClick={() => {
                              if (themeReorder.justDragged.current) return;
                              playClickSound(db.soundEnabled, true);
                              setSelectedThemeId(theme.id);
                            }}
                            className={`group/themechip relative inline-flex items-center shrink-0 rounded-xl select-none px-2.5 py-1 text-xs font-semibold gap-1.5 transition-all duration-200 cursor-pointer border ${
                              isDraggingThis
                                ? db.nsfwOn
                                  ? 'scale-105 z-30 shadow-[0_0_20px_rgba(255,34,56,0.5)] ring-2 ring-red-500 bg-red-600 text-white cursor-grabbing opacity-95'
                                  : 'scale-105 z-30 shadow-[0_0_20px_rgba(255,102,0,0.5)] ring-2 ring-orange-500 bg-orange-500 text-black cursor-grabbing opacity-95'
                                : isThemeSelected
                                ? db.nsfwOn
                                  ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-sm'
                                  : 'bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-sm'
                                : 'bg-white/[0.04] text-white/60 hover:text-white border-white/[0.06] hover:bg-white/[0.08]'
                            }`}
                          >
                            {/* Drag Handle */}
                            <span
                              {...themeReorder.getHandleProps(thIdx)}
                              title="Hold & drag to reorder theme"
                              className={`p-0.5 -ml-1 rounded transition-opacity cursor-grab active:cursor-grabbing ${
                                isThemeSelected
                                  ? db.nsfwOn ? 'text-red-300/80 hover:text-red-100' : 'text-orange-300/80 hover:text-orange-100'
                                  : 'text-white/30 hover:text-white/70'
                              }`}
                            >
                              <GripVertical className="w-3 h-3 stroke-[2]" />
                            </span>

                            {/* Theme Name & Count */}
                            <span className="pointer-events-none tracking-wide select-none">
                              {theme.name} ({count})
                            </span>

                            {/* Edit Button */}
                            <button
                              type="button"
                              data-no-drag="true"
                              onClick={(e) => {
                                e.stopPropagation();
                                setThemeModalData({
                                  isOpen: true,
                                  mode: 'edit',
                                  theme
                                });
                              }}
                              title={`Edit ${theme.name} theme`}
                              className={`p-0.5 rounded transition-all cursor-pointer ${
                                isThemeSelected
                                  ? db.nsfwOn
                                    ? 'hover:bg-red-500/20 text-red-300/90 hover:text-white'
                                    : 'hover:bg-orange-500/20 text-orange-300/90 hover:text-white'
                                  : 'opacity-0 group-hover/themechip:opacity-100 hover:bg-white/10 text-white/40 hover:text-white'
                              }`}
                            >
                              <Edit3 className="w-3 h-3 stroke-[2]" />
                            </button>
                          </div>
                        );
                      })}

                      {/* Add Theme Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setThemeModalData({
                            isOpen: true,
                            mode: 'create',
                            theme: null
                          });
                        }}
                        title="Add new theme"
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-dashed text-xs font-semibold shrink-0 transition-colors ${
                          db.nsfwOn
                            ? 'border-red-500/30 hover:border-red-500/60 text-red-300/70 hover:text-red-200 bg-red-500/5 hover:bg-red-500/10'
                            : 'border-orange-500/30 hover:border-orange-500/60 text-orange-300/70 hover:text-orange-200 bg-orange-500/5 hover:bg-orange-500/10'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2]" />
                        <span className="hidden sm:inline">Add Theme</span>
                      </button>
                    </div>
                  ) : availableTags.length > 1 ? (
                    /* Fallback Category Tag Filter Bar */
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-3.5 scrollbar-none">
                      <button
                        type="button"
                        onClick={() => setSelectedTagFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                          selectedTagFilter === 'all'
                            ? db.nsfwOn
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                              : 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm'
                            : 'bg-white/[0.04] text-white/50 hover:text-white border border-white/[0.06]'
                        }`}
                      >
                        All ({visibleElements.length})
                      </button>
                      {availableTags.map((tag) => {
                        const count = visibleElements.filter((el) => el.tags && el.tags.includes(tag)).length;
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setSelectedTagFilter(tag)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                              selectedTagFilter === tag
                                ? db.nsfwOn
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                                  : 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm'
                                : 'bg-white/[0.04] text-white/50 hover:text-white border border-white/[0.06]'
                            }`}
                          >
                            {tag} ({count})
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  {/* Flat Grid of Element Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5">
                    {(() => {
                      const path = activeCat?.type === 'flat'
                        ? [activeCat.id]
                        : [activeCat!.id, activeSubcat!.id];

                      const selArr = getSelArr(db.selections, path);

                      return (
                        <>
                          {displayedElements.map((el, visIdx) => {
                            const isSelected = selArr.includes(el.id);
                            return (
                              <ElementCard
                                key={el.id}
                                element={el}
                                isSelected={isSelected}
                                onToggle={() => {
                                  if (elementReorder.justDragged.current) return;
                                  toggleSel(path, el.id);
                                }}
                                onEdit={() => {
                                  const availableSubcats = activeCat?.subcats
                                    ? activeCat.subcats.map((s) => ({ id: s.id, name: s.name }))
                                    : undefined;
                                  setCropModalData({
                                    isOpen: true,
                                    title: `Edit Element: ${el.name}`,
                                    path,
                                    elId: el.id,
                                    initialName: el.name,
                                    initialPrompt: el.prompt,
                                    initialNsfw: el.nsfw,
                                    initialImage: el.image,
                                    initialImgPos: el.imgPos,
                                    initialEnsembleId: el.ensembleId,
                                    initialPairedElementId: el.pairedElementId,
                                    availableSubcategories: availableSubcats,
                                    initialSubcatId: path[1],
                                    initialThemeIds: el.themeIds || (el.tags ? activeCat?.themes?.filter(t => el.tags?.includes(t.name) || el.tags?.includes(t.id)).map(t => t.id) : []),
                                    initialLinkedContextId: el.linkedContextId,
                                    initialLinkedPoseId: el.linkedPoseId,
                                    initialLinkedEnvId: el.linkedEnvId
                                  });
                                }}
                                nsfwOn={db.nsfwOn}
                                categoryIcon={activeCat?.icon}
                                dragProps={elementReorder.getItemProps(visIdx)}
                                handleProps={elementReorder.getHandleProps(visIdx)}
                                isDragging={elementReorder.dragIndex === visIdx}
                                showLinkedBadge={isContextTargetCategory(activeCat)}
                                linkedTooltip={getLinkedTooltip(el)}
                              />
                            );
                          })}

                        {/* Add Element Card Button */}
                        <button
                          onClick={() => {
                            const availableSubcats = activeCat?.subcats
                              ? activeCat.subcats.map((s) => ({ id: s.id, name: s.name }))
                              : undefined;
                            setCropModalData({
                              isOpen: true,
                              title: `Add to ${activeSubcat ? activeSubcat.name : activeCat?.name}`,
                              path,
                              initialName: '',
                              initialPrompt: '',
                              availableSubcategories: availableSubcats,
                              initialSubcatId: path[1],
                              initialThemeIds: selectedThemeId !== 'all' ? [selectedThemeId] : []
                            });
                          }}
                          className={`rounded-xl border border-dashed p-5 flex flex-col items-center justify-center gap-2 transition-all group aspect-square duration-300 ${
                            db.nsfwOn
                              ? 'border-white/10 hover:border-red-500/50 bg-[#121116]/80 hover:bg-[#181215] text-white/40 hover:text-red-300'
                              : 'border-white/10 hover:border-orange-500/50 bg-[#121116]/80 hover:bg-[#181412] text-white/40 hover:text-orange-300'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center transition-colors ${
                            db.nsfwOn ? 'group-hover:bg-red-500/10 group-hover:text-red-400' : 'group-hover:bg-orange-500/10 group-hover:text-orange-400'
                          }`}>
                            <Plus className="w-4 h-4 stroke-[1.8]" />
                          </div>
                          <span className="text-xs font-semibold">Add Element</span>
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            </div>
          )}
        </main>

        {/* Right Prompt Inspector Panel */}
        <PromptInspector
          promptText={compiled.formatted}
          tokenCount={compiled.tokenCount}
          wordCount={compiled.wordCount}
          promptMode={db.promptMode}
          onSetPromptMode={(mode) => setDb((prev) => ({ ...prev, promptMode: mode }))}
          promptEngine={db.promptEngine}
          stylize={db.stylize}
          onSetStylize={(s) => setDb((prev) => ({ ...prev, stylize: s }))}
          onCopyPrompt={handleCopyPrompt}
          onClearSelections={handleClearAll}
          onSaveToHistory={handleCopyPrompt}
          isCopied={isCopied}
          selectedItemsCount={selectedItemsCount}
          blocks={compiled.blocks}
          nsfwOn={db.nsfwOn}
          onRefinePrompt={(txt) => {
            setRefinePromptInput(txt);
            setDevActivePreset('refiner');
            setIsDevPage(true);
          }}
          canCreateContextPreset={canCreateContextPreset}
          canCreateOutfitPreset={canCreateOutfitPreset}
          onCreateContextPreset={handleCreateContextPreset}
          onCreateOutfitPreset={handleCreateOutfitPreset}
          presetNotice={presetNotice}
          theme={theme}
        />
      </div>

      {/* Modals & Drawers */}
      <CommandPalette
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        categories={db.cats}
        selections={db.selections}
        onToggleElement={toggleSel}
        onRandomizeAll={handleRandomizeAll}
        onCopyPrompt={handleCopyPrompt}
        onClearAll={handleClearAll}
        onToggleNsfw={() => setDb((prev) => ({ ...prev, nsfwOn: !prev.nsfwOn }))}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        nsfwOn={db.nsfwOn}
      />

      <HistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={db.history || []}
        onRestore={(item) => {
          setDb((prev) => ({
            ...prev,
            promptEngine: item.engine
          }));
          navigator.clipboard.writeText(item.prompt);
          setHistoryOpen(false);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 1200);
        }}
        onClearHistory={() => setDb((prev) => ({ ...prev, history: [] }))}
      />

      <PresetModal
        isOpen={presetModalData.isOpen}
        onClose={() => setPresetModalData((prev) => ({ ...prev, isOpen: false }))}
        preset={presetModalData.preset}
        kind={presetModalData.kind}
        categories={db.cats}
        nsfwOn={db.nsfwOn}
        onSave={async (savedDataRaw) => {
          const savedData = { ...savedDataRaw, image: await ensureImageFor(activeUserId, savedDataRaw.image) };
          recordHistory();
          let createdId: string | null = null;
          setDb((prev) => {
            const presetsCopy = [...(prev.presets || [])];
            if (savedData.id) {
              const idx = presetsCopy.findIndex((p) => p.id === savedData.id);
              if (idx > -1) {
                presetsCopy[idx] = {
                  ...presetsCopy[idx],
                  name: savedData.name,
                  description: savedData.description,
                  kind: savedData.kind,
                  picks: savedData.picks,
                  image: savedData.image,
                  imgPos: savedData.imgPos,
                  icon: savedData.icon,
                  nsfw: savedData.nsfw
                };
                return { ...prev, presets: presetsCopy };
              }
            }
            const newId = 'p' + Date.now();
            createdId = newId;
            presetsCopy.unshift({
              id: newId,
              name: savedData.name,
              description: savedData.description,
              kind: savedData.kind,
              picks: savedData.picks,
              image: savedData.image,
              imgPos: savedData.imgPos,
              icon: savedData.icon || (savedData.kind === 'outfit' ? 'Shirt' : 'Sparkles'),
              nsfw: savedData.nsfw
            });
            return { ...prev, presets: presetsCopy, activePreset: newId };
          });
          playClickSound(db.soundEnabled, true);
          setPresetNotice(`${savedData.id ? 'Updated' : 'Created'} ${savedData.name}`);
          setTimeout(() => setPresetNotice(null), 2500);
        }}
        onDelete={(id) => {
          setDb((prev) => ({
            ...prev,
            presets: (prev.presets || []).filter((p) => p.id !== id),
            activePreset: prev.activePreset === id ? null : prev.activePreset
          }));
        }}
      />

      {/* Photo Crop & Element / Category Modal */}
      <CropModal
        isOpen={cropModalData.isOpen}
        onClose={() => setCropModalData((prev) => ({ ...prev, isOpen: false }))}
        title={cropModalData.title}
        showPromptField={!cropModalData.isCategory}
        isCategory={cropModalData.isCategory}
        catId={cropModalData.catId}
        initialName={cropModalData.initialName}
        initialPromptName={cropModalData.initialPromptName}
        initialPrompt={cropModalData.initialPrompt}
        initialNsfw={cropModalData.initialNsfw}
        initialImage={cropModalData.initialImage}
        initialImgPos={cropModalData.initialImgPos}
        initialIcon={cropModalData.initialIcon}
        initialEnsembleId={cropModalData.initialEnsembleId}
        initialPairedElementId={cropModalData.initialPairedElementId}
        availableEnsemblePairs={availableEnsemblePairs}
        availableSubcategories={cropModalData.availableSubcategories}
        initialSubcatId={cropModalData.initialSubcatId}
        categoryThemes={activeCat?.themes}
        initialThemeIds={cropModalData.initialThemeIds}
        availableContextItems={availableContextItems}
        availablePoseItems={availablePoseItems}
        availableEnvItems={availableEnvItems}
        initialLinkedContextId={cropModalData.initialLinkedContextId}
        initialLinkedPoseId={cropModalData.initialLinkedPoseId}
        initialLinkedEnvId={cropModalData.initialLinkedEnvId}
        users={users}
        activeUserId={activeUserId}
        path={cropModalData.path}
        onTransferToUser={handleTransferElementToUser}
        onSave={async (savedRaw) => {
          // photo -> real file in this user's data folder (throws -> the modal stays open and shows the error)
          const saved = { ...savedRaw, image: await ensureImageFor(activeUserId, savedRaw.image) };
          setDb((prev) => {
            const catsCopy = JSON.parse(JSON.stringify(prev.cats));

            if (cropModalData.isCategory) {
              if (cropModalData.catId) {
                const cat = catsCopy.find((c: any) => c.id === cropModalData.catId);
                if (cat) {
                  cat.name = saved.name;
                  cat.promptName = saved.promptName || suggestPromptName(saved.name, cat.id);
                  cat.image = saved.image;
                  cat.imgPos = saved.imgPos;
                  cat.icon = saved.icon;
                }
              } else {
                const newCatId = 'c' + Date.now();
                catsCopy.push({
                  id: newCatId,
                  name: saved.name,
                  promptName: saved.promptName || suggestPromptName(saved.name, newCatId),
                  type: 'flat',
                  image: saved.image,
                  imgPos: saved.imgPos,
                  icon: saved.icon,
                  els: []
                });
              }
              return { ...prev, cats: catsCopy };
            } else {
              // Element save
              const path = cropModalData.path;
              const cat = catsCopy.find((c: any) => c.id === path[0]);
              const targetSubcatId = saved.subcategoryId;
              const isMovingSubcat = targetSubcatId && path.length >= 2 && targetSubcatId !== path[1];
              let effectiveElId = cropModalData.elId;

              if (isMovingSubcat && cat && cat.subcats) {
                const sourceSub = cat.subcats.find((s: any) => s.id === path[1]);
                const destSub = cat.subcats.find((s: any) => s.id === targetSubcatId);
                if (sourceSub && destSub) {
                  destSub.els = destSub.els || [];
                  sourceSub.els = sourceSub.els || [];

                  const assignedThemeNames = (cat.themes || [])
                    .filter((t: any) => (saved.themeIds || []).includes(t.id))
                    .map((t: any) => t.name);

                  if (cropModalData.elId) {
                    const existingIdx = sourceSub.els.findIndex((e: any) => e.id === cropModalData.elId);
                    const existingEl = existingIdx !== -1 ? sourceSub.els.splice(existingIdx, 1)[0] : null;

                    const targetSubName = destSub.name;
                    let updatedTags = existingEl?.tags || [];
                    if (targetSubName) {
                      updatedTags = [targetSubName, ...updatedTags.filter((t: string) => t !== targetSubName)];
                    }
                    if (cat.themes && saved.themeIds) {
                      const nonThemeTags = updatedTags.filter(
                        (tg: string) => !cat.themes.some((t: any) => t.name.toLowerCase() === tg.toLowerCase())
                      );
                      updatedTags = [...nonThemeTags, ...assignedThemeNames];
                    }

                    const updatedEl = {
                      ...(existingEl || {}),
                      id: cropModalData.elId,
                      name: saved.name,
                      prompt: saved.prompt || '',
                      nsfw: !!saved.nsfw,
                      image: saved.image,
                      imgPos: saved.imgPos,
                      icon: saved.icon,
                      ensembleId: saved.ensembleId,
                      pairedElementId: saved.pairedElementId,
                      subcategoryId: targetSubcatId,
                      themeIds: saved.themeIds !== undefined ? saved.themeIds : existingEl?.themeIds,
                      linkedContextId: saved.linkedContextId,
                      linkedPoseId: saved.linkedPoseId,
                      linkedEnvId: saved.linkedEnvId,
                      tags: updatedTags
                    };
                    destSub.els.push(updatedEl);

                    // Update selections if this element was selected in old subcategory
                    let nextSelections = prev.selections;
                    const catSelections = prev.selections?.[path[0]];
                    if (catSelections && Array.isArray(catSelections[path[1]])) {
                      if (catSelections[path[1]].includes(cropModalData.elId)) {
                        nextSelections = JSON.parse(JSON.stringify(prev.selections));
                        nextSelections[path[0]][path[1]] = nextSelections[path[0]][path[1]].filter((id: string) => id !== cropModalData.elId);
                        nextSelections[path[0]][targetSubcatId] = nextSelections[path[0]][targetSubcatId] || [];
                        if (!nextSelections[path[0]][targetSubcatId].includes(cropModalData.elId)) {
                          nextSelections[path[0]][targetSubcatId].push(cropModalData.elId);
                        }
                      }
                    }
                  } else {
                    effectiveElId = 'e' + Date.now();
                    const initialTags = destSub.name ? [destSub.name] : [];
                    if (cat.themes && saved.themeIds) {
                      initialTags.push(...assignedThemeNames);
                    }
                    destSub.els.push({
                      id: effectiveElId,
                      name: saved.name,
                      prompt: saved.prompt || '',
                      nsfw: !!saved.nsfw,
                      image: saved.image,
                      imgPos: saved.imgPos,
                      icon: saved.icon,
                      ensembleId: saved.ensembleId,
                      pairedElementId: saved.pairedElementId,
                      subcategoryId: targetSubcatId,
                      themeIds: saved.themeIds || [],
                      linkedContextId: saved.linkedContextId,
                      linkedPoseId: saved.linkedPoseId,
                      linkedEnvId: saved.linkedEnvId,
                      tags: initialTags
                    });
                  }
                }
              } else {
                let targetEls: any[] = [];
                if (cat) {
                  if (path.length === 1) {
                    targetEls = cat.els = cat.els || [];
                  } else if (path.length === 2) {
                    const sc = cat.subcats?.find((s: any) => s.id === path[1]);
                    if (sc) targetEls = sc.els = sc.els || [];
                  } else if (path.length === 3) {
                    const sc = cat.subcats?.find((s: any) => s.id === path[1]);
                    const row = sc?.rows?.find((r: any) => r.id === path[2]);
                    if (row) targetEls = row.els = row.els || [];
                  }
                }

                if (cropModalData.elId) {
                  const el = targetEls.find((e: any) => e.id === cropModalData.elId);
                  if (el) {
                    el.name = saved.name;
                    el.prompt = saved.prompt || '';
                    el.nsfw = !!saved.nsfw;
                    el.image = saved.image;
                    el.imgPos = saved.imgPos;
                    el.icon = saved.icon;
                    el.ensembleId = saved.ensembleId;
                    el.pairedElementId = saved.pairedElementId;
                    el.themeIds = saved.themeIds !== undefined ? saved.themeIds : el.themeIds;
                    el.linkedContextId = saved.linkedContextId;
                    el.linkedPoseId = saved.linkedPoseId;
                    el.linkedEnvId = saved.linkedEnvId;
                    if (saved.subcategoryId) {
                      el.subcategoryId = saved.subcategoryId;
                      const curSub = cat?.subcats?.find((s: any) => s.id === saved.subcategoryId);
                      if (curSub?.name) {
                        el.tags = [curSub.name, ...((el.tags || []).filter((t: string) => t !== curSub.name))];
                      }
                    }
                    if (cat?.themes && saved.themeIds) {
                      const assignedThemeNames = cat.themes.filter((t: any) => saved.themeIds?.includes(t.id)).map((t: any) => t.name);
                      const nonThemeTags = (el.tags || []).filter((tg: string) => !cat.themes.some((t: any) => t.name.toLowerCase() === tg.toLowerCase()));
                      el.tags = [...nonThemeTags, ...assignedThemeNames];
                    }
                  }

                  // If editing in outfit category (between top and bottom), maintain bidirectional pairing
                  if (cropModalData.path && cropModalData.path[0] === 'outfit') {
                    const currentSubId = cropModalData.path[1];
                    const targetSubId = currentSubId === 'top' ? 'bottom' : currentSubId === 'bottom' ? 'top' : null;
                    if (targetSubId) {
                      const outfitCat = catsCopy.find((c: any) => c.id === 'outfit');
                      const targetSub = outfitCat?.subcats?.find((s: any) => s.id === targetSubId);
                      if (targetSub?.els) {
                        targetSub.els.forEach((other: any) => {
                          if (other.pairedElementId === cropModalData.elId && other.id !== saved.pairedElementId) {
                            other.pairedElementId = undefined;
                            other.ensembleId = undefined;
                          }
                        });
                        if (saved.pairedElementId) {
                          const counterpart = targetSub.els.find((e: any) => e.id === saved.pairedElementId);
                          if (counterpart) {
                            counterpart.pairedElementId = cropModalData.elId;
                            counterpart.ensembleId = saved.ensembleId;
                          }
                        }
                      }
                    }
                  }
                } else {
                  effectiveElId = 'e' + Date.now();
                  const curSub = cat?.subcats?.find((s: any) => s.id === (saved.subcategoryId || path[1]));
                  const initialTags = curSub?.name ? [curSub.name] : [];
                  if (cat?.themes && saved.themeIds) {
                    const assignedThemeNames = cat.themes.filter((t: any) => saved.themeIds?.includes(t.id)).map((t: any) => t.name);
                    initialTags.push(...assignedThemeNames);
                  }
                  targetEls.push({
                    id: effectiveElId,
                    name: saved.name,
                    prompt: saved.prompt || '',
                    nsfw: !!saved.nsfw,
                    image: saved.image,
                    imgPos: saved.imgPos,
                    icon: saved.icon,
                    ensembleId: saved.ensembleId,
                    pairedElementId: saved.pairedElementId,
                    subcategoryId: saved.subcategoryId || (path.length >= 2 ? path[1] : undefined),
                    themeIds: saved.themeIds || [],
                    linkedContextId: saved.linkedContextId,
                    linkedPoseId: saved.linkedPoseId,
                    linkedEnvId: saved.linkedEnvId,
                    tags: initialTags
                  });
                }
              }

              // Auto-Select Context: maintain reciprocal links between Context, Pose, and Environment
              const activeCatId = path[0];
              const isContext = activeCatId === 'comp' || activeCatId === 'context';
              const isPose = activeCatId === 'pose';
              const isEnv = activeCatId === 'env';

              if (effectiveElId && (isContext || isPose || isEnv)) {
                const targetEnvCat = catsCopy.find((c: any) => c.id === 'env');
                const targetPoseCat = catsCopy.find((c: any) => c.id === 'pose');
                const targetContextCat = catsCopy.find((c: any) => c.id === 'comp' || c.id === 'context');

                const allEnvEls = getAllElementsInCat(targetEnvCat);
                const allPoseEls = getAllElementsInCat(targetPoseCat);
                const allContextEls = getAllElementsInCat(targetContextCat);

                if (isEnv) {
                  allPoseEls.forEach((p: any) => {
                    if (p.linkedEnvId === effectiveElId && p.id !== saved.linkedPoseId) {
                      p.linkedEnvId = undefined;
                    }
                  });
                  if (saved.linkedPoseId) {
                    const counterpart = allPoseEls.find((p: any) => p.id === saved.linkedPoseId);
                    if (counterpart) counterpart.linkedEnvId = effectiveElId;
                  }

                  allContextEls.forEach((c: any) => {
                    if (c.linkedEnvId === effectiveElId && c.id !== saved.linkedContextId) {
                      c.linkedEnvId = undefined;
                    }
                  });
                  if (saved.linkedContextId) {
                    const counterpart = allContextEls.find((c: any) => c.id === saved.linkedContextId);
                    if (counterpart) counterpart.linkedEnvId = effectiveElId;
                  }
                } else if (isPose) {
                  allEnvEls.forEach((e: any) => {
                    if (e.linkedPoseId === effectiveElId && e.id !== saved.linkedEnvId) {
                      e.linkedPoseId = undefined;
                    }
                  });
                  if (saved.linkedEnvId) {
                    const counterpart = allEnvEls.find((e: any) => e.id === saved.linkedEnvId);
                    if (counterpart) counterpart.linkedPoseId = effectiveElId;
                  }

                  allContextEls.forEach((c: any) => {
                    if (c.linkedPoseId === effectiveElId && c.id !== saved.linkedContextId) {
                      c.linkedPoseId = undefined;
                    }
                  });
                  if (saved.linkedContextId) {
                    const counterpart = allContextEls.find((c: any) => c.id === saved.linkedContextId);
                    if (counterpart) counterpart.linkedPoseId = effectiveElId;
                  }
                } else if (isContext) {
                  allEnvEls.forEach((e: any) => {
                    if (e.linkedContextId === effectiveElId && e.id !== saved.linkedEnvId) {
                      e.linkedContextId = undefined;
                    }
                  });
                  if (saved.linkedEnvId) {
                    const counterpart = allEnvEls.find((e: any) => e.id === saved.linkedEnvId);
                    if (counterpart) counterpart.linkedContextId = effectiveElId;
                  }

                  allPoseEls.forEach((p: any) => {
                    if (p.linkedContextId === effectiveElId && p.id !== saved.linkedPoseId) {
                      p.linkedContextId = undefined;
                    }
                  });
                  if (saved.linkedPoseId) {
                    const counterpart = allPoseEls.find((p: any) => p.id === saved.linkedPoseId);
                    if (counterpart) counterpart.linkedContextId = effectiveElId;
                  }
                }
              }

              return { ...prev, cats: catsCopy };
            }
          });
        }}
        onDelete={
          cropModalData.isCategory && cropModalData.catId && !isDefaultCategory(cropModalData.catId)
            ? () => {
                const targetCatId = cropModalData.catId!;
                recordHistory();
                setDb((prev) => {
                  const catsCopy = prev.cats.filter((c: any) => c.id !== targetCatId);
                  const selectionsCopy = JSON.parse(JSON.stringify(prev.selections || {}));
                  delete selectionsCopy[targetCatId];
                  return {
                    ...prev,
                    cats: catsCopy,
                    selections: selectionsCopy
                  };
                });
                if (view.catId === cropModalData.catId) {
                  setView({ catId: null, subcatId: null });
                }
              }
            : cropModalData.elId
            ? () => {
                setDb((prev) => {
                  const catsCopy = JSON.parse(JSON.stringify(prev.cats));
                  const path = cropModalData.path;
                  const cat = catsCopy.find((c: any) => c.id === path[0]);
                  let targetEls: any[] = [];
                  if (cat) {
                    if (path.length === 1) targetEls = cat.els = cat.els || [];
                    else if (path.length === 2) {
                      const sc = cat.subcats?.find((s: any) => s.id === path[1]);
                      if (sc) targetEls = sc.els = sc.els || [];
                    } else if (path.length === 3) {
                      const sc = cat.subcats?.find((s: any) => s.id === path[1]);
                      const row = sc?.rows?.find((r: any) => r.id === path[2]);
                      if (row) targetEls = row.els = row.els || [];
                    }
                  }
                  const idx = targetEls.findIndex((e: any) => e.id === cropModalData.elId);
                  if (idx > -1) targetEls.splice(idx, 1);

                  // Clean up reciprocal links in counterpart categories
                  const delId = cropModalData.elId;
                  catsCopy.forEach((c: any) => {
                    const allEls = getAllElementsInCat(c);
                    allEls.forEach((item: any) => {
                      if (item.linkedContextId === delId) item.linkedContextId = undefined;
                      if (item.linkedPoseId === delId) item.linkedPoseId = undefined;
                      if (item.linkedEnvId === delId) item.linkedEnvId = undefined;
                      if (item.pairedElementId === delId) item.pairedElementId = undefined;
                    });
                  });

                  return { ...prev, cats: catsCopy };
                });
              }
            : undefined
        }
      />

      {/* Subcategory Management Modal */}
      <SubcategoryModal
        isOpen={subcatModalData.isOpen}
        onClose={() => setSubcatModalData({ isOpen: false, mode: 'create', subcat: null })}
        mode={subcatModalData.mode}
        subcat={subcatModalData.subcat}
        categoryName={activeCat?.name}
        isTheme={false}
        nsfwOn={db.nsfwOn}
        onSave={(name) => {
          if (!activeCat) return;
          recordHistory();
          setDb((prev) => {
            const catsCopy = JSON.parse(JSON.stringify(prev.cats));
            const cat = catsCopy.find((c: any) => c.id === activeCat.id);
            if (!cat) return prev;
            cat.subcats = cat.subcats || [];

            if (subcatModalData.mode === 'edit' && subcatModalData.subcat) {
              const sc = cat.subcats.find((s: any) => s.id === subcatModalData.subcat!.id);
              if (sc) sc.name = name;
            } else {
              const newSubcatId =
                name.toLowerCase().replace(/[^a-z0-9]+/g, '_') +
                '_' +
                Date.now().toString(36).slice(-4);
              cat.subcats.push({
                id: newSubcatId,
                name,
                type: 'flat',
                els: []
              });
              setView((v) => ({ ...v, subcatId: newSubcatId }));
            }
            return { ...prev, cats: catsCopy };
          });
        }}
        onDelete={
          subcatModalData.subcat && !isDefaultSubcategory(subcatModalData.subcat.id)
            ? () => {
                if (!activeCat || !subcatModalData.subcat) return;
                const targetSubcatId = subcatModalData.subcat.id;
                recordHistory();
                setDb((prev) => {
                  const catsCopy = JSON.parse(JSON.stringify(prev.cats));
                  const cat = catsCopy.find((c: any) => c.id === activeCat.id);
                  if (!cat) return prev;
                  cat.subcats = (cat.subcats || []).filter((s: any) => s.id !== targetSubcatId);

                  // Clear selections in this subcategory
                  const selectionsCopy = JSON.parse(JSON.stringify(prev.selections || {}));
                  if (selectionsCopy[activeCat.id]?.[targetSubcatId]) {
                    delete selectionsCopy[activeCat.id][targetSubcatId];
                  }

                  const remainingSubcats = cat.subcats;
                  const nextSubcatId = remainingSubcats?.[0]?.id || null;
                  setView((v) => ({ ...v, subcatId: nextSubcatId }));

                  return {
                    ...prev,
                    cats: catsCopy,
                    selections: selectionsCopy
                  };
                });
              }
            : undefined
        }
      />

      {/* Theme Management Modal */}
      <ThemeModal
        isOpen={themeModalData.isOpen}
        onClose={() => setThemeModalData((prev) => ({ ...prev, isOpen: false, theme: null }))}
        mode={themeModalData.mode}
        theme={themeModalData.theme}
        categoryName={activeCat?.name}
        nsfwOn={db.nsfwOn}
        onSave={handleSaveTheme}
        onDelete={themeModalData.theme ? handleDeleteTheme : undefined}
      />

      {/* Restore Main User Database Confirmation Modal */}
      {restoreConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="fixed inset-0" onClick={() => setRestoreConfirmOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-[#141217] border border-white/[0.1] shadow-2xl p-5 z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Database className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Restore Main User Database</h3>
                <p className="text-[11px] text-amber-300/80">Affects Main User data only</p>
              </div>
            </div>

            <p className="text-xs text-white/80 leading-relaxed bg-black/40 p-3.5 rounded-xl border border-white/[0.06]">
              Are you sure you want to restore the Main User database to default workstation state? All custom elements and categories for Main User will be reset. Secondary users will remain unaffected.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestoreConfirmOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-white/70 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setRestoreConfirmOpen(false);
                  await handleRestoreMainUserDB();
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold transition-all shadow-[0_0_15px_rgba(217,119,6,0.4)]"
              >
                Restore Main DB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Database & Photos Export/Import Modal */}
      <FullExportImportModal
        isOpen={fullExportImportModal.isOpen}
        onClose={() => setFullExportImportModal((prev) => ({ ...prev, isOpen: false }))}
        activeUserId={activeUserId}
        activeUserName={users.find((u) => u.id === activeUserId)?.name || 'Main User'}
        nsfwOn={db.nsfwOn}
        soundEnabled={db.soundEnabled}
        onImportSuccess={handleFullImportSuccess}
        initialTab={fullExportImportModal.tab}
      />
    </div>
  );
}
