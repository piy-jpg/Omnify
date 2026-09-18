import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Moon, 
  Sun, 
  ChevronDown, 
  Sparkles, 
  Command, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  LogOut, 
  Settings, 
  User, 
  ExternalLink,
  Crown,
  Gift,
  Menu,
  Smartphone,
  Workflow,
  HardDrive,
  Cloud,
  Layers,
  ArrowRight,
  Check,
  Trash2,
  FolderOpen
} from 'lucide-react';
import { UserNotification, StorageInfo } from '../../types';
import { OmnifyLogo } from '../common/OmnifyLogo';

interface NavbarProps {
  userName?: string;
  userEmail?: string;
  storageInfo?: StorageInfo;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenProfile?: () => void;
  onOpenUpgrade: () => void;
  onOpenWorkflowBuilder?: () => void;
  onOpenCloudStorage?: () => void;
  onLogout?: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  notifications: UserNotification[];
  onMarkNotificationRead: (id: string) => void;
  onClearNotifications?: () => void;
  onOpenMobileMenu?: () => void;
  onToggleMobilePreview?: () => void;
  isMobileMode?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  userName = 'Piyush Verma',
  userEmail = 'piyush.verma@example.com',
  storageInfo,
  onOpenSearch,
  onOpenSettings,
  onOpenProfile,
  onOpenUpgrade,
  onOpenWorkflowBuilder,
  onOpenCloudStorage,
  onLogout,
  isDark,
  onToggleTheme,
  notifications,
  onMarkNotificationRead,
  onClearNotifications,
  onOpenMobileMenu,
  onToggleMobilePreview,
  isMobileMode
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = notifications.filter(n => {
    if (notifFilter === 'unread') return !n.read;
    return true;
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    notifications.forEach(n => {
      if (!n.read) onMarkNotificationRead(n.id);
    });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl transition-all duration-200">
      
      {/* Top subtle 1px gradient accent bar */}
      <div className="h-[2px] w-full bg-gradient-to-r from-sky-400 via-indigo-500 via-purple-500 to-pink-500" />

      <div className="flex h-16 items-center justify-between px-3 sm:px-6 lg:px-8 max-w-[1680px] mx-auto gap-2 sm:gap-4">
        
        {/* 1. Left: Mobile Drawer Trigger + Omnify Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="p-2 rounded-2xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-all active:scale-95"
              aria-label="Open mobile navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <OmnifyLogo size="md" />
          </div>
        </div>

        {/* 2. Center: Large Interactive Search Omnibar */}
        <div className="flex-1 max-w-2xl mx-2 sm:mx-6">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm bg-slate-100/90 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800/95 border border-slate-200/90 dark:border-slate-700/80 hover:border-brand-400 dark:hover:border-brand-500/50 text-slate-500 dark:text-slate-400 shadow-xs hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 truncate">
              <div className="p-1 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 group-hover:bg-brand-500/10 dark:group-hover:bg-brand-400/10 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors shrink-0">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" />
              </div>
              <span className="truncate text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                Search tools, AI models, convert, split, summarize...
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 shadow-2xs">
                ⌘K
              </span>
            </div>
          </button>
        </div>

        {/* 3. Right: Action Cluster (Storage, Simulator, Theme, Notifications, User Profile) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* Cloud Storage / Quota Indicator Pill */}
          <button
            onClick={onOpenUpgrade}
            title="100% Free Lifetime Storage"
            className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors shadow-2xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>100GB Free Pass</span>
          </button>

          {/* Interactive Mobile Simulator Toggle */}
          {onToggleMobilePreview && (
            <button
              onClick={onToggleMobilePreview}
              title="Toggle Interactive Mobile Simulator"
              className={`p-2 rounded-2xl border text-xs font-bold transition-all ${
                isMobileMode
                  ? 'bg-indigo-500 text-white border-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-2xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* Smart Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-2xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500 ring-2 ring-white dark:ring-slate-900" />
                </span>
              )}
            </button>

            {/* Notifications Popover Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                
                {/* Popover Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-mono font-bold bg-brand-500 text-white px-2 py-0.5 rounded-full">
                        {unreadCount} NEW
                      </span>
                    )}
                  </div>

                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 p-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold bg-white dark:bg-slate-900">
                  <button
                    onClick={() => setNotifFilter('all')}
                    className={`px-3 py-1 rounded-xl transition-all ${
                      notifFilter === 'all'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    onClick={() => setNotifFilter('unread')}
                    className={`px-3 py-1 rounded-xl transition-all ${
                      notifFilter === 'unread'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>

                {/* Notification Items List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 space-y-1">
                      <Bell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                      <p className="text-xs font-semibold">No notifications</p>
                    </div>
                  ) : (
                    filteredNotifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => onMarkNotificationRead(n.id)}
                        className={`p-3.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${
                          !n.read ? 'bg-brand-50/30 dark:bg-brand-950/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`font-bold text-slate-900 dark:text-slate-100 ${!n.read ? 'text-brand-600 dark:text-brand-400' : ''}`}>
                            {n.title}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">{n.time}</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}
          </div>

          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5 sm:mx-1" />

          {/* 4. User Workspace Profile Avatar & Dropdown */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 pl-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group text-left"
            >
              {/* Initials Avatar with online presence badge */}
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
                  {userName
                    ? userName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                    : 'OM'}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </div>

              <div className="hidden md:block">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block leading-tight">
                  {userName}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold block leading-tight">
                  Free Lifetime Pro
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform" />
            </button>

            {/* Profile Dropdown Menu Card */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2.5 w-64 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                
                {/* Account Details */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 space-y-1">
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">{userName}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
                  <div className="pt-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      <ShieldCheck className="w-3 h-3" /> 100% Free Lifetime Pass
                    </span>
                  </div>
                </div>

                {/* Quick Storage Status Bar */}
                <div 
                  onClick={() => { setShowUserMenu(false); onOpenCloudStorage ? onOpenCloudStorage() : onOpenUpgrade(); }}
                  className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 space-y-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  title="Click to view Cloud Storage"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Cloud className="w-3 h-3 text-sky-500" /> Storage
                    </span>
                    <span className="text-brand-600 dark:text-brand-400 font-mono">
                      {storageInfo ? `${storageInfo.usedFormatted} / ${storageInfo.totalFormatted}` : '0.24 GB / 100 GB'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-brand-500 rounded-full transition-all duration-300" 
                      style={{ width: `${storageInfo ? Math.max(storageInfo.percentage, 1) : 1}%` }}
                    />
                  </div>
                </div>

                {/* Menu Navigation Links */}
                <div className="py-1 px-1.5 space-y-0.5">
                  <button
                    onClick={() => { setShowUserMenu(false); onOpenUpgrade(); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 font-bold transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Gift className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Free Pass &amp; Bonus Storage</span>
                    </div>
                    <ArrowRight className="w-3 h-3 shrink-0" />
                  </button>

                  {onOpenWorkflowBuilder && (
                    <button
                      onClick={() => { setShowUserMenu(false); onOpenWorkflowBuilder(); }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Workflow className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                        <span>Workflow Studio</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500 font-mono font-bold">NEW</span>
                    </button>
                  )}

                  <button
                    onClick={() => { setShowUserMenu(false); onOpenSettings(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors text-left"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Account Settings</span>
                  </button>

                  <button
                    onClick={() => { 
                      setShowUserMenu(false); 
                      if (onOpenProfile) onOpenProfile(); 
                      else onOpenSettings(); 
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors text-left"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Profile &amp; Security</span>
                  </button>
                </div>

                {/* Log out action */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-1 px-1.5">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      if (onLogout) {
                        onLogout();
                      } else {
                        window.location.reload();
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span>Log Out</span>
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};

