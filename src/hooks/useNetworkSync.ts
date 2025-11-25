import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useSyncStore } from '../stores/syncStore';
import { networkService } from '../services/network';
import { toast } from '../services/toast';

/**
 * Hook que monitora o status de rede e dispara sync automático
 * quando o usuário volta a ficar online
 */
export function useNetworkSync() {
  const { user } = useAuth();
  const { sync, setIsOnline } = useSyncStore();
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    // Subscribe to network changes
    const unsubscribe = networkService.subscribe((isOnline) => {
      // Update sync store
      setIsOnline(isOnline);

      // If user was offline and now is online, trigger sync
      if (!wasOfflineRef.current && !isOnline) {
        // Just went offline
        wasOfflineRef.current = true;
        toast.info('Você está offline. Dados serão salvos localmente.');
      } else if (wasOfflineRef.current && isOnline) {
        // Just went back online
        wasOfflineRef.current = false;
        toast.success('Você está online! Sincronizando dados...');
        
        // Trigger sync if user is logged in
        if (user) {
          sync(user.id).catch((error) => {
            console.error('❌ [NETWORK] Erro ao sincronizar após voltar online:', error);
            toast.error('Erro ao sincronizar. Tente novamente manualmente.');
          });
        }
      }
    });

    // Initialize current state
    const isOnline = networkService.getIsOnline();
    setIsOnline(isOnline);
    wasOfflineRef.current = !isOnline;

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, [user, sync, setIsOnline]);

  return null;
}

