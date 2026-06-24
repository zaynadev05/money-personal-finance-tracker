import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { RegisteredUser } from '../types';
import { AuthDB } from '../database';

interface OnboardingViewProps {
  currentUser: RegisteredUser;
  onProfileUpdate: (updatedUser: RegisteredUser) => void;
  onOnboardingComplete: () => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
}

export default function OnboardingView({
  currentUser,
  onProfileUpdate,
  onOnboardingComplete,
  showToast,
}: OnboardingViewProps) {
  const [enteredBal, setEnteredBal] = useState('0');
  const [isSavingBal, setIsSavingBal] = useState(false);

  const quickBalances = [
    { label: 'Rp 0', value: 0 },
    { label: 'Rp 500rb', value: 500000 },
    { label: 'Rp 1jt', value: 1000000 },
    { label: 'Rp 2.5jt', value: 2500000 },
    { label: 'Rp 5jt', value: 5000000 },
    { label: 'Rp 10jt', value: 10000000 },
  ];

  const formatInputRupiah = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean) return '0';
    return new Intl.NumberFormat('id-ID', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(Number(clean));
  };

  const handleSaveInitialBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = Number(enteredBal.replace(/[^0-9]/g, ''));
    if (isNaN(cleanNum) || enteredBal.trim() === '') {
      if (showToast) showToast('Harap masukkan nominal saldo awal yang valid.', 'error');
      return;
    }

    try {
      setIsSavingBal(true);
      const updatedSess = { ...currentUser, initialBalance: cleanNum };
      await AuthDB.updateProfile(currentUser.id, { initialBalance: cleanNum });
      AuthDB.setSession(updatedSess);
      onProfileUpdate(updatedSess);

      if (showToast) showToast('Saldo awal berhasil disimpan!', 'success');
      onOnboardingComplete();
    } catch (err: any) {
      if (showToast) showToast(err.message || 'Gagal menyimpan saldo awal.', 'error');
    } finally {
      setIsSavingBal(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0E3D3] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-[#1E3C2B] rounded-[32px] overflow-hidden shadow-2xl border border-[#D3A474]/30 p-6 md:p-8 text-center flex flex-col items-center gap-5"
      >
        <div className="w-16 h-16 flex items-center justify-center flex-shrink-0 bg-[#D3A474]/10 rounded-full border border-[#D3A474]/30">
          <svg className="w-10 h-10 drop-shadow-md" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        
        <div className="flex flex-col gap-2">
          <h3 className="font-fredoka font-semibold text-xl text-white">
            Setup Saldo Awal Saya
          </h3>
          <p className="text-xs text-[#FAF7F2] font-medium leading-relaxed max-w-sm">
            Masukkan jumlah uang yang Anda miliki saat ini sebagai langkah awal memulai pencatatan keuangan pribadi di Monify.
          </p>
        </div>

        <form onSubmit={handleSaveInitialBalance} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1 w-full text-left">
            <label className="text-[10px] font-bold text-[#FAF7F2] uppercase pl-1 tracking-wider">
              Saldo Awal Saya
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-xs font-bold text-[#1E3C2B]">
                Rp
              </span>
              <input
                id="initial-balance-input"
                type="text"
                required
                placeholder="Contoh: 10.000.000"
                value={formatInputRupiah(enteredBal)}
                onChange={(e) => {
                  const raw = e.target.value;
                  const clean = raw.replace(/[^0-9]/g, '');
                  setEnteredBal(clean);
                }}
                className="w-full bg-[#F7F1EA] border border-[#D3A474] focus:border-[#D3A474] focus:ring-2 focus:ring-[#D3A474]/20 focus:outline-none rounded-2xl pl-10 pr-4 py-3 text-sm text-[#1E3C2B] font-bold"
              />
            </div>

            {/* Quick Balance options */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {quickBalances.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setEnteredBal(String(item.value))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    Number(enteredBal) === item.value
                      ? 'bg-[#D3A474] border-[#D3A474] text-white shadow-xs'
                      : 'bg-white/5 border-white/10 text-[#FAF7F2] hover:bg-white/10 hover:border-[#D3A474]/30'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full flex flex-col gap-2 mt-2">
            <button
              id="btn-save-initial-balance"
              type="submit"
              disabled={isSavingBal}
              className="w-full bg-[#D3A474] hover:bg-[#c39363] hover:scale-[1.01] text-white text-xs font-bold py-3.5 rounded-2xl shadow-md transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <span>{isSavingBal ? 'Menyimpan...' : 'Simpan Saldo Awal'}</span>
            </button>
            <p className="text-[10px] text-[#FAF7F2] font-medium leading-relaxed">
              Saldo Awal ini bukan merupakan rekening/wallet, melainkan saldo dasar untuk perhitungan keuangan personal Anda.
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
