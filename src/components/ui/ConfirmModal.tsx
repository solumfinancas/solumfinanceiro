import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Portal } from './Portal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'info' | 'success' | 'warning';
  hideCancel?: boolean;
  disabled?: boolean;
  validationKeyword?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  hideCancel = false,
  disabled = false,
  validationKeyword
}) => {
  const [validationInput, setValidationInput] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) {
      setValidationInput('');
    } else {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const config = {
    danger: {
      bg: 'bg-rose-500',
      text: 'text-rose-500',
      border: 'border-rose-500/20',
      glow: 'shadow-rose-500/20',
      hover: 'hover:bg-rose-600',
      icon: AlertCircle
    },
    warning: {
      bg: 'bg-amber-500',
      text: 'text-amber-500',
      border: 'border-amber-500/20',
      glow: 'shadow-amber-500/20',
      hover: 'hover:bg-amber-600',
      icon: AlertTriangle
    },
    info: {
      bg: 'bg-blue-500',
      text: 'text-blue-500',
      border: 'border-blue-500/20',
      glow: 'shadow-blue-500/20',
      hover: 'hover:bg-blue-600',
      icon: Info
    },
    success: {
      bg: 'bg-emerald-500',
      text: 'text-emerald-500',
      border: 'border-emerald-500/20',
      glow: 'shadow-emerald-500/20',
      hover: 'hover:bg-emerald-600',
      icon: CheckCircle2
    }
  }[variant];

  const Icon = config.icon;
  const isConfirmDisabled = disabled || (validationKeyword ? validationInput.trim().toUpperCase() !== validationKeyword.toUpperCase() : false);

  return (
    <Portal>
      <AnimatePresence>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 backdrop-premium"
          />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          {/* Header Visual */}
          <div className={cn("h-2 w-full", config.bg)} />
          
          <div className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg",
                config.border,
                config.glow
              )}>
                <Icon className={cn("w-6 h-6", config.text)} />
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="text-xl font-black uppercase tracking-tight text-foreground leading-tight">
                  {title}
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                  {variant === 'success' ? 'Operação Concluída' : 'Ação Necessária'}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-muted/30 p-6 rounded-3xl border border-border/50 mb-8">
              <div className="text-muted-foreground leading-relaxed text-sm font-medium">
                {message}
              </div>
            </div>

            {validationKeyword && (
              <div className="mt-2 mb-6 bg-muted/20 p-5 rounded-3xl border border-border/40 space-y-2.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-relaxed">
                  Para confirmar a exclusão, digite <span className="text-rose-500 font-extrabold underline">{validationKeyword}</span> abaixo:
                </p>
                <input
                  type="text"
                  value={validationInput}
                  onChange={(e) => setValidationInput(e.target.value)}
                  placeholder={`Digite ${validationKeyword}`}
                  className={cn(
                    "w-full h-11 bg-card border border-border rounded-xl px-4 text-xs font-bold uppercase tracking-wider text-foreground outline-none transition-all placeholder:text-muted-foreground/45 placeholder:normal-case text-center",
                    {
                      danger: 'focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20',
                      warning: 'focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20',
                      info: 'focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20',
                      success: 'focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20'
                    }[variant]
                  )}
                />
              </div>
            )}

            <div className="flex gap-4">
              {!hideCancel && (
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-4 rounded-2xl border-2 border-border font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                >
                  {cancelText}
                </button>
              )}
              <button
                disabled={isConfirmDisabled}
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={cn(
                  "px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white transition-all shadow-xl active:scale-95",
                  config.bg,
                  config.hover,
                  hideCancel ? "w-full" : "flex-[1.5]",
                  `shadow-${variant === 'danger' ? 'rose' : variant === 'info' ? 'blue' : variant === 'warning' ? 'amber' : 'emerald'}-500/30`,
                  isConfirmDisabled && "opacity-50 cursor-not-allowed grayscale pointer-events-none"
                )}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
    </Portal>
  );
};
