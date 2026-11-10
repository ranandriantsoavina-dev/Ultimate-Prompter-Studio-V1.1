import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Users, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Moon, 
  Sun, 
  Download, 
  Upload, 
  Check, 
  Plus, 
  Trash2, 
  AlertTriangle,
  FolderArchive,
  Archive,
  Edit2
} from 'lucide-react';
import { UserProfile } from './DevSettingsPage';
import { AppTheme } from '../types/prompter';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  activeUserId: string;
  onSwitchUser: (userId: string) => void | Promise<void>;
  onRenameUser: (userId: string, newName: string) => void | Promise<void>;
  onCreateUser: (name: string) => void | Promise<void>;
  onDeleteUser: (userId: string) => void | Promise<void>;
  soundEnabled: boolean;
  onToggleSound: () => void;
  soundVolume?: number;
  onChangeVolume?: (vol: number) => void;
  theme: AppTheme;
  onChangeTheme: (theme: AppTheme) => void;
  onFullExport: () => void;
  onFullImport: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  users,
  activeUserId,
  onSwitchUser,
  onRenameUser,
  onCreateUser,
  onDeleteUser,
  soundEnabled,
  onToggleSound,
  soundVolume = 0.5,
  onChangeVolume,
  theme,
  onChangeTheme,
  onFullExport,
  onFullImport
}) => {
  const [activeUserNameInput, setActiveUserNameInput] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameSuccess, setRenameSuccess] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [userError, setUserError] = useState('');

  const activeUser = users.find((u) => u.id === activeUserId);

  useEffect(() => {
    if (isOpen && activeUser) {
      setActiveUserNameInput(activeUser.name);
      setIsRenaming(false);
      setRenameSuccess(false);
      setNewUserName('');
      setUserToDelete(null);
      setUserError('');
    }
  }, [isOpen, activeUser]);

  // ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (userToDelete) {
          setUserToDelete(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, userToDelete, onClose]);

  if (!isOpen) return null;

  const handleSaveRename = async () => {
    if (!activeUserNameInput.trim() || activeUserNameInput.trim() === activeUser?.name) {
      setIsRenaming(false);
      return;
    }
    setUserError('');
    try {
      await onRenameUser(activeUserId, activeUserNameInput.trim());
      setIsRenaming(false);
      setRenameSuccess(true);
      setTimeout(() => setRenameSuccess(false), 2000);
    } catch (err: any) {
      setUserError(err?.message || 'Failed to rename user');
    }
  };

  const handleCreateNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    setUserError('');
    try {
      await onCreateUser(newUserName.trim());
      setNewUserName('');
    } catch (err: any) {
      setUserError(err?.message || 'Failed to create user');
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setUserError('');
    try {
      await onDeleteUser(userToDelete.id);
      setUserToDelete(null);
    } catch (err: any) {
      setUserError(err?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-xl rounded-2xl bg-[#141217] border border-white/[0.1] shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-base text-white tracking-tight">Workstation Settings</h2>
              <p className="text-xs text-white/50">Manage accounts, preferences, themes, and backups</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="py-4 space-y-6 overflow-y-auto flex-1 pr-1">
          {userError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
              <span>{userError}</span>
              <button onClick={() => setUserError('')} className="text-rose-400 hover:text-white text-xs underline">
                Dismiss
              </button>
            </div>
          )}

          {/* Delete User Confirmation Sub-modal */}
          {userToDelete && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2.5 text-rose-300 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Remove User Account</span>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                Are you sure you want to delete user <strong className="text-white">"{userToDelete.name}"</strong>? This will permanently delete their database and saved items.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-xs text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          )}

          {/* 1. USER MANAGEMENT */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-400 stroke-[1.8]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">
                  1. User Management
                </h3>
              </div>
              <span className="text-[10px] text-white/40 font-mono">
                {users.length} {users.length === 1 ? 'user' : 'users'}
              </span>
            </div>

            {/* Current Active User & Rename */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-300 shrink-0 font-bold text-xs">
                    {(activeUser?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white truncate">
                        {activeUser?.name}
                      </span>
                      {activeUser?.isMain && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          MAIN
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-white/40 block">Active database account</span>
                  </div>
                </div>

                {!isRenaming && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsRenaming(true);
                      setActiveUserNameInput(activeUser?.name || '');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-white/80 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit Name</span>
                  </button>
                )}
              </div>

              {isRenaming && (
                <div className="flex items-center gap-2 pt-1 animate-in fade-in">
                  <input
                    type="text"
                    value={activeUserNameInput}
                    onChange={(e) => setActiveUserNameInput(e.target.value)}
                    placeholder="Enter new user name"
                    autoFocus
                    className="flex-1 px-3 py-1.5 rounded-lg bg-black/60 border border-orange-500/40 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveRename}
                    className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-sm transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRenaming(false)}
                    className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs text-white/70 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {renameSuccess && (
                <span className="text-[11px] text-emerald-400 font-medium animate-in fade-in">
                  ✓ User name updated successfully!
                </span>
              )}
            </div>

            {/* Switch User / User List */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-white/70 block">
                Switch or Manage Profiles:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {users.map((u) => {
                  const isActive = u.id === activeUserId;
                  return (
                    <div
                      key={u.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-orange-500/15 border-orange-500/50 shadow-sm'
                          : 'bg-black/30 border-white/[0.08] hover:bg-white/[0.04]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSwitchUser(u.id)}
                        className="flex items-center gap-2 text-left min-w-0 flex-1 cursor-pointer"
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            isActive
                              ? 'bg-orange-500 text-black'
                              : 'bg-white/10 text-white/70'
                          }`}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className={`text-xs font-semibold block truncate ${isActive ? 'text-white' : 'text-white/80'}`}>
                            {u.name}
                          </span>
                          {u.isMain && (
                            <span className="text-[9px] text-amber-400 font-mono">Main</span>
                          )}
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {isActive && (
                          <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          </span>
                        )}
                        {!u.isMain && (
                          <button
                            type="button"
                            onClick={() => setUserToDelete(u)}
                            className="p-1 rounded-md text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title={`Delete ${u.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add User Form */}
            <form onSubmit={handleCreateNewUser} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Add new user profile..."
                className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />
              <button
                type="submit"
                disabled={!newUserName.trim()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add User</span>
              </button>
            </form>
          </section>

          {/* 2. SOUND */}
          <section className="space-y-3 pt-3 border-t border-white/[0.08]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-orange-400 stroke-[1.8]" />
                ) : (
                  <VolumeX className="w-4 h-4 text-white/40 stroke-[1.8]" />
                )}
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">
                  2. Sound Feedback
                </h3>
              </div>
              <span className="text-[10px] text-white/40 font-mono">
                {soundEnabled ? 'Enabled' : 'Muted'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-white block">
                    Interactive Audio Feedback
                  </span>
                  <span className="text-[11px] text-white/50 leading-relaxed block">
                    Plays subtle tactile sound cues on selections, rolls, and preset activations
                  </span>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={soundEnabled}
                  onClick={onToggleSound}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    soundEnabled ? 'bg-orange-600' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      soundEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {soundEnabled && (
                <div className="pt-2 border-t border-white/[0.06] flex items-center gap-3 animate-in fade-in">
                  <span className="text-[11px] font-medium text-white/70">Volume:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={soundVolume}
                    onChange={(e) => onChangeVolume?.(parseFloat(e.target.value))}
                    className="flex-1 accent-orange-500 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  />
                  <span className="text-[11px] font-mono text-white/60 w-8 text-right">
                    {Math.round(soundVolume * 100)}%
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* 3. THEME SWITCHER */}
          <section className="space-y-3 pt-3 border-t border-white/[0.08]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-400 stroke-[1.8]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">
                  3. Theme Switcher
                </h3>
              </div>
              <span className="text-[10px] text-white/40 font-mono uppercase">
                {theme}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option 1: Glow Theme */}
              <button
                type="button"
                onClick={() => onChangeTheme('glow')}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  theme === 'glow'
                    ? 'bg-orange-950/25 border-orange-500/60 shadow-[0_0_15px_rgba(255,102,0,0.2)]'
                    : 'bg-black/30 border-white/[0.08] hover:bg-white/[0.04]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_#ff6600]" />
                    {theme === 'glow' && <Check className="w-3.5 h-3.5 text-orange-400 stroke-[2.5]" />}
                  </div>
                  <div className="text-xs font-bold text-white mb-1">Glow Theme</div>
                  <p className="text-[10px] text-white/50 leading-relaxed">
                    Dynamic ambient glowing canvas background with glass workstation panels
                  </p>
                </div>
              </button>

              {/* Option 2: Minimalist Dark Theme */}
              <button
                type="button"
                onClick={() => onChangeTheme('minimal-dark')}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  theme === 'minimal-dark'
                    ? 'bg-zinc-900 border-white/60 shadow-sm'
                    : 'bg-black/30 border-white/[0.08] hover:bg-white/[0.04]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="w-3 h-3 rounded-full bg-white border border-white/40" />
                    {theme === 'minimal-dark' && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                  </div>
                  <div className="text-xs font-bold text-white mb-1">Minimalist Dark</div>
                  <p className="text-[10px] text-white/50 leading-relaxed">
                    Pitch black flat background, pure white typography, thin borders, no glow
                  </p>
                </div>
              </button>

              {/* Option 3: Minimalist Light Theme */}
              <button
                type="button"
                onClick={() => onChangeTheme('minimal-light')}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  theme === 'minimal-light'
                    ? 'bg-slate-200/40 border-orange-500/60 shadow-sm'
                    : 'bg-black/30 border-white/[0.08] hover:bg-white/[0.04]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-200 border border-slate-400" />
                    {theme === 'minimal-light' && <Check className="w-3.5 h-3.5 text-orange-500 stroke-[2.5]" />}
                  </div>
                  <div className="text-xs font-bold text-white mb-1">Minimalist Light</div>
                  <p className="text-[10px] text-white/50 leading-relaxed">
                    Clean white flat background, high contrast dark typography, crisp thin borders
                  </p>
                </div>
              </button>
            </div>
          </section>

          {/* 4. DATA SECTION (AT THE BOTTOM) */}
          <section className="space-y-3 pt-3 border-t border-white/[0.08]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-orange-400 stroke-[1.8]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">
                  4. Data Archive & Backup
                </h3>
              </div>
              <span className="text-[10px] text-white/40 font-mono">
                ZIP & JSON
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] space-y-3">
              <p className="text-xs text-white/70 leading-relaxed">
                Full system backup packages the entire active database JSON along with all uploaded image files in the local <code className="text-orange-300 font-mono bg-black/50 px-1 py-0.5 rounded">data/</code> directory into a portable .ZIP archive.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onFullExport();
                    onClose();
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/40 text-orange-300 hover:text-orange-200 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                  title="Export database JSON + all photos into a ZIP archive"
                >
                  <Download className="w-4 h-4 stroke-[2]" />
                  <span>Full Export (.ZIP)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onFullImport();
                    onClose();
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 hover:text-sky-200 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                  title="Restore database and extract photos into data/"
                >
                  <Upload className="w-4 h-4 stroke-[2]" />
                  <span>Full Import (.ZIP)</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
