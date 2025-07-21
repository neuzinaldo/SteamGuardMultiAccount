export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  date: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionFormData {
  date: string;
  type: 'income' | 'expense';
  description: string;
  amount: string | number;
  category: string;
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export interface DashboardMetrics {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyBalance: number;
  yearlyData: MonthlyData[];
}

export const CATEGORIES = {
  income: ['Salário', 'Freelance', 'Vendas', 'Investimentos', 'Outros'],
  expense: ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Outros']
};