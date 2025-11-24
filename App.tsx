// Polyfill for crypto.getRandomValues() needed by uuid
import 'react-native-get-random-values';

import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { COLORS } from './src/constants/theme';
import { storageService } from './src/services/storage';
import { migrateSetOrderIndex } from './src/services/storage/migrations';
import { AppNavigator } from './src/navigation';
import { ErrorBoundary } from './src/components';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});


export default function App() {
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    initializeStorage();
  }, []);

  const initializeStorage = async () => {
    try {
      console.log('🔄 Initializing storage...');
      await storageService.init();
      
      // Run migrations
      try {
        await migrateSetOrderIndex();
      } catch (migrationError) {
        console.error('⚠️ Migration failed (non-critical):', migrationError);
      }
      
      setIsStorageReady(true);
      console.log('✅ Storage ready!');
    } catch (error) {
      console.error('❌ Storage initialization failed:', error);
      setStorageError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      // Hide splash screen after initialization (success or error)
      await SplashScreen.hideAsync();
    }
  };

  if (storageError) {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>⚠️ Erro</Text>
            <Text style={styles.errorText}>{storageError}</Text>
          </View>
        </View>
        <Toast />
      </SafeAreaProvider>
    );
  }

  if (!isStorageReady) {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <View style={styles.content}>
            <ActivityIndicator size="large" color={COLORS.purple[500]} />
            <Text style={styles.loadingText}>Inicializando armazenamento...</Text>
          </View>
        </View>
        <Toast />
      </SafeAreaProvider>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <AppNavigator />
          </QueryClientProvider>
          <Toast />
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background.secondary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as any,
    color: COLORS.dark.text.primary,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.dark.text.secondary,
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.dark.error,
    textAlign: 'center',
  },
});
