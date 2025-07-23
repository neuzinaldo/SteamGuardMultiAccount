import { useEffect } from 'react';

export function useCategorySync(onUpdate: () => void) {
  useEffect(() => {
    const handleCategoryUpdate = () => {
      onUpdate();
    };
    
    window.addEventListener('categoryUpdated', handleCategoryUpdate);
    
    return () => {
      window.removeEventListener('categoryUpdated', handleCategoryUpdate);
    };
  }, [onUpdate]);
}