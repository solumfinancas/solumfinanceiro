import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Trash2, 
  ShieldCheck, 
  X, 
  Check, 
  Info,
  Loader2,
  Archive
} from 'lucide-react';

interface ClientProfile {
  id: string;
  full_name?: string;
  email?: string;
  archived_at?: string;
  link_status?: string;
  data_reset_status?: 'reset' | 'kept' | null;
}

interface ArchivedClientResetModalProps {
  isOpen: boolean;
  client: ClientProfile | null;
  onConfirmReset: (client: ClientProfile) => Promise<void>;
  onConfirmKeep: (client: ClientProfile) => Promise<void>;
  onClose: () => void; // Disparado ao clicar no X (ignorar nesta sessão)
}

export const ArchivedClientResetModal: React.FC<ArchivedClientResetModalProps> = ({
  isOpen,
  client,
  onConfirmReset,
  onConfirmKeep,
  onClose
}) => {
  const [loadingAction, setLoadingAction] = useState<'reset' | 'keep' | null>(null);

  if (!isOpen || !client) return null;

  const calculateArchivedDays = () => {
    if (!client.archived_at) return 30;
    const diffTime = Math.abs(new Date().getTime() - new Date(client.archived_at).getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysArchived = calculateArchivedDays();

  const handleReset = async () => {
    setLoadingAction('reset');
    try {
      await onConfirmReset(client);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleKeep = async () => {
    setLoadingAction('keep');
    try {
      await onConfirmKeep(client);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-2xl"
          onClick={onClose}
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-card border border-border/80 shadow-2xl rounded-[2.5rem] overflow-hidden z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="h-2 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500" />

          {/* Botão Fechar (X) */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-muted/60 hover:bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all z-20"
            title="Fechar (Lembrar no próximo login)"
          >
            <X size={18} />
          </button>

          <div className="p-8 md:p-10 space-y-6">
            {/* Ícone e Título */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full animate-pulse" />
                <div className="relative w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex items-center justify-center text-amber-500 shadow-inner">
                  <Archive size={38} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest mb-2">
                  <AlertTriangle size={12} />
                  Arquivado há {daysArchived} dias
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                  Reset de Dados do Cliente
                </h2>
                <p className="text-sm font-medium text-muted-foreground max-w-md">
                  O cliente <span className="font-bold text-foreground">{client.full_name}</span> está arquivado há mais de 30 dias. Deseja realizar a limpeza dos dados financeiros?
                </p>
              </div>
            </div>

            {/* Painel do que será apagado vs mantido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* O que será EXCLUÍDO */}
              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                <div className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-wider">
                  <Trash2 size={14} /> Serão Excluídos:
                </div>
                <ul className="space-y-1.5 text-[11px] font-semibold text-muted-foreground">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Carteiras e Cartões
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Categorias & Lançamentos
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Dívidas e Histórico
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Patrimônio & Gastos Eventuais
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Objetivos, Reuniões e Tarefas
                  </li>
                </ul>
              </div>

              {/* O que será MANTIDO */}
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-wider">
                  <ShieldCheck size={14} /> Serão Mantidos (Exceção):
                </div>
                <ul className="space-y-1.5 text-[11px] font-semibold text-muted-foreground">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Informações Básicas do Perfil
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Serviços Contratados
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Anamnese Completa
                  </li>
                </ul>
              </div>
            </div>

            {/* Aviso sobre botão X */}
            <div className="p-3 bg-muted/40 border border-border/60 rounded-xl flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
              <Info size={14} className="text-primary shrink-0" />
              <span>Sua escolha será salva permanentemente. Se fechar no <strong>X</strong>, você será perguntado novamente no próximo login.</span>
            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleKeep}
                disabled={loadingAction !== null}
                className="flex-1 h-13 py-3 px-5 rounded-2xl border border-border bg-muted/50 hover:bg-muted text-foreground text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              >
                {loadingAction === 'keep' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Check size={16} className="text-amber-500" />
                    Não, Manter Dados
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                disabled={loadingAction !== null}
                className="flex-1 h-13 py-3 px-5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 shadow-lg shadow-rose-600/20 disabled:opacity-50"
              >
                {loadingAction === 'reset' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Trash2 size={16} />
                    Sim, Resetar Dados
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
