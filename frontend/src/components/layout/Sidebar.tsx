import React, { useState } from 'react';
import {
  Home,
  FolderOpen,
  Image as ImageIcon,
  ScanLine,
  Bot,
  Sparkles,
  Clock,
  Bookmark,
  Cloud,
  Zap,
  HardDrive,
  Gift,
  Presentation,
  QrCode,
  Languages,
  Archive,
  GitCompare,
  FileBox,
  PenLine,
  Wand2,
  Video,
  AudioWaveform,
  ChevronDown,
  ChevronRight,
  Eye,
  Download,
  Plus,
  FileSpreadsheet,
  FileText,
  Trash2,
  ExternalLink,
  Workflow
} from 'lucide-react';
import { FileItem, StorageInfo } from '../../types';
import { cleanFileName, formatBytes, getFileTypeBadge } from '../../utils/formatters';

export type SidebarTab =
  | 'home'
  | 'file-studio'
  | 'workflow-builder'
  | 'ai-writer'
  | 'ai-translator'
  | 'ai-doc-compare'
  | 'watermark-remover'
  | 'ai-presentation-generator'
  | 'ai-assistant'
  | 'image-tools'
  | 'video-frame-studio'
  | 'audio-tools'
  | 'ocr-extract'
  | 'file-compressor'
  | 'pdf-tools'
  | 'pdf-signer'
  | 'universal-qr'
  | 'generators'
  | 'recent-files'
  | 'saved-files'
  | 'cloud-storage'
  // Legacy routes kept for redirect support (not shown in sidebar)
  | 'image-converter'
  | 'document-converter'
  | 'profile'
  | 'settings'
  | 'help';

interface SidebarProps {
  activeTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
  storageInfo: StorageInfo;
  onOpenUpgrade: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  recentFiles?: FileItem[];
  onPreviewFile?: (file: FileItem) => void;
  onDownloadFile?: (file: FileItem) => void;
  onDeleteFile?: (fileId: string) => void;
}

interface NavItem {
  id: SidebarTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: 'new' | 'hot' | 'ai';
}

const WORKSPACE_ITEMS: NavItem[] = [
  { id: 'file-studio', label: 'Universal File Studio', icon: FolderOpen },
  { id: 'workflow-builder', label: 'Workflow Builder', icon: Workflow, badge: 'HOT', badgeVariant: 'hot' },
];

const AI_TOOLS_ITEMS: NavItem[] = [
  { id: 'ai-writer', label: 'AI Writer', icon: PenLine, badge: 'NEW', badgeVariant: 'new' },
  { id: 'ai-translator', label: 'AI Translator', icon: Languages, badge: 'HOT', badgeVariant: 'hot' },
  { id: 'ai-doc-compare', label: 'AI Doc Comparison', icon: GitCompare, badge: 'NEW', badgeVariant: 'new' },
  { id: 'watermark-remover', label: 'AI Watermark Remover', icon: Wand2, badgeVariant: 'ai' },
  { id: 'ai-presentation-generator', label: 'AI Presentation Gen', icon: Presentation, badge: 'NEW', badgeVariant: 'new' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, badgeVariant: 'ai' },
];

const MEDIA_TOOLS_ITEMS: NavItem[] = [
  { id: 'image-tools', label: 'Image Studio', icon: ImageIcon, badge: 'PRO', badgeVariant: 'hot' },
  { id: 'video-frame-studio', label: 'Video Studio', icon: Video, badge: 'HOT', badgeVariant: 'hot' },
  { id: 'audio-tools', label: 'Universal Audio & Voice Studio', icon: AudioWaveform, badge: 'AI', badgeVariant: 'ai' },
  { id: 'ocr-extract', label: 'OCR & Extract', icon: ScanLine },
];

const UTILITY_ITEMS: NavItem[] = [
  { id: 'cloud-storage', label: 'Cloud & URL Ingest', icon: Cloud, badge: 'HOT', badgeVariant: 'hot' },
  { id: 'file-compressor', label: 'File Compressor', icon: Archive, badge: 'NEW', badgeVariant: 'new' },
  { id: 'pdf-tools', label: 'PDF Tools', icon: FileBox, badge: 'HOT', badgeVariant: 'hot' },
  { id: 'pdf-signer', label: 'PDF E-Sign Studio', icon: PenLine, badge: 'HOT', badgeVariant: 'hot' },
  { id: 'universal-qr', label: 'QR Studio', icon: QrCode, badge: 'HOT', badgeVariant: 'hot' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  storageInfo,
  onOpenUpgrade,
  isOpenMobile,
  onCloseMobile,
  recentFiles = [],
  onPreviewFile,
  onDownloadFile,
  onDeleteFile
}) => {
  const [isRecentExpanded, setIsRecentExpanded] = useState(true);

  const handleSelect = (tab: SidebarTab) => {
    onSelectTab(tab);
    onCloseMobile?.();
  };

  const getBadgeClasses = (variant?: string) => {
    switch (variant) {
      case 'hot':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300';
      case 'ai':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400';
      case 'new':
      default:
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400';
    }
  };

  const getFileFormatIcon = (ext?: string) => {
    const e = (ext || '').toUpperCase();
    if (e === 'PDF') return <FileText className="w-3.5 h-3.5 text-rose-500" />;
    if (['DOCX', 'DOC', 'TXT', 'RTF'].includes(e)) return <FileText className="w-3.5 h-3.5 text-blue-500" />;
    if (['PPTX', 'PPT'].includes(e)) return <Presentation className="w-3.5 h-3.5 text-amber-500" />;
    if (['XLSX', 'XLS', 'CSV'].includes(e)) return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />;
    if (['JPG', 'JPEG', 'PNG', 'WEBP', 'SVG'].includes(e)) return <ImageIcon className="w-3.5 h-3.5 text-purple-500" />;
    return <FileBox className="w-3.5 h-3.5 text-slate-500" />;
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = activeTab === item.id;
    const Icon = item.icon;

    return (
      <button
        key={item.id}
        onClick={() => handleSelect(item.id)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group select-none ${
          isActive
            ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 font-semibold'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon
            className={`w-4 h-4 flex-shrink-0 transition-colors ${
              isActive
                ? 'text-brand-600 dark:text-brand-400'
                : item.badgeVariant === 'ai'
                ? 'text-purple-500 dark:text-purple-400 group-hover:text-purple-600'
                : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
            }`}
          />
          <span className="truncate">{item.label}</span>
        </div>

        {item.badge ? (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${getBadgeClasses(item.badgeVariant)}`}>
            {item.badge}
          </span>
        ) : item.badgeVariant === 'ai' ? (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${getBadgeClasses('ai')}`}>
            AI
          </span>
        ) : null}
      </button>
    );
  };

  const renderSection = (label: string, items: NavItem[]) => (
    <div>
      <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {label}
      </div>
      <div className="space-y-0.5">
        {items.map(renderNavItem)}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:sticky top-16 z-30 h-[calc(100vh-4rem)] w-64 flex-shrink-0 flex flex-col justify-between border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition-transform duration-200 overflow-hidden ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Scrollable nav area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">

          {/* WORKSPACE section — Dashboard, Universal File Studio, Workflow Builder */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Workspace
            </div>
            <div className="space-y-0.5">
              {/* Dashboard */}
              <button
                onClick={() => handleSelect('home')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all select-none ${
                  activeTab === 'home'
                    ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Home className={`w-4 h-4 flex-shrink-0 ${activeTab === 'home' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                <span>Dashboard</span>
              </button>

              {/* Workspace Items (Universal File Studio + Workflow Builder) */}
              {WORKSPACE_ITEMS.map(renderNavItem)}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100 dark:border-slate-800" />

          {renderSection('AI Tools', AI_TOOLS_ITEMS)}

          {/* Divider */}
          <div className="border-t border-slate-100 dark:border-slate-800" />

          {renderSection('File & Media Tools', MEDIA_TOOLS_ITEMS)}

          {/* Divider */}
          <div className="border-t border-slate-100 dark:border-slate-800" />

          {renderSection('Utility', UTILITY_ITEMS)}

          {/* Divider */}
          <div className="border-t border-slate-100 dark:border-slate-800" />

          {/* MY FILES SECTION with ACTIVE RECENT FILES ROLE */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center justify-between">
              <span>My Files</span>
              {recentFiles.length > 0 && (
                <span className="text-[9px] font-bold text-slate-400">
                  {recentFiles.length} item{recentFiles.length === 1 ? '' : 's'}
                </span>
              )}
            </div>

            <div className="space-y-0.5">
              {/* Recent Files Main Item */}
              <div className="space-y-1">
                <div
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group select-none ${
                    activeTab === 'recent-files'
                      ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <button
                    onClick={() => handleSelect('recent-files')}
                    className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                  >
                    <Clock
                      className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        activeTab === 'recent-files'
                          ? 'text-brand-600 dark:text-brand-400'
                          : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      }`}
                    />
                    <span className="truncate">Recent Files</span>
                  </button>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                      {recentFiles.length}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsRecentExpanded(!isRecentExpanded);
                      }}
                      className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title={isRecentExpanded ? 'Collapse recent files' : 'Expand recent files'}
                    >
                      {isRecentExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Sub-list of Recent Files in Sidebar */}
                {isRecentExpanded && recentFiles.length > 0 && (
                  <div className="pl-3 pr-1 py-1 space-y-1 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    {recentFiles.slice(0, 4).map((file) => {
                      const cleanName = cleanFileName(file.name);
                      return (
                        <div
                          key={file.id}
                          onClick={() => {
                            if (onPreviewFile) {
                              onPreviewFile(file);
                            } else {
                              handleSelect('recent-files');
                            }
                          }}
                          className="group flex items-center justify-between p-1.5 rounded-lg text-xs hover:bg-white dark:hover:bg-slate-800 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                          title={`${cleanName} (${formatBytes(file.size)})`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="flex-shrink-0">
                              {getFileFormatIcon(file.extension)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400">
                                {cleanName}
                              </p>
                              <p className="text-[9px] text-slate-400 leading-none">
                                {file.extension} • {formatBytes(file.size)}
                              </p>
                            </div>
                          </div>

                          {/* Quick action buttons on hover */}
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 flex-shrink-0 transition-opacity">
                            {onPreviewFile && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPreviewFile(file);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                title="Preview file"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                            )}
                            {onDownloadFile && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDownloadFile(file);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-brand-600 dark:hover:text-brand-400"
                                title="Download file"
                              >
                                <Download className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <div className="pt-1 flex items-center justify-between px-1 text-[10px]">
                      <button
                        onClick={() => handleSelect('recent-files')}
                        className="text-brand-600 dark:text-brand-400 hover:underline font-bold"
                      >
                        View all {recentFiles.length} &rarr;
                      </button>
                      <button
                        onClick={() => handleSelect('file-studio')}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-0.5"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Saved Files */}
              <button
                onClick={() => handleSelect('saved-files')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all select-none ${
                  activeTab === 'saved-files'
                    ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Bookmark className={`w-4 h-4 flex-shrink-0 ${activeTab === 'saved-files' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                <span>Saved Files</span>
              </button>

              {/* Cloud Storage */}
              <button
                onClick={() => handleSelect('cloud-storage')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all select-none ${
                  activeTab === 'cloud-storage'
                    ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Cloud className={`w-4 h-4 flex-shrink-0 ${activeTab === 'cloud-storage' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                <span>Cloud Storage</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Storage Usage Card */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-2xl bg-gradient-to-b from-slate-50/90 to-indigo-50/40 dark:from-slate-800/90 dark:to-indigo-950/30 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">

            {/* Header Row */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                Storage
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                {storageInfo.usedFormatted} / {storageInfo.totalFormatted}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(1.5, storageInfo.percentage)}%` }}
              />
            </div>

            {/* Free Badge */}
            <div className="flex items-center justify-between text-[10px]">
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                <Gift className="w-3 h-3 text-emerald-500" />
                {storageInfo.totalFormatted} Free
              </span>
              <span className="text-slate-400 font-medium">{storageInfo.percentage}% used</span>
            </div>

            {/* Upgrade Button */}
            <button
              onClick={onOpenUpgrade}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white text-xs font-bold shadow-sm transition-all hover:shadow-md hover:shadow-brand-500/20 select-none"
            >
              <Zap className="w-3 h-3" />
              <span>Manage Storage</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
