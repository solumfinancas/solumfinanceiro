import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  CheckSquare, 
  Plus, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Search,
  Loader2,
  Trash2,
  ChevronRight,
  Filter,
  X,
  StickyNote,
  MessageSquare,
  Edit,
  User,
  Send,
  Hourglass,
  Check,
  Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useModal } from '../contexts/ModalContext';
import { format, isPast, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Task {
  id: string;
  user_id: string;
  educator_id: string;
  title: string;
  instructions: string;
  deadline: string;
  completed: boolean;
  archived: boolean;
  created_at: string;
}

export const Tasks: React.FC = () => {
  const { user, profile, viewingUserId, viewingProfile } = useAuth();
  const { showAlert, showConfirm } = useModal();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'all' | 'archived'>('pending');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [educatorId, setEducatorId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const effectiveUserId = viewingUserId || user?.id;
  const isImpersonating = !!viewingUserId;

  const [newTask, setNewTask] = useState({
    title: '',
    instructions: '',
    deadline: format(new Date(), 'yyyy-MM-dd')
  });

  const fetchEducatorId = async () => {
    if (!user) return;
    
    // Se estiver impersonando, o educador é o usuário logado
    if (isImpersonating) {
      setEducatorId(user.id);
      return;
    }

    // Se for o próprio cliente, busca quem é o educador dele
    try {
      const { data, error } = await supabase
        .from('educator_clients')
        .select('educator_id')
        .eq('client_id', user.id)
        .single();
      
      if (data) {
        setEducatorId(data.educator_id);
      } else if (profile?.role === 'educator' || profile?.role === 'admin' || profile?.role === 'master_admin') {
        // Se for educador/admin e não tiver um gestor vinculado, ele é seu próprio gestor
        setEducatorId(user.id);
      }
    } catch (err) {
      console.error('Erro ao buscar educador:', err);
    }
  };

  const fetchTasks = async () => {
    if (!effectiveUserId) return;
    
    setLoading(true);
    try {
      // Fetch tasks and their comment counts
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_comments(count)
        `)
        .eq('user_id', effectiveUserId)
        .order('deadline', { ascending: true });

      if (error) throw error;
      
      // Map data to include commentCount
      const tasksWithCount = (data || []).map((t: any) => ({
        ...t,
        commentCount: t.task_comments?.[0]?.count || 0
      }));
      
      setTasks(tasksWithCount);
    } catch (err: any) {
      console.error('Erro ao buscar tarefas:', err);
      showAlert('Erro', 'Não foi possível carregar as tarefas.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEducatorId();
    fetchTasks();
  }, [effectiveUserId, profile]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveUserId || !educatorId) {
       showAlert('Atenção', 'Vínculo com educador não encontrado para criar tarefas.', 'warning');
       return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: effectiveUserId,
          educator_id: educatorId,
          title: newTask.title,
          instructions: newTask.instructions,
          deadline: new Date(newTask.deadline).toISOString(),
          completed: false
        })
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => [data, ...prev]);
      setShowCreateModal(false);
      setNewTask({ title: '', instructions: '', deadline: format(new Date(), 'yyyy-MM-dd') });
      showAlert('Sucesso', 'Tarefa criada com sucesso!', 'success');
    } catch (err: any) {
      showAlert('Erro', 'Não foi possível criar a tarefa.', 'danger');
    }
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

  const archiveTask = async (taskId: string, archive: boolean = true) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ archived: archive })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, archived: archive } : t));
      showAlert('Sucesso', archive ? 'Tarefa arquivada.' : 'Tarefa restaurada.', 'success');
      
      if (selectedTask?.id === taskId) {
        setShowDetailsModal(false);
      }
    } catch (err: any) {
      showAlert('Erro', 'Erro ao processar arquivamento.', 'danger');
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: editingTask.title,
          instructions: editingTask.instructions,
          deadline: new Date(editingTask.deadline).toISOString()
        })
        .eq('id', editingTask.id);

      if (error) throw error;

      setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t));
      setShowEditModal(false);
      showAlert('Sucesso', 'Tarefa atualizada.', 'success');
    } catch (err: any) {
      showAlert('Erro', 'Não foi possível atualizar a tarefa.', 'danger');
    }
  };

  const fetchComments = async (taskId: string) => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          *,
          profiles (full_name, role)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar comentários:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !editingTask || !user) return;

    try {
      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: editingTask.id,
          user_id: user.id,
          content: newComment.trim()
        })
        .select(`
          *,
          profiles (full_name, role)
        `)
        .single();

      if (error) throw error;

      setComments(prev => [...prev, data]);
      setNewComment('');
    } catch (err: any) {
      showAlert('Erro', 'Não foi possível enviar o comentário.', 'danger');
    }
  };

  const filteredAndSortedTasks = useMemo(() => {
    let result = tasks.filter(t => {
      // Se estiver na aba de arquivadas, mostra apenas arquivadas
      if (activeTab === 'archived') return t.archived;
      
      // Nas outras abas, esconde as arquivadas
      if (t.archived) return false;
      
      if (activeTab === 'pending') return !t.completed;
      if (activeTab === 'completed') return t.completed;
      return true;
    });

    if (showOverdueOnly) {
      result = result.filter(t => !t.completed && isPast(parseISO(t.deadline)) && !isToday(parseISO(t.deadline)));
    }

    // Sort by deadline (asc), then created_at (asc)
    return result.sort((a, b) => {
      const dateA = new Date(a.deadline).getTime();
      const dateB = new Date(b.deadline).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [tasks, activeTab, showOverdueOnly]);

  const formatDateLabel = (dateStr: string) => {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'Hoje';
    if (isTomorrow(d)) return 'Amanhã';
    return format(d, "dd 'de' MMMM", { locale: ptBR });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare className="text-primary" size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Produtividade</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
            Minhas Tarefas
          </h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-2">
            Organize seus objetivos financeiros e acompanhe seu progresso
          </p>
        </div>

        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-primary hover:scale-[1.02] active:scale-95 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all group shadow-xl shadow-primary/20"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Nova Tarefa</span>
        </button>
      </div>

      {/* Tabs & Quick Filters */}
      <div className="bg-card backdrop-blur-xl border border-border rounded-[2.5rem] p-6 flex flex-col xl:flex-row gap-6 shadow-xl shadow-slate-200/10 dark:shadow-none">
        <div className="flex gap-2 overflow-x-auto no-scrollbar items-center">
          {[
            { id: 'pending', label: 'Pendentes', icon: Clock },
            { id: 'completed', label: 'Concluídas', icon: CheckCircle2 },
            { id: 'all', label: 'Todas', icon: Filter },
            { id: 'archived', label: 'Arquivadas', icon: Archive }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2",
                activeTab === tab.id 
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                  : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
              <span className={cn(
                "ml-2 px-1.5 py-0.5 rounded-lg text-[9px] font-bold",
                activeTab === tab.id ? "bg-white/20" : "bg-muted-foreground/10"
              )}>
                {tasks.filter(t => {
                  if (tab.id === 'archived') return t.archived;
                  if (t.archived) return false;
                  if (tab.id === 'all') return true;
                  return tab.id === 'pending' ? !t.completed : t.completed;
                }).length}
              </span>
            </button>
          ))}
        </div>

        <div className="h-px xl:h-10 xl:w-px bg-border mx-2" />

        <button
          onClick={() => setShowOverdueOnly(!showOverdueOnly)}
          className={cn(
            "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2",
            showOverdueOnly 
              ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20" 
              : "bg-muted/50 border-border text-muted-foreground hover:border-rose-500/30"
          )}
        >
          <AlertCircle size={14} />
          Apenas Vencidas
          <span className={cn(
            "ml-2 px-1.5 py-0.5 rounded-lg text-[9px] font-bold",
            showOverdueOnly ? "bg-white/20" : "bg-rose-500/10 text-rose-500"
          )}>
            {tasks.filter(t => !t.completed && isPast(parseISO(t.deadline)) && !isToday(parseISO(t.deadline))).length}
          </span>
        </button>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="text-primary animate-spin" size={32} />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando tarefas...</p>
        </div>
      ) : filteredAndSortedTasks.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-[3rem] bg-muted/20 text-center px-4">
          <div className="w-20 h-20 rounded-[2rem] bg-muted flex items-center justify-center mb-6">
            <CheckSquare className="text-muted-foreground/40" size={32} />
          </div>
          <h3 className="text-xl font-black text-foreground uppercase tracking-tighter">Nada por aqui</h3>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-2">
            {showOverdueOnly 
              ? 'Você não possui tarefas vencidas. Ótimo trabalho!' 
              : activeTab === 'completed'
                ? 'Você ainda não concluiu nenhuma tarefa.'
                : 'Você está em dia com suas tarefas!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedTasks.map((task) => {
              const deadlineDate = parseISO(task.deadline);
              const isOverdue = !task.completed && isPast(deadlineDate) && !isToday(deadlineDate);
              
              return (
                <motion.div 
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => {
                    setSelectedTask(task);
                    setShowDetailsModal(true);
                  }}
                  className={cn(
                    "group relative bg-card border rounded-[2.5rem] p-8 transition-all shadow-xl hover:shadow-2xl overflow-hidden flex flex-col cursor-pointer active:scale-[0.98]",
                    isOverdue ? "border-rose-500/30 shadow-rose-500/5" : "border-border hover:border-primary/40 shadow-slate-200/40 dark:shadow-none"
                  )}
                >
                  {/* Status Indicator Strip */}
                  <div className={cn(
                    "absolute top-0 left-0 w-1.5 h-full",
                    task.completed ? "bg-emerald-500" : isOverdue ? "bg-rose-500" : "bg-primary"
                  )} />

                  <div className="flex items-start justify-between mb-6">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-inner",
                      task.completed ? "bg-emerald-500/10 text-emerald-500" : 
                      isOverdue ? "bg-rose-500/10 text-rose-500" : "bg-primary/10 text-primary"
                    )}>
                      {task.completed ? <CheckCircle2 size={24} /> : isOverdue ? <AlertCircle size={24} /> : <Clock size={24} />}
                    </div>
                    
                    <div className="flex gap-2">
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           setEditingTask(task);
                           fetchComments(task.id);
                           setShowCommentsModal(true);
                         }}
                         className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all border border-primary/20 relative"
                         title="Comentários e Chat"
                       >
                         <MessageSquare size={16} />
                         {(task as any).commentCount > 0 && (
                           <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900">
                             {(task as any).commentCount}
                           </span>
                         )}
                       </button>

                       {isImpersonating && !task.archived && (
                         <>
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               setEditingTask(task);
                               setShowEditModal(true);
                             }}
                             className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-primary hover:text-white transition-all border border-transparent hover:border-primary/20"
                             title="Editar Tarefa"
                           >
                             <Edit size={16} />
                           </button>

                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               deleteTask(task.id);
                             }}
                             className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-all border border-transparent hover:border-rose-500/20"
                             title="Excluir Tarefa"
                           >
                             <Trash2 size={16} />
                           </button>
                         </>
                       )}

                       {isImpersonating && (task.completed || task.archived) && (
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             archiveTask(task.id, !task.archived);
                           }}
                           className={cn(
                             "w-10 h-10 flex items-center justify-center rounded-xl transition-all border",
                             task.archived 
                               ? "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500 hover:text-white"
                               : "bg-muted/50 text-muted-foreground border-transparent hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900"
                           )}
                           title={task.archived ? "Desarquivar Tarefa" : "Arquivar Tarefa"}
                         >
                           <Archive size={16} />
                         </button>
                       )}
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

                    <div className="flex flex-col gap-3 pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <Calendar size={14} className="text-muted-foreground" />
                           <span className={cn(
                             "text-[10px] font-black uppercase tracking-widest",
                             isOverdue ? "text-rose-500" : "text-foreground"
                           )}>
                             {formatDateLabel(task.deadline)}
                           </span>
                         </div>
                         {isOverdue && (
                           <span className="px-2 py-0.5 rounded-lg bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest animate-pulse">
                             Vencida
                           </span>
                         )}
                      </div>
                    </div>
                  </div>

                  {!task.archived && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskCompletion(task.id, task.completed);
                      }}
                      className={cn(
                        "w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all mt-8 flex items-center justify-center gap-3 shadow-lg",
                        task.completed 
                          ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20" 
                          : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20"
                      )}
                    >
                      {task.completed ? (
                        <>
                          <Hourglass size={18} />
                          Marcar como Pendente
                        </>
                      ) : (
                        <>
                          <Circle size={18} />
                          Marcar como Concluída
                        </>
                      )}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create Task Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowCreateModal(false)} 
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
            >
               <button 
                 onClick={() => setShowCreateModal(false)}
                 className="absolute top-8 right-8 w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all z-10"
               >
                 <X size={20} />
               </button>
               
               <div className="flex items-center gap-3 mb-8">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                   <Plus size={20} />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Nova Tarefa</h2>
               </div>

               <form onSubmit={handleCreateTask} className="space-y-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Título da Tarefa</label>
                   <input 
                     required 
                     type="text" 
                     value={newTask.title} 
                     onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))} 
                     placeholder="Ex: Organizar faturas do mês" 
                     className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl h-14 px-6 text-sm text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all" 
                   />
                 </div>

                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Instruções</label>
                   <textarea 
                     required 
                     rows={4}
                     value={newTask.instructions} 
                     onChange={e => setNewTask(prev => ({ ...prev, instructions: e.target.value }))} 
                     placeholder="Descreva o que precisa ser feito..." 
                     className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl p-6 text-sm text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all resize-none" 
                   />
                 </div>

                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Prazo de Entrega</label>
                   <div className="relative">
                     <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                     <input 
                       required 
                       type="date" 
                       value={newTask.deadline} 
                       onChange={e => setNewTask(prev => ({ ...prev, deadline: e.target.value }))} 
                       className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl h-14 pl-14 pr-6 text-sm text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all" 
                     />
                   </div>
                 </div>

                 <button 
                   type="submit" 
                   className="w-full h-16 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                 >
                   Criar Tarefa
                 </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Task Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowDetailsModal(false)} 
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[3rem] shadow-2xl overflow-hidden"
            >
               {/* Modal Content */}
               <div className="p-10">
                 <div className="flex items-start justify-between mb-8">
                   <div className="flex items-center gap-4">
                     <div className={cn(
                       "w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner",
                       selectedTask.completed ? "bg-emerald-500/10 text-emerald-500" : 
                       isPast(parseISO(selectedTask.deadline)) && !isToday(parseISO(selectedTask.deadline)) ? "bg-rose-500/10 text-rose-500" : "bg-primary/10 text-primary"
                     )}>
                       {selectedTask.completed ? <CheckCircle2 size={28} /> : 
                        isPast(parseISO(selectedTask.deadline)) && !isToday(parseISO(selectedTask.deadline)) ? <AlertCircle size={28} /> : <Clock size={28} />}
                     </div>
                     <div>
                       <h2 className={cn(
                         "text-2xl font-black tracking-tight uppercase leading-none break-words break-all",
                         selectedTask.completed ? "text-muted-foreground" : "text-foreground"
                       )}>
                         {selectedTask.title}
                       </h2>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Detalhes da Tarefa</p>
                     </div>
                   </div>
                   <button 
                     onClick={() => setShowDetailsModal(false)}
                     className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                   >
                     <X size={24} />
                   </button>
                 </div>

                 <div className="space-y-8">
                   <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest text-primary">Instruções e Objetivos</label>
                     <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-3xl">
                       <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words break-all">
                         {selectedTask.instructions}
                       </p>
                     </div>
                   </div>

                   <div className="flex flex-wrap gap-4 items-center justify-between p-6 bg-primary/5 rounded-3xl border border-primary/10">
                     <div className="flex items-center gap-3">
                        <Calendar className="text-primary" size={20} />
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Prazo Limite</p>
                          <p className="text-sm font-black text-primary uppercase">
                            {formatDateLabel(selectedTask.deadline)}
                          </p>
                        </div>
                     </div>

                     <div className="flex items-center gap-2">
                       <button 
                         onClick={() => {
                           fetchComments(selectedTask.id);
                           setShowCommentsModal(true);
                           setShowDetailsModal(false);
                         }}
                         className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                       >
                         <MessageSquare size={16} />
                         Chat {(selectedTask as any).commentCount > 0 ? `(${(selectedTask as any).commentCount})` : ''}
                       </button>

                       {isImpersonating && !selectedTask.archived && (
                         <>
                           <button 
                             onClick={() => {
                               setEditingTask(selectedTask);
                               setShowEditModal(true);
                               setShowDetailsModal(false);
                             }}
                             className="p-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                             title="Editar"
                           >
                             <Edit size={18} />
                           </button>

                           <button 
                             onClick={() => {
                               deleteTask(selectedTask.id);
                               setShowDetailsModal(false);
                             }}
                             className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
                             title="Excluir"
                           >
                             <Trash2 size={18} />
                           </button>
                         </>
                       )}

                       {isImpersonating && (selectedTask.completed || selectedTask.archived) && (
                         <button 
                           onClick={() => archiveTask(selectedTask.id, !selectedTask.archived)}
                           className={cn(
                             "p-3 rounded-2xl transition-all border",
                             selectedTask.archived 
                               ? "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500 hover:text-white"
                               : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900"
                           )}
                           title={selectedTask.archived ? "Desarquivar" : "Arquivar"}
                         >
                           <Archive size={18} />
                         </button>
                       )}
                     </div>
                   </div>

                   {!selectedTask.archived && (
                     <button 
                       onClick={() => {
                         toggleTaskCompletion(selectedTask.id, selectedTask.completed);
                         setShowDetailsModal(false);
                       }}
                       className={cn(
                         "w-full h-16 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all mt-8 flex items-center justify-center gap-3 shadow-xl",
                         selectedTask.completed 
                           ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20" 
                           : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20"
                       )}
                     >
                       {selectedTask.completed ? (
                         <>
                           <Hourglass size={20} />
                           Marcar como Pendente
                         </>
                       ) : (
                         <>
                           <Circle size={20} />
                           Marcar como Concluída
                         </>
                       )}
                     </button>
                   )}
                 </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Task Modal */}
      <AnimatePresence>
        {showEditModal && editingTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowEditModal(false)} 
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
            >
               <button 
                 onClick={() => setShowEditModal(false)}
                 className="absolute top-8 right-8 w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all z-10"
               >
                 <X size={20} />
               </button>
               
               <div className="flex items-center gap-3 mb-8">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                   <Edit size={20} />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Editar Tarefa</h2>
               </div>

               <form onSubmit={handleUpdateTask} className="space-y-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Título da Tarefa</label>
                   <input 
                     required 
                     type="text" 
                     value={editingTask.title} 
                     onChange={e => setEditingTask(prev => ({ ...prev!, title: e.target.value }))} 
                     className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl h-14 px-6 text-sm text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all" 
                   />
                 </div>

                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Instruções</label>
                   <textarea 
                     required 
                     rows={4}
                     value={editingTask.instructions} 
                     onChange={e => setEditingTask(prev => ({ ...prev!, instructions: e.target.value }))} 
                     className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl p-6 text-sm text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all resize-none" 
                   />
                 </div>

                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Prazo de Entrega</label>
                   <div className="relative">
                     <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                     <input 
                       required 
                       type="date" 
                       value={editingTask.deadline.split('T')[0]} 
                       onChange={e => setEditingTask(prev => ({ ...prev!, deadline: e.target.value }))} 
                       className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl h-14 pl-14 pr-6 text-sm text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all" 
                     />
                   </div>
                 </div>

                 <button 
                   type="submit" 
                   className="w-full h-16 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                 >
                   Salvar Alterações
                 </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Comments (Chat) Modal */}
      <AnimatePresence>
        {showCommentsModal && editingTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowCommentsModal(false)} 
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] flex flex-col h-[80vh] shadow-2xl overflow-hidden"
            >
               {/* Modal Header */}
               <div className="p-8 border-b border-border flex items-center justify-between bg-card/50">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                     <MessageSquare size={24} />
                   </div>
                   <div>
                     <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate max-w-[300px]">
                       {editingTask.title}
                     </h2>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Central de Comentários</p>
                   </div>
                 </div>
                 <button 
                   onClick={() => setShowCommentsModal(false)}
                   className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                 >
                   <X size={20} />
                 </button>
               </div>

               {/* Chat Body */}
               <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50 dark:bg-slate-950/20 custom-scrollbar">
                 {loadingComments ? (
                   <div className="h-full flex items-center justify-center">
                     <Loader2 className="text-primary animate-spin" size={32} />
                   </div>
                 ) : comments.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                     <MessageSquare size={48} className="mb-4 text-muted-foreground" />
                     <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma mensagem ainda</p>
                     <p className="text-[9px] font-bold uppercase mt-1">Inicie a conversa abaixo</p>
                   </div>
                 ) : (
                   comments.map((comment, index) => {
                     const isMe = comment.user_id === user?.id;
                     const isEducator = comment.profiles?.role !== 'user';
                     
                     return (
                       <motion.div 
                         key={comment.id}
                         initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                         animate={{ opacity: 1, x: 0 }}
                         className={cn(
                           "flex flex-col max-w-[80%]",
                           isMe ? "ml-auto items-end" : "mr-auto items-start"
                         )}
                       >
                         <div className="flex items-center gap-2 mb-1.5 px-1">
                           <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                             {comment.profiles?.full_name}
                           </span>
                           {isEducator && (
                             <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                               Educador
                             </span>
                           )}
                         </div>
                         <div className={cn(
                           "p-4 rounded-2xl shadow-sm border",
                           isMe 
                            ? "bg-primary text-white border-primary rounded-tr-none" 
                            : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-border rounded-tl-none"
                         )}>
                           <p className="text-sm leading-relaxed">{comment.content}</p>
                         </div>
                         <span className="text-[8px] font-bold text-muted-foreground uppercase mt-1 px-1">
                           {format(new Date(comment.created_at), "HH:mm '•' dd MMM", { locale: ptBR })}
                         </span>
                       </motion.div>
                     );
                   })
                 )}
               </div>

               {/* Chat Footer */}
               {editingTask.archived ? (
                 <div className="p-6 bg-amber-500/5 border-t border-amber-500/10 text-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center justify-center gap-2">
                     <Archive size={14} />
                     Tarefa arquivada. Chat disponível apenas para leitura.
                   </p>
                 </div>
               ) : (
                 <form onSubmit={handleAddComment} className="p-6 bg-card border-t border-border">
                   <div className="relative">
                     <input 
                       type="text" 
                       value={newComment}
                       onChange={e => setNewComment(e.target.value)}
                       placeholder="Digite sua mensagem..."
                       className="w-full bg-slate-100 dark:bg-slate-950 border border-border rounded-2xl h-14 pl-6 pr-16 text-sm outline-none focus:border-primary/50 transition-all shadow-inner"
                     />
                     <button 
                       type="submit"
                       disabled={!newComment.trim()}
                       className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                     >
                       <Send size={18} />
                     </button>
                   </div>
                 </form>
               )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const formatDateLabel = (dateStr: string) => {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoje';
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  } catch (e) {
    return dateStr;
  }
};

const Circle = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
  </svg>
);
