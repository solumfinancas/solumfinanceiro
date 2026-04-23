import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Check, X, ShieldAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useModal } from '../contexts/ModalContext';
import { cn } from '../lib/utils';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

import { useAuth } from '../contexts/AuthContext';

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, userEmail }) => {
  const { showAlert } = useModal();
  const { viewingUserId } = useAuth();
  const isImpersonating = !!viewingUserId;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!isImpersonating && !currentPassword) || !newPassword || !confirmPassword) {
      showAlert('Campos Vazios', 'Por favor, preencha todos os campos.', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('Senhas Diferentes', 'A nova senha e a confirmação não coincidem.', 'warning');
      return;
    }

    if (newPassword.length < 6) {
      showAlert('Senha Fraca', 'A nova senha deve ter pelo menos 6 caracteres.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      if (!isImpersonating) {
        // 1. Validar senha atual tentando fazer login novamente (Apenas se não estiver gerenciando alguém)
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: currentPassword,
        });

        if (authError) {
          throw new Error('A senha atual está incorreta.');
        }

        // 2. Atualizar para a nova senha
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (updateError) throw updateError;
      } else {
        // MODO GESTÃO: Usar Edge Function para redefinir senha sem confirmar a atual
        const { data, error: functionError } = await supabase.functions.invoke('admin-create-user', {
          body: {
            action: 'update',
            userId: viewingUserId,
            password: newPassword,
            userData: {
              last_password_reset: new Date().toISOString()
            }
          }
        });

        if (functionError || data?.error) {
          throw new Error(functionError?.message || data?.error || 'Erro ao redefinir senha do cliente');
        }
      }

      showAlert('Sucesso', isImpersonating ? 'Senha do cliente redefinida com sucesso!' : 'Sua senha foi atualizada com sucesso!', 'success');
      onClose();
      // Resetar campos
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showAlert('Erro na Atualização', err.message, 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-card border border-border/50 rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                <Lock className="text-amber-500" size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">Alterar Senha</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Segurança da conta</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {/* Senha Atual */}
            {!isImpersonating && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Senha Atual</label>
                  <div className="relative">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={16} />
                    <input 
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-14 pr-12 py-4 bg-muted/30 border border-border/50 rounded-[1.5rem] text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono"
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-primary transition-colors"
                    >
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="h-px bg-border/50 my-2" />
              </>
            )}

            {/* Nova Senha */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Nova Senha</label>
              <div className="relative">
                <ShieldAlert className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={16} />
                <input 
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-14 pr-12 py-4 bg-muted/30 border border-border/50 rounded-[1.5rem] text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono"
                  placeholder="mínimo 6 caracteres"
                />
                <button 
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-primary transition-colors"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirmar Nova Senha */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Confirmar Nova Senha</label>
              <div className="relative">
                <Check className={cn(
                  "absolute left-6 top-1/2 -translate-y-1/2 transition-colors",
                  confirmPassword && newPassword === confirmPassword ? "text-emerald-500" : "text-muted-foreground/40"
                )} size={16} />
                <input 
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-14 pr-12 py-4 bg-muted/30 border border-border/50 rounded-[1.5rem] text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono"
                  placeholder="repetir a nova senha"
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-primary transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-5 bg-primary text-white rounded-[1.8rem] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Atualizando...' : 'Confirmar Alteração'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
