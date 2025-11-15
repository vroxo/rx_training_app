import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSyncStore } from '../stores/syncStore';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors, SPACING, TYPOGRAPHY } from '../constants/theme';

/**
 * Banner que aparece quando o usuário está offline
 */
export function OfflineBanner() {
  const { isOnline } = useSyncStore();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  if (isOnline) {
    return null;
  }

  return (
    <View style={[styles.banner, { backgroundColor: colors.warning }]}>
      <Ionicons name="cloud-offline-outline" size={16} color={colors.background.primary} />
      <Text style={[styles.text, { color: colors.background.primary }]}>
        Você está offline. Dados serão salvos localmente.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  text: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.medium as any,
  },
});

