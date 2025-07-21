# 🗄️ Configuração do Banco de Dados - Sistema de Controle de Caixa

## 📋 Instruções para Configurar o Supabase

### 1. **Acesse seu Projeto Supabase**
- Vá para [supabase.com](https://supabase.com)
- Faça login e acesse seu projeto
- Se não tiver um projeto, crie um novo

### 2. **Execute o Script SQL**
- No painel do Supabase, vá para **SQL Editor**
- Abra o arquivo `database-schema.sql` deste projeto
- Copie todo o conteúdo e cole no SQL Editor
- Clique em **Run** para executar

### 3. **Configurar Variáveis de Ambiente**
- No painel do Supabase, vá para **Settings** > **API**
- Copie a **URL** e a **anon public key**
- No Bolt, clique em **"Connect to Supabase"** no canto superior direito
- Cole as informações copiadas

## 🏗️ Estrutura do Banco de Dados

### Tabela: `transactions`
Armazena todas as transações financeiras dos usuários.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Chave primária (gerada automaticamente) |
| `user_id` | UUID | ID do usuário (referência para auth.users) |
| `date` | DATE | Data da transação |
| `type` | TEXT | Tipo: 'income' (entrada) ou 'expense' (saída) |
| `description` | TEXT | Descrição da transação |
| `amount` | DECIMAL(10,2) | Valor da transação |
| `category` | TEXT | Categoria da transação |
| `created_at` | TIMESTAMPTZ | Data de criação (automática) |
| `updated_at` | TIMESTAMPTZ | Data de atualização (automática) |

## 🔒 Segurança (RLS - Row Level Security)

O sistema implementa **Row Level Security** para garantir que:
- ✅ Usuários só podem ver suas próprias transações
- ✅ Usuários só podem criar transações para si mesmos
- ✅ Usuários só podem editar suas próprias transações
- ✅ Usuários só podem deletar suas próprias transações

## 📊 Categorias Disponíveis

### 💰 Entradas (Income)
- Salário
- Freelance
- Vendas
- Investimentos
- Outros

### 💸 Saídas (Expense)
- Alimentação
- Transporte
- Moradia
- Saúde
- Educação
- Lazer
- Outros

## 🚀 Funcionalidades do Sistema

### Dashboard
- 📈 Saldo atual
- 📊 Entradas e saídas do mês
- 📉 Gráficos de evolução
- 📋 Resumo mensal

### Lançamentos
- ➕ Adicionar transações
- ✏️ Editar transações
- 🗑️ Excluir transações
- 🔍 Filtrar por período/categoria
- 📄 Gerar relatório PDF
- 🧹 Limpar todos os dados

## 🔧 Troubleshooting

### Problema: Página em branco após login
**Solução:** Verifique se:
1. O Supabase está configurado corretamente
2. As tabelas foram criadas
3. As políticas RLS estão ativas

### Problema: Erro ao criar transação
**Solução:** Verifique se:
1. O usuário está autenticado
2. Todos os campos obrigatórios estão preenchidos
3. O valor é maior que zero

### Problema: Não consegue ver transações
**Solução:** Verifique se:
1. As políticas RLS estão configuradas
2. O usuário está logado
3. Existem transações para o usuário atual

## 📞 Suporte

Se encontrar problemas:
1. Verifique o console do navegador (F12)
2. Confirme se o Supabase está configurado
3. Execute novamente o script SQL se necessário