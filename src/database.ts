import { RegisteredUser, Wallet, Category, Transaction, TransactionType, PaymentMethod } from './types';
import { getSupabase, isSupabaseConfigured } from './lib/supabase';

// Helper to interact with localStorage safely
const readJSON = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading key:', key, error);
    return defaultValue;
  }
};

const writeJSON = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing key:', key, error);
  }
};

// Storage Keys
const KEYS = {
  USERS: 'moneyplus_users',
  WALLETS: 'moneyplus_wallets',
  CATEGORIES: 'moneyplus_categories',
  TRANSACTIONS: 'moneyplus_transactions',
  BUDGETS: 'moneyplus_budgets',
  SESSION: 'moneyplus_session',
  PAYMENT_METHODS: 'moneyplus_payment_methods',
};

// Raw local storage getters
const getUsersRaw = (): RegisteredUser[] => readJSON<RegisteredUser[]>(KEYS.USERS, []);
const saveUsersRaw = (users: RegisteredUser[]): void => writeJSON(KEYS.USERS, users);

const getWalletsRaw = (): (Wallet & { initialBalance?: number; saldo?: number })[] => readJSON(KEYS.WALLETS, []);
const saveWalletsRaw = (wallets: any[]): void => writeJSON(KEYS.WALLETS, wallets);

const getCategoriesRaw = (): Category[] => readJSON<Category[]>(KEYS.CATEGORIES, []);
const saveCategoriesRaw = (categories: Category[]): void => writeJSON(KEYS.CATEGORIES, categories);

const getTransactionsRaw = (): Transaction[] => readJSON<Transaction[]>(KEYS.TRANSACTIONS, []);
const saveTransactionsRaw = (transactions: Transaction[]): void => writeJSON(KEYS.TRANSACTIONS, transactions);

const getPaymentMethodsRaw = (): PaymentMethod[] => readJSON<PaymentMethod[]>(KEYS.PAYMENT_METHODS, []);
const savePaymentMethodsRaw = (pms: PaymentMethod[]): void => writeJSON(KEYS.PAYMENT_METHODS, pms);

/**
 * Recalculate balances in local mode
 */
export const recalculateWalletBalancesLocal = (userId: string): void => {
  const wallets = getWalletsRaw();
  const transactions = getTransactionsRaw().filter((t) => t.userId === userId);

  const walletMap = new Map<string, number>();
  wallets.forEach((w) => {
    if (w.userId === userId) {
      const startBal = w.initialBalance !== undefined ? w.initialBalance : (w.saldo !== undefined ? w.saldo : w.balance);
      walletMap.set(w.id, startBal);
    }
  });

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const t of sortedTransactions) {
    if (t.type === 'pemasukan') {
      const bal = walletMap.get(t.walletId) || 0;
      walletMap.set(t.walletId, bal + t.amount);
    } else if (t.type === 'pengeluaran') {
      const bal = walletMap.get(t.walletId) || 0;
      walletMap.set(t.walletId, bal - t.amount);
    } else if (t.type === 'transfer' && t.toWalletId) {
      const balFrom = walletMap.get(t.walletId) || 0;
      walletMap.set(t.walletId, balFrom - t.amount);

      const balTo = walletMap.get(t.toWalletId) || 0;
      walletMap.set(t.toWalletId, balTo + t.amount);
    }
  }

  const updatedWallets = wallets.map((w) => {
    if (w.userId === userId && walletMap.has(w.id)) {
      const currentVal = walletMap.get(w.id) || 0;
      return {
        ...w,
        balance: currentVal,
        saldo: currentVal,
      };
    }
    return w;
  });

  saveWalletsRaw(updatedWallets);
};

/**
 * Recalculate balances in Supabase mode
 */
export const recalculateWalletBalancesSupabase = async (userId: string): Promise<void> => {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    // Fetch all wallets for this user
    const { data: rawWallets, error: wError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId);

    if (wError || !rawWallets) throw wError || new Error('Failed to load wallets');

    // Fetch all transactions for this user
    const { data: rawTrans, error: tError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId);

    if (tError || !rawTrans) throw tError || new Error('Failed to load transactions');

    // Map starting balances by wallet ID
    const walletMap = new Map<string, number>();
    rawWallets.forEach((w) => {
      walletMap.set(w.id, Number(w.initial_balance || 0));
    });

    // Chronological sort
    const sorted = [...rawTrans].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Apply calculations
    for (const t of sorted) {
      if (t.type === 'pemasukan') {
        const current = walletMap.get(t.wallet_id) || 0;
        walletMap.set(t.wallet_id, current + Number(t.amount));
      } else if (t.type === 'pengeluaran') {
        const current = walletMap.get(t.wallet_id) || 0;
        walletMap.set(t.wallet_id, current - Number(t.amount));
      } else if (t.type === 'transfer' && t.to_wallet_id) {
        const fromBal = walletMap.get(t.wallet_id) || 0;
        walletMap.set(t.wallet_id, fromBal - Number(t.amount));

        const toBal = walletMap.get(t.to_wallet_id) || 0;
        walletMap.set(t.to_wallet_id, toBal + Number(t.amount));
      }
    }

    // Write back updated balances to Supabase in separate operations
    for (const [wId, finalBalance] of walletMap.entries()) {
      await supabase
        .from('wallets')
        .update({ balance: finalBalance })
        .eq('id', wId)
        .eq('user_id', userId);
    }
  } catch (error) {
    console.error('Error recalculating Supabase balances:', error);
  }
};

/**
 * Seeding preset categories and wallets for pristine dashboards (Local)
 */
export const seedUserDataLocal = (userId: string): void => {
  // Completely empty to ensure no dummy categories or transactions are created for new users
  recalculateWalletBalancesLocal(userId);
};

/**
 * Seeding preset categories and wallets for pristine dashboards (Supabase)
 */
export const seedUserDataSupabase = async (userId: string): Promise<void> => {
  // Completely empty to ensure no dummy categories or transactions are created for new users
  await recalculateWalletBalancesSupabase(userId);
};

/**
 * AUTHENTICATION MODULE (Unified Async Signatures)
 */
export const AuthDB = {
  getUsers: async (): Promise<RegisteredUser[]> => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        const { data, error } = await supabase.from('users').select('*');
        if (error) console.error(error);
        if (data) {
          return data.map((u: any) => ({
            id: u.id,
            fullName: u.full_name || 'User',
            username: u.username || 'user',
            email: u.email,
            avatarUrl: u.avatar_url || '',
            createdAt: u.created_at,
          }));
        }
      }
    }
    return Promise.resolve(getUsersRaw());
  },

  registerUser: async (fullName: string, username: string, email: string, password_raw: string): Promise<RegisteredUser> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        // Sign up user via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password_raw,
          options: {
            data: {
              fullName: fullName.trim(),
              username: cleanUsername,
              avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXdTxS1Wq-mMnZzwbwSAej1L0c6uMz1eFGsykK2lJ6aS1nYsJHkGk9LyZ1kbY6cZ3EwO0_t_qgw2192yIjOwoBT4zVgsmpUFpEjIGXKow_McXVsp___putAVe-7MKGQ9OHXOpvTFU4V1IR-VhfXw2Btza_DXL14_xBaM7eEFBgTdRk-WePLi40vKc3mbyK0cCyJ0bJNLilfQ9nzU_43x2DtG7GhgCu212UMcFW0_st4Y8UspIVLsLii_GgJJqjyAi1g5Ueuk9qiCo7',
            }
          }
        });

        if (authError) throw new Error(authError.message);
        if (!authData.user) throw new Error('Pengisian pendaftaran gagal.');

        const userId = authData.user.id;

        // Upsert direct record into users row to guarantee access
        const { error: insertError } = await supabase
          .from('users')
          .upsert({
            id: userId,
            email: cleanEmail,
            full_name: fullName.trim(),
            username: cleanUsername,
            avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXdTxS1Wq-mMnZzwbwSAej1L0c6uMz1eFGsykK2lJ6aS1nYsJHkGk9LyZ1kbY6cZ3EwO0_t_qgw2192yIjOwoBT4zVgsmpUFpEjIGXKow_McXVsp___putAVe-7MKGQ9OHXOpvTFU4V1IR-VhfXw2Btza_DXL14_xBaM7eEFBgTdRk-WePLi40vKc3mbyK0cCyJ0bJNLilfQ9nzU_43x2DtG7GhgCu212UMcFW0_st4Y8UspIVLsLii_GgJJqjyAi1g5Ueuk9qiCo7',
          });

        if (insertError) console.error('Error writing profile to public.users:', insertError);

        // Seed data in background
        await seedUserDataSupabase(userId);

        return {
          id: userId,
          fullName: fullName.trim(),
          username: cleanUsername,
          email: cleanEmail,
          avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXdTxS1Wq-mMnZzwbwSAej1L0c6uMz1eFGsykK2lJ6aS1nYsJHkGk9LyZ1kbY6cZ3EwO0_t_qgw2192yIjOwoBT4zVgsmpUFpEjIGXKow_McXVsp___putAVe-7MKGQ9OHXOpvTFU4V1IR-VhfXw2Btza_DXL14_xBaM7eEFBgTdRk-WePLi40vKc3mbyK0cCyJ0bJNLilfQ9nzU_43x2DtG7GhgCu212UMcFW0_st4Y8UspIVLsLii_GgJJqjyAi1g5Ueuk9qiCo7',
          createdAt: new Date().toISOString()
        };
      }
    }

    // Local Emulated Storage Fallback
    const users = getUsersRaw();
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('Email sudah terdaftar. Silakan masuk atau gunakan email lain.');
    }
    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      throw new Error('Username sudah digunakan. Silakan pilih username lain.');
    }

    const newUser: RegisteredUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fullName: fullName.trim(),
      username: username.trim(),
      email: cleanEmail,
      password: password_raw,
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXdTxS1Wq-mMnZzwbwSAej1L0c6uMz1eFGsykK2lJ6aS1nYsJHkGk9LyZ1kbY6cZ3EwO0_t_qgw2192yIjOwoBT4zVgsmpUFpEjIGXKow_McXVsp___putAVe-7MKGQ9OHXOpvTFU4V1IR-VhfXw2Btza_DXL14_xBaM7eEFBgTdRk-WePLi40vKc3mbyK0cCyJ0bJNLilfQ9nzU_43x2DtG7GhgCu212UMcFW0_st4Y8UspIVLsLii_GgJJqjyAi1g5Ueuk9qiCo7',
      createdAt: new Date().toISOString(),
    };

    saveUsersRaw([...users, newUser]);
    seedUserDataLocal(newUser.id);

    return Promise.resolve(newUser);
  },

  loginUser: async (email: string, password_raw: string): Promise<RegisteredUser> => {
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password_raw
        });

        if (authError) throw new Error(authError.message);
        if (!authData.user) throw new Error('Email atau password salah.');

        // Grab profile row
        const { data: profile, error: pError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        const initialBalanceVal = profile?.initial_balance !== undefined && profile?.initial_balance !== null
          ? Number(profile.initial_balance)
          : (authData.user.user_metadata?.initialBalance !== undefined && authData.user.user_metadata?.initialBalance !== null
            ? Number(authData.user.user_metadata.initialBalance)
            : undefined);

        return {
          id: authData.user.id,
          fullName: profile?.full_name || authData.user.user_metadata?.fullName || 'User',
          username: profile?.username || authData.user.user_metadata?.username || 'user',
          email: authData.user.email || cleanEmail,
          avatarUrl: profile?.avatar_url || authData.user.user_metadata?.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXdTxS1Wq-mMnZzwbwSAej1L0c6uMz1eFGsykK2lJ6aS1nYsJHkGk9LyZ1kbY6cZ3EwO0_t_qgw2192yIjOwoBT4zVgsmpUFpEjIGXKow_McXVsp___putAVe-7MKGQ9OHXOpvTFU4V1IR-VhfXw2Btza_DXL14_xBaM7eEFBgTdRk-WePLi40vKc3mbyK0cCyJ0bJNLilfQ9nzU_43x2DtG7GhgCu212UMcFW0_st4Y8UspIVLsLii_GgJJqjyAi1g5Ueuk9qiCo7',
          createdAt: profile?.created_at || new Date().toISOString(),
          initialBalance: initialBalanceVal
        };
      }
    }

    const users = getUsersRaw();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail && u.password === password_raw);
    if (!user) {
      throw new Error('Email atau password salah. Silakan periksa kembali kredensial Anda.');
    }
    return Promise.resolve(user);
  },

  updateProfile: async (userId: string, data: { fullName?: string; username?: string; email?: string; avatarUrl?: string; initialBalance?: number }): Promise<RegisteredUser> => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        const payload: any = {};
        if (data.fullName !== undefined) payload.full_name = data.fullName;
        if (data.username !== undefined) payload.username = data.username;
        if (data.avatarUrl !== undefined) payload.avatar_url = data.avatarUrl;

        try {
          if (data.initialBalance !== undefined) {
            payload.initial_balance = data.initialBalance;
          }
          const { error } = await supabase
            .from('users')
            .update(payload)
            .eq('id', userId);

          if (error) {
            console.warn('DB profile update warning:', error);
            if (error.message?.includes('initial_balance')) {
              const fallbackPayload = { ...payload };
              delete fallbackPayload.initial_balance;
              await supabase.from('users').update(fallbackPayload).eq('id', userId);
            }
          }
        } catch (err) {
          console.warn('Graceful DB profile update catch:', err);
        }

        const authPayload: any = {};
        if (data.fullName !== undefined) authPayload.fullName = data.fullName;
        if (data.username !== undefined) authPayload.username = data.username;
        if (data.avatarUrl !== undefined) authPayload.avatarUrl = data.avatarUrl;
        if (data.initialBalance !== undefined) authPayload.initialBalance = data.initialBalance;

        await supabase.auth.updateUser({
          data: authPayload
        }).catch(err => console.warn('Auth metadata update failed:', err));

        // Fetch user metadata/profile back
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        const { data: { user: authUser } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

        const mergedInitialBalance = profile?.initial_balance !== undefined && profile?.initial_balance !== null
          ? Number(profile.initial_balance)
          : (authUser?.user_metadata?.initialBalance !== undefined && authUser?.user_metadata?.initialBalance !== null
            ? Number(authUser.user_metadata.initialBalance)
            : (data.initialBalance !== undefined ? data.initialBalance : undefined));

        return {
          id: String(userId),
          fullName: String(profile?.full_name || authUser?.user_metadata?.fullName || data.fullName || 'User'),
          username: String(profile?.username || authUser?.user_metadata?.username || data.username || 'user'),
          email: String(profile?.email || authUser?.email || ''),
          avatarUrl: String(profile?.avatar_url || authUser?.user_metadata?.avatarUrl || data.avatarUrl || ''),
          createdAt: String(profile?.created_at || authUser?.created_at || new Date().toISOString()),
          initialBalance: mergedInitialBalance !== undefined ? Number(mergedInitialBalance) : undefined
        };
      }
    }

    const users = getUsersRaw();
    const updatedUsers = users.map((u) => {
      if (u.id === userId) {
        if (data.email && data.email.toLowerCase() !== u.email.toLowerCase()) {
          if (users.some((other) => other.id !== userId && other.email.toLowerCase() === data.email!.trim().toLowerCase())) {
            throw new Error('Email sudah digunakan oleh akun lain.');
          }
        }
        if (data.username && data.username.toLowerCase() !== u.username.toLowerCase()) {
          if (users.some((other) => other.id !== userId && other.username.toLowerCase() === data.username!.trim().toLowerCase())) {
            throw new Error('Username sudah digunakan oleh akun lain.');
          }
        }

        return {
          ...u,
          fullName: String(data.fullName !== undefined ? data.fullName.trim() : u.fullName),
          username: String(data.username !== undefined ? data.username.trim() : u.username),
          email: String(data.email !== undefined ? data.email.trim().toLowerCase() : u.email),
          avatarUrl: String(data.avatarUrl !== undefined ? data.avatarUrl : u.avatarUrl),
          initialBalance: data.initialBalance !== undefined ? Number(data.initialBalance) : u.initialBalance,
        };
      }
      return u;
    });

    saveUsersRaw(updatedUsers);
    const updatedUser = updatedUsers.find((u) => u.id === userId);
    if (!updatedUser) throw new Error('Pengguna tidak ditemukan.');
    return Promise.resolve(updatedUser);
  },

  updatePassword: async (userId: string, password_raw: string): Promise<void> => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        const { error } = await supabase.auth.updateUser({ password: password_raw });
        if (error) throw new Error(error.message);
        return;
      }
    }
    
    const users = getUsersRaw();
    const updated = users.map(u => {
      if (u.id === userId) {
        return { ...u, password: password_raw };
      }
      return u;
    });
    saveUsersRaw(updated);
    
    const sess = AuthDB.getCurrentSession();
    if (sess && sess.id === userId) {
      AuthDB.setSession({ ...sess, password: password_raw });
    }
    return Promise.resolve();
  },

  deleteAccount: async (userId: string): Promise<void> => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        // Will delete database cascade files via references
        const { error } = await supabase.from('users').delete().eq('id', userId);
        if (error) console.error(error);
        await supabase.auth.signOut();
        return;
      }
    }

    const users = getUsersRaw().filter((u) => u.id !== userId);
    saveUsersRaw(users);

    const wallets = getWalletsRaw().filter((w) => w.userId !== userId);
    saveWalletsRaw(wallets);

    const cats = getCategoriesRaw().filter((c) => c.userId !== userId);
    saveCategoriesRaw(cats);

    const trans = getTransactionsRaw().filter((t) => t.userId !== userId);
    saveTransactionsRaw(trans);
    return Promise.resolve();
  },

  getCurrentSession: (): RegisteredUser | null => {
    return readJSON<RegisteredUser | null>(KEYS.SESSION, null);
  },

  setSession: (user: RegisteredUser | null): void => {
    writeJSON(KEYS.SESSION, user);
  },

  uploadAvatar: async (userId: string, file: File): Promise<string> => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Format file tidak didukung. Harap gunakan JPG, JPEG, PNG, atau WEBP.');
    }
    // Validate size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('Ukuran file maksimal adalah 5 MB.');
    }

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        // Struct: profile-images/{user_id}/avatar.jpg
        const filePath = `${userId}/avatar.jpg`;
        
        // Upload to storage with upsert: true
        const { error } = await supabase.storage
          .from('profile-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) {
          throw new Error('Gagal mengunggah foto ke Supabase Storage: ' + error.message);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('profile-images')
          .getPublicUrl(filePath);

        // Add buster
        const busterUrl = `${publicUrl}?t=${Date.now()}`;

        // Auto update profile to include URL
        await AuthDB.updateProfile(userId, { avatarUrl: busterUrl });
        return busterUrl;
      }
    }

    // Local Emulated mode: convert to Base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const updated = await AuthDB.updateProfile(userId, { avatarUrl: base64 });
          resolve(updated.avatarUrl);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(new Error('Gagal membaca file.'));
      reader.readAsDataURL(file);
    });
  },

  deleteAvatar: async (userId: string): Promise<string> => {
    const defaultAvatarUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXdTxS1Wq-mMnZzwbwSAej1L0c6uMz1eFGsykK2lJ6aS1nYsJHkGk9LyZ1kbY6cZ3EwO0_t_qgw2192yIjOwoBT4zVgsmpUFpEjIGXKow_McXVsp___putAVe-7MKGQ9OHXOpvTFU4V1IR-VhfXw2Btza_DXL14_xBaM7eEFBgTdRk-WePLi40vKc3mbyK0cCyJ0bJNLilfQ9nzU_43x2DtG7GhgCu212UMcFW0_st4Y8UspIVLsLii_GgJJqjyAi1g5Ueuk9qiCo7';

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        const filePath = `${userId}/avatar.jpg`;
        await supabase.storage.from('profile-images').remove([filePath]).catch(e => {
          console.warn('Silent fallback: profile picture delete did not hit cloud storage path directly:', e);
        });
      }
    }

    // Save/update standard profile avatar
    const updated = await AuthDB.updateProfile(userId, { avatarUrl: defaultAvatarUrl });
    return updated.avatarUrl;
  },
};

/**
 * WALLETS MODULE (Unified Async Signatures)
 */
export const WalletDB = {
  getWallets: async (userId: string): Promise<Wallet[]> => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        const { data, error } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', userId);

        if (error) console.error(error);
        if (data && data.length > 0) {
          return data.map((w: any) => ({
            id: w.id,
            userId: w.user_id,
            name: w.name,
            type: w.type,
            balance: Number(w.balance || 0),
            createdAt: w.created_at
          }));
        } else if (data && data.length === 0) {
          try {
            const defaultW = await WalletDB.addWallet(userId, 'Utama', 'Sistem', 0);
            return [defaultW];
          } catch (e) {
            console.error('Failed to auto-create default Supabase wallet:', e);
          }
        }
      }
    }
    const localWallets = getWalletsRaw().filter((w) => w.userId === userId) as Wallet[];
    if (localWallets.length > 0) {
      return Promise.resolve(localWallets);
    } else {
      const wallets = getWalletsRaw();
      const newWallet = {
        id: `wallet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        name: 'Utama',
        type: 'Sistem',
        initialBalance: 0,
        balance: 0,
        createdAt: new Date().toISOString(),
      };
      saveWalletsRaw([...wallets, newWallet]);
      return Promise.resolve([newWallet]);
    }
  },

  addWallet: async (userId: string, name: string, type: string, initialBalance: number): Promise<Wallet> => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        const { data, error } = await supabase
          .from('wallets')
          .insert({
            user_id: userId,
            name: name.trim(),
            type: type.trim(),
            initial_balance: initialBalance,
            balance: initialBalance
          })
          .select('*')
          .single();

        if (error) throw new Error(error.message);
        await recalculateWalletBalancesSupabase(userId);
        return {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          type: data.type,
          balance: Number(data.balance || 0),
          createdAt: data.created_at
        };
      }
    }

    const wallets = getWalletsRaw();
    const newWallet = {
      id: `wallet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      name: name.trim(),
      type: type.trim(),
      initialBalance: initialBalance,
      balance: initialBalance,
      saldo: initialBalance,
      createdAt: new Date().toISOString(),
    };

    saveWalletsRaw([...wallets, newWallet]);
    recalculateWalletBalancesLocal(userId);
    return Promise.resolve(newWallet);
  },

  updateWallet: async (userId: string, walletId: string, name: string, type: string): Promise<Wallet> => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        const { data, error } = await supabase
          .from('wallets')
          .update({
            name: name.trim(),
            type: type.trim()
          })
          .eq('id', walletId)
          .eq('user_id', userId)
          .select('*')
          .single();

        if (error) throw new Error(error.message);
        await recalculateWalletBalancesSupabase(userId);
        return {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          type: data.type,
          balance: Number(data.balance || 0),
          createdAt: data.created_at
        };
      }
    }

    const wallets = getWalletsRaw();
    const updated = wallets.map((w) => {
      if (w.id === walletId && w.userId === userId) {
        return {
          ...w,
          name: name.trim(),
          type: type.trim(),
        };
      }
      return w;
    });

    saveWalletsRaw(updated);
    recalculateWalletBalancesLocal(userId);
    
    const target = updated.find((w) => w.id === walletId) as Wallet;
    if (!target) throw new Error('Dompet tidak ditemukan.');
    return Promise.resolve(target);
  },

  canDeleteWallet: async (userId: string, walletId: string): Promise<{ allowed: boolean; count: number }> => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        const { data: fromTrans, error: e1 } = await supabase
          .from('transactions')
          .select('id')
          .eq('user_id', userId)
          .eq('wallet_id', walletId);
          
        const { data: toTrans, error: e2 } = await supabase
          .from('transactions')
          .select('id')
          .eq('user_id', userId)
          .eq('to_wallet_id', walletId);

        const count = (fromTrans?.length || 0) + (toTrans?.length || 0);
        return {
          allowed: count === 0,
          count: count
        };
      }
    }

    const transactions = getTransactionsRaw().filter(
      (t) => t.userId === userId && (t.walletId === walletId || t.toWalletId === walletId)
    );
    return Promise.resolve({
      allowed: transactions.length === 0,
      count: transactions.length,
    });
  },

  deleteWalletInsecurely: async (userId: string, walletId: string): Promise<void> => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        // Drop any transactions with these wallets
        await supabase.from('transactions').delete().eq('user_id', userId).eq('wallet_id', walletId);
        await supabase.from('transactions').delete().eq('user_id', userId).eq('to_wallet_id', walletId);
        await supabase.from('wallets').delete().eq('id', walletId).eq('user_id', userId);
        await recalculateWalletBalancesSupabase(userId);
        return;
      }
    }

    const wallets = getWalletsRaw().filter((w) => !(w.id === walletId && w.userId === userId));
    saveWalletsRaw(wallets);

    const transactions = getTransactionsRaw().filter(
      (t) => !(t.userId === userId && (t.walletId === walletId || t.toWalletId === walletId))
    );
    saveTransactionsRaw(transactions);
    recalculateWalletBalancesLocal(userId);
    return Promise.resolve();
  },
};

/**
 * CATEGORIES MODULE (Unified Async Signatures)
 */
export const CategoryDB = {
  getCategories: async (userId: string): Promise<Category[]> => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId);

        if (error) console.error(error);
        if (data) {
          return data.map((c: any) => ({
            id: c.id,
            userId: c.user_id,
            name: c.name,
            type: c.type,
            icon: c.icon,
            color: c.color
          }));
        }
      }
    }
    return Promise.resolve(getCategoriesRaw().filter((c) => c.userId === userId));
  },

  addCategory: async (userId: string, name: string, type: 'pemasukan' | 'pengeluaran', icon: string, color: string): Promise<Category> => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        const { data, error } = await supabase
          .from('categories')
          .insert({
            user_id: userId,
            name: name.trim(),
            type,
            icon,
            color
          })
          .select('*')
          .single();

        if (error) throw new Error(error.message);
        return {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          type: data.type,
          icon: data.icon,
          color: data.color
        };
      }
    }

    const cats = getCategoriesRaw();
    const newCat: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      name: name.trim(),
      type,
      icon,
      color,
    };

    saveCategoriesRaw([...cats, newCat]);
    return Promise.resolve(newCat);
  },

  updateCategory: async (userId: string, catId: string, name: string, type: 'pemasukan' | 'pengeluaran', icon: string, color: string): Promise<Category> => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        const { data, error } = await supabase
          .from('categories')
          .update({
            name: name.trim(),
            type,
            icon,
            color
          })
          .eq('id', catId)
          .eq('user_id', userId)
          .select('*')
          .single();

        if (error) throw new Error(error.message);
        return {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          type: data.type,
          icon: data.icon,
          color: data.color
        };
      }
    }

    const cats = getCategoriesRaw();
    const updated = cats.map((c) => {
      if (c.id === catId && c.userId === userId) {
        return {
          ...c,
          name: name.trim(),
          type,
          icon,
          color,
        };
      }
      return c;
    });

    saveCategoriesRaw(updated);
    const target = updated.find((c) => c.id === catId);
    if (!target) throw new Error('Kategori tidak ditemukan.');
    return Promise.resolve(target);
  },

  deleteCategory: async (userId: string, catId: string): Promise<void> => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        // Cascades automatically if foreign keys have cascades or manually set null / delete related
        await supabase.from('budgets').delete().eq('user_id', userId).eq('category_id', catId);
        await supabase.from('transactions').update({ category_id: null }).eq('user_id', userId).eq('category_id', catId);
        await supabase.from('categories').delete().eq('id', catId).eq('user_id', userId);
        return;
      }
    }

    const cats = getCategoriesRaw().filter((c) => !(c.id === catId && c.userId === userId));
    saveCategoriesRaw(cats);

    const transactions = getTransactionsRaw().map((t) => {
      if (t.userId === userId && t.categoryId === catId) {
        return { ...t, categoryId: undefined };
      }
      return t;
    });
    saveTransactionsRaw(transactions);
    return Promise.resolve();
  },
};

/**
 * PAYMENT METHODS MODULE (Unified Async Signatures)
 */
export const PaymentMethodDB = {
  getPaymentMethods: async (userId: string): Promise<PaymentMethod[]> => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('user_id', userId);

          if (!error && data) {
            if (data.length > 0) {
              return data.map((pm: any) => ({
                id: pm.id,
                userId: pm.user_id,
                name: pm.name,
                icon: pm.icon,
                createdAt: pm.created_at
              }));
            } else {
              // Auto seed in Supabase
              const defaults = [
                { user_id: userId, name: 'Cash', icon: '💵' },
                { user_id: userId, name: 'Bank', icon: '🏦' },
                { user_id: userId, name: 'E-Wallet', icon: '📱' },
                { user_id: userId, name: 'Kartu', icon: '💳' }
              ];
              const { data: seeded, error: seedError } = await supabase
                .from('payment_methods')
                .insert(defaults)
                .select('*');
              
              if (!seedError && seeded) {
                return seeded.map((pm: any) => ({
                  id: pm.id,
                  userId: pm.user_id,
                  name: pm.name,
                  icon: pm.icon,
                  createdAt: pm.created_at
                }));
              }
            }
          }
        } catch (err) {
          console.warn('Fallback to local payment methods:', err);
        }
      }
    }

    // Local Storage version
    const localPMs = getPaymentMethodsRaw().filter((pm) => pm.userId === userId);
    if (localPMs.length > 0) {
      return Promise.resolve(localPMs);
    } else {
      // Seed default payment methods
      const defaults: PaymentMethod[] = [
        {
          id: `pm-cash-${userId}`,
          userId,
          name: 'Cash',
          icon: '💵',
          createdAt: new Date().toISOString()
        },
        {
          id: `pm-bank-${userId}`,
          userId,
          name: 'Bank',
          icon: '🏦',
          createdAt: new Date().toISOString()
        },
        {
          id: `pm-ewallet-${userId}`,
          userId,
          name: 'E-Wallet',
          icon: '📱',
          createdAt: new Date().toISOString()
        },
        {
          id: `pm-kartu-${userId}`,
          userId,
          name: 'Kartu',
          icon: '💳',
          createdAt: new Date().toISOString()
        }
      ];
      const allPMs = getPaymentMethodsRaw();
      savePaymentMethodsRaw([...allPMs, ...defaults]);
      return Promise.resolve(defaults);
    }
  },

  addPaymentMethod: async (userId: string, name: string, icon: string): Promise<PaymentMethod> => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('payment_methods')
            .insert({
              user_id: userId,
              name: name.trim(),
              icon: icon.trim()
            })
            .select('*')
            .single();

          if (!error && data) {
            return {
              id: data.id,
              userId: data.user_id,
              name: data.name,
              icon: data.icon,
              createdAt: data.created_at
            };
          } else if (error) {
            throw new Error(error.message);
          }
        } catch (err) {
          console.warn('Supabase addPaymentMethod error, falling back:', err);
        }
      }
    }

    const pms = getPaymentMethodsRaw();
    const newPm: PaymentMethod = {
      id: `pm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      name: name.trim(),
      icon: icon.trim(),
      createdAt: new Date().toISOString()
    };

    savePaymentMethodsRaw([...pms, newPm]);
    return Promise.resolve(newPm);
  },

  updatePaymentMethod: async (userId: string, id: string, name: string, icon: string): Promise<PaymentMethod> => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('payment_methods')
            .update({
              name: name.trim(),
              icon: icon.trim()
            })
            .eq('id', id)
            .eq('user_id', userId)
            .select('*')
            .single();

          if (!error && data) {
            return {
              id: data.id,
              userId: data.user_id,
              name: data.name,
              icon: data.icon,
              createdAt: data.created_at
            };
          } else if (error) {
            throw new Error(error.message);
          }
        } catch (err) {
          console.warn('Supabase updatePaymentMethod error, falling back:', err);
        }
      }
    }

    const pms = getPaymentMethodsRaw();
    const updated = pms.map((pm) => {
      if (pm.id === id && pm.userId === userId) {
        return {
          ...pm,
          name: name.trim(),
          icon: icon.trim()
        };
      }
      return pm;
    });

    savePaymentMethodsRaw(updated);
    const target = updated.find((pm) => pm.id === id);
    if (!target) throw new Error('Metode pembayaran tidak ditemukan.');
    return Promise.resolve(target);
  },

  deletePaymentMethod: async (userId: string, id: string): Promise<void> => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.from('transactions').update({ payment_method_id: null }).eq('payment_method_id', id).eq('user_id', userId);
          await supabase.from('payment_methods').delete().eq('id', id).eq('user_id', userId);
          return;
        } catch (err) {
          console.warn('Supabase deletePaymentMethod error, falling back:', err);
        }
      }
    }

    const pms = getPaymentMethodsRaw().filter((pm) => !(pm.id === id && pm.userId === userId));
    savePaymentMethodsRaw(pms);

    const transactions = getTransactionsRaw().map((t) => {
      if (t.userId === userId && t.paymentMethodId === id) {
        return { ...t, paymentMethodId: undefined };
      }
      return t;
    });
    saveTransactionsRaw(transactions);
    return Promise.resolve();
  }
};

/**
 * TRANSACTIONS MODULE (Unified Async Signatures)
 */
export const TransactionDB = {
  getTransactions: async (userId: string): Promise<Transaction[]> => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });

        if (error) console.error(error);
        if (data) {
          return data.map((t: any) => ({
            id: t.id,
            userId: t.user_id,
            walletId: t.wallet_id,
            toWalletId: t.to_wallet_id || undefined,
            categoryId: t.category_id || undefined,
            paymentMethodId: t.payment_method_id || undefined,
            type: t.type as TransactionType,
            amount: Number(t.amount || 0),
            notes: t.notes || '',
            date: t.date,
            createdAt: t.created_at
          }));
        }
      }
    }
    return Promise.resolve(
      getTransactionsRaw()
        .filter((t) => t.userId === userId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
  },

  addTransaction: async (
    userId: string,
    walletId: string,
    toWalletId: string | undefined,
    categoryId: string | undefined,
    type: TransactionType,
    amount: number,
    notes: string,
    date: string,
    paymentMethodId?: string
  ): Promise<Transaction> => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        const payload: any = {
          user_id: userId,
          wallet_id: walletId,
          to_wallet_id: type === 'transfer' ? toWalletId : null,
          category_id: type !== 'transfer' ? (categoryId || null) : null,
          payment_method_id: paymentMethodId || null,
          type,
          amount,
          notes: notes.trim(),
          date: date || new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('transactions')
          .insert(payload)
          .select('*')
          .single();

        if (error) throw new Error(error.message);
        await recalculateWalletBalancesSupabase(userId);
        return {
          id: data.id,
          userId: data.user_id,
          walletId: data.wallet_id,
          toWalletId: data.to_wallet_id || undefined,
          categoryId: data.category_id || undefined,
          paymentMethodId: data.payment_method_id || undefined,
          type: data.type as TransactionType,
          amount: Number(data.amount || 0),
          notes: data.notes || '',
          date: data.date,
          createdAt: data.created_at
        };
      }
    }

    const transactions = getTransactionsRaw();
    const newTrans: Transaction = {
      id: `trans-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      walletId,
      toWalletId: type === 'transfer' ? toWalletId : undefined,
      categoryId: type !== 'transfer' ? categoryId : undefined,
      paymentMethodId,
      type,
      amount,
      notes: notes.trim(),
      date: date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    saveTransactionsRaw([...transactions, newTrans]);
    recalculateWalletBalancesLocal(userId);
    return Promise.resolve(newTrans);
  },

  updateTransaction: async (
    userId: string,
    transId: string,
    data: {
      walletId: string;
      toWalletId?: string;
      categoryId?: string;
      paymentMethodId?: string;
      type: TransactionType;
      amount: number;
      notes: string;
      date: string;
    }
  ): Promise<Transaction> => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        const payload: any = {
          wallet_id: data.walletId,
          to_wallet_id: data.type === 'transfer' ? data.toWalletId : null,
          category_id: data.type !== 'transfer' ? (data.categoryId || null) : null,
          payment_method_id: data.paymentMethodId || null,
          type: data.type,
          amount: data.amount,
          notes: data.notes.trim(),
          date: data.date
        };

        const { data: dbData, error } = await supabase
          .from('transactions')
          .update(payload)
          .eq('id', transId)
          .eq('user_id', userId)
          .select('*')
          .single();

        if (error) throw new Error(error.message);
        await recalculateWalletBalancesSupabase(userId);
        return {
          id: dbData.id,
          userId: dbData.user_id,
          walletId: dbData.wallet_id,
          toWalletId: dbData.to_wallet_id || undefined,
          categoryId: dbData.category_id || undefined,
          paymentMethodId: dbData.payment_method_id || undefined,
          type: dbData.type as TransactionType,
          amount: Number(dbData.amount || 0),
          notes: dbData.notes || '',
          date: dbData.date,
          createdAt: dbData.created_at
        };
      }
    }

    const transactions = getTransactionsRaw();
    const updated = transactions.map((t) => {
      if (t.id === transId && t.userId === userId) {
        return {
          ...t,
          walletId: data.walletId,
          toWalletId: data.type === 'transfer' ? data.toWalletId : undefined,
          categoryId: data.type !== 'transfer' ? data.categoryId : undefined,
          paymentMethodId: data.paymentMethodId,
          type: data.type,
          amount: data.amount,
          notes: data.notes.trim(),
          date: data.date,
        };
      }
      return t;
    });

    saveTransactionsRaw(updated);
    recalculateWalletBalancesLocal(userId);

    const target = updated.find((t) => t.id === transId);
    if (!target) throw new Error('Transaksi tidak ditemukan.');
    return Promise.resolve(target);
  },

  deleteTransaction: async (userId: string, transId: string): Promise<void> => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('transactions').delete().eq('id', transId).eq('user_id', userId);
        await recalculateWalletBalancesSupabase(userId);
        return;
      }
    }

    const transactions = getTransactionsRaw().filter((t) => !(t.id === transId && t.userId === userId));
    saveTransactionsRaw(transactions);
    recalculateWalletBalancesLocal(userId);
    return Promise.resolve();
  },
};


