import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useSyncStore } from '../stores/syncStore';

interface SyncStatusIndicatorProps {
  needsSync?: boolean;
  variant?: 'full' | 'icon-only';
  size?: 'small' | 'medium';
}

/**
 * Componente que exibe o status de sincronização em tempo real
 * 
 * Estados:
 * 1. Sincronizando... (isSyncing = true) - Mostra loading
 * 2. Pendente sync (needsSync = true) - Amarelo
 * 3. Sincronizado (needsSync = false) - Verde
 */
export function SyncStatusIndicator({ 
  needsSync = false, 
  variant = 'full',
  size = 'medium'
}: SyncStatusIndicatorProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { isSyncing } = useSyncStore();

  const iconSize = size === 'small' ? 16 : 20;
  const spinnerSize = size === 'small' ? 'small' : 'small';

  // Determina o estado atual
  const getSyncStatus = () => {
    if (isSyncing) {
      return {
        icon: 'sync' as const,
        color: colors.info,
        text: 'Sincronizando...',
        showSpinner: true,
      };
    }
    
    if (needsSync) {
      return {
        icon: 'sync-outline' as const,
        color: colors.warning,
        text: 'Pendente sync',
        showSpinner: false,
      };
    }
    
    return {
      icon: 'checkmark-circle' as const,
      color: colors.success,
      text: 'Sincronizado',
      showSpinner: false,
    };
  };

  const status = getSyncStatus();

  if (variant === 'icon-only') {
    return (
      <View style={styles.iconOnlyContainer}>
        {status.showSpinner ? (
          <ActivityIndicator size={spinnerSize} color={status.color} />
        ) : (
          <Ionicons name={status.icon} size={iconSize} color={status.color} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.fullContainer}>
      {status.showSpinner ? (
        <ActivityIndicator 
          size={spinnerSize} 
          color={status.color} 
          style={styles.icon}
        />
      ) : (
        <Ionicons 
          name={status.icon} 
          size={iconSize} 
          color={status.color} 
          style={styles.icon}
        />
      )}
      <Text 
        style={[
          styles.text, 
          { color: status.color },
          size === 'small' && styles.smallText
        ]}
      >
        {status.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconOnlyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginRight: SPACING.xs,
  },
  text: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.medium as any,
  },
  smallText: {
    fontSize: TYPOGRAPHY.size.xs,
  },
});

