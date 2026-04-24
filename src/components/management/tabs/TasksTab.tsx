import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { 
  CheckSquare, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Filter,
  Loader2,
  User,
  ArrowUpRight,
  Search,
  Users,
  Hourglass,
  Check,
  Edit,
  Trash2,
  X,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { useModal } from '../../../contexts/ModalContext';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskWithClient extends Task {
  client: {
    full_name: string;
  };
}

interface Task {
  id: string;
  user_id: string;
  educator_id: string;
  title: string;
  instructions: string;
  deadline: string;
  completed: boolean;
  created_at: string;
}

export const TasksTab: React.FC = () => {
  const { profile, impersonateUser } = useAuth();
  const { showAlert, showConfirm } = useModal();
  
  const [tasks, setTasks] = useState<TaskWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'all'>('pending');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const fetchAllTasks = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data: clientLinks, error: linksError } = await supabase
        .from('educator_clients')
        .select('client_id')
        .eq('educator_id', profile.id);
      
      if (linksError) throw linksError;
      
      const linkedClientIds = clientLinks?.map(link => link.client_id) || [];
      const allowedUserIds = [profile.id, ...linkedClientIds];
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          client:profiles!user_id (
            full_name
          ),
          task_comments(count)
        `)
        .in('user_id', allowedUserIds);

      if (error) throw error;
      
      setTasks(data as any[] || []);
    } catch (err: any) {
      console.error('Erro ao buscar tarefas:', err);
      showAlert('Erro', `Não foi possível carregar a lista de tarefas: ${err.message || 'Erro de conexão'}`, 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTasks();
  }, [profile]);

  const filteredAndSortedTasks = useMemo(() => {
    let result = tasks.filter(t => {
      const clientName = t.client?.full_name || '';
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           clientName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (activeTab === 'pending') return !t.completed;
      if (activeTab === 'completed') return t.completed;
      return true;
    });

    if (showOverdueOnly) {
      result = result.filter(t => !t.completed && isPast(parseISO(t.deadline)) && !isToday(parseISO(t.deadline)));
    }

    return result.sort((a, b) => {
      const dateA = new Date(a.deadline).getTime();
      const dateB = new Date(b.deadline).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [tasks, activeTab, showOverdueOnly, searchQuery]);

  const handleGoToClient = (clientId: string) => {
    localStorage.setItem('active_tab_redirect', 'tasks');
    impersonateUser(clientId);
  };

  const toggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !currentStatus })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentStatus } : t));
    } catch (err: any) {
      showAlert('Erro', 'Erro ao atualizar tarefa.', 'danger');
    }
  };

  const deleteTask = async (taskId: string) => {
    const confirmed = await showConfirm(
      'Excluir Tarefa',
      'Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.',
      { variant: 'danger', confirmText: 'Excluir', cancelText: 'Cancelar' }
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.filter(t => t.id !== taskId));
      showAlert('Sucesso', 'Tarefa excluída com sucesso.', 'success');
    } catch (err: any) {
      showAlert('Erro', 'Erro ao excluir tarefa.', 'danger');
    }
  };

  const formatDateLabel = (dateStr: string) => {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'Hoje';
    return format(d, "dd 'de' MMMM", { locale: ptBR });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Clock size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tarefas Pendentes</span>
          </div>
          <p className="text-3xl font-black tracking-tighter">{tasks.filter(t => !t.completed).length}</p>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertCircle size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Vencidas</span>
          </div>
          <p className="text-3xl font-black tracking-tighter text-rose-500">
            {tasks.filter(t => !t.completed && isPast(parseISO(t.deadline)) && !isToday(parseISO(t.deadline))).length}
          </p>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Concluídas</span>
          </div>
          <p className="text-3xl font-black tracking-tighter text-emerald-500">{tasks.filter(t => t.completed).length}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-[2rem] p-4 flex flex-col xl:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full xl:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por tarefa ou cliente..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-2xl h-12 pl-12 pr-4 text-sm outline-none focus:border-primary/50 transition-all"
          />
        </div>

        <div className="flex gap-2 w-full xl:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'pending', label: 'Pendentes' },
            { id: 'completed', label: 'Concluídas' },
            { id: 'all', label: 'Todas' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/10" 
                  : "bg-muted/30 border-border text-muted-foreground hover:border-primary/30"
              )}
            >
              {tab.label}
            </button>
          ))}
          
          <div className="w-px h-10 bg-border mx-1 hidden xl:block" />

          <button
            onClick={() => setShowOverdueOnly(!showOverdueOnly)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 whitespace-nowrap",
              showOverdueOnly 
                ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/10" 
                : "bg-rose-500/5 border-rose-500/20 text-rose-500 hover:bg-rose-500/10"
            )}
          >
            <AlertCircle size={14} />
            Vencidas
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="text-primary animate-spin" size={32} />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Carregando painel de tarefas...</p>
        </div>
      ) : filteredAndSortedTasks.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-[2.5rem] bg-muted/10 text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <CheckSquare className="text-muted-foreground/30" size={28} />
          </div>
          <h3 className="text-lg font-black text-foreground uppercase tracking-tighter">Nenhuma tarefa encontrada</h3>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1 max-w-xs">
            {searchQuery 
              ? 'Tente ajustar sua busca ou filtros.' 
              : activeTab === 'pending' 
                ? 'Não existem tarefas pendentes no momento.' 
                : 'Seus clientes ainda não possuem tarefas cadastradas.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedTasks.map((task) => {
              const deadlineDate = parseISO(task.deadline);
              const isOverdue = !task.completed && isPast(deadlineDate) && !isToday(deadlineDate);
              const commentCount = task.task_comments?.[0]?.count || 0;
              
              return (
                <motion.div 
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => {
                    setSelectedTask(task);
                    setShowDetailsModal(true);
                  }}
                  className={cn(
                    "group relative bg-card border rounded-[2.5rem] p-8 transition-all shadow-xl hover:shadow-2xl overflow-hidden flex flex-col cursor-pointer active:scale-[0.98]",
                    isOverdue ? "border-rose-500/30 shadow-rose-500/5" : "border-border hover:border-primary/40 shadow-slate-200/40 dark:shadow-none"
                  )}
                >
                  <div className={cn(
                    "absolute top-0 left-0 w-1.5 h-full",
                    task.completed ? "bg-emerald-500" : isOverdue ? "bg-rose-500" : "bg-primary"
                  )} />

                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-inner",
                        task.completed ? "bg-emerald-500/10 text-emerald-500" : 
                        isOverdue ? "bg-rose-500/10 text-rose-500" : "bg-primary/10 text-primary"
                      )}>
                        {task.completed ? <CheckCircle2 size={24} /> : isOverdue ? <AlertCircle size={24} /> : <Clock size={24} />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{task.client?.full_name || 'Usuário'}</p>
                        <p className="text-[8px] font-bold text-primary uppercase tracking-[0.2em]">Cliente</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskCompletion(task.id, task.completed);
                        }}
                        className={cn(
                          "p-2.5 rounded-xl transition-all shadow-sm active:scale-95 border",
                          task.completed 
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500 hover:text-white" 
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white"
                        )}
                        title={task.completed ? "Marcar como Pendente" : "Marcar como Concluída"}
                      >
                        {task.completed ? <Hourglass size={16} /> : <Check size={16} />}
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGoToClient(task.user_id);
                        }}
                        className="p-2.5 rounded-xl bg-primary/5 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95"
                        title="Ver Tarefas no Espaço do Cliente"
                      >
                        <ArrowUpRight size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className={cn(
                        "text-xl font-black tracking-tight leading-tight mb-3 break-words break-all",
                        task.completed ? "text-muted-foreground line-through decoration-emerald-500/40" : "text-foreground"
                      )}>
                        {task.title}
                      </h3>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed line-clamp-2">
                        {task.instructions}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-muted-foreground" />
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest",
                        isOverdue ? "text-rose-500" : "text-foreground"
                      )}>
                        {formatDateLabel(task.deadline)}
                      </span>
                    </div>
                    
                    {isOverdue && (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20">
                        Vencida
                      </span>
                    )}
                    
                    {task.completed && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">
                        Finalizada
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                       <div className="relative">
                         <MessageSquare size={14} className="text-muted-foreground" />
                         {commentCount > 0 && (
                           <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-slate-900">
                             {commentCount}
                           </span>
                         )}
                       </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showDetailsModal && selectedTask && (
          <TaskDetailsModal 
            task={selectedTask}
            onClose={() => setShowDetailsModal(false)}
            onToggleStatus={toggleTaskCompletion}
            onDelete={deleteTask}
            onGoToClient={handleGoToClient}
            formatDate={formatDateLabel}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const TaskDetailsModal: React.FC<{
  task: any;
  onClose: () => void;
  onToggleStatus: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  onGoToClient: (id: string) => void;
  formatDate: (d: string) => string;
}> = ({ task, onClose, onToggleStatus, onDelete, onGoToClient, formatDate }) => {
  const isOverdue = !task.completed && isPast(parseISO(task.deadline)) && !isToday(parseISO(task.deadline));
  const commentCount = task.task_comments?.[0]?.count || 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.9, opacity: 0 }} 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[3rem] shadow-2xl overflow-hidden"
      >
         <div className="p-10">
           <div className="flex items-start justify-between mb-8">
             <div className="flex items-center gap-4">
               <div className={cn(
                 "w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner",
                 task.completed ? "bg-emerald-500/10 text-emerald-500" : 
                 isOverdue ? "bg-rose-500/10 text-rose-500" : "bg-primary/10 text-primary"
               )}>
                 {task.completed ? <CheckCircle2 size={28} /> : isOverdue ? <AlertCircle size={28} /> : <Clock size={28} />}
               </div>
               <div>
                 <h2 className={cn(
                   "text-2xl font-black tracking-tight uppercase leading-none break-words break-all",
                   task.completed ? "text-muted-foreground" : "text-foreground"
                 )}>
                   {task.title}
                 </h2>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Cliente: {task.client?.full_name}</p>
               </div>
             </div>
             <button 
               onClick={onClose}
               className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
             >
               <X size={24} />
             </button>
           </div>

           <div className="space-y-8">
             <div className="space-y-3">
               <label className="text-[10px] font-black uppercase tracking-widest text-primary">Instruções para o Cliente</label>
               <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-3xl">
                 <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words break-all">
                   {task.instructions}
                 </p>
               </div>
             </div>

             <div className="flex flex-wrap gap-4 items-center justify-between p-6 bg-primary/5 rounded-3xl border border-primary/10">
               <div className="flex items-center gap-3">
                  <Calendar className="text-primary" size={20} />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Prazo Limite</p>
                    <p className="text-sm font-black text-primary uppercase">
                      {formatDate(task.deadline)}
                    </p>
                  </div>
               </div>

               <div className="flex items-center gap-2">
                 <button 
                   onClick={() => onGoToClient(task.user_id)}
                   className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                 >
                   <ArrowUpRight size={16} />
                   Ver Espaço do Cliente
                 </button>

                 <button 
                   onClick={() => {
                     onDelete(task.id);
                     onClose();
                   }}
                   className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                   title="Excluir Tarefa"
                 >
                   <Trash2 size={18} />
                 </button>
               </div>
             </div>

             <button 
               onClick={() => {
                 onToggleStatus(task.id, task.completed);
                 onClose();
               }}
               className={cn(
                 "w-full h-16 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl",
                 task.completed 
                   ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-white shadow-amber-500/10" 
                   : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20"
               )}
             >
               {task.completed ? (
                 <>
                   <Hourglass size={20} />
                   Marcar como Pendente
                 </>
               ) : (
                 <>
                   <Check size={20} />
                   Marcar como Concluída
                 </>
               )}
             </button>
           </div>
         </div>
      </motion.div>
    </div>
  );
};

const Circle: React.FC<{ size?: number; className?: string }> = ({ size = 16, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
  </svg>
);
