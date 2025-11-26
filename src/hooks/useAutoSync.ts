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
      return;
    }

    const intervalMs = autoSyncConfig.intervalMinutes * 60 * 1000;

    // Setup interval for auto-sync
    intervalRef.current = setInterval(async () => {
      try {
        await sync(user.id);
      } catch (error) {
        console.error('❌ [AUTO-SYNC] Erro na sincronização automática:', error);
      }
    }, intervalMs);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, autoSyncConfig.intervalMinutes, isOnline]); // sync is stable from Zustand

  return null;
}

