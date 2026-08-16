import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { translations } from '../translations';
import {
  Store,
  Calendar,
  Bell,
  Sparkles,
  AlertTriangle,
  Clock,
  Menu,
  ShieldCheck,
  LogOut,
  User,
  CheckCheck,
  Trash2,
  X,
} from 'lucide-react';

interface HeaderProps {
  onOpenAITaxlilchi: () => void;
  onOpenLoginModal: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAITaxlilchi,
  onOpenLoginModal,
  onToggleMobileMenu,
}) => {
  const {
    settings,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    clearAllNotifications,
    currentUser,
    logout,
  } = useERP();

  const [showNotifications, setShowNotifications] = useState(false);

  const t = translations[settings.language || 'uz'];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatHeaderDate = (date: Date, lang: string) => {
    const day = date.getDate();
    const year = date.getFullYear();
    const monthIdx = date.getMonth();
    const weekIdx = date.getDay();

    const uzMonths = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
    const uzDays = ['Yak', 'Dush', 'Sesh', 'Chor', 'Paysh', 'Juma', 'Shan'];

    const ruMonths = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const ruDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

    const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const enDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (lang === 'uz') {
      return `${day}-${uzMonths[monthIdx]}, ${year} (${uzDays[weekIdx]})`;
    } else if (lang === 'ru') {
      return `${day} ${ruMonths[monthIdx]} ${year} (${ruDays[weekIdx]})`;
    } else {
      return `${enDays[weekIdx]}, ${enMonths[monthIdx]} ${day}, ${year}`;
    }
  };

  const today = formatHeaderDate(new Date(), settings.language || 'uz');

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-sm transition-colors duration-200 pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-13 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4">
        
        {/* Left Side: Hamburger & Store Name */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-amber-500/10 hover:text-amber-500 transition-all border border-slate-200 dark:border-slate-700 active:scale-95 shrink-0"
              title="Menyuni ochish"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2.5 group cursor-pointer min-w-0">
            <div className="relative w-7 h-7 sm:w-9 sm:h-9 rounded-xl overflow-hidden bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 p-0.5 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center overflow-hidden">
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

            <div className="min-w-0">
              <h1 className="text-xs sm:text-base font-black tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors truncate max-w-[100px] xs:max-w-[140px] sm:max-w-xs leading-tight">
                {settings.storeName || t.store_name}
              </h1>
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <Calendar className="w-3 h-3 text-amber-500" />
                <span className="capitalize">{today}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Controls: AI, Notifications, Profile */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          
          {/* AI Taxlilchi Trigger */}
          <button
            onClick={onOpenAITaxlilchi}
            className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white text-[10px] sm:text-xs font-black shadow-sm active:scale-95 transition-all shrink-0"
            title="AI Tahlilchi"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 animate-pulse shrink-0" />
            <span className="hidden xs:inline">{t.ai_analyst}</span>
            <span className="xs:hidden">AI</span>
          </button>

          {/* Notifications Trigger */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-amber-500 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all"
              title={t.notifications}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-bounce shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 sm:right-0 mt-2 w-[calc(100vw-20px)] sm:w-96 max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-3 sm:p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                      <span>{t.notifications}</span>
                    </h3>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-rose-500/10 text-rose-500 font-black text-[9px]">
                        {unreadCount} yangi
                      </span>
                    )}
                  </div>
                  
                  {notifications.length > 0 && (
                    <div className="flex items-center gap-1">
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllNotificationsAsRead()}
                          className="p-1 px-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/20 text-slate-600 dark:text-slate-300 hover:text-amber-500 text-[9px] font-bold flex items-center gap-1 transition-colors"
                          title="Barchasini o'qildi qilish"
                        >
                          <CheckCheck className="w-3 h-3 text-amber-500" />
                          <span>O'qildi</span>
                        </button>
                      )}
                      <button
                        onClick={() => clearAllNotifications()}
                        className="p-1 px-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/20 text-slate-600 dark:text-slate-300 hover:text-rose-500 text-[9px] font-bold flex items-center gap-1 transition-colors"
                        title="Barchasini o'chirish"
                      >
                        <Trash2 className="w-3 h-3 text-rose-500" />
                        <span>Tozalash</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mx-auto mb-2 text-slate-400">
                        <Bell className="w-4 h-4 opacity-40" />
                      </div>
                      {t.no_notifications}
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all relative group/item ${
                          n.read
                            ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                            : 'bg-amber-50/50 dark:bg-slate-800 border-amber-500/30 text-slate-800 dark:text-slate-200 font-medium shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {n.type === 'warning' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                              <span className="truncate text-[11px] sm:text-xs">{n.title}</span>
                              <span className="text-[9px] text-slate-400 shrink-0 ml-1">{n.date}</span>
                            </div>
                            <p className="mt-0.5 leading-relaxed text-slate-600 dark:text-slate-300 text-[10px] sm:text-[11px] break-words">
                              {n.message}
                            </p>
                          </div>
                        </div>

                        {/* Individual Delete Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(n.id);
                          }}
                          className="absolute top-2 right-2 p-1 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 text-slate-400 hover:text-rose-500 hover:bg-rose-500/20 opacity-70 group-hover/item:opacity-100 transition-all"
                          title="O'chirish"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Direct Logout Button */}
          {currentUser ? (
            <div className="flex items-center gap-1 sm:gap-2">
              {/* User Identity Chip */}
              <button 
                onClick={onOpenLoginModal}
                className="flex items-center gap-1.5 p-0.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer transition-all active:scale-95"
                title="Profil va hisob almashtirish"
              >
                <div className="w-7 h-7 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block min-w-0 text-left max-w-[120px]">
                  <div className="text-[11px] font-extrabold text-slate-900 dark:text-white truncate leading-tight">
                    {currentUser.name || currentUser.username}
                  </div>
                  <div className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider leading-tight truncate">
                    {currentUser.role === 'admin' ? 'ADMIN' : currentUser.role === 'warehouse_manager' ? 'OMBORCHI' : 'KASSIR'}
                  </div>
                </div>
              </button>

              {/* Direct Logout Button */}
              <button
                onClick={logout}
                className="flex p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/30 hover:border-rose-600 font-extrabold text-xs items-center gap-1 transition-all active:scale-95 shadow-sm shrink-0"
                title="Tizimdan chiqish (Log Out)"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chiqish</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all"
            >
              <User className="w-3.5 h-3.5" />
              <span>Kirish</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
