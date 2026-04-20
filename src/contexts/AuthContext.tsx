import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'ADMIN' | 'MANUTENCAO' | 'OPERACAO';

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
const ROLE_KEY = 'cmms_user_role';

const fetchUserRole = async (userId: string): Promise<AppRole> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching role:', error);
      const cached = localStorage.getItem(ROLE_KEY) as AppRole;
      return cached || 'OPERACAO';
    }

    if (data?.role) {
      localStorage.setItem(ROLE_KEY, data.role);
      return data.role as AppRole;
    }

    const cached = localStorage.getItem(ROLE_KEY) as AppRole;
    return cached || 'OPERACAO';
  } catch (e) {
    console.error('Exception fetching role:', e);
    const cached = localStorage.getItem(ROLE_KEY) as AppRole;
    return cached || 'OPERACAO';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const role = await fetchUserRole(session.user.id);
        setUserRole(role);
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use cached role immediately to avoid flicker
          const cached = localStorage.getItem(ROLE_KEY) as AppRole;
          if (cached) setUserRole(cached);
          
          // Then fetch fresh role
          const role = await fetchUserRole(session.user.id);
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
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { nome },
      },
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
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
