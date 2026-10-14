export type PromptEngine = 'krea' | 'midjourney' | 'flux' | 'sdxl' | 'structured';

export type PromptMode = 'structured' | 'warped';

export type AspectRatio = '' | '1:1' | '16:9' | '9:16' | '4:5' | '3:2' | '2:3' | '21:9';

export interface ImgPos {
  x: number;
  y: number;
  z: number;
  ar?: number;
}

export interface PromptElement {
  id: string;
  name: string;
  prompt: string;
  nsfw: boolean;
  image?: string;
  imgPos?: ImgPos;
  tags?: string[];
  gradient?: string;
  icon?: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  els: PromptElement[];
}

export interface SubCategory {
  id: string;
  name: string;
  type: 'flat' | 'rows';
  els?: PromptElement[];
  rows?: CategoryRow[];
}

export interface Category {
  id: string;
  name: string;
  type: 'flat' | 'tabs';
  image?: string;
  imgPos?: ImgPos;
  description?: string;
  icon?: string;
  accent?: string;
  els?: PromptElement[];
  subcats?: SubCategory[];
}

export interface PresetPick {
  cat: string;
  sub?: string | null;
  el: string;
  weight?: number;
}

export interface Preset {
  id: string;
  name: string;
  kind: 'outfit' | 'context' | 'full';
  picks: PresetPick[];
  description?: string;
  image?: string;
  imgPos?: ImgPos;
  icon?: string;
  nsfw?: boolean;
}

export interface PromptHistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
  engine: PromptEngine;
}

export interface DBState {
  cats: Category[];
  selections: Record<string, any>;
  elementWeights: Record<string, number>;
  locks: Record<string, boolean>;
  nsfwOn: boolean;
  promptMode: PromptMode;
  promptEngine: PromptEngine;
  presets: Preset[];
  activePreset: string | null;
  stylize: number;
  soundEnabled: boolean;
  history: PromptHistoryItem[];
}
