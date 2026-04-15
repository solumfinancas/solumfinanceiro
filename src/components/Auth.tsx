import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User as UserIcon, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
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
      <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card w-full max-w-md p-10 rounded-[2.5rem] border border-border/50 text-center shadow-2xl backdrop-blur-xl bg-slate-900/40"
        >
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500 border border-emerald-500/30">
            <Mail size={32} />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Confirme seu E-mail</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Enviamos um link de confirmação para <strong>{email}</strong>. Por favor, verifique sua caixa de entrada para ativar sua conta.
          </p>
          <button 
            onClick={() => { setSuccess(false); setIsSignUp(false); }}
            className="w-full h-14 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-700 transition-all border border-slate-700/50"
          >
            Voltar para Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-2xl shadow-primary/30 mb-8"
          >
            <ArrowRight className="text-white transform group-hover:translate-x-1 transition-transform" size={32} strokeWidth={3} />
          </motion.div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-3">Solum Financeiro</h1>
          <p className="text-slate-400 text-sm font-medium tracking-wide">Excelência em gestão para suas finanças</p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/5 shadow-2xl">
          <div className="flex mb-10 bg-slate-950/50 p-1.5 rounded-2xl border border-white/5">
            <button 
              onClick={() => setIsSignUp(false)}
              className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isSignUp ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => setIsSignUp(true)}
              className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isSignUp ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Seu E-mail</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-600 group-focus-within:text-primary transition-colors">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl h-14 pl-12 pr-5 text-sm text-white placeholder:text-slate-700 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sua Senha</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-600 group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl h-14 pl-12 pr-5 text-sm text-white placeholder:text-slate-700 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all"
                  required
                />
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
              className="w-full bg-primary h-14 rounded-2xl flex items-center justify-center gap-3 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
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

          <p className="mt-8 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 leading-relaxed">
            Ao continuar, você concorda com nossos <br />
            <span className="text-slate-400 hover:text-primary cursor-pointer transition-colors">Termos de Uso</span> e <span className="text-slate-400 hover:text-primary cursor-pointer transition-colors">Privacidade</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
