import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

export type UserRole = 'master_admin' | 'admin' | 'secretary' | 'educator' | 'user';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  user_metadata?: any;
  plan?: string | null;
  plan_expires_at?: string | null;
  can_activate_second_space?: boolean;
  monthly_imports_count?: number;
  last_import_reset?: string;
  personal_imports_count?: number;
  business_imports_count?: number;
  personal_imports_limit?: number;
  business_imports_limit?: number;
}

export const isEducatorProfileExpired = (prof: Profile | null | undefined): boolean => {
  if (!prof) return false;
  if (prof.role === 'admin' || prof.role === 'master_admin') return false;
  if (prof.role !== 'educator') return false;

  if (prof.plan === 'trial') {
    const expiry = prof.plan_expires_at 
      ? new Date(prof.plan_expires_at) 
      : (() => {
          const created = new Date(prof.created_at || new Date());
          const exp = new Date(created);
          exp.setDate(created.getDate() + 30);
          return exp;
        })();
    return expiry < new Date();
  }

  if (!prof.plan_expires_at) return true;

  const expiryDate = new Date(prof.plan_expires_at);
  return expiryDate < new Date();
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  viewingUserId: string | null;
  viewingProfile: Profile | null;
  isEducatorPlanExpired: boolean;
  isClientLinkSuspended: boolean;
  impersonateUser: (id: string | null) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Tempo de inatividade em milissegundos (30 minutos)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null);
  const [isEducatorPlanExpired, setIsEducatorPlanExpired] = useState<boolean>(false);
  const [isClientLinkSuspended, setIsClientLinkSuspended] = useState<boolean>(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProfile = useCallback(async (uid: string, includeMetadata = false) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();
      
      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return null;
      }

      let profileResult = { ...profileData } as Profile;
      
      // Reset de importações se o mês mudou
      const now = new Date();
      const lastReset = profileResult.last_import_reset ? new Date(profileResult.last_import_reset) : new Date(0);
      
      if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
         const { error: resetError } = await supabase.from('profiles')
           .update({ 
             monthly_imports_count: 0, 
             personal_imports_count: 0,
             business_imports_count: 0,
             last_import_reset: now.toISOString() 
           })
           .eq('id', uid);
           
         if (!resetError) {
           profileResult.monthly_imports_count = 0;
           profileResult.personal_imports_count = 0;
           profileResult.business_imports_count = 0;
           profileResult.last_import_reset = now.toISOString();
         }
      }

      // Se solicitado, buscar metadados extras via Edge Function (Admin only)
      if (includeMetadata) {
        try {
          const { data: metaData } = await supabase.functions.invoke('admin-create-user', {
            body: { action: 'get', userId: uid }
          });
          if (metaData?.user?.user_metadata) {
            profileResult.user_metadata = metaData.user.user_metadata;
            // Garantir email atualizado do Auth
            if (metaData.user.email) profileResult.email = metaData.user.email;
          }
        } catch (mErr) {
          console.warn('Não foi possível carregar metadados administrativos:', mErr);
        }

        // SONDAGEM DE SEGURANÇA: Se o metadado veio vazio ou falhou (ex: Educador), tenta sondar dados reais
        // Isso permite que educadores e administradores vejam se um espaço está ativo verificando
        // se já existem categorias ou carteiras criadas no nome do cliente.
        if (!profileResult.user_metadata || !profileResult.user_metadata.initialized_spaces) {
           try {
             // Políticas de RLS 'can_access_finances' permitem que o gestor veja estas tabelas
             const [{ data: cats }, { data: wals }] = await Promise.all([
               supabase.from('categories').select('space').eq('userId', uid),
               supabase.from('wallets').select('space').eq('userId', uid)
             ]);
             
             const initializedSpaces = Array.from(new Set([
               ...(cats?.map(c => c.space) || []),
               ...(wals?.map(w => w.space) || [])
             ]));

             // Se não houver nada, assume ao menos o 'personal' se for um usuário antigo ou padrão
              profileResult.user_metadata = {
                ...profileResult.user_metadata || {},
                initialized_spaces: initializedSpaces
              };
           } catch (probErr) {
             console.warn('Sondagem automática de espaços falhou:', probErr);
           }
        }
      }

      return profileResult;
    } catch (err) {
      console.error('Erro inesperado ao buscar perfil:', err);
      return null;
    }
  }, []);

  const checkEducatorStatus = useCallback(async (clientProfile: Profile | null) => {
    if (!clientProfile || clientProfile.role !== 'user') {
      setIsEducatorPlanExpired(false);
      setIsClientLinkSuspended(false);
      return;
    }

    try {
      // 1. Busca o vínculo do cliente em educator_clients (sem restringir a active para detectar suspensão)
      const { data: linkData, error: linkError } = await supabase
        .from('educator_clients')
        .select('educator_id, status')
        .eq('client_id', clientProfile.id)
        .maybeSingle();

      if (linkError) {
        console.error('Erro ao buscar vínculo de educador:', linkError);
        setIsEducatorPlanExpired(false);
        setIsClientLinkSuspended(false);
        return;
      }

      if (!linkData) {
        setIsEducatorPlanExpired(false);
        setIsClientLinkSuspended(false);
        return;
      }

      // 2. Se o status do vínculo não for 'active' (ou seja, for 'inactive' ou 'archived')
      if (linkData.status !== 'active') {
        setIsClientLinkSuspended(true);
        setIsEducatorPlanExpired(false);
        return;
      }

      setIsClientLinkSuspended(false);

      if (!linkData.educator_id) {
        setIsEducatorPlanExpired(false);
        return;
      }

      // 3. Consulta a tabela profiles do educador associado
      const { data: educatorProfile, error: educatorError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', linkData.educator_id)
        .single();

      if (educatorError) {
        console.error('Erro ao buscar perfil do educador:', educatorError);
        setIsEducatorPlanExpired(false);
        return;
      }

      if (!educatorProfile) {
        setIsEducatorPlanExpired(false);
        return;
      }

      const expired = isEducatorProfileExpired(educatorProfile);
      const suspended = educatorProfile.user_metadata?.is_suspended === true;
      setIsEducatorPlanExpired(expired || suspended);
    } catch (err) {
      console.error('Erro ao verificar status do educador:', err);
      setIsEducatorPlanExpired(false);
      setIsClientLinkSuspended(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    // Forçar atualização da sessão para garantir que os metadados mais recentes sejam baixados
    // Isso é crucial após mudanças feitas via Edge Functions (como reset de espaço) que modificam o Auth
    await supabase.auth.refreshSession();

    // 1. Atualizar o objeto de usuário do Supabase Auth
    const { data: { user: updatedUser }, error: userError } = await supabase.auth.getUser();
    if (!userError && updatedUser) {
      setUser(updatedUser);
    }

    // 2. Atualizar o perfil da tabela 'profiles'
    const targetId = updatedUser?.id || user?.id;
    if (targetId) {
       const p = await fetchProfile(targetId);
       setProfile(p);
       if (p) {
         await checkEducatorStatus(p);
       }
    }
    
    // 3. Se estiver gerenciando alguém, recarrega o viewingProfile
    if (viewingUserId) {
       const vp = await fetchProfile(viewingUserId, true);
       setViewingProfile(vp);
    }
  }, [user, viewingUserId, fetchProfile, checkEducatorStatus]);




  const signOut = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    try {
      // Tenta o logout padrão (pode travar se houver erro de Lock)
      const logoutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject('timeout'), 2000));
      
      await Promise.race([logoutPromise, timeoutPromise]);
    } catch (err) {
      console.warn('SignOut padrão falhou ou demorou demais, forçando limpeza local...');
    } finally {
      // LIMPEZA FORÇADA: Garante que o usuário deslogue mesmo se o Supabase travar
      localStorage.clear();
      sessionStorage.clear();
      
      // Limpar todos os cookies (opcional mas recomendado)
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      setUser(null);
      setSession(null);
      setProfile(null);
      setViewingUserId(null);
      setViewingProfile(null);
      
      // Redirecionamento forçado para limpar estados residuais
      window.location.href = '/';
    }
  }, []);

  // Timer de Inatividade

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (user) {
      timerRef.current = setTimeout(() => {
        console.log('Sessão encerrada por inatividade');
        signOut();
      }, INACTIVITY_TIMEOUT);
    }
  }, [user, signOut]);

  useEffect(() => {
    if (user) {
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      events.forEach(event => document.addEventListener(event, resetTimer));
      resetTimer();

      return () => {
        events.forEach(event => document.removeEventListener(event, resetTimer));
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [user, resetTimer]);

  // Sincronização de Perfil (Fora do listener de Auth para evitar deadlocks)
  useEffect(() => {
    let mounted = true;
    if (user?.id) {
       // Atualizar último acesso no Supabase Auth uma vez por sessão de navegador
       const lastAccessKey = `last_access_updated_${user.id}`;
       if (!sessionStorage.getItem(lastAccessKey)) {
         sessionStorage.setItem(lastAccessKey, 'true');
         supabase.auth.updateUser({
           data: { last_access: new Date().toISOString() }
         }).then(({ data, error }) => {
           if (error) {
             console.error('Erro ao atualizar último acesso:', error);
           } else if (mounted && data?.user) {
             setUser(data.user);
           }
         });
       }

        fetchProfile(user.id).then(async (p) => {
          if (mounted) {
            setProfile(p);
            if (p) {
              await checkEducatorStatus(p);
            }
            // Se o perfil carregou (ou falhou mas retornou), encerramos o loading global
            setLoading(false);
          }
        });
    } else {
       setProfile(null);
       // Se não há usuário, o loading é encerrado pelo listener de Auth
    }
    return () => { mounted = false; };
  }, [user, fetchProfile, checkEducatorStatus]);

  useEffect(() => {
    let mounted = true;
    const initialized = { current: false };

    // Timeout de segurança: Se o Supabase não responder em 4 segundos, libera a tela
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth: Sincronização demorou demais, forçando liberação.');
        setLoading(false);
      }
    }, 4000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      // Evitar processamento duplo do evento inicial
      if (initialized.current && event === 'INITIAL_SESSION') return;
      if (event === 'INITIAL_SESSION') initialized.current = true;

      console.log(`Auth Event: ${event}`);
      setSession(session);
      
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (mounted) {
        // Se não houver sessão, encerramos o loading imediatamente.
        // Se houver, o useEffect do profile cuidará de encerrar o loading após a busca.
        if (!currentUser) {
          setLoading(false);
          clearTimeout(safetyTimeout);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);



  const impersonateUser = async (id: string | null) => {
    if (!id) {
      setViewingUserId(null);
      setViewingProfile(null);
      return;
    }
    
    // Definir o ID imediatamente para evitar delay/flicker e race conditions no carregamento de dados
    setViewingUserId(id);
    
    // Buscar perfil COM metadados para saber quais espaços estão ativos
    const p = await fetchProfile(id, true);
    if (p) {
      setViewingProfile(p);
    } else {
      // Se falhar ao buscar o perfil, desfaz a impersonação
      setViewingUserId(null);
    }
  };


  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      loading, 
      viewingUserId, 
      viewingProfile,
      isEducatorPlanExpired,
      isClientLinkSuspended,
      impersonateUser, 
      signOut,
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


