import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen, PeriodizationsScreen, ProfileScreen } from '../screens';
import type { MainTabParamList } from './types';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../constants/theme';
import { OfflineBanner } from '../components';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  return (
    <>
      <OfflineBanner />
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.text.tertiary,
          tabBarStyle: {
            backgroundColor: colors.background.primary,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
          headerStyle: {
            backgroundColor: colors.background.primary,
            borderBottomColor: colors.border,
            borderBottomWidth: 1,
          },
          headerTintColor: colors.text.primary,
        }}
      >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          headerTitle: 'RX Training',
        }}
      />
      <Tab.Screen
        name="Periodizations"
        component={PeriodizationsScreen}
        options={{
          tabBarLabel: 'Periodizações',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
          headerTitle: 'Periodizações',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          headerTitle: 'Perfil',
        }}
      />
    </Tab.Navigator>
    </>
  );
}

