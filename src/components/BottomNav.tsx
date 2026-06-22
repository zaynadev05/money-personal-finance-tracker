import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  BarChart3, 
  Settings as SettingsIcon, 
  Plus,
  Sparkles
} from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddTransaction: () => void;
}

export default function BottomNav({
  activeTab,
  setActiveTab,
  onOpenAddTransaction,
}: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#F0E3D3]/95 backdrop-blur-md border-t border-[#D3A474]/30 px-2 flex justify-around items-center z-40 pb-safe shadow-md">
      <button
        id="bottom-nav-dashboard"
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] transition-all cursor-pointer ${
          activeTab === 'dashboard' ? 'text-[#D3A474] font-bold' : 'text-[#1E3C2B]/60 font-medium'
        }`}
      >
        <LayoutDashboard className={`w-5 h-5 mb-0.5 transition-transform duration-300 ${activeTab === 'dashboard' ? 'text-[#D3A474] scale-110' : 'text-[#1E3C2B]/60'}`} />
        <span>Dasbor</span>
      </button>

      <button
        id="bottom-nav-transactions"
        onClick={() => setActiveTab('transactions')}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] transition-all cursor-pointer ${
          activeTab === 'transactions' ? 'text-[#D3A474] font-bold' : 'text-[#1E3C2B]/60 font-medium'
        }`}
      >
        <Receipt className={`w-5 h-5 mb-0.5 transition-transform duration-300 ${activeTab === 'transactions' ? 'text-[#D3A474] scale-110' : 'text-[#1E3C2B]/60'}`} />
        <span>Transaksi</span>
      </button>

      {/* Floating Center Action Button - Styled soft pink key */}
      <div className="flex-1 flex justify-center -mt-6">
        <button
          id="bottom-nav-add"
          onClick={onOpenAddTransaction}
          className="w-13 h-13 rounded-full bg-[#D3A474] text-white flex items-center justify-center shadow-lg hover:bg-[#C69360] active:scale-90 transition-all cursor-pointer"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      <button
        id="bottom-nav-analytics"
        onClick={() => setActiveTab('analytics')}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] transition-all cursor-pointer ${
          activeTab === 'analytics' ? 'text-[#D3A474] font-bold' : 'text-[#1E3C2B]/60 font-medium'
        }`}
      >
        <BarChart3 className={`w-5 h-5 mb-0.5 transition-transform duration-300 ${activeTab === 'analytics' ? 'text-[#D3A474] scale-110' : 'text-[#1E3C2B]/60'}`} />
        <span>Analisis</span>
      </button>

      <button
        id="bottom-nav-settings"
        onClick={() => setActiveTab('settings')}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] transition-all cursor-pointer ${
          activeTab === 'settings' ? 'text-[#D3A474] font-bold' : 'text-[#1E3C2B]/60 font-medium'
        }`}
      >
        <SettingsIcon className={`w-5 h-5 mb-0.5 transition-transform duration-300 ${activeTab === 'settings' ? 'text-[#D3A474] scale-110' : 'text-[#1E3C2B]/60'}`} />
        <span>Profil</span>
      </button>
    </nav>
  );
}
