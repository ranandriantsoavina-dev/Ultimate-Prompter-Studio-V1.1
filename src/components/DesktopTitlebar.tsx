import React, { useState } from 'react';
import { 
  Dices, 
  Search, 
  Volume2, 
  VolumeX, 
  Download, 
  Upload, 
  RotateCcw, 
  History, 
  Sparkles,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  Flame,
  Undo2,
  Redo2,
  Cpu,
  User,
  Database
} from 'lucide-react';
import { PromptEngine } from '../types/prompter';

interface DesktopTitlebarProps {
  onSearchOpen: () => void;
  onRandomizeAll: () => void;
  onClearAll: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  nsfwOn: boolean;
  onToggleNsfw: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  promptEngine: PromptEngine;
  onChangeEngine: (engine: PromptEngine) => void;
  onOpenHistory: () => void;
  onOpenDevSettings: () => void;
  onExportDB: () => void;
  onImportDB: () => void;
  onRestoreMainDB: () => void;
  saveStatus: string;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isRolling: boolean;
  activeUserName?: string;
}

export const DesktopTitlebar: React.FC<DesktopTitlebarProps> = ({
  onSearchOpen,
  onRandomizeAll,
  onClearAll,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  nsfwOn,
  onToggleNsfw,
  soundEnabled,
  onToggleSound,
  promptEngine,
  onChangeEngine,
  onOpenHistory,
  onOpenDevSettings,
  onExportDB,
  onImportDB,
  onRestoreMainDB,
  saveStatus,
  isFullscreen,
  onToggleFullscreen,
  isRolling,
  activeUserName
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0e0d11]/95 backdrop-blur-md border-b border-white/[0.08] select-none">
      {/* Top Native Titlebar Strip */}
      <div className="flex items-center justify-between px-4 py-2 text-xs border-b border-white/[0.04]">
        {/* Left: Window Traffic Lights & App ID */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 group">
            <button 
              onClick={onClearAll} 
              title="Reset Selections"
              className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-125 transition-transform active:scale-90 flex items-center justify-center text-[8px] text-black/60 font-bold opacity-80 hover:opacity-100"
            />
            <button 
              onClick={() => {}} 
              title="Minimize panel"
              className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-125 transition-transform active:scale-90 flex items-center justify-center text-[8px] text-black/60 font-bold opacity-80 hover:opacity-100"
            />
            <button 
              onClick={onToggleFullscreen} 
              title="Toggle Fullscreen"
              className="w-3 h-3 rounded-full bg-[#27c93f] hover:brightness-125 transition-transform active:scale-90 flex items-center justify-center text-[8px] text-black/60 font-bold opacity-80 hover:opacity-100"
            />
          </div>

          <div className="h-3 w-[1px] bg-white/10" />

          <div className="flex items-center gap-2 font-medium tracking-tight text-white/90">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
                nsfwOn ? 'bg-red-500 shadow-[0_0_8px_#ff2238]' : 'bg-orange-500 shadow-[0_0_8px_#ff6600]'
              }`}
            />
            <span className="font-semibold text-white">Ultimate Prompter</span>
            <span className="text-white/40 hidden sm:inline">· Studio Workstation</span>
            <span
              className={`hidden md:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors duration-500 ${
                nsfwOn ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'
              }`}
            >
              Krea 2
            </span>
          </div>

          {saveStatus && (
            <span className="text-[11px] text-white/40 font-mono transition-opacity animate-pulse">
              {saveStatus}
            </span>
          )}
        </div>

        {/* Center: Search / Command Palette Trigger */}
        <button
          onClick={onSearchOpen}
          className="hidden md:flex items-center gap-3 px-3 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white/60 hover:text-white transition-all text-xs"
        >
          <Search className="w-3.5 h-3.5 text-white/50 stroke-[1.5]" />
          <span>Quick search or command…</span>
          <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-mono text-white/40">
            ⌘K
          </kbd>
        </button>

        {/* Right: Window Status & Quick Actions */}
        <div className="flex items-center gap-1.5">
          {/* Undo Button */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title={canUndo ? 'Undo last selection change (⌘Z)' : 'Nothing to undo'}
            className="p-1.5 rounded-md hover:bg-white/[0.06] text-white/60 hover:text-white disabled:opacity-25 disabled:pointer-events-none transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>

          {/* Redo Button */}
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title={canRedo ? 'Redo selection change (⌘⇧Z)' : 'Nothing to redo'}
            className="p-1.5 rounded-md hover:bg-white/[0.06] text-white/60 hover:text-white disabled:opacity-25 disabled:pointer-events-none transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>

          <div className="h-3 w-[1px] bg-white/10 mx-0.5" />

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute audio feedback' : 'Enable audio feedback'}
            className="p-1.5 rounded-md hover:bg-white/[0.06] text-white/60 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 stroke-[1.5]" /> : <VolumeX className="w-3.5 h-3.5 text-white/40 stroke-[1.5]" />}
          </button>

          {/* History */}
          <button
            onClick={onOpenHistory}
            title="Prompt History"
            className="p-1.5 rounded-md hover:bg-white/[0.06] text-white/60 hover:text-white transition-colors flex items-center gap-1"
          >
            <History className="w-3.5 h-3.5 stroke-[1.5]" />
            <span className="hidden lg:inline text-[11px]">History</span>
          </button>

          {/* Developer Settings / Ollama Vision Page */}
          <button
            onClick={onOpenDevSettings}
            title="Developer Settings & Ollama Vision"
            className="p-1.5 rounded-md hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1 border border-orange-500/30 bg-orange-500/10"
          >
            <Cpu className="w-3.5 h-3.5 stroke-[1.5]" />
            <span className="hidden lg:inline text-[11px] font-semibold">Dev / Ollama</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={onToggleFullscreen}
            title="Toggle fullscreen"
            className="p-1.5 rounded-md hover:bg-white/[0.06] text-white/60 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 stroke-[1.5]" /> : <Maximize2 className="w-3.5 h-3.5 stroke-[1.5]" />}
          </button>
        </div>
      </div>

      {/* Main Workstation Control Toolbar */}
      <div className="flex items-center justify-between gap-4 px-4 py-2.5">
        {/* Dedicated Krea 2 AI Engine Badge & Active User Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all duration-500 ${
              nsfwOn
                ? 'bg-red-950/25 border-red-500/40 text-white shadow-[0_0_16px_rgba(255,34,56,0.15)]'
                : 'bg-orange-950/25 border-orange-500/40 text-white shadow-[0_0_16px_rgba(255,102,0,0.15)]'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <span
                className={`w-2.5 h-2.5 rounded-full transition-colors duration-500 ${
                  nsfwOn ? 'bg-red-500 shadow-[0_0_10px_#ff2238]' : 'bg-orange-500 shadow-[0_0_10px_#ff6600]'
                }`}
              />
              <span
                className={`absolute w-4 h-4 rounded-full animate-ping opacity-30 transition-colors duration-500 ${
                  nsfwOn ? 'bg-red-500' : 'bg-orange-500'
                }`}
              />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-bold tracking-tight text-white">Krea 2</span>
              <span
                className={`text-[10px] font-mono tracking-wider uppercase font-semibold transition-colors duration-500 ${
                  nsfwOn ? 'text-red-400' : 'text-orange-400'
                }`}
              >
                AI Model
              </span>
              {activeUserName && (
                <span className="text-[10px] font-mono font-bold text-white/40 ml-1.5 border-l border-white/20 pl-1.5">
                  {activeUserName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls: Randomizer + NSFW + Backup */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Randomize All Dice Button with Physics Shake */}
          <button
            onClick={onRandomizeAll}
            title="Randomize unlocked categories"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 duration-500 ${
              nsfwOn
                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-200 border-red-500/35 hover:border-red-500/60 shadow-[0_0_12px_rgba(255,34,56,0.12)]'
                : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-200 border-orange-500/35 hover:border-orange-500/60 shadow-[0_0_12px_rgba(255,102,0,0.12)]'
            } ${isRolling ? 'ring-2 ring-white/40' : ''}`}
          >
            <Dices
              className={`w-3.5 h-3.5 stroke-[1.8] ${isRolling ? 'animate-spin' : ''} ${
                nsfwOn ? 'text-red-400' : 'text-orange-400'
              }`}
            />
            <span>Roll Unlocked</span>
          </button>

          {/* NSFW Safety Switch */}
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border transition-all duration-500 ${
              nsfwOn
                ? 'bg-red-950/30 border-red-500/50 shadow-[0_0_18px_rgba(255,34,56,0.22)]'
                : 'bg-black/50 border-white/[0.08]'
            }`}
          >
            <Flame
              className={`w-3.5 h-3.5 transition-colors duration-500 ${
                nsfwOn ? 'text-red-500 animate-pulse' : 'text-white/40'
              }`}
            />
            <span
              className={`text-xs font-semibold tracking-wide transition-colors duration-500 ${
                nsfwOn ? 'text-red-400' : 'text-white/50'
              }`}
            >
              NSFW
            </span>
            <button
              onClick={onToggleNsfw}
              role="switch"
              aria-checked={nsfwOn}
              className={`w-9 h-5 rounded-full transition-all duration-500 relative cursor-pointer ${
                nsfwOn
                  ? 'bg-red-600 shadow-[0_0_14px_rgba(255,34,56,0.7)]'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-transform duration-300 shadow-sm ${
                  nsfwOn ? 'translate-x-[18px]' : 'translate-x-[3px]'
                }`}
              />
            </button>
          </div>

          {/* Backup / Export / Import Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 hover:text-white transition-colors"
              title="Workstation Settings & Backup"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setMenuOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#17151a] border border-white/[0.1] shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      onExportDB();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-white/80 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors text-left"
                  >
                    <Download className="w-3.5 h-3.5 text-[#ff5c1a]" />
                    <span>Export Workspace JSON</span>
                  </button>
                  <button
                    onClick={() => {
                      onImportDB();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-white/80 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors text-left"
                  >
                    <Upload className="w-3.5 h-3.5 text-sky-400" />
                    <span>Import Workspace JSON</span>
                  </button>
                  <button
                    onClick={() => {
                      onRestoreMainDB();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 rounded-lg transition-colors text-left"
                  >
                    <Database className="w-3.5 h-3.5 text-amber-400" />
                    <span>Restore Main User Database</span>
                  </button>
                  <div className="h-[1px] bg-white/[0.08] my-1" />
                  <button
                    onClick={() => {
                      onClearAll();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors text-left"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset All Selections</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
