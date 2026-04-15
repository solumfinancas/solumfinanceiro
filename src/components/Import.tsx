import React, { useState, useMemo, useRef } from 'react';
import { useFinance } from '../FinanceContext';
import { useModal } from '../contexts/ModalContext';
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
  Trash2
} from 'lucide-react';
import { cn, formatCurrency, formatDate, getInvoicePeriod } from '../lib/utils';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { TransactionType } from '../types';
import { CustomSelect, SelectOption } from './ui/CustomSelect';

interface ImportRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  toWalletId?: string;
  invoiceMonth?: number;
  invoiceYear?: number;
  isPaid: boolean;
  paidDate: string;
  suggestedType: TransactionType;
  originalSign: '-' | '+';
}

interface ImportProps {
  setActiveTab?: (tab: string) => void;
}

export const Import: React.FC<ImportProps> = ({ setActiveTab }) => {
  const { categories, wallets, addTransactions } = useFinance();
  const { showAlert } = useModal();
  const [step, setStep] = useState<'upload' | 'configure' | 'organize' | 'success'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [data, setData] = useState<ImportRow[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedWallet = useMemo(() => 
    wallets.find(w => w.id === selectedWalletId)
  , [wallets, selectedWalletId]);

  const processFile = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (event) => {
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

        const rows: ImportRow[] = jsonData.slice(1)
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

        setData(rows);
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
        isPaid: row.isPaid,
        paidDate: row.isPaid ? row.paidDate : undefined
      };
    });

    try {
      await addTransactions(finalTxs);
      setStep('success');
    } catch (err) {
      console.error("Erro ao salvar importação:", err);
    }
  };

  const filteredData = data.filter(row => 
    row.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const walletOptions = useMemo(() => 
    wallets
      .filter(w => w.isActive && w.id !== selectedWalletId)
      .sort((a, b) => (a.type === b.type ? 0 : a.type === 'credit_card' ? -1 : 1))
      .map(w => ({
        id: w.id,
        name: w.type === 'credit_card' ? `(CARTÃO) ${w.name}` : w.name,
        logoUrl: w.logoUrl,
        type: w.type
      }))
  , [wallets, selectedWalletId]);

  const typeOptionsForCard = [
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

  return (
    <div className="max-w-[1500px] mx-auto space-y-6 pb-20 px-4 transition-all duration-500">
      <div className="text-center space-y-2 mb-10">
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          Importação Inteligente
        </h1>
        <p className="text-muted-foreground text-lg">
          Transforme sua planilha em lançamentos organizados em segundos.
        </p>
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
        {step === 'upload' && (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
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

            <div className="bg-card border rounded-[2.5rem] p-12 space-y-8 flex flex-col justify-center">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <CheckCircle2 className="text-blue-500" size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Layout Esperado</h4>
                  <p className="text-muted-foreground text-sm">Organize as colunas da sua planilha como: <br/><span className="font-mono bg-muted px-1 rounded text-foreground">Data | Descrição | Valor</span></p>
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
                {wallets.filter(w => w.isActive && w.type === 'credit_card').length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 pl-1">Cartões de Crédito</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {wallets.filter(w => w.isActive && w.type === 'credit_card').map(wallet => (
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
                            selectedWalletId === wallet.id ? "bg-primary text-white" : "bg-muted group-hover:bg-primary/20 text-muted-foreground group-hover:text-primary"
                          )}>
                            {wallet.logoUrl ? (
                              <img src={wallet.logoUrl} alt={wallet.name} className="w-full h-full object-cover" />
                            ) : (
                              <CreditCard size={24} />
                            )}
                          </div>
                          <div>
                            <p className="font-black text-sm truncate">(CARTÃO) {wallet.name}</p>
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

                {wallets.filter(w => w.isActive && w.type !== 'credit_card').length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 pl-1">Carteiras e Bancos</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {wallets.filter(w => w.isActive && w.type !== 'credit_card').map(wallet => (
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
                            selectedWalletId === wallet.id ? "bg-primary text-white" : "bg-muted group-hover:bg-primary/20 text-muted-foreground group-hover:text-primary",
                            wallet.icon === 'bank' ? 'bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white' : 
                            wallet.icon === 'piggy' ? 'bg-pink-500/10 text-pink-500 group-hover:bg-pink-500 group-hover:text-white' : ''
                          )}>
                            {wallet.logoUrl ? (
                              <img src={wallet.logoUrl} alt={wallet.name} className="w-full h-full object-cover" />
                            ) : (
                              <WalletIcon size={24} />
                            )}
                          </div>
                          <div>
                            <p className="font-black text-sm truncate">{wallet.name}</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Carteira</p>
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
                        return {
                          ...row,
                          amount: Math.abs(row.amount),
                          type: 'expense',
                          suggestedType: 'planned',
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
                      <th className="px-6 py-5 w-[100px] text-center">Status</th>
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
                              <CustomSelect 
                                options={getCategoryOptions(row.type)}
                                value={row.categoryId}
                                onChange={(val) => setData(prev => prev.map(r => r.id === row.id ? { ...r, categoryId: val } : r))}
                                placeholder="Selecionar Categoria"
                                error={!row.categoryId}
                                searchable={true}
                              />
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
    </div>
  );
};
