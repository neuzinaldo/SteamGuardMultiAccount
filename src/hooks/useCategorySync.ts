import { useEffect } from 'react';

export function useCategorySync(onUpdate: () => void) {
  useEffect(() => {
    if (!onUpdate || typeof onUpdate !== 'function') {
      console.warn('useCategorySync: onUpdate deve ser uma função válida');
      return;
    }
    
    const handleCategoryUpdate = () => {
      try {
        onUpdate();
      } catch (error) {
        console.error('Erro na sincronização de categorias:', error);
      }
    };
    
    window.addEventListener('categoryUpdated', handleCategoryUpdate);
    
    return () => {
      window.removeEventListener('categoryUpdated', handleCategoryUpdate);
    };
  }, [onUpdate]);
}