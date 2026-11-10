import React, { useState, useEffect, useRef } from 'react';
import { 
  Archive, 
  Upload, 
  Download, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  HardDrive, 
  Image as ImageIcon, 
  Database, 
  FileArchive, 
  Layers, 
  Sparkles, 
  Clock, 
  RefreshCw,
  FolderArchive,
  ArrowRight
} from 'lucide-react';
import { api, downloadBlob } from '../utils/storage';
import { playClickSound, playCopySuccessSound } from '../utils/soundEffects';

interface FullExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUserId: string;
  activeUserName: string;
  nsfwOn: boolean;
  soundEnabled: boolean;
  onImportSuccess: (restoredDb: any) => void;
  initialTab?: 'export' | 'import';
}

export const FullExportImportModal: React.FC<FullExportImportModalProps> = ({
  isOpen,
  onClose,
  activeUserId,
  activeUserName,
  nsfwOn,
  soundEnabled,
  onImportSuccess,
  initialTab = 'export'
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>(initialTab);
  
  // Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<{
    filename: string;
    imageCount: number;
    exportFolder?: string;
  } | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Server-saved exports list
  const [savedExports, setSavedExports] = useState<{
    filename: string;
    sizeBytes: number;
    createdAt: number;
    downloadUrl: string;
  }[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState<boolean>(false);

  // Import State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importStatusText, setImportStatusText] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    imagesExtracted: number;
    categoriesCount: number;
    presetsCount: number;
    db: any;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync tab with prop on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setExportSuccess(null);
      setExportError(null);
      setSelectedFile(null);
      setImportError(null);
      setImportResult(null);
      fetchSavedExports();
    }
  }, [isOpen, initialTab]);

  const fetchSavedExports = async () => {
    setIsLoadingSaved(true);
    try {
      const list = await api.listExports();
      setSavedExports(list);
    } catch {
      setSavedExports([]);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handleStartExport = async () => {
    playClickSound(soundEnabled, true);
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(null);

    try {
      const res = await api.fullExport(activeUserId);
      downloadBlob(res.blob, res.filename);
      setExportSuccess({
        filename: res.filename,
        imageCount: res.imageCount,
        exportFolder: res.exportFolder
      });
      playCopySuccessSound(soundEnabled);
      await fetchSavedExports();
    } catch (err: any) {
      setExportError(err?.message || 'Failed to export workspace archive');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.zip')) {
        setImportError('Please select a valid .ZIP file exported from Prompter Studio.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setImportError(null);
      setImportResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.zip')) {
        setImportError('Please drop a valid .ZIP file exported from Prompter Studio.');
        return;
      }
      setSelectedFile(file);
      setImportError(null);
      setImportResult(null);
    }
  };

  const handleStartImport = async () => {
    if (!selectedFile) return;
    playClickSound(soundEnabled, true);
    setIsImporting(true);
    setImportError(null);
    setImportResult(null);
    setImportStatusText('Uploading ZIP archive...');

    try {
      setImportStatusText('Extracting photos into data/photos and linking database...');
      const res = await api.fullImport(activeUserId, selectedFile);
      setImportResult({
        imagesExtracted: res.imagesExtracted,
        categoriesCount: res.categoriesCount,
        presetsCount: res.presetsCount,
        db: res.db
      });
      playCopySuccessSound(soundEnabled);
      onImportSuccess(res.db);
    } catch (err: any) {
      setImportError(err?.message || 'Failed to import archive.');
    } finally {
      setIsImporting(false);
      setImportStatusText('');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-2xl bg-[#131117] border border-white/[0.1] shadow-2xl z-10 flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#17151e]/80">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              nsfwOn
                ? 'bg-red-500/15 border-red-500/30 text-red-400'
                : 'bg-orange-500/15 border-orange-500/30 text-orange-400'
            }`}>
              <FolderArchive className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Full Database & Photos Archive
              </h2>
              <p className="text-xs text-white/50">
                Package or restore your complete database with all images in data/
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/[0.06] bg-[#100e14]/60 px-6 pt-2">
          <button
            onClick={() => {
              playClickSound(soundEnabled, false);
              setActiveTab('export');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'export'
                ? nsfwOn
                  ? 'border-red-500 text-red-300'
                  : 'border-orange-500 text-orange-300'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Full Export (Create ZIP)</span>
          </button>

          <button
            onClick={() => {
              playClickSound(soundEnabled, false);
              setActiveTab('import');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'import'
                ? nsfwOn
                  ? 'border-red-500 text-red-300'
                  : 'border-orange-500 text-orange-300'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Full Import (Restore ZIP)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'export' ? (
            /* EXPORT VIEW */
            <div className="space-y-5">
              {/* Feature Description Card */}
              <div className="rounded-xl bg-black/40 border border-white/[0.06] p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>What is packaged in Full Export?</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-white/70">
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                    <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-400 mt-0.5">
                      <FileArchive className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Main JSON Database</div>
                      <div className="text-[11px] text-white/50 mt-0.5">
                        Saved at <code className="text-white/70 font-mono">data/db/main.json</code> including all categories, elements, custom outfits, poses, lighting, and presets.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                    <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400 mt-0.5">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">All Embedded Images</div>
                      <div className="text-[11px] text-white/50 mt-0.5">
                        All images located in <code className="text-white/70 font-mono">data/photos/</code> and data subfolders are packed into the archive.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-white/50 pt-1 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                  <span>A dedicated folder copy is automatically saved to <code className="text-white/70 font-mono">data/exports/</code> on the server.</span>
                </div>
              </div>

              {/* Action Banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Export Target:</span>
                    <span className="font-mono px-2 py-0.5 rounded bg-white/10 text-orange-300">
                      {activeUserName} ({activeUserId})
                    </span>
                  </div>
                  <div className="text-[11px] text-white/50 mt-0.5">
                    Click below to generate and download your complete standalone ZIP backup.
                  </div>
                </div>

                <button
                  onClick={handleStartExport}
                  disabled={isExporting}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shrink-0 cursor-pointer ${
                    nsfwOn
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                      : 'bg-orange-500 hover:bg-orange-400 text-black shadow-orange-500/30'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Packaging Archive…</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 stroke-[2.2]" />
                      <span>Export Full Package (.ZIP)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Export Success Feedback */}
              {exportSuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-emerald-300">Export Complete & Downloaded!</div>
                    <div className="text-xs text-white/80">
                      Successfully packaged <span className="font-mono font-bold text-white">{exportSuccess.filename}</span> containing the database JSON and <span className="font-bold text-emerald-300">{exportSuccess.imageCount}</span> images from <code className="font-mono text-white/70">data/photos/</code>.
                    </div>
                  </div>
                </div>
              )}

              {/* Export Error Feedback */}
              {exportError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 animate-fadeIn">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-rose-300">Export Failed</div>
                    <div className="text-xs text-white/80">{exportError}</div>
                  </div>
                </div>
              )}

              {/* Saved Archives on Disk */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-white/40" />
                    <span>Saved Local Archives in data/exports/</span>
                  </h4>
                  <button
                    onClick={fetchSavedExports}
                    className="text-[11px] text-white/40 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingSaved ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {savedExports.length === 0 ? (
                  <div className="p-4 rounded-xl bg-black/20 border border-white/[0.04] text-center text-xs text-white/40">
                    No previous exports saved in <code className="font-mono text-white/50">data/exports/</code> yet. Click Export above to generate one.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {savedExports.map((item) => (
                      <div
                        key={item.filename}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Archive className="w-4 h-4 text-orange-400 shrink-0" />
                          <div className="min-w-0">
                            <div className="font-mono text-white/90 truncate">{item.filename}</div>
                            <div className="text-[10px] text-white/40">
                              {formatBytes(item.sizeBytes)} • {formatDate(item.createdAt)}
                            </div>
                          </div>
                        </div>

                        <a
                          href={item.downloadUrl}
                          download={item.filename}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/[0.08] hover:bg-white/[0.15] text-[11px] text-white font-medium shrink-0 ml-3 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* IMPORT VIEW */
            <div className="space-y-5">
              {/* Feature Description Card */}
              <div className="rounded-xl bg-black/40 border border-white/[0.06] p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
                  <Upload className="w-4 h-4 text-sky-400" />
                  <span>How Full Import works:</span>
                </div>
                <ul className="text-xs text-white/70 space-y-1.5 list-disc list-inside">
                  <li>Unpacks the uploaded <span className="font-mono text-sky-300">.zip</span> archive directly on the local server.</li>
                  <li>Extracts all embedded photos into the designated <code className="text-white/80 font-mono">data/photos/</code> directory.</li>
                  <li>Restores the main database JSON and automatically reconnects all image paths to the extracted photo files.</li>
                  <li>A rolling safety backup (<code className="font-mono text-white/60">main.bak.json</code>) is created before applying changes.</li>
                </ul>
              </div>

              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-sky-400 bg-sky-500/10'
                    : 'border-white/15 hover:border-white/30 bg-black/30 hover:bg-black/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-white/[0.06] flex items-center justify-center text-white/60">
                  <FileArchive className="w-6 h-6 stroke-[1.8] text-sky-400" />
                </div>

                {selectedFile ? (
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-white font-mono">{selectedFile.name}</div>
                    <div className="text-[11px] text-sky-300 font-mono">
                      {formatBytes(selectedFile.size)} ready to extract & restore
                    </div>
                    <div className="text-[10px] text-white/40 pt-1">
                      Click to choose a different archive
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-white">
                      Drop your Full Export .ZIP file here or click to browse
                    </div>
                    <div className="text-[11px] text-white/40">
                      Accepts standard Prompter Studio backup archives (.zip)
                    </div>
                  </div>
                )}
              </div>

              {/* Import Button */}
              {selectedFile && !importResult && (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setImportError(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white/70 hover:text-white transition-colors"
                  >
                    Clear Selection
                  </button>

                  <button
                    onClick={handleStartImport}
                    disabled={isImporting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-xs font-bold transition-all shadow-lg shadow-sky-500/30 disabled:opacity-50 cursor-pointer"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{importStatusText || 'Extracting & Restoring…'}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 stroke-[2.2]" />
                        <span>Unpack & Restore Full Database</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Progress Indicator */}
              {isImporting && (
                <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-sky-400 animate-spin shrink-0" />
                  <div className="text-xs text-sky-200">
                    {importStatusText || 'Restoring full archive to data/ folder…'}
                  </div>
                </div>
              )}

              {/* Import Success Result */}
              {importResult && (
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 animate-fadeIn">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-300">Full Import Completed Successfully!</h4>
                      <p className="text-xs text-white/80 mt-0.5">
                        All images and categories have been extracted and re-linked to your active workspace.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-center">
                      <div className="text-lg font-bold text-white font-mono">{importResult.imagesExtracted}</div>
                      <div className="text-[10px] text-white/50">Images Extracted to data/photos</div>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-center">
                      <div className="text-lg font-bold text-white font-mono">{importResult.categoriesCount}</div>
                      <div className="text-[10px] text-white/50">Categories Restored</div>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-center">
                      <div className="text-lg font-bold text-white font-mono">{importResult.presetsCount}</div>
                      <div className="text-[10px] text-white/50">Presets Restored</div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-lg shadow-emerald-500/30"
                    >
                      Done & Return to Studio
                    </button>
                  </div>
                </div>
              )}

              {/* Import Error Message */}
              {importError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 animate-fadeIn">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-rose-300">Import Failed</div>
                    <div className="text-xs text-white/80">{importError}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
