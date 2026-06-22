import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  Eye,
  EyeOff,
  UserCheck,
  Sparkles,
  Heart,
  TrendingUp,
  Receipt,
  Wallet as WalletIcon,
  PiggyBank
} from 'lucide-react';
import { AuthDB } from '../database';
import { RegisteredUser } from '../types';

interface AuthViewProps {
  onAuthSuccess: (user: RegisteredUser) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

type AuthMode = 'landing' | 'login' | 'register';

export default function AuthView({ onAuthSuccess, showToast }: AuthViewProps) {
  const [mode, setMode] = useState<AuthMode>('landing');
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Harap isi semua kolom.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const user = await AuthDB.loginUser(email, password);
      AuthDB.setSession(user);
      showToast(`Selamat datang kembali, ${user.fullName}!`, 'success');
      onAuthSuccess(user);
    } catch (err: any) {
      showToast(err.message || 'Login gagal.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !email || !password) {
      showToast('Harap isi semua kolom.', 'error');
      return;
    }
    if (password.length < 8) {
      showToast('Password minimal harus 8 karakter.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await AuthDB.registerUser(fullName, username, email, password);
      showToast('Akun berhasil dibuat! Silakan masuk menggunakan email dan password Anda.', 'success');
      setMode('login');
      setPassword(''); // Reset password field
    } catch (err: any) {
      showToast(err.message || 'Registrasi gagal.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Inline SVG of an elegant, modern finance illustration with ONE single premium floating card
  const renderHeroIllustration = () => (
    <svg className="w-full h-full max-h-[300px] lg:max-h-[380px]" viewBox="0 0 400 350" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Soft realistic drop shadow for floating active card */}
        <filter id="cardShadow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="16" stdDeviation="14" floodColor="#0d1b13" floodOpacity="0.35" />
        </filter>

        {/* Shadow filter for lower base floor shadow */}
        <filter id="shadowFilter" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="16" />
        </filter>

        {/* Chip metallic gold gradient */}
        <linearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FAF7F2" />
          <stop offset="50%" stopColor="#D3A474" />
          <stop offset="100%" stopColor="#1E3C2B" />
        </linearGradient>

        {/* Smooth glow fill gradient */}
        <linearGradient id="bgGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D3A474" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#1E3C2B" stopOpacity="0.02" />
        </linearGradient>

        {/* Grid pattern / decorative dots */}
        <pattern id="dotPattern" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#D3A474" opacity="0.15" />
        </pattern>
      </defs>

      {/* Background Soft Glow circle */}
      <circle cx="200" cy="165" r="135" fill="url(#bgGlowGrad)" />

      {/* Decorative dot matrix grid */}
      <rect x="50" y="40" width="300" height="240" fill="url(#dotPattern)" pointerEvents="none" />

      {/* Transparent overlapping elegant circles */}
      <circle cx="100" cy="100" r="50" stroke="#D3A474" strokeWidth="1" opacity="0.12" fill="none" />
      <circle cx="290" cy="220" r="60" stroke="#FAF7F2" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.18" fill="none" />
      <circle cx="310" cy="80" r="40" stroke="#D3A474" strokeWidth="1" strokeDasharray="3 3" opacity="0.12" fill="none" />

      {/* Background elegant curve paths representing financial flow */}
      <path d="M 30 260 Q 130 150, 240 220 T 370 120" stroke="#D3A474" strokeWidth="2.5" strokeDasharray="6 4" fill="none" opacity="0.25" strokeLinecap="round" />

      {/* Soft realistic card base shadow */}
      <ellipse cx="200" cy="295" rx="100" ry="12" fill="#0d1b13" opacity="0.6" filter="url(#shadowFilter)" />

      {/* ONE Main Floating Monify Finance Card (3D skewed/rotated floating perspective) */}
      <g transform="translate(200, 160) rotate(-10) translate(-115, -70)" filter="url(#cardShadow)">
        {/* Card base with deep premium forest green and elegant border */}
        <rect x="0" y="0" width="230" height="142" rx="18" fill="#1E3C2B" stroke="#D3A474" strokeWidth="2" />
        
        {/* Shimmer / reflective overlay design */}
        <path d="M 0 50 Q 80 85, 150 40 T 230 65" stroke="#F0E3D3" strokeWidth="1.5" fill="none" opacity="0.3" pointerEvents="none" />
        <path d="M 0 70 Q 75 35, 145 80 T 230 45" stroke="#D3A474" strokeWidth="1" fill="none" opacity="0.25" pointerEvents="none" />
        <path d="M 0 80 Q 90 100, 230 40 L 230 142 L 0 142 Z" fill="#F0E3D3" opacity="0.04" />

        {/* Minimalist contact metallic gold chip */}
        <rect x="24" y="32" width="34" height="24" rx="5" fill="#D3A474" stroke="#F0E3D3" strokeWidth="0.75" />
        <path d="M 24 44 L 58 44 M 35 32 L 35 56 M 47 32 L 47 56" stroke="#1E3C2B" strokeWidth="0.5" opacity="0.3" />

        {/* Brand wordmark on card */}
        <text x="145" y="36" fill="#F0E3D3" fontSize="13" fontWeight="bold" letterSpacing="0.8" fontFamily="sans-serif">monify</text>
        <text x="145" y="47" fill="#D3A474" fontSize="6.5" fontWeight="semibold" letterSpacing="0.5" fontFamily="sans-serif">FINANCIAL</text>

        {/* Abstract Financial Overlapping Symbol in the corner */}
        <circle cx="190" cy="106" r="13" fill="#D3A474" opacity="0.9" />
        <circle cx="178" cy="106" r="13" fill="#F0E3D3" opacity="0.7" style={{ mixBlendMode: 'screen' }} />

        {/* Credit Card Details */}
        <text x="24" y="85" fill="#F0E3D3" fontSize="11.5" fontWeight="600" letterSpacing="1.5" opacity="0.9" fontFamily="monospace">••••  ••••  ••••  8825</text>
        
        {/* Bottom card labels */}
        <text x="24" y="112" fill="#D3A474" fontSize="7" fontWeight="bold" letterSpacing="0.5" opacity="0.75">ACTIVE MEMBER</text>
        <text x="24" y="121" fill="#F0E3D3" fontSize="8" fontWeight="bold" opacity="0.85">SHAKINAH</text>
        
        {/* Card Category Tag */}
        <text x="110" y="121" fill="#FAF7F2" fontSize="7.5" fontWeight="bold" opacity="0.65" fontFamily="sans-serif">PREMIUM CLASS</text>
      </g>
    </svg>
  );

  if (mode === 'landing') {
    return (
      <div 
        className="text-[#1E3C2B] font-sans antialiased min-h-screen flex flex-col bg-[#F0E3D3] transition-all duration-550"
      >
        {/* TopNavBar */}
        <nav className="bg-[#1E3C2B] border-b border-[#D3A474]/30 sticky top-0 z-50 flex justify-between items-center px-6 py-4 w-full max-w-5xl mx-auto rounded-b-[24px] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full drop-shadow-md animate-bounce-slow" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <span className="font-logo font-semibold text-2xl text-white tracking-tight">monify</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMode('login')} 
              className="text-sm font-semibold text-[#FAF7F2] hover:text-[#D3A474] transition-colors cursor-pointer"
            >
              Masuk
            </button>
            <button 
              onClick={() => setMode('register')}
              className="bg-[#D3A474] hover:bg-[#C69360] active:scale-95 text-white font-semibold text-xs px-5 py-2.5 rounded-full transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              Daftar Gratis
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 max-w-5xl mx-auto px-6 py-8 md:py-14 flex flex-col gap-12">
          
          {/* Hero Section */}
          <section className="flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="flex-1 max-w-xl text-center lg:text-left flex flex-col gap-5">
              <span className="text-[10px] font-bold text-[#D3A474] tracking-widest uppercase bg-[#1E3C2B] w-fit px-3 py-1.5 rounded-full mx-auto lg:mx-0">
                🌾 Sahabat Keuangan Cantikmu
              </span>
              <h1 className="text-3xl md:text-5xl font-fredoka font-semibold text-[#1E3C2B] leading-tight tracking-normal">
                Kelola Finansialmu<br />
                <span className="text-[#D3A474]">Lebih Soft &amp; Indah</span>
              </h1>
              <p className="text-sm md:text-base text-[#1E3C2B]/90 leading-relaxed font-semibold">
                Melacak uang jajan harian, mengatur batasan belanja bulanan, dan memantau tabungan impian dengan visual minimalis pastel yang menenangkan pikiran. Monify didesain ramah dan super praktis!
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-2">
                <button 
                  onClick={() => setMode('register')}
                  className="bg-[#D3A474] hover:bg-[#C69360] text-white font-bold text-sm px-8 py-3.5 rounded-2xl shadow-md active:scale-[0.98] transition-all cursor-pointer"
                >
                  Mulai Percuma
                </button>
                <button 
                  onClick={() => setMode('login')}
                  className="bg-[#1E3C2B] hover:bg-[#1E3C2B]/90 text-white font-bold text-sm px-8 py-3.5 rounded-2xl border border-[#D3A474]/40 transition-colors cursor-pointer"
                >
                  Gunakan Akun
                </button>
              </div>
            </div>

            {/* Right Asset / Illustration of Woman managing finances */}
            <div className="flex-1 w-full max-w-md aspect-square bg-[#1E3C2B] rounded-[32px] p-6 border border-[#D3A474]/30 shadow-lg flex items-center justify-center">
              {renderHeroIllustration()}
            </div>
          </section>

          {/* Feature Bento Grid */}
          <section className="py-2">
            <div className="text-center mb-8">
              <h2 className="text-xl md:text-2xl font-fredoka font-semibold text-[#1E3C2B]">Fitur Lucu &amp; Lengkap</h2>
              <p className="text-xs text-[#1E3C2B]/70 mt-1 font-semibold">Monify menyederhanakan pelacakan arus kas harian secara natural.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Feature 1 */}
              <div className="bg-[#1E3C2B] p-5 rounded-[24px] border border-[#D3A474]/30 hover:-translate-y-1 transition-transform duration-300 shadow-xs flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D3A474]/20 flex items-center justify-center text-lg">👛</div>
                <h3 className="font-fredoka font-semibold text-base text-white">Dompet Pastel</h3>
                <p className="text-xs text-[#FAF7F2] leading-relaxed font-semibold">
                  Atur dompet kas, tabungan, dan bank digital dalam kompartemen warna cerah.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-[#1E3C2B] p-5 rounded-[24px] border border-[#D3A474]/30 hover:-translate-y-1 transition-transform duration-300 shadow-xs flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D3A474]/20 flex items-center justify-center text-lg">📝</div>
                <h3 className="font-fredoka font-semibold text-base text-white">Pencatatan Halus</h3>
                <p className="text-xs text-[#FAF7F2] leading-relaxed font-semibold">
                  Masukkan pengeluaran boba, kosmetik, atau buku dengan kustomisasi ikon lucu.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-[#1E3C2B] p-5 rounded-[24px] border border-[#D3A474]/30 hover:-translate-y-1 transition-transform duration-300 shadow-xs flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D3A474]/20 flex items-center justify-center text-lg">🎯</div>
                <h3 className="font-fredoka font-semibold text-base text-white">Batas Anggaran</h3>
                <p className="text-xs text-[#FAF7F2] leading-relaxed font-semibold">
                  Amankan tabungan bulanan. Dapatkan notifikasi ramah saat mendongak boros.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-[#1E3C2B] p-5 rounded-[24px] border border-[#D3A474]/30 hover:-translate-y-1 transition-transform duration-300 shadow-xs flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D3A474]/20 flex items-center justify-center text-lg">📊</div>
                <h3 className="font-fredoka font-semibold text-base text-white">Visual Menenangkan</h3>
                <p className="text-xs text-[#FAF7F2] leading-relaxed font-semibold">
                  Bagan donut pastel yang memetakan jenis pengeluaran tanpa rasa pening kepala.
                </p>
              </div>

            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-[#1E3C2B] border-t border-[#D3A474]/30 py-6 px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-[#FAF7F2] mt-auto rounded-t-[32px] max-w-5xl w-full mx-auto shadow-xs">
          <div className="font-logo font-semibold text-xl text-white">monify</div>
          <div className="flex gap-4 font-semibold">
            <span className="hover:text-[#D3A474] cursor-pointer">Kebijakan Privasi</span>
            <span className="hover:text-[#D3A474] cursor-pointer">Ketentuan Layanan</span>
            <span className="hover:text-[#D3A474] cursor-pointer">Hubungi Kami</span>
          </div>
          <div className="font-semibold text-[#FAF7F2]/80">© 2026 monify app. Dibuat dengan penuh kelembutan.</div>
        </footer>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-12 text-white bg-[#F0E3D3] font-sans transition-all duration-300"
    >
      <div className="w-full max-w-md bg-[#1E3C2B] rounded-[28px] shadow-2xl border border-[#D3A474]/30 p-6 md:p-8 flex flex-col gap-6 animate-slide-up">
        
        {/* Header Logo */}
        <div className="text-center flex flex-col items-center gap-1.5">
          <div className="w-18 h-18 flex items-center justify-center flex-shrink-0 mb-1">
            <svg className="w-full h-full drop-shadow-md animate-bounce-slow" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          <h1 className="text-2xl font-logo font-semibold text-white leading-none mt-2">
            monify
          </h1>
          <h2 className="text-sm font-semibold text-[#D3A474] tracking-wider uppercase mt-1">
            {mode === 'login' ? 'Masuk Aplikasi' : 'Buat Akun Baru'}
          </h2>
          <p className="text-xs text-[#FAF7F2] mt-0.5 font-medium max-w-[280px]">
            {mode === 'login' 
              ? 'Yuk pantau uang jajan dan pergerakan kasmu hari ini!' 
              : 'Daftar sekarang gratis untuk hidup lebih tenang & teratur.'}
          </p>
        </div>

        {/* Input Form Fields */}
        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="flex flex-col gap-4">
          
          {mode === 'register' && (
            <>
              {/* Full Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#FAF7F2] uppercase tracking-widest pl-1">Nama Lengkap</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#D3A474] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="register-fullname"
                    type="text"
                    required
                    placeholder="Contoh: Shakinah"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#F7F1EA] border border-[#D3A474] focus:border-[#D3A474] focus:ring-2 focus:ring-[#D3A474]/20 focus:outline-none rounded-2xl pl-10 pr-4 py-3 text-xs text-[#1E3C2B] transition-all font-bold placeholder:text-[#1E3C2B]/50"
                  />
                </div>
              </div>

              {/* Username */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#FAF7F2] uppercase tracking-widest pl-1">Username Unik</label>
                <div className="relative">
                  <span className="text-[#D3A474] text-xs font-bold absolute left-3.5 top-1/2 -translate-y-1/2">@</span>
                  <input
                    id="register-username"
                    type="text"
                    required
                    placeholder="shakinah"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#F7F1EA] border border-[#D3A474] focus:border-[#D3A474] focus:ring-2 focus:ring-[#D3A474]/20 focus:outline-none rounded-2xl pl-10 pr-4 py-3 text-xs text-[#1E3C2B] transition-all font-bold placeholder:text-[#1E3C2B]/50"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#FAF7F2] uppercase tracking-widest pl-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#D3A474] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="auth-email"
                type="email"
                required
                placeholder="shakinah@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#F7F1EA] border border-[#D3A474] focus:border-[#D3A474] focus:ring-2 focus:ring-[#D3A474]/20 focus:outline-none rounded-2xl pl-10 pr-4 py-3 text-xs text-[#1E3C2B] transition-all font-bold placeholder:text-[#1E3C2B]/50"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold text-[#FAF7F2] uppercase tracking-widest">Sandi Rahasia</label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#D3A474] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#F7F1EA] border border-[#D3A474] focus:border-[#D3A474] focus:ring-2 focus:ring-[#D3A474]/20 focus:outline-none rounded-2xl pl-10 pr-10 py-3 text-xs text-[#1E3C2B] transition-all font-bold placeholder:text-[#1E3C2B]/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#D3A474] hover:text-[#C69360] focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#D3A474] hover:bg-[#C69360] active:scale-95 text-white py-3.5 rounded-2xl text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
            ) : mode === 'login' ? (
              'Masuk Ke Monify'
            ) : (
              'Buat Akun Monify'
            )}
            {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </form>

        {/* Toggle Form Buttons */}
        <div className="text-center pt-3 text-xs text-[#FAF7F2] border-t border-[#D3A474]/20 flex flex-col gap-2 font-medium">
          {mode === 'login' ? (
            <p>
              Belum punya akun?{' '}
              <button 
                onClick={() => setMode('register')} 
                className="text-[#D3A474] font-bold hover:underline bg-transparent border-0 outline-none p-0 cursor-pointer"
              >
                Daftar Gratis
              </button>
            </p>
          ) : (
            <p>
              Sudah memiliki akun?{' '}
              <button 
                onClick={() => setMode('login')} 
                className="text-[#D3A474] font-bold hover:underline bg-transparent border-0 outline-none p-0 cursor-pointer"
              >
                Masuk di sini
              </button>
            </p>
          )}

          <button
            onClick={() => setMode('landing')}
            className="text-[#FAF7F2]/60 hover:text-white font-bold hover:underline bg-transparent border-0 outline-none p-0 mt-1 cursor-pointer"
          >
            Kembali ke Landing Page
          </button>
        </div>

      </div>
    </div>
  );
}
