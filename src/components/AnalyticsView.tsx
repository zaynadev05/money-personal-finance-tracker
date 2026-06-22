import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieIcon, 
  Scale, 
  LineChart as LineIcon, 
  AlertTriangle, 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle,
  X,
  FileSpreadsheet,
  Sparkles
} from 'lucide-react';
import { RegisteredUser, Category } from '../types';
import { CategoryDB, TransactionDB } from '../database';
import { formatRupiah } from './DashboardView';

interface AnalyticsViewProps {
  currentUser: RegisteredUser;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

type TimeFilterType = 'today' | 'week' | 'month' | 'year' | 'custom';
type ChartStyle = 'line' | 'bar' | 'area';

export default function AnalyticsView({ currentUser, showToast }: AnalyticsViewProps) {
  // Load database items asynchronously
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const refreshData = async () => {
    try {
      setIsLoading(true);
      const [cList, tList] = await Promise.all([
        CategoryDB.getCategories(currentUser.id),
        TransactionDB.getTransactions(currentUser.id)
      ]);
      setCategories(cList);
      setTransactions(tList);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [currentUser.id]);

  // States
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('month');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('bar');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Filter transactions based on date selections
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    
    return transactions.filter((t) => {
      const tDate = new Date(t.date);
      
      if (timeFilter === 'today') {
        const todayStr = now.toISOString().split('T')[0];
        return t.date.split('T')[0] === todayStr;
      }
      
      if (timeFilter === 'week') {
        // Last 7 days
        const limit = new Date();
        limit.setDate(now.getDate() - 7);
        return tDate >= limit;
      }
      
      if (timeFilter === 'month') {
        // Current month & year
        return (tDate.getMonth() + 1) === currentMonth && tDate.getFullYear() === currentYear;
      }
      
      if (timeFilter === 'year') {
        // Current year
        return tDate.getFullYear() === currentYear;
      }
      
      if (timeFilter === 'custom') {
        let ok = true;
        if (customStart) {
          ok = ok && tDate >= new Date(customStart);
        }
        if (customEnd) {
          const endFull = new Date(customEnd);
          endFull.setHours(23, 59, 59, 999);
          ok = ok && tDate <= endFull;
        }
        return ok;
      }
      
      return true;
    });
  }, [transactions, timeFilter, customStart, customEnd, currentMonth, currentYear]);

  // Income vs Expense summary metrics for active filters
  const selectedStats = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    filteredTransactions.forEach(t => {
      if (t.type === 'pemasukan') {
        income += t.amount;
      } else if (t.type === 'pengeluaran') {
        expense += t.amount;
      }
    });

    return { income, expense, net: income - expense };
  }, [filteredTransactions]);

  // Aggregate Data for Charts
  const aggregatedChartData = useMemo(() => {
    if (timeFilter === 'today') {
      const segments = [
        { label: '00:00 - 06:00', startHour: 0, endHour: 6, income: 0, expense: 0 },
        { label: '06:00 - 12:00', startHour: 6, endHour: 12, income: 0, expense: 0 },
        { label: '12:00 - 18:00', startHour: 12, endHour: 18, income: 0, expense: 0 },
        { label: '18:00 - 24:00', startHour: 18, endHour: 24, income: 0, expense: 0 },
      ];

      filteredTransactions.forEach(t => {
        const hour = new Date(t.date).getHours();
        const seg = segments.find(s => hour >= s.startHour && hour < s.endHour);
        if (seg) {
          if (t.type === 'pemasukan') seg.income += t.amount;
          if (t.type === 'pengeluaran') seg.expense += t.amount;
        }
      });

      return segments.map(s => ({ label: s.label, income: s.income, expense: s.expense }));
    }

    if (timeFilter === 'week') {
      const weekdays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const past7Days: { label: string; dateVal: number; income: number; expense: number }[] = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        past7Days.push({
          label: weekdays[d.getDay()],
          dateVal: d.getDate(),
          income: 0,
          expense: 0,
        });
      }

      filteredTransactions.forEach(t => {
        const dateVal = new Date(t.date).getDate();
        const found = past7Days.find(d => d.dateVal === dateVal);
        if (found) {
          if (t.type === 'pemasukan') found.income += t.amount;
          if (t.type === 'pengeluaran') found.expense += t.amount;
        }
      });

      return past7Days.map(d => ({ label: d.label, income: d.income, expense: d.expense }));
    }

    if (timeFilter === 'year') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const monthlyBuckets = monthNames.map((name, i) => ({
        label: name,
        monthIndex: i + 1,
        income: 0,
        expense: 0,
      }));

      filteredTransactions.forEach(t => {
        const monthNum = new Date(t.date).getMonth() + 1;
        const bucket = monthlyBuckets.find(b => b.monthIndex === monthNum);
        if (bucket) {
          if (t.type === 'pemasukan') bucket.income += t.amount;
          if (t.type === 'pengeluaran') bucket.expense += t.amount;
        }
      });

      return monthlyBuckets.map(b => ({ label: b.label, income: b.income, expense: b.expense }));
    }

    const weeks = [
      { label: 'Minggu 1', startDay: 1, endDay: 7, income: 0, expense: 0 },
      { label: 'Minggu 2', startDay: 8, endDay: 14, income: 0, expense: 0 },
      { label: 'Minggu 3', startDay: 15, endDay: 21, income: 0, expense: 0 },
      { label: 'Minggu 4', startDay: 22, endDay: 31, income: 0, expense: 0 },
    ];

    filteredTransactions.forEach(t => {
      const day = new Date(t.date).getDate();
      const week = weeks.find(w => day >= w.startDay && day <= w.endDay) || weeks[3];
      if (t.type === 'pemasukan') week.income += t.amount;
      if (t.type === 'pengeluaran') week.expense += t.amount;
    });

    return weeks.map(w => ({ label: w.label, income: w.income, expense: w.expense }));
  }, [filteredTransactions, timeFilter]);

  // Aggregate Category breakdown for Pie Chart
  const pieChartData = useMemo(() => {
    const catMap = new Map<string, { name: string; value: number; color: string }>();
    
    filteredTransactions.forEach(t => {
      if (t.type === 'pengeluaran' && t.categoryId) {
        const cat = categories.find(c => c.id === t.categoryId);
        const catName = cat ? cat.name : 'Lainnya';
        const catColor = cat ? cat.color : '#FBCFE8';

        const existing = catMap.get(t.categoryId) || { name: catName, value: 0, color: catColor };
        catMap.set(t.categoryId, {
          ...existing,
          value: existing.value + t.amount,
        });
      }
    });

    return Array.from(catMap.values());
  }, [filteredTransactions, categories]);

  // Earthy premium palette representing gold-brown, crisp white, sand background, and custom green variants
  const PIE_COLORS = ['#D3A474', '#FFFFFF', '#F0E3D3', '#FAF7F2', '#E7D2B7'];

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 px-4 flex flex-col gap-6 animate-pulse text-[#1E3C2B]">
        <div className="flex justify-between items-center h-16">
          <div className="flex flex-col gap-2">
            <div className="h-6 w-40 bg-[#1E3C2B]/20 rounded-lg"></div>
            <div className="h-4 w-60 bg-[#1E3C2B]/10 rounded-lg"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-20 bg-[#1E3C2B] rounded-2xl opacity-60"></div>
          <div className="h-20 bg-[#1E3C2B] rounded-2xl opacity-60"></div>
          <div className="h-20 bg-[#1E3C2B] rounded-2xl opacity-60"></div>
        </div>
        <div className="h-64 bg-[#1E3C2B] rounded-[24px] opacity-60"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-24 md:pb-12 px-1 text-[#1E3C2B]">
      
      {/* Header Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 mt-4">
        <div>
          <h2 className="text-2xl font-fredoka font-semibold text-[#1E3C2B] tracking-tight flex items-center gap-2">
            📊 Analisis Keuangan
          </h2>
          <p className="text-xs text-[#1E3C2B]/80 font-bold">Bandingkan rasio pengeluaran, pantau anggaran tersisa, &amp; atur tabungan.</p>
        </div>
        
        {/* Time filters tab */}
        <div className="flex bg-[#1E3C2B]/10 p-1.5 rounded-2xl gap-0.5 border border-[#D3A474]/20 max-w-full overflow-x-auto self-start sm:self-auto select-none">
          {([
            { id: 'today', label: 'Hari Ini' },
            { id: 'week', label: '7 Hari' },
            { id: 'month', label: 'Bulan Ini' },
            { id: 'year', label: 'Tahun' },
            { id: 'custom', label: 'Manual' },
          ] as { id: TimeFilterType; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimeFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold leading-none select-none transition-all whitespace-nowrap cursor-pointer ${
                timeFilter === tab.id
                  ? 'bg-[#D3A474] text-white shadow-xs'
                  : 'text-[#1E3C2B]/60 hover:text-[#1E3C2B] bg-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Manual Custom Dates Selector if expanded */}
      {timeFilter === 'custom' && (
        <div className="bg-[#1E3C2B] text-white p-4 rounded-2xl border border-[#D3A474]/30 flex flex-wrap gap-4 items-center text-xs font-semibold animate-slide-up">
          <div className="flex items-center gap-2">
            <span className="text-[#FAF7F2]">Mulai:</span>
            <input
              id="analytics-custom-start"
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-[#F7F1EA] border border-[#D3A474] focus:outline-none focus:ring-1 focus:ring-[#D3A474] rounded-xl p-2 font-bold text-[#1E3C2B]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#FAF7F2]">Selesai:</span>
            <input
              id="analytics-custom-end"
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-[#F7F1EA] border border-[#D3A474] focus:outline-none focus:ring-1 focus:ring-[#D3A474] rounded-xl p-2 font-bold text-[#1E3C2B]"
            />
          </div>
        </div>
      )}

      {/* Aggregate Selected Stats Row */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Income */}
        <div className="bg-[#1E3C2B] text-white p-5 rounded-[22px] border border-[#D3A474]/20 shadow-xs relative overflow-hidden group transition-all">
          <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF7F2]/10 text-[#D3A474] flex items-center justify-center font-bold text-[9px]">
            IN
          </div>
          <p className="text-[10px] text-[#FAF7F2] font-bold uppercase tracking-wider">Total Pendapatan</p>
          <p className="text-xl font-fredoka font-bold text-[#D3A474] mt-1.5 tracking-tight">
            {formatRupiah(selectedStats.income)}
          </p>
        </div>

        {/* Total Expense */}
        <div className="bg-[#1E3C2B] text-white p-5 rounded-[22px] border border-[#D3A474]/20 shadow-xs relative overflow-hidden group transition-all">
          <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF7F2]/10 text-white flex items-center justify-center font-bold text-[9px]">
            OUT
          </div>
          <p className="text-[10px] text-[#FAF7F2] font-bold uppercase tracking-wider">Total Pengeluaran</p>
          <p className="text-xl font-fredoka font-bold text-white mt-1.5 tracking-tight">
            {formatRupiah(selectedStats.expense)}
          </p>
        </div>

        {/* Net Savings */}
        <div className="bg-[#1E3C2B] text-white p-5 rounded-[22px] border border-[#D3A474]/20 shadow-xs relative overflow-hidden group transition-all">
          <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF7F2]/10 text-[#F0E3D3] flex items-center justify-center font-bold text-[9px]">
            SAV
          </div>
          <p className="text-[10px] text-[#FAF7F2] font-bold uppercase tracking-wider">Selisih Bersih</p>
          <p className="text-xl font-fredoka font-bold text-[#F0E3D3] mt-1.5 tracking-tight">
            {formatRupiah(selectedStats.net)}
          </p>
        </div>
      </section>

      {/* Main Charts area */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Multi-Style Chart */}
        <div className="lg:col-span-2 bg-[#1E3C2B] p-5 rounded-[24px] border border-[#D3A474]/20 shadow-xs flex flex-col justify-between text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h4 className="font-fredoka font-semibold text-white text-base flex items-center gap-1.5">
                <LineIcon className="w-5 h-5 text-[#D3A474]" /> Grafik Arus Dana
              </h4>
              <p className="text-[10px] text-[#FAF7F2]/75 mt-0.5">Komparasi visual pemasukan vs pengeluran harian</p>
            </div>

            {/* Chart Style triggers */}
            <div className="flex bg-[#F0E3D3]/10 p-1 rounded-xl text-[10px] font-bold select-none border border-[#D3A474]/20 self-start sm:self-auto">
              {(['line', 'bar', 'area'] as ChartStyle[]).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setChartStyle(style)}
                  className={`px-3 py-1.5 rounded-lg uppercase select-none transition-all cursor-pointer ${
                    chartStyle === style
                      ? 'bg-[#D3A474] text-white shadow-xs'
                      : 'text-[#FAF7F2]/60 hover:text-white bg-transparent'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 min-h-[300px] h-[300px] text-[#FAF7F2]">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[#D3A474] text-lg mb-3 border border-white/10 animate-pulse">
                📊
              </div>
              <p className="text-[11px] font-bold text-white">Belum ada data transaksi.</p>
              <p className="text-[9px] text-[#FAF7F2]/80 mt-1 max-w-[190px]">Mulai catat pemasukan atau pengeluaran pertamamu.</p>
            </div>
          ) : (
            <div className="h-[300px] min-h-[300px] w-full pt-2 text-[#FAF7F2]">
              <ResponsiveContainer width="100%" height={300}>
                {chartStyle === 'line' ? (
                  <LineChart data={aggregatedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#FAF7F2" opacity={0.1} vertical={false} />
                    <XAxis dataKey="label" stroke="#FAF7F2" opacity={0.6} fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#FAF7F2" opacity={0.6} fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1E3C2B', borderColor: '#D3A474', borderRadius: '12px', color: '#FFF' }} formatter={(v: number) => formatRupiah(v)} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Line type="monotone" dataKey="income" name="Pemasukan" stroke="#D3A474" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="expense" name="Pengeluaran" stroke="#F0E3D3" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                ) : chartStyle === 'area' ? (
                  <AreaChart data={aggregatedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D3A474" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#D3A474" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F0E3D3" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#F0E3D3" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#FAF7F2" opacity={0.1} vertical={false} />
                    <XAxis dataKey="label" stroke="#FAF7F2" opacity={0.6} fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#FAF7F2" opacity={0.6} fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1E3C2B', borderColor: '#D3A474', borderRadius: '12px', color: '#FFF' }} formatter={(v: number) => formatRupiah(v)} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area type="monotone" dataKey="income" name="Pemasukan" stroke="#D3A474" strokeWidth={2.5} fillOpacity={1} fill="url(#colorInc)" />
                    <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#F0E3D3" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExp)" />
                  </AreaChart>
                ) : (
                  <BarChart data={aggregatedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#FAF7F2" opacity={0.1} vertical={false} />
                    <XAxis dataKey="label" stroke="#FAF7F2" opacity={0.6} fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#FAF7F2" opacity={0.6} fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1E3C2B', borderColor: '#D3A474', borderRadius: '12px', color: '#FFF' }} formatter={(v: number) => formatRupiah(v)} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar dataKey="income" name="Pemasukan" fill="#D3A474" barSize={13} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Pengeluaran" fill="#F0E3D3" barSize={13} radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Category breakdown visual Donut */}
        <div className="bg-[#1E3C2B] p-5 rounded-[24px] border border-[#D3A474]/20 shadow-xs flex flex-col justify-between text-white">
          <div>
            <h4 className="font-fredoka font-semibold text-white text-base flex items-center gap-1.5">
              <PieIcon className="w-5 h-5 text-[#D3A474]" /> Rasio Kategori
            </h4>
            <p className="text-[10px] text-[#FAF7F2]/75 mt-0.5 font-medium">Bahan evaluasi kategori terboros</p>
          </div>

          {pieChartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 min-h-[300px] h-[300px]">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[#D3A474] text-lg mb-3 border border-white/10 animate-pulse">
                💡
              </div>
              <p className="text-[11px] font-bold text-white">Belum ada data transaksi.</p>
              <p className="text-[9px] text-[#FAF7F2]/80 mt-1 max-w-[190px]">Mulai catat pemasukan atau pengeluaran pertamamu.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-around py-1 min-h-[300px]">
              <div className="h-[300px] min-h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1E3C2B', borderColor: '#D3A474', borderRadius: '12px', color: '#FFF' }} formatter={(v: number) => formatRupiah(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend with values */}
              <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto mt-2 pr-1">
                {pieChartData.map((d, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px]">
                    <div className="flex items-center gap-1.5 text-[#FAF7F2] min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></span>
                      <span className="truncate font-semibold">{d.name}</span>
                    </div>
                    <span className="font-bold text-white">{formatRupiah(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </section>



    </div>
  );
}
