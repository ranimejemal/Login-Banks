import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
};

export type Account = {
  id: string;
  user_id: string;
  account_number: string;
  balance: number;
  account_type: string;
  created_at: string;
};

export type Transaction = {
  id: string;
  account_id: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  created_at: string;
};
