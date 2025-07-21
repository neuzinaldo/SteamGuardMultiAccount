import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface AuthFormProps {
  mode: 'signin' | 'signup' | 'reset';
  onModeChange: (mode: 'signin' | 'signup' | 'reset') => void;
}

export function AuthForm({ mode, onModeChange }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const { signIn, signUp, resetPassword } = useAuth();

  // Se o Supabase não estiver configurado, mostrar mensagem
  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">₹</span>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sistema de Controle de Caixa
            </h2>
            <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">
                Configuração Necessária
              </h3>
              <p className="text-sm text-yellow-700 mb-4">
                Para usar o sistema, você precisa configurar o Supabase clicando no botão 
                "Connect to Supabase" no canto superior direito da tela.
              </p>
              <p className="text-xs text-yellow-600">
                Após a configuração, você poderá criar sua conta e começar a usar todas as funcionalidades.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let result;
      if (mode === 'signin') {
        result = await signIn(email, password);
        if (result.data?.user && !result.error) {
          // Login bem-sucedido, não precisa fazer nada pois o useAuth vai atualizar automaticamente
          return;
        }
      } else if (mode === 'signup') {
        result = await signUp(email, password);
        if (result.data?.user && !result.error) {
          setMessage('Conta criada com sucesso! Você já pode usar o sistema.');
          // Aguardar um pouco e tentar fazer login automaticamente
          setTimeout(async () => {
            const loginResult = await signIn(email, password);
            if (loginResult.error) {
              setMessage('Conta criada! Faça login para continuar.');
            }
          }, 1000);
          return;
        }
      } else {
        result = await resetPassword(email);
        if (!result.error) {
          setMessage('Verifique seu email para redefinir a senha');
          return;
        }
      }

      if (result.error) {
        // Traduzir mensagens de erro comuns
        let errorMessage = result.error.message;
        if (errorMessage.includes('Invalid login credentials')) {
          errorMessage = 'Email ou senha incorretos';
        } else if (errorMessage.includes('User already registered')) {
          errorMessage = 'Este email já está cadastrado';
        } else if (errorMessage.includes('Password should be at least')) {
          errorMessage = 'A senha deve ter pelo menos 6 caracteres';
        }
        setMessage(errorMessage);
      }
    } catch (error) {
      setMessage('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xl font-bold">₹</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {mode === 'signin' ? 'Entre na sua conta' : 
             mode === 'signup' ? 'Crie sua conta' : 
             'Recuperar senha'}
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email"
              />
            </div>
            
            {mode !== 'reset' && (
              <div className="relative">
                <label htmlFor="password" className="sr-only">Senha</label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Senha"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            )}
          </div>

          {message && (
            <div className={`text-sm text-center ${message.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? 'Carregando...' : 
               mode === 'signin' ? 'Entrar' : 
               mode === 'signup' ? 'Criar Conta' : 
               'Enviar'}
            </button>
          </div>

          <div className="text-center space-y-2">
            {mode === 'signin' && (
              <>
                <button
                  type="button"
                  onClick={() => onModeChange('reset')}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Esqueceu a senha?
                </button>
                <div>
                  <span className="text-sm text-gray-600">Não tem conta? </span>
                  <button
                    type="button"
                    onClick={() => onModeChange('signup')}
                    className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Cadastre-se
                  </button>
                </div>
              </>
            )}
            
            {mode === 'signup' && (
              <div>
                <span className="text-sm text-gray-600">Já tem conta? </span>
                <button
                  type="button"
                  onClick={() => onModeChange('signin')}
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  Entre aqui
                </button>
              </div>
            )}
            
            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => onModeChange('signin')}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Voltar ao login
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}