import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../FinanceContext';
import { supabase } from '../lib/supabase';
import {
  Presentation,
  Plus,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Search,
  Loader2,
  Trash2,
  Edit,
  User,
  Check,
  X,
  FileText,
  Bookmark,
  ChevronRight,
  ListTodo,
  FolderEdit,
  Save,
  ArrowUp,
  ArrowDown,
  GripVertical
} from 'lucide-react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { cn } from '../lib/utils';
import { useModal } from '../contexts/ModalContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Meeting, MeetingTopic, MeetingTemplate } from '../types';
import { IconRenderer } from './ui/IconRenderer';

const TemplateTopicItem: React.FC<{
  topic: { id: string; title: string; completed: boolean };
  index: number;
  onRemove: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
}> = ({ topic, index, onRemove, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(topic.title);
  const dragControls = useDragControls();

  const handleSave = () => {
    if (text.trim()) {
      onEdit(topic.id, text.trim());
      setIsEditing(false);
    }
  };

  useEffect(() => {
    setText(topic.title);
  }, [topic.title]);

  return (
    <Reorder.Item
      value={topic}
      dragListener={false}
      dragControls={dragControls}
      className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-border rounded-xl select-none gap-3 relative"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded text-slate-400 shrink-0 touch-none"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <GripVertical size={16} />
        </div>

        <span className="text-[9px] font-bold text-primary bg-primary/5 w-5 h-5 flex items-center justify-center rounded shrink-0">
          {index + 1}
        </span>

        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                } else if (e.key === 'Escape') {
                  setIsEditing(false);
                  setText(topic.title);
                }
              }}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg h-9 px-3 text-xs font-semibold text-foreground w-full outline-none focus:border-primary"
              autoFocus
            />
            <button
              type="button"
              onClick={handleSave}
              className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-colors shrink-0"
              title="Salvar"
            >
              <Check size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setText(topic.title);
              }}
              className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500/20 transition-colors shrink-0"
              title="Cancelar"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <span className="text-xs font-semibold text-foreground break-words leading-tight flex-1">
            {topic.title}
          </span>
        )}
      </div>

      {!isEditing && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
            title="Editar Tópico"
          >
            <Edit size={14} />
          </button>
          <button
            type="button"
            onClick={() => onRemove(topic.id)}
            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
            title="Remover Tópico"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </Reorder.Item>
  );
};

const STATIC_FALLBACK_TEMPLATES = [
  {
    title: "1ª Reunião: Alinhamento Inicial e Diagnóstico",
    topics: [
      { id: "t1-1", title: "Apresentação mútua e definição de objetivos de vida", completed: false },
      { id: "t1-2", title: "Alinhamento de expectativas e cronograma de encontros", completed: false },
      { id: "t1-3", title: "Instruções detalhadas para preenchimento da Anamnese", completed: false },
      { id: "t1-4", title: "Orientações sobre organization e importação de lançamentos", completed: false },
      { id: "t1-5", title: "Definição do canal de comunicação oficial e regras do processo", completed: false },
      { id: "t1-6", title: "Agendamento da próxima reunião", completed: false }
    ]
  },
  {
    title: "2ª Reunião: Orçamento e Fluxo de Caixa",
    topics: [
      { id: "t2-1", title: "Análise conjunta dos lançamentos coletados no primeiro mês", completed: false },
      { id: "t2-2", title: "Identificação de ralos financeiros (gastos supérfluos recorrentes)", completed: false },
      { id: "t2-3", title: "Definição de limites de gastos saudáveis por categoria", completed: false },
      { id: "t2-4", title: "Cálculo e definição da meta para a Reserva de Emergência", completed: false },
      { id: "t2-5", title: "Ajuste do fluxo de pagamento (vencimento de faturas e salários)", completed: false },
      { id: "t2-6", title: "Planejamento e orçamento básico para o próximo mês", completed: false }
    ]
  },
  {
    title: "3ª Reunião: Planejamento e Quitação de Dívidas",
    topics: [
      { id: "t3-1", title: "Levantamento detalhado de todos os credores, taxas e prazos", completed: false },
      { id: "t3-2", title: "Simulação de cenários de amortização nos simuladores financeiros", completed: false },
      { id: "t3-3", title: "Definição da estratégia de quitação (bola de neve vs taxa mais alta)", completed: false },
      { id: "t3-4", title: "Preparação de propostas e roteiro de negociação com credores", completed: false },
      { id: "t3-5", title: "Readequação do orçamento para focar na eliminação de pendências", completed: false }
    ]
  },
  {
    title: "4ª Reunião: Investimentos e Construção de Patrimônio",
    topics: [
      { id: "t4-1", title: "Aplicação do teste para identificação do perfil de investidor", completed: false },
      { id: "t4-2", title: "Estruturação dos investimentos recomendados para reserva de liquidez", completed: false },
      { id: "t4-3", title: "Introdução à Renda Fixa (CDB, LCI/LCA, Tesouro Direto)", completed: false },
      { id: "t4-4", title: "Planejamento de investimentos focados no longo prazo e aposentadoria", completed: false },
      { id: "t4-5", title: "Cálculo e definição do aporte mensal ideal no orçamento mensal", completed: false }
    ]
  },
  {
    title: "5ª Reunião: Acompanhamento de Metas e Planejamento Sazonal",
    topics: [
      { id: "t5-1", title: "Revisão geral da evolução do patrimônio líquido do cliente", completed: false },
      { id: "t5-2", title: "Mapeamento e provisão de despesas sazonais (IPVA, IPTU, seguros)", completed: false },
      { id: "t5-3", title: "Análise do cumprimento dos limites de orçamento definidos", completed: false },
      { id: "t5-4", title: "Ajuste fino nas metas financeiras de médio prazo (viagens, bens)", completed: false },
      { id: "t5-5", title: "Feedback geral do processo de mentoria e grau de autonomia", completed: false }
    ]
  }
];

export const Meetings: React.FC = () => {
  const { user, profile, viewingUserId } = useAuth();
  const { activeSpace, transactions, categories } = useFinance();
  const { showAlert, showConfirm } = useModal();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [templates, setTemplates] = useState<MeetingTemplate[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  const [loading, setLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showManageTemplatesModal, setShowManageTemplatesModal] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [meetingNotes, setMeetingNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [templateSpaceTab, setTemplateSpaceTab] = useState<'personal' | 'business'>('personal');

  // Estados para as Apresentações de Mentoria
  const [showPresentationsModal, setShowPresentationsModal] = useState(false);
  const [presentationMonth, setPresentationMonth] = useState<string>(() => format(new Date(), 'MM'));
  const [presentationYear, setPresentationYear] = useState<string>(() => format(new Date(), 'yyyy'));
  const [workSettings, setWorkSettings] = useState<Record<string, { days: number; hours: number }>>({});

  const selectedPresentationMonth = `${presentationYear}-${presentationMonth}`;

  // Form states
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    observations: '',
    notes: '',
    topics: [] as MeetingTopic[],
    templateIndex: '-1'
  });

  const [newTopicText, setNewTopicText] = useState('');

  // Estados para Gerenciamento de Modelos
  const [selectedTemplate, setSelectedTemplate] = useState<MeetingTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    title: '',
    order_index: 1,
    space: 'personal' as 'personal' | 'business',
    topics: [] as { id: string; title: string; completed: boolean }[]
  });
  const [newTemplateTopicText, setNewTemplateTopicText] = useState('');

  const effectiveUserId = viewingUserId || user?.id;
  const canManage = profile?.role && profile.role !== 'user';
  const isAdmin = profile?.role === 'master_admin' || profile?.role === 'admin';

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    let startYear = currentYear;
    
    if (user?.created_at) {
      try {
        const createdYear = new Date(user.created_at).getFullYear();
        if (createdYear < startYear) {
          startYear = createdYear;
        }
      } catch (e) {}
    }
    
    // Check oldest transaction to verify history is covered
    transactions.forEach(tx => {
      if (tx.date) {
        try {
          const txYear = new Date(tx.date).getFullYear();
          if (txYear < startYear) {
            startYear = txYear;
          }
        } catch (e) {}
      }
    });

    const years: number[] = [];
    for (let y = currentYear; y >= startYear; y--) {
      years.push(y);
    }
    return years;
  }, [user, transactions]);

  // Buscar modelos do banco de dados
  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const { data, error } = await supabase
        .from('meeting_templates')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;

      const formatted = (data || []).map((t: any) => ({
        ...t,
        topics: Array.isArray(t.topics) ? t.topics : []
      })) as MeetingTemplate[];

      setTemplates(formatted);
      if (formatted.length > 0) {
        setSelectedTemplate(formatted[0]);
      } else {
        setSelectedTemplate(null);
      }
    } catch (err: any) {
      console.error('Erro ao buscar modelos de reuniões:', err);
      // Fallback estático caso falhe
      const fallback = STATIC_FALLBACK_TEMPLATES.map((t, idx) => ({
        id: `fallback-${idx}`,
        title: t.title,
        topics: t.topics,
        order_index: idx + 1
      })) as MeetingTemplate[];
      setTemplates(fallback);
      if (fallback.length > 0) {
        setSelectedTemplate(fallback[0]);
      }
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Buscar reuniões do banco
  const fetchMeetings = async () => {
    if (!effectiveUserId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', effectiveUserId)
        .eq('space', activeSpace)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map((m: any) => ({
        ...m,
        topics: Array.isArray(m.topics) ? m.topics : [],
        notes: m.notes || null
      })) as Meeting[];

      setMeetings(formattedData);

      // Auto-selecionar a primeira reunião se houver e nenhuma estiver selecionada
      if (formattedData.length > 0) {
        const stillExists = selectedMeeting && formattedData.find(m => m.id === selectedMeeting.id);
        if (stillExists) {
          setSelectedMeeting(stillExists);
        } else {
          setSelectedMeeting(formattedData[0]);
        }
      } else {
        setSelectedMeeting(null);
      }
    } catch (err: any) {
      console.error('Erro ao buscar reuniões:', err);
      showAlert('Erro', 'Não foi possível carregar as reuniões.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchTemplates();
  }, [effectiveUserId, activeSpace]);

  // Sincronizar dados do formulário do modelo selecionado
  useEffect(() => {
    if (selectedTemplate) {
      setTemplateForm({
        title: selectedTemplate.title,
        order_index: selectedTemplate.order_index,
        space: selectedTemplate.space || 'personal',
        topics: [...selectedTemplate.topics]
      });
    } else {
      setTemplateForm({
        title: '',
        order_index: templates.length + 1,
        space: activeSpace as 'personal' | 'business',
        topics: []
      });
    }
  }, [selectedTemplate]);

  // Sincronizar anotações locais quando a reunião selecionada mudar
  useEffect(() => {
    if (selectedMeeting) {
      setMeetingNotes(selectedMeeting.notes || '');
    } else {
      setMeetingNotes('');
    }
  }, [selectedMeeting]);

  // Carregar configurações de trabalho do localStorage ao mudar de cliente
  useEffect(() => {
    if (!effectiveUserId) return;
    const key = `solum_work_settings_${effectiveUserId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setWorkSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Erro ao carregar workSettings:', e);
        setWorkSettings({});
      }
    } else {
      setWorkSettings({});
    }
  }, [effectiveUserId]);

  // Função para atualizar configurações de dias/horas de trabalho de um mês
  const handleUpdateWorkSetting = (monthKey: string, field: 'days' | 'hours', value: number) => {
    if (!effectiveUserId) return;
    const current = workSettings[monthKey] || { days: 22, hours: 8 };
    const updated = {
      ...workSettings,
      [monthKey]: {
        ...current,
        [field]: value
      }
    };
    setWorkSettings(updated);
    localStorage.setItem(`solum_work_settings_${effectiveUserId}`, JSON.stringify(updated));
  };

  // Agrupar transações por mês e categoria no Espaço Pessoal
  const monthlyFinanceData = useMemo(() => {
    const data: Record<string, {
      monthKey: string;
      label: string;
      incomeTotal: number;
      expensesByCategory: Record<string, {
        categoryId: string;
        name: string;
        color: string;
        icon: string;
        amount: number;
      }>;
    }> = {};

    // Filtrar lançamentos do Espaço Pessoal (exclusivo para essa apresentação)
    const personalTxs = transactions.filter(tx => tx.space === 'personal');

    personalTxs.forEach(tx => {
      if (!tx.date) return;
      const monthKey = tx.date.substring(0, 7); // 'YYYY-MM'
      
      if (!data[monthKey]) {
        let label = monthKey;
        try {
          const [year, month] = monthKey.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1, 15);
          label = format(date, "MMMM 'de' yyyy", { locale: ptBR });
          label = label.charAt(0).toUpperCase() + label.slice(1);
        } catch (e) {}

        data[monthKey] = {
          monthKey,
          label,
          incomeTotal: 0,
          expensesByCategory: {}
        };
      }

      if (tx.type === 'income') {
        data[monthKey].incomeTotal += tx.amount;
      } else if (tx.type === 'expense') {
        const subCategory = categories.find(c => c.id === tx.categoryId);
        let targetCategory = subCategory;
        if (subCategory && subCategory.parentId) {
          const parentCategory = categories.find(c => c.id === subCategory.parentId);
          if (parentCategory) {
            targetCategory = parentCategory;
          }
        }

        const catId = targetCategory?.id || 'outros';
        const catName = targetCategory?.name || 'Outros';
        const catColor = targetCategory?.color || '#94a3b8';
        const catIcon = targetCategory?.icon || '/categorias/outros.png';

        if (!data[monthKey].expensesByCategory[catId]) {
          data[monthKey].expensesByCategory[catId] = {
            categoryId: catId,
            name: catName,
            color: catColor,
            icon: catIcon,
            amount: 0
          };
        }
        data[monthKey].expensesByCategory[catId].amount += tx.amount;
      }
    });

    const sortedKeys = Object.keys(data).sort((a, b) => b.localeCompare(a));
    const sortedData = sortedKeys.map(key => data[key]);

    return {
      months: sortedData,
      map: data
    };
  }, [transactions, categories]);

  // Filtrar reuniões por query de busca e ordenar por data decrescente (mais recente primeiro)
  const filteredMeetings = useMemo(() => {
    return [...meetings]
      .filter(m =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.observations && m.observations.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => {
        // Ordenação decrescente por data (YYYY-MM-DD)
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;

        // Desempate decrescente por data/hora de criação (created_at)
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      });
  }, [meetings, searchQuery]);

  // Carregar modelo no formulário de criação de reunião
  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      // Copiar os tópicos gerando novos IDs temporários
      const newTopics = template.topics.map((t, i) => ({
        id: `topic-temp-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
        title: t.title,
        completed: false
      }));

      setMeetingForm(prev => ({
        ...prev,
        title: template.title,
        topics: newTopics,
        templateIndex: templateId
      }));
    } else {
      setMeetingForm(prev => ({
        ...prev,
        templateIndex: '-1'
      }));
    }
  };

  // Adicionar tópico ao formulário de reunião
  const handleAddTopicToForm = () => {
    if (!newTopicText.trim()) return;
    const newTopic: MeetingTopic = {
      id: `topic-temp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: newTopicText.trim(),
      completed: false
    };
    setMeetingForm(prev => ({
      ...prev,
      topics: [...prev.topics, newTopic]
    }));
    setNewTopicText('');
  };

  // Remover tópico do formulário de reunião
  const handleRemoveTopicFromForm = (id: string) => {
    setMeetingForm(prev => ({
      ...prev,
      topics: prev.topics.filter(t => t.id !== id)
    }));
  };

  // Submeter criação de reunião
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveUserId) return;
    if (!meetingForm.title.trim()) {
      showAlert('Atenção', 'Por favor, informe o título da reunião.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('meetings')
        .insert({
          user_id: effectiveUserId,
          space: activeSpace,
          title: meetingForm.title.trim(),
          date: meetingForm.date,
          topics: meetingForm.topics,
          observations: meetingForm.observations.trim() || null,
          notes: (meetingForm.notes || '').trim() || null,
          created_by: user?.id || null
        })
        .select()
        .single();

      if (error) throw error;

      const newMeeting = {
        ...data,
        topics: Array.isArray(data.topics) ? data.topics : [],
        notes: data.notes || null
      } as Meeting;

      setMeetings(prev => [newMeeting, ...prev]);
      setSelectedMeeting(newMeeting);
      setShowCreateModal(false);

      // Reset form
      setMeetingForm({
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        observations: '',
        notes: '',
        topics: [],
        templateIndex: '-1'
      });

      showAlert('Sucesso', 'Reunião registrada com sucesso!', 'success');
    } catch (err: any) {
      console.error('Erro ao salvar reunião:', err);
      showAlert('Erro', 'Não foi possível registrar a reunião.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  // Preparar e abrir modal de edição de reunião
  const handleOpenEditModal = () => {
    if (!selectedMeeting) return;
    setMeetingForm({
      title: selectedMeeting.title,
      date: selectedMeeting.date,
      observations: selectedMeeting.observations || '',
      notes: selectedMeeting.notes || '',
      topics: [...selectedMeeting.topics],
      templateIndex: '-1'
    });
    setShowEditModal(true);
  };

  // Salvar edição de reunião
  const handleUpdateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting) return;
    if (!meetingForm.title.trim()) {
      showAlert('Atenção', 'Por favor, informe o título da reunião.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('meetings')
        .update({
          title: meetingForm.title.trim(),
          date: meetingForm.date,
          topics: meetingForm.topics,
          observations: meetingForm.observations.trim() || null,
          notes: (meetingForm.notes || '').trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedMeeting.id)
        .select()
        .single();

      if (error) throw error;

      const updated = {
        ...data,
        topics: Array.isArray(data.topics) ? data.topics : [],
        notes: data.notes || null
      } as Meeting;

      setMeetings(prev => prev.map(m => m.id === selectedMeeting.id ? updated : m));
      setSelectedMeeting(updated);
      setShowEditModal(false);
      showAlert('Sucesso', 'Reunião atualizada com sucesso!', 'success');
    } catch (err: any) {
      console.error('Erro ao editar reunião:', err);
      showAlert('Erro', 'Não foi possível atualizar a reunião.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  // Excluir reunião
  const handleDeleteMeeting = async (meetingId: string) => {
    const confirmed = await showConfirm(
      'Excluir Reunião',
      'Tem certeza que deseja excluir esta reunião? Todos os checklists e observações vinculados serão perdidos permanentemente.',
      { variant: 'danger', confirmText: 'Excluir', cancelText: 'Cancelar' }
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId);

      if (error) throw error;

      setMeetings(prev => prev.filter(m => m.id !== meetingId));
      if (selectedMeeting?.id === meetingId) {
        setSelectedMeeting(null);
      }
      showAlert('Sucesso', 'Reunião excluída com sucesso!', 'success');
    } catch (err: any) {
      console.error('Erro ao excluir reunião:', err);
      showAlert('Erro', 'Não foi possível excluir a reunião.', 'danger');
    }
  };

  // Salvar anotações feitas durante a reunião
  const handleSaveNotes = async () => {
    if (!selectedMeeting) return;
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from('meetings')
        .update({
          notes: meetingNotes.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedMeeting.id);

      if (error) throw error;

      // Atualizar estado local
      const updatedMeeting = { ...selectedMeeting, notes: meetingNotes.trim() || null };
      setSelectedMeeting(updatedMeeting);
      setMeetings(prev => prev.map(m => m.id === selectedMeeting.id ? updatedMeeting : m));
      showAlert('Sucesso', 'Anotações da reunião salvas com sucesso!', 'success');
    } catch (err: any) {
      console.error('Erro ao salvar anotações:', err);
      showAlert('Erro', 'Não foi possível salvar as anotações.', 'danger');
    } finally {
      setSavingNotes(false);
    }
  };

  // Marcar/Desmarcar tópico diretamente no painel de detalhes (salvamento em tempo real)
  const handleToggleTopic = async (topicId: string, currentStatus: boolean) => {
    if (!selectedMeeting || !canManage) return;

    const updatedTopics = selectedMeeting.topics.map(t =>
      t.id === topicId ? { ...t, completed: !currentStatus } : t
    );

    // Atualização otimista
    const updatedMeeting = { ...selectedMeeting, topics: updatedTopics };
    setSelectedMeeting(updatedMeeting);
    setMeetings(prev => prev.map(m => m.id === selectedMeeting.id ? updatedMeeting : m));

    try {
      const { error } = await supabase
        .from('meetings')
        .update({ topics: updatedTopics, updated_at: new Date().toISOString() })
        .eq('id', selectedMeeting.id);

      if (error) throw error;
    } catch (err: any) {
      console.error('Erro ao atualizar tópico:', err);
      fetchMeetings();
    }
  };

  // --- GERENCIAMENTO DE MODELOS DE REUNIÃO ---

  // Adicionar tópico ao formulário de modelo
  const handleAddTopicToTemplateForm = () => {
    if (!newTemplateTopicText.trim()) return;
    const newTopic = {
      id: `topic-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: newTemplateTopicText.trim(),
      completed: false
    };
    setTemplateForm(prev => ({
      ...prev,
      topics: [...prev.topics, newTopic]
    }));
    setNewTemplateTopicText('');
  };

  // Remover tópico do formulário de modelo
  const handleRemoveTopicFromTemplateForm = (id: string) => {
    setTemplateForm(prev => ({
      ...prev,
      topics: prev.topics.filter(t => t.id !== id)
    }));
  };

  // Iniciar criação de um novo modelo
  const handleInitNewTemplate = () => {
    setSelectedTemplate(null);
    setTemplateForm({
      title: '',
      order_index: templates.filter(t => t.space === templateSpaceTab).length + 1,
      space: templateSpaceTab,
      topics: []
    });
  };

  // Salvar ou Atualizar Modelo
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!templateForm.title.trim()) {
      showAlert('Atenção', 'Informe o título do modelo.', 'warning');
      return;
    }

    setSavingTemplate(true);
    try {
      if (selectedTemplate) {
        // Atualizar
        const { data, error } = await supabase
          .from('meeting_templates')
          .update({
            title: templateForm.title.trim(),
            order_index: templateForm.order_index,
            space: templateForm.space,
            topics: templateForm.topics,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTemplate.id)
          .select()
          .single();

        if (error) throw error;
        showAlert('Sucesso', 'Modelo atualizado com sucesso!', 'success');
      } else {
        // Inserir
        const { data, error } = await supabase
          .from('meeting_templates')
          .insert({
            title: templateForm.title.trim(),
            order_index: templateForm.order_index,
            space: templateForm.space,
            topics: templateForm.topics
          })
          .select()
          .single();

        if (error) throw error;
        showAlert('Sucesso', 'Novo modelo criado com sucesso!', 'success');
      }

      await fetchTemplates();
    } catch (err: any) {
      console.error('Erro ao salvar modelo:', err);
      showAlert('Erro', 'Não foi possível salvar o modelo.', 'danger');
    } finally {
      setSavingTemplate(false);
    }
  };

  // Excluir Modelo
  const handleDeleteTemplate = async () => {
    if (!selectedTemplate || !isAdmin) return;

    const confirmed = await showConfirm(
      'Excluir Modelo',
      `Tem certeza que deseja excluir o modelo "${selectedTemplate.title}"? Isso não afetará reuniões que já foram criadas a partir dele.`,
      { variant: 'danger', confirmText: 'Excluir', cancelText: 'Cancelar' }
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('meeting_templates')
        .delete()
        .eq('id', selectedTemplate.id);

      if (error) throw error;

      showAlert('Sucesso', 'Modelo excluído com sucesso.', 'success');
      await fetchTemplates();
    } catch (err: any) {
      console.error('Erro ao excluir modelo:', err);
      showAlert('Erro', 'Não foi possível excluir o modelo.', 'danger');
    }
  };

  // Formatar data localmente
  const formatDateLabel = (dateStr: string) => {
    try {
      const parsedDate = parseISO(dateStr);
      return format(parsedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (err) {
      return dateStr;
    }
  };

  // Calcular progresso do checklist
  const getMeetingProgress = (meeting: Meeting) => {
    if (!meeting.topics || meeting.topics.length === 0) return 0;
    const completedCount = meeting.topics.filter(t => t.completed).length;
    return Math.round((completedCount / meeting.topics.length) * 100);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Presentation className="text-primary" size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Acompanhamento</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
            Reuniões de Mentoria
          </h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-2">
            Estrutura cronológica de encontros e checklists personalizados
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {isAdmin && (
            <button
              onClick={() => {
                fetchTemplates();
                setTemplateSpaceTab(activeSpace as 'personal' | 'business');
                setShowManageTemplatesModal(true);
              }}
              className="bg-card hover:bg-muted text-foreground border border-border px-6 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all group hover:scale-[1.02] active:scale-95 shadow-sm"
            >
              <FolderEdit size={18} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Editar Modelos</span>
            </button>
          )}

          {activeSpace === 'personal' && (
            <button
              onClick={() => {
                setShowPresentationsModal(true);
              }}
              className="bg-card hover:bg-muted text-foreground border border-border px-6 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all group hover:scale-[1.02] active:scale-95 shadow-sm"
            >
              <Presentation size={18} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Apresentações</span>
            </button>
          )}

          {canManage && (
            <button
              onClick={() => {
                setMeetingForm({
                  title: '',
                  date: format(new Date(), 'yyyy-MM-dd'),
                  observations: '',
                  notes: '',
                  topics: [],
                  templateIndex: '-1'
                });
                setShowCreateModal(true);
              }}
              className="bg-primary hover:scale-[1.02] active:scale-95 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all group shadow-xl shadow-primary/20"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Registrar Reunião</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Column - Meetings List (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card backdrop-blur-xl border border-border rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/10 dark:shadow-none space-y-6">

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Buscar reuniões..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl h-12 pl-12 pr-5 text-xs text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all placeholder:font-semibold"
              />
            </div>

            {/* Meetings Timeline */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 no-scrollbar">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="text-primary animate-spin" size={24} />
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Buscando encontros...</p>
                </div>
              ) : filteredMeetings.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nenhuma reunião encontrada</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    {searchQuery ? 'Tente outros termos de busca' : 'Registre a primeira reunião para iniciar'}
                  </p>
                </div>
              ) : (
                filteredMeetings.map((meeting) => {
                  const progress = getMeetingProgress(meeting);
                  const isSelected = selectedMeeting?.id === meeting.id;

                  return (
                    <motion.div
                      key={meeting.id}
                      onClick={() => setSelectedMeeting(meeting)}
                      className={cn(
                        "p-5 rounded-2xl border transition-all cursor-pointer text-left relative group select-none overflow-hidden",
                        isSelected
                          ? "bg-primary/5 border-primary shadow-lg shadow-primary/5"
                          : "bg-muted/30 border-border/50 hover:bg-muted/60 hover:border-primary/30"
                      )}
                      whileHover={{ x: 2 }}
                    >
                      {/* Left bar indicator */}
                      <div className={cn(
                        "absolute left-0 top-0 bottom-0 w-1.5 transition-all",
                        isSelected ? "bg-primary" : "bg-transparent group-hover:bg-primary/40"
                      )} />

                      <div className="space-y-3 pl-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                            <Calendar size={12} className="text-primary/70" />
                            {meeting.date.split('-').reverse().join('/')}
                          </span>

                          {progress === 100 ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest">
                              Concluído
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-muted-foreground">
                              {progress}% concluído
                            </span>
                          )}
                        </div>

                        <h3 className={cn(
                          "text-sm font-black tracking-tight leading-tight uppercase line-clamp-2",
                          isSelected ? "text-primary" : "text-foreground"
                        )}>
                          {meeting.title}
                        </h3>

                        {/* Progress Bar Mini */}
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              progress === 100 ? "bg-emerald-500" : "bg-primary"
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

          </div>
        </div>

        {/* Right Column - Meeting Details (8 cols) */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {selectedMeeting ? (
              <motion.div
                key={selectedMeeting.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-card backdrop-blur-xl border border-border rounded-[2.5rem] p-8 lg:p-10 shadow-xl shadow-slate-200/10 dark:shadow-none space-y-8"
              >
                {/* Details Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-border pb-8">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Calendar size={12} className="text-primary" />
                        {formatDateLabel(selectedMeeting.date)}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black uppercase tracking-widest text-primary">
                        Espaço {selectedMeeting.space === 'personal' ? 'Pessoal' : 'Empresarial'}
                      </span>
                    </div>

                    <h2 className="text-2xl lg:text-3xl font-black tracking-tighter text-foreground uppercase leading-tight">
                      {selectedMeeting.title}
                    </h2>
                  </div>

                  {canManage && (
                    <div className="flex gap-2 self-start md:self-auto">
                      <button
                        onClick={handleOpenEditModal}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-primary hover:text-white transition-all border border-transparent hover:border-primary/20"
                        title="Editar Encontro"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteMeeting(selectedMeeting.id)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-all border border-transparent hover:border-rose-500/20"
                        title="Excluir Encontro"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress bar large */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span>Progresso da Reunião</span>
                    <span className="text-primary font-black">{getMeetingProgress(selectedMeeting)}% Concluído</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-3 rounded-full overflow-hidden border border-border/30">
                    <div
                      className="bg-gradient-to-r from-primary to-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${getMeetingProgress(selectedMeeting)}%` }}
                    />
                  </div>
                </div>

                {/* Topics Checklist */}
                <div className="space-y-4">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 mb-4">
                    <ListTodo size={16} />
                    Tópicos a serem trabalhados
                  </h3>

                  {selectedMeeting.topics.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-border rounded-3xl bg-muted/10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nenhum tópico cadastrado nesta reunião</p>
                      {canManage && (
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Clique em editar para adicionar checklists</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {selectedMeeting.topics.map((topic) => (
                        <div
                          key={topic.id}
                          onClick={() => canManage && handleToggleTopic(topic.id, topic.completed)}
                          className={cn(
                            "flex items-center gap-4 p-5 rounded-2xl border transition-all select-none",
                            canManage ? "cursor-pointer hover:bg-muted/30" : "cursor-default",
                            topic.completed
                              ? "bg-emerald-500/5 border-emerald-500/20 text-muted-foreground"
                              : "bg-slate-50 dark:bg-slate-950/40 border-border"
                          )}
                        >
                          <div className={cn(
                            "w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all",
                            topic.completed
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950"
                          )}>
                            {topic.completed && <Check size={14} strokeWidth={3} />}
                          </div>

                          <span className={cn(
                            "text-xs font-semibold leading-snug break-words flex-1",
                            topic.completed && "line-through text-slate-400 dark:text-slate-500"
                          )}>
                            {topic.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Observations */}
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 mb-4">
                    <FileText size={16} />
                    Observações Iniciais do Registro
                  </h3>

                  <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-3xl min-h-[80px]">
                    {selectedMeeting.observations ? (
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {selectedMeeting.observations}
                      </p>
                    ) : (
                      <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest italic py-2">
                        Nenhuma observação registrada para este encontro.
                      </p>
                    )}
                  </div>
                </div>

                {/* Live Meeting Notes */}
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 mb-4">
                    <FolderEdit size={16} />
                    Anotações e Dúvidas (Em Tempo Real)
                  </h3>

                  <div className="space-y-3">
                    <textarea
                      disabled={!canManage || savingNotes}
                      rows={5}
                      value={meetingNotes}
                      onChange={e => setMeetingNotes(e.target.value)}
                      placeholder={canManage ? "Digite aqui anotações importantes, dúvidas dos clientes ou acordos feitos em tempo real..." : "Nenhuma anotação registrada pelo mentor."}
                      className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-3xl p-6 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-primary/50 transition-all resize-none font-semibold leading-relaxed"
                    />

                    {canManage && (
                      <AnimatePresence>
                        {((meetingNotes || '') !== (selectedMeeting.notes || '')) && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="flex justify-end pt-1"
                          >
                            <button
                              onClick={handleSaveNotes}
                              disabled={savingNotes}
                              className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-primary/10"
                            >
                              {savingNotes ? (
                                <Loader2 className="animate-spin" size={12} />
                              ) : (
                                <Save size={12} />
                              )}
                              Salvar Anotações
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                </div>

              </motion.div>
            ) : (
              <div className="bg-card backdrop-blur-xl border border-border rounded-[2.5rem] p-20 shadow-xl shadow-slate-200/10 dark:shadow-none text-center flex flex-col items-center justify-center gap-6 min-h-[500px]">
                <div className="w-20 h-20 rounded-[2rem] bg-primary/5 flex items-center justify-center mb-2">
                  <Presentation className="text-primary/40" size={36} />
                </div>
                <h3 className="text-xl font-black text-foreground uppercase tracking-tighter">Nenhum Encontro Selecionado</h3>
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                  Selecione uma das reuniões listadas na barra lateral ou registre uma nova reunião para acompanhar o cliente.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Modal Criar Reunião */}
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
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar"
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
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Registrar Reunião</h2>
              </div>

              <form onSubmit={handleCreateMeeting} className="space-y-6">

                {/* Sugestões de Modelos Dinâmicos */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 flex items-center gap-1.5">
                    <Bookmark size={12} className="text-primary" />
                    Utilizar Modelo de Reunião (Opcional)
                  </label>
                  {templatesLoading ? (
                    <div className="h-14 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl flex items-center px-6 gap-2">
                      <Loader2 className="animate-spin text-primary" size={16} />
                      <span className="text-xs text-muted-foreground font-semibold">Carregando modelos...</span>
                    </div>
                  ) : (
                    <select
                      value={meetingForm.templateIndex}
                      onChange={e => handleTemplateChange(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl h-14 px-6 text-sm text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all font-semibold"
                    >
                      <option value="-1">-- Criar Do Zero (Formulário Livre) --</option>
                      {templates
                        .filter(tmpl => tmpl.space === activeSpace)
                        .map((tmpl) => (
                          <option key={tmpl.id} value={tmpl.id}>{tmpl.title}</option>
                        ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Título */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Título da Reunião</label>
                    <input
                      required
                      type="text"
                      value={meetingForm.title}
                      onChange={e => setMeetingForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: 1ª Reunião: Alinhamento Inicial"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl h-14 px-6 text-sm text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all font-semibold"
                    />
                  </div>

                  {/* Data */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Data da Reunião</label>
                    <div className="relative">
                      <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <input
                        required
                        type="date"
                        value={meetingForm.date}
                        onChange={e => setMeetingForm(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl h-14 pl-14 pr-6 text-sm text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Topics Section */}
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Checklist de Tópicos da Reunião</label>

                  {/* Add Topic Bar */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Adicionar novo tópico ao checklist..."
                      value={newTopicText}
                      onChange={e => setNewTopicText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTopicToForm();
                        }
                      }}
                      className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl h-12 px-6 text-xs text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddTopicToForm}
                      className="bg-primary hover:bg-primary/95 text-white px-5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Plus size={16} />
                      Adicionar
                    </button>
                  </div>

                  {/* Topics List in Form com suporte a Drag and Drop */}
                  {meetingForm.topics.length === 0 ? (
                    <div className="max-h-[220px] overflow-y-auto border border-border/50 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/10 no-scrollbar min-h-[100px] flex items-center justify-center">
                      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest italic text-center">Nenhum tópico adicionado.</p>
                    </div>
                  ) : (
                    <Reorder.Group
                      axis="y"
                      values={meetingForm.topics}
                      onReorder={(newOrder) => {
                        setMeetingForm(prev => ({ ...prev, topics: newOrder }));
                      }}
                      className="max-h-[220px] overflow-y-auto space-y-2 border border-border/50 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/10 no-scrollbar"
                    >
                      {meetingForm.topics.map((t, index) => (
                        <TemplateTopicItem
                          key={t.id}
                          topic={t}
                          index={index}
                          onRemove={handleRemoveTopicFromForm}
                          onEdit={(id, newText) => {
                            const updated = meetingForm.topics.map(topic => topic.id === id ? { ...topic, title: newText } : topic);
                            setMeetingForm(prev => ({ ...prev, topics: updated }));
                          }}
                        />
                      ))}
                    </Reorder.Group>
                  )}
                </div>

                {/* Observações */}
                <div className="space-y-2 pt-4 border-t border-border/50">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Observações Iniciais do Registro</label>
                  <textarea
                    rows={3}
                    value={meetingForm.observations}
                    onChange={e => setMeetingForm(prev => ({ ...prev, observations: e.target.value }))}
                    placeholder="Descreva observações de planejamento ou preparação..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl p-6 text-sm text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all resize-none font-semibold"
                  />
                </div>

                {/* Anotações da Reunião (Durante o Encontro) */}
                <div className="space-y-2 pt-4 border-t border-border/50">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Anotações da Reunião (Opcional)</label>
                  <textarea
                    rows={3}
                    value={meetingForm.notes}
                    onChange={e => setMeetingForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notas feitas em tempo real ou dúvidas levantadas no encontro..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl p-6 text-sm text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all resize-none font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-16 bg-primary disabled:opacity-50 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4 flex items-center justify-center"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : 'Registrar Reunião'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Editar Reunião */}
      <AnimatePresence>
        {showEditModal && (
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
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar"
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
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Editar Reunião</h2>
              </div>

              <form onSubmit={handleUpdateMeeting} className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Título */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Título da Reunião</label>
                    <input
                      required
                      type="text"
                      value={meetingForm.title}
                      onChange={e => setMeetingForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: 1ª Reunião: Alinhamento Inicial"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl h-14 px-6 text-sm text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all font-semibold"
                    />
                  </div>

                  {/* Data */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Data da Reunião</label>
                    <div className="relative">
                      <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <input
                        required
                        type="date"
                        value={meetingForm.date}
                        onChange={e => setMeetingForm(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl h-14 pl-14 pr-6 text-sm text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Topics Section */}
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Checklist de Tópicos</label>

                  {/* Add Topic Bar */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Adicionar novo tópico ao checklist..."
                      value={newTopicText}
                      onChange={e => setNewTopicText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTopicToForm();
                        }
                      }}
                      className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl h-12 px-6 text-xs text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddTopicToForm}
                      className="bg-primary hover:bg-primary/95 text-white px-5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Plus size={16} />
                      Adicionar
                    </button>
                  </div>

                  {/* Topics List in Form com suporte a Drag and Drop */}
                  {meetingForm.topics.length === 0 ? (
                    <div className="max-h-[220px] overflow-y-auto border border-border/50 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/10 no-scrollbar min-h-[100px] flex items-center justify-center">
                      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest italic text-center">Nenhum tópico adicionado.</p>
                    </div>
                  ) : (
                    <Reorder.Group
                      axis="y"
                      values={meetingForm.topics}
                      onReorder={(newOrder) => {
                        setMeetingForm(prev => ({ ...prev, topics: newOrder }));
                      }}
                      className="max-h-[220px] overflow-y-auto space-y-2 border border-border/50 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/10 no-scrollbar"
                    >
                      {meetingForm.topics.map((t, index) => (
                        <TemplateTopicItem
                          key={t.id}
                          topic={t}
                          index={index}
                          onRemove={handleRemoveTopicFromForm}
                          onEdit={(id, newText) => {
                            const updated = meetingForm.topics.map(topic => topic.id === id ? { ...topic, title: newText } : topic);
                            setMeetingForm(prev => ({ ...prev, topics: updated }));
                          }}
                        />
                      ))}
                    </Reorder.Group>
                  )}
                </div>

                {/* Observações */}
                <div className="space-y-2 pt-4 border-t border-border/50">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Observações Iniciais</label>
                  <textarea
                    rows={3}
                    value={meetingForm.observations}
                    onChange={e => setMeetingForm(prev => ({ ...prev, observations: e.target.value }))}
                    placeholder="Descreva detalhes adicionais..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl p-6 text-sm text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all resize-none font-semibold"
                  />
                </div>

                {/* Anotações da Reunião (Durante o Encontro) */}
                <div className="space-y-2 pt-4 border-t border-border/50">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Anotações da Reunião (Durante o Encontro)</label>
                  <textarea
                    rows={3}
                    value={meetingForm.notes}
                    onChange={e => setMeetingForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Anotações feitas durante a reunião..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl p-6 text-sm text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all resize-none font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-16 bg-primary disabled:opacity-50 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4 flex items-center justify-center"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Alterações'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Gerenciamento de Modelos (Somente Admin) */}
      <AnimatePresence>
        {showManageTemplatesModal && isAdmin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowManageTemplatesModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Fechar */}
              <button
                onClick={() => setShowManageTemplatesModal(false)}
                className="absolute top-8 right-8 w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all z-10"
              >
                <X size={20} />
              </button>

              {/* Título */}
              <div className="flex items-center gap-3 mb-6 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FolderEdit size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Gerenciar Modelos</h2>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Defina checklists e roteiros pré-prontos</p>
                </div>
              </div>

              {/* Grid Principal */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 overflow-hidden flex-1 min-h-0">

                {/* Lateral Esquerda - Lista de Modelos (4 cols) */}
                <div className="md:col-span-4 flex flex-col h-full overflow-hidden border-r border-border/50 pr-4">
                  {/* Selector de Abas de Espaço nos Modelos */}
                  <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl mb-4 flex-shrink-0 border border-slate-200 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        setTemplateSpaceTab('personal');
                        setSelectedTemplate(null);
                        setTemplateForm({
                          title: '',
                          order_index: templates.filter(t => t.space === 'personal').length + 1,
                          space: 'personal',
                          topics: []
                        });
                      }}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                        templateSpaceTab === 'personal'
                          ? "bg-white dark:bg-slate-900 text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Pessoal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTemplateSpaceTab('business');
                        setSelectedTemplate(null);
                        setTemplateForm({
                          title: '',
                          order_index: templates.filter(t => t.space === 'business').length + 1,
                          space: 'business',
                          topics: []
                        });
                      }}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                        templateSpaceTab === 'business'
                          ? "bg-white dark:bg-slate-900 text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Empresarial
                    </button>
                  </div>

                  <button
                    onClick={handleInitNewTemplate}
                    className="w-full h-12 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all mb-4 flex-shrink-0"
                  >
                    <Plus size={16} />
                    Novo Modelo
                  </button>

                  <div className="space-y-2 overflow-y-auto flex-1 pr-1 no-scrollbar">
                    {templates
                      .filter(tmpl => tmpl.space === templateSpaceTab)
                      .map((tmpl, idx) => {
                        const isTemplateSelected = selectedTemplate?.id === tmpl.id;
                        return (
                          <div
                            key={tmpl.id}
                            onClick={() => setSelectedTemplate(tmpl)}
                            className={cn(
                              "p-4 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between group",
                              isTemplateSelected
                                ? "bg-primary/5 border-primary"
                                : "bg-slate-50 dark:bg-slate-950/20 border-border hover:bg-muted/50"
                            )}
                          >
                            <div className="pr-2 flex-1 min-w-0">
                              <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">Ordem: {tmpl.order_index}</span>
                              <h4 className={cn("text-xs font-black uppercase whitespace-normal break-words leading-tight mt-0.5", isTemplateSelected ? "text-primary" : "text-foreground")}>
                                {tmpl.title}
                              </h4>
                            </div>
                            <ChevronRight size={14} className={cn("transition-transform", isTemplateSelected ? "text-primary translate-x-1" : "text-muted-foreground")} />
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Lateral Direita - Formulário de Edição (8 cols) */}
                <div className="md:col-span-8 flex flex-col h-full overflow-y-auto pr-2 no-scrollbar">
                  <form onSubmit={handleSaveTemplate} className="space-y-6 flex-1 flex flex-col">
                    <div className="space-y-4 flex-shrink-0">
                      <div className="flex items-center justify-between border-b border-border/50 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                          {selectedTemplate ? 'Editar Modelo Selecionado' : 'Configurar Novo Modelo'}
                        </span>
                        {selectedTemplate && (
                          <button
                            type="button"
                            onClick={handleDeleteTemplate}
                            className="text-rose-500 hover:text-rose-600 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors"
                          >
                            <Trash2 size={12} />
                            Excluir Modelo
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Título do Modelo */}
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Título do Modelo</label>
                          <input
                            required
                            type="text"
                            value={templateForm.title}
                            onChange={e => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Ex: 6ª Reunião: Planejamento Tributário"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl h-11 px-4 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all"
                          />
                        </div>

                        {/* Espaço do Modelo */}
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Espaço do Modelo</label>
                          <select
                            value={templateForm.space}
                            onChange={e => setTemplateForm(prev => ({ ...prev, space: e.target.value as 'personal' | 'business' }))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl h-11 px-4 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all cursor-pointer"
                          >
                            <option value="personal">Pessoal</option>
                            <option value="business">Empresarial</option>
                          </select>
                        </div>

                        {/* Ordem de Exibição */}
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Ordem (Index)</label>
                          <input
                            required
                            type="number"
                            min="1"
                            value={templateForm.order_index}
                            onChange={e => setTemplateForm(prev => ({ ...prev, order_index: parseInt(e.target.value, 10) || 1 }))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl h-11 px-4 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Topics Checklist Management */}
                    <div className="space-y-4 flex-1 min-h-[150px] flex flex-col">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Tópicos do Checklist Sugerido</label>

                      {/* Adicionar Tópico ao Modelo */}
                      <div className="flex gap-2 flex-shrink-0">
                        <input
                          type="text"
                          placeholder="Texto da tarefa recomendada..."
                          value={newTemplateTopicText}
                          onChange={e => setNewTemplateTopicText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTopicToTemplateForm();
                            }
                          }}
                          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl h-11 px-4 text-xs text-slate-900 dark:text-white outline-none focus:border-primary/50 transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleAddTopicToTemplateForm}
                          className="bg-primary hover:bg-primary/95 text-white px-4 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                        >
                          <Plus size={14} />
                          Inserir
                        </button>
                      </div>

                      {/* Lista de tópicos no modelo com suporte a Drag and Drop */}
                      {templateForm.topics.length === 0 ? (
                        <div className="flex-1 overflow-y-auto border border-border/50 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/10 no-scrollbar min-h-[150px] flex items-center justify-center">
                          <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest italic text-center py-8">Nenhum tópico sugerido. Adicione tópicos acima.</p>
                        </div>
                      ) : (
                        <Reorder.Group
                          axis="y"
                          values={templateForm.topics}
                          onReorder={(newOrder) => {
                            setTemplateForm(prev => ({ ...prev, topics: newOrder }));
                          }}
                          className="flex-1 overflow-y-auto space-y-2 border border-border/50 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/10 no-scrollbar min-h-[150px]"
                        >
                          {templateForm.topics.map((topic, index) => (
                            <TemplateTopicItem
                              key={topic.id}
                              topic={topic}
                              index={index}
                              onRemove={handleRemoveTopicFromTemplateForm}
                              onEdit={(id, newText) => {
                                const updated = templateForm.topics.map(t => t.id === id ? { ...t, title: newText } : t);
                                setTemplateForm(prev => ({ ...prev, topics: updated }));
                              }}
                            />
                          ))}
                        </Reorder.Group>
                      )}
                    </div>

                    {/* Botões de Ação */}
                    <div className="pt-4 border-t border-border/50 flex gap-3 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowManageTemplatesModal(false)}
                        className="flex-1 h-12 bg-slate-100 dark:bg-white/5 text-muted-foreground hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Fechar
                      </button>
                      <button
                        type="submit"
                        disabled={savingTemplate}
                        className="flex-[2] h-12 bg-primary disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/10 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        {savingTemplate ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <>
                            <Save size={16} />
                            Salvar Modelo
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Apresentações de Mentoria (Exclusivo Espaço Pessoal) */}
      <AnimatePresence>
        {showPresentationsModal && activeSpace === 'personal' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPresentationsModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
            >
              {/* Fechar */}
              <button
                onClick={() => setShowPresentationsModal(false)}
                className="absolute top-8 right-8 w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all z-10"
              >
                <X size={20} />
              </button>

              {/* Título */}
              <div className="flex items-center gap-3 mb-6 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Presentation size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Apresentações de Mentoria</h2>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Painel interativo para análise de impacto e metas do cliente</p>
                </div>
              </div>

              {/* Grid Principal */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 overflow-hidden flex-1 min-h-0">
                {/* Lateral Esquerda - Lista de Apresentações (3 cols) */}
                <div className="md:col-span-3 flex flex-col h-full overflow-hidden border-r border-border/50 pr-4 flex-shrink-0">
                  <div className="space-y-2 overflow-y-auto flex-1 pr-1 no-scrollbar">
                    <div className="p-4 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between bg-primary/5 border-primary">
                      <div className="pr-2 flex-1 min-w-0">
                        <span className="text-[8px] font-black uppercase tracking-wider text-primary">Análise Pessoal</span>
                        <h4 className="text-xs font-black uppercase whitespace-normal break-words leading-tight mt-0.5 text-primary">
                          Valor da Hora Trabalhada
                        </h4>
                      </div>
                      <ChevronRight size={14} className="text-primary translate-x-1" />
                    </div>
                  </div>
                </div>

                {/* Lateral Direita - Conteúdo do Slide "Valor da Hora Trabalhada" (9 cols) */}
                <div className="md:col-span-9 flex flex-col h-full overflow-y-auto pr-2 no-scrollbar">
                  {monthlyFinanceData.months.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-3xl bg-muted/10">
                      <AlertCircle className="text-muted-foreground mb-4" size={36} />
                      <h4 className="text-sm font-black uppercase text-foreground">Nenhum lançamento de receita encontrado</h4>
                      <p className="text-xs text-muted-foreground max-w-sm mt-2 leading-relaxed">
                        Para calcular o valor da hora trabalhada, é necessário que o cliente tenha transações de receita (entradas) lançadas no Espaço Pessoal.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Seletor de Mês/Ano e Inputs de Simulação */}
                      <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border border-border rounded-3xl space-y-4">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                          <div className="space-y-2 flex-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                              Selecione o Mês e Ano de Análise
                            </label>
                            <div className="flex flex-wrap gap-3">
                              <select
                                value={presentationMonth}
                                onChange={e => setPresentationMonth(e.target.value)}
                                className="bg-white dark:bg-slate-900 border border-border rounded-xl h-11 px-4 text-xs font-bold text-foreground outline-none focus:border-primary/50 transition-all cursor-pointer min-w-[140px]"
                              >
                                <option value="01">Janeiro</option>
                                <option value="02">Fevereiro</option>
                                <option value="03">Março</option>
                                <option value="04">Abril</option>
                                <option value="05">Maio</option>
                                <option value="06">Junho</option>
                                <option value="07">Julho</option>
                                <option value="08">Agosto</option>
                                <option value="09">Setembro</option>
                                <option value="10">Outubro</option>
                                <option value="11">Novembro</option>
                                <option value="12">Dezembro</option>
                              </select>
                              <select
                                value={presentationYear}
                                onChange={e => setPresentationYear(e.target.value)}
                                className="bg-white dark:bg-slate-900 border border-border rounded-xl h-11 px-4 text-xs font-bold text-foreground outline-none focus:border-primary/50 transition-all cursor-pointer min-w-[100px]"
                              >
                                {availableYears.map(y => (
                                  <option key={y} value={String(y)}>{y}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Inputs de Configuração */}
                          <div className="flex gap-4">
                            <div className="space-y-2 w-28">
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Dias Trabalhados</label>
                              <input
                                type="number"
                                min="1"
                                max="31"
                                value={workSettings[selectedPresentationMonth]?.days ?? 22}
                                onChange={e => handleUpdateWorkSetting(selectedPresentationMonth, 'days', parseInt(e.target.value) || 1)}
                                className="w-full bg-white dark:bg-slate-900 border border-border rounded-xl h-11 px-3 text-xs font-bold text-foreground text-center outline-none focus:border-primary"
                              />
                            </div>
                            <div className="space-y-2 w-28">
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Horas por Dia</label>
                              <input
                                type="number"
                                min="1"
                                max="24"
                                value={workSettings[selectedPresentationMonth]?.hours ?? 8}
                                onChange={e => handleUpdateWorkSetting(selectedPresentationMonth, 'hours', parseInt(e.target.value) || 1)}
                                className="w-full bg-white dark:bg-slate-900 border border-border rounded-xl h-11 px-3 text-xs font-bold text-foreground text-center outline-none focus:border-primary"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cards de Métricas Consolidadas */}
                      {(() => {
                        const monthData = monthlyFinanceData.map[selectedPresentationMonth] || {
                          monthKey: selectedPresentationMonth,
                          label: '',
                          incomeTotal: 0,
                          expensesByCategory: {}
                        };

                        const days = workSettings[selectedPresentationMonth]?.days ?? 22;
                        const hours = workSettings[selectedPresentationMonth]?.hours ?? 8;
                        const totalHours = days * hours;
                        const incomeTotal = monthData.incomeTotal;
                        const hourlyValue = totalHours > 0 ? incomeTotal / totalHours : 0;

                        return (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 text-left">
                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Receitas Totais</span>
                                <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(incomeTotal)}
                                </div>
                                <span className="text-[8px] font-bold text-muted-foreground uppercase mt-1 block">Soma de todos os ganhos</span>
                              </div>

                              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 text-left">
                                <span className="text-[8px] font-black uppercase tracking-widest text-primary">Horas de Trabalho</span>
                                <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                                  {totalHours} horas
                                </div>
                                <span className="text-[8px] font-bold text-muted-foreground uppercase mt-1 block">{days} dias × {hours} horas por dia</span>
                              </div>

                              <div className="bg-gradient-to-br from-primary/10 to-emerald-500/10 border border-primary/20 rounded-2xl p-5 text-left relative overflow-hidden">
                                <span className="text-[8px] font-black uppercase tracking-widest text-primary">Seu Valor por Hora</span>
                                <div className="text-2xl font-black text-primary mt-1">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(hourlyValue)}
                                </div>
                                <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mt-1 block font-black">Quanto vale cada hora trabalhada</span>
                              </div>
                            </div>

                            {/* Impacto do Estilo de Vida */}
                            <div className="space-y-4">
                              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                                Impacto das Despesas no Tempo de Trabalho
                              </h3>
                              <p className="text-[10px] text-muted-foreground leading-relaxed uppercase font-bold tracking-wider">
                                Quantas horas da sua vida você trabalhou neste mês para pagar cada categoria de despesa?
                              </p>

                              {Object.keys(monthData.expensesByCategory).length === 0 ? (
                                <div className="p-8 text-center border border-dashed border-border rounded-2xl bg-muted/5">
                                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest italic">Nenhuma despesa registrada neste mês.</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {(Object.values(monthData.expensesByCategory) as Array<{
                                    categoryId: string;
                                    name: string;
                                    color: string;
                                    icon: string;
                                    amount: number;
                                  }>)
                                    .sort((a, b) => b.amount - a.amount)
                                    .map(expense => {
                                      const hoursRequired = hourlyValue > 0 ? expense.amount / hourlyValue : 0;
                                      
                                      const wholeHours = Math.floor(hoursRequired);
                                      const minutes = Math.round((hoursRequired - wholeHours) * 60);
                                      
                                      let durationText = '';
                                      if (wholeHours > 0) {
                                        durationText += `${wholeHours}h `;
                                      }
                                      if (minutes > 0 || wholeHours === 0) {
                                        durationText += `${minutes}min`;
                                      }

                                      const pctOfTotalHours = totalHours > 0 ? (hoursRequired / totalHours) * 100 : 0;

                                      return (
                                        <div
                                          key={expense.categoryId}
                                          className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-border rounded-2xl space-y-3 hover:scale-[1.005] transition-all"
                                        >
                                          <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                              <IconRenderer
                                                icon={expense.icon}
                                                color={expense.color}
                                                size={32}
                                                circular={false}
                                                className="rounded-lg shrink-0"
                                              />
                                              <div>
                                                <h4 className="text-xs font-black uppercase text-foreground">{expense.name}</h4>
                                                <span className="text-[9px] font-semibold text-muted-foreground">
                                                  Gasto: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.amount)}
                                                </span>
                                              </div>
                                            </div>

                                            <div className="text-right">
                                              <div className="text-xs font-black text-primary uppercase">
                                                {durationText} de trabalho
                                              </div>
                                            </div>
                                          </div>

                                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                            <div
                                              className="h-full rounded-full transition-all duration-500"
                                              style={{
                                                backgroundColor: expense.color,
                                                width: `${Math.min(pctOfTotalHours, 100)}%`
                                              }}
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
