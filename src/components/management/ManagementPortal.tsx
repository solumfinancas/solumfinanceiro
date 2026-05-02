import React, { useState, useEffect } from 'react';
import { useAuth, Profile, UserRole } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  UserPlus, 
  Shield, 
  BookOpen, 
  GraduationCap, 
  Trash2, 
  Search,
  Plus,
  Loader2,
  ChevronRight,
  LayoutDashboard,
  Check,
  MoreVertical,
  X,
  User,
  Building2,
  Eye,
  EyeOff,
  UserCheck,
  UserX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useModal } from '../../contexts/ModalContext';
import { useFinance } from '../../FinanceContext';
import { SpaceActivationModal } from '../SpaceActivationModal';
import { FinanceTab } from './tabs/FinanceTab';
import { ClientsTab } from './tabs/ClientsTab';
import { TasksTab } from './tabs/TasksTab';
import { SimulatorsTab, ReferralsTab } from './tabs/EmptyTabs';
import { SettingsTab } from './tabs/SettingsTab';

interface ManagementPortalProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

// Helper Functions
const roleRank = (role: UserRole) => {
  switch (role) {
    case 'master_admin': return 4;
    case 'admin': return 3;
    case 'secretary': return 2;
    case 'educator': return 1;
    default: return 0;
  }
};

const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case 'master_admin': return <Shield className="text-amber-400" size={16} />;
    case 'admin': return <Shield className="text-blue-400" size={16} />;
    case 'secretary': return <BookOpen className="text-purple-400" size={16} />;
    case 'educator': return <GraduationCap className="text-emerald-400" size={16} />;
    default: return <Users className="text-slate-400" size={16} />;
  }
};

const getRoleLabel = (role: UserRole) => {
  switch (role) {
    case 'master_admin': return 'Admin Master';
    case 'admin': return 'Administrador';
    case 'secretary': return 'Secretário';
    case 'educator': return 'Educador';
    default: return 'Usuário';
  }
};

const getInitials = (name: string) => {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '?';
};

export const ManagementPortal: React.FC<ManagementPortalProps> = ({ activeTab = 'management', onTabChange }) => {
  const { profile, impersonateUser } = useAuth();
  const { setActiveSpace } = useFinance();
  const { showAlert } = useModal();
  
  // Core Data State
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [impersonating, setImpersonating] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<UserRole | 'all'>('all');
  
  // Modals / Selection State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activatingSpaceType, setActivatingSpaceType] = useState<'personal' | 'business'>('personal');
  const [targetUserForSpace, setTargetUserForSpace] = useState<Profile | null>(null);
  
  const [userToManage, setUserToManage] = useState<{ profile: Profile; action: 'delete' | 'suspend' | 'activate' } | null>(null);
  const [userToEditRole, setUserToEditRole] = useState<Profile | null>(null);
  const [educatorToLink, setEducatorToLink] = useState<Profile | null>(null);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);
  const [relationships, setRelationships] = useState<{educator_id: string, client_id: string}[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  
  const [creatingUser, setCreatingUser] = useState(false);
  const [linkingUsers, setLinkingUsers] = useState(false);
  const [linkMode, setLinkMode] = useState<'educator_to_clients' | 'client_to_educator'>('educator_to_clients');
  
  // Form state for new user
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'user' as UserRole
  });
  const [selectedEducatorId, setSelectedEducatorId] = useState<string>('');
  const [createSource, setCreateSource] = useState<'management' | 'clients'>('management');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [showSuspendedInGroup, setShowSuspendedInGroup] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      let pQuery = supabase.from('profiles').select('*');
      
      if (profile?.role === 'educator') {
        const { data: rels } = await supabase
          .from('educator_clients')
          .select('client_id')
          .eq('educator_id', profile.id);
        
        const clientIds = rels?.map(r => r.client_id) || [];
        pQuery = pQuery.in('id', clientIds);
      }

      const { data: profilesData, error: pError } = await pQuery;
      if (pError) throw pError;
      setProfiles(profilesData || []);
      
      // Fetch all profiles for reference (names in tags)
      const { data: allP } = await supabase.from('profiles').select('*');
      setAllProfiles(allP || []);

      // Fetch all relationships
      const { data: relData } = await supabase.from('educator_clients').select('*');
      setRelationships(relData || []);
      
      // Fetch users for educator linking (now includes admins and educators)
      const { data: selectableData } = await supabase.from('profiles').select('*');
      setAvailableUsers(selectableData || []);
    } catch (err: any) {
      console.error('Erro ao buscar dados de gestão:', err);
      showAlert('Erro', 'Não foi possível carregar os perfis: ' + err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const fetchFullProfile = async (uid: string) => {
    try {
      const { data: metaData } = await supabase.functions.invoke('admin-create-user', {
        body: { action: 'get', userId: uid }
      });
      return metaData?.user;
    } catch (err) {
      console.error('Erro ao buscar metadados completos:', err);
      return null;
    }
  };

  useEffect(() => {
    if (profile) fetchData();
  }, [profile]);

  useEffect(() => {
    const handleClose = () => setActiveMenuId(null);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, []);

  // Inscrição para atualizações em tempo real
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('management_portal_sync')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles' 
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setProfiles(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p));
        } else {
          fetchData();
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'educator_clients'
      }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      showAlert('Atenção', 'Preencha todos os campos obrigatórios.', 'warning');
      return;
    }
    setCreatingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: newUser
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Vincular cliente ao educador selecionado ou ao criador se for pela aba clientes
      const educatorIdToLink = createSource === 'clients' ? profile?.id : selectedEducatorId;
      const createdUserId = data.data?.user?.id || data.user?.id;

      if (educatorIdToLink && createdUserId && newUser.role === 'user') {
        const { error: linkError } = await supabase
          .from('educator_clients')
          .insert({
            educator_id: educatorIdToLink,
            client_id: createdUserId,
            status: 'active'
          });
        
        if (linkError) console.error('Erro ao vincular cliente automaticamente:', linkError);
      }

      showAlert('Sucesso', 'Perfil criado com sucesso!', 'success');
      setShowCreateModal(false);
      setNewUser({ full_name: '', email: '', password: '', role: 'user' });
      setSelectedEducatorId('');
      setRefreshTrigger(prev => prev + 1);
      fetchData();
    } catch (err: any) {
      showAlert('Erro', 'Não foi possível criar o perfil: ' + err.message, 'danger');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleUpdateRole = async (targetUserId: string, newRole: UserRole) => {
    setCreatingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: { action: 'change_role', userId: targetUserId, role: newRole }
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      showAlert('Sucesso', 'Cargo atualizado com sucesso!', 'success');
      setUserToEditRole(null);
      fetchData();
    } catch (err: any) {
      showAlert('Erro', err.message, 'danger');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleLinkUsers = async (educatorId: string, clientIds: string[]) => {
    setLinkingUsers(true);
    try {
      const inserts = clientIds.map(cid => ({ educator_id: educatorId, client_id: cid }));
      const { error } = await supabase.from('educator_clients').upsert(inserts, { onConflict: 'client_id' });
      if (error) throw error;
      showAlert('Sucesso', 'Usuários vinculados com sucesso!', 'success');
      setEducatorToLink(null);
      setSelectedClients([]);
    } catch (err: any) {
      showAlert('Erro', 'Não foi possível vincular usuários: ' + err.message, 'danger');
    } finally {
      setLinkingUsers(false);
    }
  };

  const handleAction = async () => {
    if (!userToManage) return;
    const { profile: target, action } = userToManage;
    
    try {
      if (action === 'delete') {
        const { data, error } = await supabase.functions.invoke('admin-create-user', {
          body: { action: 'delete_full', userId: target.id }
        });
        if (error || data?.error) throw new Error(error?.message || data?.error);
        setProfiles(prev => prev.filter(p => p.id !== target.id));
        showAlert('Sucesso', 'Perfil e todos os dados financeiros excluídos permanentemente.', 'success');
      } else if (action === 'suspend') {
        const isSuspended = target.user_metadata?.is_suspended;
        
        if (!isSuspended && !suspensionReason.trim()) {
          showAlert('Atenção', 'Informe o motivo da suspensão.', 'warning');
          return;
        }

        const { data, error } = await supabase.functions.invoke('admin-create-user', {
          body: { 
            action: 'suspend', 
            userId: target.id, 
            suspend: !isSuspended,
            reason: !isSuspended ? suspensionReason : null
          }
        });
        if (error || data?.error) throw new Error(error?.message || data?.error);
        
        setProfiles(prev => prev.map(p => p.id === target.id ? { 
          ...p, 
          user_metadata: { 
            ...p.user_metadata, 
            is_suspended: !isSuspended,
            suspension_reason: !isSuspended ? suspensionReason : null
          } 
        } : p));
        
        showAlert('Sucesso', `Usuário ${!isSuspended ? 'suspenso' : 'reativado'} com sucesso.`, 'success');
        setSuspensionReason('');
      }
    } catch (err: any) {
      showAlert('Erro', err.message, 'danger');
    } finally {
      setUserToManage(null);
    }
  };

  const handleStartImpersonation = async (target: Profile) => {
    if (target.role === 'master_admin' && profile?.role !== 'master_admin') {
      showAlert('Acesso Negado', 'Administradores não podem gerenciar as finanças de um Administrador Master.', 'warning');
      return;
    }
    setLoading(true);
    let fullUser = await fetchFullProfile(target.id);
    
    // SONDAGEM: Se não conseguiu metadados (ex: Educador acessando cliente), verifica se há dados reais
    // Isso evita o erro de "Ativar Espaço" para quem já possui categorias/carteiras
    if (!fullUser || !fullUser.user_metadata || !fullUser.user_metadata.initialized_spaces) {
      try {
        const { data: cats } = await supabase.from('categories').select('space').eq('userId', target.id);
        const { data: wals } = await supabase.from('wallets').select('space').eq('userId', target.id);
        
        const initializedSpaces = Array.from(new Set([
          ...(cats?.map(c => c.space) || []),
          ...(wals?.map(w => w.space) || [])
        ]));

        fullUser = { 
          ...fullUser, 
          user_metadata: { 
            ...fullUser?.user_metadata || {}, 
            initialized_spaces: initializedSpaces
          } 
        };
      } catch (err) {
        console.warn('Erro na sondagem de espaços:', err);
      }
    }

    setLoading(false);
    if (fullUser) {
      setTargetUserForSpace({ ...target, user_metadata: fullUser.user_metadata });
    } else {
      setTargetUserForSpace(target);
    }
  };

  const confirmImpersonation = async (space: 'personal' | 'business') => {
    if (!targetUserForSpace) return;
    const initialized = targetUserForSpace.user_metadata?.initialized_spaces || [];
    if (!initialized.includes(space)) {
      setActivatingSpaceType(space);
      setShowActivationModal(true);
      return;
    }
    await impersonateUser(targetUserForSpace.id);
    setActiveSpace(space);
    setTargetUserForSpace(null);
    showAlert('Modo Gestão', `Visualizando espaço ${space === 'personal' ? 'Pessoal' : 'Empresarial'} de ${targetUserForSpace.full_name}`, 'success');
  };

  const profileMap = React.useMemo(() => {
    const map = new Map<string, Profile>();
    allProfiles.forEach(p => map.set(p.id, p));
    return map;
  }, [allProfiles]);

  const filteredProfiles = profiles
    .filter(p => {
      const matchesSearch = p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'all' || p.role === activeFilter;
      return matchesSearch && matchesFilter;
    });

  const roleGroups = [
    { title: 'Administradores', roles: ['master_admin', 'admin'] as UserRole[], icon: Shield },
    { title: 'Secretários', roles: ['secretary'] as UserRole[], icon: BookOpen },
    { title: 'Educadores Financeiros', roles: ['educator'] as UserRole[], icon: GraduationCap },
    { title: 'Usuários', roles: ['user'] as UserRole[], icon: Users },
  ].filter(group => {
    // 1. Permission based filtering
    const hasPermission = (() => {
      if (profile?.role === 'educator') return group.roles.includes('user');
      if (profile?.role === 'secretary') {
        return !group.roles.includes('admin') && 
               !group.roles.includes('master_admin') && 
               !group.roles.includes('secretary');
      }
      return true;
    })();

    if (!hasPermission) return false;

    // 2. Active Filter based filtering
    if (activeFilter === 'all') return true;
    return group.roles.includes(activeFilter as UserRole);
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'finance':
        return (
          <FinanceTab 
            onNavigateToClients={(search) => {
              setClientSearch(search);
              if (onTabChange) onTabChange('clients');
            }} 
          />
        );
      case 'clients':
        return (
          <ClientsTab 
            onAddClient={() => {
              setCreateSource('clients');
              setNewUser(prev => ({ ...prev, role: 'user' }));
              setShowCreateModal(true);
            }} 
            refreshTrigger={refreshTrigger} 
            initialSearch={clientSearch}
            onSearchClear={() => setClientSearch('')}
          />
        );
      case 'tasks':
        return <TasksTab />;
      case 'simulators':
        return <SimulatorsTab />;
      case 'referrals':
        return <ReferralsTab />;
      case 'settings':
        return <SettingsTab />;
      case 'management':
      default:
        return renderManagementContent();
    }
  };

  const renderManagementContent = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="text-primary" size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Portal de Gestão</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
            {profile?.role === 'educator' ? 'Meus Clientes' : 'Controle de Acessos'}
          </h1>
        </div>
        {['admin', 'master_admin', 'secretary'].includes(profile?.role || '') && (
          <button onClick={() => {
            setCreateSource('management');
            setShowCreateModal(true);
          }} className="bg-primary hover:scale-[1.02] active:scale-95 text-white px-6 py-3 rounded-2xl flex items-center gap-3 transition-all group shadow-lg shadow-primary/20">
            <UserPlus size={18} className="group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Criar Perfil</span>
          </button>
        )}
      </div>

      <div className="bg-card backdrop-blur-xl border border-border rounded-[2.5rem] p-6 flex flex-col xl:flex-row gap-6 shadow-xl shadow-slate-200/10 dark:shadow-none">
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
        {profile?.role !== 'educator' && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar items-center">
            {['all', 'admin', 'secretary', 'educator', 'user']
              .filter(f => {
                if (profile?.role === 'secretary') {
                  return !['admin'].includes(f) && f !== 'secretary';
                }
                return true;
              })
              .map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter as any)}
                className={cn(
                  "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                  activeFilter === filter 
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                    : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30"
                )}
              >
                {filter === 'all' ? 'Todos' : getRoleLabel(filter as UserRole)}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Resumo Global */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Total de Usuários', value: profiles.length, icon: Users, color: 'text-primary', bg: 'bg-primary/5' },
          { label: 'Perfis Ativos', value: profiles.filter(p => !p.user_metadata?.is_suspended).length, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
          { label: 'Perfis Suspensos', value: profiles.filter(p => p.user_metadata?.is_suspended).length, icon: UserX, color: 'text-rose-500', bg: 'bg-rose-500/5' },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border rounded-3xl p-6 flex items-center gap-4 shadow-sm">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-foreground">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="text-primary animate-spin" size={32} />
        </div>
      ) : (
        <div className="space-y-12">
          {roleGroups.map((group) => {
            const activeUsers = filteredProfiles.filter(p => group.roles.includes(p.role) && !p.user_metadata?.is_suspended);
            const suspendedUsers = filteredProfiles.filter(p => group.roles.includes(p.role) && p.user_metadata?.is_suspended);
            const hasSuspended = suspendedUsers.length > 0;
            const isShowingSuspended = showSuspendedInGroup[group.title];
            
            return (
              <div key={group.title} className="space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                      <group.icon size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-foreground uppercase tracking-tighter">{group.title}</h2>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {activeUsers.length} ativos {hasSuspended && `• ${suspendedUsers.length} suspensos`}
                      </p>
                    </div>
                  </div>

                  {hasSuspended && (
                    <button 
                      onClick={() => setShowSuspendedInGroup(prev => ({ ...prev, [group.title]: !prev[group.title] }))}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        isShowingSuspended 
                          ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" 
                          : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
                      )}
                    >
                      {isShowingSuspended ? (
                        <>
                          <EyeOff size={14} />
                          Ocultar Suspensos
                        </>
                      ) : (
                        <>
                          <Eye size={14} />
                          Mostrar Suspensos
                        </>
                      )}
                    </button>
                  )}
                </div>

                {activeUsers.length === 0 && (!isShowingSuspended || suspendedUsers.length === 0) ? (
                  <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2.5rem] bg-slate-50/50 dark:bg-white/[0.02]">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
                       <Search className="text-slate-300 dark:text-slate-700" size={20} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nenhum perfil ativo nesta categoria</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                      {[...activeUsers, ...(isShowingSuspended ? suspendedUsers : [])].map((p) => (
                        <motion.div 
                          key={p.id} 
                          layout 
                          initial={{ opacity: 0, y: 20 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={cn(
                            "bg-card border border-border rounded-[2.5rem] p-8 hover:border-primary/40 transition-all group relative overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none",
                            p.user_metadata?.is_suspended && "opacity-60 grayscale-[0.5] border-rose-500/20"
                          )}
                        >
                          <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-2xl bg-muted border border-white/10 flex items-center justify-center relative shadow-inner group-hover:border-primary/30 transition-all">
                                <span className="text-xl font-black text-muted-foreground/60">{getInitials(p.full_name)}</span>
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-card border border-white/20 flex items-center justify-center shadow-xl group-hover:border-primary/50 transition-all">
                                  {getRoleIcon(p.role)}
                                </div>
                              </div>
                              <div>
                                <div className="flex flex-col gap-1">
                                  <h3 className="text-xl font-black text-foreground tracking-tight leading-none group-hover:text-primary transition-colors">{p.full_name}</h3>
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {relationships
                                      .filter(r => r.client_id === p.id)
                                      .map(rel => {
                                        const educator = profileMap.get(rel.educator_id);
                                        if (!educator) return null;
                                        return (
                                          <div key={rel.educator_id} className="flex items-center gap-1.5 py-1 px-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg w-fit shadow-sm">
                                            <GraduationCap size={10} className="text-emerald-500" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                              {educator.full_name}
                                            </span>
                                          </div>
                                        );
                                      })}

                                    {p.user_metadata?.initialized_spaces?.includes('personal') && (
                                      <div className={cn(
                                        "flex items-center gap-1.5 py-1 px-2 rounded-lg w-fit border shadow-sm",
                                        p.user_metadata?.gender === 'female' 
                                          ? "bg-pink-500/10 border-pink-500/20 text-pink-600 dark:text-pink-400" 
                                          : "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                                      )}>
                                        <User size={10} />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Pessoal</span>
                                      </div>
                                    )}
                                    {p.user_metadata?.initialized_spaces?.includes('business') && (
                                      <div className="flex items-center gap-1.5 py-1 px-2 bg-slate-900 border border-slate-800 rounded-lg w-fit text-slate-100 shadow-sm">
                                        <Building2 size={10} />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Empresarial</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{p.email}</p>
                              </div>
                            </div>

                            <div className="relative">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === p.id ? null : p.id);
                                }}
                                className={cn(
                                  "w-10 h-10 flex items-center justify-center rounded-xl bg-muted border border-border text-muted-foreground hover:text-primary transition-all shadow-sm",
                                  activeMenuId === p.id && "bg-primary text-white border-primary"
                                )}
                              >
                                <MoreVertical size={18} />
                              </button>

                              <AnimatePresence>
                                {activeMenuId === p.id && (
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="absolute right-0 top-12 w-56 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <div className="p-2 space-y-1">
                                      {(p.role === 'educator' || p.role === 'admin' || p.role === 'master_admin') && ['admin', 'master_admin', 'secretary'].includes(profile?.role || '') && (
                                        <button 
                                          onClick={() => {
                                            setEducatorToLink(p);
                                            setLinkMode('educator_to_clients');
                                            setAvailableUsers(allProfiles.filter(ap => ap.role === 'user'));
                                            setSelectedClients(relationships.filter(r => r.educator_id === p.id).map(r => r.client_id));
                                            setActiveMenuId(null);
                                          }}
                                          className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"
                                        >
                                          <UserPlus size={16} /> Gerenciar Clientes
                                        </button>
                                      )}

                                      {p.role === 'user' && ['admin', 'master_admin', 'secretary'].includes(profile?.role || '') && (
                                        <button 
                                          onClick={() => {
                                            setEducatorToLink(p);
                                            setLinkMode('client_to_educator');
                                            setAvailableUsers(allProfiles.filter(ap => ap.role === 'educator' || ap.role === 'admin' || ap.role === 'master_admin'));
                                            setSelectedClients(relationships.filter(r => r.client_id === p.id).map(r => r.educator_id));
                                            setActiveMenuId(null);
                                          }}
                                          className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 rounded-xl transition-all"
                                        >
                                          <GraduationCap size={16} /> Vincular Gestor
                                        </button>
                                      )}

                                      {p.id !== profile?.id && roleRank(profile?.role as UserRole) > roleRank(p.role) && profile?.role !== 'educator' && (
                                        <button 
                                          onClick={() => {
                                            setUserToEditRole(p);
                                            setActiveMenuId(null);
                                          }}
                                          className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"
                                        >
                                          <Shield size={16} /> Alterar Cargo
                                        </button>
                                      )}

                                      {p.id !== profile?.id && p.role !== 'master_admin' && roleRank(profile?.role as UserRole) > roleRank(p.role) && profile?.role !== 'educator' && (
                                        <button 
                                          onClick={() => {
                                            setUserToManage({ profile: p, action: 'suspend' });
                                            setActiveMenuId(null);
                                          }}
                                          className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                            p.user_metadata?.is_suspended 
                                              ? "text-emerald-500 hover:bg-emerald-500/10"
                                              : "text-amber-500 hover:bg-amber-500/10"
                                          )}
                                        >
                                          <Plus className={cn("rotate-45 transition-transform", p.user_metadata?.is_suspended && "rotate-0")} size={16} />
                                          {p.user_metadata?.is_suspended ? 'Reativar Perfil' : 'Suspender Perfil'}
                                        </button>
                                      )}

                                      {p.id !== profile?.id && roleRank(profile?.role as UserRole) > roleRank(p.role) && profile?.role !== 'educator' && (
                                        <button 
                                          onClick={() => {
                                            setUserToManage({ profile: p, action: 'delete' });
                                            setActiveMenuId(null);
                                          }}
                                          className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                        >
                                          <Trash2 size={16} /> Excluir Perfil
                                        </button>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex flex-col gap-3 p-4 bg-muted/40 rounded-2xl border border-border shadow-inner">
                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Nível de Acesso</p>
                                  <p className="text-xs font-black text-foreground uppercase tracking-tight">{getRoleLabel(p.role)}</p>
                                </div>
                                {p.user_metadata?.is_suspended && (
                                  <div className="bg-rose-500/20 text-rose-500 text-[8px] font-black uppercase px-2 py-1 rounded-md border border-rose-500/30 animate-pulse">
                                    Suspenso
                                  </div>
                                )}
                              </div>
                              
                              {p.user_metadata?.is_suspended && p.user_metadata?.suspension_reason && (
                                <div className="pt-3 border-t border-rose-500/10">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-rose-500/60 mb-1">Motivo da Suspensão</p>
                                  <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 italic">"{p.user_metadata.suspension_reason}"</p>
                                </div>
                              )}
                            </div>
                            {p.id !== profile?.id && (
                              <button 
                                onClick={() => handleStartImpersonation(p)}
                                disabled={p.user_metadata?.is_suspended}
                                className={cn(
                                  "w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3",
                                  p.user_metadata?.is_suspended 
                                    ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed" 
                                    : "bg-primary text-white hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/30"
                                )}
                              >
                                <LayoutDashboard size={18} />
                                Gerenciar Finanças
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <>
      {renderTabContent()}

      {/* Modal Seleção de Espaço */}
      <AnimatePresence>
        {targetUserForSpace && !showActivationModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setTargetUserForSpace(null)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
               <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-8 text-center">Gerenciar de {targetUserForSpace.full_name}</h2>
               <div className="grid grid-cols-1 gap-4">
                 <button 
                   onClick={() => confirmImpersonation('personal')}
                   className={cn(
                     "w-full h-24 rounded-3xl transition-all flex flex-col items-center justify-center gap-2 group border relative overflow-hidden",
                     targetUserForSpace.user_metadata?.initialized_spaces?.includes('personal') ? "bg-slate-950 border-white/5" : "bg-primary/5 border-primary/20"
                   )}
                 >
                   <Users className={targetUserForSpace.user_metadata?.initialized_spaces?.includes('personal') ? "text-slate-500" : "text-primary"} size={24} />
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                     {targetUserForSpace.user_metadata?.initialized_spaces?.includes('personal') ? 'Conta Pessoal' : 'Ativar Espaço Pessoal'}
                   </span>
                 </button>
                 <button 
                   onClick={() => confirmImpersonation('business')}
                   className={cn(
                     "w-full h-24 rounded-3xl transition-all flex flex-col items-center justify-center gap-2 group border relative overflow-hidden",
                     targetUserForSpace.user_metadata?.initialized_spaces?.includes('business') ? "bg-slate-950 border-white/5" : "bg-emerald-500/5 border-emerald-500/20"
                   )}
                 >
                   <LayoutDashboard className={targetUserForSpace.user_metadata?.initialized_spaces?.includes('business') ? "text-slate-500" : "text-emerald-500"} size={24} />
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {targetUserForSpace.user_metadata?.initialized_spaces?.includes('business') ? 'Conta Empresarial' : 'Ativar Espaço Empresarial'}
                   </span>
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modais de Confirmação de Ação */}
      <AnimatePresence>
        {userToManage && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setUserToManage(null); setSuspensionReason(''); }} className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={cn(
                "relative w-full max-w-md border rounded-[2.5rem] p-8 shadow-2xl overflow-hidden bg-slate-900 border-white/10",
                userToManage.action === 'delete' && "border-rose-500/20 shadow-rose-500/10"
              )}
            >
               <div className={cn("absolute -top-24 -right-24 w-48 h-48 blur-[80px] rounded-full opacity-20", userToManage.action === 'delete' ? "bg-rose-500" : "bg-amber-500")} />
               <div className="relative z-10 flex flex-col items-center text-center">
                 <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center mb-6 border shadow-xl transition-all", userToManage.action === 'delete' ? "bg-rose-500/20 border-rose-500/30 text-rose-500 rotate-3" : "bg-amber-500/20 border-amber-500/30 text-amber-500")}>
                   {userToManage.action === 'delete' ? <Trash2 size={32} /> : <Shield className="animate-pulse" size={32} />}
                 </div>
                 <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{userToManage.action === 'delete' ? 'Exclusão Permanente' : userToManage.profile.user_metadata?.is_suspended ? 'Reativar Conta' : 'Suspender Conta'}</h2>
                 <p className="text-slate-400 text-sm font-medium mb-6">
                   {userToManage.action === 'delete' ? (<>Deseja excluir permanentemente <span className="text-white font-bold">{userToManage.profile.full_name}</span>? <br/><br/> <span className="text-rose-400 font-bold uppercase tracking-widest text-[10px]">CUIDADO: Dados financeiros serão removidos.</span></>) : (userToManage.profile.user_metadata?.is_suspended ? 'Deseja reativar o acesso?' : 'Deseja suspender o acesso?')}
                 </p>

                 {userToManage.action === 'suspend' && !userToManage.profile.user_metadata?.is_suspended && (
                    <div className="w-full space-y-2 mb-8 text-left">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Motivo da Suspensão</label>
                      <textarea
                        value={suspensionReason}
                        onChange={(e) => setSuspensionReason(e.target.value)}
                        placeholder="Ex: Falta de pagamento, Quebra de contrato..."
                        className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-sm text-white outline-none focus:border-primary/50 transition-all resize-none h-24 shadow-inner"
                      />
                    </div>
                  )}

                 <div className="grid grid-cols-2 gap-4 w-full">
                   <button onClick={() => { setUserToManage(null); setSuspensionReason(''); }} className="h-14 bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancelar</button>
                   <button onClick={handleAction} className={cn("h-14 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg", userToManage.action === 'delete' ? "bg-rose-600 hover:bg-rose-500" : "bg-primary hover:bg-orange-500")}>Confirmar</button>
                 </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SpaceActivationModal
        isOpen={showActivationModal} onClose={() => setShowActivationModal(false)} spaceType={activatingSpaceType}
        targetUserId={targetUserForSpace?.id} targetUserMetadata={targetUserForSpace?.user_metadata}
        onConfirm={async () => {
          setShowActivationModal(false);
          if (targetUserForSpace) {
            await impersonateUser(targetUserForSpace.id);
            setActiveSpace(activatingSpaceType);
            setTargetUserForSpace(null);
          }
        }}
      />

      {/* Modal Criar Perfil */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
               <button 
                 onClick={() => setShowCreateModal(false)}
                 className="absolute top-8 right-8 w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all z-10"
               >
                 <X size={20} />
               </button>
               
               <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8">Novo Perfil</h2>
               <form onSubmit={handleCreateUser} className="space-y-6">
                 <input required type="text" value={newUser.full_name} onChange={e => setNewUser(prev => ({ ...prev, full_name: e.target.value }))} placeholder="Nome Completo" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl h-14 px-6 text-sm text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all" />
                 <input required type="email" value={newUser.email} onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))} placeholder="E-mail" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl h-14 px-6 text-sm text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all" />
                 <input required type="password" value={newUser.password} onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))} placeholder="Senha" minLength={6} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl h-14 px-6 text-sm text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all" />
                 <div className="space-y-4">
                  <AnimatePresence>
                    {createSource === 'management' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 block">Nível de Acesso</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'user', name: 'Usuário', icon: Users, desc: 'Acesso padrão', color: 'slate' },
                            { id: 'educator', name: 'Educador', icon: GraduationCap, desc: 'Mentor', color: 'emerald' },
                            { id: 'secretary', name: 'Secretário', icon: BookOpen, desc: 'Adm ajuda', color: 'purple' },
                            ...(profile?.role === 'master_admin' ? [{ id: 'admin', name: 'Admin', icon: Shield, desc: 'Completo', color: 'blue' }] : [])
                          ].filter(role => {
                              if (profile?.role === 'secretary') {
                                return role.id !== 'secretary' && role.id !== 'admin';
                              }
                              if (profile?.role === 'educator') {
                                return role.id === 'user';
                              }
                              return true;
                            }).map((role) => (
                            <button key={role.id} type="button" onClick={() => setNewUser(prev => ({ ...prev, role: role.id as UserRole }))} className={cn("p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 group relative overflow-hidden", newUser.role === role.id ? "bg-primary/10 border-primary shadow-lg shadow-primary/10" : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-white/5")}>
                              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center transition-colors", newUser.role === role.id ? "bg-primary text-white" : "bg-slate-200 dark:bg-slate-900 text-slate-500")}>
                                <role.icon size={16} />
                              </div>
                              <div className="text-left">
                                <p className={cn("text-[10px] font-black uppercase tracking-wider", newUser.role === role.id ? "text-slate-900 dark:text-white" : "text-slate-400")}>{role.name}</p>
                                <p className="text-[8px] font-bold text-slate-500 dark:text-slate-600 uppercase mt-0.5">{role.desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  </div>

                  {/* Seleção de Educador (Apenas para Admins/Secretários criando Usuários na aba de Gestão) */}
                  {createSource === 'management' && newUser.role === 'user' && ['admin', 'master_admin', 'secretary'].includes(profile?.role || '') && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Vincular a um Educador</label>
                        {selectedEducatorId && (
                           <button 
                             type="button"
                             onClick={() => setSelectedEducatorId('')}
                             className="text-[8px] font-black uppercase text-rose-500 hover:underline"
                           >
                             Limpar Seleção
                           </button>
                        )}
                      </div>
                      
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {allProfiles
                          .filter(p => ['educator', 'admin', 'master_admin'].includes(p.role))
                          .sort((a, b) => a.full_name.localeCompare(b.full_name))
                          .map((educator) => (
                            <button 
                              key={educator.id} 
                              type="button"
                              onClick={() => setSelectedEducatorId(educator.id)} 
                              className={cn(
                                "w-full p-4 rounded-[1.5rem] border transition-all flex items-center justify-between group", 
                                selectedEducatorId === educator.id 
                                  ? "bg-primary/10 border-primary text-slate-900 dark:text-white" 
                                  : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:border-primary/30"
                              )}
                            >
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black transition-colors",
                                  selectedEducatorId === educator.id ? "bg-primary text-white" : "bg-slate-200 dark:bg-slate-900"
                                )}>
                                  {getInitials(educator.full_name)}
                                </div>
                                <div className="text-left">
                                  <p className="text-sm font-black uppercase tracking-tight leading-none mb-1">{educator.full_name}</p>
                                  <div className="flex items-center gap-2">
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{educator.email}</p>
                                     <div className="w-1 h-1 rounded-full bg-slate-500" />
                                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 opacity-60">{getRoleLabel(educator.role)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className={cn(
                                "w-6 h-6 rounded-lg border flex items-center justify-center transition-all", 
                                selectedEducatorId === educator.id 
                                  ? "bg-primary border-primary text-white" 
                                  : "border-slate-200 dark:border-white/10 text-transparent group-hover:border-primary/30"
                              )}>
                                <Check size={14} strokeWidth={3} />
                              </div>
                            </button>
                          ))
                        }
                      </div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-4">
                        O novo cliente aparecerá automaticamente na lista do educador selecionado.
                      </p>
                    </div>
                  )}

                  <button disabled={creatingUser} type="submit" className="w-full h-14 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4">{creatingUser ? 'Criando...' : 'Finalizar Cadastro'}</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Alterar Cargo */}
      <AnimatePresence>
        {userToEditRole && (
          <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setUserToEditRole(null)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
               <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Alterar Cargo</h2>
               <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Novo nível para <span className="text-slate-900 dark:text-white font-bold">{userToEditRole.full_name}</span></p>
               <div className="grid grid-cols-2 gap-3 mb-8">
                  {[
                    { id: 'user', name: 'Usuário', icon: Users, desc: 'Acesso padrão', color: 'slate' },
                    { id: 'educator', name: 'Educador', icon: GraduationCap, desc: 'Mentor', color: 'emerald' },
                    { id: 'secretary', name: 'Secretário', icon: BookOpen, desc: 'Auxílio', color: 'purple' },
                    { id: 'admin', name: 'Admin', icon: Shield, desc: 'Completo', color: 'blue' }
                  ].filter(r => roleRank(profile?.role as UserRole) > roleRank(r.id as UserRole)).map((role) => (
                    <button key={role.id} onClick={() => handleUpdateRole(userToEditRole.id, role.id as UserRole)} className={cn("p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 group relative overflow-hidden", userToEditRole.role === role.id ? "bg-primary/10 border-primary" : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-white/5")}>
                       <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center transition-colors", userToEditRole.role === role.id ? "bg-primary text-white" : "bg-slate-200 dark:bg-slate-900 text-slate-500")}>
                         <role.icon size={16} />
                       </div>
                       <div className="text-left">
                         <p className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">{role.name}</p>
                         <p className="text-[8px] font-bold text-slate-500 dark:text-slate-600 uppercase mt-0.5">{role.desc}</p>
                       </div>
                    </button>
                  ))}
               </div>
               <button onClick={() => setUserToEditRole(null)} className="w-full h-14 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Vincular Usuários (Educador) */}
      <AnimatePresence>
        {educatorToLink && (
          <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEducatorToLink(null)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl flex flex-col max-h-[85vh]">
               <div className="flex items-center gap-4 mb-8">
                 <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", linkMode === 'educator_to_clients' ? "bg-emerald-500/20 text-emerald-500" : "bg-primary/20 text-primary")}><UserPlus size={24} /></div>
                 <div>
                   <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                     {linkMode === 'educator_to_clients' ? 'Vincular Clientes' : 'Vincular Educador'}
                   </h2>
                   <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                     {linkMode === 'educator_to_clients' ? `Educador: ${educatorToLink?.full_name}` : `Cliente: ${educatorToLink?.full_name}`}
                   </p>
                 </div>
               </div>
               <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-8 custom-scrollbar">
                  {availableUsers
                    .filter(u => u.id !== educatorToLink?.id) // Prevent linking to self
                    .map((u) => (
                    <button key={u.id} onClick={() => {
                      if (linkMode === 'client_to_educator') {
                        // Radio button behavior: only one selection allowed
                        setSelectedClients([u.id]);
                      } else {
                        // Multiple selection for clients
                        const exists = selectedClients.includes(u.id);
                        if (exists) setSelectedClients(prev => prev.filter(id => id !== u.id));
                        else setSelectedClients(prev => [...prev, u.id]);
                      }
                    }} className={cn("w-full p-4 rounded-[1.5rem] border transition-all flex items-center justify-between group", selectedClients.includes(u.id) ? "bg-primary/10 border-primary text-slate-900 dark:text-white" : "bg-white dark:bg-slate-950/50 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400")}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-[11px] font-black">{getInitials(u.full_name)}</div>
                        <div className="text-left">
                          <p className="text-sm font-black uppercase tracking-tight leading-none mb-1">{u.full_name}</p>
                          <div className="flex items-center gap-2">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{u.email}</p>
                             <div className="w-1 h-1 rounded-full bg-slate-500" />
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{getRoleLabel(u.role)}</span>
                          </div>
                        </div>
                      </div>
                      <div className={cn("w-6 h-6 rounded-lg border flex items-center justify-center transition-all", selectedClients.includes(u.id) ? "bg-primary border-primary text-white" : "border-slate-200 dark:border-white/10 text-transparent")}><Check size={14} strokeWidth={3} /></div>
                    </button>
                  ))}
               </div>
               <div className="grid grid-cols-2 gap-4 mt-auto pt-4 border-t border-slate-100 dark:border-white/5">
                 <button onClick={() => setEducatorToLink(null)} className="h-14 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Sair</button>
                 <button 
                   disabled={linkingUsers || (educatorToLink === null)} 
                   onClick={async () => {
                     if (!educatorToLink) return;
                     setLinkingUsers(true);
                     try {
                       if (linkMode === 'educator_to_clients') {
                         await handleLinkUsers(educatorToLink.id, selectedClients);
                       } else {
                         await supabase.from('educator_clients').delete().eq('client_id', educatorToLink.id);
                         if (selectedClients.length > 0) {
                           const inserts = selectedClients.map(eid => ({ educator_id: eid, client_id: educatorToLink.id }));
                           await supabase.from('educator_clients').insert(inserts);
                         }
                         showAlert('Sucesso', 'Vínculos atualizados!', 'success');
                         setEducatorToLink(null);
                       }
                       fetchData();
                     } catch (err: any) {
                       showAlert('Erro', err.message, 'danger');
                     } finally {
                       setLinkingUsers(false);
                     }
                   }} 
                   className="h-14 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50"
                 >
                   {linkingUsers ? 'Gravando...' : `Salvar (${selectedClients.length})`}
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
