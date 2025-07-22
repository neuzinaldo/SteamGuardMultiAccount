/*
  # Criar tabela de categorias personalizadas

  1. Nova Tabela
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, nome da categoria)
      - `type` (text, 'income' ou 'expense')
      - `user_id` (uuid, referência ao usuário)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `categories`
    - Adicionar políticas para usuários autenticados gerenciarem suas próprias categorias

  3. Índices
    - Índice para consultas por user_id e type
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type);