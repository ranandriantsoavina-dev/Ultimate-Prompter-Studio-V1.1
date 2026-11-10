// Modern Apple-like tactile audio synthesizer using the Web Audio API

let audioCtx: AudioContext | null = null;
const lastPlayed: Record<string, number> = {};

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function canPlay(soundKey: string, throttleMs: number = 30): boolean {
  const now = Date.now();
  if (lastPlayed[soundKey] && now - lastPlayed[soundKey] < throttleMs) {
    return false;
  }
  lastPlayed[soundKey] = now;
  return true;
}

function parseVol(volOrFlag?: boolean | number): number {
  if (typeof volOrFlag === 'number') return volOrFlag;
  return 0.5;
}

function createGain(ctx: AudioContext, baseGain: number, volOrFlag?: boolean | number) {
  const gain = ctx.createGain();
  const userVolume = parseVol(volOrFlag);
  const safeVolume = Math.max(0, Math.min(1, userVolume));
  gain.gain.setValueAtTime(baseGain * safeVolume, ctx.currentTime);
  return gain;
}

export function playClickSound(enabled: boolean = true, volOrFlag?: boolean | number) {
  if (!enabled || !canPlay('click', 25)) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = createGain(ctx, 0.03, volOrFlag);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.03);

    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  } catch (e) {}
}

export function playSelectSound(enabled: boolean = true, isSelect: boolean = true, volOrFlag?: boolean | number) {
  if (!enabled || !canPlay('select', 30)) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = createGain(ctx, 0.04, volOrFlag);

    const startFreq = isSelect ? 620 : 360;
    const endFreq = isSelect ? 310 : 180;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + 0.045);

    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.045);
  } catch (e) {}
}

export function playNavigateSound(enabled: boolean = true, volOrFlag?: boolean | number) {
  if (!enabled || !canPlay('navigate', 60)) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = createGain(ctx, 0.025, volOrFlag);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(540, ctx.currentTime + 0.07);

    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  } catch (e) {}
}

export function playDragStartSound(enabled: boolean = true, volOrFlag?: boolean | number) {
  if (!enabled || !canPlay('dragStart', 100)) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = createGain(ctx, 0.03, volOrFlag);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(480, ctx.currentTime + 0.05);

    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {}
}

export function playDragDropSound(enabled: boolean = true, volOrFlag?: boolean | number) {
  if (!enabled || !canPlay('dragDrop', 100)) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = createGain(ctx, 0.03, volOrFlag);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.05);

    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {}
}

export function playEditSaveSound(enabled: boolean = true, volOrFlag?: boolean | number) {
  if (!enabled || !canPlay('editSave', 150)) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = createGain(ctx, 0.035, volOrFlag);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.09);
        } catch (err) {}
      }, idx * 45);
    });
  } catch (e) {}
}

export function playDeleteSound(enabled: boolean = true, volOrFlag?: boolean | number) {
  if (!enabled || !canPlay('delete', 100)) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = createGain(ctx, 0.045, volOrFlag);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);

    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {}
}

export function playCopySuccessSound(enabled: boolean = true, volOrFlag?: boolean | number) {
  if (!enabled || !canPlay('copy', 200)) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    [680, 820].forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = createGain(ctx, 0.035, volOrFlag);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.04);
        } catch (err) {}
      }, idx * 60);
    });
  } catch (e) {}
}

export function playClearSound(enabled: boolean = true, volOrFlag?: boolean | number) {
  if (!enabled || !canPlay('clear', 150)) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = createGain(ctx, 0.035, volOrFlag);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(550, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.08);

    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {}
}

export function playDiceRollSound(enabled: boolean = true, volOrFlag?: boolean | number) {
  if (!enabled || !canPlay('dice', 250)) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    const count = 4;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = createGain(ctx, 0.025, volOrFlag);
          const f = 380 + Math.random() * 320;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.04);
        } catch (err) {}
      }, i * 40);
    }
  } catch (e) {}
}

export function playToggleSound(enabled: boolean = true, isOn: boolean = true, volOrFlag?: boolean | number) {
  if (!enabled || !canPlay('toggle', 50)) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = createGain(ctx, 0.035, volOrFlag);

    const startFreq = isOn ? 420 : 640;
    const endFreq = isOn ? 640 : 420;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + 0.05);

    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {}
}

export function playErrorSound(enabled: boolean = true, volOrFlag?: boolean | number) {
  if (!enabled || !canPlay('error', 200)) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = createGain(ctx, 0.04, volOrFlag);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.08);

    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {}
}
