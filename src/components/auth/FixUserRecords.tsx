import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { clinicService } from '@/hooks/auth/clinicService';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function FixUserRecords() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFixing, setIsFixing] = useState(false);
  const [isFixed, setIsFixed] = useState(false);

  const handleFix = useCallback(async () => {
    if (!user?.id) return;
    
    setIsFixing(true);
    try {
      const success = await clinicService.fixUserRecords(user.id);
      
      if (success) {
        toast({
          title: 'Registros corrigidos',
          description: 'Seus registros foram corrigidos com sucesso. Agora você pode usar todas as funcionalidades.',
          variant: 'default',
        });
        setIsFixed(true);
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível corrigir seus registros. Por favor, tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fixing user records:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao tentar corrigir seus registros.',
        variant: 'destructive',
      });
    } finally {
      setIsFixing(false);
    }
  }, [user?.id, toast]);

  // Tentar corrigir automaticamente na primeira renderização
  useEffect(() => {
    if (user?.id && !isFixed && !isFixing) {
      handleFix();
    }
  }, [user?.id, isFixed, isFixing, handleFix]);

  if (!user) return null;
  
  return (
    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
      <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-300">Correção de Registros</h3>
      <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
        {isFixed 
          ? 'Seus registros foram corrigidos com sucesso. Agora você pode usar todas as funcionalidades.'
          : 'Detectamos um problema com seus registros que pode impedir o uso de algumas funcionalidades.'}
      </p>
      
      {!isFixed && (
        <Button 
          onClick={handleFix} 
          disabled={isFixing}
          variant="outline"
          className="mt-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300 dark:bg-yellow-800/30 dark:hover:bg-yellow-800/50 dark:text-yellow-300 dark:border-yellow-700"
        >
          {isFixing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Corrigindo...
            </>
          ) : (
            'Corrigir Registros'
          )}
        </Button>
      )}
    </div>
  );
}
