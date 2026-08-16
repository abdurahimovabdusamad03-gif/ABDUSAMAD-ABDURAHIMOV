import React from 'react';
import { useERP } from '../context/ERPContext';
import { translations } from '../translations';
import { NavTab } from '../types';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Users,
  Settings,
  Sparkles,
  X,
  Store,
  Handshake,
  LogOut,
  ShieldCheck,
  Truck,
} from 'lucide-react';

interface NavigationProps {
  onOpenAITaxlilchi: () => void;
  isMobileDrawerOpen?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  onOpenAITaxlilchi,
  isMobileDrawerOpen,
  onCloseMobileDrawer,
}) => {
  const { activeTab, setActiveTab, settings, currentUser, logout } = useERP();
  const t = translations[settings.language || 'uz'];

  const navItems: Array<{ id: NavTab; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'sotuv', label: t.sotuv, icon: ShoppingCart },
    { id: 'dokon_ombor', label: t.dokon_ombor, icon: Boxes },
    { id: 'kirim', label: t.kirim || "Kirim (Postavka)", icon: Truck },
    { id: 'sheriklar', label: settings.partnerTabName || "Sherik Do'konlar", icon: Handshake },
    { id: 'mijozlar', label: t.mijozlar, icon: Users },
    { id: 'sozlamalar', label: t.sozlamalar, icon: Settings },
  ];

  // Filter based on user permissions if role restricted
  const allowedItems = navItems.filter((item) => {
    if (!currentUser) return true;
    if (currentUser.role === 'admin') return true;
    return currentUser.allowedTabs.includes(item.id);
  });

  const handleTabClick = (tabId: NavTab) => {
    setActiveTab(tabId);
    if (onCloseMobileDrawer) onCloseMobileDrawer();
  };

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 p-4 min-h-[calc(100vh-4rem)] transition-colors duration-200">
        <div className="space-y-1.5 flex-1">
          <div className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t.main_menu}
          </div>

          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-black transition-all duration-150 group active:translate-y-0.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-slate-950 border-b-4 border-amber-700 shadow-lg shadow-amber-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 border-b-2 border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive
                      ? 'text-slate-950'
                      : 'text-slate-500 dark:text-slate-400 group-hover:text-amber-500'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom Section: User Status & AI Card */}
        <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
          {/* Active User Card & Logout */}
          {currentUser && (
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider truncate">
                    {currentUser.role === 'admin' ? 'ADMIN' : currentUser.role === 'warehouse_manager' ? 'OMBORCHI' : 'KASSIR'}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white transition-colors shrink-0"
                title="Tizimdan chiqish"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* AI Taxlilchi Quick Card in Sidebar */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-50 dark:from-indigo-950/80 via-white dark:via-slate-900 to-purple-50 dark:to-purple-950/80 border border-indigo-200 dark:border-indigo-500/30 text-slate-800 dark:text-slate-200 text-xs shadow-md relative overflow-hidden">
            <div className="flex items-center gap-1.5 mb-1.5 font-bold text-indigo-600 dark:text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
              <span className="text-xs">{t.ai_analyst}</span>
            </div>
            <button
              onClick={onOpenAITaxlilchi}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-[11px] border-b-2 sm:border-b-4 border-indigo-900 shadow-md active:translate-y-0.5 flex items-center justify-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{t.open_ai_analyst}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE SLIDE-OVER DRAWER MENU (Opened when 3-line hamburger in Header is clicked) */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={onCloseMobileDrawer}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in"
          />

          {/* Drawer side panel */}
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 flex items-center justify-center shadow-md shrink-0">
                  <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-amber-400 font-extrabold text-xs overflow-hidden">
                    <img
                      src={settings.storeLogoUrl || '/icon-192.png'}
                      alt="Logo"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/icon.png';
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1">
                    {settings.storeName || 'GRAND OPTOM'}
                  </div>
                  <div className="text-[10px] text-amber-500 font-bold">ERP Tizimi</div>
                </div>
              </div>

              <button
                onClick={onCloseMobileDrawer}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav links */}
            <div className="space-y-1.5 flex-1 overflow-y-auto">
              <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Bo'limlar
              </div>

              {allowedItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Drawer Footer: User Profile & Quick launch */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              {currentUser && (
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {currentUser.name}
                      </div>
                      <div className="text-[9px] font-black uppercase text-amber-500 tracking-wider truncate">
                        {currentUser.role === 'admin' ? 'ADMIN' : currentUser.role === 'warehouse_manager' ? 'OMBORCHI' : 'KASSIR'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      if (onCloseMobileDrawer) onCloseMobileDrawer();
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-500 text-white font-bold text-[10px] flex items-center gap-1 active:scale-95 shadow-sm"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Chiqish</span>
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  onOpenAITaxlilchi();
                  if (onCloseMobileDrawer) onCloseMobileDrawer();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>{t.ai_analyst}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION (Android / iOS native bar style) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800/90 px-1 pt-1 pb-[calc(env(safe-area-inset-bottom,0px)+6px)] shadow-2xl transition-colors duration-200">
        <div className="flex items-center justify-between w-full max-w-lg mx-auto gap-0.5">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-amber-500 font-black scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                }`}
              >
                <div
                  className={`p-1 rounded-lg transition-colors ${
                    isActive ? 'bg-amber-500/20 shadow-sm shadow-amber-500/30' : ''
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                </div>
                <span className="text-[9px] xs:text-[10px] mt-0.5 tracking-tighter truncate max-w-full text-center leading-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

