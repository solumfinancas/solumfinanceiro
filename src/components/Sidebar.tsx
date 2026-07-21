import React from 'react';
import { useFinance } from '../FinanceContext';
import { useAuth, isEducatorProfileExpired } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Wallet as WalletIcon,
  Tags,
  ArrowLeftRight,
  FileUp,
  Moon,
  Sun,
  LogOut,
  Building2,
  User,
  Menu,
  X,
  Shield,
  Lock,
  ArrowLeft,
  GraduationCap,
  Users,
  CheckSquare,
  Calculator,
  Share2,
  Settings,
  Gift,
  ClipboardList,
  TrendingDown,
  Gem,
  CalendarClock,
  Presentation,
  Target,
  ChevronLeft
} from 'lucide-react';

import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { SpaceActivationModal } from './SpaceActivationModal';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isManagementOnly?: boolean;
  onExitManagement?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isManagementOnly = false,
  onExitManagement
}) => {
  const { theme, toggleTheme, activeSpace, setActiveSpace, initializedSpaces } = useFinance();
  const { user, profile, viewingProfile, signOut } = useAuth();
  const isEducatorExpired = profile?.role === 'educator' && isEducatorProfileExpired(profile);

  const [isOpen, setIsOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    const saved = localStorage.getItem('solum_sidebar_collapsed');
    return saved === 'true';
  });

  const handleToggleCollapse = () => {
    setIsCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem('solum_sidebar_collapsed', String(newValue));
      return newValue;
    });
  };

  const [activationModal, setActivationModal] = React.useState<{ isOpen: boolean; space: 'personal' | 'business' }>({
    isOpen: false,
    space: 'business'
  });

  const handleSpaceSwitch = (space: 'personal' | 'business') => {
    if (space === activeSpace) return;

    const currentMetadata = viewingProfile ? viewingProfile.user_metadata : user?.user_metadata;
    const initializedSpaces = currentMetadata?.initialized_spaces || [];
    const isInitialized = initializedSpaces.includes(space);

    if (!isInitialized) {
      setActivationModal({ isOpen: true, space });
      return;
    }

    setActiveSpace(space);
  };

  const getManagementMenuItems = () => {
    const items = [];
    const role = profile?.role || 'user';

    // Portal de Gestão (Controle de Acessos) - Admins and Secretaries
    if (['master_admin', 'admin', 'secretary'].includes(role)) {
      items.push({ id: 'management', label: 'Controle de Acessos', icon: Shield });
    }

    // Educator-specific tabs - Admins and Educators
    if (['master_admin', 'admin', 'educator'].includes(role)) {
      items.push(
        { id: 'finance', label: 'Financeiro', icon: LayoutDashboard },
        { id: 'clients', label: 'Clientes', icon: Users },
        { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
        { id: 'meetings', label: 'Reuniões', icon: Presentation },
        { id: 'simulators', label: 'Simuladores', icon: Calculator },
        { id: 'referrals', label: 'Indicações', icon: Gift },
        { id: 'settings', label: 'Configurações', icon: Settings }
      );
    }

    return items;
  };

  const menuItems = isManagementOnly
    ? getManagementMenuItems()
    : [
      { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
      ...(activeSpace === 'business' ? [{ id: 'business-analysis', label: 'Análise Empresarial', icon: Building2 }] : []),
      { id: 'wallets', label: 'Carteiras e Cartões', icon: WalletIcon },
      { id: 'categories', label: 'Categorias', icon: Tags },
      { id: 'transactions', label: 'Lançamentos', icon: ArrowLeftRight },
      { id: 'anamnese', label: 'Anamnese', icon: ClipboardList },
      { id: 'dividas', label: 'Dívidas', icon: TrendingDown },
      { id: 'patrimonio', label: 'Patrimônio', icon: Gem },
      { id: 'não-recorrente', label: 'Gastos Eventuais', icon: CalendarClock },
      { id: 'objetivos', label: 'Objetivos', icon: Target },
      { id: 'meetings', label: 'Reuniões', icon: Presentation },
      { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
      { id: 'import', label: 'Importação', icon: FileUp },
      ...(profile && profile.role !== 'user' ? [{ id: 'management', label: 'Portal de Gestão', icon: Shield }] : []),
    ];


  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-3 bg-card border-b sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img
            src="/images/logo.png"
            alt="Solum Logo"
            className="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]"
          />
          <span className="font-bold text-base tracking-tight">SOLUM</span>
        </div>
        <button onClick={toggleSidebar} className="p-1.5 hover:bg-accent rounded-md">
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/50 z-[100] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <motion.aside
        className={cn(
          "fixed inset-y-0 left-0 z-[110] bg-card border-r flex flex-col transition-all duration-300 lg:translate-x-0 lg:relative lg:h-screen",
          isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64",
          isCollapsed ? "lg:w-20" : "lg:w-64"
        )}
      >
        {/* Botão de Minimizar (Apenas Desktop e quando expandido) */}
        {!isCollapsed && (
          <button
            onClick={handleToggleCollapse}
            className="hidden lg:flex absolute top-8 -right-3 w-6 h-6 rounded-full border bg-card text-foreground hover:bg-accent hover:text-primary items-center justify-center shadow-md z-[120] transition-transform hover:scale-110 active:scale-95 cursor-pointer"
            title="Minimizar Menu"
          >
            <ChevronLeft size={14} />
          </button>
        )}

        <div className={cn(
          "p-6 flex items-center transition-all duration-300",
          isCollapsed ? "justify-center px-2 py-6" : "gap-3"
        )}>
          {isCollapsed ? (
            <button
              onClick={handleToggleCollapse}
              className="relative flex-shrink-0 group/logo transition-transform hover:scale-110 active:scale-95 cursor-pointer"
              title="Expandir Menu"
            >
              <img
                src="/images/logo.png"
                alt="Solum Logo"
                className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(249,115,22,0.8)] transition-all group-hover/logo:drop-shadow-[0_0_20px_rgba(249,115,22,1)]"
              />
            </button>
          ) : (
            <>
              <div className="relative flex-shrink-0">
                <img
                  src="/images/logo.png"
                  alt="Solum Logo"
                  className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]"
                />
              </div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="min-w-0"
              >
                <div className="font-bold text-xl tracking-tighter leading-none">SOLUM</div>
                <div className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">Financeiro</div>
              </motion.div>
            </>
          )}
        </div>

        {!isManagementOnly && (
          <div className={cn("transition-all duration-300", isCollapsed ? "px-2 mb-6" : "px-4 mb-6")}>
            <div className={cn(
              "bg-muted rounded-lg p-1 flex transition-all duration-300",
              isCollapsed ? "flex-col gap-2 items-center" : "gap-1"
            )}>
              <button
                disabled={isEducatorExpired}
                onClick={() => handleSpaceSwitch('personal')}
                className={cn(
                  "flex items-center justify-center transition-all relative overflow-hidden group rounded-md",
                  isCollapsed ? "w-12 h-12" : "flex-1 py-2 gap-2 text-sm font-medium",
                  isEducatorExpired
                    ? "opacity-40 cursor-not-allowed text-muted-foreground"
                    : activeSpace === 'personal' ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                title={isCollapsed ? "Espaço Pessoal" : undefined}
              >
                <User size={isCollapsed ? 20 : 16} />
                {!isCollapsed && <span>Pessoal</span>}
                {!initializedSpaces.includes('personal') && (
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-amber-500 rounded-full m-1 border border-background" />
                )}
              </button>
              <button
                disabled={isEducatorExpired}
                onClick={() => handleSpaceSwitch('business')}
                className={cn(
                  "flex items-center justify-center transition-all relative overflow-hidden group rounded-md",
                  isCollapsed ? "w-12 h-12" : "flex-1 py-2 gap-2 text-sm font-medium",
                  isEducatorExpired
                    ? "opacity-40 cursor-not-allowed text-muted-foreground"
                    : activeSpace === 'business' ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                title={isCollapsed ? "Espaço Empresarial" : undefined}
              >
                <Building2 size={isCollapsed ? 20 : 16} />
                {!isCollapsed && <span>Empresarial</span>}
                {!initializedSpaces.includes('business') && (
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-amber-500 rounded-full m-1 border border-background" />
                )}
              </button>
            </div>
          </div>
        )}

        <nav className={cn("flex-1 space-y-1 overflow-y-auto transition-all duration-300", isCollapsed ? "px-2" : "px-4")}>
          {menuItems.map((item) => {
            const isDisabled = isEducatorExpired && item.id !== 'settings';
            
            return (
              <button
                key={item.id}
                disabled={isDisabled}
                onClick={() => {
                  if (isDisabled) return;
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "w-full flex items-center rounded-xl text-sm font-medium transition-all group duration-200 cursor-pointer",
                  isCollapsed ? "justify-center p-3 hover:scale-105" : "gap-3 px-4 py-3 hover:bg-accent/40 hover:translate-x-1",
                  isDisabled 
                    ? "opacity-40 cursor-not-allowed text-muted-foreground" 
                    : activeTab === item.id
                      ? "bg-primary/8 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {isDisabled ? (
                  <Lock size={20} className="text-muted-foreground/60" />
                ) : (
                  <item.icon size={20} className={cn(
                    "transition-colors duration-200",
                    activeTab === item.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                )}
                {!isCollapsed && (
                  <span className={cn("transition-colors duration-200", isDisabled && "line-through text-muted-foreground/60")}>
                    {item.label}
                  </span>
                )}
                {!isCollapsed && isDisabled && (
                  <Lock size={12} className="ml-auto text-muted-foreground/40" />
                )}
                {!isCollapsed && !isDisabled && activeTab === item.id && (
                  <motion.div
                    layoutId="active-pill"
                    className="ml-auto w-1 h-3.5 rounded-full bg-primary"
                  />
                )}
              </button>
            );
          })}

          {isManagementOnly && onExitManagement && (
            <button
              disabled={isEducatorExpired}
              onClick={onExitManagement}
              title={isCollapsed ? "Sair do Portal de Gestão" : undefined}
              className={cn(
                "w-full flex items-center rounded-xl text-sm font-medium transition-all group duration-200 cursor-pointer",
                isCollapsed ? "justify-center p-3 hover:scale-105" : "gap-3 px-4 py-3 hover:bg-accent/40 hover:translate-x-1",
                isEducatorExpired 
                  ? "opacity-40 cursor-not-allowed text-muted-foreground" 
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <ArrowLeft size={20} className="text-muted-foreground group-hover:text-foreground transition-colors" />
              {!isCollapsed && <span>Sair do Portal de Gestão</span>}
            </button>
          )}
        </nav>

        {/* Profile Summary Section */}
        {!isManagementOnly && (
          <div className={cn("py-4 border-t mt-auto transition-all duration-300", isCollapsed ? "px-2" : "px-4")}>
            <button
              onClick={() => setActiveTab('profile')}
              title={isCollapsed ? "Meu Perfil" : undefined}
              className={cn(
                "w-full flex items-center rounded-2xl border transition-all text-left",
                isCollapsed ? "justify-center p-2" : "gap-3 p-3",
                activeTab === 'profile'
                  ? "bg-primary/10 border-primary/30"
                  : "bg-muted/30 border-border/50 hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 transition-colors",
                (viewingProfile?.gender || user?.user_metadata?.gender) === 'female'
                  ? "bg-pink-500/10 border-pink-500/20 text-pink-500"
                  : "bg-blue-500/10 border-blue-500/20 text-blue-500"
              )}>
                <User size={20} />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "text-[11px] font-black uppercase truncate",
                    activeTab === 'profile' ? "text-primary" : "text-foreground"
                  )}>
                    {(() => {
                      if (viewingProfile) {
                        return viewingProfile.full_name?.split(' ')[0] || 'Usuário';
                      }
                      const spaceNameKey = activeSpace === 'personal' ? 'personal_name' : 'business_name';
                      const name = user?.user_metadata?.[spaceNameKey] || user?.user_metadata?.full_name || 'Visitante';
                      return name.split(' ')[0];
                    })()}
                  </p>
                  <p className="text-[9px] font-bold text-muted-foreground truncate">
                    {viewingProfile?.user_metadata?.personal_phone || viewingProfile?.user_metadata?.phone || viewingProfile?.phone || user?.user_metadata?.phone || '(00) 00000-0000'}
                  </p>
                </div>
              )}
              {!isCollapsed && activeTab === 'profile' && (
                <motion.div
                  layoutId="active-pill-profile"
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                />
              )}
            </button>
          </div>
        )}

        <div className={cn("border-t space-y-2 transition-all duration-300", isCollapsed ? "p-2" : "p-4")}>
          <button
            onClick={toggleTheme}
            title={isCollapsed ? (theme === 'light' ? 'Modo Escuro' : 'Modo Claro') : undefined}
            className={cn(
              "w-full flex items-center rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all",
              isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
            )}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            {!isCollapsed && (theme === 'light' ? 'Modo Escuro' : 'Modo Claro')}
          </button>
          <button
            onClick={signOut}
            title={isCollapsed ? 'Sair' : undefined}
            className={cn(
              "w-full flex items-center rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all font-black uppercase tracking-widest text-[10px]",
              isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
            )}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Sair</span>}
          </button>
        </div>
      </motion.aside>

      <SpaceActivationModal
        isOpen={activationModal.isOpen}
        spaceType={activationModal.space}
        onClose={() => setActivationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => setActiveSpace(activationModal.space)}
      />
    </>
  );
};
