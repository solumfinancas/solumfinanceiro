import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../FinanceContext';
import { supabase } from '../lib/supabase';
import { formatCurrency, cn } from '../lib/utils';
import {
  User,
  Wallet,
  Brain,
  TrendingUp,
  Target,
  Award,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  Calendar,
  Save,
  CheckCircle2,
  Lock,
  Wrench,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Interface de estrutura de dados da Anamnese
interface AnamnesisData {
  anamnesisDate: string;

  // Etapa 1
  idade: string;
  estadoCivil: string;
  casadoFinanceiro: string;
  possuiFilhos: string; // "Sim" | "Não"
  qtdFilhos: number;
  qtdFilhosDependentes: number;
  pessoasDependentes: number;
  situacaoMoradia: string;
  escolaridade: string;
  situacaoProfissional: string;
  situacaoProfissionalOutro: string;

  // Etapa 2
  fontesRenda: string[];
  fontesRendaOutro: string;
  rendaLiquidaMinima: number;
  rendaTipo: string;
  sabeGastos: string;
  gastosVsRenda: string;
  possuiReserva: string;
  reservaMesesCobre: string;
  possuiDividas: string;
  totalDividas: string;
  tiposDividas: string[];
  investimentos: string;
  segurosPrevidencia: string;
  possuiVeiculos: string;
  tiposVeiculos: string; // "Carro" | "Moto" | "Ambos"
  qtdCarros: number;
  qtdMotos: number;
  veiculosQuitacao: string;
  gastosEducacao: string;
  gastosEducacaoComQue: string;
  gastosSaude: string;
  gastosSaudeComQue: string;

  // Etapa 3
  frequenciaAcompanhaGastos: string;
  ferramentaControle: string;
  comprasImpulso: string;
  gastosEmocionais: string;
  possuiCartao: string;
  qtdCartoes: number;
  usoCartao: string;
  pagaContasPrazo: string;
  recebeAjudaFinanceira: string;
  emprestaDinheiro: string;
  decisoesFinanceiras: string;
  planejaComprasNota: number; // 0 a 10
  planejaComprasPagamento: string;
  planejaComprasDinheiroPrevio: string;

  // Etapa 4
  dinheiroFamilia: string;
  fraseRelacaoDinheiro: string;
  guardarDinheiroSignificado: string;
  perfilRiscoInvestimento: string;
  falaDinheiroParceiro: string;
  culpaGastarConsigo: string;
  confiancaMudarFinanceiroNota: number; // 0 a 10
  dinheiroRepresenta: string[];

  // Etapa 5
  principalObjetivo: string;
  possuiOutrosObjetivos: string;
  outrosObjetivosTexto: string;
  definiuValoresObjetivos: string;
  definiuPrazosObjetivos: string;
  impedeObjetivos: string[];
  pensaAposentadoria: string;

  // Etapa 6
  motivoBuscaConsultoria: string;
  expectativaFinalProcesso: string;
  outrasInformacoes: string;
}

// Valores iniciais padrão
const defaultFormData = (): AnamnesisData => ({
  anamnesisDate: new Date().toISOString().split('T')[0],
  idade: '',
  estadoCivil: '',
  casadoFinanceiro: '',
  possuiFilhos: 'Não',
  qtdFilhos: 0,
  qtdFilhosDependentes: 0,
  pessoasDependentes: 0,
  situacaoMoradia: '',
  escolaridade: '',
  situacaoProfissional: '',
  situacaoProfissionalOutro: '',
  fontesRenda: [],
  fontesRendaOutro: '',
  rendaLiquidaMinima: 0,
  rendaTipo: '',
  sabeGastos: '',
  gastosVsRenda: '',
  possuiReserva: 'Não',
  reservaMesesCobre: '',
  possuiDividas: 'Não',
  totalDividas: '',
  tiposDividas: [],
  investimentos: '',
  segurosPrevidencia: '',
  possuiVeiculos: 'Não',
  tiposVeiculos: '',
  qtdCarros: 0,
  qtdMotos: 0,
  veiculosQuitacao: '',
  gastosEducacao: 'Não',
  gastosEducacaoComQue: '',
  gastosSaude: 'Não',
  gastosSaudeComQue: '',
  frequenciaAcompanhaGastos: '',
  ferramentaControle: '',
  comprasImpulso: '',
  gastosEmocionais: '',
  possuiCartao: 'Não',
  qtdCartoes: 0,
  usoCartao: '',
  pagaContasPrazo: '',
  recebeAjudaFinanceira: '',
  emprestaDinheiro: '',
  decisoesFinanceiras: '',
  planejaComprasNota: 5,
  planejaComprasPagamento: '',
  planejaComprasDinheiroPrevio: '',
  dinheiroFamilia: '',
  fraseRelacaoDinheiro: '',
  guardarDinheiroSignificado: '',
  perfilRiscoInvestimento: '',
  falaDinheiroParceiro: '',
  culpaGastarConsigo: '',
  confiancaMudarFinanceiroNota: 5,
  dinheiroRepresenta: [],
  principalObjetivo: '',
  possuiOutrosObjetivos: 'Não',
  outrosObjetivosTexto: '',
  definiuValoresObjetivos: 'Não',
  definiuPrazosObjetivos: 'Não',
  impedeObjetivos: [],
  pensaAposentadoria: '',
  motivoBuscaConsultoria: '',
  expectativaFinalProcesso: '',
  outrasInformacoes: ''
});

// Campos por etapa para monitoramento de alterações e salvamento parcial
const stepFields: Record<number, string[]> = {
  1: ['idade', 'estadoCivil', 'casadoFinanceiro', 'possuiFilhos', 'qtdFilhos', 'qtdFilhosDependentes', 'pessoasDependentes', 'situacaoMoradia', 'escolaridade', 'situacaoProfissional', 'situacaoProfissionalOutro', 'anamnesisDate'],
  2: ['fontesRenda', 'fontesRendaOutro', 'rendaLiquidaMinima', 'rendaTipo', 'sabeGastos', 'gastosVsRenda', 'possuiReserva', 'reservaMesesCobre', 'possuiDividas', 'totalDividas', 'tiposDividas', 'investimentos', 'segurosPrevidencia', 'possuiVeiculos', 'tiposVeiculos', 'qtdCarros', 'qtdMotos', 'veiculosQuitacao', 'gastosEducacao', 'gastosEducacaoComQue', 'gastosSaude', 'gastosSaudeComQue'],
  3: ['frequenciaAcompanhaGastos', 'ferramentaControle', 'comprasImpulso', 'gastosEmocionais', 'possuiCartao', 'qtdCartoes', 'usoCartao', 'pagaContasPrazo', 'recebeAjudaFinanceira', 'emprestaDinheiro', 'decisoesFinanceiras', 'planejaComprasNota', 'planejaComprasPagamento', 'planejaComprasDinheiroPrevio'],
  4: ['dinheiroFamilia', 'fraseRelacaoDinheiro', 'guardarDinheiroSignificado', 'perfilRiscoInvestimento', 'falaDinheiroParceiro', 'culpaGastarConsigo', 'confiancaMudarFinanceiroNota', 'dinheiroRepresenta'],
  5: ['principalObjetivo', 'possuiOutrosObjetivos', 'outrosObjetivosTexto', 'definiuValoresObjetivos', 'definiuPrazosObjetivos', 'impedeObjetivos', 'pensaAposentadoria'],
  6: ['motivoBuscaConsultoria', 'expectativaFinalProcesso', 'outrasInformacoes']
};

export const Anamnesis: React.FC = () => {
  const { user, viewingUserId, viewingProfile, profile } = useAuth();
  const { activeSpace } = useFinance();

  const targetUserId = viewingUserId || user?.id;
  const clientName = viewingUserId ? (viewingProfile?.full_name || 'Cliente') : (profile?.full_name || 'Você');

  // Estados principais
  const [formData, setFormData] = useState<AnamnesisData>(defaultFormData());
  const [originalData, setOriginalData] = useState<AnamnesisData>(defaultFormData());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fluxo de preenchimento inicial
  const [isCompleted, setIsCompleted] = useState(false);
  const [step, setStep] = useState(1);
  const [stepValidationErrors, setStepValidationErrors] = useState<string[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Ficha clínica expandida
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({
    1: true,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false
  });

  // Status de gravação por etapa no modo visualização
  const [savedStepsStatus, setSavedStepsStatus] = useState<Record<number, boolean>>({});

  // Carrega anamnese do Supabase
  useEffect(() => {
    if (!targetUserId) return;

    const fetchAnamnesis = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('anamnesis')
          .select('data')
          .eq('user_id', targetUserId)
          .eq('space', 'personal')
          .maybeSingle();

        if (error) throw error;

        if (data?.data) {
          const loaded = {
            ...defaultFormData(),
            ...data.data
          };
          setFormData(loaded);
          setOriginalData(loaded);
          setIsCompleted(true);
        } else {
          setIsCompleted(false);
          setStep(1);
        }
      } catch (err) {
        console.error('Erro ao buscar anamnese:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnamnesis();
  }, [targetUserId]);

  // Sincroniza filhos dependentes se "possuiFilhos" mudar ou "qtdFilhos" mudar no preenchimento
  useEffect(() => {
    if (formData.possuiFilhos === 'Sim' && formData.qtdFilhos > 0) {
      // Se filhos dependentes for maior do que a nova quantidade de filhos, ajusta
      if (formData.qtdFilhosDependentes > formData.qtdFilhos || formData.qtdFilhosDependentes === 0) {
        setFormData(prev => ({ ...prev, qtdFilhosDependentes: prev.qtdFilhos }));
      }
    } else if (formData.possuiFilhos === 'Não') {
      setFormData(prev => ({ ...prev, qtdFilhos: 0, qtdFilhosDependentes: 0 }));
    }
  }, [formData.possuiFilhos, formData.qtdFilhos]);

  // Calcula total de dependentes financeiros
  const totalDependentes = useMemo(() => {
    const filhosDep = formData.possuiFilhos === 'Sim' ? formData.qtdFilhosDependentes : 0;
    return Number(formData.pessoasDependentes || 0) + Number(filhosDep);
  }, [formData.pessoasDependentes, formData.possuiFilhos, formData.qtdFilhosDependentes]);

  // Valida campos obrigatórios/ativos por etapa
  const validateStep = (stepNum: number): string[] => {
    const errors: string[] = [];

    if (stepNum === 1) {
      if (!formData.idade) errors.push('Idade');
      if (!formData.estadoCivil) errors.push('Estado Civil');
      if ((formData.estadoCivil === 'Casado(a)' || formData.estadoCivil === 'União Estável') && !formData.casadoFinanceiro) {
        errors.push('Como organizam o financeiro do casal');
      }
      if (formData.possuiFilhos === 'Sim' && formData.qtdFilhos <= 0) {
        errors.push('Quantidade de filhos');
      }
      if (!formData.situacaoMoradia) errors.push('Situação de moradia');
      if (!formData.escolaridade) errors.push('Nível de escolaridade');
      if (!formData.situacaoProfissional) errors.push('Situação profissional');
      if (formData.situacaoProfissional === 'Outro' && !formData.situacaoProfissionalOutro) {
        errors.push('Descrição da situação profissional');
      }
    }

    if (stepNum === 2) {
      if (formData.fontesRenda.length === 0) errors.push('Fontes de Renda');
      if (formData.fontesRenda.includes('Outro') && !formData.fontesRendaOutro) {
        errors.push('Descrição da outra fonte de renda');
      }
      if (formData.rendaLiquidaMinima <= 0) errors.push('Renda mensal líquida');
      if (!formData.rendaTipo) errors.push('Tipo de renda');
      if (!formData.sabeGastos) errors.push('Você sabe quanto gasta');
      if (!formData.gastosVsRenda) errors.push('Proporção dos gastos mensais');
      if (formData.possuiReserva === 'Sim' && !formData.reservaMesesCobre) {
        errors.push('Cobertura da reserva de emergência');
      }
      if (formData.possuiDividas === 'Sim') {
        if (!formData.totalDividas) errors.push('Total aproximado de dívidas');
        if (formData.tiposDividas.length === 0) errors.push('Tipos de dívidas');
      }
      if (!formData.investimentos) errors.push('Possui investimentos');
      if (formData.segurosPrevidencia === 'Sim' && !formData.segurosPrevidencia) {
        errors.push('Seguros/Previdência');
      }
      if (formData.possuiVeiculos === 'Sim') {
        if (!formData.tiposVeiculos) errors.push('Tipo de veículo');
        if (formData.tiposVeiculos === 'Carro' && formData.qtdCarros <= 0) errors.push('Quantidade de carros');
        if (formData.tiposVeiculos === 'Moto' && formData.qtdMotos <= 0) errors.push('Quantidade de motos');
        if (formData.tiposVeiculos === 'Ambos' && (formData.qtdCarros <= 0 || formData.qtdMotos <= 0)) {
          errors.push('Quantidade de carros e motos');
        }
        if (!formData.veiculosQuitacao) errors.push('Situação do veículo');
      }
      if (formData.gastosEducacao === 'Sim' && !formData.gastosEducacaoComQue) {
        errors.push('Descrição dos gastos com educação');
      }
      if (formData.gastosSaude === 'Sim' && !formData.gastosSaudeComQue) {
        errors.push('Descrição dos gastos com saúde');
      }
    }

    if (stepNum === 3) {
      if (!formData.frequenciaAcompanhaGastos) errors.push('Frequência de acompanhamento');
      if (formData.frequenciaAcompanhaGastos !== 'Nunca' && !formData.ferramentaControle) {
        errors.push('Ferramenta de controle financeiro');
      }
      if (!formData.comprasImpulso) errors.push('Compras por impulso');
      if (!formData.gastosEmocionais) errors.push('Gastos por estresse/tristeza');
      if (formData.possuiCartao === 'Sim') {
        if (formData.qtdCartoes <= 0) errors.push('Quantidade de cartões');
        if (!formData.usoCartao) errors.push('Uso do cartão de crédito');
      }
      if (!formData.pagaContasPrazo) errors.push('Pagamento de contas no prazo');
      if (!formData.recebeAjudaFinanceira) errors.push('Receber dinheiro de familiares/amigos');
      if (!formData.emprestaDinheiro) errors.push('Emprestar dinheiro para familiares/amigos');
      if ((formData.estadoCivil === 'Casado(a)' || formData.estadoCivil === 'União Estável') && !formData.decisoesFinanceiras) {
        errors.push('Como tomam decisões financeiras importantes');
      }
      if (formData.planejaComprasNota > 0) {
        if (!formData.planejaComprasPagamento) errors.push('Forma de pagamento das compras planejadas');
        if (formData.planejaComprasPagamento === 'Parcelado' && !formData.planejaComprasDinheiroPrevio) {
          errors.push('Disponibilidade prévia de dinheiro nas parcelas');
        }
      }
    }

    if (stepNum === 4) {
      if (!formData.dinheiroFamilia) errors.push('Tratamento de dinheiro na família');
      if (!formData.fraseRelacaoDinheiro) errors.push('Frase que descreve relação com dinheiro');
      if (!formData.guardarDinheiroSignificado) errors.push('Significado de guardar dinheiro');
      if (!formData.perfilRiscoInvestimento) errors.push('Perfil de risco');
      if ((formData.estadoCivil === 'Casado(a)' || formData.estadoCivil === 'União Estável') && !formData.falaDinheiroParceiro) {
        errors.push('Falar abertamente sobre dinheiro com parceiro(a)');
      }
      if (!formData.culpaGastarConsigo) errors.push('Sentir culpa ao gastar consigo mesmo');
      if (formData.dinheiroRepresenta.length === 0) errors.push('O que o dinheiro representa');
    }

    if (stepNum === 5) {
      if (!formData.principalObjetivo) errors.push('Principal objetivo financeiro');
      if (formData.possuiOutrosObjetivos === 'Sim' && !formData.outrosObjetivosTexto) {
        errors.push('Outros objetivos financeiros');
      }
      if (!formData.definiuValoresObjetivos) errors.push('Definiu valores para os objetivos');
      if (formData.definiuValoresObjetivos === 'Sim' && !formData.definiuPrazosObjetivos) {
        errors.push('Definiu prazos para os objetivos');
      }
      if (formData.impedeObjetivos.length === 0) errors.push('O que impede de alcançar objetivos');
      if (!formData.pensaAposentadoria) errors.push('Pensa em aposentadoria');
    }

    if (stepNum === 6) {
      if (!formData.motivoBuscaConsultoria) errors.push('O que te fez buscar consultoria');
      if (!formData.expectativaFinalProcesso) errors.push('O que espera alcançar');
    }

    return errors;
  };

  // Verifica se um campo específico está pendente/vazio
  const isFieldPending = (fieldName: keyof AnamnesisData): boolean => {
    const val = formData[fieldName];

    // Condicionais de exibição/ativação
    if (fieldName === 'casadoFinanceiro' || fieldName === 'decisoesFinanceiras' || fieldName === 'falaDinheiroParceiro') {
      if (formData.estadoCivil !== 'Casado(a)' && formData.estadoCivil !== 'União Estável') return false;
    }
    if (fieldName === 'qtdFilhos' || fieldName === 'qtdFilhosDependentes') {
      if (formData.possuiFilhos !== 'Sim') return false;
    }
    if (fieldName === 'situacaoProfissionalOutro') {
      if (formData.situacaoProfissional !== 'Outro') return false;
    }
    if (fieldName === 'fontesRendaOutro') {
      if (!formData.fontesRenda.includes('Outro')) return false;
    }
    if (fieldName === 'reservaMesesCobre') {
      if (formData.possuiReserva !== 'Sim') return false;
    }
    if (fieldName === 'totalDividas' || fieldName === 'tiposDividas') {
      if (formData.possuiDividas !== 'Sim') return false;
    }
    if (fieldName === 'tiposVeiculos' || fieldName === 'veiculosQuitacao') {
      if (formData.possuiVeiculos !== 'Sim') return false;
    }
    if (fieldName === 'qtdCarros') {
      if (formData.possuiVeiculos !== 'Sim' || (formData.tiposVeiculos !== 'Carro' && formData.tiposVeiculos !== 'Ambos')) return false;
    }
    if (fieldName === 'qtdMotos') {
      if (formData.possuiVeiculos !== 'Sim' || (formData.tiposVeiculos !== 'Moto' && formData.tiposVeiculos !== 'Ambos')) return false;
    }
    if (fieldName === 'gastosEducacaoComQue') {
      if (formData.gastosEducacao !== 'Sim') return false;
    }
    if (fieldName === 'gastosSaudeComQue') {
      if (formData.gastosSaude !== 'Sim') return false;
    }
    if (fieldName === 'ferramentaControle') {
      if (formData.frequenciaAcompanhaGastos === 'Nunca') return false;
    }
    if (fieldName === 'qtdCartoes' || fieldName === 'usoCartao') {
      if (formData.possuiCartao !== 'Sim') return false;
    }
    if (fieldName === 'planejaComprasPagamento') {
      if (formData.planejaComprasNota === 0) return false;
    }
    if (fieldName === 'planejaComprasDinheiroPrevio') {
      if (formData.planejaComprasNota === 0 || (formData.planejaComprasPagamento !== 'Parcelado' && formData.planejaComprasPagamento !== 'Parceladas')) return false;
    }
    if (fieldName === 'outrosObjetivosTexto') {
      if (formData.possuiOutrosObjetivos !== 'Sim') return false;
    }
    if (fieldName === 'definiuPrazosObjetivos') {
      if (formData.definiuValoresObjetivos !== 'Sim') return false;
    }
    // Observações finais da Etapa 6 é opcional por definição
    if (fieldName === 'outrasInformacoes') return false;

    // Checagem de valor
    if (Array.isArray(val)) return val.length === 0;
    if (typeof val === 'number') return val === 0 && fieldName === 'rendaLiquidaMinima';
    return !val;
  };

  // Renderiza um label com o triângulo de alerta se o campo estiver pendente
  const renderFieldLabel = (text: string, fieldName: keyof AnamnesisData, extraClass?: string) => (
    <div className={cn("flex items-center gap-1.5 mb-1", extraClass)}>
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">{text}</label>
      {isFieldPending(fieldName) && (
        <AlertTriangle size={12} className="text-amber-500 animate-pulse shrink-0" />
      )}
    </div>
  );
  // Conta pendências totais por etapa
  const countPendingByStep = (stepNum: number): number => {
    const fields = stepFields[stepNum];
    return fields.filter(field => isFieldPending(field as keyof AnamnesisData)).length;
  };

  // Salva anamnese completa/parcial no Supabase
  const saveAnamnesis = async (partialData?: Partial<AnamnesisData>) => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('anamnesis')
        .select('id, data')
        .eq('user_id', targetUserId)
        .eq('space', 'personal')
        .maybeSingle();

      const mergedData = {
        ...(existing?.data || {}),
        ...formData,
        ...(partialData || {})
      };

      const payload = {
        user_id: targetUserId,
        space: 'personal',
        data: mergedData,
        updated_at: new Date().toISOString()
      };

      if (existing?.id) {
        await supabase
          .from('anamnesis')
          .update(payload)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('anamnesis')
          .insert({
            ...payload,
            created_at: new Date().toISOString()
          });
      }

      setOriginalData(JSON.parse(JSON.stringify(mergedData)));
      setFormData(mergedData);
    } catch (err) {
      console.error('Erro ao salvar anamnese:', err);
    } finally {
      setSaving(false);
    }
  };

  // Avança de etapa no questionário inicial
  const handleNextStep = async () => {
    const errors = validateStep(step);
    if (errors.length > 0) {
      setStepValidationErrors(errors);
      setShowValidationModal(true);
    } else {
      await saveAnamnesis();
      setStep(prev => prev + 1);
    }
  };

  // Finaliza o preenchimento inicial
  const handleFinish = async () => {
    const errors = validateStep(6);
    if (errors.length > 0) {
      setStepValidationErrors(errors);
      setShowValidationModal(true);
    } else {
      await saveAnamnesis();
      setIsCompleted(true);
    }
  };

  // Avança mesmo se faltar preencher algum campo
  const handleProceedWithMissing = async () => {
    setShowValidationModal(false);
    setStepValidationErrors([]);
    await saveAnamnesis();
    if (step === 6) {
      setIsCompleted(true);
    } else {
      setStep(prev => prev + 1);
    }
  };

  // Salva alterações rápidas de um card individual no modo visualização
  const handleSaveStepData = async (stepNum: number) => {
    const fields = stepFields[stepNum];
    const partial: any = {};
    fields.forEach(f => {
      partial[f] = formData[f as keyof AnamnesisData];
    });

    await saveAnamnesis(partial as Partial<AnamnesisData>);

    // Atualiza status de salvo
    setSavedStepsStatus(prev => ({ ...prev, [stepNum]: true }));
    setTimeout(() => {
      setSavedStepsStatus(prev => ({ ...prev, [stepNum]: false }));
    }, 3000);
  };

  // Verifica se uma determinada etapa foi modificada na visualização da Ficha
  const isStepModified = (stepNum: number): boolean => {
    const fields = stepFields[stepNum];
    return fields.some(f => {
      const current = formData[f as keyof AnamnesisData];
      const original = originalData[f as keyof AnamnesisData];
      if (Array.isArray(current) || Array.isArray(original)) {
        return JSON.stringify(current) !== JSON.stringify(original);
      }
      return current !== original;
    });
  };

  // Toggle de seleção múltipla
  const handleToggleMultiSelect = (fieldName: keyof AnamnesisData, option: string) => {
    const currentList = (formData[fieldName] as string[]) || [];
    const updatedList = currentList.includes(option)
      ? currentList.filter(item => item !== option)
      : [...currentList, option];
    setFormData(prev => ({ ...prev, [fieldName]: updatedList }));
  };

  // Seletor de moeda (Renda mensal líquida)
  const handleRendaChange = (val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    const numVal = cleanVal ? parseFloat(cleanVal) / 100 : 0;
    setFormData(prev => ({ ...prev, rendaLiquidaMinima: numVal }));
  };

  // Renderizador do progresso
  const renderProgressBar = (isCompact: boolean) => {
    const currentPercent = isCompleted ? 100 : Math.round(((step - 1) / 6) * 100);
    return (
      <div className={cn("bg-card/40 border border-border p-4 rounded-2xl mb-6 shadow-sm", isCompact ? "py-3 px-4 mb-4" : "p-4")}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {isCompleted ? "Ficha Clínica Completa" : `Etapa ${step} de 6`}
          </span>
          <span className="text-xs font-black text-primary">{currentPercent}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="bg-primary h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${currentPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    );
  };

  // Chaveador do Espaço Empresarial em Desenvolvimento
  if (activeSpace === 'business') {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[70vh]">
        <div className="max-w-md w-full bg-card border border-border p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
          <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary animate-pulse">
            <Wrench size={32} />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest border border-primary/20">
              Espaço Empresarial
            </span>
            <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Em Desenvolvimento</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A Anamnese Empresarial está em fase de modelagem de dados para estruturar o diagnóstico completo de fluxo de caixa, endividamento corporativo e DRE do seu cliente PJ.
            </p>
          </div>
          <div className="p-4 bg-muted/40 rounded-2xl border border-border/60 text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center justify-center gap-2">
            <Lock size={14} className="text-amber-500 shrink-0" />
            Funcionalidades liberadas no Espaço Pessoal
          </div>
        </div>
      </div>
    );
  }

  // Loader de carregamento
  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoaderSpinner />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Carregando Ficha...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto w-full">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-border/40 pb-6">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground flex items-center gap-3">
            <ClipboardList className="text-primary" size={28} />
            Anamnese Pessoal
          </h2>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Diagnóstico financeiro e comportamental de <strong className="text-foreground">{clientName}</strong>
          </p>
        </div>

        {/* Data de quando foi realizada */}
        <div className="flex items-center gap-3 bg-muted/30 border border-border/80 px-4 py-2 rounded-2xl shadow-sm">
          <Calendar size={16} className="text-primary shrink-0" />
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Data da Anamnese</span>
            <input
              type="date"
              value={formData.anamnesisDate}
              onChange={e => {
                const nextVal = e.target.value;
                setFormData(prev => ({ ...prev, anamnesisDate: nextVal }));
                if (isCompleted) {
                  setOriginalData(prev => ({ ...prev, anamnesisDate: nextVal }));
                  saveAnamnesis({ anamnesisDate: nextVal });
                }
              }}
              className="bg-transparent border-none text-xs font-bold text-foreground outline-none p-0 h-5"
            />
          </div>
        </div>
      </div>

      {/* 1. FLUXO DE PRIMEIRO PREENCHIMENTO */}
      {!isCompleted ? (
        <div className="space-y-6">
          {renderProgressBar(false)}

          <div className="bg-card border border-border rounded-[2rem] p-6 lg:p-8 shadow-sm space-y-6 relative overflow-hidden">
            {/* Animação das etapas */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {step === 1 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                      <User className="text-primary" size={20} />
                      1. Perfil Pessoal e Familiar
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Qual a sua Idade?</label>
                        <input
                          type="number"
                          value={formData.idade}
                          onChange={e => setFormData(prev => ({ ...prev, idade: e.target.value }))}
                          placeholder="Ex: 34"
                          className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Qual o seu Estado Civil?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.estadoCivil}
                            onChange={e => setFormData(prev => ({ ...prev, estadoCivil: e.target.value, casadoFinanceiro: '' }))}
                            className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            <option value="Solteiro(a)">Solteiro(a)</option>
                            <option value="Casado(a)">Casado(a)</option>
                            <option value="União Estável">União Estável</option>
                            <option value="Divorciado(a)">Divorciado(a)</option>
                            <option value="Viúvo(a)">Viúvo(a)</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {(formData.estadoCivil === 'Casado(a)' || formData.estadoCivil === 'União Estável') && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2 bg-primary/5 border border-primary/20 p-5 rounded-2xl"
                      >
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2 block">Como o financeiro do casal é organizado?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.casadoFinanceiro}
                            onChange={e => setFormData(prev => ({ ...prev, casadoFinanceiro: e.target.value }))}
                            className="w-full bg-card border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            <option value="Totalmente junto">Totalmente junto</option>
                            <option value="Totalmente separado">Totalmente separado</option>
                            <option value="Separado, mas pensando em juntar">Separado, mas pensando em juntar</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </motion.div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Você Possui Filhos?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.possuiFilhos}
                            onChange={e => setFormData(prev => ({ ...prev, possuiFilhos: e.target.value }))}
                            className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="Não">Não</option>
                            <option value="Sim">Sim</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      {formData.possuiFilhos === 'Sim' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Quantos?</label>
                            <input
                              type="number"
                              min="1"
                              value={formData.qtdFilhos || ''}
                              onChange={e => setFormData(prev => ({ ...prev, qtdFilhos: Math.max(0, Number(e.target.value)) }))}
                              className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Dependentes?</label>
                            <input
                              type="number"
                              min="0"
                              max={formData.qtdFilhos}
                              value={formData.qtdFilhosDependentes || ''}
                              onChange={e => setFormData(prev => ({ ...prev, qtdFilhosDependentes: Math.min(prev.qtdFilhos, Math.max(0, Number(e.target.value))) }))}
                              className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                            />
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className="bg-muted/30 p-5 rounded-2xl border border-border/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Quantas pessoas dependem financeiramente de você (excluindo filhos)?</label>
                        <p className="text-[10px] text-muted-foreground ml-2">Familiares, pais, agregados, etc.</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <input
                          type="number"
                          min="0"
                          value={formData.pessoasDependentes}
                          onChange={e => setFormData(prev => ({ ...prev, pessoasDependentes: Math.max(0, Number(e.target.value)) }))}
                          className="w-20 bg-card border border-border rounded-xl h-12 px-3 text-center text-sm text-foreground outline-none focus:border-primary/50 font-bold"
                        />
                        <div className="text-right">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Total Dependentes</span>
                          <span className="text-xl font-black text-primary">{totalDependentes}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Qual a sua Situação de Moradia?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.situacaoMoradia}
                            onChange={e => setFormData(prev => ({ ...prev, situacaoMoradia: e.target.value }))}
                            className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            <option value="Própria Quitada">Própria Quitada</option>
                            <option value="Própria Financiada">Própria Financiada</option>
                            <option value="Alugada">Alugada</option>
                            <option value="Mora com Pais/Familiares">Mora com Pais/Familiares</option>
                            <option value="Cedida/Funcional">Cedida/Funcional</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Qual o seu Nível de Escolaridade?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.escolaridade}
                            onChange={e => setFormData(prev => ({ ...prev, escolaridade: e.target.value }))}
                            className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            <option value="Fundamental">Ensino Fundamental</option>
                            <option value="Médio">Ensino Médio</option>
                            <option value="Superior Incompleto">Ensino Superior Incompleto</option>
                            <option value="Superior Completo">Ensino Superior Completo</option>
                            <option value="Pós-Graduação">Pós-Graduação/Especialização</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Qual a sua Situação Profissional?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.situacaoProfissional}
                            onChange={e => setFormData(prev => ({ ...prev, situacaoProfissional: e.target.value, situacaoProfissionalOutro: '' }))}
                            className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            <option value="CLT">CLT (Carteira Assinada)</option>
                            <option value="Autônomo/Liberal">Autônomo / Profissional Liberal</option>
                            <option value="Empresário/Sócio">Empresário / Sócio de Empresa</option>
                            <option value="Servidor Público">Servidor Público</option>
                            <option value="Aposentado">Aposentado / Pensionista</option>
                            <option value="Outro">Outro</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {formData.situacaoProfissional === 'Outro' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2 bg-primary/5 border border-primary/20 p-5 rounded-2xl"
                      >
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2 block">Especifique a sua Situação Profissional:</label>
                        <input
                          type="text"
                          value={formData.situacaoProfissionalOutro}
                          onChange={e => setFormData(prev => ({ ...prev, situacaoProfissionalOutro: e.target.value }))}
                          placeholder="Descreva..."
                          className="w-full bg-card border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                        />
                      </motion.div>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                      <Wallet className="text-primary" size={20} />
                      2. Situação Financeira Atual
                    </h3>

                    {/* Fontes de Renda */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Quais suas fontes de rendas? (Pode selecionar mais de uma)</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {['Salário CLT', 'Pró-Labore', 'Autônomo', 'Aluguéis', 'Rendimento de Investimentos', 'Pensão/Aposentadoria', 'Outro'].map((op) => {
                          const isSelected = formData.fontesRenda.includes(op);
                          return (
                            <button
                              key={op}
                              type="button"
                              onClick={() => handleToggleMultiSelect('fontesRenda', op)}
                              className={cn(
                                "p-3 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center min-h-[44px]",
                                isSelected
                                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
                                  : "bg-muted/20 border-border text-muted-foreground hover:bg-muted/40"
                              )}
                            >
                              {op}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {formData.fontesRenda.includes('Outro') && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2 bg-primary/5 border border-primary/20 p-5 rounded-2xl animate-fade-in"
                      >
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2 block">Especifique a outra fonte de renda:</label>
                        <input
                          type="text"
                          value={formData.fontesRendaOutro}
                          onChange={e => setFormData(prev => ({ ...prev, fontesRendaOutro: e.target.value }))}
                          placeholder="Descreva..."
                          className="w-full bg-card border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 font-bold"
                        />
                      </motion.div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Renda mensal líquida mínima */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Qual sua renda mensal líquida mínima?</label>
                        <div className="relative flex items-center">
                          <span className="absolute left-4 text-xs font-black text-muted-foreground/60 select-none">R$</span>
                          <input
                            type="text"
                            value={formData.rendaLiquidaMinima.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            onChange={e => handleRendaChange(e.target.value)}
                            className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-11 pr-4 text-sm text-foreground outline-none focus:border-primary/50 font-bold"
                          />
                        </div>
                      </div>

                      {/* Tipo de renda */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Sua renda é fixa ou variável?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.rendaTipo}
                            onChange={e => setFormData(prev => ({ ...prev, rendaTipo: e.target.value }))}
                            className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            <option value="Fixa">Fixa</option>
                            <option value="Variável">Variável</option>
                            <option value="Mista">Mista (Fixa + Variável)</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Sabe quanto gasta */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Você sabe exatamente quanto gasta por mês?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.sabeGastos}
                            onChange={e => setFormData(prev => ({ ...prev, sabeGastos: e.target.value }))}
                            className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            <option value="Sei Exatamente (anoto tudo)">Sei Exatamente (anoto tudo)</option>
                            <option value="Tenho uma boa noção">Tenho uma boa noção</option>
                            <option value="Não tenho ideia">Não tenho ideia</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      {/* Gastos mensais costumam ser */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Como são seus gastos mensais em relação à renda?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.gastosVsRenda}
                            onChange={e => setFormData(prev => ({ ...prev, gastosVsRenda: e.target.value }))}
                            className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            <option value="Menores que a renda">Menores que a renda (Sobra dinheiro)</option>
                            <option value="Iguais à renda">Iguais à renda (Zero a zero)</option>
                            <option value="Maiores que a renda">Maiores que a renda (Fica no vermelho)</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Reserva de emergência */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/10 p-5 rounded-2xl border border-border/50">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Possui reserva de emergência?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.possuiReserva}
                            onChange={e => setFormData(prev => ({ ...prev, possuiReserva: e.target.value, reservaMesesCobre: '' }))}
                            className="w-full bg-card border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="Não">Não</option>
                            <option value="Sim">Sim</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      {formData.possuiReserva === 'Sim' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="space-y-2"
                        >
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Quantos meses de despesas ela cobre?</label>
                          <div className="relative w-full">
                            <select
                              value={formData.reservaMesesCobre}
                              onChange={e => setFormData(prev => ({ ...prev, reservaMesesCobre: e.target.value }))}
                              className="w-full bg-card border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                            >
                              <option value="">Selecione...</option>
                              <option value="Menos de 3 meses">Menos de 3 meses</option>
                              <option value="De 3 a 6 meses">De 3 a 6 meses</option>
                              <option value="De 6 a 12 meses">De 6 a 12 meses</option>
                              <option value="Mais de 12 meses">Mais de 12 meses</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Dívidas ativas */}
                    <div className="space-y-4 bg-rose-500/5 p-5 rounded-2xl border border-rose-500/10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 ml-2">Possui dívidas ativas?</label>
                          <div className="relative w-full">
                            <select
                              value={formData.possuiDividas}
                              onChange={e => setFormData(prev => ({ ...prev, possuiDividas: e.target.value, totalDividas: '', tiposDividas: [] }))}
                              className="w-full bg-card border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                            >
                              <option value="Não">Não</option>
                              <option value="Sim">Sim</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          </div>
                        </div>

                        {formData.possuiDividas === 'Sim' && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-2"
                          >
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Total aproximado das dívidas:</label>
                            <div className="relative w-full">
                              <select
                                value={formData.totalDividas}
                                onChange={e => setFormData(prev => ({ ...prev, totalDividas: e.target.value }))}
                                className="w-full bg-card border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                              >
                                <option value="">Selecione...</option>
                                <option value="Até R$ 5.000">Até R$ 5.000</option>
                                <option value="De R$ 5.000 a R$ 20.000">De R$ 5.000 a R$ 20.000</option>
                                <option value="De R$ 20.000 a R$ 50.000">De R$ 20.000 a R$ 50.000</option>
                                <option value="De R$ 50.000 a R$ 100.000">De R$ 50.000 a R$ 100.000</option>
                                <option value="Mais de R$ 100.000">Mais de R$ 100.000</option>
                              </select>
                              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {formData.possuiDividas === 'Sim' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2 border-t border-border pt-4 mt-2"
                        >
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Quais os tipos de dívidas? (Selecione todas que aplicam)</label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {['Cartão de Crédito', 'Cheque Especial', 'Empréstimo', 'Financiamento Veículo', 'Financiamento Imobiliário', 'Família/Amigos', 'Outros'].map(tipo => {
                              const isSelected = formData.tiposDividas.includes(tipo);
                              return (
                                <button
                                  key={tipo}
                                  type="button"
                                  onClick={() => handleToggleMultiSelect('tiposDividas', tipo)}
                                  className={cn(
                                    "p-2.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all text-center",
                                    isSelected
                                      ? "bg-rose-500/15 border-rose-500 text-rose-500"
                                      : "bg-card border-border text-muted-foreground hover:bg-muted/40"
                                  )}
                                >
                                  {tipo}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Possui investimentos?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.investimentos}
                            onChange={e => setFormData(prev => ({ ...prev, investimentos: e.target.value }))}
                            className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            <option value="Não">Não possuo</option>
                            <option value="Apenas Poupança">Apenas Poupança</option>
                            <option value="Cofrinhos/Caixinhas">Cofrinhos/Caixinhas</option>
                            <option value="Poupança e Conservadores">Poupança e outros conservadores (Renda Fixa)</option>
                            <option value="Carteira Diversificada">Carteira Diversificada (Renda Fixa + Variável)</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Possui seguro de vida ou previdência privada?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.segurosPrevidencia}
                            onChange={e => setFormData(prev => ({ ...prev, segurosPrevidencia: e.target.value }))}
                            className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            <option value="Não">Não possuo</option>
                            <option value="Seguro de Vida">Seguro de Vida</option>
                            <option value="Previdência Privada">Previdência Privada</option>
                            <option value="Ambos">Possuo Ambos</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Veículos */}
                    <div className="space-y-4 bg-muted/10 p-5 rounded-2xl border border-border/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Possui veículos?</label>
                          <div className="relative w-full">
                            <select
                              value={formData.possuiVeiculos}
                              onChange={e => setFormData(prev => ({ ...prev, possuiVeiculos: e.target.value, tiposVeiculos: '', qtdCarros: 0, qtdMotos: 0, veiculosQuitacao: '' }))}
                              className="w-full bg-card border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                            >
                              <option value="Não">Não</option>
                              <option value="Sim">Sim</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          </div>
                        </div>

                        {formData.possuiVeiculos === 'Sim' && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-2"
                          >
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Tipo de veículo:</label>
                            <div className="relative w-full">
                              <select
                                value={formData.tiposVeiculos}
                                onChange={e => setFormData(prev => ({ ...prev, tiposVeiculos: e.target.value, qtdCarros: e.target.value === 'Moto' ? 0 : 1, qtdMotos: e.target.value === 'Carro' ? 0 : 1 }))}
                                className="w-full bg-card border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                              >
                                <option value="">Selecione...</option>
                                <option value="Carro">Carro</option>
                                <option value="Moto">Moto</option>
                                <option value="Ambos">Ambos (Carro e Moto)</option>
                              </select>
                              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {formData.possuiVeiculos === 'Sim' && formData.tiposVeiculos && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-border/50"
                        >
                          {(formData.tiposVeiculos === 'Carro' || formData.tiposVeiculos === 'Ambos') && (
                            <div className="space-y-2 animate-fade-in">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Qtd Carros</label>
                              <input
                                type="number"
                                min="1"
                                value={formData.qtdCarros || ''}
                                onChange={e => setFormData(prev => ({ ...prev, qtdCarros: Math.max(0, Number(e.target.value)) }))}
                                className="w-full bg-card border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 font-bold"
                              />
                            </div>
                          )}

                          {(formData.tiposVeiculos === 'Moto' || formData.tiposVeiculos === 'Ambos') && (
                            <div className="space-y-2 animate-fade-in">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Qtd Motas</label>
                              <input
                                type="number"
                                min="1"
                                value={formData.qtdMotos || ''}
                                onChange={e => setFormData(prev => ({ ...prev, qtdMotos: Math.max(0, Number(e.target.value)) }))}
                                className="w-full bg-card border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 font-bold"
                              />
                            </div>
                          )}

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Situação do(s) veículo(s)</label>
                            <div className="relative w-full">
                              <select
                                value={formData.veiculosQuitacao}
                                onChange={e => setFormData(prev => ({ ...prev, veiculosQuitacao: e.target.value }))}
                                className="w-full bg-card border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 font-bold appearance-none cursor-pointer"
                              >
                                <option value="">Selecione...</option>
                                <option value="Quitado">Quitado</option>
                                <option value="Financiado">Financiado</option>
                                <option value="Consórcio">Consórcio</option>
                                <option value="Misto">Misto (Algum quitado / outro financiado)</option>
                              </select>
                              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Gastos fixos Educação */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/10 p-5 rounded-2xl border border-border/50">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Gastos fixos com educação?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.gastosEducacao}
                            onChange={e => setFormData(prev => ({ ...prev, gastosEducacao: e.target.value, gastosEducacaoComQue: '' }))}
                            className="w-full bg-card border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="Não">Não</option>
                            <option value="Sim">Sim</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      {formData.gastosEducacao === 'Sim' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="space-y-2"
                        >
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Com o que?</label>
                          <input
                            type="text"
                            value={formData.gastosEducacaoComQue}
                            onChange={e => setFormData(prev => ({ ...prev, gastosEducacaoComQue: e.target.value }))}
                            placeholder="Ex: Faculdade, Escola filhos"
                            className="w-full bg-card border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 font-bold"
                          />
                        </motion.div>
                      )}
                    </div>

                    {/* Gastos fixos Saúde */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/10 p-5 rounded-2xl border border-border/50">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Gastos fixos com saúde?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.gastosSaude}
                            onChange={e => setFormData(prev => ({ ...prev, gastosSaude: e.target.value, gastosSaudeComQue: '' }))}
                            className="w-full bg-card border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="Não">Não</option>
                            <option value="Sim">Sim</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      {formData.gastosSaude === 'Sim' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="space-y-2"
                        >
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Com o que?</label>
                          <input
                            type="text"
                            value={formData.gastosSaudeComQue}
                            onChange={e => setFormData(prev => ({ ...prev, gastosSaudeComQue: e.target.value }))}
                            placeholder="Ex: Plano de Saúde, Remédios de uso contínuo"
                            className="w-full bg-card border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 font-bold"
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                      <Brain className="text-primary" size={20} />
                      3. Comportamentos Financeiros
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Com que frequência acompanha seus gastos?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.frequenciaAcompanhaGastos}
                            onChange={e => setFormData(prev => ({ ...prev, frequenciaAcompanhaGastos: e.target.value, ferramentaControle: e.target.value === 'Nunca' ? '' : prev.ferramentaControle }))}
                            className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            <option value="Diariamente">Diariamente</option>
                            <option value="Semanalmente">Semanalmente</option>
                            <option value="Mensalmente">Mensalmente</option>
                            <option value="Raramente">Raramente</option>
                            <option value="Nunca">Nunca</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      {formData.frequenciaAcompanhaGastos && formData.frequenciaAcompanhaGastos !== 'Nunca' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="space-y-2"
                        >
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Qual ferramenta usa para controlar as finanças?</label>
                          <div className="relative w-full">
                            <select
                              value={formData.ferramentaControle}
                              onChange={e => setFormData(prev => ({ ...prev, ferramentaControle: e.target.value }))}
                              className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                            >
                              <option value="">Selecione...</option>
                              <option value="Planilha Excel/Sheets">Planilha (Excel / Google Sheets)</option>
                              <option value="Aplicativo Móvel">Aplicativo de Controle Financeiro</option>
                              <option value="Caderno">Caderno / Anotações Físicas</option>
                              <option value="Apenas Mentalmente">Apenas mentalmente</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Com que frequência você faz compras por impulso?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.comprasImpulso}
                            onChange={e => setFormData(prev => ({ ...prev, comprasImpulso: e.target.value }))}
                            className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            <option value="Frequentemente">Frequentemente</option>
                            <option value="Às vezes">Às vezes</option>
                            <option value="Raramente">Raramente</option>
                            <option value="Nunca">Nunca</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Quando estressado(a) ou triste, tende a gastar mais?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.gastosEmocionais}
                            onChange={e => setFormData(prev => ({ ...prev, gastosEmocionais: e.target.value }))}
                            className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            <option value="Sim">Sim, sinto essa tendência clara</option>
                            <option value="Não">Não, controlo bem minhas emoções no consumo</option>
                            <option value="Às vezes">Às vezes acontece</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Cartão de crédito */}
                    <div className="space-y-4 bg-muted/10 p-5 rounded-2xl border border-border/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Possui cartão de crédito?</label>
                          <div className="relative w-full">
                            <select
                              value={formData.possuiCartao}
                              onChange={e => setFormData(prev => ({ ...prev, possuiCartao: e.target.value, qtdCartoes: 0, usoCartao: '' }))}
                              className="w-full bg-card border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                            >
                              <option value="Não">Não</option>
                              <option value="Sim">Sim</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          </div>
                        </div>

                        {formData.possuiCartao === 'Sim' && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-2"
                          >
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Quantos cartões ativos?</label>
                            <input
                              type="number"
                              min="1"
                              value={formData.qtdCartoes || ''}
                              onChange={e => setFormData(prev => ({ ...prev, qtdCartoes: Math.max(0, Number(e.target.value)) }))}
                              className="w-full bg-card border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 font-bold"
                            />
                          </motion.div>
                        )}
                      </div>

                      {formData.possuiCartao === 'Sim' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2 border-t border-border pt-4 mt-2"
                        >
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Qual o seu perfil de uso do cartão?</label>
                          <div className="relative w-full">
                            <select
                              value={formData.usoCartao}
                              onChange={e => setFormData(prev => ({ ...prev, usoCartao: e.target.value }))}
                              className="w-full bg-card border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 font-bold appearance-none cursor-pointer"
                            >
                              <option value="">Selecione...</option>
                              <option value="Não utilizo o cartão">Não utilizo o cartão</option>
                              <option value="Principal meio de pagamento e sempre em dia">Principal meio de pagamento e sempre em dia</option>
                              <option value="Principal meio de pagamento e parcelo a fatura">Principal meio de pagamento e parcelo a fatura</option>
                              <option value="Apenas compras grandes/parceladas e sempre em dia">Apenas compras grandes/parceladas e sempre em dia</option>
                              <option value="Apenas compras grandes/parceladas e parcelo a fatura">Apenas compras grandes/parceladas e parcelo a fatura</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Paga as contas no prazo?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.pagaContasPrazo}
                            onChange={e => setFormData(prev => ({ ...prev, pagaContasPrazo: e.target.value }))}
                            className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            <option value="Não faço compras à prazo">Não faço compras à prazo</option>
                            <option value="Sempre compro à prazo, mas sempre em dia">Sempre compro à prazo, mas sempre em dia</option>
                            <option value="Sempre compro à prazo, mas frequentemente atraso">Sempre compro à prazo, mas frequentemente atraso</option>
                            <option value="Sempre compro à prazo e sempre tenho contas acumuladas e vencidas">Sempre compro à prazo e sempre tenho contas acumuladas e vencidas</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Recebe dinheiro de terceiros?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.recebeAjudaFinanceira}
                            onChange={e => setFormData(prev => ({ ...prev, recebeAjudaFinanceira: e.target.value }))}
                            className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            <option value="Sim, com frequencia">Sim, de familiares/amigos com frequência</option>
                            <option value="Sim, eventualmente">Sim, eventualmente em situações emergenciais</option>
                            <option value="Não">Não recebo</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Empresta dinheiro para terceiros?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.emprestaDinheiro}
                            onChange={e => setFormData(prev => ({ ...prev, emprestaDinheiro: e.target.value }))}
                            className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            <option value="Sim, com frequencia">Sim, frequentemente para ajudar familiares/amigos</option>
                            <option value="Sim, eventualmente">Sim, eventualmente</option>
                            <option value="Não">Não empresto</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {(formData.estadoCivil === 'Casado(a)' || formData.estadoCivil === 'União Estável') && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2 bg-primary/5 border border-primary/20 p-5 rounded-2xl"
                      >
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2 block">Como são tomadas as decisões financeiras importantes do casal</label>
                        <div className="relative w-full">
                          <select
                            value={formData.decisoesFinanceiras}
                            onChange={e => setFormData(prev => ({ ...prev, decisoesFinanceiras: e.target.value }))}
                            className="w-full bg-card border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            <option value="Inteiramente por mim">Inteiramente por mim</option>
                            <option value="Em conjunto com meu parceiro(a)">Em conjunto com meu parceiro(a)</option>
                            <option value="Inteiramente pelo meu parceiro(a)">Inteiramente pelo meu parceiro(a)</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </motion.div>
                    )}

                    {/* Planejamento de Compras (Nota) */}
                    <div className="space-y-4 bg-muted/10 p-5 rounded-2xl border border-border/50">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center ml-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Você planeja suas compras antes de realizá-las</label>
                          <span className="text-xs font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg">
                            {formData.planejaComprasNota === 0 ? "Nunca Planejo" : formData.planejaComprasNota === 10 ? "Sempre Planejo" : `Nota ${formData.planejaComprasNota}`}
                          </span>
                        </div>
                        <div className="relative pt-2 px-1">
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="1"
                            value={formData.planejaComprasNota}
                            onChange={e => setFormData(prev => ({ ...prev, planejaComprasNota: Number(e.target.value), planejaComprasPagamento: '', planejaComprasDinheiroPrevio: '' }))}
                            className="premium-slider"
                          />
                          <div className="flex justify-between text-[9px] font-black text-muted-foreground/60 px-1 mt-1.5 select-none">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                              <span key={n} className="flex flex-col items-center">
                                <span className="w-[1px] h-[4px] bg-border mb-0.5" />
                                {n}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {formData.planejaComprasNota > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4 mt-2"
                        >
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Forma de pagamento de compras planejadas</label>
                            <div className="relative w-full">
                              <select
                                value={formData.planejaComprasPagamento}
                                onChange={e => setFormData(prev => ({ ...prev, planejaComprasPagamento: e.target.value, planejaComprasDinheiroPrevio: '' }))}
                                className="w-full bg-card border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 font-bold appearance-none cursor-pointer"
                              >
                                <option value="">Selecione...</option>
                                <option value="À vista">À Vista</option>
                                <option value="Parceladas">Parceladas</option>
                              </select>
                              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            </div>
                          </div>

                          {formData.planejaComprasPagamento === 'Parceladas' && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="space-y-2"
                            >
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Na modalidade parcelada, qual a sua realidade?</label>
                              <div className="relative w-full">
                                <select
                                  value={formData.planejaComprasDinheiroPrevio}
                                  onChange={e => setFormData(prev => ({ ...prev, planejaComprasDinheiroPrevio: e.target.value }))}
                                  className="w-full bg-card border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 font-bold appearance-none cursor-pointer"
                                >
                                  <option value="">Selecione...</option>
                                  <option value="Tenho o dinheiro à vista e invisto">Tenho o dinheiro para pagar à vista, mas parcelo e guardo o dinheiro rendendo</option>
                                  <option value="Não tenho o dinheiro total">Compro sem ter o valor total e comprometo meu orçamento mensal futuro</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                      <TrendingUp className="text-primary" size={20} />
                      4. Crenças e Mentalidade sobre Dinheiro
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Como o dinheiro era tratado na sua infância/família?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.dinheiroFamilia}
                            onChange={e => setFormData(prev => ({ ...prev, dinheiroFamilia: e.target.value }))}
                            className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            <option value="Tabu">Assunto proibido, não se falava sobre isso</option>
                            <option value="Brigas">Motivo de brigas e estresse constante em casa</option>
                            <option value="Planejamento">Tratado com naturalidade, cooperação e planejamento</option>
                            <option value="Escassez">Foco na escassez, preocupação ou medo de faltar</option>
                            <option value="Fartura sem limites">Fartura e consumo liberado, sem educação ou limites</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Qual frase melhor descreve sua relação com dinheiro?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.fraseRelacaoDinheiro}
                            onChange={e => setFormData(prev => ({ ...prev, fraseRelacaoDinheiro: e.target.value }))}
                            className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            <option value="Aproveitar a vida">"Dinheiro foi feito para gastar e aproveitar o hoje"</option>
                            <option value="Poupar por seguranca">"Gosto de poupar e acumular para me sentir seguro(a)"</option>
                            <option value="Dificuldade de gastar">"Sinto grande dificuldade em gastar, mesmo quando preciso"</option>
                            <option value="Nunca e suficiente">"Sinto que o dinheiro nunca é suficiente, não importa o quanto ganho"</option>
                            <option value="Ferramenta liberdade">"Dinheiro é uma ferramenta para eu conquistar minha liberdade"</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Você associa o ato de guardar dinheiro a...</label>
                        <div className="relative w-full">
                          <select
                            value={formData.guardarDinheiroSignificado}
                            onChange={e => setFormData(prev => ({ ...prev, guardarDinheiroSignificado: e.target.value }))}
                            className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            <option value="Sacrifício e privação">Sacrifício e privação no presente</option>
                            <option value="Segurança e tranquilidade">Segurança e tranquilidade para o futuro</option>
                            <option value="Liberdade e independência">Liberdade de escolha e independência financeira</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Qual o seu perfil de risco para investimentos?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.perfilRiscoInvestimento}
                            onChange={e => setFormData(prev => ({ ...prev, perfilRiscoInvestimento: e.target.value }))}
                            className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            <option value="Conservador">Conservador (Priorizo segurança absoluta, tolerância zero a oscilações)</option>
                            <option value="Moderado">Moderado (Aceito pequenas variações para ganhar mais que a Poupança)</option>
                            <option value="Arrojado">Arrojado (Busco rentabilidade máxima e aceito volatilidade da Renda Variável)</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {(formData.estadoCivil === 'Casado(a)' || formData.estadoCivil === 'União Estável') && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2 bg-primary/5 border border-primary/20 p-5 rounded-2xl"
                      >
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2 block">Você fala abertamente sobre dinheiro com seu cônjuge/parceiro(a)?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.falaDinheiroParceiro}
                            onChange={e => setFormData(prev => ({ ...prev, falaDinheiroParceiro: e.target.value }))}
                            className="w-full bg-card border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            <option value="Sim, abertamente">Sim, conversamos sobre planos, custos e renda abertamente</option>
                            <option value="Apenas em crises">Às vezes, apenas em momentos de dificuldades ou grandes metas</option>
                            <option value="Evitamos o assunto">Não, evitamos tocar no assunto para evitar conflitos</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </motion.div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Você sente culpa quando gasta dinheiro com você mesmo(a) (ex: lazer, cuidados pessoais)?</label>
                      <div className="relative w-full">
                        <select
                          value={formData.culpaGastarConsigo}
                          onChange={e => setFormData(prev => ({ ...prev, culpaGastarConsigo: e.target.value }))}
                          className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                        >
                          <option value="">Selecione...</option>
                          <option value="Sempre">Sempre sinto peso na consciência</option>
                          <option value="Às vezes">Às vezes sinto</option>
                          <option value="Raramente">Raramente sinto</option>
                          <option value="Nunca">Nunca, gasto com tranquilidade</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>

                    {/* Acredita que pode mudar (Nota) */}
                    <div className="space-y-2 bg-muted/10 p-5 rounded-2xl border border-border/50">
                      <div className="flex justify-between items-center ml-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Você acredita que consegue mudar sua situação financeira?</label>
                        <span className="text-xs font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg">
                          {formData.confiancaMudarFinanceiroNota === 0 ? "Não Acredito" : formData.confiancaMudarFinanceiroNota === 10 ? "Plena Confiança" : `Nota ${formData.confiancaMudarFinanceiroNota}`}
                        </span>
                      </div>
                      <div className="relative pt-2 px-1">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="1"
                          value={formData.confiancaMudarFinanceiroNota}
                          onChange={e => setFormData(prev => ({ ...prev, confiancaMudarFinanceiroNota: Number(e.target.value) }))}
                          className="premium-slider"
                        />
                        <div className="flex justify-between text-[9px] font-black text-muted-foreground/60 px-1 mt-1.5 select-none">
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <span key={n} className="flex flex-col items-center">
                              <span className="w-[1px] h-[4px] bg-border mb-0.5" />
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Significado do Dinheiro */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Para você, dinheiro representa principalmente: (Selecione todas que aplicam)</label>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {['Segurança', 'Status/Poder', 'Liberdade', 'Conforto', 'Preocupação'].map((rep) => {
                          const isSelected = formData.dinheiroRepresenta.includes(rep);
                          return (
                            <button
                              key={rep}
                              type="button"
                              onClick={() => handleToggleMultiSelect('dinheiroRepresenta', rep)}
                              className={cn(
                                "p-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all text-center flex items-center justify-center min-h-[44px]",
                                isSelected
                                  ? "bg-primary/15 border-primary text-primary"
                                  : "bg-muted/20 border-border text-muted-foreground hover:bg-muted/40"
                              )}
                            >
                              {rep}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                      <Target className="text-primary" size={20} />
                      5. Objetivos e Metas
                    </h3>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Qual é o seu principal objetivo financeiro hoje?</label>
                      <textarea
                        value={formData.principalObjetivo}
                        onChange={e => setFormData(prev => ({ ...prev, principalObjetivo: e.target.value }))}
                        placeholder="Ex: Quitar minhas dívidas, comprar minha casa, fazer uma viagem, começar a investir..."
                        rows={3}
                        className="w-full bg-muted/30 border border-border rounded-xl p-4 text-sm text-foreground outline-none focus:border-primary/50 font-bold resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/10 p-5 rounded-2xl border border-border/50">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Possui outros objetivos além do principal?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.possuiOutrosObjetivos}
                            onChange={e => setFormData(prev => ({ ...prev, possuiOutrosObjetivos: e.target.value, outrosObjetivosTexto: '' }))}
                            className="w-full bg-card border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="Não">Não</option>
                            <option value="Sim">Sim</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      {formData.possuiOutrosObjetivos === 'Sim' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="space-y-2"
                        >
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Quais seriam?</label>
                          <input
                            type="text"
                            value={formData.outrosObjetivosTexto}
                            onChange={e => setFormData(prev => ({ ...prev, outrosObjetivosTexto: e.target.value }))}
                            placeholder="Descreva brevemente..."
                            className="w-full bg-card border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 font-bold"
                          />
                        </motion.div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/10 p-5 rounded-2xl border border-border/50">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Já definiu valores para algum de seus objetivos?</label>
                        <div className="relative w-full">
                          <select
                            value={formData.definiuValoresObjetivos}
                            onChange={e => setFormData(prev => ({ ...prev, definiuValoresObjetivos: e.target.value, definiuPrazosObjetivos: e.target.value === 'Não' ? 'Não' : prev.definiuPrazosObjetivos }))}
                            className="w-full bg-card border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="Não">Não</option>
                            <option value="Sim">Sim</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      {formData.definiuValoresObjetivos === 'Sim' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="space-y-2"
                        >
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Também já definiu prazos para alcançá-los?</label>
                          <div className="relative w-full">
                            <select
                              value={formData.definiuPrazosObjetivos}
                              onChange={e => setFormData(prev => ({ ...prev, definiuPrazosObjetivos: e.target.value }))}
                              className="w-full bg-card border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                            >
                              <option value="Não">Não</option>
                              <option value="Sim">Sim</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Impedimentos */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">O que hoje te impede de alcançar seus objetivos? (Selecione todos aplicáveis)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {[
                          'Renda mensal baixa',
                          'Falta de disciplina nos gastos',
                          'Falta de conhecimento sobre investimentos',
                          'Dívidas acumuladas',
                          'Falta de planejamento a longo prazo',
                          'Despesas imprevistas frequentes'
                        ].map((imp) => {
                          const isSelected = formData.impedeObjetivos.includes(imp);
                          return (
                            <button
                              key={imp}
                              type="button"
                              onClick={() => handleToggleMultiSelect('impedeObjetivos', imp)}
                              className={cn(
                                "p-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all text-center flex items-center justify-center min-h-[44px]",
                                isSelected
                                  ? "bg-primary/15 border-primary text-primary"
                                  : "bg-muted/20 border-border text-muted-foreground hover:bg-muted/40"
                              )}
                            >
                              {imp}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Você pensa em aposentadoria?</label>
                      <div className="relative w-full">
                        <select
                          value={formData.pensaAposentadoria}
                          onChange={e => setFormData(prev => ({ ...prev, pensaAposentadoria: e.target.value }))}
                          className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                        >
                          <option value="">Selecione...</option>
                          <option value="Sim, já comecei a planejar">Sim, já comecei a poupar / planejar para isso</option>
                          <option value="Sim, mas ainda não comecei a poupar">Sim, mas ainda não comecei a poupar</option>
                          <option value="Penso, mas não poupo">Penso, mas ainda não sei como planejar ou guardar</option>
                          <option value="Não penso no momento">Não penso nisso no momento</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>
                )}

                {step === 6 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                      <Award className="text-primary" size={20} />
                      6. Expectativas com o Educador Financeiro
                    </h3>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">O que te fez buscar a consultoria financeira?</label>
                      <textarea
                        value={formData.motivoBuscaConsultoria}
                        onChange={e => setFormData(prev => ({ ...prev, motivoBuscaConsultoria: e.target.value }))}
                        placeholder="Descreva o que te motivou..."
                        rows={3}
                        className="w-full bg-muted/30 border border-border rounded-xl p-4 text-sm text-foreground outline-none focus:border-primary/50 font-bold resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">O que você espera alcançar ao final deste processo?</label>
                      <textarea
                        value={formData.expectativaFinalProcesso}
                        onChange={e => setFormData(prev => ({ ...prev, expectativaFinalProcesso: e.target.value }))}
                        placeholder="Quais seus maiores desejos ao fim da consultoria..."
                        rows={3}
                        className="w-full bg-muted/30 border border-border rounded-xl p-4 text-sm text-foreground outline-none focus:border-primary/50 font-bold resize-none"
                      />
                    </div>

                    <div className="space-y-2 relative">
                      <div className="flex justify-between items-center mr-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">Há algo mais que gostaria de compartilhar antes de começarmos?</label>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Opcional</span>
                      </div>
                      <textarea
                        value={formData.outrasInformacoes}
                        onChange={e => setFormData(prev => ({ ...prev, outrasInformacoes: e.target.value }))}
                        placeholder="Qualquer outro detalhe de relevância..."
                        rows={2}
                        className="w-full bg-muted/30 border border-border rounded-xl p-4 text-sm text-foreground outline-none focus:border-primary/50 font-bold resize-none"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Ações de navegação do formulário */}
            <div className="flex justify-between items-center border-t border-border/50 pt-6 mt-6">
              <button
                type="button"
                disabled={step === 1}
                onClick={() => setStep(prev => Math.max(1, prev - 1))}
                className={cn(
                  "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                  step === 1
                    ? "opacity-30 cursor-not-allowed border-border text-muted-foreground"
                    : "border-border text-foreground bg-muted/20 hover:bg-muted/40"
                )}
              >
                Etapa Anterior
              </button>

              <button
                type="button"
                onClick={step === 6 ? handleFinish : handleNextStep}
                className="px-8 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 shrink-0"
              >
                {step === 6 ? (saving ? "Salvando..." : "Concluir") : (saving ? "Salvando..." : "Próxima Etapa")}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // 2. MODO VISUALIZAÇÃO EM CARDS (FICHA CLÍNICA)
        <div className="space-y-6">
          {renderProgressBar(true)}

          {/* Cards de Seções */}
          {[1, 2, 3, 4, 5, 6].map((num) => {
            const isExpanded = expandedCards[num];
            const modified = isStepModified(num);
            const pendentesCount = countPendingByStep(num);
            const isSaved = savedStepsStatus[num];

            let icon = <User size={18} />;
            let title = '';

            switch (num) {
              case 1: icon = <User size={18} />; title = '1. Perfil Pessoal e Familiar'; break;
              case 2: icon = <Wallet size={18} />; title = '2. Situação Financeira Atual'; break;
              case 3: icon = <Brain size={18} />; title = '3. Comportamentos Financeiros'; break;
              case 4: icon = <TrendingUp size={18} />; title = '4. Crenças e Mentalidade'; break;
              case 5: icon = <Target size={18} />; title = '5. Objetivos e Metas'; break;
              case 6: icon = <Award size={18} />; title = '6. Expectativas Consultoria'; break;
            }

            return (
              <div
                key={num}
                className={cn(
                  "bg-card border rounded-[2rem] overflow-hidden shadow-sm transition-all duration-300",
                  isExpanded ? "border-primary/30" : "border-border hover:border-primary/20"
                )}
              >
                {/* Cabeçalho do Card */}
                <div
                  onClick={() => setExpandedCards(prev => ({ ...prev, [num]: !prev[num] }))}
                  className="p-5 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                      isExpanded ? "bg-primary/15 text-primary" : "bg-muted/40 text-muted-foreground"
                    )}>
                      {icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">{title}</h4>
                      {pendentesCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full mt-0.5">
                          <AlertTriangle size={10} />
                          {pendentesCount} {pendentesCount === 1 ? 'pendência' : 'pendências'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-0.5">
                          <Check size={10} strokeWidth={3} />
                          Preenchido
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-muted-foreground">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {/* Conteúdo do Card */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t border-border/40"
                    >
                      <div className="p-6 space-y-6 bg-card/20">
                        {/* ETAPA 1 NO CARD */}
                        {num === 1 && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Idade */}
                            <div className={cn("space-y-2 p-3 rounded-xl border transition-colors", isFieldPending('idade') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                              {renderFieldLabel("Idade", "idade")}
                              <input
                                type="number"
                                value={formData.idade}
                                onChange={e => setFormData(prev => ({ ...prev, idade: e.target.value }))}
                                className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none"
                                placeholder="Não informado"
                              />
                            </div>

                            {/* Estado Civil */}
                            <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('estadoCivil') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                              {renderFieldLabel("Estado Civil", "estadoCivil")}
                              <select
                                value={formData.estadoCivil}
                                onChange={e => setFormData(prev => ({ ...prev, estadoCivil: e.target.value, casadoFinanceiro: '' }))}
                                className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                              >
                                <option value="">Não informado</option>
                                <option value="Solteiro(a)">Solteiro(a)</option>
                                <option value="Casado(a)">Casado(a)</option>
                                <option value="União Estável">União Estável</option>
                                <option value="Divorciado(a)">Divorciado(a)</option>
                                <option value="Viúvo(a)">Viúvo(a)</option>
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                            </div>

                            {/* Casado Financeiro */}
                            {(formData.estadoCivil === 'Casado(a)' || formData.estadoCivil === 'União Estável') && (
                              <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('casadoFinanceiro') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                {renderFieldLabel("Financeiro do Casal", "casadoFinanceiro")}
                                <select
                                  value={formData.casadoFinanceiro}
                                  onChange={e => setFormData(prev => ({ ...prev, casadoFinanceiro: e.target.value }))}
                                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                >
                                  <option value="">Não informado</option>
                                  <option value="Totalmente junto">Totalmente junto</option>
                                  <option value="Totalmente separado">Totalmente separado</option>
                                  <option value="Separado, mas pensando em juntar">Separado, mas pensando em juntar</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                              </div>
                            )}

                            {/* Possui Filhos */}
                            <div className="space-y-2 p-3 rounded-xl border border-border/60 relative pr-8">
                              {renderFieldLabel("Possui Filhos?", "possuiFilhos")}
                              <select
                                value={formData.possuiFilhos}
                                onChange={e => setFormData(prev => ({ ...prev, possuiFilhos: e.target.value }))}
                                className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                              >
                                <option value="Não">Não</option>
                                <option value="Sim">Sim</option>
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                            </div>

                            {/* Qtd Filhos */}
                            {formData.possuiFilhos === 'Sim' && (
                              <>
                                <div className={cn("space-y-2 p-3 rounded-xl border transition-colors", isFieldPending('qtdFilhos') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                  {renderFieldLabel("Qtd Filhos", "qtdFilhos")}
                                  <input
                                    type="number"
                                    min="1"
                                    value={formData.qtdFilhos || ''}
                                    onChange={e => setFormData(prev => ({ ...prev, qtdFilhos: Math.max(0, Number(e.target.value)) }))}
                                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none"
                                    placeholder="0"
                                  />
                                </div>
                                <div className="space-y-2 p-3 rounded-xl border border-border/60">
                                  {renderFieldLabel("Filhos Dependentes", "qtdFilhosDependentes")}
                                  <input
                                    type="number"
                                    min="0"
                                    max={formData.qtdFilhos}
                                    value={formData.qtdFilhosDependentes || ''}
                                    onChange={e => setFormData(prev => ({ ...prev, qtdFilhosDependentes: Math.min(prev.qtdFilhos, Math.max(0, Number(e.target.value))) }))}
                                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none"
                                    placeholder="0"
                                  />
                                </div>
                              </>
                            )}

                            {/* Pessoas Dependentes */}
                            <div className="space-y-2 p-3 rounded-xl border border-border/60 flex items-center justify-between gap-4">
                              <div className="flex-1">
                                {renderFieldLabel("Outros Dependentes", "pessoasDependentes")}
                                <input
                                  type="number"
                                  min="0"
                                  value={formData.pessoasDependentes}
                                  onChange={e => setFormData(prev => ({ ...prev, pessoasDependentes: Math.max(0, Number(e.target.value)) }))}
                                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none"
                                />
                              </div>
                              <div className="text-right shrink-0 border-l border-border pl-4">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Total</span>
                                <span className="text-sm font-black text-primary">{totalDependentes}</span>
                              </div>
                            </div>

                            {/* Situação Moradia */}
                            <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('situacaoMoradia') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                              {renderFieldLabel("Moradia", "situacaoMoradia")}
                              <select
                                value={formData.situacaoMoradia}
                                onChange={e => setFormData(prev => ({ ...prev, situacaoMoradia: e.target.value }))}
                                className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                              >
                                <option value="">Não informado</option>
                                <option value="Própria Quitada">Própria Quitada</option>
                                <option value="Própria Financiada">Própria Financiada</option>
                                <option value="Alugada">Alugada</option>
                                <option value="Mora com Pais/Familiares">Mora com Pais/Familiares</option>
                                <option value="Cedida/Funcional">Cedida/Funcional</option>
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                            </div>

                            {/* Escolaridade */}
                            <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('escolaridade') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                              {renderFieldLabel("Escolaridade", "escolaridade")}
                              <select
                                value={formData.escolaridade}
                                onChange={e => setFormData(prev => ({ ...prev, escolaridade: e.target.value }))}
                                className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                              >
                                <option value="">Não informado</option>
                                <option value="Fundamental">Ensino Fundamental</option>
                                <option value="Médio">Ensino Médio</option>
                                <option value="Superior Incompleto">Ensino Superior Incompleto</option>
                                <option value="Superior Completo">Ensino Superior Completo</option>
                                <option value="Pós-Graduação">Pós-Graduação/Especialização</option>
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                            </div>

                            {/* Situação Profissional */}
                            <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('situacaoProfissional') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                              {renderFieldLabel("Profissão", "situacaoProfissional")}
                              <select
                                value={formData.situacaoProfissional}
                                onChange={e => setFormData(prev => ({ ...prev, situacaoProfissional: e.target.value, situacaoProfissionalOutro: '' }))}
                                className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                              >
                                <option value="">Não informado</option>
                                <option value="CLT">CLT (Carteira Assinada)</option>
                                <option value="Autônomo/Liberal">Autônomo / Profissional Liberal</option>
                                <option value="Empresário/Sócio">Empresário / Sócio de Empresa</option>
                                <option value="Servidor Público">Servidor Público</option>
                                <option value="Aposentado">Aposentado / Pensionista</option>
                                <option value="Outro">Outro</option>
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                            </div>

                            {/* Profissão Outro */}
                            {formData.situacaoProfissional === 'Outro' && (
                              <div className={cn("space-y-2 p-3 rounded-xl border transition-colors col-span-1 md:col-span-3", isFieldPending('situacaoProfissionalOutro') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                {renderFieldLabel("Especifique a Profissão", "situacaoProfissionalOutro")}
                                <input
                                  type="text"
                                  value={formData.situacaoProfissionalOutro}
                                  onChange={e => setFormData(prev => ({ ...prev, situacaoProfissionalOutro: e.target.value }))}
                                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none"
                                  placeholder="Descreva..."
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* ETAPA 2 NO CARD */}
                        {num === 2 && (
                          <div className="space-y-6">
                            {/* Fontes de Renda */}
                            <div className={cn("space-y-3 p-4 rounded-xl border transition-colors", isFieldPending('fontesRenda') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                              {renderFieldLabel("Fontes de Renda", "fontesRenda")}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {['Salário CLT', 'Pró-Labore', 'Autônomo', 'Aluguéis', 'Rendimento de Investimentos', 'Pensão/Aposentadoria', 'Outro'].map((op) => {
                                  const isSelected = formData.fontesRenda.includes(op);
                                  return (
                                    <button
                                      key={op}
                                      type="button"
                                      onClick={() => handleToggleMultiSelect('fontesRenda', op)}
                                      className={cn(
                                        "p-2.5 rounded-lg border text-[10px] font-bold transition-all text-center",
                                        isSelected
                                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-500 dark:text-emerald-400"
                                          : "bg-muted/10 border-border text-muted-foreground hover:bg-muted/20"
                                      )}
                                    >
                                      {op}
                                    </button>
                                  );
                                })}
                              </div>

                              {formData.fontesRenda.includes('Outro') && (
                                <div className={cn("space-y-1 border rounded-xl border-border/60 p-3 mt-2 relative", isFieldPending('fontesRendaOutro') && "border-amber-500/20")}>
                                  {renderFieldLabel("Outra Fonte (Descrição)", "fontesRendaOutro")}
                                  <input
                                    type="text"
                                    value={formData.fontesRendaOutro}
                                    onChange={e => setFormData(prev => ({ ...prev, fontesRendaOutro: e.target.value }))}
                                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none"
                                    placeholder="Especifique..."
                                  />
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Renda Líquida */}
                              <div className={cn("space-y-2 p-3 rounded-xl border transition-colors", isFieldPending('rendaLiquidaMinima') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                {renderFieldLabel("Renda Líquida Mínima", "rendaLiquidaMinima")}
                                <div className="relative flex items-center">
                                  <span className="absolute left-0 text-xs font-black text-muted-foreground/60 select-none">R$</span>
                                  <input
                                    type="text"
                                    value={formData.rendaLiquidaMinima.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    onChange={e => handleRendaChange(e.target.value)}
                                    className="w-full bg-transparent border-none pl-6 pr-0 text-sm font-bold text-foreground outline-none"
                                  />
                                </div>
                              </div>

                              {/* Tipo de Renda */}
                              <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('rendaTipo') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                {renderFieldLabel("Tipo Renda", "rendaTipo")}
                                <select
                                  value={formData.rendaTipo}
                                  onChange={e => setFormData(prev => ({ ...prev, rendaTipo: e.target.value }))}
                                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                >
                                  <option value="">Não informado</option>
                                  <option value="Fixa">Fixa</option>
                                  <option value="Variável">Variável</option>
                                  <option value="Mista">Mista (Fixa + Variável)</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                              </div>

                              {/* Sabe quanto gasta */}
                              <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('sabeGastos') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                {renderFieldLabel("Sabe os Gastos?", "sabeGastos")}
                                <select
                                  value={formData.sabeGastos}
                                  onChange={e => setFormData(prev => ({ ...prev, sabeGastos: e.target.value }))}
                                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                >
                                  <option value="">Não informado</option>
                                  <option value="Só olhando o extrato do banco/cartão">Só olhando o extrato do banco/cartão</option>
                                  <option value="Sei Exatamente (anoto tudo)">Sei Exatamente (anoto tudo)</option>
                                  <option value="Tenho uma boa noção">Tenho uma boa noção</option>
                                  <option value="Não tenho ideia">Não tenho ideia</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                              </div>

                              {/* Gastos vs Renda */}
                              <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('gastosVsRenda') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                {renderFieldLabel("Gastos mensais são", "gastosVsRenda")}
                                <select
                                  value={formData.gastosVsRenda}
                                  onChange={e => setFormData(prev => ({ ...prev, gastosVsRenda: e.target.value }))}
                                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                >
                                  <option value="">Não informado</option>
                                  <option value="Menores que a renda">Menores que a renda</option>
                                  <option value="Iguais à renda">Iguais à renda</option>
                                  <option value="Maiores que a renda">Maiores que a renda</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                              </div>

                              {/* Reserva */}
                              <div className="space-y-2 p-3 rounded-xl border border-border/60 relative pr-8">
                                {renderFieldLabel("Possui Reserva?", "possuiReserva")}
                                <select
                                  value={formData.possuiReserva}
                                  onChange={e => setFormData(prev => ({ ...prev, possuiReserva: e.target.value, reservaMesesCobre: '' }))}
                                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                >
                                  <option value="Não">Não</option>
                                  <option value="Sim">Sim</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                              </div>

                              {/* Reserva Meses */}
                              {formData.possuiReserva === 'Sim' && (
                                <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('reservaMesesCobre') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                  {renderFieldLabel("Reserva Cobre", "reservaMesesCobre")}
                                  <select
                                    value={formData.reservaMesesCobre}
                                    onChange={e => setFormData(prev => ({ ...prev, reservaMesesCobre: e.target.value }))}
                                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                  >
                                    <option value="">Não informado</option>
                                    <option value="Menos de 3 meses">Menos de 3 meses</option>
                                    <option value="De 3 a 6 meses">De 3 a 6 meses</option>
                                    <option value="De 6 a 12 meses">De 6 a 12 meses</option>
                                    <option value="Mais de 12 meses">Mais de 12 meses</option>
                                  </select>
                                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                                </div>
                              )}
                            </div>

                            {/* Bloco Dívidas */}
                            <div className="space-y-4 p-4 rounded-xl border border-border/60">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 relative pr-8">
                                  {renderFieldLabel("Possui Dívidas?", "possuiDividas")}
                                  <select
                                    value={formData.possuiDividas}
                                    onChange={e => setFormData(prev => ({ ...prev, possuiDividas: e.target.value, totalDividas: '', tiposDividas: [] }))}
                                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                  >
                                    <option value="Não">Não</option>
                                    <option value="Sim">Sim</option>
                                  </select>
                                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                                </div>

                                {formData.possuiDividas === 'Sim' && (
                                  <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('totalDividas') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                    {renderFieldLabel("Total de Dívidas", "totalDividas")}
                                    <select
                                      value={formData.totalDividas}
                                      onChange={e => setFormData(prev => ({ ...prev, totalDividas: e.target.value }))}
                                      className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                    >
                                      <option value="">Não informado</option>
                                      <option value="Até R$ 5.000">Até R$ 5.000</option>
                                      <option value="De R$ 5.000 a R$ 20.000">De R$ 5.000 a R$ 20.000</option>
                                      <option value="De R$ 20.000 a R$ 50.000">De R$ 20.000 a R$ 50.000</option>
                                      <option value="De R$ 50.000 a R$ 100.000">De R$ 50.000 a R$ 100.000</option>
                                      <option value="Mais de R$ 100.000">Mais de R$ 100.000</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                                  </div>
                                )}
                              </div>

                              {formData.possuiDividas === 'Sim' && (
                                <div className={cn("space-y-2 border-t border-border pt-4 mt-2", isFieldPending('tiposDividas') && "border-amber-500/20")}>
                                  {renderFieldLabel("Tipos de Dívidas", "tiposDividas")}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {['Cartão de Crédito', 'Cheque Especial', 'Empréstimo', 'Financiamento Veículo', 'Financiamento Imobiliário', 'Família/Amigos', 'Outros'].map(tipo => {
                                      const isSelected = formData.tiposDividas.includes(tipo);
                                      return (
                                        <button
                                          key={tipo}
                                          type="button"
                                          onClick={() => handleToggleMultiSelect('tiposDividas', tipo)}
                                          className={cn(
                                            "p-2.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all",
                                            isSelected
                                              ? "bg-rose-500/10 border-rose-500 text-rose-500"
                                              : "bg-muted/10 border-border text-muted-foreground hover:bg-muted/20"
                                          )}
                                        >
                                          {tipo}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Investimentos */}
                              <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('investimentos') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                {renderFieldLabel("Investimentos", "investimentos")}
                                <select
                                  value={formData.investimentos}
                                  onChange={e => setFormData(prev => ({ ...prev, investimentos: e.target.value }))}
                                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                >
                                  <option value="">Não informado</option>
                                  <option value="Não">Não possuo</option>
                                  <option value="Apenas Poupança">Apenas Poupança</option>
                                  <option value="Cofrinhos/Caixinhas">Cofrinhos/Caixinhas</option>
                                  <option value="Poupança e Conservadores">Poupança e outros conservadores (Renda Fixa)</option>
                                  <option value="Carteira Diversificada">Carteira Diversificada (Renda Fixa + Variável)</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                              </div>

                              {/* Seguros e Previdência */}
                              <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('segurosPrevidencia') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                {renderFieldLabel("Seguros / Previdência", "segurosPrevidencia")}
                                <select
                                  value={formData.segurosPrevidencia}
                                  onChange={e => setFormData(prev => ({ ...prev, segurosPrevidencia: e.target.value }))}
                                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                >
                                  <option value="">Não informado</option>
                                  <option value="Não">Não possuo</option>
                                  <option value="Seguro de Vida">Seguro de Vida</option>
                                  <option value="Previdência Privada">Previdência Privada</option>
                                  <option value="Ambos">Possuo Ambos</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                              </div>
                            </div>

                            {/* Veículos */}
                            <div className="space-y-4 p-4 rounded-xl border border-border/60">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 relative pr-8">
                                  {renderFieldLabel("Possui Veículos?", "possuiVeiculos")}
                                  <select
                                    value={formData.possuiVeiculos}
                                    onChange={e => setFormData(prev => ({ ...prev, possuiVeiculos: e.target.value, tiposVeiculos: '', qtdCarros: 0, qtdMotos: 0, veiculosQuitacao: '' }))}
                                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                  >
                                    <option value="Não">Não</option>
                                    <option value="Sim">Sim</option>
                                  </select>
                                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                                </div>

                                {formData.possuiVeiculos === 'Sim' && (
                                  <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('tiposVeiculos') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                    {renderFieldLabel("Tipo Veículo", "tiposVeiculos")}
                                    <select
                                      value={formData.tiposVeiculos}
                                      onChange={e => setFormData(prev => ({ ...prev, tiposVeiculos: e.target.value, qtdCarros: e.target.value === 'Moto' ? 0 : 1, qtdMotos: e.target.value === 'Carro' ? 0 : 1 }))}
                                      className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                    >
                                      <option value="">Não informado</option>
                                      <option value="Carro">Carro</option>
                                      <option value="Moto">Moto</option>
                                      <option value="Ambos">Ambos</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                                  </div>
                                )}
                              </div>

                              {formData.possuiVeiculos === 'Sim' && formData.tiposVeiculos && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-border pt-4">
                                  {(formData.tiposVeiculos === 'Carro' || formData.tiposVeiculos === 'Ambos') && (
                                    <div className={cn("space-y-2 p-3 rounded-xl border transition-colors", isFieldPending('qtdCarros') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                      {renderFieldLabel("Qtd Carros", "qtdCarros")}
                                      <input
                                        type="number"
                                        min="1"
                                        value={formData.qtdCarros || ''}
                                        onChange={e => setFormData(prev => ({ ...prev, qtdCarros: Math.max(0, Number(e.target.value)) }))}
                                        className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none"
                                      />
                                    </div>
                                  )}

                                  {(formData.tiposVeiculos === 'Moto' || formData.tiposVeiculos === 'Ambos') && (
                                    <div className={cn("space-y-2 p-3 rounded-xl border transition-colors", isFieldPending('qtdMotos') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                      {renderFieldLabel("Qtd Motos", "qtdMotos")}
                                      <input
                                        type="number"
                                        min="1"
                                        value={formData.qtdMotos || ''}
                                        onChange={e => setFormData(prev => ({ ...prev, qtdMotos: Math.max(0, Number(e.target.value)) }))}
                                        className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none"
                                      />
                                    </div>
                                  )}

                                  <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('veiculosQuitacao') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                    {renderFieldLabel("Situação de Quitação", "veiculosQuitacao")}
                                    <select
                                      value={formData.veiculosQuitacao}
                                      onChange={e => setFormData(prev => ({ ...prev, veiculosQuitacao: e.target.value }))}
                                      className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                    >
                                      <option value="">Não informado</option>
                                      <option value="Quitado">Quitado</option>
                                      <option value="Financiado">Financiado</option>
                                      <option value="Consórcio">Consórcio</option>
                                      <option value="Misto">Misto</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Educação */}
                              <div className="space-y-4 p-4 rounded-xl border border-border/60">
                                <div className="space-y-2 relative pr-8">
                                  {renderFieldLabel("Gastos Educação?", "gastosEducacao")}
                                  <select
                                    value={formData.gastosEducacao}
                                    onChange={e => setFormData(prev => ({ ...prev, gastosEducacao: e.target.value, gastosEducacaoComQue: '' }))}
                                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                  >
                                    <option value="Não">Não</option>
                                    <option value="Sim">Sim</option>
                                  </select>
                                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                                </div>
                                {formData.gastosEducacao === 'Sim' && (
                                  <div className={cn("space-y-2 border rounded-xl border-border/60 p-3 mt-2 relative", isFieldPending('gastosEducacaoComQue') ? "border-amber-500/30 bg-amber-500/5" : "")}>
                                    {renderFieldLabel("Descrição Educação", "gastosEducacaoComQue")}
                                    <input
                                      type="text"
                                      value={formData.gastosEducacaoComQue}
                                      onChange={e => setFormData(prev => ({ ...prev, gastosEducacaoComQue: e.target.value }))}
                                      className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none"
                                      placeholder="Ex: Faculdade..."
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Saúde */}
                              <div className="space-y-4 p-4 rounded-xl border border-border/60">
                                <div className="space-y-2 relative pr-8">
                                  {renderFieldLabel("Gastos Saúde?", "gastosSaude")}
                                  <select
                                    value={formData.gastosSaude}
                                    onChange={e => setFormData(prev => ({ ...prev, gastosSaude: e.target.value, gastosSaudeComQue: '' }))}
                                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                  >
                                    <option value="Não">Não</option>
                                    <option value="Sim">Sim</option>
                                  </select>
                                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                                </div>
                                {formData.gastosSaude === 'Sim' && (
                                  <div className={cn("space-y-2 border rounded-xl border-border/60 p-3 mt-2 relative", isFieldPending('gastosSaudeComQue') ? "border-amber-500/30 bg-amber-500/5" : "")}>
                                    {renderFieldLabel("Descrição Saúde", "gastosSaudeComQue")}
                                    <input
                                      type="text"
                                      value={formData.gastosSaudeComQue}
                                      onChange={e => setFormData(prev => ({ ...prev, gastosSaudeComQue: e.target.value }))}
                                      className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none"
                                      placeholder="Ex: Plano de Saúde..."
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ETAPA 3 NO CARD */}
                        {num === 3 && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Acompanha gastos */}
                              <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('frequenciaAcompanhaGastos') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                {renderFieldLabel("Acompanha Gastos", "frequenciaAcompanhaGastos")}
                                <select
                                  value={formData.frequenciaAcompanhaGastos}
                                  onChange={e => setFormData(prev => ({ ...prev, frequenciaAcompanhaGastos: e.target.value, ferramentaControle: e.target.value === 'Nunca' ? '' : prev.ferramentaControle }))}
                                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                >
                                  <option value="">Não informado</option>
                                  <option value="Diariamente">Diariamente</option>
                                  <option value="Semanalmente">Semanalmente</option>
                                  <option value="Mensalmente">Mensalmente</option>
                                  <option value="Raramente">Raramente</option>
                                  <option value="Nunca">Nunca</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                              </div>

                              {/* Ferramenta de controle */}
                              {formData.frequenciaAcompanhaGastos && formData.frequenciaAcompanhaGastos !== 'Nunca' && (
                                <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('ferramentaControle') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                  {renderFieldLabel("Ferramenta Controle", "ferramentaControle")}
                                  <select
                                    value={formData.ferramentaControle}
                                    onChange={e => setFormData(prev => ({ ...prev, ferramentaControle: e.target.value }))}
                                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                  >
                                    <option value="">Não informado</option>
                                    <option value="Não utilizo nenhuma">Não utilizo nenhuma</option>
                                    <option value="Planilha Excel/Sheets">Planilha (Excel / Sheets)</option>
                                    <option value="Aplicativo Móvel">Aplicativo Móvel</option>
                                    <option value="Caderno">Caderno / Anotações</option>
                                    <option value="Apenas Mentalmente">Apenas mentalmente</option>
                                  </select>
                                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                                </div>
                              )}

                              {/* Compras por impulso */}
                              <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('comprasImpulso') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                {renderFieldLabel("Compras Impulso", "comprasImpulso")}
                                <select
                                  value={formData.comprasImpulso}
                                  onChange={e => setFormData(prev => ({ ...prev, comprasImpulso: e.target.value }))}
                                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                >
                                  <option value="">Não informado</option>
                                  <option value="Frequentemente">Frequentemente</option>
                                  <option value="Às vezes">Às vezes</option>
                                  <option value="Raramente">Raramente</option>
                                  <option value="Nunca">Nunca</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                              </div>

                              {/* Gastos emocionais */}
                              <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('gastosEmocionais') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                {renderFieldLabel("Gasto Emocional", "gastosEmocionais")}
                                <select
                                  value={formData.gastosEmocionais}
                                  onChange={e => setFormData(prev => ({ ...prev, gastosEmocionais: e.target.value }))}
                                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                >
                                  <option value="">Não informado</option>
                                  <option value="Sim">Sim (estresse/tristeza)</option>
                                  <option value="Não">Não</option>
                                  <option value="Às vezes">Às vezes</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                              </div>
                            </div>

                            {/* Cartão de crédito */}
                            <div className="space-y-4 p-4 rounded-xl border border-border/60">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 relative pr-8">
                                  {renderFieldLabel("Possui Cartão Crédito?", "possuiCartao")}
                                  <select
                                    value={formData.possuiCartao}
                                    onChange={e => setFormData(prev => ({ ...prev, possuiCartao: e.target.value, qtdCartoes: 0, usoCartao: '' }))}
                                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                  >
                                    <option value="Não">Não</option>
                                    <option value="Sim">Sim</option>
                                  </select>
                                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                                </div>

                                {formData.possuiCartao === 'Sim' && (
                                  <div className={cn("space-y-2 p-3 rounded-xl border transition-colors", isFieldPending('qtdCartoes') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                    {renderFieldLabel("Quantidade de Cartões", "qtdCartoes")}
                                    <input
                                      type="number"
                                      min="1"
                                      value={formData.qtdCartoes || ''}
                                      onChange={e => setFormData(prev => ({ ...prev, qtdCartoes: Math.max(0, Number(e.target.value)) }))}
                                      className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none"
                                    />
                                  </div>
                                )}
                              </div>

                              {formData.possuiCartao === 'Sim' && (
                                <div className={cn("space-y-2 border rounded-xl border-border/60 p-3 mt-2 relative pr-8", isFieldPending('usoCartao') ? "border-amber-500/30 bg-amber-500/5" : "")}>
                                  {renderFieldLabel("Uso do Cartão", "usoCartao")}
                                  <select
                                    value={formData.usoCartao}
                                    onChange={e => setFormData(prev => ({ ...prev, usoCartao: e.target.value }))}
                                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                  >
                                    <option value="">Não informado</option>
                                    <option value="Não utilizo o cartão">Não utilizo o cartão</option>
                                    <option value="Principal meio de pagamento e sempre em dia">Principal meio de pagamento e sempre em dia</option>
                                    <option value="Principal meio de pagamento e parcelo a fatura">Principal meio de pagamento e parcelo a fatura</option>
                                    <option value="Apenas compras grandes/parceladas e sempre em dia">Apenas compras grandes/parceladas e sempre em dia</option>
                                    <option value="Apenas compras grandes/parceladas e parcelo a fatura">Apenas compras grandes/parceladas e parcelo a fatura</option>
                                  </select>
                                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Contas no prazo */}
                              <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('pagaContasPrazo') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                {renderFieldLabel("Contas no Prazo?", "pagaContasPrazo")}
                                <select
                                  value={formData.pagaContasPrazo}
                                  onChange={e => setFormData(prev => ({ ...prev, pagaContasPrazo: e.target.value }))}
                                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                >
                                  <option value="">Não informado</option>
                                  <option value="Não faço compras à prazo">Não faço compras à prazo</option>
                                  <option value="Sempre compro à prazo, mas sempre em dia">Sempre compro à prazo, mas sempre em dia</option>
                                  <option value="Sempre compro à prazo, mas frequentemente atraso">Sempre compro à prazo, mas frequentemente atraso</option>
                                  <option value="Sempre compro à prazo e sempre tenho contas acumuladas e vencidas">Sempre compro à prazo e sempre tenho contas acumuladas e vencidas</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                              </div>

                              {/* Recebe ajuda */}
                              <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('recebeAjudaFinanceira') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                {renderFieldLabel("Recebe de Terceiros", "recebeAjudaFinanceira")}
                                <select
                                  value={formData.recebeAjudaFinanceira}
                                  onChange={e => setFormData(prev => ({ ...prev, recebeAjudaFinanceira: e.target.value }))}
                                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                >
                                  <option value="">Não informado</option>
                                  <option value="Sim, com frequencia">Sim, com frequência</option>
                                  <option value="Sim, eventualmente">Sim, eventualmente em crises</option>
                                  <option value="Não">Não recebo</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                              </div>

                              {/* Empresta dinheiro */}
                              <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('emprestaDinheiro') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                {renderFieldLabel("Empresta para Terceiros", "emprestaDinheiro")}
                                <select
                                  value={formData.emprestaDinheiro}
                                  onChange={e => setFormData(prev => ({ ...prev, emprestaDinheiro: e.target.value }))}
                                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                >
                                  <option value="">Não informado</option>
                                  <option value="Sim, com frequencia">Sim, com frequência</option>
                                  <option value="Sim, eventualmente">Sim, eventualmente</option>
                                  <option value="Não">Não empresto</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                              </div>
                            </div>

                            {/* Decisões Casal */}
                            {(formData.estadoCivil === 'Casado(a)' || formData.estadoCivil === 'União Estável') && (
                              <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('decisoesFinanceiras') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                {renderFieldLabel("Decisões Casal", "decisoesFinanceiras")}
                                <select
                                  value={formData.decisoesFinanceiras}
                                  onChange={e => setFormData(prev => ({ ...prev, decisoesFinanceiras: e.target.value }))}
                                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                >
                                  <option value="">Não informado</option>
                                  <option value="Inteiramente por mim">Inteiramente por mim</option>
                                  <option value="Em conjunto com meu parceiro(a)">Em conjunto com parceiro(a)</option>
                                  <option value="Inteiramente pelo meu parceiro(a)">Inteiramente pelo parceiro(a)</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                              </div>
                            )}

                            {/* Planeja Compras */}
                            <div className="space-y-4 p-4 rounded-xl border border-border/60">
                              <div className="flex justify-between items-center">
                                {renderFieldLabel("Nota Planeja Compras (0 a 10)", "planejaComprasNota")}
                                <span className="text-xs font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg">
                                  {formData.planejaComprasNota === 0 ? "Nunca" : formData.planejaComprasNota === 10 ? "Sempre" : `Nota ${formData.planejaComprasNota}`}
                                </span>
                              </div>
                              <div className="relative pt-2 px-1">
                                <input
                                  type="range"
                                  min="0"
                                  max="10"
                                  step="1"
                                  value={formData.planejaComprasNota}
                                  onChange={e => setFormData(prev => ({ ...prev, planejaComprasNota: Number(e.target.value), planejaComprasPagamento: '', planejaComprasDinheiroPrevio: '' }))}
                                  className="premium-slider"
                                />
                                <div className="flex justify-between text-[9px] font-black text-muted-foreground/60 px-1 mt-1.5 select-none">
                                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                    <span key={n} className="flex flex-col items-center">
                                      <span className="w-[1px] h-[4px] bg-border mb-0.5" />
                                      {n}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {formData.planejaComprasNota > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4 mt-2">
                                  <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('planejaComprasPagamento') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                    {renderFieldLabel("Paga Planejadas", "planejaComprasPagamento")}
                                    <select
                                      value={formData.planejaComprasPagamento}
                                      onChange={e => setFormData(prev => ({ ...prev, planejaComprasPagamento: e.target.value, planejaComprasDinheiroPrevio: '' }))}
                                      className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                    >
                                      <option value="">Selecione...</option>
                                      <option value="À vista">À Vista</option>
                                      <option value="Parceladas">Parceladas</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                                  </div>

                                  {formData.planejaComprasPagamento === 'Parceladas' && (
                                    <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('planejaComprasDinheiroPrevio') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                      {renderFieldLabel("Realidade Parcelada", "planejaComprasDinheiroPrevio")}
                                      <select
                                        value={formData.planejaComprasDinheiroPrevio}
                                        onChange={e => setFormData(prev => ({ ...prev, planejaComprasDinheiroPrevio: e.target.value }))}
                                        className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                      >
                                        <option value="">Selecione...</option>
                                        <option value="Tenho o dinheiro à vista e invisto">Tenho dinheiro à vista mas invisto e parcelo</option>
                                        <option value="Não tenho o dinheiro total">Compro sem ter e comprometo orçamento</option>
                                      </select>
                                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* ETAPA 4 NO CARD */}
                        {num === 4 && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Dinheiro família */}
                              <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('dinheiroFamilia') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                {renderFieldLabel("Dinheiro na Família", "dinheiroFamilia")}
                                <select
                                  value={formData.dinheiroFamilia}
                                  onChange={e => setFormData(prev => ({ ...prev, dinheiroFamilia: e.target.value }))}
                                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                >
                                  <option value="">Não informado</option>
                                  <option value="Tabu">Tabu, não se falava</option>
                                  <option value="Brigas">Motivo de brigas e estresse</option>
                                  <option value="Planejamento">Tratado com naturalidade</option>
                                  <option value="Escassez">Foco na escassez / Medo</option>
                                  <option value="Fartura sem limites">Fartura sem limites nem controle</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                              </div>

                              {/* Frase Relação */}
                              <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('fraseRelacaoDinheiro') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                {renderFieldLabel("Relação com Dinheiro", "fraseRelacaoDinheiro")}
                                <select
                                  value={formData.fraseRelacaoDinheiro}
                                  onChange={e => setFormData(prev => ({ ...prev, fraseRelacaoDinheiro: e.target.value }))}
                                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                >
                                  <option value="">Não informado</option>
                                  <option value="Aproveitar a vida">Gastar e aproveitar o hoje</option>
                                  <option value="Poupar por seguranca">Poupar para me sentir seguro(a)</option>
                                  <option value="Dificuldade de gastar">Dificuldade em gastar</option>
                                  <option value="Nunca e suficiente">Nunca é suficiente</option>
                                  <option value="Ferramenta liberdade">Ferramenta para liberdade</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                              </div>

                              {/* Significado de guardar */}
                              <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('guardarDinheiroSignificado') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                {renderFieldLabel("Significado de Guardar", "guardarDinheiroSignificado")}
                                <select
                                  value={formData.guardarDinheiroSignificado}
                                  onChange={e => setFormData(prev => ({ ...prev, guardarDinheiroSignificado: e.target.value }))}
                                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                >
                                  <option value="">Não informado</option>
                                  <option value="Sacrifício e privação">Sacrifício e privação presente</option>
                                  <option value="Segurança e tranquilidade">Segurança e tranquilidade futura</option>
                                  <option value="Liberdade e independência">Liberdade e independência</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                              </div>

                              {/* Perfil de risco */}
                              <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('perfilRiscoInvestimento') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                {renderFieldLabel("Perfil de Risco", "perfilRiscoInvestimento")}
                                <select
                                  value={formData.perfilRiscoInvestimento}
                                  onChange={e => setFormData(prev => ({ ...prev, perfilRiscoInvestimento: e.target.value }))}
                                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                >
                                  <option value="">Não informado</option>
                                  <option value="Conservador (prefere segurança)">Conservador (prefere segurança)</option>
                                  <option value="Moderado (prefere equilíbrio, aceitando um pouco de risco)">Moderado (prefere equilíbrio, aceitando um pouco de risco)</option>
                                  <option value="Arrojado (prefere rentabilidade, aceitando maiores riscos)">Arrojado (prefere rentabilidade, aceitando maiores riscos)</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                              </div>
                            </div>

                            {/* Fala com parceiro */}
                            {(formData.estadoCivil === 'Casado(a)' || formData.estadoCivil === 'União Estável') && (
                              <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('falaDinheiroParceiro') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                {renderFieldLabel("Conversa com Parceiro(a)", "falaDinheiroParceiro")}
                                <select
                                  value={formData.falaDinheiroParceiro}
                                  onChange={e => setFormData(prev => ({ ...prev, falaDinheiroParceiro: e.target.value }))}
                                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                >
                                  <option value="">Não informado</option>
                                  <option value="Sim, abertamente">Abertamente sobre tudo</option>
                                  <option value="Apenas em crises">Apenas em crises ou metas</option>
                                  <option value="Evitamos o assunto">Evitamos falar para não brigar</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                              </div>
                            )}

                            {/* Culpa ao gastar */}
                            <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('culpaGastarConsigo') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                              {renderFieldLabel("Sente culpa gastando consigo?", "culpaGastarConsigo")}
                              <select
                                value={formData.culpaGastarConsigo}
                                onChange={e => setFormData(prev => ({ ...prev, culpaGastarConsigo: e.target.value }))}
                                className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                              >
                                <option value="">Não informado</option>
                                <option value="Sempre">Sempre sinto culpa</option>
                                <option value="Às vezes">Às vezes sinto</option>
                                <option value="Raramente">Raramente sinto</option>
                                <option value="Nunca">Nunca sinto culpa</option>
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                            </div>

                            {/* Confiança de Mudar (Slider) */}
                            <div className="space-y-4 p-4 rounded-xl border border-border/60">
                              <div className="flex justify-between items-center">
                                {renderFieldLabel("Confiança em Mudar a Vida Financeira (0 a 10)", "confiancaMudarFinanceiroNota")}
                                <span className="text-xs font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg">
                                  {formData.confiancaMudarFinanceiroNota === 0 ? "Zero" : formData.confiancaMudarFinanceiroNota === 10 ? "Plena Confiança" : `Nota ${formData.confiancaMudarFinanceiroNota}`}
                                </span>
                              </div>
                              <div className="relative pt-2 px-1">
                                <input
                                  type="range"
                                  min="0"
                                  max="10"
                                  step="1"
                                  value={formData.confiancaMudarFinanceiroNota}
                                  onChange={e => setFormData(prev => ({ ...prev, confiancaMudarFinanceiroNota: Number(e.target.value) }))}
                                  className="premium-slider"
                                />
                                <div className="flex justify-between text-[9px] font-black text-muted-foreground/60 px-1 mt-1.5 select-none">
                                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                    <span key={n} className="flex flex-col items-center">
                                      <span className="w-[1px] h-[4px] bg-border mb-0.5" />
                                      {n}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* O que o dinheiro representa */}
                            <div className={cn("space-y-3 p-4 rounded-xl border transition-colors", isFieldPending('dinheiroRepresenta') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                              {renderFieldLabel("Dinheiro Representa", "dinheiroRepresenta")}
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                {['Segurança', 'Status/Poder', 'Liberdade', 'Conforto', 'Preocupação'].map((rep) => {
                                  const isSelected = formData.dinheiroRepresenta.includes(rep);
                                  return (
                                    <button
                                      key={rep}
                                      type="button"
                                      onClick={() => handleToggleMultiSelect('dinheiroRepresenta', rep)}
                                      className={cn(
                                        "p-2.5 rounded-lg border text-[10px] font-bold transition-all text-center",
                                        isSelected
                                          ? "bg-primary/10 border-primary text-primary"
                                          : "bg-muted/10 border-border text-muted-foreground hover:bg-muted/20"
                                      )}
                                    >
                                      {rep}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ETAPA 5 NO CARD */}
                        {num === 5 && (
                          <div className="space-y-6">
                            {/* Principal Objetivo */}
                            <div className={cn("space-y-2 p-3 rounded-xl border transition-colors", isFieldPending('principalObjetivo') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                              {renderFieldLabel("Principal Objetivo", "principalObjetivo")}
                              <textarea
                                value={formData.principalObjetivo}
                                onChange={e => setFormData(prev => ({ ...prev, principalObjetivo: e.target.value }))}
                                className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none resize-none"
                                rows={2}
                                placeholder="Não informado"
                              />
                            </div>

                            {/* Outros Objetivos */}
                            <div className="space-y-4 p-4 rounded-xl border border-border/60">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 relative pr-8">
                                  {renderFieldLabel("Outros objetivos?", "possuiOutrosObjetivos")}
                                  <select
                                    value={formData.possuiOutrosObjetivos}
                                    onChange={e => setFormData(prev => ({ ...prev, possuiOutrosObjetivos: e.target.value, outrosObjetivosTexto: '' }))}
                                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                  >
                                    <option value="Não">Não</option>
                                    <option value="Sim">Sim</option>
                                  </select>
                                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                                </div>
                                {formData.possuiOutrosObjetivos === 'Sim' && (
                                  <div className={cn("space-y-2 p-3 rounded-xl border transition-colors", isFieldPending('outrosObjetivosTexto') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                    {renderFieldLabel("Quais outros objetivos?", "outrosObjetivosTexto")}
                                    <input
                                      type="text"
                                      value={formData.outrosObjetivosTexto}
                                      onChange={e => setFormData(prev => ({ ...prev, outrosObjetivosTexto: e.target.value }))}
                                      className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none"
                                      placeholder="Descreva..."
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Valores e Prazos */}
                            <div className="space-y-4 p-4 rounded-xl border border-border/60">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 relative pr-8">
                                  {renderFieldLabel("Definiu valores?", "definiuValoresObjetivos")}
                                  <select
                                    value={formData.definiuValoresObjetivos}
                                    onChange={e => setFormData(prev => ({ ...prev, definiuValoresObjetivos: e.target.value, definiuPrazosObjetivos: e.target.value === 'Não' ? 'Não' : prev.definiuPrazosObjetivos }))}
                                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                  >
                                    <option value="Não">Não</option>
                                    <option value="Sim">Sim</option>
                                  </select>
                                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                                </div>
                                {formData.definiuValoresObjetivos === 'Sim' && (
                                  <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('definiuPrazosObjetivos') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                                    {renderFieldLabel("Definiu prazos?", "definiuPrazosObjetivos")}
                                    <select
                                      value={formData.definiuPrazosObjetivos}
                                      onChange={e => setFormData(prev => ({ ...prev, definiuPrazosObjetivos: e.target.value }))}
                                      className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                                    >
                                      <option value="Não">Não</option>
                                      <option value="Sim">Sim</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Impedimentos */}
                            <div className={cn("space-y-3 p-4 rounded-xl border transition-colors", isFieldPending('impedeObjetivos') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                              {renderFieldLabel("O que te impede de alcançar metas?", "impedeObjetivos")}
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {[
                                  'Renda mensal baixa',
                                  'Falta de disciplina nos gastos',
                                  'Falta de conhecimento sobre investimentos',
                                  'Dívidas acumuladas',
                                  'Falta de planejamento a longo prazo',
                                  'Despesas imprevistas frequentes'
                                ].map((imp) => {
                                  const isSelected = formData.impedeObjetivos.includes(imp);
                                  return (
                                    <button
                                      key={imp}
                                      type="button"
                                      onClick={() => handleToggleMultiSelect('impedeObjetivos', imp)}
                                      className={cn(
                                        "p-2.5 rounded-lg border text-[10px] font-bold transition-all text-center",
                                        isSelected
                                          ? "bg-primary/10 border-primary text-primary"
                                          : "bg-muted/10 border-border text-muted-foreground hover:bg-muted/20"
                                      )}
                                    >
                                      {imp}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Aposentadoria */}
                            <div className={cn("space-y-2 p-3 rounded-xl border transition-colors relative pr-8", isFieldPending('pensaAposentadoria') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                              {renderFieldLabel("Aposentadoria", "pensaAposentadoria")}
                              <select
                                value={formData.pensaAposentadoria}
                                onChange={e => setFormData(prev => ({ ...prev, pensaAposentadoria: e.target.value }))}
                                className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
                              >
                                <option value="">Não informado</option>
                                <option value="Sim, já comecei a planejar">Sim, já poupo / planejo</option>
                                <option value="Penso, mas não poupo">Penso, mas não sei poupar ou planejar</option>
                                <option value="Não penso no momento">Não penso nisso no momento</option>
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                            </div>
                          </div>
                        )}

                        {/* ETAPA 6 NO CARD */}
                        {num === 6 && (
                          <div className="space-y-6">
                            {/* Motivo busca */}
                            <div className={cn("space-y-2 p-3 rounded-xl border transition-colors", isFieldPending('motivoBuscaConsultoria') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Motivo de busca da consultoria</label>
                              <textarea
                                value={formData.motivoBuscaConsultoria}
                                onChange={e => setFormData(prev => ({ ...prev, motivoBuscaConsultoria: e.target.value }))}
                                className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none resize-none"
                                rows={3}
                                placeholder="Não informado"
                              />
                            </div>

                            {/* Expectativa final */}
                            <div className={cn("space-y-2 p-3 rounded-xl border transition-colors", isFieldPending('expectativaFinalProcesso') ? "border-amber-500/30 bg-amber-500/5" : "border-border/60")}>
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">O que espera alcançar ao final</label>
                              <textarea
                                value={formData.expectativaFinalProcesso}
                                onChange={e => setFormData(prev => ({ ...prev, expectativaFinalProcesso: e.target.value }))}
                                className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none resize-none"
                                rows={3}
                                placeholder="Não informado"
                              />
                            </div>

                            {/* Outras informações (Opcional) */}
                            <div className="space-y-2 p-3 rounded-xl border border-border/60">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Alguma outra informação para compartilhar?</label>
                                <span className="text-[8px] font-black uppercase text-slate-400">Opcional</span>
                              </div>
                              <textarea
                                value={formData.outrasInformacoes}
                                onChange={e => setFormData(prev => ({ ...prev, outrasInformacoes: e.target.value }))}
                                className="w-full bg-transparent border-none p-0 text-sm font-bold text-foreground outline-none resize-none"
                                rows={2}
                                placeholder="Especifique opcionalmente..."
                              />
                            </div>
                          </div>
                        )}

                        {/* Botão de Salvar individual da etapa se modificada */}
                        {modified && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="flex items-center justify-end gap-3 border-t border-border/40 pt-4 mt-4"
                          >
                            {isSaved ? (
                              <span className="text-xs text-emerald-500 font-bold flex items-center gap-1.5 animate-pulse bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                                <CheckCircle2 size={16} /> Salvo com sucesso!
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSaveStepData(num)}
                                disabled={saving}
                                className="px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-primary/15 flex items-center gap-2"
                              >
                                <Save size={14} />
                                {saving ? "Salvando..." : "Salvar Alterações"}
                              </button>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE VALIDAÇÃO DE CAMPOS VAZIOS */}
      <AnimatePresence>
        {showValidationModal && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border p-6 rounded-[2rem] max-w-md w-full shadow-2xl relative space-y-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Campos Pendentes</h3>
                  <p className="text-xs text-muted-foreground">
                    Os seguintes campos da etapa atual não foram preenchidos:
                  </p>
                </div>
              </div>

              <div className="max-h-40 overflow-y-auto bg-muted/40 border border-border rounded-xl p-3 custom-scrollbar text-xs font-bold text-slate-700 dark:text-slate-350 space-y-1.5">
                {stepValidationErrors.map((err, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                    {err}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowValidationModal(false)}
                  className="flex-1 px-5 py-3 border border-border hover:bg-muted rounded-xl text-[10px] font-black uppercase tracking-widest text-foreground transition-all"
                >
                  Corrigir
                </button>
                <button
                  type="button"
                  onClick={handleProceedWithMissing}
                  className="flex-1 px-5 py-3 bg-amber-500 hover:bg-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-amber-500/15"
                >
                  Prosseguir mesmo assim
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Componente simples de LoaderSpinner
const LoaderSpinner = () => (
  <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
);
