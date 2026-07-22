import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User as UserIcon, Loader2, ArrowRight, GraduationCap, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance } from '../FinanceContext';
import { cn } from '../lib/utils';

export const Auth: React.FC = () => {
  const isSignUpEnabled = false; // Altere para true para liberar o cadastro
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'user' | 'educator'>('user');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { theme, toggleTheme } = useFinance();
  const isDark = theme === 'dark';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role
            }
          }
        });
        if (signUpError) throw signUpError;
        setSuccess(true);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-4 font-sans transition-colors duration-300", isDark ? "bg-[#0b0f19]" : "bg-[#f8fafc]")}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "w-full max-w-md p-10 rounded-[2.5rem] border text-center shadow-2xl backdrop-blur-xl transition-all",
            isDark 
              ? "bg-slate-900/40 border-white/5 shadow-none" 
              : "bg-white border-slate-200 shadow-slate-200/50"
          )}
        >
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500 border border-emerald-500/30">
            <Mail size={32} />
          </div>
          <h2 className={cn("text-2xl font-black uppercase tracking-tight mb-4", isDark ? "text-white" : "text-slate-900")}>Confirme seu E-mail</h2>
          <p className={cn("text-sm leading-relaxed mb-8", isDark ? "text-slate-400" : "text-slate-500")}>
            Enviamos um link de confirmação para <strong>{email}</strong>. Por favor, verifique sua caixa de entrada para ativar sua conta.
          </p>
          <button 
            onClick={() => { setSuccess(false); setIsSignUp(false); }}
            className={cn(
              "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all border cursor-pointer",
              isDark 
                ? "bg-slate-800 text-white border-slate-700/50 hover:bg-slate-750" 
                : "bg-slate-100 text-slate-900 border-slate-200 hover:bg-slate-200"
            )}
          >
            Voltar para Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans transition-colors duration-300", isDark ? "bg-[#0b0f19]" : "bg-[#f8fafc]")}>
      
      {/* Botão de alternar tema */}
      <button 
        onClick={toggleTheme}
        className={cn(
          "absolute top-6 right-6 w-12 h-12 rounded-2xl border flex items-center justify-center transition-all shadow-sm cursor-pointer z-50",
          isDark 
            ? "bg-slate-900 border-white/5 text-amber-400 hover:bg-slate-800" 
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
        )}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Background Orbs */}
      <div className={cn("absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none transition-all", isDark ? "bg-blue-600/25" : "bg-blue-500/10")} />
      <div className={cn("absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none transition-all", isDark ? "bg-purple-600/25" : "bg-purple-500/10")} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className={cn(
              "inline-flex items-center justify-center w-24 h-24 mb-8 rounded-full transition-all",
              isDark ? "shadow-[0_0_50px_-12px_rgba(217,119,6,0.5)]" : "shadow-[0_0_50px_-12px_rgba(217,119,6,0.3)]"
            )}
          >
            <img 
              src="/images/logo.png" 
              alt="Solum Financeiro" 
              className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(217,119,6,0.3)]" 
            />
          </motion.div>
          <h1 className={cn("text-4xl font-black uppercase tracking-tighter mb-3", isDark ? "text-white" : "text-slate-900")}>Solum Financeiro</h1>
          <p className={cn("text-sm font-medium tracking-wide", isDark ? "text-slate-400" : "text-slate-500")}>Excelência em gestão para suas finanças</p>
        </div>

        <div className={cn(
          "backdrop-blur-2xl p-10 rounded-[3rem] border shadow-2xl transition-all",
          isDark 
            ? "bg-slate-900/40 border-white/5 shadow-none" 
            : "bg-white border-slate-200 shadow-slate-200/50"
        )}>
          <div className={cn(
            "flex mb-10 p-1.5 rounded-2xl border transition-all",
            isDark ? "bg-slate-950/50 border-white/5" : "bg-slate-100 border-slate-200"
          )}>
            <button 
              onClick={() => setIsSignUp(false)}
              className={cn(
                "flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                !isSignUp 
                  ? 'bg-primary text-white shadow-xl shadow-primary/20' 
                  : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-650'
              )}
            >
              Entrar
            </button>
            <button 
              onClick={() => setIsSignUp(true)}
              className={cn(
                "flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                isSignUp 
                  ? 'bg-primary text-white shadow-xl shadow-primary/20' 
                  : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-650'
              )}
            >
              Criar Conta
            </button>
          </div>

          {isSignUp && !isSignUpEnabled ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 text-center py-4"
            >
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-2 text-amber-500 border border-amber-500/20">
                <Lock size={24} />
              </div>
              <div className="space-y-2">
                <h3 className={cn("text-lg font-black uppercase tracking-tighter", isDark ? "text-white" : "text-slate-900")}>
                  Cadastro Indisponível
                </h3>
                <p className={cn("text-xs font-semibold leading-relaxed uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                  A criação de novas contas está temporariamente desativada. Por favor, tente novamente mais tarde.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className={cn(
                  "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all border cursor-pointer",
                  isDark 
                    ? "bg-slate-800 text-white border-slate-700/50 hover:bg-slate-700" 
                    : "bg-slate-100 text-slate-950 border-slate-200 hover:bg-slate-200"
                )}
              >
                Voltar para Login
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-6">
              <AnimatePresence mode="wait">
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6 overflow-hidden"
                  >
                    <div className="space-y-2">
                      <label className={cn("text-[10px] font-black uppercase tracking-widest ml-1", isDark ? "text-slate-500" : "text-slate-400")}>Nome Completo</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                          <UserIcon size={18} />
                        </div>
                        <input 
                          type="text" 
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Seu nome aqui"
                          className={cn(
                            "w-full border rounded-2xl h-14 pl-12 pr-5 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all",
                            isDark 
                              ? "bg-slate-950 border-white/5 text-white placeholder:text-slate-700" 
                              : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                          )}
                          required={isSignUp}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className={cn("text-[10px] font-black uppercase tracking-widest ml-1", isDark ? "text-slate-500" : "text-slate-400")}>Tipo de Perfil</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setRole('user')}
                          className={cn(
                            "p-4 rounded-2xl border transition-all text-left group cursor-pointer",
                            role === 'user' 
                              ? 'bg-primary/10 border-primary text-primary font-semibold shadow-lg shadow-primary/5' 
                              : isDark 
                                ? 'bg-slate-950/50 border-white/5 text-slate-500 hover:border-white/10' 
                                : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-350'
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl mb-3 flex items-center justify-center transition-colors",
                            role === 'user' 
                              ? 'bg-primary text-white' 
                              : isDark ? 'bg-slate-900 text-slate-600' : 'bg-slate-200 text-slate-400'
                          )}>
                            <UserIcon size={20} />
                          </div>
                          <p className={cn("text-[11px] font-black uppercase tracking-wider", role === 'user' ? "text-primary" : isDark ? "text-slate-300" : "text-slate-700")}>Apenas Uso</p>
                          <p className="text-[9px] font-medium text-slate-500 mt-1">Gestão pessoal</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRole('educator')}
                          className={cn(
                            "p-4 rounded-2xl border transition-all text-left group cursor-pointer",
                            role === 'educator' 
                              ? 'bg-emerald-500/10 border-emerald-505 text-emerald-500 font-semibold shadow-lg shadow-emerald-500/5' 
                              : isDark 
                                ? 'bg-slate-950/50 border-white/5 text-slate-500 hover:border-white/10' 
                                : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-350'
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl mb-3 flex items-center justify-center transition-colors",
                            role === 'educator' 
                              ? 'bg-emerald-505 text-white font-semibold' 
                              : isDark ? 'bg-slate-905 text-slate-605' : 'bg-slate-205 text-slate-405'
                          )}>
                            <GraduationCap size={20} />
                          </div>
                          <p className={cn("text-[11px] font-black uppercase tracking-wider", role === 'educator' ? "text-emerald-505" : isDark ? "text-slate-305" : "text-slate-705")}>Educador</p>
                          <p className="text-[9px] font-medium text-slate-505 mt-1">Gestão de clientes</p>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className={cn("text-[10px] font-black uppercase tracking-widest ml-1", isDark ? "text-slate-500" : "text-slate-400")}>Seu E-mail</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                      <Mail size={18} />
                    </div>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemplo@email.com"
                      className={cn(
                        "w-full border rounded-2xl h-14 pl-12 pr-5 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all",
                        isDark 
                          ? "bg-slate-950 border-white/5 text-white placeholder:text-slate-700" 
                          : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                      )}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={cn("text-[10px] font-black uppercase tracking-widest ml-1", isDark ? "text-slate-500" : "text-slate-400")}>Sua Senha</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                      <Lock size={18} />
                    </div>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={cn(
                        "w-full border rounded-2xl h-14 pl-12 pr-5 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all",
                        isDark 
                          ? "bg-slate-950 border-white/5 text-white placeholder:text-slate-700" 
                          : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                      )}
                      required
                    />
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-xs text-rose-500 text-center font-bold"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit" 
                disabled={loading}
                className={cn(
                  "w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl transition-all disabled:opacity-50 disabled:pointer-events-none hover:scale-[1.02] active:scale-[0.98] cursor-pointer",
                  isSignUp && role === 'educator' 
                    ? 'bg-emerald-500 shadow-emerald-500/30 hover:bg-emerald-600' 
                    : 'bg-primary shadow-primary/30 hover:bg-orange-600'
                )}
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    {isSignUp ? 'Finalizar Cadastro' : 'Acessar Plataforma'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          <p className={cn("mt-8 text-center text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed", isDark ? "text-slate-650" : "text-slate-405")}>
            Ao continuar, você concorda com nossos <br />
            <span className="text-primary hover:underline cursor-pointer transition-all">Termos de Uso</span> e <span className="text-primary hover:underline cursor-pointer transition-all">Privacidade</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
