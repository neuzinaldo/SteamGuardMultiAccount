import { useState, useEffect } from 'react';
import { Category } from '../types';
import { supabase } from '../lib/supabase';

export function useCategories() {
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    if (!supabase) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('Usuário não autenticado');
        setCustomCategories([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setCustomCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCustomCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (name: string, type: 'income' | 'expense') => {
    if (!supabase) return { data: null, error: { message: 'Supabase não configurado' } };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('categories')
        .insert([{ name, type, user_id: user.id }])
        .select();

      if (error) throw error;
      
      // Atualizar a lista local imediatamente
      if (data && data[0]) {
        setCustomCategories(prev => [...prev, data[0]]);
      }
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const deleteCategory = async (id: string) => {
    if (!supabase) return { error: { message: 'Supabase não configurado' } };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Remover da lista local imediatamente
      setCustomCategories(prev => prev.filter(cat => cat.id !== id));
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  useEffect(() => {
    fetchCategories();
    
    const handleCategoryUpdate = () => {
      fetchCategories();
    };
    
    window.addEventListener('categoryUpdated', handleCategoryUpdate);
    
    return () => {
      window.removeEventListener('categoryUpdated', handleCategoryUpdate);
    };
  }, []);

  return {
    customCategories,
    loading,
    fetchCategories,
    addCategory,
    deleteCategory,
  };
}