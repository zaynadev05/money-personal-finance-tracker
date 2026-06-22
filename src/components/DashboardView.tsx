import React, { useMemo, useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowLeftRight, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  ChevronRight,
  Plus,
  Minus,
  CheckCircle,
  Eye,
  EyeOff,
  Sparkles,
  Award,
  Wallet2,
  PieChart as PieIcon,
  CalendarDays,
  Target
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { RegisteredUser, Wallet as WalletType, Transaction, Category, PaymentMethod } from '../types';
import { CategoryDB, WalletDB, TransactionDB, AuthDB, PaymentMethodDB } from '../database';

interface DashboardViewProps {
  currentUser: RegisteredUser;
  setActiveTab: (tab: string) => void;
  onOpenAddTransaction: (type?: 'pemasukan' | 'pengeluaran') => void;
  onProfileUpdate: (updatedUser: RegisteredUser) => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
}

// Rupiah Formatter formatting
export const formatRupiah = (val: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val);
};

// Pastel Palette definitions
const COLORS = [
  '#D3A474', // Gold/amber 🌟
  '#E6D5BE', // Soft beige ✨
  '#FFFFFF', // Elegant white ⚪
  '#D3A474', // Repeated fallback
  '#C59BA4', // Muted earthy style 🌺
  '#A37C54', // Ochre/bronze 🍂
];

export default function DashboardView({
  currentUser,
  setActiveTab,
  onOpenAddTransaction,
  onProfileUpdate,
  showToast,
}: DashboardViewProps) {
  // State for loaded collections
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBalancePrivate, setShowBalancePrivate] = useState<boolean>(() => {
    return localStorage.getItem('monify_show_bal') !== 'false';
  });

  const [isInitialBalOpen, setIsInitialBalOpen] = useState(false);
  const [enteredBal, setEnteredBal] = useState('');
  const [isSavingBal, setIsSavingBal] = useState(false);

  // Check on load if user has initialBalance, bypassing if they have data
  useEffect(() => {
    if (isLoading) return;

    const hasTransactions = transactions.length > 0;
    const hasWalletBalance = wallets.some(w => w.balance > 0);
    const hasInitialBalance = currentUser.initialBalance !== undefined && currentUser.initialBalance !== null;

    if (hasInitialBalance || hasTransactions || hasWalletBalance) {
      setIsInitialBalOpen(false);
    } else {
      setIsInitialBalOpen(true);
    }
  }, [currentUser?.initialBalance, isLoading, transactions.length, wallets]);

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
      setIsInitialBalOpen(false);
    } catch (err: any) {
      if (showToast) showToast(err.message || 'Gagal menyimpan saldo awal.', 'error');
    } finally {
      setIsSavingBal(false);
    }
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Async load data
  const loadAll = async () => {
    try {
      setIsLoading(true);
      const [wList, tList, cList, pmList] = await Promise.all([
        WalletDB.getWallets(currentUser.id),
        TransactionDB.getTransactions(currentUser.id),
        CategoryDB.getCategories(currentUser.id),
        PaymentMethodDB.getPaymentMethods(currentUser.id)
      ]);
      setWallets(wList);
      setTransactions(tList);
      setCategories(cList);
      setPaymentMethods(pmList);
    } catch (err) {
      console.error('Failed to load Dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [currentUser.id]);

  // Derived Calculations
  const totalBalance = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
      if (t.type === 'pemasukan') {
        income += t.amount;
      } else if (t.type === 'pengeluaran') {
        expense += t.amount;
      }
    });
    const startingBal = currentUser.initialBalance || 0;
    return startingBal + income - expense;
  }, [transactions, currentUser.initialBalance]);

  const monthlyStats = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    transactions.forEach(t => {
      const tDate = new Date(t.date);
      if ((tDate.getMonth() + 1) === currentMonth && tDate.getFullYear() === currentYear) {
        if (t.type === 'pemasukan') {
          income += t.amount;
        } else if (t.type === 'pengeluaran') {
          expense += t.amount;
        }
      }
    });

    return { income, expense };
  }, [transactions, currentMonth, currentYear]);

  // Chart Data: Financial Flow for previous 7 days
  const lineChartData = useMemo(() => {
    const last7Days: { dateStr: string; label: string; income: number; expense: number }[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      last7Days.push({ dateStr, label, income: 0, expense: 0 });
    }

    transactions.forEach(t => {
      const tDateStr = t.date.split('T')[0];
      const foundDay = last7Days.find(day => day.dateStr === tDateStr);
      if (foundDay) {
        if (t.type === 'pemasukan') {
          foundDay.income += t.amount;
        } else if (t.type === 'pengeluaran') {
          foundDay.expense += t.amount;
        }
      }
    });

    return last7Days;
  }, [transactions]);

  // Pie Chart Data: Category Breakdown for expenses
  const expensePieData = useMemo(() => {
    const expenseMap = new Map<string, { name: string; value: number; color: string }>();
    
    transactions.forEach(t => {
      const tDate = new Date(t.date);
      if (t.type === 'pengeluaran' && t.categoryId && (tDate.getMonth() + 1) === currentMonth && tDate.getFullYear() === currentYear) {
        const cat = categories.find(c => c.id === t.categoryId);
        const catName = cat ? cat.name : 'Lainnya';
        const catColor = cat ? cat.color : '#cbd5e1';

        const existing = expenseMap.get(t.categoryId) || { name: catName, value: 0, color: catColor };
        expenseMap.set(t.categoryId, {
          ...existing,
          value: existing.value + t.amount
        });
      }
    });

    const values = Array.from(expenseMap.values());
    // Inject pastel palette indices so they match user guidelines
    return values.map((val, idx) => ({
      ...val,
      color: COLORS[idx % COLORS.length]
    }));
  }, [transactions, categories, currentMonth, currentYear]);

  // Handle toggle balance privacy
  const handleTogglePrivacy = () => {
    const nextVal = !showBalancePrivate;
    setShowBalancePrivate(nextVal);
    localStorage.setItem('monify_show_bal', String(nextVal));
  };

  // Modern category mapping map to hold specific elegant emoji matches
  const getCatEmoji = (catName: string): string => {
    const lower = catName.toLowerCase();
    if (lower.includes('makan') || lower.includes('kuliner') || lower.includes('food') || lower.includes('bakso') || lower.includes('kopi')) return '🍜';
    if (lower.includes('bus') || lower.includes('ojek') || lower.includes('transport') || lower.includes('bensin') || lower.includes('kereta')) return '🚌';
    if (lower.includes('gaji') || lower.includes('salary') || lower.includes('pemasukan') || lower.includes('hibah')) return '💼';
    if (lower.includes('kos') || lower.includes('sewa') || lower.includes('tagihan') || lower.includes('lisrtik')) return '⚡';
    if (lower.includes('belanja') || lower.includes('mall') || lower.includes('lazada') || lower.includes('shopee')) return '🏷️';
    if (lower.includes('hiburan') || lower.includes('film') || lower.includes('bioskop') || lower.includes('netflix')) return '🍿';
    if (lower.includes('sehat') || lower.includes('obat') || lower.includes('dokter') || lower.includes('klinik')) return '💊';
    return_emoji_default: return '🏷️';
  };

  // Skeleton loading effect layout
  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto py-8 px-4 flex flex-col gap-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center py-2 h-16">
          <div className="flex flex-col gap-2">
            <div className="h-6 w-48 bg-pink-100 rounded-lg"></div>
            <div className="h-4 w-72 bg-slate-100 rounded-lg"></div>
          </div>
          <div className="h-10 w-10 rounded-full bg-pink-100"></div>
        </div>

        {/* Balance Bar Skeleton */}
        <div className="h-16 w-full bg-slate-50 border border-pink-50/50 rounded-3xl"></div>

        {/* KPI Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white border border-pink-50 rounded-2xl p-4 flex flex-col gap-2">
              <div className="h-3 w-16 bg-slate-100 rounded-lg"></div>
              <div className="h-6 w-28 bg-pink-100 rounded-lg"></div>
            </div>
          ))}
        </div>

        {/* Quick Actions Skeleton */}
        <div className="h-20 w-full bg-white rounded-2xl border border-pink-50"></div>

        {/* Charts & Listings skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
          <div className="h-64 bg-white border border-pink-50 rounded-2xl"></div>
          <div className="h-64 bg-white border border-pink-50 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // Format monetary display
  const protectValue = (val: number): string => {
    if (!showBalancePrivate) return '•••••••';
    return formatRupiah(val);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-24 md:pb-12 px-1 animate-fade-in text-[#475569]">
      
      {/* 1. Header Greeting Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-3 mt-2">
        <div className="flex flex-col">
          <h2 className="text-2xl font-fredoka font-semibold text-slate-800 tracking-normal flex items-center gap-1.5 leading-tight">
            Halo, {currentUser.fullName}!
          </h2>
          <p className="text-xs text-[#475569]/80 font-medium tracking-wide mt-1">
            "Selamat datang kembali, yuk cek kondisi keuanganmu hari ini."
          </p>
        </div>

        {/* Grand Balance Pill Display with Privacy Toggle */}
        <div className="bg-[#1E3C2B] px-5 py-3 rounded-[24px] border border-[#D3A474]/30 flex items-center justify-between gap-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#D3A474]/20 flex items-center justify-center text-[#D3A474]">
              <Wallet2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-bold text-[#FAF7F2] uppercase tracking-widest leading-none">Keuangan Total</span>
              <span className="text-sm font-bold font-fredoka text-white leading-normal mt-0.5">
                {protectValue(totalBalance)}
              </span>
              {currentUser.initialBalance !== undefined && currentUser.initialBalance !== null && (
                <span className="text-[9px] font-medium text-[#FAF7F2] mt-0.5 leading-none">
                  Saldo Awal: <span className="font-bold text-[#FFFFFF]">{protectValue(currentUser.initialBalance)}</span>
                </span>
              )}
            </div>
          </div>
          <button 
            id="toggle-privacy-btn"
            onClick={handleTogglePrivacy}
            className="text-[#D3A474] hover:text-[#D3A474]/80 hover:scale-105 active:scale-95 transition-all p-1.5 bg-[#D3A474]/15 rounded-full cursor-pointer"
            title={showBalancePrivate ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
          >
            {showBalancePrivate ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. Ringkasan Keuangan (Monthly Stats Grid) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mt-1">
        {/* Card 1: Pemasukan */}
        <div className="bg-[#1E3C2B] border border-[#D3A474]/20 p-4.5 rounded-2xl flex flex-col justify-between shadow-xs transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#F0E3D3] rounded-t-2xl opacity-95" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#FAF7F2] font-bold uppercase tracking-wider">Total Pemasukan</span>
            <div className="w-8 h-8 rounded-full bg-emerald-950/80 text-emerald-300 flex items-center justify-center text-sm font-bold">💰</div>
          </div>
          <div className="mt-4">
            <h4 id="stat-income-amount" className="text-sm md:text-base font-fredoka font-bold text-white truncate">
              {protectValue(monthlyStats.income)}
            </h4>
            <span className="text-[9px] text-[#FAF7F2] font-medium">Bulan Ini</span>
          </div>
        </div>

        {/* Card 2: Pengeluaran */}
        <div className="bg-[#1E3C2B] border border-[#D3A474]/20 p-4.5 rounded-2xl flex flex-col justify-between shadow-xs transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#F0E3D3] rounded-t-2xl opacity-95" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#FAF7F2] font-bold uppercase tracking-wider">Total Pengeluaran</span>
            <div className="w-8 h-8 rounded-full bg-rose-950/80 text-rose-300 flex items-center justify-center text-sm font-bold">💸</div>
          </div>
          <div className="mt-4">
            <h4 id="stat-expense-amount" className="text-sm md:text-base font-fredoka font-bold text-white truncate">
              {protectValue(monthlyStats.expense)}
            </h4>
            <span className="text-[9px] text-[#FAF7F2] font-medium">Bulan Ini</span>
          </div>
        </div>

        {/* Card 3: Selisih Keuangan */}
        <div className="bg-[#1E3C2B] border border-[#D3A474]/20 p-4.5 rounded-2xl flex flex-col justify-between shadow-xs transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#F0E3D3] rounded-t-2xl opacity-95" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#FAF7F2] font-bold uppercase tracking-wider">Selisih Keuangan</span>
            <div className="w-8 h-8 rounded-full bg-indigo-950/80 text-indigo-300 flex items-center justify-center text-sm font-bold">📈</div>
          </div>
          <div className="mt-4">
            <h4 id="stat-diff-amount" className="text-sm md:text-base font-fredoka font-bold text-white truncate">
              {showBalancePrivate ? (
                <>
                  {(monthlyStats.income - monthlyStats.expense) > 0 ? '+' : ''}
                  {formatRupiah(monthlyStats.income - monthlyStats.expense)}
                </>
              ) : '•••••••'}
            </h4>
            <span className="text-[9px] text-[#FAF7F2] font-medium">Bulan Ini</span>
          </div>
        </div>
      </section>

      {/* 3. Quick Action Panel Hub */}
      <section className="bg-[#1E3C2B] px-6 py-4 rounded-3xl border border-[#D3A474]/20 shadow-md">
        <h5 className="text-[10px] text-[#D3A474] font-bold uppercase tracking-widest text-center mb-3">Menu Aksi Cepat</h5>
        <div className="flex items-center justify-around gap-2">
          {/* Quick Add Pemasukan */}
          <button 
            id="quick-add-pemasukan"
            onClick={() => onOpenAddTransaction('pemasukan')}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-1.5xl bg-[#D3A474]/20 hover:bg-[#D3A474]/30 text-[#D3A474] font-bold flex items-center justify-center shadow-xs transition-all duration-300 transform group-hover:scale-105 active:scale-95">
              <Plus className="w-5 h-5 text-[#D3A474] stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-semibold text-[#FAF7F2] group-hover:text-[#D3A474] transition-colors">➕ Pemasukan</span>
          </button>
 
          {/* Quick Add Pengeluaran */}
          <button 
            id="quick-add-pengeluaran"
            onClick={() => onOpenAddTransaction('pengeluaran')}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-1.5xl bg-[#D3A474]/20 hover:bg-[#D3A474]/30 text-[#D3A474] font-bold flex items-center justify-center shadow-xs transition-all duration-300 transform group-hover:scale-105 active:scale-95">
              <Minus className="w-5 h-5 text-[#D3A474] stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-semibold text-[#FAF7F2] group-hover:text-[#D3A474] transition-colors">➖ Pengeluaran</span>
          </button>
 
          {/* Lihat Laporan */}
          <button 
            id="quick-view-reports"
            onClick={() => setActiveTab('analytics')}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-1.5xl bg-[#D3A474]/20 hover:bg-[#D3A474]/30 text-[#D3A474] font-bold flex items-center justify-center shadow-xs transition-all duration-300 transform group-hover:scale-105 active:scale-95">
              <span className="text-xl">📊</span>
            </div>
            <span className="text-[10px] font-semibold text-[#FAF7F2] group-hover:text-[#D3A474] transition-colors">Lihat Laporan</span>
          </button>
        </div>
      </section>
 
      {/* 4. Beautiful Soft Charts Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Line Chart: Bulanan Cashflow Trend */}
        <div className="bg-[#1E3C2B] p-5 md:p-6 rounded-3xl border border-[#D3A474]/20 shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="font-fredoka font-semibold text-white text-sm md:text-base flex items-center gap-1">
                📈 Tren Keuangan Harian
              </h4>
              <p className="text-[10px] text-[#FAF7F2] mt-0.5">Aliran pemasukan &amp; pengeluaran sepekan terakhir</p>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 min-h-[300px] h-[300px]">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[#D3A474] text-lg mb-3 border border-white/10 animate-pulse">
                📈
              </div>
              <p className="text-[11px] font-bold text-white">Belum ada data transaksi.</p>
              <p className="text-[9px] text-[#FAF7F2]/80 mt-1 max-w-[190px]">Mulai catat pemasukan atau pengeluaran pertamamu.</p>
            </div>
          ) : (
            <div className="h-[300px] min-h-[300px] w-full pt-2">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData} margin={{ top: 12, right: 10, left: 15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" fontSize={10} tickMargin={8} tick={{ fill: '#FAF7F2' }} tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} tick={{ fill: '#FFFFFF', fontWeight: 'bold' }} tickMargin={8} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}rb` : v} />
                  <Tooltip 
                    cursor={{ stroke: '#D3A474', strokeWidth: 1 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#1E3C2B] p-3.5 rounded-2xl shadow-md border border-[#D3A474]/40 text-xs text-white">
                            <p className="font-bold text-[#FAF7F2] mb-1">{payload[0].payload.label}</p>
                            <p className="text-emerald-400 font-medium">Masuk: {formatRupiah(payload[0].value as number)}</p>
                            <p className="text-[#D3A474] font-medium">Keluar: {formatRupiah(payload[1].value as number)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line type="monotone" dataKey="income" stroke="#FFFFFF" strokeWidth={3} dot={{ r: 3, stroke: '#FFFFFF', fill: '#1E3C2B', strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="expense" stroke="#D3A474" strokeWidth={3} dot={{ r: 3, stroke: '#D3A474', fill: '#1E3C2B', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Donut Chart: Pengeluaran Kategori */}
        <div id="donut-chart-card" className="bg-[#1E3C2B] p-5 md:p-6 rounded-3xl border border-[#D3A474]/20 shadow-md flex flex-col justify-between">
          <div>
            <h4 className="font-fredoka font-semibold text-white text-sm md:text-base flex items-center gap-1.5">
              💡 Pengeluaran Kategori
            </h4>
            <p className="text-[10px] text-[#FAF7F2] mt-0.5">Proporsi pengeluaran berdasarkan kategori bulan ini</p>
          </div>

          {expensePieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 min-h-[300px] h-[300px]">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[#D3A474] text-lg mb-3 border border-white/10 animate-pulse">
                💡
              </div>
              <p className="text-[11px] font-bold text-white">Belum ada data transaksi.</p>
              <p className="text-[9px] text-[#FAF7F2]/80 mt-1 max-w-[190px]">Mulai catat pemasukan atau pengeluaran pertamamu.</p>
            </div>
          ) : (
            <div className="flex-grow flex flex-col sm:flex-row items-center justify-between gap-6 mt-4 min-h-[220px]">
              <div className="w-[160px] h-[160px] relative flex items-center justify-center flex-shrink-0">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={expensePieData}
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {expensePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                  <span className="text-[9px] uppercase tracking-widest text-[#FAF7F2] leading-none">Total</span>
                  <span className="text-[10px] font-bold font-fredoka text-white leading-normal mt-0.5 max-w-[110px] truncate text-center">
                    {formatRupiah(expensePieData.reduce((sum, item) => sum + item.value, 0))}
                  </span>
                </div>
              </div>

              {/* Legends */}
              <div className="flex-1 flex flex-col gap-2.5 w-full pr-1">
                {expensePieData.slice(0, 5).map((entry, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] select-none hover:bg-white/5 p-1 rounded-lg transition-colors">
                    <div className="flex items-center gap-2 text-[#FAF7F2] font-semibold min-w-0 flex-1">
                      <span className="w-2 rounded-full h-2 flex-shrink-0" style={{ backgroundColor: entry.color }}></span>
                      <span className="truncate" title={entry.name}>{entry.name}</span>
                    </div>
                    <span className="font-extrabold text-white ml-2 flex-shrink-0">{formatRupiah(entry.value)}</span>
                  </div>
                ))}
                {expensePieData.length > 5 && (
                  <button 
                    onClick={() => setActiveTab('analytics')}
                    className="text-left text-[9px] text-[#D3A474] font-bold hover:underline cursor-pointer mt-1 pl-1"
                  >
                    Selengkapnya di analisis &gt;
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

       {/* 5. Riwayat Transaksi */}
      <section className="w-full">
        {/* Riwayat Transaksi Box */}
        <div className="bg-[#1E3C2B] p-5 md:p-6 rounded-3xl border border-[#D3A474]/20 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h4 className="font-fredoka font-semibold text-white text-sm md:text-base flex items-center gap-1.5">
                📅 Transaksi Terbaru
              </h4>
              <button 
                id="view-all-trans-btn"
                onClick={() => setActiveTab('transactions')} 
                className="text-[#D3A474] hover:text-[#D3A474]/85 font-bold text-[10px] flex items-center gap-0.5 cursor-pointer"
              >
                Lihat Semua &gt;
              </button>
            </div>
            <p className="text-[10px] text-[#FAF7F2] mb-4">Catatan pemasukan &amp; pengeluaran teranyar</p>
          </div>

          <div className="flex-1 flex flex-col gap-3.5 max-h-[350px] overflow-y-auto pr-1">
            {transactions.slice(0, 5).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#FAF7F2] text-center flex-1 h-[220px]">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white text-lg mb-3 border border-white/10 animate-pulse">
                  📝
                </div>
                <p className="text-[11px] font-bold text-white">Belum ada transaksi.</p>
                <p className="text-[9px] text-[#FAF7F2]/80 mt-1 max-w-[190px]">Mulai catat pemasukan atau pengeluaran pertamamu.</p>
              </div>
            ) : (
              transactions.slice(0, 5).map((t) => {
                const isExpense = t.type === 'pengeluaran';
                const isTransfer = t.type === 'transfer';
                
                const catName = categories.find(c => c.id === t.categoryId)?.name || (isTransfer ? 'Transfer Saldo' : isExpense ? 'Pengeluaran' : 'Pemasukan');
                const catEmoji = getCatEmoji(catName);

                const pmSelected = paymentMethods.find(pm => pm.id === t.paymentMethodId);
                const pmName = pmSelected ? pmSelected.name : 'Cash';

                const formatDateText = (dStr: string) => {
                  try {
                    const d = new Date(dStr);
                    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                  } catch {
                    return '';
                  }
                };

                return (
                  <div key={t.id} className="flex flex-col bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-[#D3A474]/40 hover:bg-white/10 transition-all duration-200 text-left gap-1">
                    {/* Line 1: Icon + Nama transaksi */}
                    <div id={`trans-title-${t.id}`} className="font-semibold text-white text-xs md:text-sm flex items-center gap-1.5 leading-snug">
                      <span className="text-sm">{catEmoji}</span>
                      <span className="truncate">{t.notes || catName}</span>
                    </div>

                    {/* Line 2: Nominal */}
                    <div className={`font-bold text-xs md:text-sm leading-tight ${isExpense ? 'text-rose-400' : isTransfer ? 'text-white' : 'text-emerald-400'}`}>
                      {isExpense ? '-' : isTransfer ? '' : '+'}{formatRupiah(t.amount)}
                    </div>

                    {/* Line 3: Kategori • Metode Pembayaran */}
                    <div className="text-[10px] text-[#FAF7F2]/80 font-bold">
                       {catName} • {pmName}
                    </div>

                    {/* Line 4: Tanggal transaksi */}
                    <div className="text-[10px] text-[#FAF7F2]/60">
                      {formatDateText(t.date)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* POPUP MODAL UNTUK SALDO AWAL */}
      <AnimatePresence>
        {isInitialBalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
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
        )}
      </AnimatePresence>
    </div>
  );
}
