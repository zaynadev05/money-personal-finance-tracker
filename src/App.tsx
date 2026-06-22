import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  X, 
  LogOut, 
  User, 
  Bell, 
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { AuthDB, TransactionDB, WalletDB } from './database';
import { RegisteredUser, ActiveTab } from './types';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import TransactionsView from './components/TransactionsView';
import AnalyticsView from './components/AnalyticsView';
import SettingsView from './components/SettingsView';
import OnboardingView from './components/OnboardingView';
import UserAvatar from './components/UserAvatar';

export default function App() {
  // Session authentication state
  const [sessionUser, setSessionUser] = useState<RegisteredUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  // Tab routing
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Trigger global quick add transaction modal
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'pemasukan' | 'pengeluaran' | 'transfer' | null>(null);

  // Responsive mobile menu toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global custom toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Check persisted user session on boot
  useEffect(() => {
    try {
      const persisted = AuthDB.getCurrentSession();
      if (persisted) {
        setSessionUser(persisted);
      }
    } catch {
      console.warn('Persisted session failed to load.');
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  // Check user database status when logged in
  useEffect(() => {
    if (!sessionUser) {
      setShowOnboarding(null);
      return;
    }

    const checkStatus = async () => {
      setIsCheckingStatus(true);
      try {
        // Fetch transactions
        const txList = await TransactionDB.getTransactions(sessionUser.id);
        
        // Fetch wallets
        const wList = await WalletDB.getWallets(sessionUser.id);
        const hasWalletBalance = wList.some(w => w.balance > 0);
        const hasInitialBalance = sessionUser.initialBalance !== undefined && sessionUser.initialBalance !== null;
        const hasTransactions = txList.length > 0;

        if (hasInitialBalance || hasTransactions || hasWalletBalance) {
          setShowOnboarding(false);
        } else {
          setShowOnboarding(true);
        }
      } catch (err) {
        console.error('Failed to verify user status:', err);
        setShowOnboarding(false); // Safety fallback
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkStatus();
  }, [sessionUser?.id]);

  // Quick helper to fire alert toasts
  const triggerToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  // Close toast automatically after 4 seconds
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(id);
    }
  }, [toast]);

  // Auth successful callback
  const handleAuthSuccess = (user: RegisteredUser) => {
    setSessionUser(user);
    setActiveTab('dashboard');
  };

  // Logout callback
  const handleLogout = () => {
    AuthDB.setSession(null);
    setSessionUser(null);
    setIsMobileMenuOpen(false);
    triggerToast('Anda berhasil keluar dari sistem Money+.', 'success');
  };

  if (isAuthLoading || (sessionUser && isCheckingStatus)) {
    return (
      <div className="min-h-screen bg-[#F0E3D3] flex flex-col items-center justify-center gap-4">
        <span className="w-10 h-10 border-4 border-[#D3A474] border-t-transparent rounded-full animate-spin"></span>
        <p className="text-xs font-fredoka font-semibold text-[#1E3C2B] uppercase tracking-widest leading-none">
          {isAuthLoading ? 'menghubungkan database...' : 'memeriksa data pengguna...'}
        </p>
      </div>
    );
  }

  // Render landing layout & auth sheets if guest
  if (!sessionUser) {
    return (
      <>
        <AuthView onAuthSuccess={handleAuthSuccess} showToast={triggerToast} />
        
        {/* Toast rendering */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-99 flex items-center gap-3 bg-[#1E3C2B] border border-[#D3A474]/30 text-white px-5 py-4 rounded-2xl shadow-xl animate-fade-in max-w-sm">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 animate-bounce" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 animate-pulse" />
            )}
            <span className="text-xs font-semibold leading-normal">{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-[#D3A474] hover:text-[#C69360] ml-2 text-xs font-bold font-mono">×</button>
          </div>
        )}
      </>
    );
  }

  // Render onboarding / initial balance screen for brand new user
  if (showOnboarding === true) {
    return (
      <>
        <OnboardingView 
          currentUser={sessionUser} 
          onProfileUpdate={(updated) => setSessionUser(updated)}
          onOnboardingComplete={() => setShowOnboarding(false)}
          showToast={triggerToast}
        />

        {/* Toast rendering */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-99 flex items-center gap-3 bg-[#1E3C2B] border border-[#D3A474]/30 text-white px-5 py-4 rounded-2xl shadow-xl animate-fade-in max-w-sm">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 animate-bounce" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 animate-pulse" />
            )}
            <span className="text-xs font-semibold leading-normal">{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-[#D3A474] hover:text-[#C69360] ml-2 text-xs font-bold font-mono">×</button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0E3D3] text-[#1E3C2B] font-sans sm:flex selection:bg-[#D3A474]/30">
      
      {/* 1. Desktop sidebar navbar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={sessionUser}
        onLogout={handleLogout}
        onOpenAddTransaction={(type) => {
          setQuickAddType(type || null);
          setIsQuickAddOpen(true);
          setActiveTab('transactions');
        }}
      />

      {/* 2. Main Workspace layout */}
      <div className="flex-1 md:pl-64 min-h-screen flex flex-col transition-all">
        
        {/* Responsive Mobile / Tablet Navigation Header */}
        <header className="sticky top-0 bg-[#F0E3D3]/95 backdrop-blur-md border-b border-[#D3A474]/30 px-6 py-4 flex items-center justify-between z-20 md:hidden shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-14 h-14 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full drop-shadow-md" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g transform="translate(4, 8) rotate(-10)">
                  {/* Card Base Shadow */}
                  <rect x="1" y="3" width="28" height="19" rx="3.5" fill="#0d1b13" opacity="0.25" />
                  {/* Card Base */}
                  <rect x="0" y="2" width="28" height="19" rx="3.5" fill="#1E3C2B" stroke="#D3A474" strokeWidth="1" />
                  {/* Minimalist Card curve line */}
                  <path d="M 0 7 Q 10 12, 28 6" stroke="#FAF7F2" strokeWidth="0.5" opacity="0.3" fill="none" />
                  {/* Card Chip */}
                  <rect x="3" y="6" width="5.5" height="4" rx="0.75" fill="#D3A474" />
                  <rect x="4" y="7" width="3.5" height="2" fill="#F0E3D3" opacity="0.25" />
                  {/* Abstract Financial Overlapping Symbol */}
                  <circle cx="23" cy="15" r="2" fill="#F0E3D3" opacity="0.75" />
                  <circle cx="21" cy="15" r="2" fill="#D3A474" opacity="0.85" />
                  {/* Card branding text Monify */}
                  <text x="3" y="17" fill="#F0E3D3" fontSize="2.8" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.2">monify</text>
                </g>
              </svg>
            </div>
            <span className="font-logo font-semibold text-xl text-[#1E3C2B] tracking-normal">monify</span>
          </div>

          <div className="flex items-center gap-3">
            {/* User Avatar selection */}
            <button 
              onClick={() => setActiveTab('settings')}
              className="w-8 h-8 rounded-full select-none hover:scale-105 active:scale-95 transition-all"
            >
              <UserAvatar
                avatarUrl={sessionUser.avatarUrl}
                fullName={sessionUser.fullName}
                className="w-8 h-8 rounded-full border border-[#D3A474]"
                textClassName="text-xs font-bold text-white"
              />
            </button>

            {/* Hamburger collapsible trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 hover:bg-[#D3A474]/20 rounded-lg text-[#1E3C2B] transition-colors pointer-events-auto"
            >
              {isMobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
            </button>
          </div>
        </header>

        {/* Collapsible Mobile Menu drawers */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-[61px] bg-[#F0E3D3] z-40 p-6 flex flex-col justify-between animate-fade-in border-t border-[#D3A474]/30">
            <div className="flex flex-col gap-3">
              {([
                { id: 'dashboard', label: 'Dasbor' },
                { id: 'transactions', label: 'Transaksi' },
                { id: 'analytics', label: 'Analisis & Anggaran' },
                { id: 'settings', label: 'Pengaturan' },
              ] as { id: ActiveTab; label: string }[]).map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setActiveTab(m.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full py-4 text-left font-fredoka font-semibold text-lg border-b border-[#D3A474]/20 transition-colors ${
                    activeTab === m.id ? 'text-[#D3A474]' : 'text-[#1E3C2B]/80 hover:text-[#1E3C2B]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleLogout}
              className="w-full bg-[#1E3C2B] text-white hover:bg-[#1E3C2B]/90 text-sm font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <LogOut className="w-4.5 h-4.5" /> Keluar Akun
            </button>
          </div>
        )}

        {/* 3. Render and Router Active Screen content views */}
        <main className="flex-1 p-5 md:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView 
              currentUser={sessionUser} 
              setActiveTab={(tab) => setActiveTab(tab as ActiveTab)}
              onOpenAddTransaction={(type) => {
                setQuickAddType(type || null);
                setIsQuickAddOpen(true);
                setActiveTab('transactions');
              }}
              onProfileUpdate={(updated) => setSessionUser(updated)}
              showToast={triggerToast}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView 
              currentUser={sessionUser} 
              showToast={triggerToast}
              isAddModalOpenInitially={isQuickAddOpen}
              onAddModalCloseComplete={() => {
                setIsQuickAddOpen(false);
                setQuickAddType(null);
              }}
              initialType={quickAddType}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView 
              currentUser={sessionUser} 
              showToast={triggerToast} 
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              currentUser={sessionUser} 
              onProfileUpdate={(updated) => setSessionUser(updated)}
              onAccountDeleted={() => setSessionUser(null)}
              showToast={triggerToast} 
            />
          )}
        </main>
      </div>

      {/* 4. Fixed responsive Bottom Navigation Bar for Mobile */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddTransaction={() => {
          setQuickAddType(null);
          setActiveTab('transactions');
          setIsQuickAddOpen(true);
        }}
      />

      {/* Global Quick Add Transaction Trigger bridge:
          When quick add triggers but active screen isn't transactions, 
          it gets routed automatically or triggers inside the sheet.
      */}

      {/* Toast notifications rendering container */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-99 flex items-center gap-3 bg-[#1E3C2B] border border-[#D3A474]/30 text-white px-5 py-4 rounded-2xl shadow-lg animate-fade-in max-w-sm">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          )}
          <span className="text-xs font-semibold leading-normal">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-[#D3A474] hover:text-[#C69360] ml-2 text-sm font-bold">×</button>
        </div>
      )}

    </div>
  );
}
