import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useSyncStore } from '../stores/syncStore';

export function useAutoSync() {
  const { user } = useAuth();
  const { sync, autoSyncConfig, isOnline } = useSyncStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only setup auto-sync if:
    // 1. User is logged in
    // 2. User is online
    if (!user || !isOnline) {
      console.log('⏸️ Auto-sync pausado:', {
        userLoggedIn: !!user,
        isOnline,
      });
      return;
    }

    const intervalMs = autoSyncConfig.intervalMinutes * 60 * 1000;
    console.log(`⏰ Auto-sync ativado: a cada ${autoSyncConfig.intervalMinutes} minutos`);

    // Setup interval for auto-sync
    intervalRef.current = setInterval(async () => {
      try {
        console.log('🔄 [AUTO-SYNC] Iniciando sincronização automática...');
        await sync(user.id);
        console.log('✅ [AUTO-SYNC] Sincronização automática concluída!');
      } catch (error) {
        console.error('❌ [AUTO-SYNC] Erro na sincronização automática:', error);
      }
    }, intervalMs);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        console.log('🛑 Auto-sync parado');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, autoSyncConfig.intervalMinutes, isOnline, sync]);

  return null;
}

