import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, Profile } from '../../../contexts/AuthContext';
import { useFinance } from '../../../FinanceContext';
import { supabase } from '../../../lib/supabase';
import { 
  Presentation, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  UserMinus, 
  UserCheck, 
  LayoutDashboard, 
  User as UserIcon, 
  Building2, 
  ExternalLink,
  CalendarDays,
  CalendarClock,
  UserX,
  Plus,
  X,
  Info,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { useModal } from '../../../contexts/ModalContext';
import { 
  format, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Meeting } from '../../../types';

export const MeetingsTab: React.FC = () => {
  const { profile, impersonateUser } = useAuth();
  const { setActiveSpace } = useFinance();
  const { showAlert } = useModal();

  // Mês/Ano selecionado
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Estados de dados
  const [clients, setClients] = useState<Profile[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Abas de lembretes
  const [activeGroupTab, setActiveGroupTab] = useState<'pending' | 'scheduled' | 'waived' | 'cancelled'>('pending');
  
  // Modal de Detalhes do Calendário
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [dayMeetings, setDayMeetings] = useState<Meeting[]>([]);

  const selectedMonthYear = useMemo(() => {
    return format(selectedDate, 'yyyy-MM');
  }, [selectedDate]);

  // Estados e controle de novos clientes pendentes de configuração de início da agenda
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [savingConfigs, setSavingConfigs] = useState(false);
  const [configs, setConfigs] = useState<{ [clientId: string]: { startMonth: string; onlyApp: boolean } }>({});
  const [showAllInModal, setShowAllInModal] = useState(false);

  const unconfiguredClients = useMemo(() => {
    return clients.filter(client => {
      const metadata = client.user_metadata || {};
      return !metadata.meeting_start_month && metadata.only_app !== true;
    });
  }, [clients]);

  useEffect(() => {
    if (unconfiguredClients.length > 0 && !showAllInModal) {
      setShowConfigModal(true);
      const initialConfigs: typeof configs = {};
      unconfiguredClients.forEach(c => {
        initialConfigs[c.id] = {
          startMonth: '',
          onlyApp: false
        };
      });
      setConfigs(initialConfigs);
    } else if (unconfiguredClients.length === 0 && !showAllInModal) {
      setShowConfigModal(false);
    }
  }, [unconfiguredClients, showAllInModal]);

  const handleOpenManualConfig = () => {
    setShowAllInModal(true);
    const initialConfigs: typeof configs = {};
    clients.forEach(c => {
      const metadata = c.user_metadata || {};
      initialConfigs[c.id] = {
        startMonth: metadata.meeting_start_month || '',
        onlyApp: !!metadata.only_app
      };
    });
    setConfigs(initialConfigs);
    setShowConfigModal(true);
  };

  const handleSaveConfigurations = async () => {
    setSavingConfigs(true);
    try {
      const ids = Object.keys(configs);

      // Validação obrigatória apenas se for a abertura automática (para clientes pendentes)
      if (!showAllInModal) {
        const invalid = ids.some(id => {
          const cfg = configs[id];
          return !cfg.onlyApp && !cfg.startMonth;
        });

        if (invalid) {
          showAlert('Atenção', 'Defina o mês de início ou marque "Apenas usa o app" para todos os clientes listados.', 'warning');
          setSavingConfigs(false);
          return;
        }
      }

      const promises = ids.map(async id => {
        const client = clients.find(c => c.id === id);
        if (!client) return;

        const cfg = configs[id];
        const wasOnlyApp = client.user_metadata?.only_app === true;
        const isOnlyApp = cfg.onlyApp;

        const updatedMetadata = {
          ...(client.user_metadata || {}),
          only_app: isOnlyApp ? true : null,
          meeting_start_month: isOnlyApp ? null : (cfg.startMonth || null)
        };

        if (isOnlyApp) {
          updatedMetadata.meeting_status = 'cancelled';
          if (!updatedMetadata.meeting_status_history) {
            updatedMetadata.meeting_status_history = {};
          }
          updatedMetadata.meeting_status_history[selectedMonthYear] = 'cancelled';
        } else if (wasOnlyApp && !isOnlyApp) {
          updatedMetadata.meeting_status = null;
          if (!updatedMetadata.meeting_status_history) {
            updatedMetadata.meeting_status_history = {};
          }
          updatedMetadata.meeting_status_history[selectedMonthYear] = 'active';
        }

        const { error } = await supabase
          .from('profiles')
          .update({ user_metadata: updatedMetadata })
          .eq('id', id);

        if (error) throw error;
      });

      await Promise.all(promises);
      showAlert('Sucesso', 'Configurações de início de agenda salvas com sucesso!', 'success');
      setShowConfigModal(false);
      setShowAllInModal(false);
      fetchData();
    } catch (err: any) {
      console.error('Erro ao salvar configurações de clientes:', err);
      showAlert('Erro', `Não foi possível salvar as configurações: ${err.message}`, 'danger');
    } finally {
      setSavingConfigs(false);
    }
  };

  // Utilitário para resolver o status de reuniões do cliente em um mês específico
  const getClientGlobalStatusForMonth = (client: Profile, monthYear: string): 'active' | 'cancelled' => {
    const history = client.user_metadata?.meeting_status_history;
    if (!history || typeof history !== 'object') {
      return client.user_metadata?.meeting_status === 'cancelled' ? 'cancelled' : 'active';
    }

    const pastEvents = Object.keys(history)
      .filter(key => key <= monthYear)
      .sort();

    if (pastEvents.length === 0) {
      // Ignorar fallback legado se history existir para evitar retroatividade de cancelamento
      return 'active';
    }

    const lastKey = pastEvents[pastEvents.length - 1];
    return history[lastKey] === 'cancelled' ? 'cancelled' : 'active';
  };

  // Buscar todos os dados
  const fetchData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      // Todos os educadores e administradores buscam apenas clientes ativos vinculados a eles
      const { data: rels, error: relsError } = await supabase
        .from('educator_clients')
        .select('client_id, status')
        .eq('educator_id', profile.id)
        .eq('status', 'active');

      if (relsError) throw relsError;
      const clientIds = rels?.map(r => r.client_id) || [];

      let clientList: Profile[] = [];
      if (clientIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', clientIds);

        if (profilesError) throw profilesError;
        clientList = (profilesData || []).filter(c => !c.user_metadata?.is_suspended && c.id !== profile.id);
      }

      setClients(clientList);

      const allClientIds = clientList.map(c => c.id);
      
      if (allClientIds.length > 0) {
        const { data: meetingsData, error: meetingsError } = await supabase
          .from('meetings')
          .select('*')
          .in('user_id', allClientIds);

        if (meetingsError) throw meetingsError;
        
        const formattedMeetings = (meetingsData || []).map((m: any) => ({
          ...m,
          topics: Array.isArray(m.topics) ? m.topics : [],
          notes: m.notes || null
        })) as Meeting[];
        
        setMeetings(formattedMeetings);
      } else {
        setMeetings([]);
      }

    } catch (err: any) {
      console.error('Erro ao carregar dados de reuniões de gestão:', err);
      showAlert('Erro', 'Não foi possível carregar as informações das reuniões.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  // Inscrição tempo real
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('meetings_management_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          // Atualiza dados locais se for alterado metadados
          setClients(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c));
        } else {
          fetchData();
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'educator_clients' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  // Filtro de clientes com busca por texto
  const filteredClients = useMemo(() => {
    let list = clients;

    // Filtro de busca por texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(c => 
        c.full_name?.toLowerCase().includes(query) || 
        c.email?.toLowerCase().includes(query)
      );
    }

    return list;
  }, [clients, searchQuery]);

  // Classificação dos clientes por status no mês selecionado
  const groupedClients = useMemo(() => {
    const pending: Profile[] = [];
    const scheduled: Profile[] = [];
    const waived: Profile[] = [];
    const cancelled: Profile[] = [];

    filteredClients.forEach(client => {
      const metadata = client.user_metadata || {};

      // 1. Se o cliente usa apenas o aplicativo (only_app: true), ele vai direto para os Cancelados permanentemente
      if (metadata.only_app === true) {
        cancelled.push(client);
        return;
      }

      // 2. Se o cliente possui data de início da agenda definida e o mês selecionado é anterior, ele não iniciou a agenda e fica oculto
      if (metadata.meeting_start_month && selectedMonthYear < metadata.meeting_start_month) {
        return;
      }

      // 3. Cancelados com base no status histórico do mês selecionado
      const globalStatus = getClientGlobalStatusForMonth(client, selectedMonthYear);
      if (globalStatus === 'cancelled') {
        cancelled.push(client);
        return;
      }

      // 4. Dispensados temporariamente no mês selecionado
      if (metadata.monthly_meeting_status?.[selectedMonthYear] === 'will_not_meet') {
        waived.push(client);
        return;
      }

      // 5. Verificar se há reuniões neste mês
      const hasMeetingsThisMonth = meetings.some(meeting => {
        if (meeting.user_id !== client.id) return false;
        // O formato esperado para meeting.date é yyyy-MM-dd...
        return meeting.date?.startsWith(selectedMonthYear);
      });

      if (hasMeetingsThisMonth) {
        scheduled.push(client);
      } else {
        pending.push(client);
      }
    });

    return { pending, scheduled, waived, cancelled };
  }, [filteredClients, meetings, selectedMonthYear]);

  // Persistir alterações de status no user_metadata do cliente
  const handleUpdateStatus = async (
    client: Profile, 
    updates: { 
      meeting_status_action?: 'cancel' | 'reactivate'; 
      monthly_status?: 'will_meet' | 'will_not_meet' 
    }
  ) => {
    try {
      const updatedMetadata = {
        ...(client.user_metadata || {})
      };

      if (updates.meeting_status_action !== undefined) {
        if (!updatedMetadata.meeting_status_history) {
          updatedMetadata.meeting_status_history = {};
        }

        // Se houver um status de cancelado global legado, migrá-lo
        if (client.user_metadata?.meeting_status === 'cancelled' && Object.keys(updatedMetadata.meeting_status_history).length === 0) {
          updatedMetadata.meeting_status_history['2020-01'] = 'cancelled';
        }

        updatedMetadata.meeting_status_history[selectedMonthYear] = 
          updates.meeting_status_action === 'cancel' ? 'cancelled' : 'active';
        
        // Sincronizar o legado para retrocompatibilidade
        updatedMetadata.meeting_status = updates.meeting_status_action === 'cancel' ? 'cancelled' : null;
      }

      if (updates.monthly_status !== undefined) {
        if (!updatedMetadata.monthly_meeting_status) {
          updatedMetadata.monthly_meeting_status = {};
        }
        updatedMetadata.monthly_meeting_status[selectedMonthYear] = updates.monthly_status;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ user_metadata: updatedMetadata })
        .eq('id', client.id);

      if (error) throw error;

      showAlert('Sucesso', 'Status de reuniões atualizado!', 'success');
      
      // Atualizar estado local
      setClients(prev => prev.map(c => 
        c.id === client.id ? { ...c, user_metadata: updatedMetadata } : c
      ));

    } catch (err: any) {
      console.error('Erro ao atualizar metadados de reunião do cliente:', err);
      showAlert('Erro', `Não foi possível atualizar o status do cliente: ${err.message}`, 'danger');
    }
  };

  // Impersonificação e redirecionamento de tela
  const handleImpersonation = async (client: Profile) => {
    try {
      const spaces = client.user_metadata?.initialized_spaces || [];
      const spaceToSet = spaces.includes('personal') 
        ? 'personal' 
        : (spaces.includes('business') ? 'business' : 'personal');

      // Define a flag de redirecionamento no localStorage
      localStorage.setItem('active_tab_redirect', 'meetings');
      
      // Inicia a impersonificação
      await impersonateUser(client.id);
      
      // Define o espaço ativo correspondente
      setActiveSpace(spaceToSet);

      showAlert('Modo Gestão', `Você entrou no modo de gestão para ${client.full_name}. Redirecionando para a aba Reuniões...`, 'success');
    } catch (err: any) {
      console.error('Erro ao entrar em Modo Gestão:', err);
      showAlert('Erro', 'Não foi possível gerenciar este usuário.', 'danger');
    }
  };

  // Geração de dias para o calendário consolidado usando date-fns
  const calendarDays = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const startOfWeekOfFirstDay = startOfWeek(start, { weekStartsOn: 0 }); // Domingo
    const endOfWeekOfLastDay = endOfWeek(end, { weekStartsOn: 0 });
    
    return eachDayOfInterval({ start: startOfWeekOfFirstDay, end: endOfWeekOfLastDay });
  }, [selectedDate]);

  // Mapear reuniões por dia
  const meetingsByDay = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    
    meetings.forEach(meeting => {
      if (!meeting.date) return;
      // Tratar a data para obter apenas o yyyy-MM-dd
      const dateKey = meeting.date.substring(0, 10);
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(meeting);
    });

    return map;
  }, [meetings]);

  // Função para abrir o detalhamento do dia no calendário
  const handleDayClick = (day: Date, dayMeetingsList: Meeting[]) => {
    if (dayMeetingsList.length > 0) {
      setSelectedCalendarDate(day);
      setDayMeetings(dayMeetingsList);
    }
  };

  // Utilitário para obter iniciais
  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '?';
  };

  // Mapear IDs de clientes aos seus respectivos nomes
  const clientNameMap = useMemo(() => {
    const map = new Map<string, string>();
    clients.forEach(c => map.set(c.id, c.full_name));
    return map;
  }, [clients]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Presentation className="text-primary" size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Painel de Reuniões</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
            Gestão de Reuniões
          </h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-2">
            Controle de agendamentos mensais dos clientes e calendário consolidado
          </p>
        </div>

        {/* Busca por Cliente e Configurar Agenda */}
        <div className="flex flex-col sm:flex-row gap-4 items-end w-full xl:w-auto">
          <div className="w-full sm:w-64 relative group">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1.5 ml-2">Buscar Cliente</label>
            <Search className="absolute left-4 bottom-3 text-muted-foreground" size={16} />
            <input 
              type="text"
              placeholder="Nome ou e-mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-xl h-11 pl-10 pr-4 text-xs text-foreground outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/60"
            />
          </div>
          <button
            onClick={handleOpenManualConfig}
            className="w-full sm:w-auto h-11 px-5 bg-card border border-border hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-foreground transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"
          >
            <CalendarClock size={14} className="text-primary" />
            Configurar Agenda
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'Total Pendente', 
            value: groupedClients.pending.length, 
            icon: AlertCircle, 
            color: 'text-rose-500', 
            bg: 'bg-rose-500/5 border-rose-500/10' 
          },
          { 
            label: 'Total Agendado', 
            value: groupedClients.scheduled.length, 
            icon: CheckCircle2, 
            color: 'text-emerald-500', 
            bg: 'bg-emerald-500/5 border-emerald-500/10' 
          },
          { 
            label: 'Dispensados (Mês)', 
            value: groupedClients.waived.length, 
            icon: CalendarClock, 
            color: 'text-amber-500', 
            bg: 'bg-amber-500/5 border-amber-500/10' 
          },
          { 
            label: 'Reuniões Canceladas', 
            value: groupedClients.cancelled.length, 
            icon: UserX, 
            color: 'text-slate-400', 
            bg: 'bg-slate-400/5 border-slate-400/10' 
          },
        ].map((stat, i) => (
          <div key={i} className={cn("bg-card border rounded-3xl p-6 flex items-center gap-4 shadow-sm transition-all hover:scale-[1.01]", stat.bg)}>
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-white dark:bg-slate-900 border shadow-sm text-foreground", stat.color)}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{stat.label}</p>
              <p className="text-2xl font-black text-foreground">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Layout Principal em duas colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Coluna da Esquerda: Lembretes de Agendamento por Status */}
        <div className="lg:col-span-5 bg-card border border-border rounded-[2rem] p-6 shadow-sm min-h-[500px] flex flex-col">
          <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <CalendarDays size={18} />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tighter text-foreground">Status de Agendamento</h2>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Acompanhamento e lembretes por cliente</p>
            </div>
          </div>

          {/* Abas Internas */}
          <div className="flex bg-muted/50 p-1 rounded-2xl border border-border gap-1 mb-6">
            {[
              { id: 'pending', label: 'Pendentes 🚨', count: groupedClients.pending.length },
              { id: 'scheduled', label: 'Agendados ✅', count: groupedClients.scheduled.length },
              { id: 'waived', label: 'Dispensados ⏳', count: groupedClients.waived.length },
              { id: 'cancelled', label: 'Cancelados ⏹️', count: groupedClients.cancelled.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveGroupTab(tab.id as any)}
                className={cn(
                  "flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5",
                  activeGroupTab === tab.id
                    ? "bg-white dark:bg-slate-900 border border-border shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{tab.label.split(' ')[0]}</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded-md text-[8px] font-black",
                  activeGroupTab === tab.id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Lista de Clientes do Grupo Selecionado */}
          <div className="flex-1 overflow-y-auto max-h-[420px] pr-1 space-y-3 custom-scrollbar">
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <Loader2 className="text-primary animate-spin" size={24} />
              </div>
            ) : (
              <>
                {activeGroupTab === 'pending' && (
                  groupedClients.pending.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <CheckCircle2 size={32} className="mx-auto mb-3 text-emerald-500 opacity-60" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma reunião pendente para este mês!</p>
                    </div>
                  ) : (
                    groupedClients.pending.map(client => (
                      <motion.div 
                        key={client.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-2xl bg-muted/40 border border-border hover:border-primary/20 transition-all flex flex-col gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-[11px] font-black flex items-center justify-center text-muted-foreground shrink-0 border border-border">
                            {getInitials(client.full_name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black uppercase tracking-tight text-foreground truncate">{client.full_name}</p>
                            <p className="text-[9px] font-bold text-muted-foreground truncate">{client.email}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/60">
                          <button
                            onClick={() => handleImpersonation(client)}
                            className="flex-1 h-9 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-primary/10"
                          >
                            <ExternalLink size={12} />
                            Agendar Reunião
                          </button>
                          
                          <button
                            onClick={() => handleUpdateStatus(client, { monthly_status: 'will_not_meet' })}
                            title="Dispensar reunião neste mês"
                            className="w-9 h-9 border border-border hover:bg-amber-500/5 hover:border-amber-500/30 hover:text-amber-500 rounded-xl transition-all flex items-center justify-center text-muted-foreground shrink-0"
                          >
                            <CalendarClock size={14} />
                          </button>
                          
                          <button
                            onClick={() => handleUpdateStatus(client, { meeting_status_action: 'cancel' })}
                            title="Cancelar reuniões a partir deste mês"
                            className="w-9 h-9 border border-border hover:bg-rose-500/5 hover:border-rose-500/30 hover:text-rose-500 rounded-xl transition-all flex items-center justify-center text-muted-foreground shrink-0"
                          >
                            <UserX size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )
                )}

                {activeGroupTab === 'scheduled' && (
                  groupedClients.scheduled.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Calendar size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Nenhum cliente com reunião agendada neste mês.</p>
                    </div>
                  ) : (
                    groupedClients.scheduled.map(client => {
                      const clientMeetings = meetings.filter(m => m.user_id === client.id && m.date?.startsWith(selectedMonthYear));
                      return (
                        <motion.div 
                          key={client.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-2xl bg-emerald-500/[0.02] border border-emerald-500/10 hover:border-emerald-500/30 transition-all flex flex-col gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 text-[11px] font-black flex items-center justify-center shrink-0 border border-emerald-500/20">
                              {getInitials(client.full_name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black uppercase tracking-tight text-foreground truncate">{client.full_name}</p>
                              <p className="text-[9px] font-bold text-muted-foreground truncate">{client.email}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-1.5 pt-2 border-t border-emerald-500/10">
                            {clientMeetings.map(m => (
                              <div key={m.id} className="flex items-center justify-between text-[9px] font-bold bg-white dark:bg-slate-900 border border-border p-2 rounded-lg text-foreground">
                                <span className="truncate pr-2">{m.title}</span>
                                <span className="text-primary flex items-center gap-1 shrink-0">
                                  <Clock size={10} />
                                  {m.date ? format(parseISO(m.date), 'dd/MM HH:mm') : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })
                  )
                )}

                {activeGroupTab === 'waived' && (
                  groupedClients.waived.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <CalendarClock size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Nenhum cliente dispensado este mês.</p>
                    </div>
                  ) : (
                    groupedClients.waived.map(client => (
                      <motion.div 
                        key={client.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-2xl bg-amber-500/[0.02] border border-amber-500/10 hover:border-amber-500/30 transition-all flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 text-[11px] font-black flex items-center justify-center shrink-0 border border-amber-500/20">
                            {getInitials(client.full_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-tight text-foreground truncate">{client.full_name}</p>
                            <p className="text-[9px] font-bold text-muted-foreground truncate">{client.email}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleUpdateStatus(client, { monthly_status: 'will_meet' })}
                          className="px-3 py-2 border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shrink-0"
                        >
                          Reativar
                        </button>
                      </motion.div>
                    ))
                  )
                )}

                {activeGroupTab === 'cancelled' && (
                  groupedClients.cancelled.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <UserX size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Nenhum cliente inativado de reuniões.</p>
                    </div>
                  ) : (
                    groupedClients.cancelled.map(client => (
                      <motion.div 
                        key={client.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-2xl bg-slate-500/[0.02] border border-slate-500/10 hover:border-slate-500/30 transition-all flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-500 text-[11px] font-black flex items-center justify-center shrink-0 border border-slate-500/20">
                            {getInitials(client.full_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-tight text-foreground truncate">{client.full_name}</p>
                            <p className="text-[9px] font-bold text-muted-foreground truncate">{client.email}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleUpdateStatus(client, { meeting_status_action: 'reactivate' })}
                          className="px-3 py-2 border border-slate-500/20 bg-slate-500/5 text-slate-600 dark:text-slate-400 hover:bg-slate-500/10 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shrink-0"
                        >
                          Reativar
                        </button>
                      </motion.div>
                    ))
                  )
                )}
              </>
            )}
          </div>
        </div>

        {/* Coluna da Direita: Calendário Mensal Consolidado */}
        <div className="lg:col-span-7 bg-card border border-border rounded-[2rem] p-6 shadow-sm flex flex-col">
          
          {/* Header Calendário */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Calendar size={18} />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tighter text-foreground">Calendário de Encontros</h2>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Visualização consolidada de todas as agendas</p>
              </div>
            </div>

            {/* Seleção de Mês */}
            <div className="flex items-center bg-muted/60 border border-border rounded-xl p-1 gap-2 self-start sm:self-auto shadow-inner">
              <button 
                onClick={() => setSelectedDate(prev => subMonths(prev, 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-border transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground px-3 select-none min-w-[130px] text-center">
                {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
              </span>
              
              <button 
                onClick={() => setSelectedDate(prev => addMonths(prev, 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-border transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Grid de Dias da Semana */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, idx) => (
              <div key={idx} className="text-center text-[9px] font-black uppercase tracking-widest text-slate-400 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Grid do Calendário */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayMeetingsList = meetingsByDay.get(dateStr) || [];
              const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
              const isTodayDay = isToday(day);

              return (
                <div 
                  key={idx} 
                  onClick={() => handleDayClick(day, dayMeetingsList)}
                  className={cn(
                    "min-h-[75px] max-h-[110px] p-2 rounded-2xl border transition-all flex flex-col gap-1 relative group overflow-hidden select-none",
                    isCurrentMonth 
                      ? "bg-muted/10 border-border" 
                      : "bg-muted/5 border-border/30 opacity-40",
                    isTodayDay && "border-primary bg-primary/[0.02]",
                    dayMeetingsList.length > 0 ? "cursor-pointer hover:border-primary/40 hover:bg-primary/[0.01]" : ""
                  )}
                >
                  {/* Dia Numérico */}
                  <span className={cn(
                    "text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-lg leading-none",
                    isTodayDay 
                      ? "bg-primary text-white shadow-sm shadow-primary/20" 
                      : "text-muted-foreground"
                  )}>
                    {day.getDate()}
                  </span>

                  {/* Listagem de Reuniões */}
                  <div className="flex-1 overflow-hidden space-y-1 flex flex-col justify-end">
                    {dayMeetingsList.slice(0, 2).map((meeting) => (
                      <div 
                        key={meeting.id} 
                        className="text-[7.5px] font-black uppercase tracking-tight py-0.5 px-1.5 bg-primary/10 border border-primary/20 text-primary rounded-md truncate leading-normal"
                        title={`${clientNameMap.get(meeting.user_id) || 'Cliente'}: ${meeting.title}`}
                      >
                        {clientNameMap.get(meeting.user_id)?.split(' ')[0] || 'Cliente'}
                      </div>
                    ))}
                    
                    {dayMeetingsList.length > 2 && (
                      <div className="text-[7px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                        + {dayMeetingsList.length - 2} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de Reuniões do Dia */}
      <AnimatePresence>
        {selectedCalendarDate && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedCalendarDate(null)} 
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl flex flex-col max-h-[80vh]"
            >
              {/* Fechar */}
              <button 
                onClick={() => setSelectedCalendarDate(null)}
                className="absolute top-6 right-6 w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-foreground hover:bg-slate-200 dark:hover:bg-white/10 transition-all z-10"
              >
                <X size={16} />
              </button>

              {/* Título */}
              <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-foreground">
                    Reuniões do Dia
                  </h3>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    {format(selectedCalendarDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>

              {/* Lista */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                {dayMeetings.map(meeting => {
                  const clientName = clientNameMap.get(meeting.user_id) || 'Cliente';
                  
                  return (
                    <div 
                      key={meeting.id} 
                      className="p-5 rounded-2xl bg-muted/30 border border-border flex flex-col gap-4 hover:border-primary/20 transition-all"
                    >
                      {/* Top Info */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-primary bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-md mb-1.5 inline-block">
                            {meeting.space === 'personal' ? 'Espaço Pessoal' : 'Espaço Empresarial'}
                          </span>
                          <h4 className="text-sm font-black uppercase text-foreground leading-tight tracking-tight">
                            {meeting.title}
                          </h4>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mt-1">
                            Cliente: <span className="text-foreground font-black">{clientName}</span>
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1 text-[9px] font-black text-primary bg-white dark:bg-slate-900 border border-border px-2 py-1 rounded-xl shadow-sm shrink-0">
                          <Clock size={11} />
                          {meeting.date ? format(parseISO(meeting.date), 'HH:mm') : ''}
                        </div>
                      </div>

                      {/* Tópicos Checklist */}
                      {meeting.topics && meeting.topics.length > 0 && (
                        <div className="space-y-2 bg-white dark:bg-slate-950 p-4 rounded-xl border border-border/80">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tópicos Abordados</p>
                          <div className="space-y-1.5">
                            {meeting.topics.map((t, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-[9px] font-bold text-foreground">
                                <div className={cn(
                                  "w-4 h-4 rounded flex items-center justify-center shrink-0 border",
                                  t.completed 
                                    ? "bg-emerald-500 border-emerald-500 text-white" 
                                    : "border-slate-200 dark:border-white/10"
                                )}>
                                  {t.completed && <Check size={10} strokeWidth={3} />}
                                </div>
                                <span className={t.completed ? "line-through text-muted-foreground" : "text-foreground"}>
                                  {t.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Observações */}
                      {meeting.observations && (
                        <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Observações</p>
                          <p className="text-[10px] font-medium text-muted-foreground bg-white dark:bg-slate-950 p-3 rounded-xl border border-border/80 italic">
                            "{meeting.observations}"
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Botão de Fechar */}
              <button 
                onClick={() => setSelectedCalendarDate(null)}
                className="w-full h-12 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors mt-6 shrink-0"
              >
                Voltar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Configuração de Clientes (Início de Agenda / Apenas App) */}
      <AnimatePresence>
        {showConfigModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => {
                setShowConfigModal(false);
                setShowAllInModal(false);
              }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl flex flex-col max-h-[85vh] z-10"
            >
              {/* Fechar */}
              <button 
                onClick={() => {
                  setShowConfigModal(false);
                  setShowAllInModal(false);
                }}
                className="absolute top-6 right-6 w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-foreground hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
              >
                <X size={16} />
              </button>

              {/* Título */}
              <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <Info size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-foreground">
                    Configurar Entrada na Agenda
                  </h3>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    {showAllInModal 
                      ? "Ajuste quando cada cliente ativo iniciará os agendamentos ou se usam apenas o app"
                      : "Defina quando os novos clientes iniciarão os agendamentos ou se usam apenas o app"
                    }
                  </p>
                </div>
              </div>

              {/* Descrição em Alerta */}
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide leading-relaxed">
                  {showAllInModal
                    ? "Altere a data de início de agendamento ou marque 'Apenas usa o app' para os clientes conforme desejado."
                    : "Clientes sem essa definição não aparecem nas listas do calendário e contam como pendências no banner de aviso. Defina os parâmetros abaixo para cada um deles."
                  }
                </p>
              </div>

              {/* Lista de Clientes */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                {(showAllInModal ? clients : unconfiguredClients).map((client) => {
                  const clientConfig = configs[client.id] || { startMonth: '', onlyApp: false };
                  
                  return (
                    <div 
                      key={client.id}
                      className="p-4 rounded-2xl bg-muted/30 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      {/* Cliente info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-[11px] font-black flex items-center justify-center text-muted-foreground shrink-0 border border-border">
                          {getInitials(client.full_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-tight text-foreground truncate">{client.full_name}</p>
                          <p className="text-[9px] font-bold text-muted-foreground truncate">{client.email}</p>
                        </div>
                      </div>

                      {/* Opções */}
                      <div className="flex flex-wrap items-center gap-4 shrink-0">
                        {/* Apenas usa o app */}
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={clientConfig.onlyApp}
                            onChange={(e) => {
                              setConfigs(prev => ({
                                ...prev,
                                [client.id]: {
                                  ...prev[client.id],
                                  onlyApp: e.target.checked,
                                  startMonth: e.target.checked ? '' : prev[client.id]?.startMonth || ''
                                }
                              }));
                            }}
                            className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                          />
                          <span className="text-[9px] font-black uppercase tracking-widest text-foreground">Apenas usa o app</span>
                        </label>

                        {/* Mês de Início */}
                        <div className="flex flex-col gap-1 w-44">
                          <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Mês de Início</label>
                          <input 
                            type="month"
                            disabled={clientConfig.onlyApp}
                            value={clientConfig.startMonth}
                            onChange={(e) => {
                              setConfigs(prev => ({
                                ...prev,
                                [client.id]: {
                                  ...prev[client.id],
                                  startMonth: e.target.value
                                }
                              }));
                            }}
                            className="bg-white dark:bg-slate-950 border border-border rounded-lg h-9 px-3 text-[10px] font-bold text-foreground outline-none focus:border-primary/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all w-full"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Ações */}
              <div className="flex gap-4 mt-6 shrink-0">
                <button 
                  onClick={() => {
                    setShowConfigModal(false);
                    setShowAllInModal(false);
                  }}
                  className="flex-1 h-12 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {showAllInModal ? "Cancelar" : "Configurar Depois"}
                </button>
                <button 
                  onClick={handleSaveConfigurations}
                  disabled={savingConfigs}
                  className="flex-1 h-12 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-primary/10 disabled:opacity-50"
                >
                  {savingConfigs ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <Check size={16} />
                      Salvar Configurações
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
