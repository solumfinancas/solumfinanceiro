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
import { Loader2, AlertCircle, X, ArrowRight, Clock } from 'lucide-react';
import { Tasks } from './components/Tasks';
import { Anamnesis } from './components/Anamnesis';
import { Debts } from './components/Debts';
import { Equity } from './components/Equity';
import { SuspensionBlock } from './components/SuspensionBlock';
import { OverdueAlertModal } from './components/OverdueAlertModal';
import { OverduePersistentReminder } from './components/OverduePersistentReminder';
import { TaskPersistentReminder } from './components/TaskPersistentReminder';


const AppContent = () => {
  const { user, profile, viewingUserId, viewingProfile, impersonateUser, loading: authLoading } = useAuth();
  const { loading: financeLoading, wallets, activeSpace, initializedSpaces, setActiveSpace } = useFinance();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [managementTab, setManagementTab] = useState(() => {
    return localStorage.getItem('solum_management_tab') || 'management';
  });
  const [txInitialFilter, setTxInitialFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [showSetup, setShowSetup] = useState(false);
  const [viewingManagement, setViewingManagement] = useState(false);
  const [activeSessionView, setActiveSessionView] = useState<'finance' | 'management' | null>(() => {
    return sessionStorage.getItem('solum_session_view') as 'finance' | 'management' | null;
  });

  // Reset scroll to top on tab change
  React.useEffect(() => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTo(0, 0);
    }
  }, [activeTab, managementTab, viewingManagement]);


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

    // Check for tab redirection (e.g. from Educator Task Portal)
    const redirectTab = localStorage.getItem('active_tab_redirect');
    if (redirectTab && viewingUserId) {
      setActiveTab(redirectTab);
      localStorage.removeItem('active_tab_redirect');
    }

    if (profile && profile.role !== 'user' && !viewingUserId) {
      if (activeSessionView === 'management') {
        setViewingManagement(true);
        
        // Use saved tab if available, otherwise use default based on role
        const savedManagementTab = localStorage.getItem('solum_management_tab');
        if (savedManagementTab) {
          setManagementTab(savedManagementTab);
        } else {
          if (profile.role === 'educator') {
            setManagementTab('finance');
            localStorage.setItem('solum_management_tab', 'finance');
          } else {
            setManagementTab('management');
            localStorage.setItem('solum_management_tab', 'management');
          }
        }
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
        localStorage.removeItem('solum_management_tab');
        setActiveSessionView(null);
        setViewingManagement(false);
        localStorage.setItem('solum_last_user', user.id);
      }
    } else {
      localStorage.removeItem('solum_last_user');
    }
  }, [user?.id]);


  // Verificação de suspensão global
  if (user && profile?.user_metadata?.is_suspended) {
    return <SuspensionBlock reason={profile.user_metadata.suspension_reason} />;
  }


  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="text-primary animate-spin mx-auto" size={40} />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Carregando Solum...</p>
        </div>
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
      case 'tasks':
        return <Tasks />;
      case 'profile':
        return <ProfilePage />;
      case 'anamnese':
        return <Anamnesis />;
      case 'dividas':
        return <Debts />;
      case 'patrimonio':
        return <Equity />;
      case 'management':
        return <ManagementPortal />;
      default:
        return <Dashboard />;
    }
  };

  // Define se precisamos mostrar o seletor antes de qualquer coisa
  const isSelectionNeeded = !!user && 
    !viewingManagement && 
    !viewingUserId && 
    !showSetup && (
      !activeSessionView || initializedSpaces.length === 0
    );

  if (isSelectionNeeded) {
    return (
      <SpaceSelectorOverlay 
        isOpen={true} 
        onSelect={(space) => {
          setActiveSpace(space);
          setActiveSessionView('finance');
          sessionStorage.setItem('solum_session_view', 'finance');
        }} 
        onSelectManagement={() => {
          setViewingManagement(true);
          setActiveSessionView('management');
          sessionStorage.setItem('solum_session_view', 'management');
        }}
      />
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      <Sidebar 
        activeTab={viewingManagement ? managementTab : activeTab} 
        isManagementOnly={viewingManagement && !viewingUserId}
        onExitManagement={() => {
          setActiveSessionView(null);
          sessionStorage.removeItem('solum_session_view');
          setViewingManagement(false);
        }}
        setActiveTab={(tab) => {
          const managementSubTabs = ['management', 'finance', 'clients', 'tasks', 'simulators', 'referrals', 'settings'];
          
          // Só entra/mantém no modo gestão se clicou no botão do portal OU se já estava no modo gestão e clicou em uma sub-aba
          const isEnteringManagement = tab === 'management';
          const isNavigatingInManagement = viewingManagement && managementSubTabs.includes(tab);

          if (isEnteringManagement || isNavigatingInManagement) {
            impersonateUser(null);
            setViewingManagement(true);
            
            let targetTab = tab;
            // Se estiver entrando no portal agora (vindo das finanças) via o botão principal
            if (!viewingManagement && isEnteringManagement) {
              if (profile?.role === 'educator') {
                targetTab = 'finance';
              } else {
                const saved = localStorage.getItem('solum_management_tab');
                if (saved) targetTab = saved;
              }
            }

            setManagementTab(targetTab);
            localStorage.setItem('solum_management_tab', targetTab);
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
        {/* Overdue Alert Modal */}
        <OverdueAlertModal />

        {/* Lembretes e Avisos Globais */}
        <div className="max-w-[1600px] mx-auto space-y-4 mb-6">
          <OverduePersistentReminder />
          {!viewingManagement && (
            <TaskPersistentReminder 
              onViewTasks={() => setActiveTab('tasks')} 
              isTasksTab={activeTab === 'tasks'}
            />
          )}
        </div>

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
                   className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/30"
                 >
                   Parar de Gerenciar
                   <ArrowRight size={18} />
                 </button>
               </div>
            </div>
          </div>
        )}

        {/* Trial Notification Bar */}
        {profile?.role === 'educator' && profile?.plan === 'trial' && !viewingUserId && (
          <div className="max-w-[1600px] mx-auto mb-6">
            <div className="relative group overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent backdrop-blur-xl border border-amber-500/20 rounded-[2rem]" />
               <div className="relative p-5 flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="flex items-center gap-5">
                   <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/10">
                     <Clock size={24} className="animate-pulse" />
                   </div>
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20">
                         Período de Teste Grátis
                       </span>
                     </div>
                     <h3 className="text-lg font-black tracking-tighter text-foreground uppercase">
                       Restam <span className="text-amber-500">{(() => {
                         if (!profile.plan_expires_at) return 0;
                         const expiry = new Date(profile.plan_expires_at);
                         const now = new Date();
                         const diff = expiry.getTime() - now.getTime();
                         return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
                       })()} dias</span> de teste
                     </h3>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                       Aproveite todos os recursos antes que seu período expire.
                     </p>
                   </div>
                 </div>

                 <button 
                   onClick={() => {
                     setViewingManagement(true);
                     setManagementTab('settings');
                     setActiveSessionView('management');
                     localStorage.setItem('solum_management_tab', 'settings');
                   }}
                   className="flex items-center gap-3 px-8 py-4 bg-amber-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-amber-500/30"
                 >
                   Assinar Plano Agora
                   <ArrowRight size={18} />
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
            viewingManagement ? <ManagementPortal activeTab={managementTab} onTabChange={setManagementTab} /> : renderContent()
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
