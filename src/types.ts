/**
 * Types & Interfaces for Money+ Finance Tracker
 */

export interface RegisteredUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  password?: string;
  avatarUrl: string;
  createdAt: string;
  initialBalance?: number;
}

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  type: string; // e.g., 'Bank BCA', 'Bank BRI', 'Dana', 'OVO', 'GoPay', 'Tunai'
  balance: number;
  createdAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: 'pemasukan' | 'pengeluaran';
  icon: string; // Lucide icon identifier
  color: string; // Hex or tailwind class color
}

export interface PaymentMethod {
  id: string;
  userId: string;
  name: string;
  icon: string;
  createdAt: string;
}

export type TransactionType = 'pemasukan' | 'pengeluaran' | 'transfer';

export interface Transaction {
  id: string;
  userId: string;
  walletId: string; // Source wallet (asal)
  toWalletId?: string; // Target wallet for transfer (tujuan)
  categoryId?: string; // Optional for transfer
  paymentMethodId?: string; // Selected payment method (optional for backwards compatibility)
  type: TransactionType;
  amount: number;
  notes: string;
  date: string; // ISO date string
  createdAt: string;
}

export interface UserSession {
  currentUser: RegisteredUser | null;
  isAuthenticated: boolean;
}

export type ActiveTab = 'dashboard' | 'transactions' | 'wallets' | 'analytics' | 'settings' | 'categories_methods';
