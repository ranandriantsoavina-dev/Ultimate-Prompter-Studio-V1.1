import { Category, DBState, PromptEngine } from '../types/prompter';

export const EXCLUSIVE_TABBED = ['comp', 'pose', 'env'];
export const SINGLE_PER_SUBCAT = ['outfit'];
export const SINGLE_FLAT = ['style', 'faceexpr', 'light', 'tech'];

export function getSelArr(selections: Record<string, any>, path: string[]): string[] {
  let node = selections;
  for (let i = 0; i < path.length - 1; i++) {
    node[path[i]] = node[path[i]] || {};
    node = node[path[i]];
  }
  const last = path[path.length - 1];
  if (!Array.isArray(node[last])) {
    node[last] = [];
  }
  return node[last];
}

export function resolveElement(cat: Category, elId: string) {
  if (cat.type === 'flat') {
    return cat.els?.find((e) => e.id === elId);
  }
  if (cat.subcats) {
    for (const sc of cat.subcats) {
      if (sc.type === 'flat' && sc.els) {
        const found = sc.els.find((e) => e.id === elId);
        if (found) return found;
      }
      if (sc.rows) {
        for (const row of sc.rows) {
          const found = row.els.find((e) => e.id === elId);
          if (found) return found;
        }
      }
    }
  }
  return undefined;
}

function lcFirst(t: string): string {
  if (!t) return '';
  return t.charAt(0).toLowerCase() + t.slice(1);
}

function trimPunct(t: string): string {
  return t.replace(/[.,\s]+$/, '');
}

function endDot(t: string): string {
  if (!t) return '';
  return /[.!?]$/.test(t.trim()) ? t.trim() : t.trim() + '.';
}

function getOutfitText(cat: Category, selections: Record<string, any>): string {
  const sel = selections[cat.id] || {};
  const getSubText = (sid: string) => {
    const sc = cat.subcats?.find((x) => x.id === sid);
    if (!sc || !sc.els) return '';
    const ids = sel[sid] || [];
    return ids
      .map((id: string) => sc.els?.find((e) => e.id === id)?.prompt)
      .filter(Boolean)
      .join(' ')
      .trim();
  };

  const onepiece = getSubText('onepiece') || getSubText('one_piece') || getSubText('one-piece');
  const top = getSubText('top');
  const bottom = getSubText('bottom');
  const other = getSubText('other') || getSubText('accessories');

  let out = '';
  if (onepiece) {
    out = trimPunct(onepiece);
  } else if (top && bottom) {
    out = `${trimPunct(top)}, paired with ${lcFirst(trimPunct(bottom))}`;
  } else if (top || bottom) {
    out = trimPunct(top || bottom);
  }

  // Support any custom subcategories created by the user inside Outfit
  const standardSubs = ['top', 'bottom', 'onepiece', 'one_piece', 'one-piece', 'other', 'accessories'];
  cat.subcats?.forEach((sc) => {
    if (!standardSubs.includes(sc.id) && sc.els) {
      const customTxt = getSubText(sc.id);
      if (customTxt) {
        const cleaned = trimPunct(customTxt.replace(/^She is wearing\s+/i, ''));
        out = out ? `${out}, ${lcFirst(cleaned)}` : customTxt;
      }
    }
  });

  if (other) {
    const cleanedOther = trimPunct(out ? other.replace(/^She is wearing\s+/i, '') : other);
    out = out ? `${out}, accessorized with ${lcFirst(cleanedOther)}` : other;
  }
  return out;
}

export function getCategoryPromptText(cat: Category, selections: Record<string, any>): string {
  if (cat.id === 'outfit' && cat.type === 'tabs') {
    return getOutfitText(cat, selections);
  }

  if (cat.type === 'flat') {
    const ids: string[] = selections[cat.id] || [];
    return ids
      .map((id) => cat.els?.find((e) => e.id === id)?.prompt)
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  const parts: string[] = [];
  const catSel = selections[cat.id] || {};

  cat.subcats?.forEach((sc) => {
    if (sc.type === 'flat' && sc.els) {
      const ids: string[] = catSel[sc.id] || [];
      const text = ids
        .map((id) => sc.els?.find((e) => e.id === id)?.prompt)
        .filter(Boolean)
        .join(' ')
        .trim();
      if (text) parts.push(text);
    } else if (sc.rows) {
      sc.rows.forEach((row) => {
        const rowSel = (catSel[sc.id] || {})[row.id] || [];
        const text = rowSel
          .map((id: string) => row.els.find((e) => e.id === id)?.prompt)
          .filter(Boolean)
          .join(' ')
          .trim();
        if (text) parts.push(text);
      });
    }
  });

  return parts.filter(Boolean).join(' ');
}

export function compilePrompt(state: DBState): {
  raw: string;
  formatted: string;
  blocks: { name: string; text: string }[];
  tokenCount: number;
  wordCount: number;
} {
  const { cats, selections, promptMode } = state;

  // Collect text per category
  const blocks: { name: string; text: string }[] = [];
  cats.forEach((cat) => {
    const text = getCategoryPromptText(cat, selections);
    if (text) {
      blocks.push({ name: cat.name, text: text.trim() });
    }
  });

  let assembled = '';

  // Krea 2 model compiler
  if (promptMode === 'structured') {
    assembled = blocks.map((b) => `${b.name}: ${endDot(b.text)}`).join('\n\n');
  } else {
    // flowing natural descriptive paragraph
    assembled = blocks.map((b) => endDot(b.text)).join(' ');
  }

  const words = assembled.trim() ? assembled.trim().split(/\s+/).length : 0;
  // Approximate CLIP token count: words * 1.25 + punctuation
  const tokenCount = Math.round(words * 1.25 + (assembled.match(/[,.;:!?]/g) || []).length * 0.5);

  return {
    raw: assembled,
    formatted: assembled,
    blocks,
    tokenCount,
    wordCount: words
  };
}
