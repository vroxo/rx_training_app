import { useSyncStore } from '../stores/syncStore';
import { useAuthStore } from '../stores/authStore';

export function useSync() {
  const {
    isSyncing,
    isOnline,
    lastSyncedAt,
    error,
    sync,
    clearError,
  } = useSyncStore();

  const { user } = useAuthStore();

  // Network detection DISABLED for now - always assume online

  const manualSync = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    await sync(user.id);
  };

  return {
    isSyncing,
    isOnline,
    lastSyncedAt,
    error,
    sync: manualSync,
    clearError,
  };
}

