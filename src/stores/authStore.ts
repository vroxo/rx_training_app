import { create } from 'zustand';
import type { User } from '../models';
import { authService } from '../services/auth';
import { useSyncStore } from './syncStore';

// Global flag to prevent multiple restore attempts
let isRestoring = false;
let hasRestored = false;

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitializing: boolean;
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
  isInitializing: true,
  isAuthenticated: false,
  error: null,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.signIn(email, password);
      set({ user, isAuthenticated: true, isLoading: false });
      
      // Sync automático imediato após login
      const syncStore = useSyncStore.getState();
      await syncStore.sync(user.id);
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
      const syncStore = useSyncStore.getState();
      await syncStore.sync(user.id);
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
    // Prevent multiple restore attempts
    if (isRestoring || hasRestored) {
      return;
    }
    
    isRestoring = true;
    set({ isInitializing: true, error: null });
    
    try {
      const user = await authService.restoreSession();
      
      // Only set user AFTER sync completes
      if (user) {
        const syncStore = useSyncStore.getState();
        await syncStore.sync(user.id);
        
        // Now set the user to trigger navigation to Main
        set({ 
          user, 
          isAuthenticated: true,
          isInitializing: false
        });
      } else {
        set({ 
          user: null, 
          isAuthenticated: false,
          isInitializing: false
        });
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      set({ user: null, isAuthenticated: false, isInitializing: false });
    } finally {
      isRestoring = false;
      hasRestored = true;
    }
  },

  clearError: () => set({ error: null }),

  setUser: (user: User | null) => set({ 
    user, 
    isAuthenticated: user !== null 
  }),
}));

