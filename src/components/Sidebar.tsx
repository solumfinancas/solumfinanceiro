import React from 'react';
import { useFinance } from '../FinanceContext';
import { useAuth } from '../contexts/AuthContext';
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
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { SpaceActivationModal } from './SpaceActivationModal';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { theme, toggleTheme, activeSpace, setActiveSpace } = useFinance();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const [activationModal, setActivationModal] = React.useState<{ isOpen: boolean; space: 'personal' | 'business' }>({
    isOpen: false,
    space: 'business'
  });

  const handleSpaceSwitch = (space: 'personal' | 'business') => {
    if (space === activeSpace) return;

    const initializedSpaces = user?.user_metadata?.initialized_spaces || [];
    // Espaço é considerado inicializado se estiver na lista explícita de initialized_spaces em seu metadata
    const isInitialized = initializedSpaces.includes(space);

    if (!isInitialized) {
      setActivationModal({ isOpen: true, space });
      return;
    }

    setActiveSpace(space);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'wallets', label: 'Carteiras e Cartões', icon: WalletIcon },
    { id: 'categories', label: 'Categorias', icon: Tags },
    { id: 'transactions', label: 'Lançamentos', icon: ArrowLeftRight },
    { id: 'import', label: 'Importação', icon: FileUp },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-card border-b sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img 
            src="/images/logo.png" 
            alt="Solum Logo" 
            className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" 
          />
          <span className="font-bold text-lg tracking-tight">SOLUM</span>
        </div>
        <button onClick={toggleSidebar} className="p-2 hover:bg-accent rounded-md">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
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
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <motion.aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="relative">
            <img 
              src="/images/logo.png" 
              alt="Solum Logo" 
              className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]" 
            />
          </div>
          <div>
            <div className="font-bold text-xl tracking-tighter leading-none">SOLUM</div>
            <div className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">Financeiro</div>
          </div>
        </div>

        <div className="px-4 mb-6">
          <div className="bg-muted rounded-lg p-1 flex gap-1">
            <button 
              onClick={() => handleSpaceSwitch('personal')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all",
                activeSpace === 'personal' ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <User size={16} />
              Pessoal
            </button>
            <button 
              onClick={() => handleSpaceSwitch('business')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all",
                activeSpace === 'business' ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Building2 size={16} />
              Empresarial
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                activeTab === item.id 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon size={20} className={cn(
                "transition-colors",
                activeTab === item.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {item.label}
              {activeTab === item.id && (
                <motion.div 
                  layoutId="active-pill"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                />
              )}
            </button>
          ))}
        </nav>

        {/* Profile Summary Section */}
        <div className="px-4 py-4 border-t mt-auto">
          <button 
            onClick={() => setActiveTab('profile')}
            className={cn(
               "w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left",
               activeTab === 'profile' 
                 ? "bg-primary/10 border-primary/30" 
                 : "bg-muted/30 border-border/50 hover:bg-muted/50"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 transition-colors",
              user?.user_metadata?.gender === 'female' 
                ? "bg-pink-500/10 border-pink-500/20 text-pink-500" 
                : "bg-blue-500/10 border-blue-500/20 text-blue-500"
            )}>
              <User size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn(
                "text-[11px] font-black uppercase truncate",
                activeTab === 'profile' ? "text-primary" : "text-foreground"
              )}>
                {(() => {
                  const spaceNameKey = activeSpace === 'personal' ? 'personal_name' : 'business_name';
                  const name = user?.user_metadata?.[spaceNameKey] || user?.user_metadata?.full_name || 'Visitante';
                  return name.split(' ')[0];
                })()}
              </p>
              <p className="text-[9px] font-bold text-muted-foreground truncate">{user?.user_metadata?.phone || '(00) 00000-0000'}</p>
            </div>
            {activeTab === 'profile' && (
              <motion.div 
                layoutId="active-pill-profile"
                className="w-1.5 h-1.5 rounded-full bg-primary"
              />
            )}
          </button>
        </div>

        <div className="p-4 border-t space-y-2">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
          </button>
          <button 
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all font-black uppercase tracking-widest text-[10px]"
          >
            <LogOut size={20} />
            Sair
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
