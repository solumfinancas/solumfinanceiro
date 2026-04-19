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
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useModal } from '../../contexts/ModalContext';
import { useFinance } from '../../FinanceContext';
import { SpaceActivationModal } from '../SpaceActivationModal';

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

export const ManagementPortal: React.FC = () => {
  const { profile, impersonateUser } = useAuth();
  const { setActiveSpace } = useFinance();
  const { showAlert } = useModal();
  
  // Core Data State
  const [profiles, setProfiles] = useState<Profile[]>([]);
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
  
  const [creatingUser, setCreatingUser] = useState(false);
  const [linkingUsers, setLinkingUsers] = useState(false);
  
  // Form state for new user
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'user' as UserRole
  });

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
      
      // Fetch users for educator linking
      const { data: userData } = await supabase.from('profiles').select('*').eq('role', 'user');
      setAvailableUsers(userData || []);
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
      showAlert('Sucesso', 'Perfil criado com sucesso!', 'success');
      setShowCreateModal(false);
      setNewUser({ full_name: '', email: '', password: '', role: 'user' });
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
      const { error } = await supabase.from('educator_clients').upsert(inserts, { onConflict: 'educator_id,client_id' });
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
        const { data, error } = await supabase.functions.invoke('admin-create-user', {
          body: { action: 'suspend', userId: target.id, suspend: !isSuspended }
        });
        if (error || data?.error) throw new Error(error?.message || data?.error);
        
        setProfiles(prev => prev.map(p => p.id === target.id ? { 
          ...p, 
          user_metadata: { ...p.user_metadata, is_suspended: !isSuspended } 
        } : p));
        
        showAlert('Sucesso', `Usuário ${!isSuspended ? 'suspenso' : 'reativado'} com sucesso.`, 'success');
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
    const fullUser = await fetchFullProfile(target.id);
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

  const filteredProfiles = profiles
    .filter(p => {
      const matchesSearch = p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'all' || p.role === activeFilter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => roleRank(b.role) - roleRank(a.role));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="text-primary" size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Portal de Gestão</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
            {profile?.role === 'educator' ? 'Meus Clientes' : 'Controle de Acessos'}
          </h1>
        </div>
        {['admin', 'master_admin', 'secretary'].includes(profile?.role || '') && (
          <button onClick={() => setShowCreateModal(true)} className="bg-primary hover:scale-[1.02] active:scale-95 text-white px-6 py-3 rounded-2xl flex items-center gap-3 transition-all group shadow-lg shadow-primary/20">
            <UserPlus size={18} className="group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Criar Perfil</span>
          </button>
        )}
      </div>

      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 flex flex-col xl:flex-row gap-6">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/50 border border-white/10 rounded-2xl h-14 pl-14 pr-6 text-sm text-white outline-none focus:border-primary/50 transition-all"
          />
        </div>
        {profile?.role !== 'educator' && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar items-center">
            {['all', 'admin', 'secretary', 'educator', 'user'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter as any)}
                className={cn(
                  "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                  activeFilter === filter ? "bg-primary border-primary text-white" : "bg-slate-950/50 border-white/5 text-slate-400"
                )}
              >
                {filter === 'all' ? 'Todos' : getRoleLabel(filter as UserRole)}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="text-primary animate-spin" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredProfiles.map((p) => (
              <motion.div key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn(
                "bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 hover:border-primary/30 transition-all group relative overflow-hidden",
                p.user_metadata?.is_suspended && "opacity-60 grayscale-[0.5] border-rose-500/20"
              )}>
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-white/5 flex items-center justify-center relative">
                       <span className="text-xl font-black text-slate-400">{getInitials(p.full_name)}</span>
                       <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center">
                         {getRoleIcon(p.role)}
                       </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white tracking-tight leading-none mb-2">{p.full_name}</h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{p.email}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    {p.role === 'educator' && ['admin', 'master_admin', 'secretary'].includes(profile?.role || '') && (
                      <button 
                        onClick={() => setEducatorToLink(p)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"
                        title="Vincular Usuários"
                      >
                         <UserPlus size={18} />
                      </button>
                    )}

                    {p.id !== profile?.id && roleRank(profile?.role as UserRole) > roleRank(p.role) && (
                      <button 
                        onClick={() => setUserToEditRole(p)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all"
                        title="Alterar Nível de Acesso"
                      >
                         <Shield size={18} />
                      </button>
                    )}

                    {p.id !== profile?.id && p.role !== 'master_admin' && roleRank(profile?.role as UserRole) > roleRank(p.role) && (
                      <button 
                        onClick={() => setUserToManage({ profile: p, action: 'suspend' })}
                        className={cn(
                          "w-10 h-10 flex items-center justify-center rounded-xl transition-all border",
                          p.user_metadata?.is_suspended 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500 hover:text-white"
                        )}
                        title={p.user_metadata?.is_suspended ? 'Reativar' : 'Suspender'}
                      >
                         <Plus className={cn("rotate-45 transition-transform", p.user_metadata?.is_suspended && "rotate-0")} size={18} />
                      </button>
                    )}

                    {p.id !== profile?.id && roleRank(profile?.role as UserRole) > roleRank(p.role) && (
                      <button 
                        onClick={() => setUserToManage({ profile: p, action: 'delete' })}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
                        title="Excluir Permanentemente"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-800/80 rounded-2xl border border-white/10 shadow-inner">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Nível de Acesso</p>
                      <p className="text-xs font-black text-white uppercase tracking-tight">{getRoleLabel(p.role)}</p>
                    </div>
                    {p.user_metadata?.is_suspended && (
                      <div className="bg-rose-500/20 text-rose-500 text-[8px] font-black uppercase px-2 py-1 rounded-md border border-rose-500/30 animate-pulse">
                        Suspenso
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
                           ? "bg-slate-800 text-slate-600 cursor-not-allowed" 
                           : "bg-primary text-white hover:scale-[1.02] shadow-[0_10px_20px_-5px_rgba(249,115,22,0.3)]"
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setUserToManage(null)} className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" />
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
                 <p className="text-slate-400 text-sm font-medium mb-8">
                   {userToManage.action === 'delete' ? (<>Deseja excluir permanentemente <span className="text-white font-bold">{userToManage.profile.full_name}</span>? <br/><br/> <span className="text-rose-400 font-bold uppercase tracking-widest text-[10px]">CUIDADO: Dados financeiros serão removidos.</span></>) : (userToManage.profile.user_metadata?.is_suspended ? 'Deseja reativar o acesso?' : 'Deseja suspender o acesso?')}
                 </p>
                 <div className="grid grid-cols-2 gap-4 w-full">
                   <button onClick={() => setUserToManage(null)} className="h-14 bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancelar</button>
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
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
               <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8">Novo Perfil</h2>
               <form onSubmit={handleCreateUser} className="space-y-6">
                 <input required type="text" value={newUser.full_name} onChange={e => setNewUser(prev => ({ ...prev, full_name: e.target.value }))} placeholder="Nome Completo" className="w-full bg-slate-950 border border-white/5 rounded-2xl h-14 px-6 text-sm text-white" />
                 <input required type="email" value={newUser.email} onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))} placeholder="E-mail" className="w-full bg-slate-950 border border-white/5 rounded-2xl h-14 px-6 text-sm text-white" />
                 <input required type="password" value={newUser.password} onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))} placeholder="Senha" minLength={6} className="w-full bg-slate-950 border border-white/5 rounded-2xl h-14 px-6 text-sm text-white" />
                 <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 block">Nível de Acesso</label>
                   <div className="grid grid-cols-2 gap-3">
                     {[
                       { id: 'user', name: 'Usuário', icon: Users, desc: 'Acesso padrão', color: 'slate' },
                       { id: 'educator', name: 'Educador', icon: GraduationCap, desc: 'Mentor', color: 'emerald' },
                       { id: 'secretary', name: 'Secretário', icon: BookOpen, desc: 'Adm ajuda', color: 'purple' },
                       ...(profile?.role === 'master_admin' ? [{ id: 'admin', name: 'Admin', icon: Shield, desc: 'Completo', color: 'blue' }] : [])
                     ].map((role) => (
                       <button key={role.id} type="button" onClick={() => setNewUser(prev => ({ ...prev, role: role.id as UserRole }))} className={cn("p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 group relative overflow-hidden", newUser.role === role.id ? "bg-primary/10 border-primary shadow-lg shadow-primary/10" : "bg-slate-950/50 border-white/5")}>
                         <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center transition-colors", newUser.role === role.id ? "bg-primary text-white" : "bg-slate-900 text-slate-500")}>
                           <role.icon size={16} />
                         </div>
                         <div className="text-left">
                           <p className={cn("text-[10px] font-black uppercase tracking-wider", newUser.role === role.id ? "text-white" : "text-slate-400")}>{role.name}</p>
                           <p className="text-[8px] font-bold text-slate-600 uppercase mt-0.5">{role.desc}</p>
                         </div>
                       </button>
                     ))}
                   </div>
                 </div>
                 <button disabled={creatingUser} type="submit" className="w-full h-14 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest">{creatingUser ? 'Criando...' : 'Finalizar Cadastro'}</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Alterar Cargo */}
      <AnimatePresence>
        {userToEditRole && (
          <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setUserToEditRole(null)} className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
               <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Alterar Cargo</h2>
               <p className="text-slate-400 text-sm mb-8">Novo nível para <span className="text-white font-bold">{userToEditRole.full_name}</span></p>
               <div className="grid grid-cols-2 gap-3 mb-8">
                  {[
                    { id: 'user', name: 'Usuário', icon: Users, desc: 'Acesso padrão', color: 'slate' },
                    { id: 'educator', name: 'Educador', icon: GraduationCap, desc: 'Mentor', color: 'emerald' },
                    { id: 'secretary', name: 'Secretário', icon: BookOpen, desc: 'Auxílio', color: 'purple' },
                    { id: 'admin', name: 'Admin', icon: Shield, desc: 'Controle', color: 'blue' }
                  ].filter(r => roleRank(profile?.role as UserRole) > roleRank(r.id as UserRole)).map((role) => (
                    <button key={role.id} onClick={() => handleUpdateRole(userToEditRole.id, role.id as UserRole)} className={cn("p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 group relative overflow-hidden", userToEditRole.role === role.id ? "bg-primary/10 border-primary" : "bg-slate-950/50 border-white/5")}>
                       <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center transition-colors", userToEditRole.role === role.id ? "bg-primary text-white" : "bg-slate-900 text-slate-500")}>
                         <role.icon size={16} />
                       </div>
                       <div className="text-left">
                         <p className="text-[10px] font-black uppercase tracking-wider text-white">{role.name}</p>
                         <p className="text-[8px] font-bold text-slate-600 uppercase mt-0.5">{role.desc}</p>
                       </div>
                    </button>
                  ))}
               </div>
               <button onClick={() => setUserToEditRole(null)} className="w-full h-14 bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancelar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Vincular Usuários (Educador) */}
      <AnimatePresence>
        {educatorToLink && (
          <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEducatorToLink(null)} className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl flex flex-col max-h-[85vh]">
               <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500"><UserPlus size={24} /></div>
                 <div>
                   <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Vincular Clientes</h2>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Educador: {educatorToLink.full_name}</p>
                 </div>
               </div>
               <div className="flex-1 overflow-y-auto pr-2 space-y-2 mb-8 custom-scrollbar">
                 {availableUsers.map((u) => (
                   <button key={u.id} onClick={() => {
                     const exists = selectedClients.includes(u.id);
                     if (exists) setSelectedClients(prev => prev.filter(id => id !== u.id));
                     else setSelectedClients(prev => [...prev, u.id]);
                   }} className={cn("w-full p-4 rounded-2xl border transition-all flex items-center justify-between group", selectedClients.includes(u.id) ? "bg-primary/10 border-primary text-white" : "bg-slate-950/50 border-white/5 text-slate-400")}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-[10px] font-black">{getInitials(u.full_name)}</div>
                        <div className="text-left"><p className="text-xs font-black uppercase tracking-tight">{u.full_name}</p><p className="text-[9px] font-bold text-slate-600">{u.email}</p></div>
                      </div>
                      <div className={cn("w-5 h-5 rounded-md border flex items-center justify-center", selectedClients.includes(u.id) ? "bg-primary border-primary text-white" : "border-white/10 text-transparent")}><Check size={12} strokeWidth={4} /></div>
                   </button>
                 ))}
               </div>
               <div className="grid grid-cols-2 gap-4 mt-auto pt-4 border-t border-white/5">
                 <button onClick={() => setEducatorToLink(null)} className="h-14 bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Sair</button>
                 <button disabled={linkingUsers || selectedClients.length === 0} onClick={() => handleLinkUsers(educatorToLink.id, selectedClients)} className="h-14 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50">{linkingUsers ? 'Vinculando...' : `Vincular (${selectedClients.length})`}</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
