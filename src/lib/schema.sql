-- SCHEMA BLUEPRINT FOR MONEY+ MULTI-USER FINANCE TRACKER
-- Copy and run this script in the Supabase SQL Editor to initialize your database!

-- 1. Create public.users table
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  username text unique,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for users
alter table public.users enable row level security;

-- RLS policies for users
create policy "Users can view their own profile/record." on public.users 
  for select using (auth.uid() = id);

create policy "Users can update their own profile/record." on public.users 
  for update using (auth.uid() = id);

-- 2. Create public.wallets table
create table if not exists public.wallets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  type text not null,
  balance numeric default 0 not null,
  initial_balance numeric default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for wallets
alter table public.wallets enable row level security;

-- RLS policies for wallets
create policy "Users can perform CRUD on their own wallets." on public.wallets
  for all using (auth.uid() = user_id);

-- 3. Create public.categories table
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  type text check (type in ('pemasukan', 'pengeluaran')) not null,
  icon text not null,
  color text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for categories
alter table public.categories enable row level security;

-- RLS policies for categories
create policy "Users can perform CRUD on their own categories." on public.categories
  for all using (auth.uid() = user_id);

-- 4. Create public.transactions table
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  wallet_id uuid references public.wallets(id) on delete cascade not null,
  to_wallet_id uuid references public.wallets(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  type text check (type in ('pemasukan', 'pengeluaran', 'transfer')) not null,
  amount numeric not null,
  notes text,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for transactions
alter table public.transactions enable row level security;

-- RLS policies for transactions
create policy "Users can perform CRUD on their own transactions." on public.transactions
  for all using (auth.uid() = user_id);

-- 5. Create public.budgets table
create table if not exists public.budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  budget_amount numeric not null,
  month int not null check (month between 1 and 12),
  year int not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for budgets
alter table public.budgets enable row level security;

-- RLS policies for budgets
create policy "Users can perform CRUD on their own budgets." on public.budgets
  for all using (auth.uid() = user_id);

-- 6. Trigger to automatically synchronize auth.users -> public.users on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, username, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'fullName', new.raw_user_meta_data->>'fullName', 'User Baru'),
    coalesce(new.raw_user_meta_data->>'username', substring(new.email from '^[^@]+')),
    coalesce(new.raw_user_meta_data->>'avatarUrl', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXdTxS1Wq-mMnZzwbwSAej1L0c6uMz1eFGsykK2lJ6aS1nYsJHkGk9LyZ1kbY6cZ3EwO0_t_qgw2192yIjOwoBT4zVgsmpUFpEjIGXKow_McXVsp___putAVe-7MKGQ9OHXOpvTFU4V1IR-VhfXw2Btza_DXL14_xBaM7eEFBgTdRk-WePLi40vKc3mbyK0cCyJ0bJNLilfQ9nzU_43x2DtG7GhgCu212UMcFW0_st4Y8UspIVLsLii_GgJJqjyAi1g5Ueuk9qiCo7')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
