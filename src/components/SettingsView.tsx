import React, { useState, useEffect } from 'react';
import { 
  User, 
  Settings as SettingsIcon, 
  Trash2, 
  Plus, 
  Edit, 
  X, 
  Check, 
  AlertTriangle,
  FolderTree,
  Mail,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  Heart,
  Palette,
  Camera,
  Key,
  Wallet,
  CreditCard
} from 'lucide-react';
import { RegisteredUser, Category, PaymentMethod } from '../types';
import { AuthDB, CategoryDB, PaymentMethodDB } from '../database';
import UserAvatar from './UserAvatar';

interface SettingsViewProps {
  currentUser: RegisteredUser;
  onProfileUpdate: (updatedUser: RegisteredUser) => void;
  onAccountDeleted: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
  mode?: 'profile' | 'categories_methods';
}

type SubTab = 'profile' | 'categories' | 'payment_methods';

const AVAILABLE_ICONS = [
  'utensils-crossed', 'car', 'shopping-bag', 'film', 'banknote', 
  'trending-up', 'circle-ellipsis', 'heart', 'school', 'home', 'gift', 'plane'
];

const PRESET_COLORS = [
  '#D3A474', '#1E3C2B', '#8FB996', '#C69360', '#A2703F', 
  '#E6C594', '#E6AA68', '#B7B865', '#2E5A44', '#70A288'
];

export default function SettingsView({
  currentUser,
  onProfileUpdate,
  onAccountDeleted,
  showToast,
  mode = 'profile',
}: SettingsViewProps) {
  const [subTab, setSubTab] = useState<SubTab>(mode === 'profile' ? 'profile' : 'categories');

  useEffect(() => {
    setSubTab(mode === 'profile' ? 'profile' : 'categories');
  }, [mode]);

  // Sub Tab 1: Profile forms
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [username, setUsername] = useState(currentUser.username);
  const [email, setEmail] = useState(currentUser.email);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl);
  const [initialBalance, setInitialBalance] = useState(() => {
    return currentUser.initialBalance !== undefined && currentUser.initialBalance !== null
      ? String(currentUser.initialBalance)
      : '';
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const formatInputRupiah = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean) return '';
    return new Intl.NumberFormat('id-ID', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(Number(clean));
  };

  // Profile image upload state & methods
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Change password states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local validation
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Format file tidak didukung. Harap gunakan JPG, JPEG, PNG, atau WEBP.', 'error');
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast('Ukuran file maksimal adalah 5 MB.', 'error');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const newUrl = await AuthDB.uploadAvatar(currentUser.id, file);
      setAvatarUrl(newUrl);
      
      const updatedSess = { ...currentUser, avatarUrl: newUrl };
      AuthDB.setSession(updatedSess);
      onProfileUpdate(updatedSess);

      showToast('Foto profil berhasil diperbarui!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengunggah foto profil.', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    try {
      setIsUploadingPhoto(true);
      const defaultUrl = await AuthDB.deleteAvatar(currentUser.id);
      setAvatarUrl(defaultUrl);

      const updatedSess = { ...currentUser, avatarUrl: defaultUrl };
      AuthDB.setSession(updatedSess);
      onProfileUpdate(updatedSess);

      showToast('Foto profil berhasil dihapus.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus foto profil.', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      showToast('Password baru tidak boleh kosong.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password baru mendatar minimal 6 karakter.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Konfirmasi password tidak cocok.', 'error');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      await AuthDB.updatePassword(currentUser.id, newPassword);
      showToast('Password Anda berhasil diperbarui!', 'success');
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui password.', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Profile avatar options
  const avatarPresets = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDXdTxS1Wq-mMnZzwbwSAej1L0c6uMz1eFGsykK2lJ6aS1nYsJHkGk9LyZ1kbY6cZ3EwO0_t_qgw2192yIjOwoBT4zVgsmpUFpEjIGXKow_McXVsp___putAVe-7MKGQ9OHXOpvTFU4V1IR-VhfXw2Btza_DXL14_xBaM7eEFBgTdRk-WePLi40vKc3mbyK0cCyJ0bJNLilfQ9nzU_43x2DtG7GhgCu212UMcFW0_st4Y8UspIVLsLii_GgJJqjyAi1g5Ueuk9qiCo7',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=Budi',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=Siti',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=Dewi',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=Agus',
  ];

  // Delete account safety
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);

  // Sub Tab 2: Category forms & state asynchronously
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCategories = async () => {
    try {
      setIsLoading(true);
      const list = await CategoryDB.getCategories(currentUser.id);
      setCategories(list);
    } catch (err) {
      console.error('Failed to load settings categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const list = await PaymentMethodDB.getPaymentMethods(currentUser.id);
      setPaymentMethods(list);
    } catch (err) {
      console.error('Failed to load settings payment methods:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCategories();
    refreshPaymentMethods();
  }, [currentUser.id]);

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isCatDeleteConfirmOpen, setIsCatDeleteConfirmOpen] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);
  const [catModalMode, setCatModalMode] = useState<'add' | 'edit'>('add');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  // Category form parameters
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'pemasukan' | 'pengeluaran'>('pengeluaran');
  const [catIcon, setCatIcon] = useState('utensils-crossed');
  const [catColor, setCatColor] = useState('#F9A8D4');

  // SUB TAB 3: Payment Method CRUD States
  const [isPmModalOpen, setIsPmModalOpen] = useState(false);
  const [isPmDeleteConfirmOpen, setIsPmDeleteConfirmOpen] = useState(false);
  const [deletingPmId, setDeletingPmId] = useState<string | null>(null);
  const [pmModalMode, setPmModalMode] = useState<'add' | 'edit'>('add');
  const [selectedPmId, setSelectedPmId] = useState<string | null>(null);

  // Payment Method form parameters
  const [pmName, setPmName] = useState('');
  const [pmIcon, setPmIcon] = useState('💵');

  const openAddPmModal = () => {
    setPmModalMode('add');
    setSelectedPmId(null);
    setPmName('');
    setPmIcon('💵');
    setIsPmModalOpen(true);
  };

  const openEditPmModal = (pm: PaymentMethod) => {
    setPmModalMode('edit');
    setSelectedPmId(pm.id);
    setPmName(pm.name);
    setPmIcon(pm.icon);
    setIsPmModalOpen(true);
  };

  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pmName.trim()) {
      showToast('Nama metode pembayaran wajib diisi.', 'error');
      return;
    }
    if (!pmIcon.trim()) {
      showToast('Ikon metode pembayaran wajib diisi.', 'error');
      return;
    }

    try {
      if (pmModalMode === 'add') {
        await PaymentMethodDB.addPaymentMethod(currentUser.id, pmName, pmIcon);
        showToast('Metode pembayaran baru berhasil ditambahkan!', 'success');
      } else if (pmModalMode === 'edit' && selectedPmId) {
        await PaymentMethodDB.updatePaymentMethod(currentUser.id, selectedPmId, pmName, pmIcon);
        showToast('Metode pembayaran berhasil diperbarui!', 'success');
      }
      setIsPmModalOpen(false);
      await refreshPaymentMethods();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan metode pembayaran.', 'error');
    }
  };

  const requestDeletePaymentMethod = (pmId: string) => {
    setDeletingPmId(pmId);
    setIsPmDeleteConfirmOpen(true);
  };

  const confirmDeletePaymentMethod = async () => {
    if (!deletingPmId) return;
    try {
      await PaymentMethodDB.deletePaymentMethod(currentUser.id, deletingPmId);
      showToast('Metode pembayaran berhasil dihapus.', 'success');
      setIsPmDeleteConfirmOpen(false);
      setDeletingPmId(null);
      await refreshPaymentMethods();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus metode pembayaran.', 'error');
    }
  };

  // Handle Updates
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !email.trim()) {
      showToast('Harap isi semua kolom wajib.', 'error');
      return;
    }

    try {
      setIsUpdatingProfile(true);
      const cleanInitialBalance = initialBalance !== '' ? Number(initialBalance.replace(/[^0-9]/g, '')) : undefined;
      const updated = await AuthDB.updateProfile(currentUser.id, {
        fullName,
        username,
        email,
        avatarUrl,
        initialBalance: cleanInitialBalance,
      });
      AuthDB.setSession(updated);
      onProfileUpdate(updated);
      showToast('Profil Anda berhasil diperbarui!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui profil.', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await AuthDB.deleteAccount(currentUser.id);
      AuthDB.setSession(null);
      showToast('Semua data Anda berhasil dihapus dari sistem. Sampai jumpa kembali!', 'success');
      onAccountDeleted();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus akun.', 'error');
    }
  };

  // Category Actions
  const openAddCatModal = () => {
    setCatModalMode('add');
    setSelectedCatId(null);
    setCatName('');
    setCatType('pengeluaran');
    setCatIcon('utensils-crossed');
    setCatColor('#F9A8D4');
    setIsCatModalOpen(true);
  };

  const openEditCatModal = (c: Category) => {
    setCatModalMode('edit');
    setSelectedCatId(c.id);
    setCatName(c.name);
    setCatType(c.type);
    setCatIcon(c.icon);
    setCatColor(c.color);
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      showToast('Nama kategori wajib diisi.', 'error');
      return;
    }

    try {
      if (catModalMode === 'add') {
        await CategoryDB.addCategory(currentUser.id, catName, catType, catIcon, catColor);
        showToast('Kategori baru berhasil ditambahkan!', 'success');
      } else if (catModalMode === 'edit' && selectedCatId) {
        await CategoryDB.updateCategory(currentUser.id, selectedCatId, catName, catType, catIcon, catColor);
        showToast('Kategori berhasil diperbarui!', 'success');
      }
      setIsCatModalOpen(false);
      await refreshCategories();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan kategori.', 'error');
    }
  };

  const requestDeleteCategory = (catId: string) => {
    setDeletingCatId(catId);
    setIsCatDeleteConfirmOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCatId) return;
    try {
      await CategoryDB.deleteCategory(currentUser.id, deletingCatId);
      showToast('Kategori berhasil dihapus.', 'success');
      setIsCatDeleteConfirmOpen(false);
      setDeletingCatId(null);
      await refreshCategories();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus kategori.', 'error');
    }
  };

  if (isLoading && subTab === 'categories') {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 px-4 flex flex-col gap-6 animate-pulse text-[#1E3C2B]">
        <div className="h-6 w-40 bg-[#D3A474]/20 rounded-lg"></div>
        <div className="h-4 w-60 bg-[#D3A474]/10 rounded-lg"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-20 bg-[#1E3C2B] border border-[#D3A474]/10 rounded-2xl"></div>
          <div className="h-20 bg-[#1E3C2B] border border-[#D3A474]/10 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-24 md:pb-12 px-1 text-[#1E3C2B]">
      
      {/* Header Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 mt-4">
        <div>
          <h2 className="text-2xl font-fredoka font-semibold text-[#1E3C2B] tracking-tight flex items-center gap-2">
            {mode === 'profile' ? '⚙️ Pengaturan Profil' : '📁 Kategori & Pembayaran'}
          </h2>
          <p className="text-xs text-[#1E3C2B]/85 font-semibold">
            {mode === 'profile' 
              ? 'Ubah info akun personal, avatar, dan kustomisasi keamanan akunmu.' 
              : 'Atur daftar kategori mutasi serta opsi metode pembayaran personal pilihanmu.'}
          </p>
        </div>

        {/* Sub Navigation tabs */}
        {mode === 'categories_methods' && (
          <div className="flex bg-[#1E3C2B] p-1.5 rounded-2xl gap-0.5 border border-[#D3A474]/30 self-start sm:self-auto select-none">
            <button
              id="settings-tab-categories"
              onClick={() => setSubTab('categories')}
              className={`px-4 py-2 rounded-xl text-xs font-bold leading-none cursor-pointer transition-all ${
                subTab === 'categories'
                  ? 'bg-[#D3A474] text-white shadow-xs'
                  : 'text-[#FAF7F2]/65 hover:text-white bg-transparent'
              }`}
            >
              Koleksi Kategori
            </button>
            <button
              id="settings-tab-payments"
              onClick={() => setSubTab('payment_methods')}
              className={`px-4 py-2 rounded-xl text-xs font-bold leading-none cursor-pointer transition-all ${
                subTab === 'payment_methods'
                  ? 'bg-[#D3A474] text-white shadow-xs'
                  : 'text-[#FAF7F2]/65 hover:text-white bg-transparent'
              }`}
            >
              Metode Pembayaran
            </button>
          </div>
        )}
      </div>

      {/* SUB TAB 1: PROFILE MANAGEMENT */}
      {subTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Profile Photo Display Card */}
          <div className="bg-[#1E3C2B] p-6 rounded-[24px] border border-[#D3A474]/15 shadow-xs flex flex-col items-center text-center gap-4 text-white">
            <h4 className="font-fredoka font-semibold text-white text-sm self-start flex items-center gap-1.5">
              👑 Foto &amp; Akun
            </h4>
            
            <div className="relative group">
              <UserAvatar
                avatarUrl={avatarUrl}
                fullName={fullName}
                className="w-24 h-24 rounded-full border-4 border-[#D3A474] transition-transform duration-300 group-hover:scale-105"
                textClassName="text-3xl font-bold text-white font-fredoka"
              />
              {isUploadingPhoto && (
                <div id="photo-upload-loading" className="absolute inset-0 bg-[#1E3C2B]/90 rounded-full flex items-center justify-center text-[10px] font-bold text-[#D3A474] animate-pulse">
                  Proses...
                </div>
              )}
              <span className="absolute bottom-1 right-1 bg-[#1E3C2B] p-1 rounded-full shadow-xs border border-[#D3A474]/30">
                <Heart className="w-3.5 h-3.5 text-[#D3A474] fill-[#D3A474]" />
              </span>
            </div>
            
            <div>
              <p className="font-fredoka font-semibold text-white text-base leading-none">{fullName}</p>
              <p className="text-xs text-[#FAF7F2] font-bold mt-1.5 font-sans">@{username}</p>
            </div>

            {/* Hidden Input File for Photo Picker */}
            <input
              type="file"
              id="avatar-input"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />

            {/* Photo controls */}
            <div className="flex flex-col gap-2 w-full mt-2">
              <button
                type="button"
                id="btn-upload-photo"
                disabled={isUploadingPhoto}
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  } else {
                    document.getElementById('avatar-input')?.click();
                  }
                }}
                className="w-full bg-[#D3A474] hover:bg-[#C69360] active:scale-[0.98] text-white text-xs font-bold py-2.5 rounded-xl border border-transparent transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Ganti Foto</span>
              </button>
              
              {typeof avatarUrl === 'string' && avatarUrl && !avatarUrl.includes('lh3.googleusercontent.com/aida-public/AB6AXuDXdTxS1Wq-mMnZzwbwSAej1L0c6uMz1eFGsykK2lJ6aS1nYsJHkGk9LyZ1kbY6cZ3EwO0_t_qgw2192yIjOwoBT4zVgsmpUFpEjIGXKow_McXVsp___putAVe-7MKGQ9OHXOpvTFU4V1IR-VhfXw2Btza_DXL14_xBaM7eEFBgTdRk-WePLi40vKc3mbyK0cCyJ0bJNLilfQ9nzU_43x2DtG7GhgCu212UMcFW0_st4Y8UspIVLsLii_GgJJqjyAi1g5Ueuk9qiCo7') && (
                <button
                  type="button"
                  id="btn-delete-photo"
                  disabled={isUploadingPhoto}
                  onClick={handleDeletePhoto}
                  className="w-full bg-rose-500/10 hover:bg-rose-500/20 active:scale-[0.98] text-rose-300 text-xs font-bold py-2 rounded-xl border border-rose-500/15 transition-all cursor-pointer text-center"
                >
                  Hapus Foto
                </button>
              )}
            </div>

            {/* User display details including joined date */}
            <div className="w-full border-t border-[#D3A474]/15 pt-4 mt-2 text-left text-xs text-[#FAF7F2] font-medium flex flex-col gap-2.5">
              <div className="flex justify-between items-center py-1 border-b border-[#D3A474]/10 flex-wrap gap-2">
                <span className="text-[10px] text-[#FAF7F2]/80 font-bold uppercase tracking-wider">Email</span>
                <span className="truncate max-w-[150px] font-semibold text-white" title={currentUser.email}>{currentUser.email}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#D3A474]/10 flex-wrap gap-2">
                <span className="text-[10px] text-[#FAF7F2]/80 font-bold uppercase tracking-wider">Tanggal Bergabung</span>
                <span className="font-semibold text-white">
                  {new Date(currentUser.createdAt || Date.now()).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            <div className="w-full border-t border-[#D3A474]/15 pt-4 mt-1 text-left">
              <div className="p-3.5 bg-[#1E3C2B]/55 border border-[#D3A474]/20 rounded-2xl flex items-center gap-2.5 text-[10px] text-[#FAF7F2]/80 font-medium">
                <ShieldCheck className="w-5 h-5 text-[#D3A474] flex-shrink-0" />
                <span className="leading-relaxed">Keamanan data monify menggunakan sandbox database lokal terenkripsi di browser kamu.</span>
              </div>
            </div>
          </div>

          {/* Form details updates & Ubah Password */}
          <div className="lg:col-span-2 bg-[#1E3C2B] p-6 rounded-[24px] border border-[#D3A474]/15 shadow-xs flex flex-col justify-between gap-6 text-white">
            <div>
              <div className="pb-4 border-b border-[#D3A474]/15 mb-4 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h4 className="font-fredoka font-semibold text-white text-base">Identitas Anda</h4>
                  <p className="text-[10px] text-[#FAF7F2]/80 mt-0.5 font-semibold">Monify menjaga data personal agar tetap rahasia &amp; akurat.</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full name input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#FAF7F2]/80 uppercase pl-1 tracking-wide">Nama Lengkap</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#D3A474] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="profile-fullName"
                        type="text"
                        required
                        placeholder="Masukkan nama lengkap Anda"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-[#F7F1EA] border border-[#D3A474] focus:ring-1 focus:ring-[#D3A474] focus:outline-none rounded-2xl pl-10 pr-4 py-3 text-xs text-[#1E3C2B] font-bold"
                      />
                    </div>
                  </div>

                  {/* Unique username input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#FAF7F2]/80 uppercase pl-1 tracking-wide">Username</label>
                    <div className="relative">
                      <span className="text-[#D3A474] font-bold absolute left-3.5 top-1/2 -translate-y-1/2">@</span>
                      <input
                        id="profile-username"
                        type="text"
                        required
                        placeholder="username_kamu"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-[#F7F1EA] border border-[#D3A474] focus:ring-1 focus:ring-[#D3A474] focus:outline-none rounded-2xl pl-9 pr-4 py-3 text-xs text-[#1E3C2B] font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Email Input */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#FAF7F2]/80 uppercase pl-1 tracking-wide">Alamat Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#D3A474] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="profile-email"
                      type="email"
                      required
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#F7F1EA] border border-[#D3A474] focus:ring-1 focus:ring-[#D3A474] focus:outline-none rounded-2xl pl-10 pr-4 py-3 text-xs text-[#1E3C2B] font-bold"
                    />
                  </div>
                </div>

                {/* Saldo Awal Saya Input */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#FAF7F2]/80 uppercase pl-1 tracking-wide">Saldo Awal Saya</label>
                  <div className="relative">
                    <Wallet className="w-4 h-4 text-[#D3A474] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="profile-initialBalance"
                      type="text"
                      placeholder="Contoh: 10.000.000"
                      value={formatInputRupiah(initialBalance)}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const clean = raw.replace(/[^0-9]/g, '');
                        setInitialBalance(clean);
                      }}
                      className="w-full bg-[#F7F1EA] border border-[#D3A474] focus:ring-1 focus:ring-[#D3A474] focus:outline-none rounded-2xl pl-10 pr-4 py-3 text-xs text-[#1E3C2B] font-bold"
                    />
                  </div>
                  <p className="text-[9px] text-[#FAF7F2]/80 pl-1">Saldo dasar untuk memulai kalkulasi total keuangan personal Anda.</p>
                </div>

                {/* Action buttons: Simpan Perubahan & Ubah Password */}
                <div className="flex flex-wrap items-center gap-3 border-t border-[#D3A474]/15 pt-5 mt-2">
                  <button
                    id="profile-save-btn"
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="bg-[#D3A474] hover:bg-[#C69360] text-white text-xs font-bold px-6 py-3 rounded-2xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>{isUpdatingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                  </button>

                  <button
                    type="button"
                    id="profile-change-password-trigger"
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="bg-[#F7F1EA] hover:bg-[#F7F1EA]/85 text-[#1E3C2B] text-xs font-bold px-6 py-3 rounded-2xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Ubah Password</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Dangerous Zone for Delete Accounts */}
            <div className="border-t border-rose-500/20 pt-6 mt-4">
              <h5 className="font-bold text-rose-450 text-[10px] uppercase tracking-widest pl-1 mb-2">Zona Bahaya</h5>
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-left text-xs">
                <div>
                  <h6 className="font-bold text-white">Menolak &amp; Hapus Akun</h6>
                  <p className="text-[10px] text-[#FAF7F2]/80 mt-1 leading-relaxed max-w-sm font-semibold">
                    Tindakan ini menghapus seluruh limit anggaran, susunan kategori, dan riwayat mutasi kamu di browser ini.
                  </p>
                </div>
                <button
                  id="danger-delete-account-btn"
                  onClick={() => setIsDeleteAccountOpen(true)}
                  className="bg-rose-550 hover:bg-rose-650 text-white font-bold text-[10px] px-5 py-3 rounded-xl self-start sm:self-auto transition-all cursor-pointer"
                >
                  Hapus Permanen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 2: CATEGORIES CRUD */}
      {subTab === 'categories' && (
        <div className="bg-[#1E3C2B] p-6 rounded-[24px] border border-[#D3A474]/15 shadow-xs flex flex-col gap-5 text-white animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#D3A474]/15 pb-4">
            <div>
              <h4 className="font-fredoka font-semibold text-white text-base">Pos Kategori Mutasi</h4>
              <p className="text-xs text-[#FAF7F2]/80 mt-0.5">
                Kloning, ubah, atau buat pos kategori arus kas masuk dan belanja kamu di bawah ini.
              </p>
            </div>
            <button
              id="categories-add-trigger-btn"
              onClick={openAddCatModal}
              className="bg-[#D3A474] hover:bg-[#C69360] text-white px-5 py-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 self-start sm:self-auto shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah Kategori</span>
            </button>
          </div>

          {/* List display */}
          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-[#D3A474]/30 rounded-[24px] bg-[#1E3C2B]/40 text-slate-350">
              <span className="text-3xl animate-pulse">🏷️</span>
              <p className="font-fredoka font-semibold text-[#FAF7F2] mt-2 text-sm">Belum ada kategori.</p>
              <p className="text-[10px] text-[#FAF7F2]/75 mt-1">Gunakan tombol 'Tambah Kategori' untuk membuat kategori pengeluaran/pemasukan pertamamu.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="p-4 bg-[#1E3C2B]/55 border border-[#D3A474]/15 rounded-2xl flex justify-between items-center hover:border-[#D3A474]/40 hover:bg-[#1E3C2B]/80 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-fredoka font-semibold text-lg shadow-xs"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h5 className="font-semibold text-white text-xs leading-snug">{c.name}</h5>
                      <span className={`text-[8.5px] font-extrabold mt-1.5 px-2 py-0.5 rounded-full inline-block leading-none uppercase tracking-wider ${
                        c.type === 'pemasukan' ? 'bg-[#D1FAE5]/10 text-[#10B981]' : 'bg-[#FFE4E6]/10 text-[#F43F5E]'
                      }`}>
                        {c.type === 'pemasukan' ? 'pemasukan' : 'pengeluaran'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditCatModal(c)}
                      className="p-2 hover:bg-[#1E3C2B]/40 text-[#FAF7F2]/70 hover:text-[#D3A474] border border-transparent hover:border-[#D3A474]/20 rounded-xl transition-all cursor-pointer"
                      title="Ubah Kategori"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => requestDeleteCategory(c.id)}
                      className="p-2 hover:bg-rose-500/10 text-rose-450 hover:text-rose-350 border border-transparent hover:border-rose-550/20 rounded-xl transition-all cursor-pointer"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 3: PAYMENT METHODS CRUD */}
      {subTab === 'payment_methods' && (
        <div className="bg-[#1E3C2B] p-6 rounded-[24px] border border-[#D3A474]/15 shadow-xs flex flex-col gap-5 text-white animate-fade-in font-sans">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#D3A474]/15 pb-4">
            <div>
              <h4 className="font-fredoka font-semibold text-white text-base">Metode Pembayaran Kustom</h4>
              <p className="text-xs text-[#FAF7F2]/80 mt-0.5">
                Tambahkan atau perbarui opsi metode pembayaran personal pilihanmu untuk mempermudah logging mutasi.
              </p>
            </div>
            <button
              id="payment-methods-add-trigger-btn"
              onClick={openAddPmModal}
              className="bg-[#D3A474] hover:bg-[#C69360] text-white px-5 py-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 self-start sm:self-auto shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah Metode</span>
            </button>
          </div>

          {/* List display */}
          {paymentMethods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-[#D3A474]/30 rounded-[24px] bg-[#1E3C2B]/40 text-slate-350">
              <span className="text-3xl animate-pulse">💳</span>
              <p className="font-fredoka font-semibold text-[#FAF7F2] mt-2 text-sm">Belum ada metode pembayaran.</p>
              <p className="text-[10px] text-[#FAF7F2]/75 mt-1">Gunakan tombol 'Tambah Metode' untuk membuat metode pembayaran pertamamu.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="p-4 bg-[#1E3C2B]/55 border border-[#D3A474]/15 rounded-2xl flex justify-between items-center hover:border-[#D3A474]/40 hover:bg-[#1E3C2B]/80 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF7F2]/10 border border-[#D3A474]/20 flex items-center justify-center text-xl shadow-xs">
                      {pm.icon || '💵'}
                    </div>
                    <div>
                      <h5 className="font-semibold text-white text-xs leading-snug">{pm.name}</h5>
                      <span className="text-[8.5px] font-extrabold mt-1.5 px-2 py-0.5 rounded-full inline-block leading-none uppercase tracking-wider bg-[#FAF7F2]/10 text-[#FAF7F2]/80">
                        Opsi Pencatatan
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditPmModal(pm)}
                      className="p-2 hover:bg-[#1E3C2B]/40 text-[#FAF7F2]/70 hover:text-[#D3A474] border border-transparent hover:border-[#D3A474]/20 rounded-xl transition-all cursor-pointer"
                      title="Ubah Metode"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => requestDeletePaymentMethod(pm.id)}
                      className="p-2 hover:bg-rose-500/10 text-rose-450 hover:text-rose-350 border border-transparent hover:border-rose-550/20 rounded-xl transition-all cursor-pointer"
                      title="Hapus Metode"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CORE CATEGORY CRUD MODAL */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-[#1E3C2B] rounded-[28px] shadow-xl overflow-hidden animate-slide-up border border-[#D3A474]/30 text-white">
            {/* Header */}
            <div className="px-6 py-5 bg-[#D3A474] text-white flex justify-between items-center">
              <h3 className="font-fredoka font-semibold text-base flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-white animate-pulse" />
                <span>{catModalMode === 'add' ? 'Buat Kategori Baru' : 'Perbarui Kategori'}</span>
              </h3>
              <button onClick={() => setIsCatModalOpen(false)} className="text-white hover:text-[#FAF7F2] p-1 rounded-full bg-white/20 cursor-pointer">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Inputs body */}
            <form onSubmit={handleSaveCategory} className="p-6 flex flex-col gap-4 text-xs">
              
              {/* Category name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#FAF7F2]/80 uppercase pl-1 tracking-wider">Nama Kategori</label>
                <input
                  id="modal-category-name"
                  type="text"
                  required
                  placeholder="Contoh: Belanja Bulanan, Investasi Emas"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full bg-[#F7F1EA] border border-[#D3A474] focus:ring-1 focus:ring-[#D3A474] focus:outline-none rounded-2xl px-3.5 py-3 text-xs text-[#1E3C2B] font-bold"
                />
              </div>

              {/* Category type (in / out) */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#FAF7F2]/80 uppercase pl-1 tracking-wider">Tipe Aliran Keuangan</label>
                <div className="flex bg-[#1E3C2B]/55 p-1.5 rounded-2xl border border-[#D3A474]/20 gap-1 mt-1 font-semibold text-[11px]">
                  <button
                    type="button"
                    onClick={() => setCatType('pengeluaran')}
                    className={`flex-1 text-center py-2 text-xs font-bold rounded-xl capitalize transition-all cursor-pointer ${
                      catType === 'pengeluaran' ? 'bg-[#D3A474] text-white shadow-xs' : 'text-[#FAF7F2]/65 bg-transparent'
                    }`}
                  >
                    Belanja (Out)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatType('pemasukan')}
                    className={`flex-1 text-center py-2 text-xs font-bold rounded-xl capitalize transition-all cursor-pointer ${
                      catType === 'pemasukan' ? 'bg-[#D3A474] text-white shadow-xs' : 'text-[#FAF7F2]/65 bg-transparent'
                    }`}
                  >
                    Pendapatan (In)
                  </button>
                </div>
              </div>

              {/* Category Colors Choice */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#FAF7F2]/80 uppercase pl-1 tracking-wider">Pilih Visual Aksen</label>
                <div className="flex flex-wrap gap-2.5 p-3.5 bg-[#1E3C2B]/40 border border-[#D3A474]/20 rounded-2xl justify-center">
                  {PRESET_COLORS.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCatColor(c)}
                      className={`w-7.5 h-7.5 rounded-full border-2 justify-center items-center flex transition-transform hover:scale-110 cursor-pointer ${
                        catColor === c ? 'border-[#FAF7F2] scale-110 shadow-xs' : 'border-slate-100/30'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {catColor === c && <Check className="w-3.5 h-3.5 text-white bg-black/15 rounded-full p-0.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submits */}
              <div className="flex gap-3 border-t border-[#FAF7F2]/10 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="flex-1 bg-[#F7F1EA] hover:bg-[#F7F1EA]/85 text-[#1E3C2B] text-xs py-3 rounded-2xl font-bold transition-all text-center cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="modal-category-save-btn"
                  type="submit"
                  className="flex-1 bg-[#D3A474] hover:bg-[#C69360] text-white text-xs py-3 rounded-2xl font-bold transition-all text-center cursor-pointer"
                >
                  {catModalMode === 'add' ? 'Tambahkan' : 'Simpan'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DOUBLE DOUBLE CONFIRM DELETION USER ACCOUNT MODAL */}
      {isDeleteAccountOpen && (
        <div className="fixed inset-0 bg-[#1E3C2B]/40 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-slide-up">
          <div className="w-full max-w-sm bg-[#1E3C2B] rounded-[24px] p-6 border border-[#D3A474]/30 shadow-xl flex flex-col gap-4 text-center text-xs text-white">
            
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center self-center shadow-xs">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <h4 className="font-fredoka font-semibold text-white text-base">Hapus Akun Monify?</h4>
              <p className="text-rose-450 font-bold mt-2">
                Peringatan keras! Tindakan ini bersifat PERMANEN dan menghancurkan seluruh database profile kamu.
              </p>
              <p className="text-[10px] text-[#FAF7F2]/80 mt-2.5 leading-relaxed font-semibold">
                Menekan tombol konfirmasi akan menghapus data profil (@{currentUser.username}), saku saldo, target anggaran bulanan, dan seluruh data mutasi di database lokal kamu secara tuntas.
              </p>
            </div>

            <div className="flex gap-2.5 mt-2 font-bold">
              <button
                onClick={() => setIsDeleteAccountOpen(false)}
                className="flex-1 bg-[#F7F1EA] hover:bg-[#F7F1EA]/85 text-[#1E3C2B] py-3 rounded-2xl text-xs transition-all cursor-pointer"
              >
                Batalkan
              </button>
              <button
                id="profile-delete-confirm-btn"
                onClick={handleDeleteAccount}
                className="flex-1 bg-rose-550 hover:bg-rose-650 text-white py-3 rounded-2xl text-xs transition-all text-center cursor-pointer"
              >
                Konfirmasi Hapus
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CORE CATEGORY DELETE CONFIRMATION DIALOG */}
      {isCatDeleteConfirmOpen && deletingCatId && (
        <div className="fixed inset-0 bg-[#1E3C2B]/40 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-slide-up">
          <div className="w-full max-w-sm bg-[#1E3C2B] rounded-[24px] p-6 border border-[#D3A474]/30 shadow-xl flex flex-col gap-4 text-center text-xs text-white">
            
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center self-center shadow-xs">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <h4 className="font-fredoka font-semibold text-white text-base">Hapus Kategori?</h4>
              <p className="text-rose-450 font-bold mt-2">
                Menghapus kategori ini juga akan menghapus anggaran terkait dan memutus kategori pada transaksi. Lanjutkan?
              </p>
            </div>

            <div className="flex gap-2.5 mt-2 font-bold">
              <button
                onClick={() => {
                  setIsCatDeleteConfirmOpen(false);
                  setDeletingCatId(null);
                }}
                className="flex-1 bg-[#F7F1EA] hover:bg-[#F7F1EA]/85 text-[#1E3C2B] py-3 rounded-2xl text-xs transition-all cursor-pointer"
              >
                Batalkan
              </button>
              <button
                id="modal-category-delete-confirm-btn"
                onClick={confirmDeleteCategory}
                className="flex-1 bg-rose-550 hover:bg-rose-650 text-white py-3 rounded-2xl text-xs transition-all text-center cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-[#1E3C2B] rounded-[24px] overflow-hidden shadow-xl border border-[#D3A474]/30 text-white">
            {/* Header */}
            <div className="px-6 py-5 bg-[#D3A474] text-white flex justify-between items-center">
              <h3 className="font-fredoka font-semibold text-base flex items-center gap-2">
                <Key className="w-4 h-4 text-white" />
                <span>Ubah Password Akun</span>
              </h3>
              <button 
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }} 
                className="text-white hover:text-[#FAF7F2] p-1 rounded-full bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Inputs body */}
            <form onSubmit={handleUpdatePassword} className="p-6 flex flex-col gap-4 text-xs font-semibold">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#FAF7F2]/80 uppercase pl-1 tracking-wider">Password Baru</label>
                <input
                  id="modal-new-password"
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#F7F1EA] border border-[#D3A474] focus:ring-1 focus:ring-[#D3A474] focus:outline-none rounded-2xl px-3.5 py-3 text-xs text-[#1E3C2B] font-bold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#FAF7F2]/80 uppercase pl-1 tracking-wider">Konfirmasi Password Baru</label>
                <input
                  id="modal-confirm-password"
                  type="password"
                  required
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#F7F1EA] border border-[#D3A474] focus:ring-1 focus:ring-[#D3A474] focus:outline-none rounded-2xl px-3.5 py-3 text-xs text-[#1E3C2B] font-bold"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 border-t border-[#FAF7F2]/10 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="flex-1 bg-[#F7F1EA] hover:bg-[#F7F1EA]/85 text-[#1E3C2B] text-xs py-3 rounded-2xl font-bold transition-all text-center cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="modal-password-save-btn"
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="flex-1 bg-[#D3A474] hover:bg-[#C69360] text-white text-xs py-3 rounded-2xl font-bold transition-all text-center cursor-pointer"
                >
                  {isUpdatingPassword ? 'Menyimpan...' : 'Simpan Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CORE PAYMENT METHOD CRUD MODAL */}
      {isPmModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="w-full max-w-sm bg-[#1E3C2B] rounded-[28px] shadow-xl overflow-hidden animate-slide-up border border-[#D3A474]/30 text-white">
            {/* Header */}
            <div className="px-6 py-5 bg-[#D3A474] text-white flex justify-between items-center bg-cover">
              <h3 className="font-fredoka font-semibold text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-white animate-pulse" />
                <span>{pmModalMode === 'add' ? 'Buat Metode Baru' : 'Perbarui Metode'}</span>
              </h3>
              <button onClick={() => setIsPmModalOpen(false)} className="text-white hover:text-[#FAF7F2] p-1 rounded-full bg-white/20 cursor-pointer">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Inputs body */}
            <form onSubmit={handleSavePaymentMethod} className="p-6 flex flex-col gap-4 text-xs font-semibold">
              
              {/* Name input */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#FAF7F2]/80 uppercase pl-1 tracking-wider">Nama Metode Pembayaran</label>
                <input
                  id="modal-pm-name"
                  type="text"
                  required
                  placeholder="Contoh: Cash, Bank BCA, Gopay"
                  value={pmName}
                  onChange={(e) => setPmName(e.target.value)}
                  className="w-full bg-[#F7F1EA] border border-[#D3A474] focus:ring-1 focus:ring-[#D3A474] focus:outline-none rounded-2xl px-3.5 py-3 text-xs text-[#1E3C2B] font-bold"
                />
              </div>

              {/* Icon / Emoji Auswahl choice */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#FAF7F2]/80 uppercase pl-1 tracking-wider">Pilih Ikon Emoji</label>
                <div className="flex flex-wrap gap-2.5 p-3.5 bg-[#1E3C2B]/40 border border-[#D3A474]/20 rounded-2xl justify-center font-sans">
                  {['💵', '🏦', '📱', '💳', '🧧', '🪙', '💼', '🛒', '⚡'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setPmIcon(emoji)}
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg transition-transform hover:scale-110 cursor-pointer ${
                        pmIcon === emoji ? 'border-[#D3A474] bg-[#FAF7F2]/10 scale-115 shadow-xs' : 'border-slate-100/10'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submits */}
              <div className="flex gap-3 border-t border-[#FAF7F2]/10 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsPmModalOpen(false)}
                  className="flex-1 bg-[#F7F1EA] hover:bg-[#F7F1EA]/85 text-[#1E3C2B] text-xs py-3 rounded-2xl font-bold transition-all text-center cursor-pointer opacity-90"
                >
                  Batal
                </button>
                <button
                  id="modal-pm-save-btn"
                  type="submit"
                  className="flex-1 bg-[#D3A474] hover:bg-[#C69360] text-white text-xs py-3 rounded-2xl font-bold transition-all text-center cursor-pointer"
                >
                  {pmModalMode === 'add' ? 'Tambahkan' : 'Simpan'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CORE PAYMENT METHOD DELETE CONFIRMATION DIALOG */}
      {isPmDeleteConfirmOpen && deletingPmId && (
        <div className="fixed inset-0 bg-[#1E3C2B]/40 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-slide-up font-sans">
          <div className="w-full max-w-sm bg-[#1E3C2B] rounded-[24px] p-6 border border-[#D3A474]/30 shadow-xl flex flex-col gap-4 text-center text-xs text-white">
            
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center self-center shadow-xs">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <h4 className="font-fredoka font-semibold text-white text-base">Hapus Metode Pembayaran?</h4>
              <p className="text-rose-450 font-bold mt-2">
                Menghapus metode pembayaran ini juga memutuskan referensi metode pembayaran pada transaksi terkait. Lanjutkan?
              </p>
            </div>

            <div className="flex gap-2.5 mt-2 font-bold">
              <button
                onClick={() => {
                  setIsPmDeleteConfirmOpen(false);
                  setDeletingPmId(null);
                }}
                className="flex-1 bg-[#F7F1EA] hover:bg-[#F7F1EA]/85 text-[#1E3C2B] py-3 rounded-2xl text-xs transition-all cursor-pointer"
              >
                Batalkan
              </button>
              <button
                id="modal-pm-delete-confirm-btn"
                onClick={confirmDeletePaymentMethod}
                className="flex-1 bg-rose-550 hover:bg-rose-650 text-white py-3 rounded-2xl text-xs transition-all text-center cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
