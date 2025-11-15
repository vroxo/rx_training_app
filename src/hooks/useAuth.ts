import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const {
    user,
    isLoading,
    isAuthenticated,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    clearError,
    restoreSession,
  } = useAuthStore();

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      restoreSession();
    }
  }, [restoreSession]);
  
  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    clearError,
  };
}

