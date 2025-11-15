import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors, SPACING, TYPOGRAPHY } from '../constants/theme';
import type { Session } from '../types';

interface RecentSessionsListProps {
  sessions: Session[];
}

export const RecentSessionsList = memo(function RecentSessionsList({ sessions }: RecentSessionsListProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const renderSession = useCallback(({ item }: { item: Session }) => {
    const displayDate = item.completedAt || item.scheduledAt;
    const isCompleted = !!item.completedAt;

    return (
      <View 
        style={[
          styles.sessionItem, 
          { 
            backgroundColor: colors.background.tertiary,
            borderLeftColor: isCompleted ? colors.success : colors.warning,
          }
        ]}
      >
        <View style={styles.sessionRow}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={isCompleted ? "checkmark-circle" : "time-outline"} 
              size={24} 
              color={isCompleted ? colors.success : colors.warning} 
            />
          </View>
          
          <View style={styles.sessionContent}>
            <Text style={[styles.sessionTitle, { color: colors.text.primary }]}>
              {item.name}
            </Text>
            <Text style={[styles.sessionDate, { color: colors.text.secondary }]}>
              {format(displayDate, "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
            </Text>
            {item.notes && (
              <Text style={[styles.sessionNotes, { color: colors.text.tertiary }]} numberOfLines={1}>
                {item.notes}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }, [colors, isDark]);

  if (!sessions || sessions.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background.secondary }]}>
        <Ionicons name="calendar-outline" size={48} color={colors.text.tertiary} />
        <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
          Nenhuma sessão recente
        </Text>
      </View>
    );
  }

  return (
    <View style={{ minHeight: 200, backgroundColor: colors.background.primary }}>
      <FlashList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={renderSession}
        estimatedItemSize={100}
        scrollEnabled={false}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.size.base,
    marginTop: SPACING.md,
  },
  sessionItem: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: SPACING.md,
  },
  sessionContent: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
    marginBottom: 2,
  },
  sessionDate: {
    fontSize: TYPOGRAPHY.size.sm,
    marginBottom: 2,
  },
  sessionNotes: {
    fontSize: TYPOGRAPHY.size.xs,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
