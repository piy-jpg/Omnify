import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, SidebarTab } from './components/layout/Sidebar';
import { DashboardHero } from './components/dashboard/DashboardHero';
import { PopularTools } from './components/dashboard/PopularTools';
import { AllToolsSection } from './components/dashboard/AllToolsSection';
import { AIFeaturesSection } from './components/dashboard/AIFeaturesSection';
import { TrustSecuritySection } from './components/dashboard/TrustSecuritySection';
import { ConversionModal } from './components/conversion/ConversionModal';
import { AIAssistantView } from './components/ai/AIAssistantView';
import { DocumentGeneratorModal } from './components/generators/DocumentGeneratorModal';
import { FileManagerView } from './components/files/FileManagerView';
import { CommandPalette } from './components/search/CommandPalette';
import { UpgradeModal } from './components/pricing/UpgradeModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { FilePreviewModal } from './components/files/FilePreviewModal';
import { MobilePreviewModal } from './components/mobile/MobilePreviewModal';
import { MobileDeviceFrameView } from './components/mobile/MobileDeviceFrameView';
import { HardDrive, Zap, Sparkles, ShieldCheck } from 'lucide-react';

// Dedicated Pages
import { AIDocumentComparisonPage } from './pages/AIDocumentComparisonPage';
import { AITranslatorPage } from './pages/AITranslatorPage';
import { SmartCompressorPage } from './pages/SmartCompressorPage';
import { ImageConverterPage } from './pages/ImageConverterPage';
import { DocumentConverterPage } from './pages/DocumentConverterPage';
import { PdfToolsPage } from './pages/PdfToolsPage';
import { OcrExtractPage } from './pages/OcrExtractPage';
import { ImageToolsPage } from './pages/ImageToolsPage';
import { VideoFrameStudioPage } from './pages/VideoFrameStudioPage';
import { AudioToolsPage } from './pages/AudioToolsPage';
import { DocumentGeneratorsPage } from './pages/DocumentGeneratorsPage';
import { AIPresentationGeneratorPage } from './pages/AIPresentationGeneratorPage';
import { UniversalQrGeneratorPage } from './pages/UniversalQrGeneratorPage';
import { WatermarkRemoverPage } from './pages/WatermarkRemoverPage';
import { AIWriterPage } from './pages/AIWriterPage';
import { DigitalSignaturePage } from './pages/DigitalSignaturePage';
import { QrPublicSharePage } from './pages/QrPublicSharePage';
import { CloudStoragePage } from './pages/CloudStoragePage';
import { SavedFilesPage } from './pages/SavedFilesPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpSupportPage } from './pages/HelpSupportPage';
import { FileStudioPage } from './pages/FileStudioPage';
import { WorkflowBuilderPage } from './pages/WorkflowBuilderPage';

import { TOOLS_DATA } from './data/toolsData';
import { INITIAL_RECENT_FILES, INITIAL_STORAGE, INITIAL_NOTIFICATIONS } from './data/sampleFiles';
import { ToolItem, FileItem, StorageInfo, UserNotification } from './types';

// Authentication
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { OtpVerificationPage } from './pages/auth/OtpVerificationPage';
import { LogoutConfirmModal } from './components/auth/LogoutConfirmModal';

function extractShareIdFromLocation(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Check hash: #/qr/share/:id or #/share/:id or #sh-xxx
  const hash = window.location.hash || '';
  if (hash.includes('share')) {
    const hashMatch = hash.match(/share\/([a-zA-Z0-9_-]+)/);
    if (hashMatch) return hashMatch[1];
  }
  if (hash.startsWith('#sh-')) {
    return hash.replace('#', '');
  }

  // 2. Check pathname: /qr/share/:id or /share/:id
  const path = window.location.pathname || '';
  if (path.includes('share')) {
    const pathMatch = path.match(/share\/([a-zA-Z0-9_-]+)/);
    if (pathMatch) return pathMatch[1];
  }

  // 3. Check search params: ?shareId=:id or ?qr=:id or ?share=:id
  const params = new URLSearchParams(window.location.search || '');
  const queryShareId = params.get('shareId') || params.get('qr') || params.get('share');
  if (queryShareId) return queryShareId;

  return null;
}

function MainAppContent() {
  const { user, isAuthenticated, isLoading: isAuthLoading, logout, pendingFlow } = useAuth();

  // Auth Screen state: 'login' | 'register' | 'otp'
  const [authScreen, setAuthScreen] = useState<'login' | 'register' | 'otp'>(() => {
    if (typeof window === 'undefined') return 'login';
    const hash = window.location.hash || '';
    if (hash.includes('register')) return 'register';
    if (hash.includes('verify-otp') || hash.includes('otp')) return 'otp';
    return 'login';
  });

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [welcomeToast, setWelcomeToast] = useState<{ show: boolean; name: string } | null>(null);
  // Direct Public QR Share Route (hash, path, or query params)
  const [publicShareId, setPublicShareId] = useState<string | null>(extractShareIdFromLocation);

  useEffect(() => {
    const handleUrlChange = () => {
      setPublicShareId(extractShareIdFromLocation());
      const hash = window.location.hash || '';
      // Legacy redirects
      if (hash.includes('document-converter')) { setActiveTab('file-studio'); return; }
      if (hash.includes('image-converter')) { setActiveTab('file-studio'); return; }
      if (hash.includes('file-studio')) { setActiveTab('file-studio'); return; }
      if (hash.includes('workflow') || hash.includes('pipeline')) setActiveTab('workflow-builder');
      else if (hash.includes('compare') || hash.includes('comparison')) setActiveTab('ai-doc-compare');
      else if (hash.includes('compressor') || hash.includes('compress')) setActiveTab('file-compressor');
      else if (hash.includes('ai-writer') || hash.includes('writer')) setActiveTab('ai-writer');
      else if (hash.includes('watermark')) setActiveTab('watermark-remover');
      else if (hash.includes('qr-generator') || hash.includes('universal-qr')) setActiveTab('universal-qr');
      else if (hash.includes('presentation')) setActiveTab('ai-presentation-generator');
      else if (hash.includes('audio') || hash.includes('voice')) setActiveTab('audio-tools');
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // Navigation & Theme
  const [activeTab, setActiveTab] = useState<SidebarTab>(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash || '' : '';
    // Legacy redirects to file-studio
    if (hash.includes('document-converter')) return 'file-studio';
    if (hash.includes('image-converter')) return 'file-studio';
    if (hash.includes('file-studio')) return 'file-studio';
    if (hash.includes('workflow') || hash.includes('pipeline')) return 'workflow-builder';
    if (hash.includes('compare') || hash.includes('comparison')) return 'ai-doc-compare';
    if (hash.includes('compressor') || hash.includes('compress')) return 'file-compressor';
    if (hash.includes('ai-writer') || hash.includes('writer')) return 'ai-writer';
    if (hash.includes('watermark')) return 'watermark-remover';
    if (hash.includes('qr-generator') || hash.includes('universal-qr')) return 'universal-qr';
    if (hash.includes('presentation')) return 'ai-presentation-generator';
    if (hash.includes('video-frame')) return 'video-frame-studio';
    if (hash.includes('audio') || hash.includes('voice')) return 'audio-tools';
    if (hash.includes('ocr')) return 'ocr-extract';
    if (hash.includes('signer') || hash.includes('signature') || hash.includes('esign')) return 'pdf-signer';
    if (hash.includes('pdf')) return 'pdf-tools';
    return 'home';
  });
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const [isMobileMode, setIsMobileMode] = useState<boolean>(() => {
    return window.location.search.includes('mobile') || window.location.hash.includes('mobile');
  });

  // Files & Storage Data
  const [recentFiles, setRecentFiles] = useState<FileItem[]>(() => {
    const saved = localStorage.getItem('convertpro_files');
    return saved ? JSON.parse(saved) : INITIAL_RECENT_FILES;
  });

  const [storageInfo, setStorageInfo] = useState<StorageInfo>(() => {
    const saved = localStorage.getItem('convertpro_storage');
    return saved ? JSON.parse(saved) : INITIAL_STORAGE;
  });

  const [notifications, setNotifications] = useState<UserNotification[]>(INITIAL_NOTIFICATIONS);

  // Modals state
  const [selectedToolForConversion, setSelectedToolForConversion] = useState<ToolItem | null>(null);
  const [uploadedFilesForConversion, setUploadedFilesForConversion] = useState<File[]>([]);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  // Synchronize dark theme class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Persist files and storage in local storage
  useEffect(() => {
    localStorage.setItem('convertpro_files', JSON.stringify(recentFiles));
  }, [recentFiles]);

  useEffect(() => {
    localStorage.setItem('convertpro_storage', JSON.stringify(storageInfo));
  }, [storageInfo]);

  const handleToggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleSelectTab = (tab: SidebarTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToolSelect = (tool: ToolItem) => {
    // Dedicated page routes
    if (tool.id === 'workflow-builder') {
      setActiveTab('workflow-builder');
      return;
    }
    if (tool.id === 'file-compressor' || tool.id === 'smart-compressor') {
      setActiveTab('file-compressor');
      return;
    }
    if (tool.id === 'ai-translator') {
      setActiveTab('ai-translator');
      return;
    }
    if (tool.id === 'ai-doc-assistant') {
      setActiveTab('ai-assistant');
      return;
    }
    if (tool.id === 'doc-generator') {
      setActiveTab('generators');
      return;
    }
    if (tool.id === 'video-frame-studio') {
      setActiveTab('video-frame-studio');
      return;
    }
    if (tool.id === 'ai-presentation-generator') {
      setActiveTab('ai-presentation-generator');
      return;
    }
    if (tool.id === 'universal-qr') {
      setActiveTab('universal-qr');
      return;
    }
    if (tool.id === 'ai-writer') {
      setActiveTab('ai-writer');
      return;
    }
    if (tool.id === 'ai-watermark-remover' || tool.id === 'watermark-remover') {
      setActiveTab('watermark-remover');
      return;
    }
    if (tool.id === 'ai-doc-compare') {
      setActiveTab('ai-doc-compare');
      return;
    }
    // All file conversion tools go to ConversionModal (via Universal File Studio or directly)
    setUploadedFilesForConversion([]);
    setSelectedToolForConversion(tool);
  };

  const handleHeroUploadDrop = (files: FileList) => {
    if (files.length === 0) return;
    // Route dropped files directly to Universal File Studio
    setActiveTab('file-studio');
  };

  const handleConversionSuccess = (newFile: FileItem) => {
    setRecentFiles(prev => [newFile, ...prev]);
    const newNotif: UserNotification = {
      id: `notif-${Date.now()}`,
      title: 'File Converted Successfully',
      message: `"${newFile.name}" is now ready for use.`,
      time: 'Just now',
      type: 'conversion',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleDeleteFile = (fileId: string) => {
    setRecentFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleDownloadFile = (file: FileItem) => {
    if (file.previewUrl) {
      const a = document.createElement('a');
      a.href = file.previewUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const blob = new Blob([`Sample content for ${file.name}`], { type: file.type || 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleQuickAction = (actionId: string) => {
    if (actionId === 'upload-generic') {
      const tool = TOOLS_DATA[0];
      setSelectedToolForConversion(tool);
    } else {
      const tool = TOOLS_DATA.find(t => t.id === actionId) || TOOLS_DATA[0];
      setSelectedToolForConversion(tool);
    }
  };

  const handleUpdateStorageQuota = (newQuotaGb: number) => {
    const totalBytes = newQuotaGb * 1024 * 1024 * 1024;
    const formatted = newQuotaGb >= 1000 ? `${newQuotaGb / 1000} TB` : `${newQuotaGb} GB`;
    const percent = Math.round((storageInfo.usedBytes / totalBytes) * 100);

    setStorageInfo(prev => ({
      ...prev,
      totalBytes,
      totalFormatted: formatted,
      percentage: Math.max(1, percent)
    }));

    const notif: UserNotification = {
      id: `notif-storage-${Date.now()}`,
      title: 'Storage Quota Expanded',
      message: `Your workspace storage capacity was successfully upgraded to ${formatted}!`,
      time: 'Just now',
      type: 'feature',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const currentQuotaNumber = Math.round(storageInfo.totalBytes / (1024 * 1024 * 1024));
  const popularTools = TOOLS_DATA.filter(t => t.popular);

  const renderAppContent = () => (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* Top Navbar */}
      <Navbar
        userName={user?.name || 'Piyush Verma'}
        userEmail={user?.email || 'piyush.verma@example.com'}
        storageInfo={storageInfo}
        onOpenSearch={() => setIsCommandPaletteOpen(true)}
        onOpenSettings={() => setActiveTab('settings')}
        onOpenProfile={() => setActiveTab('profile')}
        onOpenUpgrade={() => setIsUpgradeOpen(true)}
        onOpenWorkflowBuilder={() => setActiveTab('workflow-builder')}
        onOpenCloudStorage={() => setActiveTab('cloud-storage')}
        onLogout={() => {
          setIsLogoutModalOpen(true);
        }}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        notifications={notifications}
        onMarkNotificationRead={(id) => {
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        }}
        onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
        onToggleMobilePreview={() => setIsMobileMode(!isMobileMode)}
        isMobileMode={isMobileMode}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex w-full max-w-[1600px] mx-auto">
        
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          storageInfo={storageInfo}
          onOpenUpgrade={() => setIsUpgradeOpen(true)}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          recentFiles={recentFiles}
          onPreviewFile={(f) => setPreviewFile(f)}
          onDownloadFile={handleDownloadFile}
          onDeleteFile={handleDeleteFile}
        />

        {/* Center Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-8 overflow-y-auto">
          
          {/* PAGE 1: HOME DASHBOARD */}
          {activeTab === 'home' && (
            <>
              {/* Workspace Command Center Live Metrics Bar */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div 
                  onClick={() => setIsUpgradeOpen(true)}
                  className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-lg hover:-translate-y-0.5 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 group-hover:scale-110 transition-transform">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500">Cloud Storage</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {storageInfo.usedFormatted} / <span className="text-emerald-600 dark:text-emerald-400">{storageInfo.totalFormatted} Free</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300/40">
                    100% Free
                  </span>
                </div>

                <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between group hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/60 group-hover:scale-110 transition-transform">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500">GPU Turbo Engine</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        Parallel Client (0.38s avg)
                      </p>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                <div 
                  onClick={() => {
                    const el = document.getElementById('all-tools-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg hover:-translate-y-0.5 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500">Tool Suite</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        24+ Full Converters
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded-full border border-purple-300/40">
                    UNLOCKED
                  </span>
                </div>

                <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between group hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200/60 dark:border-cyan-800/60 group-hover:scale-110 transition-transform">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500">Data Protection</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        256-bit Auto-Purge Vault
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-300/40">
                    SOC2
                  </span>
                </div>
              </div>

              <DashboardHero
                userName={user?.name || 'Piyush Verma'}
                platformName="Omnify"
                onUploadClick={() => setSelectedToolForConversion(TOOLS_DATA[0])}
                onExploreClick={() => {
                  const el = document.getElementById('all-tools-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                onFileDrop={handleHeroUploadDrop}
                onQuickToolClick={(toolId) => {
                  if (toolId === 'ai-writer') setActiveTab('ai-writer');
                  else if (toolId === 'ai-translator') setActiveTab('ai-translator');
                  else if (toolId === 'file-compressor') setActiveTab('file-compressor');
                  else {
                    const tool = TOOLS_DATA.find(t => t.id === toolId) || TOOLS_DATA[0];
                    handleToolSelect(tool);
                  }
                }}
              />

              <PopularTools
                tools={popularTools}
                onSelectTool={handleToolSelect}
              />

              <AIFeaturesSection
                onOpenAIAssistant={() => setActiveTab('ai-assistant')}
                onOpenOCR={() => setActiveTab('ocr-extract')}
                onOpenGenerators={() => setActiveTab('generators')}
                onOpenTranslator={() => setActiveTab('ai-translator')}
                onOpenDocCompare={() => setActiveTab('ai-doc-compare')}
                onOpenPresentation={() => setActiveTab('ai-presentation-generator')}
                onOpenWatermarkRemover={() => setActiveTab('watermark-remover')}
                onOpenUniversalQr={() => setActiveTab('universal-qr')}
                onOpenAIWriter={() => setActiveTab('ai-writer')}
              />

              <div id="all-tools-section">
                <AllToolsSection
                  allTools={TOOLS_DATA}
                  onSelectTool={handleToolSelect}
                />
              </div>

              <TrustSecuritySection />
            </>
          )}

          {/* PAGE 1.4: AI DOCUMENT COMPARISON */}
          {activeTab === 'ai-doc-compare' && (
            <AIDocumentComparisonPage />
          )}

          {/* PAGE 1.5: AI TRANSLATOR */}
          {activeTab === 'ai-translator' && (
            <AITranslatorPage
              onFileConverted={handleConversionSuccess}
            />
          )}

          {/* PAGE 1.8: SMART FILE COMPRESSOR */}
          {activeTab === 'file-compressor' && (
            <SmartCompressorPage
              onFileConverted={handleConversionSuccess}
            />
          )}

          {/* Universal File Studio — primary conversion workspace */}
          {activeTab === 'file-studio' && (
            <FileStudioPage
              tools={TOOLS_DATA}
              onSelectTool={handleToolSelect}
              onFileConverted={handleConversionSuccess}
              onOpenAiDocCompare={() => setActiveTab('ai-doc-compare')}
              onOpenOcrExtract={() => setActiveTab('ocr-extract')}
            />
          )}

          {/* Universal Workflow Builder & Pipeline Studio */}
          {activeTab === 'workflow-builder' && (
            <WorkflowBuilderPage
              onFileGenerated={handleConversionSuccess}
              onOpenCloudStorage={() => setActiveTab('cloud-storage')}
            />
          )}

          {/* Legacy: IMAGE CONVERTER — redirect to file-studio */}
          {activeTab === 'image-converter' && (
            <ImageConverterPage
              tools={TOOLS_DATA}
              onSelectTool={handleToolSelect}
              onFileConverted={handleConversionSuccess}
            />
          )}

          {/* Legacy: DOCUMENT CONVERTER — redirect to file-studio */}
          {activeTab === 'document-converter' && (
            <DocumentConverterPage
              tools={TOOLS_DATA}
              onSelectTool={handleToolSelect}
              onFileConverted={handleConversionSuccess}
            />
          )}

          {/* PAGE 4: PDF TOOLS */}
          {activeTab === 'pdf-tools' && (
            <PdfToolsPage
              tools={TOOLS_DATA}
              onSelectTool={handleToolSelect}
              onFileConverted={handleConversionSuccess}
            />
          )}

          {/* PAGE 4.5: DIGITAL SIGNATURE & PDF E-SIGN STUDIO */}
          {activeTab === 'pdf-signer' && (
            <DigitalSignaturePage
              onFileSaved={handleConversionSuccess}
            />
          )}

          {/* PAGE 5: OCR & EXTRACT */}
          {activeTab === 'ocr-extract' && (
            <OcrExtractPage
              tools={TOOLS_DATA}
              onSelectTool={handleToolSelect}
              onFileConverted={handleConversionSuccess}
            />
          )}

          {/* PAGE 6: AI ASSISTANT VIEW */}
          {activeTab === 'ai-assistant' && (
            <AIAssistantView
              files={recentFiles}
              onUploadNewDoc={() => setSelectedToolForConversion(TOOLS_DATA[0])}
            />
          )}

          {/* PAGE 7: IMAGE TOOLS */}
          {activeTab === 'image-tools' && (
            <ImageToolsPage
              onSelectTool={handleToolSelect}
              onFileConverted={handleConversionSuccess}
              onOpenVideoFrameStudio={() => setActiveTab('video-frame-studio')}
            />
          )}

          {/* PAGE 7.5: VIDEO FRAME STUDIO */}
          {activeTab === 'video-frame-studio' && (
            <VideoFrameStudioPage
              onFileConverted={handleConversionSuccess}
            />
          )}

          {/* PAGE 7.6: UNIVERSAL AUDIO & VOICE STUDIO */}
          {activeTab === 'audio-tools' && (
            <AudioToolsPage
              onSelectTool={handleToolSelect}
              onFileConverted={handleConversionSuccess}
              onOpenAiAssistant={(contextText) => {
                setActiveTab('ai-assistant');
              }}
              onOpenVideoStudio={() => setActiveTab('video-frame-studio')}
            />
          )}

          {/* PAGE 8: DOCUMENT GENERATORS */}
          {activeTab === 'generators' && (
            <DocumentGeneratorsPage
              onFileGenerated={handleConversionSuccess}
              onOpenPresentationGenerator={() => setActiveTab('ai-presentation-generator')}
            />
          )}

          {/* PAGE 8.5: AI PRESENTATION GENERATOR */}
          {activeTab === 'ai-presentation-generator' && (
            <AIPresentationGeneratorPage
              onFileGenerated={handleConversionSuccess}
            />
          )}

          {/* PAGE 8.6: UNIVERSAL QR STUDIO */}
          {activeTab === 'universal-qr' && (
            <UniversalQrGeneratorPage />
          )}

          {/* PAGE 8.7: AI WATERMARK & OBJECT REMOVER */}
          {activeTab === 'watermark-remover' && (
            <WatermarkRemoverPage onFileSaved={handleConversionSuccess} />
          )}

          {/* PAGE 8.8: AI WRITER */}
          {activeTab === 'ai-writer' && (
            <AIWriterPage onFileSaved={handleConversionSuccess} />
          )}

          {/* PAGE 9: RECENT FILES */}
          {activeTab === 'recent-files' && (
            <FileManagerView
              files={recentFiles}
              storageInfo={storageInfo}
              onPreviewFile={(f) => setPreviewFile(f)}
              onDownloadFile={handleDownloadFile}
              onDeleteFile={handleDeleteFile}
              onUploadClick={() => setSelectedToolForConversion(TOOLS_DATA[0])}
              onOpenInAiAssistant={() => setActiveTab('ai-assistant')}
              onOpenInStudio={() => setActiveTab('file-studio')}
              onClearAllFiles={() => setRecentFiles([])}
            />
          )}

          {/* PAGE 10: SAVED FILES */}
          {activeTab === 'saved-files' && (
            <SavedFilesPage
              files={recentFiles}
              onPreviewFile={(f) => setPreviewFile(f)}
              onDownloadFile={handleDownloadFile}
              onDeleteFile={handleDeleteFile}
            />
          )}

          {/* PAGE 11: CLOUD & WEB INGESTION STUDIO */}
          {activeTab === 'cloud-storage' && (
            <CloudStoragePage
              storageInfo={storageInfo}
              onOpenUpgrade={() => setIsUpgradeOpen(true)}
              onFileConverted={handleConversionSuccess}
              onSelectTab={setActiveTab}
            />
          )}

          {/* PAGE 12: PROFILE */}
          {activeTab === 'profile' && (
            <ProfilePage
              onOpenUpgrade={() => setIsUpgradeOpen(true)}
            />
          )}

          {/* PAGE 13: SETTINGS */}
          {activeTab === 'settings' && (
            <SettingsPage />
          )}

          {/* PAGE 14: HELP & SUPPORT */}
          {activeTab === 'help' && (
            <HelpSupportPage />
          )}

        </main>
      </div>

      {/* Global Conversion Modal */}
      {selectedToolForConversion && (
        <ConversionModal
          tool={selectedToolForConversion}
          initialFiles={uploadedFilesForConversion}
          onClose={() => setSelectedToolForConversion(null)}
          onConversionSuccess={handleConversionSuccess}
        />
      )}

      {/* Command Palette (⌘ K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tools={TOOLS_DATA}
        recentFiles={recentFiles}
        onSelectTool={handleToolSelect}
        onSelectFile={(f) => setPreviewFile(f)}
      />

      {/* Upgrade Modal with Free Rewards Program */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        currentQuotaGb={currentQuotaNumber}
        onUpdateStorageQuota={handleUpdateStorageQuota}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownloadFile}
        onOpenWithAI={(f) => {
          setPreviewFile(null);
          setActiveTab('ai-assistant');
        }}
      />

      {/* Mobile Device Simulator Modal */}
      <MobilePreviewModal
        isOpen={isMobilePreviewOpen}
        onClose={() => setIsMobilePreviewOpen(false)}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        isLoading={isLoggingOut}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={async () => {
          setIsLoggingOut(true);
          try {
            await logout();
            setIsLogoutModalOpen(false);
            setAuthScreen('login');
            // Clean hash and state
            window.location.hash = '#/login';
          } finally {
            setIsLoggingOut(false);
          }
        }}
      />

      {/* Success Login / Account Ready Toast */}
      {welcomeToast?.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700">
            <span className="text-xl">🎉</span>
            <div>
              <p className="text-xs font-black text-white">Welcome to OMNIFY, {welcomeToast.name}!</p>
              <p className="text-[11px] text-emerald-400 font-bold">Your account &amp; workspace are ready.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  // If user scanned a QR code or navigated to public share link
  if (publicShareId) {
    return (
      <QrPublicSharePage
        key={publicShareId}
        shareId={publicShareId}
        onBackToApp={() => {
          window.location.hash = '';
          setPublicShareId(null);
        }}
      />
    );
  }

  // 1. Loading State during Session Check
  if (isAuthLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#EEF2FF] dark:bg-slate-950 text-slate-800 dark:text-white space-y-4">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400">Loading OMNIFY Workspace...</p>
      </div>
    );
  }

  // 2. Authentication Guards: If not authenticated, force Auth Screens
  if (!isAuthenticated) {
    if (authScreen === 'register') {
      return (
        <RegisterPage
          onNavigateLogin={() => {
            setAuthScreen('login');
            window.location.hash = '#/login';
          }}
          onSuccess={() => {
            setAuthScreen('login');
            window.location.hash = '#/dashboard';
            const currentName = user?.name || 'User';
            setWelcomeToast({ show: true, name: currentName });
            setTimeout(() => setWelcomeToast(null), 4000);
          }}
        />
      );
    }

    if (authScreen === 'otp') {
      return (
        <OtpVerificationPage
          onSuccess={() => {
            setAuthScreen('login');
            window.location.hash = '#/dashboard';
            const currentName = user?.name || 'User';
            setWelcomeToast({ show: true, name: currentName });
            setTimeout(() => setWelcomeToast(null), 4000);
          }}
          onBack={() => {
            setAuthScreen('login');
            window.location.hash = '#/login';
          }}
        />
      );
    }

    // Default to Login
    return (
      <LoginPage
        onNavigateRegister={() => {
          setAuthScreen('register');
          window.location.hash = '#/register';
        }}
        onNavigateOtp={() => {
          setAuthScreen('otp');
          window.location.hash = '#/verify-otp';
        }}
        onSuccess={() => {
          window.location.hash = '#/dashboard';
          const currentName = user?.name || 'User';
          setWelcomeToast({ show: true, name: currentName });
          setTimeout(() => setWelcomeToast(null), 4000);
        }}
      />
    );
  }

  // 3. Authenticated User - Render Dashboard / Mobile Frame
  if (isMobileMode) {
    return (
      <MobileDeviceFrameView
        onExitMobileView={() => setIsMobileMode(false)}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
      >
        {renderAppContent()}
      </MobileDeviceFrameView>
    );
  }

  return renderAppContent();
}

export function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;
