import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  ChevronLeft, 
  ChevronRight, 
  X,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  CalendarDays,
  Sparkles,
  Printer,
  Download
} from 'lucide-react';
import { RegisteredUser, Wallet, Category, Transaction, TransactionType, PaymentMethod } from '../types';
import { TransactionDB, WalletDB, CategoryDB, PaymentMethodDB } from '../database';
import { formatRupiah } from './DashboardView';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface TransactionsViewProps {
  currentUser: RegisteredUser;
  showToast: (msg: string, type: 'success' | 'error') => void;
  // Let parent pass active trans modal trigger if any, or manage internally
  isAddModalOpenInitially?: boolean;
  onAddModalCloseComplete?: () => void;
  initialType?: 'pemasukan' | 'pengeluaran' | 'transfer' | null;
}

export default function TransactionsView({
  currentUser,
  showToast,
  isAddModalOpenInitially = false,
  onAddModalCloseComplete,
  initialType = null
}: TransactionsViewProps) {
  // Load database items
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = async () => {
    try {
      setIsLoading(true);
      const [wList, cList, tList, pmList] = await Promise.all([
        WalletDB.getWallets(currentUser.id),
        CategoryDB.getCategories(currentUser.id),
        TransactionDB.getTransactions(currentUser.id),
        PaymentMethodDB.getPaymentMethods(currentUser.id),
      ]);
      setWallets(wList);
      setCategories(cList);
      setTransactions(tList);
      setPaymentMethods(pmList);
    } catch (err) {
      console.error('Failed to load transaction data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [currentUser.id]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterWallet, setFilterWallet] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpenInitially);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedTransId, setSelectedTransId] = useState<string | null>(null);

  const txAmountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isModalOpen) {
      // Small timeout to ensure the modal animation is underway or finished and input is focusable in DOM
      const timer = setTimeout(() => {
        txAmountRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen]);

  // Modal form values
  const [txType, setTxType] = useState<TransactionType>('pengeluaran');
  const [txAmount, setTxAmount] = useState<number | ''>('');
  const [txWalletId, setTxWalletId] = useState('');
  const [txToWalletId, setTxToWalletId] = useState('');
  const [txCategoryId, setTxCategoryId] = useState('');
  const [txPaymentMethodId, setTxPaymentMethodId] = useState('');
  const [txNotes, setTxNotes] = useState('');
  const [txDate, setTxDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customCategoryIcon, setCustomCategoryIcon] = useState('✨');

  // Month & Year filter for PDF Report
  const [reportMonth, setReportMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState<number>(() => new Date().getFullYear());

  const MONTHS_INDONESIAN = useMemo(() => [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' }
  ], []);

  const REPORT_YEARS = useMemo(() => [2025, 2026, 2027, 2028, 2029], []);

  const monthlyTransCount = useMemo(() => {
    return transactions.filter((t) => {
      const tDate = new Date(t.date);
      return (tDate.getMonth() + 1) === reportMonth && tDate.getFullYear() === reportYear;
    }).length;
  }, [transactions, reportMonth, reportYear]);

  const handleDownloadPDF = () => {
    const monthlyTrans = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return (tDate.getMonth() + 1) === reportMonth && tDate.getFullYear() === reportYear;
    });

    if (monthlyTrans.length === 0) {
      showToast('Tidak ada data transaksi pada bulan ini untuk dicetak.', 'error');
      return;
    }

    try {
      const monthName = MONTHS_INDONESIAN.find(m => m.value === reportMonth)?.label || '';
      const periodLabel = `${monthName} ${reportYear}`;
      const currentDateTime = new Date().toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }) + ' WIB';

      // Calculate stats
      const totalIncome = monthlyTrans
        .filter(t => t.type === 'pemasukan')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = monthlyTrans
        .filter(t => t.type === 'pengeluaran')
        .reduce((sum, t) => sum + t.amount, 0);

      const netBalance = totalIncome - totalExpense;

      // Construct rows HTML dynamically
      const tableRowsHTML = monthlyTrans.map((row) => {
        const rowDate = new Date(row.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        const rowCat = categories.find(c => c.id === row.categoryId)?.name || (row.type === 'transfer' ? 'Transfer Saldo' : 'Pemasukan');
        const rowNotes = row.notes || '-';
        const isExpense = row.type === 'pengeluaran';
        const typeLabel = row.type === 'pengeluaran' ? 'Pengeluaran' : row.type === 'pemasukan' ? 'Pemasukan' : 'Transfer';
        const amountStr = (isExpense ? '-' : '') + formatRupiah(row.amount);
        const amountColor = isExpense ? '#DC2626' : '#287350';
        
        return `
          <tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 10px 8px; border: 1px solid #E5E7EB; text-align: center; vertical-align: middle;">${rowDate}</td>
            <td style="padding: 10px 8px; border: 1px solid #E5E7EB; font-weight: bold; color: #1E3C2B; vertical-align: middle;">${rowCat}</td>
            <td style="padding: 10px 8px; border: 1px solid #E5E7EB; color: #4B5563; vertical-align: middle;">${rowNotes}</td>
            <td style="padding: 10px 8px; border: 1px solid #E5E7EB; text-align: center; font-weight: bold; color: ${amountColor}; vertical-align: middle;">${typeLabel}</td>
            <td style="padding: 10px 8px; border: 1px solid #E5E7EB; text-align: right; font-weight: bold; color: ${amountColor}; vertical-align: middle;">${amountStr}</td>
          </tr>
        `;
      }).join('');

      // Create dummy element for html2pdf with full professional styled layout
      const element = document.createElement('div');
      element.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 25px; color: #282828; background-color: #FFFFFF; line-height: 1.5; border: 1px solid #E5E7EB; border-radius: 8px;">
          <!-- Elegant Monify Banner Header -->
          <div style="background-color: #1E3C2B; padding: 24px; border-radius: 8px 8px 0 0; color: #FFFFFF; display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #D3A474;">
            <div>
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 1px; color: #FFFFFF;">MONIFY</h1>
              <p style="margin: 4px 0 0 0; font-size: 10px; color: #D3A474; font-weight: bold; letter-spacing: 0.5px;">PLATFORM MANAJEMEN KEUANGAN PERSONAL</p>
            </div>
            <div style="text-align: right; font-size: 11px;">
              <h3 style="margin: 0; font-size: 11px; color: #D3A474; font-weight: bold;">LAPORAN BULANAN RESMI</h3>
              <p style="margin: 4px 0 0 0; font-size: 9px; color: #FAF7F2; opacity: 0.85;">Dibuat otomatis oleh sistem</p>
            </div>
          </div>

          <!-- Document Meta Details -->
          <div style="margin-top: 25px; margin-bottom: 25px;">
            <h2 style="margin: 0; font-size: 18px; color: #1E3C2B; font-weight: bold;">Laporan Keuangan Bulanan</h2>
            <div style="margin-top: 10px; display: flex; justify-content: space-between; gap: 10px; font-size: 11px; color: #4B5563;">
              <div>
                <span style="font-weight: bold; color: #1E3C2B;">Periode Laporan:</span> ${periodLabel}<br>
                <span style="font-weight: bold; color: #1E3C2B;">Pemilik Akun:</span> ${currentUser.fullName}
              </div>
              <div style="text-align: right;">
                <span style="font-weight: bold; color: #1E3C2B;">Tanggal Cetak:</span> ${currentDateTime}<br>
                <span style="font-weight: bold; color: #1E3C2B;">Status:</span> Dokumen Valid / Otentik
              </div>
            </div>
          </div>

          <hr style="border: 0; border-top: 1px dashed #D3A474; margin-bottom: 25px;" />

          <!-- Dynamic Flex Summary Cards -->
          <div style="display: flex; gap: 15px; margin-bottom: 30px;">
            <div style="flex: 1; background-color: #EBFDF5; border-left: 5px solid #10B981; padding: 15px; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
              <div style="font-size: 9px; font-weight: bold; color: #047857; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL PEMASUKAN</div>
              <div style="font-size: 15px; font-weight: bold; color: #065F46; margin-top: 6px;">Rp ${formatRupiah(totalIncome).replace('Rp', '').trim()}</div>
            </div>
            
            <div style="flex: 1; background-color: #FEF2F2; border-left: 5px solid #EF4444; padding: 15px; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
              <div style="font-size: 9px; font-weight: bold; color: #B91C1C; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL PENGELUARAN</div>
              <div style="font-size: 15px; font-weight: bold; color: #991B1B; margin-top: 6px;">Rp ${formatRupiah(totalExpense).replace('Rp', '').trim()}</div>
            </div>

            <div style="flex: 1; background-color: #FDFBF7; border-left: 5px solid #D3A474; padding: 15px; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border: 1px solid #F0E3D3;">
              <div style="font-size: 9px; font-weight: bold; color: #854D0E; text-transform: uppercase; letter-spacing: 0.5px;">SALDO BERSIH SISA</div>
              <div style="font-size: 15px; font-weight: bold; color: #1E3C2B; margin-top: 6px;">Rp ${formatRupiah(netBalance).replace('Rp', '').trim()}</div>
            </div>
          </div>

          <!-- Transaction Table Title Header -->
          <h3 style="font-size: 13px; color: #1E3C2B; font-weight: bold; margin-bottom: 12px; border-bottom: 2px solid #1E3C2B; padding-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Daftar Transaksi Terperinci</h3>

          <!-- Details Table -->
          <table style="width: 100%; border-collapse: collapse; font-size: 9.5px; margin-bottom: 25px;">
            <thead>
              <tr style="background-color: #1E3C2B; color: #FFFFFF; font-weight: bold; text-align: left;">
                <th style="padding: 10px; border: 1px solid #D3A474; text-align: center; width: 15%; color: #FFFFFF;">Tanggal</th>
                <th style="padding: 10px; border: 1px solid #D3A474; width: 22%; color: #FFFFFF;">Kategori</th>
                <th style="padding: 10px; border: 1px solid #D3A474; width: 35%; color: #FFFFFF;">Catatan / Deskripsi</th>
                <th style="padding: 10px; border: 1px solid #D3A474; text-align: center; width: 13%; color: #FFFFFF;">Jenis</th>
                <th style="padding: 10px; border: 1px solid #D3A474; text-align: right; width: 15%; color: #FFFFFF;">Nominal</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHTML}
            </tbody>
          </table>

          <!-- Footer & Signature Note -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 35px; font-size: 9px; color: #6B7280; border-top: 1px solid #E5E7EB; padding-top: 15px;">
            <div>
              <p style="margin: 0; font-style: italic;">Laporan ini dicetak secara digital dan sah tanpa tanda tangan basah.</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; font-weight: bold; color: #1E3C2B;">Monify App</p>
              <p style="margin: 2px 0 0 0;">Green & Gold Personal Ledger</p>
            </div>
          </div>
        </div>
      `;

      const opt = {
        margin:       15,
        filename:     `Monify_Laporan_${monthName}_${reportYear}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      } as any;

      // Trigger standard html2pdf library flow to compile and download automatically
      html2pdf().from(element).set(opt).save();

      showToast('Laporan PDF berhasil diunduh!', 'success');
    } catch (err: any) {
      console.error('PDF generation error:', err);
      showToast('Gagal mencetak laporan PDF.', 'error');
    }
  };


  // Confirmation Delete State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTransId, setDeleteTransId] = useState<string | null>(null);

  // Auto-fill from dashboard Quick Actions when triggered
  useEffect(() => {
    if (isAddModalOpenInitially) {
      setModalMode('add');
      setSelectedTransId(null);
      setTxAmount('');
      setTxNotes('');
      setTxDate(new Date().toISOString().split('T')[0]);

      if (paymentMethods.length > 0) {
        setTxPaymentMethodId(paymentMethods[0].id);
      } else {
        setTxPaymentMethodId('');
      }

      const type = (initialType as TransactionType) || 'pengeluaran';
      setTxType(type);

      if (wallets.length > 0) {
        setTxWalletId(wallets[0].id);
        setTxToWalletId('');
      } else {
        setTxWalletId('');
        setTxToWalletId('');
      }

      const match = categories.find(c => c.type === type);
      setTxCategoryId(match ? match.id : 'other_custom');
    }
    setIsModalOpen(isAddModalOpenInitially);
  }, [isAddModalOpenInitially, initialType, categories, wallets, paymentMethods]);

  // Auto-align default IDs when txType triggers
  const handleTypeChange = (type: TransactionType) => {
    setTxType(type);
    if (wallets.length > 0) {
      if (!txWalletId) setTxWalletId(wallets[0].id);
    }
    const match = categories.find(c => c.type === type);
    setTxCategoryId(match ? match.id : 'other_custom');
  };

  // Open Modal Helpers
  const openAddModal = () => {
    setModalMode('add');
    setSelectedTransId(null);
    setTxType('pengeluaran');
    setTxAmount('');
    setTxNotes('');
    setTxDate(new Date().toISOString().split('T')[0]);
    setCustomCategoryName('');
    setCustomCategoryIcon('✨');
    
    if (paymentMethods.length > 0) {
      setTxPaymentMethodId(paymentMethods[0].id);
    } else {
      setTxPaymentMethodId('');
    }

    if (wallets.length > 0) {
      setTxWalletId(wallets[0].id);
      setTxToWalletId('');
    } else {
      setTxWalletId('');
      setTxToWalletId('');
    }

    const firstExp = categories.find(c => c.type === 'pengeluaran');
    setTxCategoryId(firstExp ? firstExp.id : 'other_custom');
    setIsModalOpen(true);
  };

  const openEditModal = (t: Transaction) => {
    setModalMode('edit');
    setSelectedTransId(t.id);
    setTxType(t.type);
    setTxAmount(t.amount);
    setTxWalletId(t.walletId);
    setTxToWalletId('');
    setTxCategoryId(t.categoryId || '');
    setTxPaymentMethodId(t.paymentMethodId || (paymentMethods[0]?.id || ''));
    setTxNotes(t.notes);
    setTxDate(t.date.split('T')[0]);
    setCustomCategoryName('');
    setCustomCategoryIcon('✨');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCustomCategoryName('');
    setCustomCategoryIcon('✨');
    if (onAddModalCloseComplete) onAddModalCloseComplete();
  };

  // Saving Forms
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalCategoryId = txCategoryId;

    if (txType !== 'transfer' && txCategoryId === 'other_custom') {
      if (!customCategoryName.trim()) {
        showToast('Nama kategori baru tidak boleh kosong.', 'error');
        return;
      }

      try {
        const newCat = await CategoryDB.addCategory(
          currentUser.id,
          customCategoryName.trim(),
          txType === 'pemasukan' ? 'pemasukan' : 'pengeluaran',
          customCategoryIcon,
          '#D3A474'
        );
        finalCategoryId = newCat.id;
        showToast(`Kategori "${newCat.name}" berhasil dibuat!`, 'success');
      } catch (err: any) {
        showToast(err.message || 'Gagal membuat kategori baru.', 'error');
        return;
      }
    }

    const isCategoryEmpty = txType !== 'transfer' && !finalCategoryId;
    if (!txAmount || Number(txAmount) <= 0 || isCategoryEmpty || !txDate || txDate.trim() === '') {
      showToast('Data transaksi belum lengkap.', 'error');
      return;
    }

    const targetWalletId = txWalletId || wallets[0]?.id;
    if (!targetWalletId) {
      showToast('Sistem sedang menginisialisasi saku keuangan, harap tunggu sebentar.', 'error');
      return;
    }

    try {
      if (modalMode === 'add') {
        await TransactionDB.addTransaction(
          currentUser.id,
          targetWalletId,
          undefined,
          finalCategoryId ? finalCategoryId : undefined,
          txType,
          Number(txAmount),
          txNotes,
          new Date(txDate).toISOString(),
          txPaymentMethodId || undefined
        );
        showToast('Transaksi baru berhasil dicatat!', 'success');
      } else if (modalMode === 'edit' && selectedTransId) {
        await TransactionDB.updateTransaction(currentUser.id, selectedTransId, {
          walletId: targetWalletId,
          toWalletId: undefined,
          categoryId: finalCategoryId ? finalCategoryId : undefined,
          paymentMethodId: txPaymentMethodId || undefined,
          type: txType,
          amount: Number(txAmount),
          notes: txNotes,
          date: new Date(txDate).toISOString(),
        });
        showToast('Transaksi berhasil diperbarui!', 'success');
      }
      handleCloseModal();
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan transaksi.', 'error');
    }
  };

  // Deletion logic
  const triggerDelete = (transId: string) => {
    setDeleteTransId(transId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTransId) {
      try {
        await TransactionDB.deleteTransaction(currentUser.id, deleteTransId);
        showToast('Transaksi berhasil dihapus!', 'success');
        setIsDeleteConfirmOpen(false);
        setDeleteTransId(null);
        await refreshData();
        // Reset to first page if item count depletes
        if (filteredTransactions.length <= 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } catch (err: any) {
        showToast(err.message || 'Gagal menghapus transaksi.', 'error');
      }
    }
  };

  // Filter application
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Search term (Notes / Keterangan)
      const matchesSearch = t.notes.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Type filter
      const matchesType = filterType === 'all' || t.type === filterType;

      // Wallet filter
      const matchesWallet = 
        filterWallet === 'all' || 
        t.walletId === filterWallet || 
        (t.type === 'transfer' && t.toWalletId === filterWallet);

      // Category filter
      const matchesCategory = filterCategory === 'all' || t.categoryId === filterCategory;

      // Date boundaries
      let matchesDates = true;
      if (startDate) {
        matchesDates = matchesDates && new Date(t.date) >= new Date(startDate);
      }
      if (endDate) {
        const endFull = new Date(endDate);
        endFull.setHours(23, 59, 59, 999);
        matchesDates = matchesDates && new Date(t.date) <= endFull;
      }

      return matchesSearch && matchesType && matchesWallet && matchesCategory && matchesDates;
    });
  }, [transactions, searchTerm, filterType, filterWallet, filterCategory, startDate, endDate]);

  // Pagination division
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));

  const resetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterWallet('all');
    setFilterCategory('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

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

  // Loading skeleton state
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 px-4 flex flex-col gap-6 animate-pulse text-[#1E3C2B]">
        <div className="flex justify-between items-center h-16">
          <div className="flex flex-col gap-2">
            <div className="h-6 w-40 bg-[#1E3C2B]/20 rounded-lg"></div>
            <div className="h-4 w-60 bg-[#1E3C2B]/10 rounded-lg"></div>
          </div>
          <div className="h-10 w-28 bg-[#1E3C2B]/20 rounded-xl"></div>
        </div>
        <div className="h-16 w-full bg-[#1E3C2B]/10 rounded-2xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="h-20 bg-[#1E3C2B]/5 rounded-2xl p-4"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-24 md:pb-12 px-1 text-[#1E3C2B]">
      
      {/* Header Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 mt-4">
        <div>
          <h2 className="text-2xl font-fredoka font-semibold text-[#1E3C2B] tracking-tight flex items-center gap-1.5">
            📂 Riwayat Keuangan
          </h2>
          <p className="text-xs text-[#1E3C2B]/85 font-medium">Temukan seluruh catatan pengeluaran, transfer, dan pemasukanmu lengkap.</p>
        </div>
        <button
          id="trans-add-trigger-btn"
          onClick={openAddModal}
          className="bg-[#D3A474] hover:bg-[#C69360] text-white px-5 py-3 rounded-2xl text-xs font-semibold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Tambah Transaksi</span>
        </button>
      </div>

      {/* Filter and Search Panel Module */}
      <div className="bg-[#1E3C2B] p-5 rounded-[24px] border border-[#D3A474]/20 shadow-xs flex flex-col gap-4 text-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Real-time search terms */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#D3A474]" />
            <input
              id="trans-search-input"
              type="text"
              placeholder="Cari kata kunci (cth: Bakso)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#F7F1EA] border border-[#D3A474] focus:ring-1 focus:ring-[#D3A474] focus:outline-none rounded-2xl pl-9 pr-4 py-2.5 text-xs text-[#1E3C2B] placeholder:text-slate-400 font-bold transition-all"
            />
          </div>

          {/* Type Filter selector */}
          <div className="flex items-center bg-[#F7F1EA] border border-[#D3A474] rounded-2xl px-2.5">
            <Filter className="w-3.5 h-3.5 text-[#D3A474] mr-2" />
            <select
              id="trans-filter-type"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 bg-transparent text-xs py-2.5 focus:outline-none text-[#1E3C2B] capitalize font-bold cursor-pointer"
            >
              <option value="all">Semua Tipe</option>
              <option value="pemasukan">Pemasukan (In)</option>
              <option value="pengeluaran">Pengeluaran (Out)</option>
            </select>
          </div>

          {/* Category Filter Selector */}
          <div className="flex items-center bg-[#F7F1EA] border border-[#D3A474] rounded-2xl px-2.5">
            <Filter className="w-3.5 h-3.5 text-[#D3A474] mr-2" />
            <select
              id="trans-filter-category"
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 bg-transparent text-xs py-2.5 focus:outline-none text-[#1E3C2B] font-bold cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type === 'pemasukan' ? 'In' : 'Out'})
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Custom ranges filter expand */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#FAF7F2]/10 pt-3 text-xs text-[#FAF7F2]/75">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-white flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-[#D3A474]" /> Rentang Tanggal:</span>
            <div className="flex items-center gap-2">
              <input
                id="trans-start-date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-[#F7F1EA] border border-[#D3A474] rounded-xl px-2 py-1 focus:outline-none text-[11px] font-bold text-[#1E3C2B]"
              />
              <span className="font-medium text-[#FAF7F2]/60">s/d</span>
              <input
                id="trans-end-date"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-[#F7F1EA] border border-[#D3A474] rounded-xl px-2 py-1 focus:outline-none text-[11px] font-bold text-[#1E3C2B]"
              />
            </div>
          </div>
          {(searchTerm || filterType !== 'all' || filterWallet !== 'all' || filterCategory !== 'all' || startDate || endDate) && (
            <button
              id="trans-reset-btn"
              onClick={resetFilters}
              className="text-[#D3A474] hover:text-[#C69360] font-bold text-xs hover:underline cursor-pointer"
            >
              Reset Filter &amp; Pencarian
            </button>
          )}
        </div>

        {/* Section 3: Cetak Laporan PDF */}
        <div className="border-t border-[#FAF7F2]/10 pt-4 mt-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D3A474]/15 border border-[#D3A474]/20 flex items-center justify-center text-[#D3A474] flex-shrink-0 shadow-sm animate-pulse-subtle">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-fredoka font-semibold text-white text-xs leading-none flex items-center gap-1.5">
                Cetak Laporan Bulanan (PDF)
              </h4>
              <p className="text-[10px] text-[#FAF7F2]/70 mt-1">
                Unduh bukti rekapitulasi data pengeluaran & pemasukan bulanan Anda.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Dropdown */}
            <select
              id="report-month-select"
              value={reportMonth}
              onChange={(e) => setReportMonth(Number(e.target.value))}
              className="bg-[#F7F1EA] border border-[#D3A474] rounded-xl px-2.5 py-1.5 text-xs text-[#1E3C2B] font-bold focus:outline-none cursor-pointer"
            >
              {MONTHS_INDONESIAN.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            {/* Year Dropdown */}
            <select
              id="report-year-select"
              value={reportYear}
              onChange={(e) => setReportYear(Number(e.target.value))}
              className="bg-[#F7F1EA] border border-[#D3A474] rounded-xl px-2.5 py-1.5 text-xs text-[#1E3C2B] font-bold focus:outline-none cursor-pointer"
            >
              {REPORT_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            {/* Print Button */}
            <button
              id="download-monthly-report-btn"
              onClick={handleDownloadPDF}
              disabled={monthlyTransCount === 0}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all duration-300 transform active:scale-95 ${
                monthlyTransCount > 0
                  ? 'bg-[#D3A474] hover:bg-[#C69360] text-white hover:scale-105 cursor-pointer'
                  : 'bg-white/10 text-white/40 cursor-not-allowed border border-white/5'
              }`}
              title={monthlyTransCount === 0 ? 'Tidak ada data transaksi' : 'Download Laporan PDF'}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Cetak Laporan PDF</span>
            </button>
          </div>
        </div>

        {/* Info Badge status for Report */}
        <div className="flex items-center justify-end text-[10px] font-sans pr-1">
          {monthlyTransCount > 0 ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {monthlyTransCount} transaksi di {MONTHS_INDONESIAN.find(m => m.value === reportMonth)?.label} {reportYear} siap dicetak.
            </span>
          ) : (
            <span className="text-rose-400/95 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              Tidak ada data transaksi pada bulan ini untuk dicetak.
            </span>
          )}
        </div>
      </div>

      {/* Main Transactions List (Modern Card List instead of rigid table) */}
      <div className="flex flex-col gap-4">
        {transactions.length === 0 ? (
          <div className="bg-[#1E3C2B] rounded-[24px] border border-[#D3A474]/20 shadow-xs px-6 py-14 text-center text-white">
            <div className="flex flex-col items-center justify-center gap-3">
              <span className="text-4xl animate-bounce">🦖</span>
              <p className="font-fredoka font-semibold text-white text-sm">Belum ada transaksi.</p>
              <p className="text-[10px] text-[#FAF7F2]/75 max-w-sm">Mulai catat pemasukan atau pengeluaran pertamamu.</p>
            </div>
          </div>
        ) : paginatedTransactions.length === 0 ? (
          <div className="bg-[#1E3C2B] rounded-[24px] border border-[#D3A474]/20 shadow-xs px-6 py-14 text-center text-white">
            <div className="flex flex-col items-center justify-center gap-3">
              <span className="text-4xl animate-bounce">🦖</span>
              <p className="font-fredoka font-semibold text-white text-sm">Tidak ada transaksi ditemukan</p>
              <p className="text-[10px] text-[#FAF7F2]/75 max-w-sm">Kriteria filter atau pencarian Anda tidak menghasilkan data acuan riwayat belanja.</p>
              <button 
                onClick={resetFilters} 
                className="mt-2 text-xs bg-[#D3A474] hover:bg-[#C69360] text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Kembali ke Semua Transaksi
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paginatedTransactions.map((t) => {
              const isExp = t.type === 'pengeluaran';
              const isTrf = t.type === 'transfer';
              const matchingPm = paymentMethods.find((p) => p.id === t.paymentMethodId);
              
              const wSource = wallets.find(w => w.id === t.walletId)?.name || 'Dompet';
              const wDest = isTrf ? (wallets.find(w => w.id === t.toWalletId)?.name || 'Dompet') : '';
              const cat = categories.find(c => c.id === t.categoryId);
              
              const catName = cat ? cat.name : (isTrf ? 'Transfer Saldo' : 'Pemasukan');
              const catEmoji = getCatEmoji(catName);

              return (
                <div 
                  key={t.id} 
                  className="bg-[#1E3C2B] p-4 rounded-[20px] border border-[#D3A474]/20 hover:border-[#D3A474]/55 hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-3 group relative overflow-hidden text-white"
                >
                  <div className="flex items-start justify-between gap-2">
                     <div className="flex items-center gap-3 min-w-0">
                      {/* Emoji Icon Badge */}
                      <div className="w-10 h-10 rounded-2xl bg-[#F0E3D3]/10 border border-[#D3A474]/20 flex items-center justify-center text-lg flex-shrink-0">
                        {catEmoji}
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-white text-xs truncate leading-snug group-hover:text-[#D3A474] transition-colors font-sans">
                          {t.notes || catName}
                        </p>
                        <p className="text-[9px] text-[#FAF7F2]/75 mt-0.5 font-medium flex items-center gap-1.5 flex-wrap font-sans">
                          <span className="text-[#D3A474] font-bold uppercase tracking-wider">{catName}</span>
                          <span>•</span>
                          {matchingPm && (
                            <>
                              <span className="bg-[#FAF7F2]/10 px-1.5 py-0.5 rounded-md border border-[#D3A474]/15 text-[#FAF7F2] font-bold flex items-center gap-1">
                                {matchingPm.icon} {matchingPm.name}
                              </span>
                              <span>•</span>
                            </>
                          )}
                          <span className="text-[#FAF7F2]/60">{new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </p>
                      </div>
                    </div>

                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 font-sans ${
                      isExp 
                        ? 'bg-rose-500/10 text-rose-300 border border-rose-500/10' 
                        : isTrf 
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/10' 
                          : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/10'
                    }`}>
                      {t.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-end border-t border-[#FAF7F2]/10 pt-2.5 mt-1.5">

                    <div className="flex items-center gap-2">
                      <p className={`font-fredoka font-semibold text-xs md:text-sm mr-2 ${
                        isExp 
                          ? 'text-rose-455 font-bold text-white' 
                          : isTrf 
                            ? 'text-amber-400 font-bold' 
                            : 'text-[#D3A474] font-bold'
                      }`}>
                        {isExp ? '-' : isTrf ? '' : '+'}{formatRupiah(t.amount)}
                      </p>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(t)}
                          className="bg-[#FAF7F2]/10 hover:bg-[#D3A474] text-[#FAF7F2] hover:text-white p-1.5 rounded-xl transition-colors cursor-pointer"
                          title="Edit Transaksi"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => triggerDelete(t.id)}
                          className="bg-rose-500/10 hover:bg-rose-500 text-[#FCA5A5] hover:text-white p-1.5 rounded-xl transition-colors cursor-pointer"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Pagination Control */}
        <div className="bg-[#1E3C2B] border border-[#D3A474]/20 rounded-[24px] px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white shadow-xs">
          <div className="font-semibold text-[#FAF7F2]/80 font-sans">
            Menampilkan <span className="font-bold text-white">{paginatedTransactions.length}</span> dari{' '}
            <span className="font-bold text-white">{filteredTransactions.length}</span> data transaksi
          </div>

          <div className="flex items-center gap-1 font-sans">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-[#D3A474]/30 bg-[#F7F1EA] text-[#1E3C2B] hover:bg-[#F7F1EA]/80 disabled:opacity-40 select-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 font-semibold text-white text-xs font-sans">
              Halaman {currentPage} dari {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-[#D3A474]/30 bg-[#F7F1EA] text-[#1E3C2B] hover:bg-[#F7F1EA]/80 disabled:opacity-40 select-none transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* CORE MODAL FOR CREATE & UPDATE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-[#1E3C2B] rounded-[28px] shadow-xl overflow-hidden animate-slide-up border border-[#D3A474]/30 text-white">
            {/* Header */}
            <div className="px-6 py-5 bg-[#D3A474] text-white flex justify-between items-center">
              <h3 className="font-fredoka font-semibold text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-white" />
                <span>{modalMode === 'add' ? 'Catat Transaksi Baru' : 'Perbarui Transaksi'}</span>
              </h3>
              <button onClick={handleCloseModal} className="text-white hover:text-[#FAF7F2] p-1 rounded-full bg-white/20 cursor-pointer">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Forms body */}
            <form onSubmit={handleSaveTransaction} className="p-6 flex flex-col gap-4 text-xs">
              
              {/* Type toggle selector tab */}
              <div className="flex bg-[#1E3C2B]/50 p-1.5 rounded-2xl border border-[#D3A474]/30 gap-1">
                {(['pengeluaran', 'pemasukan'] as TransactionType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeChange(type)}
                    className={`flex-1 text-center py-2.5 text-xs font-bold capitalize rounded-xl transition-all cursor-pointer ${
                      txType === type
                        ? type === 'pemasukan'
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-[#D3A474] text-white shadow-sm'
                        : 'text-[#FAF7F2]/65 hover:text-white bg-transparent font-semibold'
                    }`}
                  >
                    {type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
                  </button>
                ))}
              </div>

              {/* Nominal inputs */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#FAF7F2]/80 uppercase pl-1 tracking-wider">Nominal Transaksi (Rupiah)</label>
                <div className="relative">
                  <span className="font-bold text-xs text-[#1E3C2B]/50 absolute left-3.5 top-1/2 -translate-y-1/2">Rp</span>
                  <input
                    id="modal-tx-amount"
                    ref={txAmountRef}
                    type="number"
                    required
                    min="1"
                    placeholder="Contoh: 15000"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#F7F1EA] border border-[#D3A474] focus:ring-1 focus:ring-[#D3A474] focus:outline-none rounded-2xl pl-10 pr-4 py-3 text-xs text-[#1E3C2B] font-bold transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Category selector */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#FAF7F2]/80 uppercase pl-1 tracking-wider">Pilih Kategori</label>
                <select
                  id="modal-tx-category"
                  value={txCategoryId}
                  onChange={(e) => {
                    setTxCategoryId(e.target.value);
                    if (e.target.value !== 'other_custom') {
                      setCustomCategoryName('');
                    }
                  }}
                  className="w-full bg-[#F7F1EA] border border-[#D3A474] rounded-2xl px-3 py-2.5 text-xs text-[#1E3C2B] font-bold focus:outline-none cursor-pointer"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.filter(c => c.type === txType).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="other_custom">➕ Kategori Lainnya (Tulis Sendiri)</option>
                </select>
              </div>

              {/* Custom Category Input (shown only if 'other_custom' is selected) */}
              {txCategoryId === 'other_custom' && (
                <div className="flex flex-col gap-1.5 p-3.5 bg-[#FAF7F2]/5 rounded-2xl border border-[#D3A474]/30 animate-slide-up text-left">
                  <div className="flex gap-2">
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-[9px] font-bold text-[#D3A474] uppercase pl-1 tracking-wider">Nama Kategori Baru</label>
                      <input
                        id="modal-tx-custom-category-name"
                        type="text"
                        required
                        placeholder="Contoh: Belanja Bulanan, Donasi, dll"
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                        className="w-full bg-[#F7F1EA] border border-[#D3A474] rounded-xl px-3 py-2 text-xs text-[#1E3C2B] font-bold focus:outline-none"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1 w-24">
                      <label className="text-[9px] font-bold text-[#D3A474] uppercase pl-1 tracking-wider text-center">Ikon</label>
                      <select
                        value={customCategoryIcon}
                        onChange={(e) => setCustomCategoryIcon(e.target.value)}
                        className="w-full bg-[#F7F1EA] border border-[#D3A474] rounded-xl px-2 py-2 text-xs text-[#1E3C2B] font-bold focus:outline-none text-center cursor-pointer"
                      >
                        <option value="✨">✨ Kilau</option>
                        <option value="🛍️">🛍️ Belanja</option>
                        <option value="🍔">🍔 Makan</option>
                        <option value="🚗">🚗 Transport</option>
                        <option value="🎁">🎁 Kado</option>
                        <option value="🐱">🐱 Hewan</option>
                        <option value="🩺">🩺 Medis</option>
                        <option value="💡">💡 Listrik</option>
                        <option value="🎮">🎮 Game</option>
                        <option value="📚">📚 Belajar</option>
                        <option value="💼">💼 Kerja</option>
                        <option value="📁">📁 Lainnya</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[9px] text-[#FAF7F2]/70 leading-relaxed pl-1 mt-0.5">
                    Kategori baru ini akan disimpan secara otomatis ke dalam daftar kategori Anda setelah transaksi dicatat.
                  </p>
                </div>
              )}

              {/* Payment Method selector */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#FAF7F2]/80 uppercase pl-1 tracking-wider">Metode Pembayaran</label>
                <select
                  id="modal-tx-payment-method"
                  value={txPaymentMethodId}
                  onChange={(e) => setTxPaymentMethodId(e.target.value)}
                  className="w-full bg-[#F7F1EA] border border-[#D3A474] rounded-2xl px-3 py-2.5 text-xs text-[#1E3C2B] font-bold focus:outline-none cursor-pointer"
                >
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.icon} {pm.name}
                    </option>
                  ))}
                  {paymentMethods.length === 0 && (
                    <option value="">Belum ada metode pembayaran</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Notes */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#FAF7F2]/80 uppercase pl-1 tracking-wider font-sans">Catatan / Deskripsi</label>
                  <input
                    id="modal-tx-notes"
                    type="text"
                    required
                    placeholder="Contoh: Makan boba"
                    value={txNotes}
                    onChange={(e) => setTxNotes(e.target.value)}
                    className="w-full bg-[#F7F1EA] border border-[#D3A474] rounded-2xl px-3.5 py-2.5 text-xs text-[#1E3C2B] font-bold transition-all focus:outline-none"
                  />
                </div>

                {/* Date */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#FAF7F2]/80 uppercase pl-1 tracking-wider">Tanggal Transaksi</label>
                  <input
                    id="modal-tx-date"
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full bg-[#F7F1EA] border border-[#D3A474] rounded-2xl px-3.5 py-2.5 text-xs text-[#1E3C2B] transition-all focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 border-t border-[#FAF7F2]/10 pt-4 mt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-[#F7F1EA] hover:bg-[#F7F1EA]/85 text-[#1E3C2B] text-xs py-3 rounded-2xl font-bold transition-all text-center cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="modal-tx-save-btn"
                  type="submit"
                  className="flex-1 bg-[#D3A474] hover:bg-[#C69360] text-white text-xs py-3 rounded-2xl font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                >
                  {modalMode === 'add' ? 'Simpan Transaksi' : 'Perbarui Transaksi'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* SAFETY CONFIRMATION DIALOG FOR TRANSACTION DELETION */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-55 p-4">
          <div className="w-full max-w-sm bg-[#1E3C2B] rounded-[24px] p-6 border border-[#D3A474]/30 shadow-xl flex flex-col gap-4 text-center text-white animate-slide-up">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center self-center shadow-sm">
              <AlertTriangle className="w-6 h-6 text-[#D3A474]" />
            </div>
            
            <div>
              <h4 className="font-fredoka font-semibold text-white text-base">Hapus Transaksi?</h4>
              <p className="text-xs text-[#FAF7F2]/85 mt-2 leading-relaxed font-semibold">
                Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini akan mengembalikan saldo di dompet Anda secara otomatis.
              </p>
            </div>

            <div className="flex gap-2.5 mt-2">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 bg-[#F7F1EA] hover:bg-[#F7F1EA]/80 text-[#1E3C2B] font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Kembali
              </button>
              <button
                id="modal-delete-confirm-btn"
                onClick={confirmDelete}
                className="flex-1 bg-rose-550 hover:bg-rose-650 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
