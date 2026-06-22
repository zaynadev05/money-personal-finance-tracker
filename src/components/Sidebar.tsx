import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  BarChart3, 
  Settings as SettingsIcon, 
  LogOut, 
  Plus,
  Sparkles
} from 'lucide-react';
import { ActiveTab, RegisteredUser } from '../types';
import UserAvatar from './UserAvatar';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: RegisteredUser | null;
  onLogout: () => void;
  onOpenAddTransaction: (type?: 'pemasukan' | 'pengeluaran' | null) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  onOpenAddTransaction,
}: SidebarProps) {
  if (!currentUser) return null;

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions' as ActiveTab, label: 'Transaksi', icon: Receipt },
    { id: 'analytics' as ActiveTab, label: 'Analisis & Anggaran', icon: BarChart3 },
    { id: 'settings' as ActiveTab, label: 'Pengaturan', icon: SettingsIcon },
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full flex-col bg-[#F0E3D3] border-r border-[#D3A474]/50 w-64 z-30 transition-all shadow-md">
      {/* Brand Header */}
      <div className="p-6 flex items-center space-x-3 mt-2">
        <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
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
        <div className="flex flex-col">
          <span className="text-2xl font-logo font-semibold tracking-normal text-[#1E3C2B] leading-none">
            monify
          </span>
          <span className="text-[10px] text-[#D3A474] font-semibold tracking-widest uppercase mt-1">
            Finance Companion
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`sidebar-nav-${item.id}`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-300 text-left cursor-pointer group ${
                isActive
                  ? 'bg-[#D3A474] text-white font-semibold shadow-xs'
                  : 'text-[#1E3C2B] hover:bg-[#D3A474]/20 hover:text-[#1E3C2B]'
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors duration-300 ${
                isActive ? 'bg-[#1E3C2B] text-white' : 'bg-[#1E3C2B]/10 text-[#1E3C2B] group-hover:bg-[#1E3C2B]/20'
              }`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <span className="tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quick Action Button */}
      <div className="px-4 py-3">
        <button
          id="sidebar-quick-add"
          onClick={() => onOpenAddTransaction()}
          className="w-full bg-[#D3A474] hover:bg-[#c39363] active:scale-[0.98] text-white py-3.5 rounded-2xl text-sm font-semibold shadow-sm shadow-[#D3A474]/20 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white stroke-[2.5]" />
          <span>Tambah Transaksi</span>
        </button>
      </div>

      {/* Modern User Profile & Logout - Earthy Theme */}
      <div className="p-4 border-t border-[#D3A474]/20">
        <div className="bg-[#1E3C2B] rounded-2xl p-4 border border-[#D3A474]/30 shadow-xs">
          <div className="flex items-center gap-3">
            <UserAvatar
              avatarUrl={currentUser.avatarUrl}
              fullName={currentUser.fullName}
              className="w-10 h-10 rounded-full border-2 border-[#D3A474] flex-shrink-0"
              textClassName="text-sm font-bold text-white"
              id="sidebar-avatar-img"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-[#FAF7F2] font-semibold uppercase tracking-wider leading-none">Pengguna</p>
              <p className="font-bold text-white text-sm truncate mt-1 animate-fade-in" title={currentUser.fullName}>
                {currentUser.fullName}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-3.5">
            <button 
              id="sidebar-profile-settings"
              onClick={() => setActiveTab('settings')}
              className="flex-grow bg-[#D3A474] hover:bg-[#c39363] text-white text-xs font-semibold py-2 rounded-xl text-center transition-all duration-200 cursor-pointer"
            >
              Profil
            </button>
            <button 
              id="sidebar-profile-logout"
              onClick={onLogout}
              className="px-3 bg-red-900/40 hover:bg-red-800/60 border border-red-800/30 text-rose-100 text-xs font-semibold py-2 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center"
              title="Keluar"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
