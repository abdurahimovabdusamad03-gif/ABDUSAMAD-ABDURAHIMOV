/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './views/DashboardView';
import { SotuvView } from './views/SotuvView';
import { DokonOmborView } from './views/DokonOmborView';
import { KirimView } from './views/KirimView';
import { MijozlarView } from './views/MijozlarView';
import { SozlamalarView } from './views/SozlamalarView';
import { SheriklarView } from './views/SheriklarView';
import { AITaxlilchiModal } from './components/AITaxlilchiModal';
import { ReceiptPrinterModal } from './components/ReceiptPrinterModal';
import { LoginModal } from './views/LoginModal';
import { SplashScreen } from './components/SplashScreen';
import { NavTab, Sale } from './types';
import { ShieldAlert } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, currentUser } = useERP();
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    // Show splash screen on first load / session
    const hasSeenSplash = sessionStorage.getItem('erp_splash_seen');
    return !hasSeenSplash;
  });
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [printedSale, setPrintedSale] = useState<Sale | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if current active tab is permitted for logged in user
  const isTabAllowed = (tab: NavTab): boolean => {
    if (!currentUser) return true;
    if (currentUser.role === 'admin') return true;
    return Array.isArray(currentUser.allowedTabs) && currentUser.allowedTabs.includes(tab);
  };

  // If user is restricted and on an unauthorized tab (e.g. Sozlamalar), auto switch to first permitted tab
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      const allowed = currentUser.allowedTabs;
      if (allowed && allowed.length > 0 && !allowed.includes(activeTab)) {
        setActiveTab(allowed[0]);
      }
    }
  }, [currentUser, activeTab, setActiveTab]);

  const handleSplashFinish = () => {
    sessionStorage.setItem('erp_splash_seen', 'true');
    setShowSplash(false);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {showSplash && <SplashScreen onFinish={handleSplashFinish} minDuration={2000} />}
        <LoginModal defaultMode="register" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F7] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* SPLASH SCREEN ANIMATION */}
      {showSplash && <SplashScreen onFinish={handleSplashFinish} minDuration={2400} />}

      {/* HEADER */}
      <Header
        onOpenAITaxlilchi={() => setIsAIOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* MAIN CONTAINER (Bento Grid layout wrapper) */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col lg:flex-row pb-20 sm:pb-24 lg:pb-0">
        {/* SIDEBAR NAVIGATION */}
        <Navigation
          onOpenAITaxlilchi={() => setIsAIOpen(true)}
          isMobileDrawerOpen={isMobileMenuOpen}
          onCloseMobileDrawer={() => setIsMobileMenuOpen(false)}
        />

        {/* MAIN VIEW CONTENT */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-x-hidden">
          {!isTabAllowed(activeTab) ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                Kirish Cheklangan (Ruxsat Berilmagan)
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
                Sizning profilingiz uchun bu bo'limga kirish huquqi berilmagan. Iltimos, bosh administratorga murojaat qiling.
              </p>
              {currentUser?.allowedTabs && currentUser.allowedTabs.length > 0 && (
                <button
                  onClick={() => setActiveTab(currentUser.allowedTabs[0])}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg transition-all"
                >
                  Ruxsat Berilgan Bo'limga O'tish
                </button>
              )}
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  onOpenAITaxlilchi={() => setIsAIOpen(true)}
                  onOpenReceiptModal={(sale) => setPrintedSale(sale)}
                />
              )}

              {activeTab === 'sotuv' && (
                <SotuvView onOpenReceiptModal={(sale) => setPrintedSale(sale)} />
              )}

              {activeTab === 'dokon_ombor' && <DokonOmborView />}

              {activeTab === 'kirim' && <KirimView />}

              {activeTab === 'sheriklar' && <SheriklarView />}

              {activeTab === 'mijozlar' && <MijozlarView />}

              {activeTab === 'sozlamalar' && <SozlamalarView />}
            </>
          )}
        </main>
      </div>

      {/* MODALS */}
      {isAIOpen && (
        <AITaxlilchiModal onClose={() => setIsAIOpen(false)} />
      )}

      {printedSale && (
        <ReceiptPrinterModal
          sale={printedSale}
          onClose={() => setPrintedSale(null)}
        />
      )}

      {isLoginModalOpen && (
        <LoginModal onClose={() => setIsLoginModalOpen(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ERPProvider>
      <AppContent />
    </ERPProvider>
  );
}

