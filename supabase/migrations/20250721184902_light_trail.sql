/*
  # Sistema de Controle de Caixa - Esquema do Banco de Dados

  Este arquivo contém todas as tabelas necessárias para o sistema de controle de caixa.
  Execute este script no SQL Editor do Supabase para criar as tabelas.

  ## Tabelas incluídas:
  1. transactions - Armazena todas as transações financeiras
  2. Configurações de RLS (Row Level Security)
  3. Políticas de segurança

  ## Como usar:
  1. Acesse seu projeto no Supabase
  2. Vá para SQL Editor
  3. Cole este código e execute
*/

-- =====================================================
-- TABELA: transactions
-- Armazena todas as transações financeiras dos usuários
-- =====================================================

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  description text NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- ÍNDICES para melhor performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS na tabela transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS DE SEGURANÇA
-- =====================================================

-- Política para SELECT: usuários podem ver apenas suas próprias transações
CREATE POLICY "Users can view own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política para INSERT: usuários podem inserir apenas suas próprias transações
CREATE POLICY "Users can insert own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: usuários podem atualizar apenas suas próprias transações
CREATE POLICY "Users can update own transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para DELETE: usuários podem deletar apenas suas próprias transações
CREATE POLICY "Users can delete own transactions"
  ON transactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNÇÃO para atualizar updated_at automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- TRIGGER para atualizar updated_at automaticamente
-- =====================================================

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DADOS DE EXEMPLO (OPCIONAL)
-- Descomente as linhas abaixo se quiser dados de exemplo
-- =====================================================

/*
-- Inserir algumas transações de exemplo (substitua 'YOUR_USER_ID' pelo ID real do usuário)
INSERT INTO transactions (user_id, date, type, description, amount, category) VALUES
  ('YOUR_USER_ID', '2024-01-15', 'income', 'Salário Janeiro', 5000.00, 'Salário'),
  ('YOUR_USER_ID', '2024-01-16', 'expense', 'Supermercado', 350.00, 'Alimentação'),
  ('YOUR_USER_ID', '2024-01-17', 'expense', 'Combustível', 200.00, 'Transporte'),
  ('YOUR_USER_ID', '2024-01-18', 'income', 'Freelance', 800.00, 'Freelance'),
  ('YOUR_USER_ID', '2024-01-19', 'expense', 'Aluguel', 1200.00, 'Moradia');
*/

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se a tabela foi criada corretamente
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'transactions' 
ORDER BY ordinal_position;

-- Verificar se as políticas foram criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'transactions';