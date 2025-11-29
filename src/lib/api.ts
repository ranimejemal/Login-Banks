import { supabase } from './supabase';
import type { Profile, Account, Transaction } from './supabase';

export const auth = {
  signup: async (email: string, password: string, fullName: string) => {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) throw signUpError;
    if (!authData.user) throw new Error('No user returned from signup');

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
      });

    if (profileError) throw profileError;

    const accountNumber = `FR${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const { error: accountError } = await supabase
      .from('accounts')
      .insert({
        user_id: authData.user.id,
        account_number: accountNumber,
        balance: 5000.00,
      });

    if (accountError) throw accountError;

    return { user: authData.user, profile: { id: authData.user.id, email, fullName } };
  },

  signin: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { user: data.user };
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};

export const user = {
  getProfile: async (): Promise<Profile> => {
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Profile not found');

    return data;
  },

  getAccounts: async (): Promise<Account[]> => {
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', authUser.id);

    if (error) throw error;

    return data || [];
  },

  getTransactions: async (accountId: string): Promise<Transaction[]> => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return data || [];
  },
};
