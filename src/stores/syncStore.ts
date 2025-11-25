import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncService } from '../services/sync';
import { networkService } from '../services/network';

const AUTO_SYNC_CONFIG_KEY = '@rx_training:auto_sync_config';

export interface AutoSyncConfig {
  intervalMinutes: number;
}

interface SyncState {
  isSyncing: boolean;
  isOnline: boolean;
  lastSyncedAt: Date | null;
  error: string | null;
  autoSyncConfig: AutoSyncConfig;
  
  // Actions
  sync: (userId: string) => Promise<void>;
  setIsOnline: (isOnline: boolean) => void;
  clearError: () => void;
  setAutoSyncConfig: (config: AutoSyncConfig) => Promise<void>;
  loadAutoSyncConfig: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isSyncing: false,
  isOnline: networkService.getIsOnline(),
  lastSyncedAt: null,
  error: null,
  autoSyncConfig: {
    intervalMinutes: 5, // Default: 5 minutes
  },

  sync: async (userId: string) => {
    const { isOnline, isSyncing } = get();

    if (!isOnline) {
      set({ error: 'Sem conexão com a internet' });
      return;
    }

    if (isSyncing) {
      return;
    }

    set({ isSyncing: true, error: null });

    try {
      await syncService.syncAll(userId);
      set({ 
        lastSyncedAt: new Date(), 
        isSyncing: false 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha na sincronização';
      set({ 
        error: message, 
        isSyncing: false 
      });
      console.error('❌ Erro na sincronização:', error);
      throw error;
    }
  },

  setIsOnline: (isOnline: boolean) => set({ isOnline }),

  clearError: () => set({ error: null }),

  setAutoSyncConfig: async (config: AutoSyncConfig) => {
    try {
      await AsyncStorage.setItem(AUTO_SYNC_CONFIG_KEY, JSON.stringify(config));
      set({ autoSyncConfig: config });
    } catch (error) {
      console.error('❌ Erro ao salvar configuração de auto-sync:', error);
    }
  },

  loadAutoSyncConfig: async () => {
    try {
      const saved = await AsyncStorage.getItem(AUTO_SYNC_CONFIG_KEY);
      if (saved) {
        const config = JSON.parse(saved);
        set({ autoSyncConfig: config });
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configuração de auto-sync:', error);
    }
  },
}));

