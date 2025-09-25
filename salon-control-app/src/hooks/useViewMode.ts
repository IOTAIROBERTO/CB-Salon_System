import { useState, useEffect } from 'react';
import { ViewMode } from '../types/clientes';

export const useViewMode = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  useEffect(() => {
    const handleResize = () => {
      setViewMode(window.innerWidth < 768 ? 'cards' : 'table');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    viewMode,
    setViewMode
  };
};