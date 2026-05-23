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
  GripVertical,
  ShoppingCart,
  PiggyBank,
  Building,
  Handshake,
  Plane,
  CreditCard,
  TrendingUp,
  Users,
  Shield,
  Activity,
  Key,
  Briefcase,
  Palmtree,
  Coins,
  Star,
  Eye,
  EyeOff,
  Lock
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

const TOPIC_ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  PiggyBank,
  Building,
  Handshake,
  Plane,
  CreditCard,
  TrendingUp,
  Coins,
  Shield,
  Activity,
  Key,
  Briefcase,
  Palmtree,
  Star
};

interface MentorshipTopic {
  id: string;
  title: string;
  category: 'fundacoes' | 'otimizacao' | 'protecao' | 'futuro';
  categoryLabel: string;
  iconName: string;
  shortDesc: string;
  whyCrucial: string;
  bullets: string[];
  flags: string[];
  color: string;
}

const MENTORSHIP_TOPICS: MentorshipTopic[] = [
  {
    id: 'reserva_emergencia',
    title: 'Reserva de Emergência',
    category: 'fundacoes',
    categoryLabel: 'Fundações',
    iconName: 'PiggyBank',
    shortDesc: 'Construção de uma rede de segurança para cobrir imprevistos financeiros sem endividamento.',
    whyCrucial: 'Garante a paz de espírito e estabilidade emocional e financeira do cliente diante de desemprego, problemas de saúde ou imprevistos em geral.',
    bullets: [
      'Definir o custo mensal essencial do cliente',
      'Calcular a meta ideal (3 a 6 meses para CLT, 6 a 12 meses para PJ)',
      'Escolher o veículo ideal (liquidez diária, baixo risco, 100%+ CDI)',
      'Criar uma regra de aporte automático mensal',
      'Definir critérios objetivos para o uso da reserva'
    ],
    flags: [
      'Falta de colchão de liquidez em conta',
      'Uso recorrente do cheque especial',
      'Renda altamente variável sem proteção contra oscilações'
    ],
    color: '#10b981'
  },
  {
    id: 'separacao_pj_pf',
    title: 'Separação PJ e PF',
    category: 'fundacoes',
    categoryLabel: 'Fundações',
    iconName: 'Building',
    shortDesc: 'Blindagem e organização das contas da empresa e das finanças pessoais de forma separada.',
    whyCrucial: 'Evita a desorganização contábil, confusão patrimonial e problemas com o Fisco, além de permitir ver a real rentabilidade do negócio.',
    bullets: [
      'Criar contas bancárias totalmente distintas para PF e PJ',
      'Definir um pró-labore fixo mensal para o sócio',
      'Eliminar o pagamento de contas pessoais diretamente com dinheiro da PJ',
      'Estabelecer um fluxo claro de reembolso documentado',
      'Acompanhar o fluxo de caixa da empresa de forma isolada'
    ],
    flags: [
      'Cartão de crédito corporativo pagando despesas residenciais',
      'Falta de pró-labore fixado ou saques informais frequentes',
      'Ausência de acompanhamento sobre se a empresa dá lucro real'
    ],
    color: '#3b82f6'
  },
  {
    id: 'negociacao_dividas',
    title: 'Negociação de Dívidas',
    category: 'fundacoes',
    categoryLabel: 'Fundações',
    iconName: 'Handshake',
    shortDesc: 'Estratégias estruturadas para renegociar pendências com taxas de juros reduzidas e prazos viáveis.',
    whyCrucial: 'Estanca o efeito bola de neve dos juros altos e devolve a capacidade de poupança e crédito saudável ao cliente.',
    bullets: [
      'Mapear todos os credores, saldos devedores e o Custo Efetivo Total (CET)',
      'Aplicar a estratégia do Método Bola de Neve vs Quitação de Juro Mais Alto',
      'Preparação financeira para propor descontos agressivos à vista',
      'Avaliar portabilidade de crédito para instituições mais baratas',
      'Consultar feirões de renegociação (ex: Serasa Limpa Nome)'
    ],
    flags: [
      'Recebimento de cobranças ativas ou nome negativado',
      'Empréstimos ou financiamentos com taxas acima da média de mercado',
      'Parcelamento frequente da fatura de cartões de crédito'
    ],
    color: '#ef4444'
  },
  {
    id: 'milhas',
    title: 'Milhas',
    category: 'otimizacao',
    categoryLabel: 'Otimização',
    iconName: 'Plane',
    shortDesc: 'Uso estratégico do acúmulo de pontos e milhas para baratear viagens ou gerar renda extra.',
    whyCrucial: 'Transforma as despesas cotidianas inevitáveis em experiências de viagem baratas ou retorno financeiro direto (cashback avançado).',
    bullets: [
      'Cadastrar-se gratuitamente nos principais programas de fidelidade',
      'Concentrar gastos elegíveis no cartão de crédito pontuador',
      'Aproveitar promoções de transferência bonificada (ex: +100% de bônus)',
      'Avaliar o custo-benefício de assinar clubes de pontos',
      'Aprender estratégias básicas de busca e emissão de passagens aéreas'
    ],
    flags: [
      'Perda recorrente de pontos por prazo de validade expirado',
      'Uso de cartão de débito ou de crédito sem programa de pontos',
      'Transferência de pontos para aéreas sem promoção de bônus ativa'
    ],
    color: '#a855f7'
  },
  {
    id: 'melhores_cartoes',
    title: 'Melhores Cartões de Crédito',
    category: 'otimizacao',
    categoryLabel: 'Otimização',
    iconName: 'CreditCard',
    shortDesc: 'Seleção do cartão de crédito adequado ao perfil de gastos e objetivos (anuidade, cashback, salas VIP).',
    whyCrucial: 'Garante benefícios que compensam os gastos, como seguros gratuitos, cashback robusto e acessos a salas VIP.',
    bullets: [
      'Comparar anuidades com os benefícios e pontuação oferecidos',
      'Avaliar se a melhor opção para o perfil é cashback direto ou milhas',
      'Entender regras de isenção por média de gastos ou investimentos',
      'Aproveitar seguros de viagem e proteção de preço das bandeiras',
      'Organizar limites e datas de vencimento para controle de caixa'
    ],
    flags: [
      'Pagamento de anuidade cheia de cartão sem receber vantagens',
      'Uso de cartões básicos mesmo possuindo perfil para cartões premium',
      'Desorganização que leva a pagar juros rotativos de faturas'
    ],
    color: '#f59e0b'
  },
  {
    id: 'investimentos',
    title: 'Investimentos',
    category: 'otimizacao',
    categoryLabel: 'Otimização',
    iconName: 'TrendingUp',
    shortDesc: 'Alocação inteligente de recursos de acordo com o perfil de risco e objetivos de curto, médio e longo prazo.',
    whyCrucial: 'Protege o patrimônio contra os efeitos da inflação e acelera a independência financeira pelos juros compostos.',
    bullets: [
      'Realizar a Análise de Perfil de Investidor (suitability)',
      'Estruturar a alocação entre Renda Fixa e Renda Variável',
      'Selecionar ativos geradores de renda passiva vs ativos de crescimento',
      'Entender custos de taxas de administração, custódia e imposto de renda',
      'Aprender a fazer o rebalanceamento de carteira periódico'
    ],
    flags: [
      'Dinheiro poupado guardado na poupança ou conta sem rendimento',
      'Grande parte do capital em um único produto financeiro de alto risco',
      'Investir sem clareza do objetivo ou do prazo de resgate'
    ],
    color: '#06b6d4'
  },
  {
    id: 'consorcio',
    title: 'Consórcio',
    category: 'otimizacao',
    categoryLabel: 'Otimização',
    iconName: 'Coins',
    shortDesc: 'Planejamento de aquisição de bens (imóveis, veículos) a médio prazo sem juros de financiamento.',
    whyCrucial: 'Funciona como uma poupança forçada barata para quem não tem pressa na aquisição do bem, evitando juros abusivos de bancos.',
    bullets: [
      'Entender a diferença entre taxa de administração e juros de financiamento',
      'Conhecer a dinâmica dos lances (livre, embutido, fixo) e dos sorteios',
      'Calcular o impacto dos reajustes anuais do crédito (IPCA ou INCC)',
      'Desenhar estratégias para acelerar a contemplação do plano',
      'Avaliar o uso do FGTS para ofertar lance em consórcio imobiliário'
    ],
    flags: [
      'Necessidade de uso imediato do bem (consórcio não garante prazo)',
      'Comprometimento excessivo do fluxo mensal de caixa com parcelas',
      'Falta de planejamento para suportar os reajustes de parcelas'
    ],
    color: '#ec4899'
  },
  {
    id: 'seguros',
    title: 'Seguros',
    category: 'protecao',
    categoryLabel: 'Proteção',
    iconName: 'Shield',
    shortDesc: 'Proteção patrimonial e pessoal contra eventos catastróficos imprevistos (vida, auto, residencial, responsabilidade civil).',
    whyCrucial: 'Evita que um imprevisto grave destrua anos de patrimônio acumulado ou force a venda de investimentos com prejuízo.',
    bullets: [
      'Fazer o mapeamento dos riscos pessoais, de saúde e profissionais',
      'Comparar seguro de vida temporário vs seguro de vida resgatável',
      'Avaliar a contratação de Diária por Incapacidade Temporária (DIT)',
      'Verificar coberturas contratadas e valores de franquias em apólices',
      'Analisar a necessidade de seguro de Responsabilidade Civil Profissional'
    ],
    flags: [
      'Profissional liberal sem cobertura contra perda de renda por doença',
      'Imóveis ou automóveis de alto valor sem nenhuma proteção',
      'Família com dependentes financeiros sem proteção de seguro de vida'
    ],
    color: '#6366f1'
  },
  {
    id: 'plano_saude',
    title: 'Plano de Saúde',
    category: 'protecao',
    categoryLabel: 'Proteção',
    iconName: 'Activity',
    shortDesc: 'Seleção e otimização do convênio médico de acordo com a idade, necessidades e formato (PF vs PJ).',
    whyCrucial: 'A saúde é o ativo de maior valor do cliente. Custos médicos de urgência podem drenar todas as reservas financeiras rapidamente.',
    bullets: [
      'Avaliar vantagens financeiras de contratar plano de saúde via CNPJ',
      'Analisar a modalidade de coparticipação para reduzir custos fixos',
      'Mapear cobertura geográfica, carências exigidas e tabelas de reembolso',
      'Planejar financeiramente os reajustes anuais e por mudança de faixa etária',
      'Comparar a rede de hospitais e laboratórios credenciados exigidos'
    ],
    flags: [
      'Gastos com saúde particular sem reembolso ou planejamento de custos',
      'Dependência total do sistema público sem reserva para emergências médicas',
      'Pagamento de mensalidades abusivas sem revisão periódica de alternativas'
    ],
    color: '#14b8a6'
  },
  {
    id: 'sucessao_patrimonial',
    title: 'Sucessão Patrimonial',
    category: 'protecao',
    categoryLabel: 'Proteção',
    iconName: 'Key',
    shortDesc: 'Planejamento estratégico para transferência de bens aos herdeiros de forma rápida, barata e sem conflitos.',
    whyCrucial: 'Evita a retenção de bens in inventários demorados, além de reduzir em até 80% o custo com impostos (ITCMD) e advogados.',
    bullets: [
      'Estimar os custos totais de um inventário (impostos, custas e honorários)',
      'Entender o papel da Previdência Privada (VGBL) na liquidez imediata',
      'Avaliar mecanismos como doação em vida com reserva de usufruto',
      'Analisar o custo-benefício de estruturar uma Holding Familiar',
      'Elaborar testamento para divisão pacífica e organizada da parte disponível'
    ],
    flags: [
      'Patrimônio concentrado em bens imóveis sem liquidez sucessória',
      'Falta de conhecimento sobre o impacto do imposto de herança local',
      'Histórico de brigas ou fragilidade na relação entre os herdeiros'
    ],
    color: '#f97316'
  },
  {
    id: 'transicao_carreira',
    title: 'Transição de Carreira',
    category: 'futuro',
    categoryLabel: 'Futuro',
    iconName: 'Briefcase',
    shortDesc: 'Planejamento financeiro e de competências para mudar de profissão, cargo ou iniciar um negócio.',
    whyCrucial: 'Oferece a segurança e o suporte financeiro para o cliente mudar sua vida profissional sem passar por crises de sustento familiar.',
    bullets: [
      'Dimensionar a reserva de transição (mínimo de 12 meses do custo de vida)',
      'Projetar cenários de fluxo de caixa com queda temporária na renda',
      'Criar um cronograma realista para transição gradual ou paralela',
      'Apoiar a validação rápida do novo produto ou serviço no mercado',
      'Cortar custos supérfluos temporariamente para maximizar a segurança'
    ],
    flags: [
      'Alto estresse ou burnout profissional associado à falta de plano financeiro',
      'Desejo de pedir demissão por impulso sem qualquer reserva construída',
      'Ausência de clareza sobre o real custo de vida para os próximos anos'
    ],
    color: '#8b5cf6'
  },
  {
    id: 'aposentadoria',
    title: 'Aposentadoria',
    category: 'futuro',
    categoryLabel: 'Futuro',
    iconName: 'Palmtree',
    shortDesc: 'Mapeamento e acúmulo de riqueza focados em garantir a renda passiva ideal na fase pós-trabalho.',
    whyCrucial: 'Garante dignidade, independência e conforto na velhice, desvinculando o sustento da previdência pública oficial (INSS).',
    bullets: [
      'Calcular o montante de patrimônio necessário para a renda passiva desejada',
      'Escolher o tipo de previdência privada ideal (PGBL vs VGBL)',
      'Definir o regime tributário de saída (tabela progressiva vs regressiva)',
      'Selecionar ativos de longo prazo com foco em dividendo ou inflação (ex: Renda+)',
      'Projetar despesas aumentadas com cuidados e convênios na terceira idade'
    ],
    flags: [
      'Nenhum plano de acúmulo ou poupança de longo prazo em andamento',
      'Expectativa irrealista de depender apenas do INSS ou de parentes',
      'Opção inadequada de previdência cobrando taxas de carregamento abusivas'
    ],
    color: '#059669'
  }
];

export const Meetings: React.FC = () => {
  const { user, profile, viewingUserId } = useAuth();
  const { activeSpace, transactions, categories, wallets } = useFinance();
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
  const [activePresentationSlide, setActivePresentationSlide] = useState<'hourly_rate' | 'value_proposal' | 'credit_card' | 'radar_temas'>('hourly_rate');
  const [beforeMonth, setBeforeMonth] = useState<string>(() => format(new Date(), 'MM'));
  const [beforeYear, setBeforeYear] = useState<string>(() => format(new Date(), 'yyyy'));
  const [selectedCardId, setSelectedCardId] = useState<string>('fallback');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('fallback');
  const [showCardSelector, setShowCardSelector] = useState(false);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('reserva_emergencia');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');
  const [topicSearchQuery, setTopicSearchQuery] = useState<string>('');
  const [focusedTopicIds, setFocusedTopicIds] = useState<string[]>([]);
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
      } catch (e) { }
    }

    // Check oldest transaction to verify history is covered
    transactions.forEach(tx => {
      if (tx.date) {
        try {
          const txYear = new Date(tx.date).getFullYear();
          if (txYear < startYear) {
            startYear = txYear;
          }
        } catch (e) { }
      }
    });

    const years: number[] = [];
    for (let y = currentYear; y >= startYear; y--) {
      years.push(y);
    }
    return years;
  }, [user, transactions]);

  // Alternar visibilidade da reunião para o cliente
  const handleToggleMeetingVisibility = async (meetingId: string, currentVal: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newVal = !currentVal;

      // Atualização otimista no estado local
      setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, is_visible: newVal } : m));
      setSelectedMeeting(prev => {
        if (prev && prev.id === meetingId) {
          return { ...prev, is_visible: newVal };
        }
        return prev;
      });

      const { error } = await supabase
        .from('meetings')
        .update({ is_visible: newVal, updated_at: new Date().toISOString() })
        .eq('id', meetingId);

      if (error) throw error;

      showAlert('Sucesso', `Reunião ${newVal ? 'liberada' : 'ocultada'} para o cliente com sucesso!`, 'success');
    } catch (err: any) {
      console.error('Erro ao alternar visibilidade da reunião:', err);
      showAlert('Erro', 'Não foi possível atualizar a visibilidade da reunião.', 'danger');
      // Reverter em caso de erro
      fetchMeetings();
    }
  };

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

    setSelectedCardId(localStorage.getItem(`solum_presentation_card_${effectiveUserId}`) || 'fallback');
    setSelectedAccountId(localStorage.getItem(`solum_presentation_account_${effectiveUserId}`) || 'fallback');

    const savedFocus = localStorage.getItem(`solum_presentation_topics_focus_${effectiveUserId}`);
    if (savedFocus) {
      try {
        setFocusedTopicIds(JSON.parse(savedFocus));
      } catch (e) {
        console.error('Erro ao carregar focusedTopicIds:', e);
        setFocusedTopicIds([]);
      }
    } else {
      setFocusedTopicIds([]);
    }
  }, [effectiveUserId]);

  const handleToggleTopicFocus = (topicId: string) => {
    setFocusedTopicIds(prev => {
      const updated = prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId];
      if (effectiveUserId) {
        localStorage.setItem(`solum_presentation_topics_focus_${effectiveUserId}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleSelectCard = (id: string) => {
    setSelectedCardId(id);
    if (effectiveUserId) {
      localStorage.setItem(`solum_presentation_card_${effectiveUserId}`, id);
    }
  };

  const handleSelectAccount = (id: string) => {
    setSelectedAccountId(id);
    if (effectiveUserId) {
      localStorage.setItem(`solum_presentation_account_${effectiveUserId}`, id);
    }
  };

  const personalCards = useMemo(() => {
    return (wallets || []).filter(
      w => w.space === 'personal' && w.type === 'credit_card' && w.isActive !== false && w.isDeleted !== true
    );
  }, [wallets]);

  const personalAccounts = useMemo(() => {
    return (wallets || []).filter(
      w => w.space === 'personal' &&
        w.type !== 'credit_card' &&
        w.walletCategory === 'checking' &&
        w.isActive !== false &&
        w.isDeleted !== true
    );
  }, [wallets]);

  const adjustColorBrightness = (hex: string, percent: number) => {
    try {
      let R = parseInt(hex.substring(1, 3), 16);
      let G = parseInt(hex.substring(3, 5), 16);
      let B = parseInt(hex.substring(5, 7), 16);

      R = Math.min(255, Math.max(0, R + percent));
      G = Math.min(255, Math.max(0, G + percent));
      B = Math.min(255, Math.max(0, B + percent));

      const rHex = R.toString(16).padStart(2, '0');
      const gHex = G.toString(16).padStart(2, '0');
      const bHex = B.toString(16).padStart(2, '0');

      return `#${rHex}${gHex}${bHex}`;
    } catch (e) {
      return hex;
    }
  };

  const cardDetails = useMemo(() => {
    let found = personalCards.find(c => c.id === selectedCardId);
    if (!found && personalCards.length > 0) {
      found = personalCards[0];
    }

    if (!found) {
      return {
        id: 'none',
        name: 'Nenhum Cartão',
        color: '#94a3b8',
        cardLevel: 'Nenhum cadastrado',
        logoUrl: undefined
      };
    }

    return {
      id: found.id,
      name: found.name,
      color: found.cardColor || found.color || '#94a3b8',
      cardLevel: found.cardLevel || 'Nenhum',
      logoUrl: found.logoUrl
    };
  }, [personalCards, selectedCardId]);

  const accountDetails = useMemo(() => {
    let found = personalAccounts.find(a => a.id === selectedAccountId);
    if (!found && personalAccounts.length > 0) {
      found = personalAccounts[0];
    }

    if (!found) {
      return {
        id: 'none',
        name: 'Nenhuma Conta',
        color: '#94a3b8',
        logoUrl: undefined
      };
    }

    return {
      id: found.id,
      name: found.name,
      color: found.color || '#94a3b8',
      logoUrl: found.logoUrl
    };
  }, [personalAccounts, selectedAccountId]);

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
        } catch (e) { }

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

  const selectedBeforeMonth = `${beforeYear}-${beforeMonth}`;

  const beforeTotal = useMemo(() => {
    const personalTxs = transactions.filter(tx =>
      tx.space === 'personal' &&
      tx.type === 'expense' &&
      tx.date && tx.date.startsWith(selectedBeforeMonth)
    );
    return personalTxs.reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions, selectedBeforeMonth]);

  const afterTotal = useMemo(() => {
    return categories
      .filter(c => c.space === 'personal' && c.type === 'expense' && c.limit && c.limit > 0 && c.isActive !== false && c.isDeleted !== true)
      .reduce((sum, cat) => sum + (cat.limit || 0), 0);
  }, [categories]);

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
          created_by: user?.id || null,
          is_visible: false
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
            Reuniões
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

          <button
            onClick={() => {
              setShowPresentationsModal(true);
            }}
            className="bg-card hover:bg-muted text-foreground border border-border px-6 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all group hover:scale-[1.02] active:scale-95 shadow-sm"
          >
            <Presentation size={18} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Apresentações</span>
          </button>

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
                  const isLockedForUser = !canManage && meeting.is_visible === false;

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
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                            <Calendar size={12} className="text-primary/70" />
                            {meeting.date.split('-').reverse().join('/')}
                          </span>

                          <div className="flex items-center gap-2">
                            {canManage && (
                              <button
                                onClick={(e) => handleToggleMeetingVisibility(meeting.id, !!meeting.is_visible, e)}
                                className={cn(
                                  "p-1 rounded-md transition-colors",
                                  meeting.is_visible !== false
                                    ? "text-primary hover:bg-primary/10"
                                    : "text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                                )}
                                title={meeting.is_visible !== false ? "Visível para o cliente (Clique para ocultar)" : "Oculto para o cliente (Clique para liberar)"}
                              >
                                {meeting.is_visible !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                              </button>
                            )}

                            {isLockedForUser ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                <Lock size={8} />
                                Bloqueada
                              </span>
                            ) : progress === 100 ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest">
                                Concluído
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-muted-foreground">
                                {progress}% concluído
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 className={cn(
                          "text-sm font-black tracking-tight leading-tight uppercase line-clamp-2",
                          isSelected ? "text-primary" : "text-foreground"
                        )}>
                          {isLockedForUser ? "Próxima Reunião" : meeting.title}
                        </h3>

                        {/* Progress Bar or Locked status */}
                        {isLockedForUser ? (
                          <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 pt-1">
                            <Lock size={10} className="shrink-0 text-slate-400" />
                            Aguardando liberação
                          </div>
                        ) : (
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                progress === 100 ? "bg-emerald-500" : "bg-primary"
                              )}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
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
              !canManage && selectedMeeting.is_visible === false ? (
                <motion.div
                  key={`locked-${selectedMeeting.id}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-card backdrop-blur-xl border border-border rounded-[2.5rem] p-8 lg:p-12 shadow-xl shadow-slate-200/10 dark:shadow-none min-h-[500px] flex flex-col items-center justify-center text-center relative overflow-hidden"
                >
                  {/* Premium background gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 100 }}
                    className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-amber-500/10 border border-primary/20 dark:border-primary/10 flex items-center justify-center mb-6 relative group"
                  >
                    {/* Ring decoration */}
                    <div className="absolute inset-0 rounded-[2.5rem] border border-dashed border-primary/30 animate-spin-slow group-hover:scale-110 transition-transform duration-500" style={{ animationDuration: '15s' }} />
                    <Lock className="text-primary animate-pulse" size={40} />
                  </motion.div>

                  <div className="space-y-3 max-w-md relative z-10">
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-black uppercase tracking-widest text-amber-500">
                      Reunião em Preparação
                    </span>
                    <h2 className="text-2xl lg:text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-tight mt-2">
                      Aguardando Liberação
                    </h2>
                    <p className="text-muted-foreground text-xs font-semibold leading-relaxed">
                      Seu educador financeiro está preparando esta reunião com base na sua evolução. Assim que o conteúdo for finalizado e liberado pelo educador, você poderá visualizar o cronograma de tópicos, os checklists e todas as anotações do encontro aqui.
                    </p>
                  </div>

                  {/* Elegant decorative border lines */}
                  <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between border-t border-border/50 pt-4">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Calendar size={10} className="text-primary/70" />
                      Próxima Reunião: {selectedMeeting.date.split('-').reverse().join('/')}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Solum Financeiro
                    </span>
                  </div>
                </motion.div>
              ) : (
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
              )) : (
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

      {/* Modal de Apresentações de Mentoria */}
      <AnimatePresence>
        {showPresentationsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPresentationsModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-0"
            />
            <div className="relative z-10 w-full h-full flex items-center justify-center lg:pl-64 pointer-events-none">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="pointer-events-auto relative w-full max-w-7xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
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
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Apresentações</h2>
                  </div>
                </div>

                {/* Grid Principal */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 flex-1 overflow-hidden min-h-0">
                  {/* Lateral Esquerda - Lista de Apresentações (3 cols) */}
                  <div className="md:col-span-3 flex flex-col h-full overflow-hidden border-r border-border/50 pr-4 flex-shrink-0">
                    <div className="space-y-2 overflow-y-auto flex-1 pr-1 no-scrollbar text-left">
                      {/* Slide 1: Valor da Hora Trabalhada */}
                      <div
                        onClick={() => setActivePresentationSlide('hourly_rate')}
                        className={cn(
                          "p-4 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between select-none",
                          activePresentationSlide === 'hourly_rate'
                            ? "bg-primary/5 border-primary text-primary font-black"
                            : "border-border hover:bg-muted/50 text-muted-foreground"
                        )}
                      >
                        <div className="pr-2 flex-1 min-w-0">
                          <span className={cn("text-[8px] font-black uppercase tracking-wider", activePresentationSlide === 'hourly_rate' ? "text-primary" : "text-muted-foreground")}>Análise Pessoal</span>
                          <h4 className={cn("text-xs font-black uppercase whitespace-normal break-words leading-tight mt-0.5", activePresentationSlide === 'hourly_rate' ? "text-primary" : "text-foreground")}>
                            Valor da Hora Trabalhada
                          </h4>
                        </div>
                        <ChevronRight size={14} className={cn("transition-transform shrink-0", activePresentationSlide === 'hourly_rate' ? "text-primary translate-x-1" : "text-muted-foreground")} />
                      </div>

                      {/* Slide: Proposta de Valor da Consultoria */}
                      <div
                        onClick={() => setActivePresentationSlide('value_proposal')}
                        className={cn(
                          "p-4 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between select-none",
                          activePresentationSlide === 'value_proposal'
                            ? "bg-primary/5 border-primary text-primary font-black"
                            : "border-border hover:bg-muted/50 text-muted-foreground"
                        )}
                      >
                        <div className="pr-2 flex-1 min-w-0">
                          <span className={cn("text-[8px] font-black uppercase tracking-wider", activePresentationSlide === 'value_proposal' ? "text-primary" : "text-muted-foreground")}>Diagnóstico</span>
                          <h4 className={cn("text-xs font-black uppercase whitespace-normal break-words leading-tight mt-0.5", activePresentationSlide === 'value_proposal' ? "text-primary" : "text-foreground")}>
                            Proposta de Valor da Consultoria
                          </h4>
                        </div>
                        <ChevronRight size={14} className={cn("transition-transform shrink-0", activePresentationSlide === 'value_proposal' ? "text-primary translate-x-1" : "text-muted-foreground")} />
                      </div>

                      {/* Slide 2: Uso do Cartão de Crédito */}
                      <div
                        onClick={() => setActivePresentationSlide('credit_card')}
                        className={cn(
                          "p-4 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between select-none",
                          activePresentationSlide === 'credit_card'
                            ? "bg-primary/5 border-primary text-primary font-black"
                            : "border-border hover:bg-muted/50 text-muted-foreground"
                        )}
                      >
                        <div className="pr-2 flex-1 min-w-0">
                          <span className={cn("text-[8px] font-black uppercase tracking-wider", activePresentationSlide === 'credit_card' ? "text-primary" : "text-muted-foreground")}>Fluxo Ideal</span>
                          <h4 className={cn("text-xs font-black uppercase whitespace-normal break-words leading-tight mt-0.5", activePresentationSlide === 'credit_card' ? "text-primary" : "text-foreground")}>
                            Uso do Cartão de Crédito
                          </h4>
                        </div>
                        <ChevronRight size={14} className={cn("transition-transform shrink-0", activePresentationSlide === 'credit_card' ? "text-primary translate-x-1" : "text-muted-foreground")} />
                      </div>

                      {/* Slide 3: Radar de Temas de Mentoria */}
                      <div
                        onClick={() => setActivePresentationSlide('radar_temas')}
                        className={cn(
                          "p-4 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between select-none",
                          activePresentationSlide === 'radar_temas'
                            ? "bg-primary/5 border-primary text-primary font-black"
                            : "border-border hover:bg-muted/50 text-muted-foreground"
                        )}
                      >
                        <div className="pr-2 flex-1 min-w-0">
                          <span className={cn("text-[8px] font-black uppercase tracking-wider", activePresentationSlide === 'radar_temas' ? "text-primary" : "text-muted-foreground")}>Próximos Passos</span>
                          <h4 className={cn("text-xs font-black uppercase whitespace-normal break-words leading-tight mt-0.5", activePresentationSlide === 'radar_temas' ? "text-primary" : "text-foreground")}>
                            Radar de Temas
                          </h4>
                        </div>
                        <ChevronRight size={14} className={cn("transition-transform shrink-0", activePresentationSlide === 'radar_temas' ? "text-primary translate-x-1" : "text-muted-foreground")} />
                      </div>
                    </div>
                  </div>

                  {/* Lateral Direita - Conteúdo do Slide Selecionado (9 cols) */}
                  <div className="md:col-span-9 flex flex-col h-full overflow-y-auto pr-2 no-scrollbar">
                    {activePresentationSlide === 'hourly_rate' && (
                      monthlyFinanceData.months.length === 0 ? (
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
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1 text-left">
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
                                <div className="space-y-2 w-28 text-left">
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
                                <div className="space-y-2 w-28 text-left">
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
                                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white text-left">
                                    Impacto das Despesas no Tempo de Trabalho
                                  </h3>
                                  <p className="text-[10px] text-muted-foreground leading-relaxed uppercase font-bold tracking-wider text-left">
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
                                                  <div className="text-left">
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
                      )
                    )}

                    {activePresentationSlide === 'value_proposal' && (
                      <div className="space-y-8 animate-fadeIn text-left">
                        {/* Seção 1: Comparador Custo de Vida */}
                        <div className="space-y-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">
                                Custo de Vida: Antes vs. Depois
                              </h3>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">
                                Análise comparativa da redução do custo de vida real em relação aos limites de gastos estabelecidos.
                              </p>
                            </div>

                            {/* Seleção do Mês de Referência */}
                            <div className="flex items-center gap-2 shrink-0 bg-slate-50 dark:bg-slate-950/40 p-2 rounded-2xl border border-border">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-2">Cenário "Antes":</span>
                              <div className="flex gap-2">
                                <select
                                  value={beforeMonth}
                                  onChange={e => setBeforeMonth(e.target.value)}
                                  className="bg-white dark:bg-slate-900 border border-border rounded-xl h-9 px-3 text-xs font-bold text-foreground outline-none focus:border-primary/50 transition-all cursor-pointer min-w-[110px]"
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
                                  value={beforeYear}
                                  onChange={e => setBeforeYear(e.target.value)}
                                  className="bg-white dark:bg-slate-900 border border-border rounded-xl h-9 px-3 text-xs font-bold text-foreground outline-none focus:border-primary/50 transition-all cursor-pointer min-w-[80px]"
                                >
                                  {availableYears.map(y => (
                                    <option key={y} value={String(y)}>{y}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Card Antes */}
                            <div className="bg-rose-500/5 border border-rose-500/10 dark:border-rose-500/20 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
                              <div className="space-y-1">
                                <span className="text-[8px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">Cenário Antes (Gasto Real)</span>
                                <h4 className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Total de Despesas no Mês de Referência</h4>
                              </div>
                              <div className="mt-4">
                                <div className="text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(beforeTotal)}
                                </div>
                                <span className="text-[9px] font-semibold text-muted-foreground block mt-1">
                                  Soma de todas as despesas no Espaço Pessoal em {beforeMonth}/{beforeYear}
                                </span>
                              </div>
                            </div>

                            {/* Card Depois */}
                            <div className="bg-emerald-500/5 border border-emerald-500/10 dark:border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                              <div className="space-y-1">
                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Cenário Depois (Limites de Gastos)</span>
                                <h4 className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Orçamento Planejado e Otimizado</h4>
                              </div>
                              <div className="mt-4">
                                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(afterTotal)}
                                </div>
                                <span className="text-[9px] font-semibold text-muted-foreground block mt-1">
                                  Soma dos limites mensais definidos em categorias de despesas
                                </span>
                              </div>
                            </div>

                            {/* Card Economia */}
                            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                              <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                              <div className="space-y-1">
                                <span className="text-[8px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">Impacto e Economia</span>
                                <h4 className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Redução Projetada do Custo de Vida</h4>
                              </div>
                              <div className="mt-4">
                                <div className="text-3xl font-black text-primary tracking-tight flex items-baseline gap-2">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(beforeTotal > afterTotal ? beforeTotal - afterTotal : 0)}
                                  {beforeTotal > afterTotal && beforeTotal > 0 && (
                                    <span className="text-sm font-extrabold text-emerald-500">
                                      (-{((beforeTotal - afterTotal) / beforeTotal * 100).toFixed(0)}%)
                                    </span>
                                  )}
                                </div>
                                <span className="text-[9px] font-semibold text-muted-foreground block mt-1">
                                  {beforeTotal > afterTotal
                                    ? "O estabelecimento de tetos orçamentários gera esta folga financeira mensal."
                                    : "Defina limites mais saudáveis nas categorias de despesas para gerar economia projetada."}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Comparativo de Barras */}
                          <div className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-border rounded-3xl space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Fluxo de Caixa Otimizado</span>
                              {beforeTotal > afterTotal && (
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Redução de {((beforeTotal - afterTotal) / beforeTotal * 100).toFixed(1)}% no custo de vida</span>
                              )}
                            </div>

                            <div className="space-y-3">
                              {/* Barra Antes */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                  <span>Despesas Iniciais (Mês selecionado)</span>
                                  <span className="text-rose-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(beforeTotal)}</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800/60 h-3 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-rose-500 rounded-full transition-all duration-700"
                                    style={{ width: beforeTotal > 0 ? '100%' : '0%' }}
                                  />
                                </div>
                              </div>

                              {/* Barra Depois */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                  <span>Novo Custo de Vida Planejado</span>
                                  <span className="text-emerald-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(afterTotal)}</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800/60 h-3 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                                    style={{
                                      width: beforeTotal > 0
                                        ? `${Math.min((afterTotal / beforeTotal) * 100, 100)}%`
                                        : afterTotal > 0 ? '100%' : '0%'
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Seção 2: Sugestões para Impactar (Nossos Pilares de Impacto) */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">
                            Transformação e Organização da Vida Financeira
                          </h3>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                            Como estruturamos sua base financeira e o que foi integrado para tirar suas contas do caos.
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Card 1: Centralização */}
                            <div className="bg-slate-50 dark:bg-slate-950/40 border border-border rounded-3xl p-5 hover:scale-[1.01] transition-all flex gap-4 text-left">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Building size={20} />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-xs font-black uppercase text-foreground">Centralização Contra o Caos</h4>
                                <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">
                                  Centralizamos suas contas e cartões para unificar e organizar suas informações em um só lugar (ou no menor número de lugares possível), eliminando a bagunça financeira.
                                </p>
                              </div>
                            </div>

                            {/* Card 2: Rastreabilidade */}
                            <div className="bg-slate-50 dark:bg-slate-950/40 border border-border rounded-3xl p-5 hover:scale-[1.01] transition-all flex gap-4 text-left">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                                <Search size={20} />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-xs font-black uppercase text-foreground">Sistema Fácil de Rastreamento</h4>
                                <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">
                                  Além de apenas limitar seus gastos, integramos uma ferramenta intuitiva que ajuda a identificar com facilidade e rapidez exatamente com o que você está gastando seu dinheiro.
                                </p>
                              </div>
                            </div>

                            {/* Card 3: Dinheiro Sobrando */}
                            <div className="bg-slate-50 dark:bg-slate-950/40 border border-border rounded-3xl p-5 hover:scale-[1.01] transition-all flex gap-4 text-left">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                <PiggyBank size={20} />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-xs font-black uppercase text-foreground">Foco em Sobra Financeira</h4>
                                <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">
                                  Ajustamos seu fluxo de caixa e organizamos seu orçamento mensal para que a sobra financeira no fim do mês seja uma consequência natural e garantida do seu planejamento.
                                </p>
                              </div>
                            </div>

                            {/* Card 4: Controle de Dívidas */}
                            <div className="bg-slate-50 dark:bg-slate-950/40 border border-border rounded-3xl p-5 hover:scale-[1.01] transition-all flex gap-4 text-left">
                              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                                <AlertCircle size={20} />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-xs font-black uppercase text-foreground">Gestão Inteligente de Dívidas</h4>
                                <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">
                                  Organizamos suas dívidas dentro do orçamento viável. Aquelas que não cabem hoje ficam mapeadas e registradas estruturadamente para que nunca sejam esquecidas até a quitação.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Seção 3: Roadmap de Temas a Trabalhar */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">
                            O Que Iremos Construir a Seguir
                          </h3>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                            Os próximos pilares estratégicos de evolução financeira que trabalharemos ao longo da sua jornada de consultoria.
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {/* Pilar 1: Metas */}
                            <div className="bg-slate-50 dark:bg-slate-950/40 border border-border rounded-2xl p-4 flex flex-col justify-between gap-3 text-left hover:border-primary/40 transition-colors">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <TrendingUp size={16} />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-[10px] font-black uppercase text-foreground leading-tight">Metas</h4>
                                <p className="text-[8px] text-muted-foreground leading-normal font-medium">
                                  Conquistas de curto, médio e longo prazo.
                                </p>
                              </div>
                            </div>

                            {/* Pilar 2: Reservas */}
                            <div className="bg-slate-50 dark:bg-slate-950/40 border border-border rounded-2xl p-4 flex flex-col justify-between gap-3 text-left hover:border-primary/40 transition-colors">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                                <Shield size={16} />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-[10px] font-black uppercase text-foreground leading-tight">Reservas</h4>
                                <p className="text-[8px] text-muted-foreground leading-normal font-medium">
                                  Proteção e segurança para cobrir imprevistos.
                                </p>
                              </div>
                            </div>

                            {/* Pilar 3: Gastos Eventuais */}
                            <div className="bg-slate-50 dark:bg-slate-950/40 border border-border rounded-2xl p-4 flex flex-col justify-between gap-3 text-left hover:border-primary/40 transition-colors">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                <Coins size={16} />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-[10px] font-black uppercase text-foreground leading-tight">Gastos Eventuais</h4>
                                <p className="text-[8px] text-muted-foreground leading-normal font-medium">
                                  Dinheiro planejado para compras periódicas e lazer.
                                </p>
                              </div>
                            </div>

                            {/* Pilar 4: Plano de Dívidas */}
                            <div className="bg-slate-50 dark:bg-slate-950/40 border border-border rounded-2xl p-4 flex flex-col justify-between gap-3 text-left hover:border-primary/40 transition-colors">
                              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                                <Handshake size={16} />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-[10px] font-black uppercase text-foreground leading-tight">Plano de Dívidas</h4>
                                <p className="text-[8px] text-muted-foreground leading-normal font-medium">
                                  Estratégias de amortização e negociação com credores.
                                </p>
                              </div>
                            </div>

                            {/* Pilar 5: Cartão de Crédito */}
                            <div className="bg-slate-50 dark:bg-slate-950/40 border border-border rounded-2xl p-4 flex flex-col justify-between gap-3 text-left hover:border-primary/40 transition-colors">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                                <CreditCard size={16} />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-[10px] font-black uppercase text-foreground leading-tight">Uso do Cartão</h4>
                                <p className="text-[8px] text-muted-foreground leading-normal font-medium">
                                  Uso correto como meio de pagamento e controle de fluxo.
                                </p>
                              </div>
                            </div>

                            {/* Pilar 6: Patrimônio */}
                            <div className="bg-slate-50 dark:bg-slate-950/40 border border-border rounded-2xl p-4 flex flex-col justify-between gap-3 text-left hover:border-primary/40 transition-colors">
                              <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                                <Building size={16} />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-[10px] font-black uppercase text-foreground leading-tight">Patrimônio</h4>
                                <p className="text-[8px] text-muted-foreground leading-normal font-medium">
                                  Evolução patrimonial, ativos e investimentos iniciais.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activePresentationSlide === 'credit_card' && (
                      <div className="space-y-8">
                        {/* CSS Local para animação do tracejado */}
                        <style>{`
                        @keyframes stroke-flow {
                          to {
                            stroke-dashoffset: -20;
                          }
                        }
                        .animate-flow-dash {
                          stroke-dasharray: 6, 4;
                          animation: stroke-flow 1.5s linear infinite;
                        }
                      `}</style>

                        {/* Diagrama Desktop (lg:grid hidden) */}
                        <div className="hidden lg:grid grid-cols-[192px_1fr_192px_1fr_192px] items-center gap-y-8 relative w-full px-2 py-6 justify-items-center">

                          {/* Linha 1 */}
                          {/* Mercado (Apenas ícone e textos, sem card) */}
                          <div className="flex flex-col items-center justify-center text-center select-none">
                            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-2 border border-rose-500/20 shadow-sm">
                              <ShoppingCart className="text-rose-500" size={20} />
                            </div>
                            <h4 className="text-xs font-black uppercase text-foreground">Mercado</h4>
                            <span className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">Dia a Dia</span>
                          </div>

                          {/* Seta Mercado -> Cartão (Ponta integrada no path) */}
                          <div className="flex flex-col items-center justify-center h-full w-full px-2">
                            <span className="text-[10px] font-black uppercase tracking-wider mb-1 text-center text-rose-500 leading-none">
                              1. Compra de R$ 1.000,00
                            </span>
                            <svg className="w-full h-6 overflow-visible" viewBox="0 0 100 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path
                                d="M5,12 H88"
                                stroke="#ef4444"
                                strokeWidth="2"
                                strokeDasharray="6,4"
                                className="animate-flow-dash"
                              />
                              <path d="M88,8 L94,12 L88,16 Z" fill="#ef4444" />
                            </svg>
                          </div>

                          {/* Cartão de Crédito Interativo (Tamanho w-40 h-24) */}
                          <div className="relative w-40 h-24">
                            <div
                              className="relative rounded-xl p-2.5 text-white shadow-lg hover:scale-[1.03] active:scale-95 transition-all w-40 h-24 flex flex-col justify-between overflow-hidden group cursor-pointer border border-white/10"
                              style={{
                                background: `linear-gradient(135deg, ${cardDetails.color}, ${adjustColorBrightness(cardDetails.color, -30)})`
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowCardSelector(!showCardSelector);
                                setShowAccountSelector(false);
                              }}
                            >
                              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                              <div className="flex justify-between items-start">
                                <div className="flex flex-col text-left">
                                  {cardDetails.logoUrl ? (
                                    <div className="w-6 h-6 rounded-full overflow-hidden bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                                      <img src={cardDetails.logoUrl} alt={cardDetails.name} className="w-full h-full object-cover rounded-full" />
                                    </div>
                                  ) : (
                                    <span className="text-[8px] font-black uppercase tracking-wider truncate max-w-[80px]">{cardDetails.name}</span>
                                  )}
                                  <span className="text-[6px] font-bold opacity-80 uppercase tracking-widest mt-0.5">{cardDetails.cardLevel}</span>
                                </div>
                                <div className="w-5.5 h-3.5 rounded bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 shadow-inner flex flex-col justify-between p-0.5 shrink-0">
                                  <div className="grid grid-cols-3 gap-0.5 h-full opacity-60">
                                    <div className="border-r border-amber-600/50"></div>
                                    <div className="border-r border-amber-600/50"></div>
                                    <div></div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-between items-end">
                                <div className="flex flex-col text-left">
                                  <span className="text-[7px] font-mono tracking-widest">•••• 1234</span>
                                </div>
                                <span className="text-[7px] font-black tracking-widest">05/31</span>
                              </div>
                            </div>

                            {/* Popover Seleção de Cartão */}
                            <AnimatePresence>
                              {showCardSelector && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowCardSelector(false); }} />
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl p-1.5 z-50 max-h-40 overflow-y-auto no-scrollbar text-left"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 px-2 py-1 border-b border-slate-200 dark:border-white/10 mb-1">
                                      Alterar Cartão
                                    </div>
                                    {personalCards.length === 0 ? (
                                      <div className="px-2 py-2 text-[9px] text-muted-foreground italic leading-tight">
                                        Nenhum cartão de crédito cadastrado.
                                      </div>
                                    ) : (
                                      personalCards.map(c => (
                                        <button
                                          key={c.id}
                                          onClick={() => {
                                            handleSelectCard(c.id);
                                            setShowCardSelector(false);
                                          }}
                                          className={cn(
                                            "w-full text-left px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-between",
                                            selectedCardId === c.id || (selectedCardId === 'fallback' && personalCards[0]?.id === c.id)
                                              ? "bg-primary/10 text-primary"
                                              : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                                          )}
                                        >
                                          <span className="truncate">{c.name}</span>
                                          {(selectedCardId === c.id || (selectedCardId === 'fallback' && personalCards[0]?.id === c.id)) && <Check size={12} />}
                                        </button>
                                      ))
                                    )}
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Seta Conta -> Cartão (Ponta integrada no path, "Paga Fatura") */}
                          <div className="flex flex-col items-center justify-center h-full w-full px-2">
                            <span className="text-[10px] font-black uppercase tracking-wider mb-1 text-center text-rose-500 leading-none">
                              6. Paga Fatura
                            </span>
                            <svg className="w-full h-6 overflow-visible" viewBox="0 0 100 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path
                                d="M95,12 H12"
                                stroke="#ef4444"
                                strokeWidth="2"
                                strokeDasharray="6,4"
                                className="animate-flow-dash"
                              />
                              <path d="M12,8 L6,12 L12,16 Z" fill="#ef4444" />
                            </svg>
                          </div>

                          {/* Conta Corrente Interativa (Apenas logo circular, textos e popover) */}
                          <div className="relative">
                            <div
                              className="flex flex-col items-center justify-center text-center cursor-pointer group select-none"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowAccountSelector(!showAccountSelector);
                                setShowCardSelector(false);
                              }}
                            >
                              <div className="relative w-12 h-12 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-sm group-hover:scale-105 transition-all bg-white dark:bg-slate-900 overflow-hidden">
                                {accountDetails.logoUrl ? (
                                  <img src={accountDetails.logoUrl} alt={accountDetails.name} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                                    style={{ backgroundColor: accountDetails.color }}
                                  >
                                    {accountDetails.name.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <h4 className="text-xs font-black uppercase text-foreground mt-2 group-hover:text-primary transition-colors">{accountDetails.name}</h4>
                              <span className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">Conta Corrente</span>
                            </div>

                            {/* Popover Seleção de Conta */}
                            <AnimatePresence>
                              {showAccountSelector && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowAccountSelector(false); }} />
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl p-1.5 z-50 max-h-40 overflow-y-auto no-scrollbar text-left"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 px-2 py-1 border-b border-slate-200 dark:border-white/10 mb-1">
                                      Alterar Conta
                                    </div>
                                    {personalAccounts.length === 0 ? (
                                      <div className="px-2 py-2 text-[9px] text-muted-foreground italic leading-tight">
                                        Nenhuma conta corrente cadastrada.
                                      </div>
                                    ) : (
                                      personalAccounts.map(a => (
                                        <button
                                          key={a.id}
                                          onClick={() => {
                                            handleSelectAccount(a.id);
                                            setShowAccountSelector(false);
                                          }}
                                          className={cn(
                                            "w-full text-left px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-between",
                                            selectedAccountId === a.id || (selectedAccountId === 'fallback' && personalAccounts[0]?.id === a.id)
                                              ? "bg-primary/10 text-primary"
                                              : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                                          )}
                                        >
                                          <span className="truncate">{a.name}</span>
                                          {(selectedAccountId === a.id || (selectedAccountId === 'fallback' && personalAccounts[0]?.id === a.id)) && <Check size={12} />}
                                        </button>
                                      ))
                                    )}
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Linha 2 - Setas Verticais */}
                          {/* Seta Mercado -> Registrar Despesa */}
                          <div className="flex items-center justify-center h-20 w-full gap-2 px-1">
                            <svg className="w-6 h-full overflow-visible" viewBox="0 0 24 100" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                              <path
                                d="M12,5 V88"
                                stroke="#f59e0b"
                                strokeWidth="2"
                                strokeDasharray="6,4"
                                className="animate-flow-dash"
                              />
                              <path d="M8,88 L12,94 L16,88 Z" fill="#f59e0b" />
                            </svg>
                            <span className="text-[9.5px] font-black uppercase tracking-wider text-left leading-tight w-28 text-amber-500 select-none">
                              2. Registrar Compra
                            </span>
                          </div>

                          {/* Vazio */}
                          <div></div>

                          {/* Seta Cartão -> Registrar Fatura */}
                          <div className="flex items-center justify-center h-20 w-full gap-2 px-1">
                            <svg className="w-6 h-full overflow-visible" viewBox="0 0 24 100" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                              <path
                                d="M12,5 V88"
                                stroke="#f59e0b"
                                strokeWidth="2"
                                strokeDasharray="6,4"
                                className="animate-flow-dash"
                              />
                              <path d="M8,88 L12,94 L16,88 Z" fill="#f59e0b" />
                            </svg>
                            <span className="text-[9.5px] font-black uppercase tracking-wider text-left leading-tight w-28 text-amber-500 select-none">
                              4. Registrar Pagamento
                            </span>
                          </div>

                          {/* Vazio */}
                          <div></div>

                          {/* Setas Conta Corrente <-> Cofrinho */}
                          <div className="flex items-center justify-center h-20 w-full gap-4 px-1 select-none">
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] font-black uppercase text-emerald-500 leading-none mb-1">3. Guardar</span>
                              <svg className="w-4 h-12 overflow-visible" viewBox="0 0 24 50" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                <path
                                  d="M12,0 V42"
                                  stroke="#10B981"
                                  strokeWidth="2"
                                  strokeDasharray="4,4"
                                  className="animate-flow-dash"
                                />
                                <path d="M8,42 L12,48 L16,42 Z" fill="#10B981" />
                              </svg>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] font-black uppercase text-emerald-500 leading-none mb-1">5. Resgatar</span>
                              <svg className="w-4 h-12 overflow-visible" viewBox="0 0 24 50" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                <path
                                  d="M12,50 V8"
                                  stroke="#10B981"
                                  strokeWidth="2"
                                  strokeDasharray="4,4"
                                  className="animate-flow-dash"
                                />
                                <path d="M8,8 L12,2 L16,8 Z" fill="#10B981" />
                              </svg>
                            </div>
                          </div>

                          {/* Linha 3 */}
                          {/* Lançamento Despesa (Favicon.png visível) */}
                          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 flex items-center gap-3 shadow-sm hover:scale-105 transition-all w-48 h-24 text-left">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 p-1 flex items-center justify-center shrink-0 border border-border">
                              <img src="/images/favicon.png" alt="Solum App" className="w-6 h-6 object-contain" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[8px] font-black uppercase tracking-wider text-amber-500">Lançamento</span>
                              <h4 className="text-[10.5px] font-black uppercase text-foreground truncate">Registrar Despesa</h4>
                              <p className="text-[8.5px] text-muted-foreground font-semibold leading-tight mt-0.5">
                                Lançar gasto no cartão para teto de despesas.
                              </p>
                            </div>
                          </div>

                          {/* Vazio */}
                          <div></div>

                          {/* Lançamento Pagamento (Favicon.png visível) */}
                          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 flex items-center gap-3 shadow-sm hover:scale-105 transition-all w-48 h-24 text-left">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 p-1 flex items-center justify-center shrink-0 border border-border">
                              <img src="/images/favicon.png" alt="Solum App" className="w-6 h-6 object-contain" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[8px] font-black uppercase tracking-wider text-amber-500">Conciliação</span>
                              <h4 className="text-[10.5px] font-black uppercase text-foreground truncate">Registrar Fatura</h4>
                              <p className="text-[8.5px] text-muted-foreground font-semibold leading-tight mt-0.5">
                                Dar baixa na fatura para fechar o mês financeiro.
                              </p>
                            </div>
                          </div>

                          {/* Vazio */}
                          <div></div>

                          {/* Cofrinho (Apenas PiggyBank sem logo de banco) */}
                          <div className="flex flex-col items-center justify-center text-center select-none">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2 border border-emerald-500/20 shadow-sm">
                              <PiggyBank className="text-emerald-500" size={20} />
                            </div>
                            <h4 className="text-xs font-black uppercase text-foreground">Cofrinho</h4>
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-black mt-0.5 uppercase tracking-wider">
                              100% CDI
                            </span>
                          </div>

                        </div>

                        {/* Diagrama Mobile (lg:hidden block) - Versão Timeline Minimalista e Premium */}
                        <div className="lg:hidden w-full px-4 py-2">
                          <div className="flex flex-col">

                            {/* Passo 1: Compras no Mercado */}
                            <div className="relative pl-10 pb-6 text-left">
                              <div className="absolute left-[15px] top-8 bottom-0 w-[2px] border-l-2 border-dashed border-slate-200 dark:border-white/10" />
                              <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-sm z-10">
                                <ShoppingCart className="text-rose-500" size={14} />
                              </div>
                              <div>
                                <span className="text-[8px] font-black uppercase text-rose-500 tracking-wider">Passo 1 • Mercado</span>
                                <h4 className="text-xs font-black uppercase text-foreground">Compras do Dia a Dia</h4>
                                <p className="text-[9.5px] text-muted-foreground font-semibold mt-0.5 leading-relaxed">
                                  Compra de R$ 1.000,00 feita no mercado usando o cartão de crédito.
                                </p>
                              </div>
                            </div>

                            {/* Passo 2: Cofrinho */}
                            <div className="relative pl-10 pb-6 text-left">
                              <div className="absolute left-[15px] top-8 bottom-0 w-[2px] border-l-2 border-dashed border-slate-200 dark:border-white/10" />
                              <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-sm z-10">
                                <PiggyBank className="text-emerald-500" size={14} />
                              </div>
                              <div>
                                <span className="text-[8px] font-black uppercase text-emerald-500 tracking-wider">Passo 2 • Cofrinho</span>
                                <h4 className="text-xs font-black uppercase text-foreground">Guardar Dinheiro Rendendo</h4>
                                <p className="text-[9.5px] text-muted-foreground font-semibold mt-0.5 leading-relaxed">
                                  O valor da compra (R$ 1.000,00) é mantido no Cofrinho a 100% CDI para render até o vencimento.
                                </p>
                              </div>
                            </div>

                            {/* Passo 2: Registrar Compra no App */}
                            <div className="relative pl-10 pb-6 text-left">
                              <div className="absolute left-[15px] top-8 bottom-0 w-[2px] border-l-2 border-dashed border-slate-200 dark:border-white/10" />
                              <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-border flex items-center justify-center shadow-sm z-10 p-1">
                                <img src="/images/favicon.png" alt="Solum App" className="w-5 h-5 object-contain" />
                              </div>
                              <div>
                                <span className="text-[8px] font-black uppercase text-amber-500 tracking-wider">Passo 3 • App Solum</span>
                                <h4 className="text-xs font-black uppercase text-foreground">Lançar Despesa</h4>
                                <p className="text-[9.5px] text-muted-foreground font-semibold mt-0.5 leading-relaxed">
                                  Registrar o gasto no cartão de crédito dentro do aplicativo de finanças.
                                </p>
                              </div>
                            </div>

                            {/* Passo 4: Cartão de Crédito Interativo */}
                            <div className="relative pl-10 pb-6 text-left">
                              <div className="absolute left-[15px] top-8 bottom-0 w-[2px] border-l-2 border-dashed border-slate-200 dark:border-white/10" />
                              <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm z-10">
                                <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                                  <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="2" />
                                </svg>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <span className="text-[8px] font-black uppercase text-primary tracking-wider">Passo 4 • Cartão de Crédito</span>
                                  <p className="text-[9.5px] text-muted-foreground font-semibold mt-0.5 leading-relaxed">
                                    Gasto acumulado na fatura. Clique no cartão abaixo para alterar.
                                  </p>
                                </div>

                                <div className="relative w-40 h-24">
                                  <div
                                    className="relative rounded-xl p-2.5 text-white shadow-lg hover:scale-[1.03] active:scale-95 transition-all w-40 h-24 flex flex-col justify-between overflow-hidden group cursor-pointer border border-white/10"
                                    style={{
                                      background: `linear-gradient(135deg, ${cardDetails.color}, ${adjustColorBrightness(cardDetails.color, -30)})`
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowCardSelector(!showCardSelector);
                                      setShowAccountSelector(false);
                                    }}
                                  >
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    <div className="flex justify-between items-start">
                                      <div className="flex flex-col text-left">
                                        {cardDetails.logoUrl ? (
                                          <div className="w-6 h-6 rounded-full overflow-hidden bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                                            <img src={cardDetails.logoUrl} alt={cardDetails.name} className="w-full h-full object-cover rounded-full" />
                                          </div>
                                        ) : (
                                          <span className="text-[8px] font-black uppercase tracking-wider truncate max-w-[80px]">{cardDetails.name}</span>
                                        )}
                                        <span className="text-[6px] font-bold opacity-80 uppercase tracking-widest mt-0.5">{cardDetails.cardLevel}</span>
                                      </div>
                                      <div className="w-5.5 h-3.5 rounded bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 shadow-inner flex flex-col justify-between p-0.5 shrink-0">
                                        <div className="grid grid-cols-3 gap-0.5 h-full opacity-60">
                                          <div className="border-r border-amber-600/50"></div>
                                          <div className="border-r border-amber-600/50"></div>
                                          <div></div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                      <div className="flex flex-col text-left">
                                        <span className="text-[7px] font-mono tracking-widest">•••• 1234</span>
                                      </div>
                                      <span className="text-[7px] font-black tracking-widest">05/31</span>
                                    </div>
                                  </div>

                                  {/* Popover Seleção de Cartão Mobile */}
                                  <AnimatePresence>
                                    {showCardSelector && (
                                      <>
                                        <div className="fixed inset-0 z-45" onClick={(e) => { e.stopPropagation(); setShowCardSelector(false); }} />
                                        <motion.div
                                          initial={{ opacity: 0, y: 10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: 10 }}
                                          className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl p-1.5 z-50 max-h-40 overflow-y-auto no-scrollbar text-left"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 px-2 py-1 border-b border-slate-200 dark:border-white/10 mb-1">
                                            Alterar Cartão
                                          </div>
                                          {personalCards.length === 0 ? (
                                            <div className="px-2 py-2 text-[9px] text-muted-foreground italic leading-tight">
                                              Nenhum cartão de crédito cadastrado.
                                            </div>
                                          ) : (
                                            personalCards.map(c => (
                                              <button
                                                key={c.id}
                                                onClick={() => {
                                                  handleSelectCard(c.id);
                                                  setShowCardSelector(false);
                                                }}
                                                className={cn(
                                                  "w-full text-left px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-between",
                                                  selectedCardId === c.id || (selectedCardId === 'fallback' && personalCards[0]?.id === c.id)
                                                    ? "bg-primary/10 text-primary"
                                                    : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                                                )}
                                              >
                                                <span className="truncate">{c.name}</span>
                                                {(selectedCardId === c.id || (selectedCardId === 'fallback' && personalCards[0]?.id === c.id)) && <Check size={12} />}
                                              </button>
                                            ))
                                          )}
                                        </motion.div>
                                      </>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </div>

                            {/* Passo 5: Conta Corrente Interativa */}
                            <div className="relative pl-10 pb-6 text-left">
                              <div className="absolute left-[15px] top-8 bottom-0 w-[2px] border-l-2 border-dashed border-slate-200 dark:border-white/10" />
                              <div
                                className="absolute left-0 top-1 w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center bg-white dark:bg-slate-900 overflow-hidden shadow-sm z-10 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowAccountSelector(!showAccountSelector);
                                  setShowCardSelector(false);
                                }}
                              >
                                {accountDetails.logoUrl ? (
                                  <img src={accountDetails.logoUrl} alt={accountDetails.name} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  <div
                                    className="w-5.5 h-5.5 rounded-full flex items-center justify-center text-white text-[7px] font-bold"
                                    style={{ backgroundColor: accountDetails.color }}
                                  >
                                    {accountDetails.name.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Passo 5 • Conta Corrente</span>
                                  <h4 className="text-xs font-black uppercase text-foreground">{accountDetails.name}</h4>
                                  <p className="text-[9.5px] text-muted-foreground font-semibold mt-0.5 leading-relaxed">
                                    Conta de débito onde o dinheiro será retirado para pagar o cartão. Clique para alterar.
                                  </p>
                                </div>

                                {/* Popover Seleção de Conta Mobile */}
                                <AnimatePresence>
                                  {showAccountSelector && (
                                    <>
                                      <div className="fixed inset-0 z-45" onClick={(e) => { e.stopPropagation(); setShowAccountSelector(false); }} />
                                      <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl p-1.5 z-50 max-h-40 overflow-y-auto no-scrollbar text-left"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 px-2 py-1 border-b border-slate-200 dark:border-white/10 mb-1">
                                          Alterar Conta
                                        </div>
                                        {personalAccounts.length === 0 ? (
                                          <div className="px-2 py-2 text-[9px] text-muted-foreground italic leading-tight">
                                            Nenhuma conta corrente cadastrada.
                                          </div>
                                        ) : (
                                          personalAccounts.map(a => (
                                            <button
                                              key={a.id}
                                              onClick={() => {
                                                handleSelectAccount(a.id);
                                                setShowAccountSelector(false);
                                              }}
                                              className={cn(
                                                "w-full text-left px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-between",
                                                selectedAccountId === a.id || (selectedAccountId === 'fallback' && personalAccounts[0]?.id === a.id)
                                                  ? "bg-primary/10 text-primary"
                                                  : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                                              )}
                                            >
                                              <span className="truncate">{a.name}</span>
                                              {(selectedAccountId === a.id || (selectedAccountId === 'fallback' && personalAccounts[0]?.id === a.id)) && <Check size={12} />}
                                            </button>
                                          ))
                                        )}
                                      </motion.div>
                                    </>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>

                            {/* Passo 4: Registrar Pagamento no App */}
                            <div className="relative pl-10 pb-6 text-left">
                              <div className="absolute left-[15px] top-8 bottom-0 w-[2px] border-l-2 border-dashed border-slate-200 dark:border-white/10" style={{ display: 'none' }} />
                              <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-border flex items-center justify-center shadow-sm z-10 p-1">
                                <img src="/images/favicon.png" alt="Solum App" className="w-5 h-5 object-contain" />
                              </div>
                              <div>
                                <span className="text-[8px] font-black uppercase text-amber-500 tracking-wider">Passo 6 • App Solum</span>
                                <h4 className="text-xs font-black uppercase text-foreground">Lançar Pagamento da Fatura</h4>
                                <p className="text-[9.5px] text-muted-foreground font-semibold mt-0.5 leading-relaxed">
                                  Baixa final no app para fechar o ciclo de faturas do mês (Conciliação).
                                </p>
                              </div>
                            </div>

                          </div>
                        </div>

                      </div>
                    )}

                    {activePresentationSlide === 'radar_temas' && (
                      <div className="space-y-6 flex flex-col h-full overflow-hidden text-left">
                        {/* Cabeçalho do Slide: Título e barra de busca/filtros */}
                        <div className="flex flex-col gap-4">
                          <div>
                            <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">
                              Radar de Temas de Mentoria
                            </h3>
                            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                              Assuntos estratégicos pendentes de discussão com o cliente
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                            {/* Filtros por Categoria */}
                            <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                              {[
                                { id: 'all', label: 'Todos' },
                                { id: 'fundacoes', label: 'Fundações' },
                                { id: 'otimizacao', label: 'Otimização' },
                                { id: 'protecao', label: 'Proteção' },
                                { id: 'futuro', label: 'Futuro' }
                              ].map(tab => {
                                const count = tab.id === 'all'
                                  ? MENTORSHIP_TOPICS.length
                                  : MENTORSHIP_TOPICS.filter(t => t.category === tab.id).length;
                                return (
                                  <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setSelectedCategoryTab(tab.id)}
                                    className={cn(
                                      "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
                                      selectedCategoryTab === tab.id
                                        ? "bg-white dark:bg-slate-900 text-primary shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                    )}
                                  >
                                    {tab.label}
                                    <span className={cn(
                                      "text-[9px] px-1.5 py-0.5 rounded-full font-bold",
                                      selectedCategoryTab === tab.id
                                        ? "bg-primary/10 text-primary"
                                        : "bg-slate-200 dark:bg-white/10 text-muted-foreground"
                                    )}>
                                      {count}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Barra de Busca */}
                            <div className="relative flex-1 max-w-xs">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                              <input
                                type="text"
                                placeholder="Buscar tema..."
                                value={topicSearchQuery}
                                onChange={e => setTopicSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl h-9 pl-9 pr-4 text-xs font-bold text-foreground placeholder-slate-400 outline-none focus:border-primary transition-all"
                              />
                              {topicSearchQuery && (
                                <button
                                  type="button"
                                  onClick={() => setTopicSearchQuery('')}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-foreground"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Grid Split-Screen */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden min-h-0 items-stretch">

                          {/* Coluna Esquerda: Lista de Cards */}
                          <div className="lg:col-span-7 xl:col-span-8 overflow-y-auto pr-2 no-scrollbar space-y-3 pb-8">
                            {(() => {
                              const filtered = MENTORSHIP_TOPICS.filter(t => {
                                const matchesCategory = selectedCategoryTab === 'all' || t.category === selectedCategoryTab;
                                const matchesSearch = t.title.toLowerCase().includes(topicSearchQuery.toLowerCase()) ||
                                  t.shortDesc.toLowerCase().includes(topicSearchQuery.toLowerCase());
                                return matchesCategory && matchesSearch;
                              });

                              if (filtered.length === 0) {
                                return (
                                  <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-2xl bg-muted/5 mt-4">
                                    <AlertCircle className="text-muted-foreground mb-2" size={24} />
                                    <h5 className="text-xs font-black uppercase text-foreground">Nenhum tema encontrado</h5>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                      Tente alterar o filtro ou termo de busca para encontrar outros tópicos.
                                    </p>
                                  </div>
                                );
                              }

                              return (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                  {filtered.map(topic => {
                                    const IconComponent = TOPIC_ICON_MAP[topic.iconName] || Star;
                                    const isSelected = selectedTopicId === topic.id;
                                    const isFocused = focusedTopicIds.includes(topic.id);

                                    return (
                                      <div
                                        key={topic.id}
                                        onClick={() => setSelectedTopicId(topic.id)}
                                        className={cn(
                                          "group relative p-4 rounded-2xl border text-left cursor-pointer transition-all duration-300 flex flex-col justify-between select-none min-h-[120px] overflow-hidden",
                                          isSelected
                                            ? "bg-slate-50 dark:bg-slate-950/40 border-primary shadow-lg shadow-primary/5 ring-1 ring-primary"
                                            : isFocused
                                              ? "bg-amber-500/[0.02] border-amber-500/40 hover:border-amber-500"
                                              : "bg-white dark:bg-slate-900 border-border hover:border-primary/40 hover:shadow-md"
                                        )}
                                      >
                                        {/* Detalhe de gradiente de fundo se selecionado ou focado */}
                                        {isSelected && (
                                          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none -mr-4 -mt-4" />
                                        )}
                                        {isFocused && (
                                          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none -mr-4 -mt-4" />
                                        )}

                                        <div>
                                          {/* Cabeçalho do Card: Ícone e Estrela de Foco */}
                                          <div className="flex items-center justify-between gap-3 mb-2.5">
                                            <div
                                              className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-105"
                                              style={{
                                                backgroundColor: `${topic.color}12`,
                                                borderColor: `${topic.color}25`,
                                                color: topic.color
                                              }}
                                            >
                                              <IconComponent size={18} />
                                            </div>

                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleTopicFocus(topic.id);
                                              }}
                                              className="p-1.5 rounded-lg text-slate-300 dark:text-slate-700 hover:text-amber-500 dark:hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                                              title={isFocused ? "Remover Foco" : "Marcar em Foco"}
                                            >
                                              <Star
                                                size={16}
                                                className={cn(
                                                  "transition-all",
                                                  isFocused
                                                    ? "fill-amber-500 text-amber-500 scale-110"
                                                    : "text-slate-400 dark:text-slate-500"
                                                )}
                                              />
                                            </button>
                                          </div>

                                          {/* Título e Pilar */}
                                          <h4 className="text-xs font-black uppercase text-foreground leading-tight group-hover:text-primary transition-colors flex items-center gap-1.5">
                                            {topic.title}
                                          </h4>
                                          <p className="text-[10px] text-muted-foreground leading-relaxed mt-1.5 font-medium line-clamp-2">
                                            {topic.shortDesc}
                                          </p>
                                        </div>

                                        <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-2.5">
                                          <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                                            {topic.categoryLabel}
                                          </span>
                                          {isFocused && (
                                            <span className="text-[8px] font-black uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                                              ★ Em Foco
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Coluna Direita: Painel de Detalhes */}
                          <div className="lg:col-span-5 xl:col-span-4 flex flex-col overflow-y-auto no-scrollbar">
                            {(() => {
                              const topic = MENTORSHIP_TOPICS.find(t => t.id === selectedTopicId) || MENTORSHIP_TOPICS[0];
                              if (!topic) return null;

                              const IconComponent = TOPIC_ICON_MAP[topic.iconName] || Star;
                              const isFocused = focusedTopicIds.includes(topic.id);

                              return (
                                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 rounded-3xl p-6 space-y-6 flex-1 flex flex-col justify-between text-left relative overflow-y-auto no-scrollbar">
                                  {/* Glow de Categoria */}
                                  <div
                                    className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20"
                                    style={{ backgroundColor: topic.color }}
                                  />

                                  <div className="space-y-5">
                                    {/* Cabeçalho do Detalhe */}
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex items-center gap-3">
                                        <div
                                          className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-md"
                                          style={{
                                            backgroundColor: `${topic.color}15`,
                                            borderColor: `${topic.color}30`,
                                            color: topic.color
                                          }}
                                        >
                                          <IconComponent size={24} />
                                        </div>
                                        <div>
                                          <h3 className="text-sm font-black uppercase text-foreground leading-tight">
                                            {topic.title}
                                          </h3>
                                          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground bg-slate-200/50 dark:bg-white/5 px-2 py-0.5 rounded-md mt-1 inline-block">
                                            {topic.categoryLabel}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Estrela de Foco Rápido */}
                                      <button
                                        type="button"
                                        onClick={() => handleToggleTopicFocus(topic.id)}
                                        className={cn(
                                          "p-2.5 rounded-xl border transition-all flex items-center justify-center shadow-sm",
                                          isFocused
                                            ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                                            : "bg-white dark:bg-slate-900 border-border text-slate-400 hover:text-amber-500"
                                        )}
                                        title={isFocused ? "Remover Foco" : "Marcar em Foco"}
                                      >
                                        <Star size={16} className={isFocused ? "fill-amber-500" : ""} />
                                      </button>
                                    </div>

                                    {/* Por que é Crucial? */}
                                    <div className="space-y-1.5">
                                      <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        Por que é crucial?
                                      </h5>
                                      <p className="text-[11px] text-foreground font-semibold leading-relaxed">
                                        {topic.whyCrucial}
                                      </p>
                                    </div>

                                    {/* Checklist de Abordagem */}
                                    <div className="space-y-2.5">
                                      <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        O que abordar na mentoria:
                                      </h5>
                                      <ul className="space-y-2">
                                        {topic.bullets.map((bullet, idx) => (
                                          <li key={idx} className="flex items-start gap-2 text-[10.5px] text-slate-700 dark:text-slate-300 font-semibold leading-tight">
                                            <span
                                              className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5 text-[8px] font-black"
                                              style={{ backgroundColor: topic.color }}
                                            >
                                              {idx + 1}
                                            </span>
                                            <span>{bullet}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>

                                  {/* Sinais de Alerta */}
                                  <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/5 space-y-2.5">
                                    <h5 className="text-[9px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1.5">
                                      <AlertCircle size={12} className="text-rose-500" />
                                      Sinais de Alerta no Cliente:
                                    </h5>
                                    <div className="bg-rose-500/[0.03] border border-rose-500/10 rounded-2xl p-4 space-y-2">
                                      {topic.flags.map((flag, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-[10px] text-rose-600 dark:text-rose-400 font-bold leading-normal">
                                          <span className="text-[12px] leading-none select-none shrink-0">•</span>
                                          <span>{flag}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                        </div>
                      </div>
                    )}
                  </div> {/* md:col-span-9 */}
                </div> {/* grid */}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

// Forçar recompilação HMR do Vite e atualizar diagnósticos da IDE
