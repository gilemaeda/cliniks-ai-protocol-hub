
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth/authContext';

export const useCustomCategories = (resourceType: 'equipment' | 'cosmetic' | 'injectable') => {
  const { user } = useAuth();
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  const storageKey = `cliniks_custom_${resourceType}_categories_${user?.id}`;

  useEffect(() => {
    if (user) {
      loadCustomCategories();
    }
  }, [user, resourceType]);

  const loadCustomCategories = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setCustomCategories(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erro ao carregar categorias personalizadas:', error);
    }
  };

  const addCustomCategory = (category: string) => {
    if (category.trim() && !customCategories.includes(category.trim())) {
      const newCategories = [...customCategories, category.trim()];
      setCustomCategories(newCategories);
      localStorage.setItem(storageKey, JSON.stringify(newCategories));
      return true;
    }
    return false;
  };

  const removeCustomCategory = (category: string) => {
    const newCategories = customCategories.filter(cat => cat !== category);
    setCustomCategories(newCategories);
    localStorage.setItem(storageKey, JSON.stringify(newCategories));
  };

  return {
    customCategories,
    addCustomCategory,
    removeCustomCategory
  };
};
