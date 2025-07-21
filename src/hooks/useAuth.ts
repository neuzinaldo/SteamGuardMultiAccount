import { useState, useEffect } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se já existe uma sessão ativa
    const getSession = async () => {
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          setUser(session?.user ?? null);
        } catch (error) {
          console.error('Erro ao verificar sessão:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    getSession();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.email);
          setUser(session?.user ?? null);
        }
      );

      return () => subscription.unsubscribe();
    }
  }, []);

  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase não configurado' } };
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase não configurado' } };
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    return { data, error };
  };

  const signOut = async () => {
    if (!supabase) {
      return { error: { message: 'Supabase não configurado' } };
    }
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    return { error };
  };

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase não configurado' } };
    }
    setLoading(true);
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    return { data, error };
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };
}