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
import { Profile as ProfilePage } from './components/Profile';
import { ManagementPortal } from './components/management/ManagementPortal';
import { Loader2, AlertCircle, X } from 'lucide-react';


const AppContent = () => {
  const { user, profile, viewingUserId, viewingProfile, impersonateUser, loading: authLoading } = useAuth();
  const { loading: financeLoading, wallets, activeSpace } = useFinance();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [txInitialFilter, setTxInitialFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [showSetup, setShowSetup] = useState(false);
  const [viewingManagement, setViewingManagement] = useState(false);


  // Check setup status and set initial view
  React.useEffect(() => {
    if (!user) {
      setViewingManagement(false);
      setActiveTab('dashboard');
      return;
    }

    if (!user.user_metadata?.setup_completed) {
      setShowSetup(true);
    }

    if (profile && profile.role !== 'user' && !viewingUserId) {
      setViewingManagement(true);
    } else {
      setViewingManagement(false);
    }
  }, [user, profile, viewingUserId]);



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
        return <ProfilePage />;
      case 'management':
        return <ManagementPortal />;
      default:
        return <Dashboard />;
    }
  };

  return (

    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      <Sidebar 
        activeTab={viewingManagement ? 'management' : activeTab} 
        setActiveTab={(tab) => {
          if (tab === 'management') {
            impersonateUser(null);
            setViewingManagement(true);
          } else {
            setViewingManagement(false);
            setActiveTab(tab);
          }
        }} 
        onOpenProfile={() => setShowSetup(true)}
      />

      <main className="flex-1 h-full overflow-y-auto p-4 lg:p-8 relative">
        {/* Impersonation Banner */}
        {viewingUserId && viewingProfile?.id && (
          <div className="max-w-[1600px] mx-auto mb-6">
            <div className="relative group overflow-hidden">
               {/* Background highlight */}
               <div className="absolute inset-0 bg-primary/5 backdrop-blur-xl border border-primary/20 rounded-[2rem] transition-all group-hover:border-primary/40 group-hover:bg-primary/10" />
               
               <div className="relative p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="flex items-center gap-5">
                   <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-lg shadow-primary/20 animate-pulse">
                     <AlertCircle size={28} />
                   </div>
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       <span className="px-3 py-1 rounded-full bg-primary text-white text-[8px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                         Modo Gestão Ativo
                       </span>
                       <span className="text-[10px] font-black uppercase tracking-widest text-[#0ea5e9]">
                         Visualização Blindada
                       </span>
                     </div>
                     <h3 className="text-xl font-black tracking-tighter text-foreground uppercase">
                       Gerenciando <span className="text-primary">{viewingProfile.full_name}</span>
                     </h3>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                       Acesso restrito ao Espaço <span className="text-white bg-slate-800 px-2 py-0.5 rounded-md border border-white/5">{activeSpace === 'personal' ? 'Pessoal' : 'Empresarial'}</span> • Alterações em tempo real
                     </p>
                   </div>
                 </div>

                 <button 
                   onClick={() => {
                     impersonateUser(null);
                     setViewingManagement(true);
                   }}
                   className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl transition-all hover:scale-[1.03] active:scale-95 shadow-xl shadow-primary/20 group/exit"
                 >
                   <span className="text-[10px] font-black uppercase tracking-[0.2em]">Encerrar Visualização</span>
                   <X size={18} className="transition-transform group-hover/exit:rotate-90" />
                 </button>
               </div>
            </div>
          </div>
        )}


        <div className="max-w-[1600px] mx-auto w-full">

          {(financeLoading && wallets.length === 0) && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
               <Loader2 className="text-primary animate-spin" size={32} />
            </div>
          )}
          {viewingManagement ? <ManagementPortal /> : renderContent()}
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

