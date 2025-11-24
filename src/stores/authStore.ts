import { create } from 'zustand';
import type { User } from '../models';
import { authService } from '../services/auth';
import { useSyncStore } from './syncStore';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  restoreSession: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.signIn(email, password);
      set({ user, isAuthenticated: true, isLoading: false });
      
      // Sync automático imediato após login
      console.log('🔄 [LOGIN] Iniciando sincronização automática...');
      const syncStore = useSyncStore.getState();
      await syncStore.sync(user.id);
      console.log('✅ [LOGIN] Sincronização concluída!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  signUp: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.signUp(email, password);
      set({ user, isAuthenticated: true, isLoading: false });
      
      // Sync automático imediato após cadastro
      console.log('🔄 [SIGNUP] Iniciando sincronização automática...');
      const syncStore = useSyncStore.getState();
      await syncStore.sync(user.id);
      console.log('✅ [SIGNUP] Sincronização concluída!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.signOut();
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign out failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      await authService.resetPassword(email);
      set({ isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  restoreSession: async () => {
    // Don't set isLoading to true to avoid blocking UI
    set({ error: null });
    try {
      const user = await authService.restoreSession();
      set({ 
        user, 
        isAuthenticated: user !== null
      });
      
      // Sync automático imediato após restaurar sessão
      if (user) {
        console.log('🔄 [RESTORE] Iniciando sincronização automática...');
        const syncStore = useSyncStore.getState();
        await syncStore.sync(user.id);
        console.log('✅ [RESTORE] Sincronização concluída!');
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      set({ user: null, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),

  setUser: (user: User | null) => set({ 
    user, 
    isAuthenticated: user !== null 
  }),
}));

