import { useState, useEffect } from 'react';
import { DashboardMetrics, MonthlyData } from '../types';
import { supabase } from '../lib/supabase';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth } from 'date-fns';

export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    currentBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    monthlyBalance: 0,
    yearlyData: [],
  });
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async (year: number = new Date().getFullYear()) => {
    if (!supabase) {
      console.log('Supabase não configurado');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Fetch all transactions for the year
      const { data: yearTransactions, error: yearError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startOfYear(new Date(year, 0, 1)).toISOString().split('T')[0])
        .lte('date', endOfYear(new Date(year, 11, 31)).toISOString().split('T')[0]);

      if (yearError) throw yearError;

      // Current month data
      const currentMonth = new Date().getMonth() + 1;
      const { data: monthTransactions, error: monthError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startOfMonth(new Date()).toISOString().split('T')[0])
        .lte('date', endOfMonth(new Date()).toISOString().split('T')[0]);

      if (monthError) throw monthError;

      // Calculate monthly metrics
      const monthlyIncome = monthTransactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      const monthlyExpense = monthTransactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      // Calculate current balance (all time)
      const { data: allTransactions, error: allError } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', user.id);

      if (allError) throw allError;

      const totalIncome = allTransactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      const totalExpense = allTransactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      // Generate yearly data
      const yearlyData: MonthlyData[] = [];
      for (let month = 1; month <= 12; month++) {
        const monthTransactions = yearTransactions?.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate.getMonth() + 1 === month;
        }) || [];

        const income = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const expense = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        yearlyData.push({
          month: format(new Date(year, month - 1, 1), 'MMM'),
          income,
          expense,
          balance: income - expense,
        });
      }

      setMetrics({
        currentBalance: totalIncome - totalExpense,
        monthlyIncome,
        monthlyExpense,
        monthlyBalance: monthlyIncome - monthlyExpense,
        yearlyData,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    metrics,
    loading,
    fetchDashboardData,
  };
}