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
  const [enteredBal, setEnteredBal] = useState('');
  const [isSavingBal, setIsSavingBal] = useState(false);

  const formatInputRupiah = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean) return '';
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
        <div className="w-16 h-16 rounded-full bg-[#D3A474]/20 flex items-center justify-center text-[#D3A474]">
          <Sparkles className="w-8 h-8" />
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
          </div>

          <div className="w-full flex flex-col gap-2 mt-2">
            <button
              id="btn-save-initial-balance"
              type="submit"
              disabled={isSavingBal || !enteredBal}
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
