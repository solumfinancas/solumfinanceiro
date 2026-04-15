import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './FinanceContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Wallets } from './components/Wallets';
import { Categories } from './components/Categories';
import { Transactions } from './components/Transactions';
import { Import } from './components/Import';
import { Auth } from './components/Auth';
import { ProfileSetupModal } from './components/ProfileSetupModal';
import { Profile } from './components/Profile';
import { Loader2 } from 'lucide-react';

const AppContent = () => {
  const { user, loading: authLoading } = useAuth();
  const { loading: financeLoading, wallets } = useFinance();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [txInitialFilter, setTxInitialFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [showSetup, setShowSetup] = useState(false);

  // Check setup status
  React.useEffect(() => {
    if (user && !user.user_metadata?.setup_completed) {
      setShowSetup(true);
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-4">
        <div className="relative">
           <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-pulse" />
           <Loader2 className="absolute inset-0 m-auto text-primary animate-spin" size={32} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Sincronizando...</span>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} setTxFilter={setTxInitialFilter} setTxTypeFilter={setTxTypeFilter} />;
      case 'wallets':
        return <Wallets />;
      case 'categories':
        return <Categories />;
      case 'transactions':
        return <Transactions 
          initialFilter={txInitialFilter} 
          setInitialFilter={setTxInitialFilter}
          initialTypeFilter={txTypeFilter}
          setInitialTypeFilter={setTxTypeFilter}
        />;
      case 'import':
        return <Import setActiveTab={setActiveTab} />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenProfile={() => setShowSetup(true)}
      />
      <main className="flex-1 h-full overflow-y-auto p-4 lg:p-8 relative">
        <div className="max-w-[1600px] mx-auto w-full">
          {(financeLoading && wallets.length === 0) && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
               <Loader2 className="text-primary animate-spin" size={32} />
            </div>
          )}
          {renderContent()}
        </div>
      </main>
      <ProfileSetupModal isOpen={showSetup} onComplete={() => setShowSetup(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <FinanceProvider>
          <AppContent />
        </FinanceProvider>
      </ModalProvider>
    </AuthProvider>
  );
}

