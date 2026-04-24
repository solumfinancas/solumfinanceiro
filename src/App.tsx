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
import { SpaceSelectorOverlay } from './components/SpaceSelectorOverlay';
import { Loader2, AlertCircle, X } from 'lucide-react';


const AppContent = () => {
  const { user, profile, viewingUserId, viewingProfile, impersonateUser, loading: authLoading } = useAuth();
  const { loading: financeLoading, wallets, activeSpace, initializedSpaces, setActiveSpace } = useFinance();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [txInitialFilter, setTxInitialFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [showSetup, setShowSetup] = useState(false);
  const [viewingManagement, setViewingManagement] = useState(false);
  const [activeSessionView, setActiveSessionView] = useState<'finance' | 'management' | null>(() => {
    return sessionStorage.getItem('solum_session_view') as 'finance' | 'management' | null;
  });


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
      if (activeSessionView === 'management') {
        setViewingManagement(true);
      } else if (activeSessionView === 'finance') {
        setViewingManagement(false);
      } else {
        // First login/No session yet: wait for selector
        setViewingManagement(false);
      }
    } else {
      setViewingManagement(false);
    }

    if (!user) {
       sessionStorage.removeItem('solum_session_view');
       setActiveSessionView(null);
    }
  }, [user, profile, viewingUserId, activeSessionView]);


  // Limpar sessão ao trocar de usuário (login) para forçar o seletor e evitar flicker
  React.useEffect(() => {
    if (user?.id) {
      const lastUser = localStorage.getItem('solum_last_user');
      if (user.id !== lastUser) {
        sessionStorage.removeItem('solum_session_view');
        setActiveSessionView(null);
        setViewingManagement(false);
        localStorage.setItem('solum_last_user', user.id);
      }
    } else {
      localStorage.removeItem('solum_last_user');
    }
  }, [user?.id]);



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

  // Define se precisamos mostrar o seletor antes de qualquer coisa
  const isSelectionNeeded = !!user && 
    !viewingManagement && 
    !viewingUserId && (
      !activeSessionView || initializedSpaces.length === 0
    );

  if (isSelectionNeeded) {
    return (
      <div className="min-h-screen bg-[#020617]">
        <SpaceSelectorOverlay 
          isOpen={true}
          onSelect={(space) => {
            setActiveSpace(space);
            sessionStorage.setItem('solum_session_view', 'finance');
            setActiveSessionView('finance');
          }}
          onSelectManagement={() => {
            setViewingManagement(true);
            sessionStorage.setItem('solum_session_view', 'management');
            setActiveSessionView('management');
          }}
        />
        <ProfileSetupModal isOpen={showSetup} onComplete={() => setShowSetup(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      <Sidebar 
        activeTab={viewingManagement ? 'management' : activeTab} 
        isManagementOnly={viewingManagement && !viewingUserId}
        onExitManagement={() => {
          setActiveSessionView(null);
          sessionStorage.removeItem('solum_session_view');
          setViewingManagement(false);
        }}
        setActiveTab={(tab) => {
          if (tab === 'management') {
            impersonateUser(null);
            setViewingManagement(true);
            setActiveSessionView('management');
            sessionStorage.setItem('solum_session_view', 'management');
          } else {
            setViewingManagement(false);
            setActiveTab(tab);
            setActiveSessionView('finance');
            sessionStorage.setItem('solum_session_view', 'finance');
          }
        }} 
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
                     setActiveSessionView('management');
                     sessionStorage.setItem('solum_session_view', 'management');
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
          
          {/* Só renderiza o conteúdo se o espaço estiver selecionado (ou se for gestão) */}
          {((viewingManagement || viewingUserId || activeSessionView) && initializedSpaces.length > 0) || (profile && profile.role !== 'user' && activeSessionView === 'management') ? (
            viewingManagement ? <ManagementPortal /> : renderContent()
          ) : (
            <div className="flex items-center justify-center h-[60vh]">
               <div className="text-center space-y-4">
                  <div className="w-12 h-12 border-2 border-primary/20 rounded-full animate-spin border-t-primary mx-auto" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Aguardando Seleção de Espaço...</p>
               </div>
            </div>
          )}
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
