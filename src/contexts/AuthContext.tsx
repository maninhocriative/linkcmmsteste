import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'ADMIN' | 'MANUTENCAO' | 'OPERACAO';
const ROLE_KEY = 'cmms_role';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isTechnician: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchRoleWithRetry(userId: string, retries = 5): Promise<AppRole> {
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data?.role) {
        localStorage.setItem(ROLE_KEY, data.role);
        return data.role as AppRole;
      }
    } catch (e) {
      // ignore, retry
    }
    // Wait before retry: 200ms, 400ms, 800ms...
    await new Promise(r => setTimeout(r, 200 * Math.pow(2, i)));
  }
  // Return cached if available
  return (localStorage.getItem(ROLE_KEY) as AppRole) || 'OPERACAO';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Apply cached role immediately to avoid flash
    const cached = localStorage.getItem(ROLE_KEY) as AppRole;
    if (cached) setUserRole(cached);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const role = await fetchRoleWithRetry(session.user.id);
        setUserRole(role);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const cached = localStorage.getItem(ROLE_KEY) as AppRole;
          if (cached) setUserRole(cached);
          
          const role = await fetchRoleWithRetry(session.user.id);
          setUserRole(role);
        } else {
          setUserRole(null);
          localStorage.removeItem(ROLE_KEY);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, nome: string) => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin, data: { nome } },
    });
    return { error };
  };

  const signOut = async () => {
    localStorage.removeItem(ROLE_KEY);
    await supabase.auth.signOut();
  };

  const isAdmin = userRole === 'ADMIN';
  const isTechnician = userRole === 'MANUTENCAO' || userRole === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, session, userRole, loading, signIn, signUp, signOut, isAdmin, isTechnician }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
