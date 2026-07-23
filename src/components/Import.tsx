import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useFinance } from '../FinanceContext';
import { useModal } from '../contexts/ModalContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Upload,
  X,
  CreditCard,
  Wallet as WalletIcon,
  ChevronRight,
  ArrowLeft,
  Search,
  Check,
  Clock,
  Plus,
  ThumbsUp,
  Trash2,
  Sparkles,
  Monitor
} from 'lucide-react';
import { cn, formatCurrency, formatDate, getInvoicePeriod } from '../lib/utils';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { TransactionType } from '../types';
import { CustomSelect, SelectOption } from './ui/CustomSelect';
import { buildOrganizedWalletOptions } from '../lib/utils';

interface ImportRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  suggestionSource?: 'history' | 'keywords_high' | 'keywords_low' | 'fallback' | 'manual';
  toWalletId?: string;
  invoiceMonth?: number;
  invoiceYear?: number;
  isPaid: boolean;
  paidDate: string;
  suggestedType: TransactionType;
  originalSign: '-' | '+';
}

const STATIC_CATEGORIZATION_RULES: { keywords: string[]; categoryTerm: string; level: 'keywords_high' | 'keywords_low' }[] = [
  // COMPRAS
  {
    keywords: ["amazon", "mercado livre", "mercadolivre", "magalu", "magazine luiza", "americanas", "casas bahia", "pontofrio", "extra", "shopee", "shein", "aliexpress", "temu", "kabum", "kalunga", "leroy", "leroy merlin", "madeira madeira", "tokstok", "tok stok", "camicado", "fast shop", "casa video", "multicoisas", "lojas cem", "drogasil", "marketplace", "ecommerce"],
    categoryTerm: "compras",
    level: "keywords_high"
  },
  {
    keywords: ["online", "havan", "loja", "store", "compra"],
    categoryTerm: "compras",
    level: "keywords_low"
  },
  // MERCADO
  {
    keywords: ["atacadao", "assai", "comper", "pao de acucar", "dia", "muffato", "savegnago", "fort atacadista", "sams club", "sams"],
    categoryTerm: "mercado",
    level: "keywords_high"
  },
  {
    keywords: ["mercado", "supermercado", "carrefour", "hortifruti", "quitanda", "feira", "sacolao", "emporio", "mercearia", "padaria", "acougue", "frigorifico"],
    categoryTerm: "mercado",
    level: "keywords_low"
  },
  // EDUCAÇÃO
  {
    keywords: ["udemy", "alura", "rocketseat", "origamid", "ebac", "hotmart", "estacio", "unopar", "anhanguera", "unicesumar", "faveni", "wizard", "ccaa", "cna", "fisk", "kumon", "livraria", "saraiva"],
    categoryTerm: "educacao",
    level: "keywords_high"
  },
  {
    keywords: ["escola", "faculdade", "universidade", "curso", "curso online", "mensalidade", "leitura", "apostila", "material escolar"],
    categoryTerm: "educacao",
    level: "keywords_low"
  },
  // CUIDADOS PESSOAIS
  {
    keywords: ["natura", "avon", "boticario", "sephora", "mary kay"],
    categoryTerm: "cuidados_pessoais",
    level: "keywords_high"
  },
  {
    keywords: ["salao", "barbearia", "cabeleireiro", "manicure", "pedicure", "estetica", "depilacao", "spa", "esmalteria", "beleza", "cosmeticos", "perfume", "maquiagem", "shampoo", "condicionador", "hidratante"],
    categoryTerm: "cuidados_pessoais",
    level: "keywords_low"
  },
  // ALIMENTAÇÃO
  {
    keywords: ["ifood", "aiqfome", "habibs", "subway", "mcdonald", "burger king", "bk", "kfc", "giraffas", "bobs", "china in box", "outback", "coco bambu"],
    categoryTerm: "alimentacao",
    level: "keywords_high"
  },
  {
    keywords: ["delivery", "lanchonete", "lanche", "hamburguer", "hamburgueria", "pizza", "pizzaria", "esfiha", "marmita", "marmitex", "refeicao", "comida", "alimento"],
    categoryTerm: "alimentacao",
    level: "keywords_low"
  },
  // TRANSPORTE
  {
    keywords: ["uber", "99", "ipiranga", "shell", "petrobras", "sem parar", "conectcar", "detran"],
    categoryTerm: "transporte",
    level: "keywords_high"
  },
  {
    keywords: ["combustivel", "gasolina", "etanol", "diesel", "posto", "br mania", "estacionamento", "zona azul", "pedagio", "oficina", "mecanica", "mecanico", "auto pecas", "borracharia", "troca de oleo"],
    categoryTerm: "transporte",
    level: "keywords_low"
  },
  // SAÚDE
  {
    keywords: ["droga raia", "drogasil", "pague menos", "ultrafarma", "panvel", "sao joao", "unimed", "amil", "bradesco saude", "hapvida"],
    categoryTerm: "saude",
    level: "keywords_high"
  },
  {
    keywords: ["farmacia", "drogaria", "hospital", "clinica", "laboratorio", "exame", "consulta", "medico", "dentista", "odontologia", "psicologo", "psicologa", "psiquiatra", "fisioterapia", "vacina", "remedio", "medicamento"],
    categoryTerm: "saude",
    level: "keywords_low"
  },
  // ASSINATURAS E SERVIÇOS
  {
    keywords: ["netflix", "spotify", "youtube", "youtube premium", "google", "google one", "apple", "icloud", "amazon prime", "prime video", "disney", "disney plus", "disney+", "globoplay", "max", "hbo", "deezer", "microsoft", "office 365", "adobe", "canva", "chatgpt", "openai", "claude", "gemini", "notion", "evernote", "todoist", "hostinger", "registro br", "vercel", "supabase", "cloudflare", "aws", "digitalocean"],
    categoryTerm: "assinaturas_servicos",
    level: "keywords_high"
  },
  // ROUPAS
  {
    keywords: ["renner", "riachuelo", "cea", "c&a", "zara", "hering", "marisa", "youcom", "centauro", "nike", "adidas", "puma", "fila", "mizuno", "netshoes", "dafiti"],
    categoryTerm: "roupas",
    level: "keywords_high"
  },
  {
    keywords: ["calcado", "calcados", "sapato", "tenis", "roupa", "roupas", "vestuario", "confeccao"],
    categoryTerm: "roupas",
    level: "keywords_low"
  },
  // MORADIA
  {
    keywords: ["energisa", "enel", "cemig", "copel", "cpfl", "saneago", "sabesp", "sanesul", "vivo fibra", "claro net", "oi fibra", "tim live"],
    categoryTerm: "moradia",
    level: "keywords_high"
  },
  {
    keywords: ["aluguel", "condominio", "energia", "luz", "eletricidade", "agua", "internet", "gas", "material de construcao", "construcao", "cimento", "tinta", "reforma"],
    categoryTerm: "moradia",
    level: "keywords_low"
  },
  // TRABALHO
  {
    keywords: ["kalunga", "coworking", "crc"],
    categoryTerm: "trabalho",
    level: "keywords_high"
  },
  {
    keywords: ["papelaria", "impressao", "xerox", "cartucho", "toner", "escritorio", "dominio", "certificado digital", "contador", "notebook", "monitor", "teclado", "mouse", "webcam", "licenca"],
    categoryTerm: "trabalho",
    level: "keywords_low"
  },
  // BARES E RESTAURANTES
  {
    keywords: ["outback", "coco bambu"],
    categoryTerm: "bares_restaurantes",
    level: "keywords_high"
  },
  {
    keywords: ["bar", "pub", "choperia", "cervejaria", "restaurante", "churrascaria", "rodizio", "rodizio de pizza", "sushi", "temakeria", "japones", "espeteria", "boteco", "happy hour", "adega", "vinho"],
    categoryTerm: "bares_restaurantes",
    level: "keywords_low"
  },
  // LAZER E HOBBIES
  {
    keywords: ["cinemark", "cinepolis", "eventim", "sympla", "steam", "playstation", "xbox", "nintendo", "epic games", "kindle", "smart fit", "bluefit"],
    categoryTerm: "lazer",
    level: "keywords_high"
  },
  {
    keywords: ["cinema", "teatro", "show", "ingresso", "livro", "academia", "pesca", "camping", "bicicleta"],
    categoryTerm: "lazer",
    level: "keywords_low"
  },
  // PRESENTES, ANIVERSÁRIOS E DOAÇÕES
  {
    keywords: ["cacau show", "kopenhagen"],
    categoryTerm: "presentes_doacoes",
    level: "keywords_high"
  },
  {
    keywords: ["presente", "floricultura", "flores", "aniversario", "casamento", "doacao", "igreja", "dizimo", "vaquinha", "rifa", "presente aniversario"],
    categoryTerm: "presentes_doacoes",
    level: "keywords_low"
  },
  // DÍVIDAS E EMPRÉSTIMOS
  {
    keywords: ["emprestimo", "financiamento", "parcela", "consignado", "crediario", "quitacao", "pagamento emprestimo", "juros", "refinanciamento"],
    categoryTerm: "dividas_emprestimos",
    level: "keywords_low"
  },
  // FAMÍLIA E FILHOS
  {
    keywords: ["creche", "baba", "fralda", "brinquedo", "escola infantil", "pensao", "filho", "filha", "bebe", "infantil", "enxoval"],
    categoryTerm: "familia_filhos",
    level: "keywords_low"
  },
  // IMPOSTOS E TAXAS
  {
    keywords: ["ipva", "licenciamento", "darf", "gps", "simples nacional", "receita federal", "prefeitura", "sefaz", "mei"],
    categoryTerm: "impostos_taxas",
    level: "keywords_high"
  },
  {
    keywords: ["iss", "icms", "irpf", "imposto", "taxa", "multa", "tributo"],
    categoryTerm: "impostos_taxas",
    level: "keywords_low"
  },
  // INVESTIMENTOS (Quando despesa)
  {
    keywords: ["tesouro direto", "xp", "rico", "clear", "btg", "inter investimentos", "nu invest", "corretora", "b3"],
    categoryTerm: "investimentos_despesa",
    level: "keywords_high"
  },
  {
    keywords: ["cdb", "lci", "lca", "fii", "acoes", "aporte"],
    categoryTerm: "investimentos_despesa",
    level: "keywords_low"
  },
  // PETS
  {
    keywords: ["cobasi", "petz"],
    categoryTerm: "pets",
    level: "keywords_high"
  },
  {
    keywords: ["petshop", "pet shop", "racao", "veterinario", "banho", "tosa", "vacina pet", "animal", "cachorro", "gato"],
    categoryTerm: "pets",
    level: "keywords_low"
  },
  // VIAGEM
  {
    keywords: ["booking", "airbnb", "decolar", "123 milhas", "latam", "gol", "azul"],
    categoryTerm: "viagem",
    level: "keywords_high"
  },
  {
    keywords: ["hotel", "hospedagem", "passagem", "rodoviaria", "onibus", "viagem", "resort", "pousada"],
    categoryTerm: "viagem",
    level: "keywords_low"
  },
  // SALÁRIO (Receita)
  {
    keywords: ["salario", "folha", "pagamento empresa", "pro labore", "prolabore", "holerite", "adiantamento salarial"],
    categoryTerm: "salario",
    level: "keywords_low"
  },
  // OUTRAS RECEITAS (Receita)
  {
    keywords: ["pix recebido", "pix", "ted recebida", "doc recebido", "transferencia recebida", "deposito", "recebimento", "cliente", "venda", "reembolso", "cashback", "estorno", "bonus", "premio"],
    categoryTerm: "outras_receitas",
    level: "keywords_low"
  },
  // INVESTIMENTOS (Quando receita)
  {
    keywords: ["dividendo", "dividendos", "rendimento", "rendimentos", "juros", "tesouro", "cdb", "lci", "lca", "fii", "acoes", "b3", "lucro investimento"],
    categoryTerm: "investimentos_receita",
    level: "keywords_low"
  },
  // EMPRÉSTIMOS (Quando receita)
  {
    keywords: ["emprestimo recebido", "credito aprovado", "liberacao de credito", "financiamento aprovado", "valor emprestado"],
    categoryTerm: "emprestimos_receita",
    level: "keywords_low"
  }
];

interface ImportProps {
  setActiveTab?: (tab: string) => void;
}

export const Import: React.FC<ImportProps> = ({ setActiveTab }) => {
  const { categories, wallets, addTransactions, activeSpace, orderedCards, orderedAccounts, transactions } = useFinance();
  const { profile, viewingProfile, refreshProfile } = useAuth();
  const { showAlert, showConfirm } = useModal();
  const activeProfile = viewingProfile || profile;

  const [isMobile, setIsMobile] = useState(false);

  const [dbPatterns, setDbPatterns] = useState<{
    user: any[];
    global: any[];
  }>({ user: [], global: [] });

  const loadDbPatterns = async (rows: ImportRow[]) => {
    try {
      const uniqueDescriptions = Array.from(new Set(rows.map(r => normalizeText(r.description))));
      if (uniqueDescriptions.length === 0) return { user: [], global: [] };

      // Carregar padrões locais do usuário
      const { data: userPatterns, error: userError } = await supabase
        .from('user_category_patterns')
        .select('description_pattern, category_id, occurrences')
        .eq('user_id', activeProfile?.id)
        .in('description_pattern', uniqueDescriptions);

      if (userError) console.error("Erro ao ler user_category_patterns:", userError);

      // Carregar padrões globais
      const { data: globalPatterns, error: globalError } = await supabase
        .from('global_category_patterns')
        .select('description_pattern, category_name, occurrences')
        .in('description_pattern', uniqueDescriptions);

      if (globalError) console.error("Erro ao ler global_category_patterns:", globalError);

      const patterns = {
        user: userPatterns || [],
        global: globalPatterns || []
      };
      
      setDbPatterns(patterns);
      return patterns;
    } catch (err) {
      console.error("Erro no loadDbPatterns:", err);
      return { user: [], global: [] };
    }
  };

  const normalizeText = (text: string): string => {
    if (!text) return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const findCategoryByHistory = (desc: string, type: TransactionType): string => {
    const normDesc = normalizeText(desc);
    if (!normDesc || normDesc.length < 3) return "";

    const targetType = (type === 'provision' || type === 'planned') ? 'expense' : type;

    const validTxs = transactions.filter(t => {
      if (t.type !== targetType) return false;
      if (!t.categoryId) return false;
      const cat = categories.find(c => c.id === t.categoryId);
      return cat && !cat.isDeleted && cat.isActive !== false;
    });

    const exactMatch = validTxs.find(t => normalizeText(t.description) === normDesc);
    if (exactMatch) return exactMatch.categoryId;

    const partialMatch = validTxs.find(t => {
      const histNorm = normalizeText(t.description);
      if (histNorm.length < 4) return false;
      return normDesc.includes(histNorm) || histNorm.includes(normDesc);
    });
    if (partialMatch) return partialMatch.categoryId;

    return "";
  };

  const findCategoryByTerm = (term: string, type: TransactionType): string => {
    const normalizedTerm = normalizeText(term);

    const alternativeTermsMap: Record<string, string[]> = {
      compras: ["compras", "compra", "shoppings", "shopping", "outros", "loja", "vestuario", "utilidades"],
      mercado: ["mercado", "supermercado", "alimentacao", "compras", "feira", "sacolao"],
      educacao: ["educacao", "ensino", "curso", "faculdade", "escola", "estudos", "colegio"],
      cuidados_pessoais: ["cuidados pessoais", "pessoais", "cuidados", "beleza", "salao", "estetica", "higiene"],
      alimentacao: ["alimentacao", "comida", "refeicao", "restaurante", "mercado"],
      transporte: ["transporte", "carro", "veiculo", "viagem", "locomocao", "combustivel", "posto"],
      saude: ["saude", "farmacia", "medicina", "medico", "plano de saude", "unimed", "clinica"],
      assinaturas_servicos: ["assinaturas", "servicos", "assinaturas e servicos", "mensalidades", "streaming", "tecnologia"],
      roupas: ["roupas", "roupa", "vestuario", "calcados", "sapatos", "moda"],
      moradia: ["moradia", "casa", "habitacao", "contas", "despesas fixas", "servicos", "aluguel", "condominio"],
      trabalho: ["trabalho", "profissional", "escritorio", "coworking", "carreira", "negocios"],
      bares_restaurantes: ["bares", "restaurantes", "bares e restaurantes", "alimentacao", "lazer", "refeicao"],
      lazer: ["lazer", "entretenimento", "diversao", "hobbies", "viagem", "academia", "esporte"],
      presentes_doacoes: ["presentes", "doacoes", "presentes e doacoes", "caridade", "igreja", "dizimo"],
      dividas_emprestimos: ["dividas", "emprestimos", "dividas e emprestimos", "financiamentos", "parcelas"],
      familia_filhos: ["familia", "filhos", "familia e filhos", "creche", "escola infantil", "filho", "filha"],
      impostos_taxas: ["impostos", "taxas", "impostos e taxas", "tributos", "tarifas", "governo", "mei", "ipva"],
      investimentos_despesa: ["investimentos", "investimento", "aplicacoes", "aplicacao", "poupanca", "aporte"],
      pets: ["pets", "pet", "animal", "animais", "veterinario", "petshop", "pet shop"],
      viagem: ["viagem", "viagens", "hospedagem", "hotel", "turismo", "passagens"],
      salario: ["salario", "folha", "pro labore", "prolabore", "vencimentos", "remuneracao"],
      outras_receitas: ["outras receitas", "receitas", "vendas", "venda direta", "servico", "faturamento", "recebidos", "pix recebido"],
      investimentos_receita: ["investimentos", "investimento", "dividendos", "lucros", "rendimentos", "rendimento"],
      emprestimos_receita: ["emprestimos", "emprestimo", "credito", "financiamento"]
    };

    const searchTerms = alternativeTermsMap[normalizedTerm] || [normalizedTerm];
    const targetType = (type === 'provision' || type === 'planned') ? 'expense' : type;
    const activeCategories = categories.filter(c => c.type === targetType && !c.isDeleted && c.isActive !== false);

    for (const searchTerm of searchTerms) {
      const matchedCat = activeCategories.find(c => normalizeText(c.name).includes(searchTerm));
      if (matchedCat) return matchedCat.id;
    }

    return "";
  };

  const suggestCategory = (
    desc: string, 
    type: TransactionType, 
    currentDbPatterns?: { user: any[]; global: any[] }
  ): { categoryId: string; source?: 'history' | 'keywords_high' | 'keywords_low' | 'fallback' | 'manual' } => {
    const historyCatId = findCategoryByHistory(desc, type);
    if (historyCatId) {
      return { categoryId: historyCatId, source: 'history' };
    }

    const normDesc = normalizeText(desc);
    const targetType = (type === 'provision' || type === 'planned') ? 'expense' : type;
    const patternsToUse = currentDbPatterns || dbPatterns;

    if (patternsToUse.user && patternsToUse.user.length > 0) {
      const userPattern = patternsToUse.user.find(p => p.description_pattern === normDesc);
      if (userPattern && userPattern.category_id) {
        const cat = categories.find(c => c.id === userPattern.category_id && c.type === targetType && !c.isDeleted && c.isActive !== false);
        if (cat) {
          return { categoryId: cat.id, source: 'history' };
        }
      }
    }

    if (patternsToUse.global && patternsToUse.global.length > 0) {
      const globalMatches = patternsToUse.global.filter(p => p.description_pattern === normDesc);
      if (globalMatches.length > 0) {
        const bestGlobalMatch = globalMatches.sort((a, b) => b.occurrences - a.occurrences)[0];
        if (bestGlobalMatch && bestGlobalMatch.category_name) {
          const cat = categories.find(c => normalizeText(c.name) === normalizeText(bestGlobalMatch.category_name) && c.type === targetType && !c.isDeleted && c.isActive !== false);
          if (cat) {
            const isHighConfidence = bestGlobalMatch.occurrences >= 5;
            return {
              categoryId: cat.id,
              source: isHighConfidence ? 'keywords_high' : 'keywords_low'
            };
          }
        }
      }
    }

    const isTransferOrPix = type === 'income' && (
      normDesc.includes("pix") || 
      normDesc.includes("recebido") || 
      normDesc.includes("ted") || 
      normDesc.includes("doc") || 
      normDesc.includes("transferencia")
    );

    if (isTransferOrPix) {
      const ownerName = activeProfile?.name ? normalizeText(activeProfile.name) : "";
      if (ownerName && normDesc.includes(ownerName)) {
        const ownTransferCatId = findCategoryByTerm("transferencia", type) || findCategoryByTerm("outros", type);
        if (ownTransferCatId) {
          return { categoryId: ownTransferCatId, source: 'keywords_low' };
        }
      }

      const pixCatId = findCategoryByTerm("pix_recebido", type);
      if (pixCatId) {
        return { categoryId: pixCatId, source: 'keywords_low' };
      }
    }

    for (const rule of STATIC_CATEGORIZATION_RULES) {
      const match = rule.keywords.some(keyword => normDesc.includes(normalizeText(keyword)));
      if (match) {
        const termCatId = findCategoryByTerm(rule.categoryTerm, type);
        if (termCatId) {
          return { categoryId: termCatId, source: rule.level };
        }
      }
    }

    if (targetType === 'expense') {
      const outrosExpenseCat = categories.find(c => {
        const nameNorm = normalizeText(c.name);
        return c.type === 'expense' && !c.isDeleted && c.isActive !== false && !c.parentId &&
          (nameNorm.includes("outros") || nameNorm.includes("outras despesas") || nameNorm.includes("diversos"));
      });
      if (outrosExpenseCat) {
        return { categoryId: outrosExpenseCat.id, source: 'fallback' };
      }
    } else if (targetType === 'income') {
      const outrasIncomeCat = categories.find(c => {
        const nameNorm = normalizeText(c.name);
        return c.type === 'income' && !c.isDeleted && c.isActive !== false &&
          (nameNorm.includes("outras receitas") || nameNorm.includes("receitas") || nameNorm.includes("outros") || nameNorm.includes("diversos"));
      });
      if (outrasIncomeCat) {
        return { categoryId: outrasIncomeCat.id, source: 'fallback' };
      }
    }

    const firstActiveCat = categories.find(c => c.type === targetType && !c.isDeleted && c.isActive !== false && !c.parentId);
    if (firstActiveCat) {
      return { categoryId: firstActiveCat.id, source: 'fallback' };
    }

    return { categoryId: '', source: undefined };
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isLimitsModalOpen, setIsLimitsModalOpen] = useState(false);
  const [personalLimitInput, setPersonalLimitInput] = useState(4);
  const [businessLimitInput, setBusinessLimitInput] = useState(4);
  const [isSavingLimits, setIsSavingLimits] = useState(false);

  const canAdjustLimits = useMemo(() => {
    const isUserAdmin = profile?.role === 'admin' || profile?.role === 'master_admin';
    const isManagingUser = viewingProfile !== null && viewingProfile.role === 'user';
    return isUserAdmin && isManagingUser;
  }, [profile, viewingProfile]);

  useEffect(() => {
    if (viewingProfile) {
      setPersonalLimitInput(viewingProfile.personal_imports_limit !== undefined && viewingProfile.personal_imports_limit !== null ? viewingProfile.personal_imports_limit : 4);
      setBusinessLimitInput(viewingProfile.business_imports_limit !== undefined && viewingProfile.business_imports_limit !== null ? viewingProfile.business_imports_limit : 4);
    }
  }, [viewingProfile]);

  const creditCardsList = useMemo(() => {
    const list = wallets.filter(w => w.isActive && w.type === 'credit_card');
    list.sort((a, b) => {
      const idxA = orderedCards.indexOf(a.id);
      const idxB = orderedCards.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
    return list;
  }, [wallets, orderedCards]);

  const checkingWalletsList = useMemo(() => {
    const list = wallets.filter(w => w.isActive && w.type !== 'credit_card' && (!w.walletCategory || w.walletCategory === 'checking'));
    list.sort((a, b) => {
      const idxA = orderedAccounts.indexOf(a.id);
      const idxB = orderedAccounts.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
    return list;
  }, [wallets, orderedAccounts]);

  const savingsWalletsList = useMemo(() => {
    const list = wallets.filter(w => w.isActive && w.type !== 'credit_card' && w.walletCategory === 'savings');
    list.sort((a, b) => {
      const idxA = orderedAccounts.indexOf(a.id);
      const idxB = orderedAccounts.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
    return list;
  }, [wallets, orderedAccounts]);

  const wishlistWalletsList = useMemo(() => {
    const list = wallets.filter(w => w.isActive && w.type !== 'credit_card' && w.walletCategory === 'wishlist');
    list.sort((a, b) => {
      const idxA = orderedAccounts.indexOf(a.id);
      const idxB = orderedAccounts.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
    return list;
  }, [wallets, orderedAccounts]);

  const handleSaveLimits = async () => {
    if (!viewingProfile) return;
    setIsSavingLimits(true);
    try {
      const updatePayload: any = {};
      if (activeSpace === 'business') {
        updatePayload.business_imports_limit = businessLimitInput;
      } else {
        updatePayload.personal_imports_limit = personalLimitInput;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', viewingProfile.id);

      if (error) throw error;

      await refreshProfile();
      showAlert("Sucesso", "Limite de IA do usuário atualizado com sucesso.", "success");
      setIsLimitsModalOpen(false);
    } catch (err: any) {
      console.error("Erro ao salvar limites:", err);
      showAlert("Erro", "Não foi possível atualizar os limites do usuário.", "danger");
    } finally {
      setIsSavingLimits(false);
    }
  };

  const [step, setStep] = useState<'upload' | 'configure' | 'organize' | 'success'>('upload');
  const [uploadType, setUploadType] = useState<'sheet' | 'pdf' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [pdfProcessingMessage, setPdfProcessingMessage] = useState('Processando extrato com IA...');
  const [isDragging, setIsDragging] = useState(false);
  const [data, setData] = useState<ImportRow[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfFileInputRef = useRef<HTMLInputElement>(null);

  const selectedWallet = useMemo(() =>
    wallets.find(w => w.id === selectedWalletId)
    , [wallets, selectedWalletId]);

  const isUnlimited = useMemo(() => {
    return activeProfile?.role === 'admin' || activeProfile?.role === 'master_admin';
  }, [activeProfile]);

  const importLimit = useMemo(() => {
    if (isUnlimited) return Infinity;
    if (activeSpace === 'business') {
      return activeProfile?.business_imports_limit !== undefined ? activeProfile.business_imports_limit : 4;
    }
    return activeProfile?.personal_imports_limit !== undefined ? activeProfile.personal_imports_limit : 4;
  }, [activeProfile, activeSpace, isUnlimited]);

  const importsCount = useMemo(() => {
    if (activeSpace === 'business') {
      return activeProfile?.business_imports_count || 0;
    }
    return activeProfile?.personal_imports_count || 0;
  }, [activeProfile, activeSpace]);

  const remainingImports = isUnlimited ? Infinity : Math.max(0, importLimit - importsCount);
  const isLimitReached = isUnlimited ? false : remainingImports <= 0;

  const processFile = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        const parseSpreadsheetDate = (val: any, strict = false): string => {
          if (val instanceof Date) {
            const offset = val.getTimezoneOffset();
            const date = new Date(val.getTime() - (offset * 60 * 1000));
            return date.toISOString().split('T')[0];
          }

          if (typeof val === 'number' && val > 30000 && val < 60000) {
            // Excel serial date behavior
            const date = new Date(Math.round((val - 25569) * 86400 * 1000));
            if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
          }

          if (typeof val === 'string' && val.trim().length >= 5) {
            const cleanVal = val.trim().split(' ')[0].replace(/[.-]/g, '/');
            if (cleanVal.includes('/')) {
              const parts = cleanVal.split('/');
              if (parts.length === 3) {
                const [d, m, y] = parts;
                const year = y.length === 2 ? `20${y}` : y;
                const formatted = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                if (!isNaN(new Date(formatted).getTime())) return formatted;
              }
            }
            const d = new Date(cleanVal);
            if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
          }

          return strict ? "" : new Date().toISOString().split('T')[0];
        };

        const parseValue = (val: any): number | null => {
          if (typeof val === 'number') return val;
          if (typeof val !== 'string') return null;
          const strVal = val.replace(/[R$\s]/g, '');
          if (!strVal) return null;

          let num: number;
          if (strVal.includes(',') && (strVal.split(',').length === 2)) {
            num = Number(strVal.replace(/\./g, '').replace(',', '.'));
          } else {
            num = Number(strVal);
          }
          return isNaN(num) ? null : num;
        };

        const tempRows: ImportRow[] = jsonData.slice(1)
          .filter(row => row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== ""))
          .map(row => {
            // 1. Encontrar coluna de Data
            let dateIndex = -1;
            let dateStr = "";
            for (let i = 0; i < row.length; i++) {
              const d = parseSpreadsheetDate(row[i], true);
              if (d) {
                dateStr = d;
                dateIndex = i;
                break;
              }
            }
            if (!dateStr) dateStr = parseSpreadsheetDate(null);

            // 2. Encontrar coluna de Valor
            let valueIndex = -1;
            let numVal = 0;
            for (let i = 0; i < row.length; i++) {
              if (i === dateIndex) continue;
              const v = parseValue(row[i]);
              if (v !== null && v !== 0) {
                numVal = v;
                valueIndex = i;
                break;
              }
            }

            // 3. Identificar Descrição (concatenar o que sobrar)
            let descriptionParts: string[] = [];
            for (let i = 0; i < row.length; i++) {
              if (i === dateIndex || i === valueIndex) continue;
              const s = String(row[i] || "").trim();
              if (s && s !== "null" && s !== "undefined") {
                descriptionParts.push(s);
              }
            }
            let description = descriptionParts.join(' ').trim();
            if (!description && row[1]) description = String(row[1]);
            if (!description) description = "Sem descrição";

            const amount = Math.abs(numVal);
            const isNegative = numVal < 0;
            const suggested: TransactionType = isNegative ? 'expense' : 'income';

            return {
              id: Math.random().toString(36).substr(2, 9),
              date: dateStr,
              description,
              amount,
              type: suggested,
              suggestedType: suggested,
              originalSign: isNegative ? '-' : '+',
              categoryId: '',
              toWalletId: '',
              isPaid: true,
              paidDate: dateStr
            };
          });

        const loadedPatterns = await loadDbPatterns(tempRows);
        const finalRows = tempRows.map(r => {
          const suggestion = suggestCategory(r.description, r.type, loadedPatterns);
          return {
            ...r,
            categoryId: suggestion.categoryId,
            suggestionSource: suggestion.source
          };
        });

        setData(finalRows);
        setStep('configure');
      } catch (err) {
        console.error("Erro ao processar arquivo:", err);
        showAlert("Erro de Importação", "Erro ao ler o arquivo Excel. Verifique se o formato está correto.", "danger");
      } finally {
        setIsProcessing(false);
        setIsDragging(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleSelectPdfUpload = async () => {
    if (!isUnlimited && remainingImports === 1) {
      const confirmProceed = await showConfirm(
        "Última Importação do Mês",
        `Atenção: Esta é a sua última importação disponível para este mês no espaço ${activeSpace === 'personal' ? 'Pessoal' : 'Empresarial'}. Deseja prosseguir para a importação por IA?`,
        {
          variant: 'warning',
          confirmText: 'Prosseguir',
          cancelText: 'Cancelar'
        }
      );
      if (!confirmProceed) return;
    }
    setUploadType('pdf');
  };

  const processPdfFile = async (file: File) => {
    if (!isUnlimited && isLimitReached) {
      showAlert("Limite Atingido", `Você atingiu seu limite de ${importLimit} importações com IA este mês para o espaço ${activeSpace === 'personal' ? 'Pessoal' : 'Empresarial'}.`, "warning");
      return;
    }

    setIsProcessing(true);
    setIsProcessingPdf(true);
    setPdfProcessingMessage('Enviando extrato para a IA...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showAlert("Erro de Sessão", "Você precisa estar autenticado para realizar esta operação.", "danger");
        setIsProcessing(false);
        setIsProcessingPdf(false);
        return;
      }

      setPdfProcessingMessage('A IA está extraindo as transações do PDF...');
      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/pdf',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: file
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      const resData = await response.json();
      if (!resData.transactions || !Array.isArray(resData.transactions)) {
        throw new Error("Formato de resposta inválido da API");
      }

      const loadedPatterns = await loadDbPatterns(resData.transactions);
      const mappedTransactions = resData.transactions.map((tx: any) => {
        if (!tx.categoryId) {
          const suggestion = suggestCategory(tx.description || '', tx.type, loadedPatterns);
          return {
            ...tx,
            categoryId: suggestion.categoryId,
            suggestionSource: suggestion.source
          };
        }
        return {
          ...tx,
          suggestionSource: tx.suggestionSource || 'keywords_high'
        };
      });

      setData(mappedTransactions);
      setStep('configure');
    } catch (err: any) {
      console.error("Erro ao processar PDF:", err);
      showAlert("Erro de Importação", err.message || "Erro ao processar o extrato com IA. Verifique se o arquivo está correto.", "danger");
    } finally {
      setIsProcessing(false);
      setIsProcessingPdf(false);
    }
  };

  const handlePdfFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processPdfFile(file);
  };

  const handlePdfDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.pdf')) {
      processPdfFile(file);
    } else {
      setIsDragging(false);
      showAlert("Arquivo Inválido", "Por favor, arraste apenas arquivos PDF (.pdf)", "warning");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      processFile(file);
    } else {
      setIsDragging(false);
      showAlert("Arquivo Inválido", "Por favor, arraste apenas arquivos Excel (.xlsx ou .xls)", "warning");
    }
  };

  const handleApplyGlobalType = (type: TransactionType) => {
    setData(prev => prev.map(row => ({ ...row, type })));
  };

  const handleConfirmImport = async () => {
    const finalTxs = data.map(row => {
      const isReceived = (row.type === 'transfer' || row.type === 'provision') && row.suggestedType === 'income';
      return {
        description: row.description,
        amount: row.amount,
        date: row.date,
        type: row.type,
        categoryId: row.categoryId || undefined,
        walletId: isReceived ? (row.toWalletId || '') : selectedWalletId,
        toWalletId: isReceived ? selectedWalletId : (row.toWalletId || undefined),
        invoiceMonth: row.invoiceMonth,
        invoiceYear: row.invoiceYear,
        isPaid: selectedWallet?.type === 'credit_card' ? true : row.isPaid,
        paidDate: selectedWallet?.type === 'credit_card' ? undefined : (row.isPaid ? row.paidDate : undefined)
      };
    });

    try {
      await addTransactions(finalTxs);

      // Gravação assíncrona e independente dos padrões de categorias
      try {
        const userPatternsUpsert: any[] = [];
        const globalPatternsUpsert: any[] = [];

        data.forEach(row => {
          if (!row.categoryId) return;

          const normDesc = normalizeText(row.description);
          if (!normDesc || normDesc.length < 3) return;

          const cat = categories.find(c => c.id === row.categoryId);
          if (!cat) return;

          // 1. Padrão do Usuário
          const existingUserPattern = dbPatterns.user?.find(p => p.description_pattern === normDesc);
          let userOccurrences = 1;
          if (existingUserPattern) {
            userOccurrences = existingUserPattern.category_id === row.categoryId 
              ? (existingUserPattern.occurrences || 0) + 1 
              : 1;
          }

          userPatternsUpsert.push({
            user_id: activeProfile?.id,
            description_pattern: normDesc,
            category_id: row.categoryId,
            occurrences: userOccurrences,
            last_used: new Date().toISOString()
          });

          // 2. Padrão Global
          const existingGlobalPattern = dbPatterns.global?.find(
            p => p.description_pattern === normDesc && normalizeText(p.category_name) === normalizeText(cat.name)
          );
          const globalOccurrences = existingGlobalPattern 
            ? (existingGlobalPattern.occurrences || 0) + 1 
            : 1;

          globalPatternsUpsert.push({
            description_pattern: normDesc,
            category_name: cat.name,
            occurrences: globalOccurrences,
            last_used: new Date().toISOString()
          });
        });

        if (userPatternsUpsert.length > 0) {
          await supabase
            .from('user_category_patterns')
            .upsert(userPatternsUpsert, { onConflict: 'user_id,description_pattern' });
        }

        if (globalPatternsUpsert.length > 0) {
          await supabase
            .from('global_category_patterns')
            .upsert(globalPatternsUpsert, { onConflict: 'description_pattern,category_name' });
        }
      } catch (patternErr) {
        console.error("Erro ao salvar padrões de categorias:", patternErr);
      }

      // Incrementar contador de importações se for importação via IA (PDF)
      if (activeProfile && uploadType === 'pdf') {
        const updateField = activeSpace === 'business' ? 'business_imports_count' : 'personal_imports_count';
        const currentCount = activeSpace === 'business' ? (activeProfile.business_imports_count || 0) : (activeProfile.personal_imports_count || 0);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            [updateField]: currentCount + 1,
            monthly_imports_count: (activeProfile.monthly_imports_count || 0) + 1
          })
          .eq('id', activeProfile.id);

        if (!updateError) {
          refreshProfile();
        }
      }

      setStep('success');
    } catch (err) {
      console.error("Erro ao salvar importação:", err);
    }
  };

  const filteredData = data.filter(row =>
    row.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const walletOptions = useMemo(() => {
    return buildOrganizedWalletOptions(wallets, orderedCards, orderedAccounts, {
      excludeCreditCards: true,
      excludeWalletId: selectedWalletId
    });
  }, [wallets, orderedCards, orderedAccounts, selectedWalletId]);

  const typeOptionsForCard = [
    { id: 'income', name: 'Estorno', icon: 'TrendingUp', color: '#10b981' },
    { id: 'expense', name: 'Despesa', icon: 'TrendingDown', color: '#f43f5e' },
    { id: 'planned', name: 'Planejado', icon: 'CalendarClock', color: '#8b5cf6' }
  ];

  const typeOptionsNormal = [
    { id: 'income', name: 'Receita', icon: 'TrendingUp', color: '#10b981' },
    { id: 'expense', name: 'Despesa', icon: 'TrendingDown', color: '#f43f5e' },
    { id: 'transfer', name: 'Transferência', icon: 'ArrowRightLeft', color: '#3b82f6' },
    { id: 'provision', name: 'Provisão', icon: 'Clock', color: '#6366f1' },
    { id: 'planned', name: 'Planejado', icon: 'CalendarClock', color: '#8b5cf6' }
  ];

  const getCategoryOptions = (rowType: TransactionType) => {
    const isIncome = rowType === 'income';
    const targetType = (rowType === 'provision' || rowType === 'planned' || rowType === 'transfer') ? 'expense' : rowType;

    const filtered = categories.filter(c =>
      c.isActive &&
      c.type === targetType
    );

    const result: SelectOption[] = [];
    const parents = filtered.filter(c => !c.parentId);

    parents.forEach(parent => {
      result.push({ id: parent.id, name: parent.name, icon: parent.icon, color: parent.color });
      const children = categories.filter(c => c.parentId === parent.id && c.isActive);
      children.forEach(child => {
        result.push({ id: child.id, name: `${parent.name} > ${child.name}`, icon: child.icon, color: child.color, parentId: parent.id });
      });
    });
    return result;
  };

  const isMappingComplete = data.every(row => {
    const needsCategory = row.type === 'income' || row.type === 'expense';
    const needsToWallet = row.type === 'transfer' || row.type === 'provision';

    if (needsCategory && !row.categoryId) return false;
    if (needsToWallet && !row.toWalletId) return false;
    return true;
  });

  const currencyFormatter = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const parseBRL = (val: string) => {
    const cleanValue = val.replace(/\D/g, '');
    return Number(cleanValue) / 100;
  };

  if (isMobile) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-card border rounded-[2.5rem] shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto">
          <Monitor size={32} />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">Recurso para Computador</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          A importação de extratos bancários e planilhas exige uma tela maior para organização e revisão dos dados. Por favor, acesse este recurso através de um computador.
        </p>
        <button
          onClick={() => setActiveTab && setActiveTab('dashboard')}
          className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
        >
          Voltar para a Visão Geral
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto space-y-6 pb-20 px-4 transition-all duration-500">
      <div className="text-center space-y-2 mb-10">
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          Importação Inteligente
        </h1>
        <p className="text-muted-foreground text-lg">
          Transforme sua planilha em lançamentos organizados em segundos.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-card border rounded-full text-[10px] font-black uppercase tracking-widest mt-4">
          <span className="text-muted-foreground">Uso no Espaço {activeSpace === 'personal' ? 'Pessoal' : 'Empresarial'}:</span>
          <span className={cn(
            "font-bold",
            isLimitReached ? "text-rose-500" : "text-primary"
          )}>
            {importsCount} / {isUnlimited ? 'Ilimitado' : importLimit}
          </span>
          {canAdjustLimits && (
            <button 
              onClick={() => setIsLimitsModalOpen(true)}
              className="ml-3 px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[8px] font-black uppercase tracking-widest hover:bg-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Sparkles size={8} /> Ajustar Limites
            </button>
          )}
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-4 mb-12">
        {[
          { id: 'upload', label: 'Upload' },
          { id: 'configure', label: 'Origem' },
          { id: 'organize', label: 'Organização' },
          { id: 'success', label: 'Concluído' }
        ].map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all duration-300 border-2",
                step === s.id ? "bg-primary border-primary text-white scale-110 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]" :
                  (['upload', 'configure', 'organize', 'success'].indexOf(step) > i ? "bg-emerald-500 border-emerald-500 text-white" : "bg-card border-muted text-muted-foreground")
              )}>
                {['upload', 'configure', 'organize', 'success'].indexOf(step) > i ? <Check size={24} /> : i + 1}
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-[0.2em]",
                step === s.id ? "text-primary" : "text-muted-foreground/60"
              )}>
                {s.label}
              </span>
            </div>
            {i < 3 && (
              <div className={cn(
                "w-12 sm:w-16 h-[2px] mb-6 transition-colors duration-500",
                ['upload', 'configure', 'organize', 'success'].indexOf(step) > i ? "bg-emerald-500" : "bg-muted"
              )} />
            )}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 'upload' && uploadType === null && (
          <motion.div
            key="upload-select"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          >
            {/* Card Planilha (Envio Simples) */}
            <button
              onClick={() => setUploadType('sheet')}
              className="group relative bg-card border rounded-[2.5rem] p-12 text-left space-y-6 hover:border-emerald-500/50 hover:bg-emerald-500/[0.02] transition-all duration-300 shadow-xl hover:shadow-emerald-500/5 cursor-pointer flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="space-y-6 relative z-10">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <FileSpreadsheet size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tight text-foreground">Envio Simples</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Importe lançamentos a partir de planilhas Excel (.xlsx ou .xls) com as colunas organizadas de forma padronizada.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-emerald-500 text-xs font-black uppercase tracking-wider mt-8 group-hover:translate-x-1 transition-transform relative z-10">
                Selecionar Planilha
                <ArrowRight size={16} />
              </div>
            </button>

            {/* Card PDF Inteligente (IA) */}
            <button
              disabled={isLimitReached}
              onClick={handleSelectPdfUpload}
              className={cn(
                "group relative bg-card border-2 border-primary/20 rounded-[2.5rem] p-12 text-left space-y-6 hover:border-primary/50 hover:bg-primary/[0.02] transition-all duration-300 shadow-xl hover:shadow-primary/10 cursor-pointer flex flex-col justify-between overflow-hidden",
                isLimitReached && "opacity-50 cursor-not-allowed hover:border-primary/20 hover:bg-transparent shadow-none"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {/* Efeito Glow Neon para IA */}
              <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform" />

              <div className="space-y-6 relative z-10">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Sparkles size={32} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-2xl font-black tracking-tight text-foreground">Importação com IA</h3>
                    <span className="bg-primary/10 text-primary text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-primary/20">PREMIUM</span>
                  </div>
                  
                  {isUnlimited ? (
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mt-2">
                      Importações Ilimitadas (Conta de Administrador)
                    </span>
                  ) : isLimitReached ? (
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mt-2">
                      Limite Esgotado ({remainingImports} restantes)
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mt-2">
                      {remainingImports} de {importLimit} disponíveis este mês
                    </span>
                  )}
                  
                  <p className="text-muted-foreground text-sm leading-relaxed mt-2">
                    Envie o extrato bancário em PDF de qualquer banco. Nossa inteligência artificial processa, extrai e categoriza tudo em segundos.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-wider mt-8 group-hover:translate-x-1 transition-transform relative z-10">
                {isLimitReached ? 'Limite Mensal Esgotado' : 'Importar Extrato PDF'}
                {!isLimitReached && <ArrowRight size={16} />}
              </div>
            </button>
          </motion.div>
        )}

        {step === 'upload' && uploadType === 'sheet' && (
          <motion.div
            key="upload-sheet"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6 max-w-5xl mx-auto w-full"
          >
            {/* Botão de voltar para escolha de formato */}
            <button
              onClick={() => setUploadType(null)}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-4 cursor-pointer"
            >
              <ArrowLeft size={16} />
              Escolher Outro Formato
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Drag and Drop Planilha */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "bg-card border-2 border-dashed rounded-[2.5rem] p-16 text-center space-y-8 transition-all relative overflow-hidden group",
                  isDragging ? "border-primary bg-primary/10 scale-[1.02]" : "border-muted hover:border-primary/50 hover:bg-primary/[0.02]"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                <div className={cn(
                  "w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto transition-all duration-500 shadow-inner",
                  isDragging ? "scale-110 rotate-12 bg-primary text-white" : "group-hover:scale-110 group-hover:rotate-3"
                )}>
                  <Upload size={48} className={isDragging ? "text-white" : "text-primary"} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black">{isDragging ? "Solte para importar!" : "Arraste seu arquivo"}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    Formatos aceitos: <span className="font-bold text-foreground">.xlsx</span> e <span className="font-bold text-foreground">.xls</span>.
                  </p>
                </div>
                <div>
                  <input ref={fileInputRef} type="file" className="hidden" accept=".xlsx,.xls" onChange={handleFileUpload} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-primary text-primary-foreground px-10 py-4 rounded-2xl font-black cursor-pointer shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0 transition-all text-sm uppercase tracking-widest inline-flex items-center gap-2">
                    Selecionar Planilha
                    <ChevronRight size={18} />
                  </button>
                </div>
                {isProcessing && (
                  <div className="absolute inset-0 bg-card/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-50">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="font-bold tracking-widest text-sm animate-pulse">LENDO DADOS...</span>
                  </div>
                )}
              </div>

              {/* Instruções Planilha */}
              <div className="bg-card border rounded-[2.5rem] p-12 space-y-8 flex flex-col justify-center">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <CheckCircle2 className="text-blue-500" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Layout Esperado</h4>
                    <p className="text-muted-foreground text-sm">Organize as colunas da sua planilha como: <br /><span className="font-mono bg-muted px-1 rounded text-foreground">Data | Descrição | Valor</span></p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-xl">
                    <AlertCircle className="text-amber-500" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Sugestão Inteligente</h4>
                    <p className="text-muted-foreground text-sm">Identificamos automaticamente se o lançamento é uma entrada ou uma saída.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-rose-500/10 rounded-xl">
                    <CreditCard className="text-rose-500" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Atenção com Cartões</h4>
                    <p className="text-muted-foreground text-sm">Extratos de cartão tratam todos os lançamentos como despesa. Lembre-se de excluir eventuais "Pagamentos de Fatura" na etapa de organização.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'upload' && uploadType === 'pdf' && (
          <motion.div
            key="upload-pdf"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6 max-w-5xl mx-auto w-full"
          >
            {/* Botão de voltar para escolha de formato */}
            <button
              onClick={() => setUploadType(null)}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-4 cursor-pointer"
            >
              <ArrowLeft size={16} />
              Escolher Outro Formato
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Drag and Drop PDF */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handlePdfDrop}
                className={cn(
                  "bg-card border-2 border-dashed rounded-[2.5rem] p-16 text-center space-y-8 transition-all relative overflow-hidden group",
                  isDragging ? "border-primary bg-primary/10 scale-[1.02]" : "border-primary/20 hover:border-primary/50 hover:bg-primary/[0.02]"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                <div className={cn(
                  "w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto transition-all duration-500 shadow-inner",
                  isDragging ? "scale-110 rotate-12 bg-primary text-white" : "group-hover:scale-110 group-hover:rotate-3"
                )}>
                  <Upload size={48} className={isDragging ? "text-white" : "text-primary"} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black">{isDragging ? "Solte o extrato aqui!" : "Arraste seu extrato bancário"}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    Formato aceito: apenas arquivos <span className="font-bold text-foreground">.pdf</span>.
                  </p>
                </div>
                <div>
                  <input ref={pdfFileInputRef} type="file" className="hidden" accept=".pdf" onChange={handlePdfFileUpload} />
                  <button type="button" onClick={() => pdfFileInputRef.current?.click()} className="bg-primary text-primary-foreground px-10 py-4 rounded-2xl font-black cursor-pointer shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0 transition-all text-sm uppercase tracking-widest inline-flex items-center gap-2">
                    Selecionar PDF
                    <Sparkles size={18} />
                  </button>
                </div>
                {isProcessingPdf && (
                  <div className="absolute inset-0 bg-card/95 backdrop-blur-md flex flex-col items-center justify-center gap-6 z-50 p-8">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <Sparkles size={24} className="text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <div className="space-y-2 text-center">
                      <span className="font-black tracking-widest text-sm uppercase text-primary animate-pulse">PROCESSANDO COM IA...</span>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">{pdfProcessingMessage}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Instruções PDF com IA */}
              <div className="bg-card border rounded-[2.5rem] p-12 space-y-8 flex flex-col justify-center">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Inteligência Sem Limites</h4>
                    <p className="text-muted-foreground text-sm">Leitura automática de datas, descrições e valores. Funciona para qualquer banco, sem necessidade de layouts manuais.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Mecanismo Cascata</h4>
                    <p className="text-muted-foreground text-sm">O sistema busca correspondência na sua memória de hábitos e na base global antes de acionar a IA. Muito mais rápido e preciso.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Aprendizado Contínuo</h4>
                    <p className="text-muted-foreground text-sm">Sempre que você confirmar ou ajustar uma categoria na tabela a seguir, o sistema aprende suas preferências para as próximas importações.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'configure' && (
          <motion.div
            key="configure"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <div className="bg-card border rounded-[2.5rem] p-12 shadow-xl shadow-black/5">
              <h3 className="text-2xl font-black mb-8 text-center">Para onde vamos importar?</h3>

              <div className="space-y-6">
                {creditCardsList.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 pl-1">Cartões de Crédito</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {creditCardsList.map(wallet => (
                        <button
                          key={wallet.id}
                          onClick={() => setSelectedWalletId(wallet.id)}
                          className={cn(
                            "p-6 rounded-2xl border-2 transition-all text-left flex items-center gap-4 group relative overflow-hidden",
                            selectedWalletId === wallet.id
                              ? "border-primary bg-primary/5 shadow-lg"
                              : "border-muted hover:border-primary/30 hover:bg-accent/50"
                          )}
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-colors overflow-hidden",
                            selectedWalletId === wallet.id ? "bg-primary text-white" : "bg-muted group-hover:bg-primary/20 text-muted-foreground group-hover:text-primary"
                          )}>
                            {wallet.logoUrl ? (
                              <img src={wallet.logoUrl} alt={wallet.name} className="w-full h-full object-cover" />
                            ) : (
                              <CreditCard size={24} />
                            )}
                          </div>
                          <div>
                            <p className="font-black text-sm truncate">{wallet.name}</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Cartão</p>
                          </div>
                          {selectedWalletId === wallet.id && (
                            <div className="absolute top-4 right-4 bg-primary text-white p-1 rounded-full">
                              <Check size={12} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {checkingWalletsList.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 pl-1">Conta Corrente</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {checkingWalletsList.map(wallet => (
                        <button
                          key={wallet.id}
                          onClick={() => setSelectedWalletId(wallet.id)}
                          className={cn(
                            "p-6 rounded-2xl border-2 transition-all text-left flex flex-col gap-4 group relative overflow-hidden",
                            selectedWalletId === wallet.id
                              ? "border-primary bg-primary/5 shadow-lg"
                              : "border-muted hover:border-primary/30 hover:bg-accent/50"
                          )}
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-colors overflow-hidden",
                            selectedWalletId === wallet.id ? "bg-primary text-white" : "bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white"
                          )}>
                            {wallet.logoUrl ? (
                              <img src={wallet.logoUrl} alt={wallet.name} className="w-full h-full object-cover" />
                            ) : (
                              <WalletIcon size={24} />
                            )}
                          </div>
                          <div>
                            <p className="font-black text-sm truncate">{wallet.name}</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Conta Corrente</p>
                          </div>
                          {selectedWalletId === wallet.id && (
                            <div className="absolute top-4 right-4 bg-primary text-white p-1 rounded-full">
                              <Check size={12} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {savingsWalletsList.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 pl-1">Cofrinhos</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {savingsWalletsList.map(wallet => (
                        <button
                          key={wallet.id}
                          onClick={() => setSelectedWalletId(wallet.id)}
                          className={cn(
                            "p-6 rounded-2xl border-2 transition-all text-left flex flex-col gap-4 group relative overflow-hidden",
                            selectedWalletId === wallet.id
                              ? "border-primary bg-primary/5 shadow-lg"
                              : "border-muted hover:border-primary/30 hover:bg-accent/50"
                          )}
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-colors overflow-hidden",
                            selectedWalletId === wallet.id ? "bg-primary text-white" : "bg-pink-500/10 text-pink-500 group-hover:bg-pink-500 group-hover:text-white"
                          )}>
                            {wallet.logoUrl ? (
                              <img src={wallet.logoUrl} alt={wallet.name} className="w-full h-full object-cover" />
                            ) : (
                              <WalletIcon size={24} />
                            )}
                          </div>
                          <div>
                            <p className="font-black text-sm truncate">{wallet.name}</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Cofrinho</p>
                          </div>
                          {selectedWalletId === wallet.id && (
                            <div className="absolute top-4 right-4 bg-primary text-white p-1 rounded-full">
                              <Check size={12} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {wishlistWalletsList.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 pl-1">Desejos</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {wishlistWalletsList.map(wallet => (
                        <button
                          key={wallet.id}
                          onClick={() => setSelectedWalletId(wallet.id)}
                          className={cn(
                            "p-6 rounded-2xl border-2 transition-all text-left flex flex-col gap-4 group relative overflow-hidden",
                            selectedWalletId === wallet.id
                              ? "border-primary bg-primary/5 shadow-lg"
                              : "border-muted hover:border-primary/30 hover:bg-accent/50"
                          )}
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-colors overflow-hidden",
                            selectedWalletId === wallet.id ? "bg-primary text-white" : "bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white"
                          )}>
                            {wallet.logoUrl ? (
                              <img src={wallet.logoUrl} alt={wallet.name} className="w-full h-full object-cover" />
                            ) : (
                              <WalletIcon size={24} />
                            )}
                          </div>
                          <div>
                            <p className="font-black text-sm truncate">{wallet.name}</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Desejo</p>
                          </div>
                          {selectedWalletId === wallet.id && (
                            <div className="absolute top-4 right-4 bg-primary text-white p-1 rounded-full">
                              <Check size={12} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-12 flex justify-between items-center bg-muted/30 p-6 rounded-[2rem]">
                <button
                  onClick={() => setStep('upload')}
                  className="flex items-center gap-2 font-bold text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
                >
                  <ArrowLeft size={18} />
                  Voltar
                </button>
                <button
                  disabled={!selectedWalletId}
                  onClick={() => {
                    if (selectedWallet?.type === 'credit_card') {
                      setData(prev => prev.map(row => {
                        const period = getInvoicePeriod(
                          selectedWallet.closingDay || 5,
                          selectedWallet.dueDay || 15,
                          new Date(row.date + 'T12:00:00')
                        );
                        const isIncome = row.originalSign === '+';
                        const t: TransactionType = isIncome ? 'income' : 'expense';
                        return {
                          ...row,
                          amount: Math.abs(row.amount),
                          type: t,
                          suggestedType: t,
                          invoiceMonth: period.due.getUTCMonth() + 1,
                          invoiceYear: period.due.getUTCFullYear()
                        };
                      }));
                    } else {
                      setData(prev => prev.map(row => {
                        const t: TransactionType = row.originalSign === '-' ? 'expense' : 'income';
                        return {
                          ...row,
                          type: t,
                          suggestedType: t,
                          invoiceMonth: undefined,
                          invoiceYear: undefined
                        };
                      }));
                    }
                    setStep('organize');
                  }}
                  className="bg-primary text-white px-10 py-4 rounded-xl font-black shadow-lg shadow-primary/20 hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  Continuar
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'organize' && (
          <motion.div
            key="organize"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Toolbar */}
            <div className="bg-card border rounded-[2rem] p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar lançamento..."
                    className="w-full pl-12 pr-4 py-3 bg-muted/50 border-none rounded-xl text-sm focus:ring-2 ring-primary/20 transition-all outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl border border-primary/20">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center overflow-hidden">
                    {selectedWallet?.logoUrl ? (
                      <img src={selectedWallet.logoUrl} alt={selectedWallet.name} className="w-full h-full object-cover" />
                    ) : selectedWallet?.type === 'credit_card' ? (
                      <CreditCard size={18} />
                    ) : (
                      <WalletIcon size={18} />
                    )}
                  </div>
                  <span className="text-xs font-black truncate max-w-[120px] uppercase tracking-tighter">{selectedWallet?.name}</span>
                </div>
              </div>

              {selectedWallet?.type !== 'credit_card' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApplyGlobalType('expense')}
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"
                  >
                    Tudo como Saída
                  </button>
                  <button
                    onClick={() => handleApplyGlobalType('income')}
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                  >
                    Tudo como Entrada
                  </button>
                </div>
              )}
            </div>

            {/* Main Table */}
            <div className="bg-card border rounded-[2.5rem] overflow-hidden shadow-xl shadow-black/5">
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-card/95 backdrop-blur-md border-b z-20 text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em]">
                    <tr>
                      <th className="px-6 py-5 w-[120px]">Data</th>
                      <th className="px-6 py-5">Descrição</th>
                      <th className="px-6 py-5 w-[160px]">Valor</th>
                      <th className="px-6 py-5 w-[220px]">Tipo</th>
                      <th className="px-6 py-5 w-[450px]">Categoria / Detalhes</th>
                      <th className="px-6 py-5 w-[100px] text-center">
                        {selectedWallet?.type === 'credit_card' ? 'Ações' : 'Status'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-muted/50">
                    {filteredData.map((row) => (
                      <tr
                        key={row.id}
                        className={cn(
                          "transition-all duration-300 group relative",
                          row.type === 'income' ? "bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06]" :
                            row.type === 'expense' ? "bg-rose-500/[0.03] hover:bg-rose-500/[0.06]" :
                              row.type === 'transfer' ? "bg-blue-500/[0.03] hover:bg-blue-500/[0.06]" :
                                row.type === 'provision' ? "bg-orange-500/[0.03] hover:bg-orange-500/[0.06]" :
                                  "bg-yellow-500/[0.03] hover:bg-yellow-500/[0.06]"
                        )}
                      >
                        <td className="px-6 py-6 ring-1 ring-inset ring-transparent group-hover:ring-primary/10">
                          <input
                            type="date"
                            className="bg-transparent border-none text-xs font-bold w-full outline-none p-0 focus:text-primary"
                            value={row.date}
                            onChange={(e) => {
                              const date = e.target.value;
                              let extra = {};
                              if (selectedWallet?.type === 'credit_card') {
                                const period = getInvoicePeriod(
                                  selectedWallet.closingDay || 5,
                                  selectedWallet.dueDay || 15,
                                  new Date(date + 'T12:00:00')
                                );
                                extra = { invoiceMonth: period.due.getUTCMonth() + 1, invoiceYear: period.due.getUTCFullYear() };
                              }
                              setData(prev => prev.map(r => r.id === row.id ? { ...r, date, paidDate: date, ...extra } : r));
                            }}
                          />
                        </td>
                        <td className="px-6 py-6 min-w-[300px]">
                          <textarea
                            className="bg-transparent border-none text-sm font-medium w-full outline-none p-0 focus:text-primary resize-none whitespace-normal break-words leading-tight"
                            value={row.description}
                            rows={2}
                            onChange={(e) => {
                              const description = e.target.value;
                              setData(prev => prev.map(r => r.id === row.id ? { ...r, description } : r));
                            }}
                          />
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center justify-end gap-2 relative">
                            {selectedWallet?.type !== 'credit_card' && (
                              <button
                                onClick={() => {
                                  setData(prev => prev.map(r => {
                                    if (r.id === row.id) {
                                      const newSign = r.originalSign === '+' ? '-' : '+';
                                      const t: TransactionType = newSign === '+' ? 'income' : 'expense';
                                      return { ...r, originalSign: newSign, type: t, suggestedType: t, categoryId: '' };
                                    }
                                    return r;
                                  }));
                                }}
                                className={cn(
                                  "px-2 py-1 rounded-lg text-xs font-black transition-all hover:scale-105 active:scale-95 flex-shrink-0 cursor-pointer shadow-sm border",
                                  row.type === 'income' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white" :
                                    row.type === 'expense' ? "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white" :
                                      row.type === 'transfer' ? "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500 hover:text-white" :
                                        row.type === 'provision' ? "bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500 hover:text-white" :
                                          "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500 hover:text-white"
                                )}
                                title="Inverter Sinal"
                              >
                                {row.originalSign === '+' ? '+' : '-'}
                              </button>
                            )}
                            <input
                              type="text"
                              className={cn(
                                "bg-transparent border-none text-sm font-black w-24 outline-none p-0 focus:text-primary transition-colors text-right",
                                row.type === 'income' ? "text-emerald-500" :
                                  row.type === 'expense' ? "text-rose-500" :
                                    row.type === 'transfer' ? "text-blue-500" :
                                      row.type === 'provision' ? "text-orange-500" :
                                        "text-yellow-500"
                              )}
                              value={row.amount ? `R$ ${row.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                const amount = Number(val) / 100;
                                setData(prev => prev.map(r => r.id === row.id ? { ...r, amount } : r));
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="space-y-1">
                            <CustomSelect
                              options={selectedWallet?.type === 'credit_card' ? typeOptionsForCard : typeOptionsNormal}
                              value={row.type}
                              onChange={(val) => {
                                const type = val as TransactionType;
                                setData(prev => prev.map(r => {
                                  if (r.id === row.id) {
                                    let newSign = r.originalSign;
                                    if (type === 'income') newSign = '+';
                                    if (type === 'expense' || type === 'planned') newSign = '-';
                                    return { ...r, type, originalSign: newSign, categoryId: '' };
                                  }
                                  return r;
                                }));
                              }}
                              placeholder="Tipo"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-6 space-y-2">
                          {(row.type === 'income' || row.type === 'expense') && (
                            <>
                              <CustomSelect
                                options={getCategoryOptions(row.type)}
                                value={row.categoryId}
                                onChange={(val) => setData(prev => prev.map(r => r.id === row.id ? { ...r, categoryId: val, suggestionSource: 'manual' } : r))}
                                placeholder="Selecionar Categoria"
                                error={!row.categoryId}
                                searchable={true}
                              />
                              {row.categoryId && row.suggestionSource && (
                                <div className="mt-1.5 flex items-center gap-1.5 pl-1.5">
                                  <span className={cn(
                                    "w-1.5 h-1.5 rounded-full shrink-0",
                                    row.suggestionSource === 'history' && "bg-blue-500",
                                    row.suggestionSource === 'keywords_high' && "bg-amber-500",
                                    row.suggestionSource === 'keywords_low' && "bg-rose-500",
                                    row.suggestionSource === 'fallback' && "bg-black dark:bg-white",
                                    row.suggestionSource === 'manual' && "bg-emerald-500"
                                  )} />
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-wider",
                                    row.suggestionSource === 'history' && "text-blue-500",
                                    row.suggestionSource === 'keywords_high' && "text-amber-500",
                                    row.suggestionSource === 'keywords_low' && "text-rose-500",
                                    row.suggestionSource === 'fallback' && "text-black dark:text-white",
                                    row.suggestionSource === 'manual' && "text-emerald-500"
                                  )}>
                                    {row.suggestionSource === 'history' && "Já categorizado assim antes"}
                                    {row.suggestionSource === 'keywords_high' && "Categorizado de acordo com descrição"}
                                    {row.suggestionSource === 'keywords_low' && "Apenas Categorizado"}
                                    {row.suggestionSource === 'fallback' && "Sem Sugestão (Conferir)"}
                                    {row.suggestionSource === 'manual' && "Ajustado Manualmente"}
                                  </span>
                                </div>
                              )}
                            </>
                          )}

                          {(row.type === 'transfer' || row.type === 'provision') && (
                            <CustomSelect
                              options={walletOptions}
                              value={row.toWalletId || ''}
                              onChange={(val) => setData(prev => prev.map(r => r.id === row.id ? { ...r, toWalletId: val } : r))}
                              placeholder="Selecionar Carteira"
                              error={!row.toWalletId}
                            />
                          )}

                          {selectedWallet?.type === 'credit_card' && (
                            <div className="w-full">
                              <CustomSelect
                                options={(() => {
                                  if (!row.date || !selectedWallet) return [];
                                  const period = getInvoicePeriod(selectedWallet?.closingDay || 5, selectedWallet?.dueDay || 15, new Date(row.date + 'T12:00:00'));
                                  const options = [];
                                  for (let i = 0; i <= 4; i++) {
                                    const d = new Date(Date.UTC(period.due.getUTCFullYear(), period.due.getUTCMonth() + i, 1));
                                    const m = d.getUTCMonth() + 1;
                                    const y = d.getUTCFullYear();
                                    const label = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' }).format(d).toUpperCase();
                                    options.push({ id: `${m}/${y}`, name: label });
                                  }
                                  return options;
                                })()}
                                value={`${row.invoiceMonth}/${row.invoiceYear}`}
                                onChange={(val) => {
                                  const [m, y] = val.split('/');
                                  setData(prev => prev.map(r => r.id === row.id ? { ...r, invoiceMonth: Number(m), invoiceYear: Number(y) } : r));
                                }}
                                placeholder="Fatura"
                                className="h-9"
                              />
                            </div>
                          )}

                        </td>
                        <td className="px-6 py-6 text-center align-middle h-full">
                          <div className="flex justify-center items-center gap-2">
                            {selectedWallet?.type !== 'credit_card' && (
                              <button
                                onClick={() => setData(prev => prev.map(r => r.id === row.id ? { ...r, isPaid: !r.isPaid } : r))}
                                className={cn(
                                  "w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all shadow-sm border-2 shrink-0",
                                  row.isPaid
                                    ? "bg-emerald-500 border-emerald-600 text-white shadow-emerald-500/20"
                                    : "bg-amber-500 border-amber-600 text-white shadow-amber-500/20"
                                )}
                                title={row.isPaid ? 'Pago' : 'Pendente'}
                              >
                                {row.isPaid ? <ThumbsUp size={20} fill="currentColor" /> : <ThumbsUp size={20} className="rotate-180" />}
                                <span className="text-[7px] font-black uppercase mt-0.5">{row.isPaid ? 'Conf.' : 'Pend.'}</span>
                              </button>
                            )}
                            <button
                              onClick={() => setData(prev => prev.filter(r => r.id !== row.id))}
                              className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all shadow-sm border-2 bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-600 shrink-0"
                              title="Excluir Lançamento"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-center justify-between bg-card border rounded-[2.5rem] p-8 shadow-xl shadow-black/5 mt-8">
              <button
                onClick={() => setStep('configure')}
                className="px-8 py-4 rounded-2xl font-black text-muted-foreground hover:bg-muted transition-colors flex items-center gap-2 group"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Voltar
              </button>

              <div className="flex flex-wrap items-center gap-10">
                <div className="flex gap-10">
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Lançamentos</p>
                    <p className="text-2xl font-black">{data.length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 mb-1">Total Receitas</p>
                    <p className="text-2xl font-black text-emerald-500">{formatCurrency(data.reduce((acc, row) => row.type === 'income' ? acc + row.amount : acc, 0))}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500/60 mb-1">Total Despesas</p>
                    <p className="text-2xl font-black text-rose-500">{formatCurrency(data.reduce((acc, row) => row.type === 'expense' ? acc + row.amount : acc, 0))}</p>
                  </div>
                </div>

                <div className="relative group">
                  {!isMappingComplete && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[10px] font-black px-4 py-2 rounded-xl whitespace-nowrap shadow-xl animate-bounce">
                      PREENCHA TODA A TABELA
                    </div>
                  )}
                  <button
                    onClick={handleConfirmImport}
                    disabled={!isMappingComplete}
                    className="bg-primary text-white px-16 py-5 rounded-[2rem] font-black shadow-2xl shadow-primary/30 hover:scale-[1.05] active:scale-95 disabled:opacity-20 disabled:grayscale transition-all flex items-center gap-3 relative overflow-hidden"
                  >
                    Confirmar Importação
                    <CheckCircle2 size={24} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-2xl mx-auto bg-card border rounded-[3rem] p-20 text-center space-y-10 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05),transparent)] pointer-events-none" />
            <div className="w-32 h-32 bg-emerald-500/10 rounded-[3rem] flex items-center justify-center mx-auto shadow-inner relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full animate-pulse" />
              <CheckCircle2 size={64} className="text-emerald-500 relative z-10" />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black tracking-tight">Importação Concluída!</h2>
              <p className="text-muted-foreground text-xl max-w-sm mx-auto">
                <span className="text-foreground font-black text-3xl">{data.length}</span> lançamentos foram adicionados com sucesso ao seu extrato.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <button
                onClick={() => {
                  setStep('upload');
                  setUploadType(null);
                  setData([]);
                  setSelectedWalletId('');
                }}
                className="px-10 py-5 rounded-2xl font-black border-2 border-muted hover:border-primary/50 transition-all"
              >
                Nova Importação
              </button>
              <button
                onClick={() => setActiveTab ? setActiveTab('transactions') : window.location.hash = '#transactions'}
                className="bg-primary text-white px-12 py-5 rounded-2xl font-black shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Ir para Extrato
                <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Ajustar Limites IA (Apenas para Admin gerenciando Cliente) */}
      <AnimatePresence>
        {isLimitsModalOpen && viewingProfile && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsLimitsModalOpen(false)} 
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl z-10"
            >
              <button 
                onClick={() => setIsLimitsModalOpen(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="space-y-1 mb-8">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-primary" size={20} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Ajuste de Recursos</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Limites de IA</h2>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                  Gerencie o limite de importações por IA de <span className="text-slate-900 dark:text-white font-bold">{viewingProfile.full_name}</span>.
                </p>
              </div>

              <div className="space-y-6 mb-8">
                {/* Espaço Pessoal */}
                {activeSpace === 'personal' && (
                  <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Espaço Pessoal</span>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        Uso atual: {viewingProfile.personal_imports_count || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-bold text-slate-500">Limite Mensal:</span>
                      <div className="flex items-center gap-3">
                        <button 
                          type="button"
                          onClick={() => setPersonalLimitInput(p => Math.max(0, p - 1))}
                          className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center font-bold text-lg hover:border-primary/50 transition-all select-none active:scale-95 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-black text-lg text-slate-900 dark:text-white select-none">
                          {personalLimitInput}
                        </span>
                        <button 
                          type="button"
                          onClick={() => setPersonalLimitInput(p => p + 1)}
                          className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center font-bold text-lg hover:border-primary/50 transition-all select-none active:scale-95 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Espaço Empresarial */}
                {activeSpace === 'business' && (
                  <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Espaço Empresarial</span>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        Uso atual: {viewingProfile.business_imports_count || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-bold text-slate-500">Limite Mensal:</span>
                      <div className="flex items-center gap-3">
                        <button 
                          type="button"
                          onClick={() => setBusinessLimitInput(p => Math.max(0, p - 1))}
                          className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center font-bold text-lg hover:border-primary/50 transition-all select-none active:scale-95 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-black text-lg text-slate-900 dark:text-white select-none">
                          {businessLimitInput}
                        </span>
                        <button 
                          type="button"
                          onClick={() => setBusinessLimitInput(p => p + 1)}
                          className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center font-bold text-lg hover:border-primary/50 transition-all select-none active:scale-95 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => setIsLimitsModalOpen(false)}
                  className="h-14 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={handleSaveLimits}
                  disabled={isSavingLimits}
                  className="h-14 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/25 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isSavingLimits ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
