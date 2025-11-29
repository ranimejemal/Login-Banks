import { useState, useEffect } from 'react';
import SignIn from './pages/SignIn';
import Dashboard from './pages/Dashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Chargement...</div>
      </div>
    );
  }

  return isAuthenticated ? (
    <Dashboard onSignOut={() => setIsAuthenticated(false)} />
  ) : (
    <SignIn onSignInSuccess={() => setIsAuthenticated(true)} />
  );
}

export default App;
