import { useState, useEffect } from 'react';
import { LogOut, CreditCard, TrendingUp, Eye, EyeOff, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { user, auth } from '../lib/api';

interface Account {
  id: number;
  account_number: string;
  balance: number;
  account_type: string;
}

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  created_at: string;
}

interface DashboardProps {
  onSignOut: () => void;
}

export default function Dashboard({ onSignOut }: DashboardProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const profile = await user.getProfile();
      setFullName(profile.full_name);

      const accountsData = await user.getAccounts();
      setAccounts(accountsData);

      if (accountsData && accountsData.length > 0) {
        const transactionsData = await user.getTransactions(accountsData[0].id);
        setTransactions(transactionsData);
      }

      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du chargement');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      auth.logout();
      onSignOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de déconnexion');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="bg-slate-950 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <CreditCard className="w-8 h-8 text-white" />
              <h1 className="text-white text-xl font-bold">SecureBank</h1>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-100 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-8">
          <p className="text-slate-400 text-lg">Bienvenue</p>
          <h2 className="text-white text-4xl font-bold">{fullName}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex justify-between items-start mb-12">
              <div>
                <p className="text-slate-400 text-sm mb-2">Solde total</p>
                <div className="flex items-center gap-3">
                  <h3 className={`text-4xl font-bold ${showBalance ? 'text-white' : 'text-slate-400'}`}>
                    {showBalance ? `${totalBalance.toFixed(2)}€` : '••••••'}
                  </h3>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
            <div className="h-1 bg-gradient-to-r from-green-400 to-blue-400 rounded-full mb-4"></div>
            <p className="text-slate-500 text-xs">Compte actif</p>
          </div>

          {accounts.map((account) => (
            <div key={account.id} className="bg-white rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-900 font-semibold">{account.account_type}</h3>
                <CreditCard className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-slate-600 text-sm mb-3">{account.account_number}</p>
              <p className="text-slate-900 text-2xl font-bold">
                {showBalance ? `${account.balance.toFixed(2)}€` : '••••••'}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-6 py-4">
            <h3 className="text-white font-semibold text-lg">Dernières transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-900">{transaction.description}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          {transaction.type === 'credit' ? (
                            <>
                              <ArrowDownLeft className="w-4 h-4 text-green-600" />
                              <span className="text-green-600 font-medium">Crédit</span>
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-4 h-4 text-red-600" />
                              <span className="text-red-600 font-medium">Débit</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-sm font-semibold ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}{transaction.amount.toFixed(2)}€
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      Aucune transaction pour le moment
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
