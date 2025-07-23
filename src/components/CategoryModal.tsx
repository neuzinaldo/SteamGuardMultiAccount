import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useCategories } from '../hooks/useCategories';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryModal({ isOpen, onClose }: CategoryModalProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');
  const [loading, setLoading] = useState(false);
  const { customCategories, addCategory, deleteCategory } = useCategories();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setLoading(true);
    try {
      const result = await addCategory(newCategoryName.trim(), newCategoryType);
      if (!result.error) {
        setNewCategoryName('');
        setNewCategoryType('expense');
        // Disparar evento para atualizar outros componentes
        window.dispatchEvent(new CustomEvent('categoryUpdated'));
      } else {
        alert('Erro ao criar categoria: ' + result.error.message);
      }
    } catch (error) {
      alert('Erro ao criar categoria');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a categoria "${name}"?`)) {
      const result = await deleteCategory(id);
      if (result.error) {
        alert('Erro ao excluir categoria: ' + result.error.message);
      }
      // Sempre disparar evento, mesmo em caso de erro para tentar recarregar
      window.dispatchEvent(new CustomEvent('categoryUpdated'));
    }
  };

  if (!isOpen) return null;

  const incomeCategories = customCategories.filter(c => c.type === 'income');
  const expenseCategories = customCategories.filter(c => c.type === 'expense');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Gerenciar Categorias</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Add new category form */}
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Adicionar Nova Categoria</h4>
              <div className="flex gap-3">
                <select
                  value={newCategoryType}
                  onChange={(e) => setNewCategoryType(e.target.value as 'income' | 'expense')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="expense">Saída</option>
                  <option value="income">Entrada</option>
                </select>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nome da categoria"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="submit"
                  disabled={loading || !newCategoryName.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  {loading ? 'Adicionando...' : 'Adicionar'}
                </button>
              </div>
            </form>

            {/* Categories list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Income categories */}
              <div>
                <h4 className="text-sm font-medium text-green-700 mb-3">Categorias de Entrada ({incomeCategories.length})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {incomeCategories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                      <span className="text-sm text-gray-900">{category.name}</span>
                      <button
                        onClick={() => handleDelete(category.id, category.name)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {incomeCategories.length === 0 && (
                    <p className="text-sm text-gray-500 italic">Nenhuma categoria personalizada</p>
                  )}
                </div>
              </div>

              {/* Expense categories */}
              <div>
                <h4 className="text-sm font-medium text-red-700 mb-3">Categorias de Saída ({expenseCategories.length})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {expenseCategories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-2 bg-red-50 rounded-md">
                      <span className="text-sm text-gray-900">{category.name}</span>
                      <button
                        onClick={() => handleDelete(category.id, category.name)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {expenseCategories.length === 0 && (
                    <p className="text-sm text-gray-500 italic">Nenhuma categoria personalizada</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}