import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth, useAutoSync, useNetworkSync } from '../hooks';
import { MainTabNavigator } from './MainTabNavigator';
import { AuthStackNavigator } from './AuthStackNavigator';
import type { RootStackParamList } from './types';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { user, isLoading } = useAuth();
  
  // Initialize auto-sync (only runs when user is logged in)
  useAutoSync();
  
  // Monitor network status and sync when coming back online
  useNetworkSync();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary[600]} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStackNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
  },
});

