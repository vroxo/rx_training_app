import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const {
    user,
    isLoading,
    isInitializing,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount
  
  return {
    user,
    isLoading: isLoading || isInitializing,
    isAuthenticated,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    clearError,
  };
}

