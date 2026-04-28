import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, Profile } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { 
  Users, 
  UserPlus, 
  Search, 
  Loader2, 
  Archive, 
  UserMinus, 
  UserCheck,
  MoreVertical,
  Mail,
  Calendar,
  ChevronRight,
  Shield,
  Trash2,
  X,
  LayoutDashboard,
  User,
  Building2,
  ArrowRight,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { useModal } from '../../../contexts/ModalContext';
import { useFinance } from '../../../FinanceContext';

interface ClientProfile extends Profile {
  link_status: 'active' | 'inactive' | 'archived';
  linked_at: string;
}

interface ClientsTabProps {
  onAddClient?: () => void;
  refreshTrigger?: number;
}

export const ClientsTab: React.FC<ClientsTabProps> = ({ onAddClient, refreshTrigger = 0 }) => {
  const { profile, impersonateUser } = useAuth();
  const { setActiveSpace } = useFinance();
  const { showAlert } = useModal();
  
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatusTab, setActiveStatusTab] = useState<'active' | 'inactive' | 'archived'>('active');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [spaceSelectionClient, setSpaceSelectionClient] = useState<ClientProfile | null>(null);

  const CLIENT_LIMIT = 10;

  const fetchClients = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('educator_clients')
        .select(`
          status,
          created_at,
          profiles:client_id (*)
        `)
        .eq('educator_id', profile.id);

      if (error) throw error;

      const formattedClients: ClientProfile[] = (data || []).map(item => ({
        ...(item.profiles as any),
        link_status: item.status,
        linked_at: item.created_at
      }));

      setClients(formattedClients);
    } catch (err: any) {
      console.error('Erro ao buscar clientes:', err);
      showAlert('Erro', 'Não foi possível carregar seus clientes.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [profile, refreshTrigger]);

  useEffect(() => {
    const handleClose = () => setActiveMenuId(null);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, []);

  const handleUpdateStatus = async (clientId: string, newStatus: 'active' | 'inactive' | 'archived') => {
    setUpdatingId(clientId);
    try {
      const { error } = await supabase
        .from('educator_clients')
        .update({ status: newStatus })
        .eq('educator_id', profile?.id)
        .eq('client_id', clientId);

      if (error) throw error;

      setClients(prev => prev.map(c => 
        c.id === clientId ? { ...c, link_status: newStatus } : c
      ));
      
      showAlert('Sucesso', 'Status do cliente atualizado.', 'success');
    } catch (err: any) {
      showAlert('Erro', 'Não foi possível atualizar o status.', 'danger');
    } finally {
      setUpdatingId(null);
      setActiveMenuId(null);
    }
  };

  const handleManageWallet = (client: ClientProfile, targetTab?: string) => {
    const spaces = (client.user_metadata?.initialized_spaces || []) as ('personal' | 'business')[];
    
    if (targetTab) {
      localStorage.setItem('active_tab_redirect', targetTab);
    }

    if (spaces.length > 1) {
      setSpaceSelectionClient(client);
    } else if (spaces.length === 1) {
      setActiveSpace(spaces[0]);
      impersonateUser(client.id);
      showAlert('Modo Gestão', `Acessando Espaço ${spaces[0] === 'personal' ? 'Pessoal' : 'Empresarial'} de ${client.full_name}`, 'success');
    } else {
      // Fallback: Default to personal if somehow no spaces are initialized in metadata
      setActiveSpace('personal');
      impersonateUser(client.id);
      showAlert('Modo Gestão', `Acessando finanças de ${client.full_name}`, 'success');
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesStatus = c.link_status === activeStatusTab;
      const matchesSearch = c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           c.email?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [clients, activeStatusTab, searchQuery]);

  const activeCount = clients.filter(c => c.link_status === 'active').length;
  const progressPercent = Math.min((clients.length / CLIENT_LIMIT) * 100, 100);

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '?';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-6 flex-1">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="text-primary" size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Meus Clientes</span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
              Gestão de Clientes
            </h1>
          </div>

          {/* Progress Bar Container */}
          <div className="max-w-md space-y-3">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ocupação da Carteira</p>
                <p className="text-xl font-black text-foreground">{clients.length} <span className="text-muted-foreground/40 text-sm font-bold uppercase">de</span> {CLIENT_LIMIT} <span className="text-muted-foreground/40 text-sm font-bold uppercase tracking-tighter">clientes</span></p>
              </div>
              <div className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                clients.length >= CLIENT_LIMIT ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              )}>
                {Math.round(progressPercent)}%
              </div>
            </div>
            <div className="h-4 bg-muted/50 rounded-full border border-border overflow-hidden p-1 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className={cn(
                  "h-full rounded-full shadow-lg transition-colors",
                  progressPercent < 50 ? "bg-emerald-500 shadow-emerald-500/20" : 
                  progressPercent < 80 ? "bg-primary shadow-primary/20" : 
                  "bg-rose-500 shadow-rose-500/20"
                )}
              />
            </div>
          </div>
        </div>

        <button 
          onClick={onAddClient}
          className="bg-primary hover:scale-[1.02] active:scale-95 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all group shadow-xl shadow-primary/20"
        >
          <UserPlus size={20} className="group-hover:rotate-12 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Adicionar Cliente</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-card backdrop-blur-xl border border-border rounded-[2.5rem] p-6 flex flex-col xl:flex-row gap-6 shadow-xl shadow-slate-200/10 dark:shadow-none">
        <div className="flex gap-2 overflow-x-auto no-scrollbar items-center">
          {[
            { id: 'active', label: 'Ativos', icon: UserCheck, color: 'emerald' },
            { id: 'inactive', label: 'Inativos', icon: UserMinus, color: 'amber' },
            { id: 'archived', label: 'Arquivados', icon: Archive, color: 'slate' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveStatusTab(tab.id as any)}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2",
                activeStatusTab === tab.id 
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                  : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
              <span className={cn(
                "ml-2 px-1.5 py-0.5 rounded-lg text-[9px] font-bold",
                activeStatusTab === tab.id ? "bg-white/20" : "bg-muted-foreground/10"
              )}>
                {clients.filter(c => c.link_status === tab.id).length}
              </span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/30 border border-border rounded-2xl h-14 pl-14 pr-6 text-sm text-foreground outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Clients Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="text-primary animate-spin" size={32} />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Carregando carteira...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-[3rem] bg-muted/20">
          <div className="w-20 h-20 rounded-[2rem] bg-muted flex items-center justify-center mb-6">
            <Search className="text-muted-foreground/40" size={32} />
          </div>
          <h3 className="text-xl font-black text-foreground uppercase tracking-tighter">Nenhum cliente encontrado</h3>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-2">Tente ajustar seus filtros ou busca</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredClients.map((client) => (
              <motion.div 
                key={client.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative bg-card border border-border rounded-[2.5rem] p-8 hover:border-primary/40 transition-all shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden"
              >
                {/* Status Indicator */}
                <div className={cn(
                  "absolute top-0 left-0 w-1.5 h-full",
                  client.link_status === 'active' ? "bg-emerald-500" : 
                  client.link_status === 'inactive' ? "bg-amber-500" : "bg-slate-400"
                )} />

                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center relative shadow-inner group-hover:border-primary/30 transition-all">
                      <span className="text-xl font-black text-muted-foreground/60">{getInitials(client.full_name || '')}</span>
                      <div className={cn(
                        "absolute -bottom-2 -right-2 w-8 h-8 rounded-xl border border-white/20 flex items-center justify-center shadow-xl transition-all bg-card",
                        client.link_status === 'active' ? "text-emerald-500" : 
                        client.link_status === 'inactive' ? "text-amber-500" : "text-slate-400"
                      )}>
                        {client.link_status === 'active' ? <UserCheck size={14} /> : 
                         client.link_status === 'inactive' ? <UserMinus size={14} /> : <Archive size={14} />}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-foreground tracking-tight leading-none group-hover:text-primary transition-colors truncate max-w-[150px]">
                        {client.full_name}
                      </h3>
                      <div className="flex flex-col gap-1.5 mt-2">
                        <div className="flex items-center gap-2">
                          <Mail size={10} className="text-muted-foreground" />
                          <span className="text-[10px] font-bold text-muted-foreground truncate max-w-[140px] uppercase tracking-tighter">
                            {client.email}
                          </span>
                        </div>
                        
                        {/* Space Tags */}
                        <div className="flex flex-wrap gap-1">
                          {((client.user_metadata?.initialized_spaces || []) as string[]).map(space => {
                            const isFemale = client.user_metadata?.gender === 'female';
                            const personalColorClass = isFemale 
                              ? "bg-pink-500/10 border-pink-500/20 text-pink-500" 
                              : "bg-blue-500/10 border-blue-500/20 text-blue-500";
                            
                            return (
                              <div 
                                key={space}
                                className={cn(
                                  "px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border flex items-center gap-1",
                                  space === 'personal' 
                                    ? personalColorClass 
                                    : "bg-slate-900 border-slate-800 text-white dark:bg-white dark:text-slate-900"
                                )}
                              >
                                <div className={cn(
                                  "w-1 h-1 rounded-full", 
                                  space === 'personal' 
                                    ? (isFemale ? "bg-pink-500" : "bg-blue-500") 
                                    : "bg-slate-400"
                                )} />
                                {space === 'personal' ? 'Pessoal' : 'Empresarial'}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === client.id ? null : client.id);
                      }}
                      className={cn(
                        "w-10 h-10 flex items-center justify-center rounded-xl bg-muted border border-border text-muted-foreground hover:text-primary transition-all shadow-sm",
                        activeMenuId === client.id && "bg-primary text-white border-primary"
                      )}
                    >
                      <MoreVertical size={18} />
                    </button>

                    <AnimatePresence>
                      {activeMenuId === client.id && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute right-0 top-12 w-56 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="p-2 space-y-1">
                            {client.link_status !== 'active' && (
                              <button 
                                onClick={() => handleUpdateStatus(client.id, 'active')}
                                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"
                              >
                                <UserCheck size={16} /> Ativar Cliente
                              </button>
                            )}
                            {client.link_status !== 'inactive' && (
                              <button 
                                onClick={() => handleUpdateStatus(client.id, 'inactive')}
                                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all"
                              >
                                <UserMinus size={16} /> Desativar Cliente
                              </button>
                            )}
                            {client.link_status !== 'archived' && (
                              <button 
                                onClick={() => handleUpdateStatus(client.id, 'archived')}
                                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-500/10 rounded-xl transition-all"
                              >
                                <Archive size={16} /> Arquivar Cliente
                              </button>
                            )}
                            <div className="h-px bg-border my-1 mx-2" />
                            <button 
                              onClick={() => handleManageWallet(client, 'profile')}
                              className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 rounded-xl transition-all"
                            >
                              <Briefcase size={16} /> Serviços Contratados
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-border shadow-inner">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Cliente desde</p>
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-muted-foreground" />
                        <p className="text-xs font-black text-foreground uppercase tracking-tight">
                          {new Date(client.linked_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      "text-[8px] font-black uppercase px-2 py-1 rounded-md border",
                      client.link_status === 'active' ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-500" : 
                      client.link_status === 'inactive' ? "bg-amber-500/20 border-amber-500/30 text-amber-500" : 
                      "bg-slate-500/20 border-slate-500/30 text-slate-500"
                    )}>
                      {client.link_status === 'active' ? 'Ativo' : client.link_status === 'inactive' ? 'Inativo' : 'Arquivado'}
                    </div>
                  </div>

                  <button 
                    onClick={() => handleManageWallet(client)}
                    className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 shadow-lg"
                  >
                    Gerenciar Carteira
                    <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      {/* Space Selection Modal */}
      <AnimatePresence>
        {spaceSelectionClient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              onClick={() => setSpaceSelectionClient(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-[3rem] p-8 shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
              
              <div className="relative space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="text-primary" size={20} />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Seleção de Espaço</span>
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">
                      Onde vamos atuar hoje?
                    </h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                      O cliente <span className="text-foreground">{spaceSelectionClient.full_name}</span> possui dois espaços ativos.
                    </p>
                  </div>
                  <button 
                    onClick={() => setSpaceSelectionClient(null)}
                    className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-rose-500 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'personal', label: 'Pessoal', icon: User, color: 'primary', desc: 'Contas individuais' },
                    { id: 'business', label: 'Empresarial', icon: Building2, color: 'blue-500', desc: 'Contas de negócio' }
                  ].map((space) => (
                    <button
                      key={space.id}
                      onClick={() => {
                        setActiveSpace(space.id as any);
                        impersonateUser(spaceSelectionClient.id);
                        setSpaceSelectionClient(null);
                        showAlert('Modo Gestão', `Acessando Espaço ${space.label} de ${spaceSelectionClient.full_name}`, 'success');
                      }}
                      className={cn(
                        "group relative p-6 rounded-[2rem] border transition-all duration-300 text-left overflow-hidden",
                        space.id === 'personal' 
                          ? (spaceSelectionClient.user_metadata?.gender === 'female'
                              ? "bg-pink-500/5 border-pink-500/20 hover:border-pink-500/50 hover:bg-pink-500/10"
                              : "bg-blue-500/5 border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/10")
                          : "bg-slate-900/5 border-slate-900/20 hover:border-slate-900/50 hover:bg-slate-900/10 dark:bg-white/5 dark:border-white/20 dark:hover:border-white/50 dark:hover:bg-white/10"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110 shadow-lg",
                        space.id === 'personal' 
                          ? (spaceSelectionClient.user_metadata?.gender === 'female' ? "bg-pink-500/10 text-pink-500" : "bg-blue-500/10 text-blue-500")
                          : "bg-slate-900/10 text-slate-900 dark:bg-white/10 dark:text-white"
                      )}>
                        <space.icon size={24} />
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-tighter text-foreground mb-1">{space.label}</h4>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{space.desc}</p>
                      
                      <div className={cn(
                        "mt-4 flex items-center gap-2 text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0",
                        space.id === 'personal' 
                          ? (spaceSelectionClient.user_metadata?.gender === 'female' ? "text-pink-500" : "text-blue-500")
                          : "text-slate-900 dark:text-white"
                      )}>
                        Selecionar
                        <ArrowRight size={10} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
