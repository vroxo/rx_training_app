import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

interface DayStatus {
  day: string;
  status: 'completed' | 'today-pending' | 'missed' | 'upcoming';
}

interface WeekFrequencyProps {
  weekData: DayStatus[];
}

export function WeekFrequency({ weekData }: WeekFrequencyProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const getStatusIcon = (status: DayStatus['status']) => {
    switch (status) {
      case 'completed':
        return <Ionicons name="checkmark" size={18} color={colors.success} />;
      case 'today-pending':
        return <Ionicons name="alert" size={18} color={colors.warning} />;
      case 'missed':
        return <Ionicons name="close" size={18} color={colors.error} />;
      case 'upcoming':
        return null;
    }
  };

  const getCircleStyle = (status: DayStatus['status']) => {
    const baseStyle = [styles.circle, { borderColor: colors.primary }];
    
    switch (status) {
      case 'completed':
        return [...baseStyle, { backgroundColor: colors.success + '20', borderColor: colors.success }];
      case 'today-pending':
        return [...baseStyle, { backgroundColor: colors.warning + '20', borderColor: colors.warning }];
      case 'missed':
        return [...baseStyle, { backgroundColor: colors.error + '20', borderColor: colors.error }];
      case 'upcoming':
        return [...baseStyle, { backgroundColor: 'transparent' }];
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text.primary }]}>Frequência de Treinos</Text>
      
      <View style={styles.weekContainer}>
        {weekData.map((dayData, index) => (
          <View key={index} style={styles.dayContainer}>
            <View style={getCircleStyle(dayData.status)}>
              {getStatusIcon(dayData.status)}
            </View>
            <Text style={[styles.dayLabel, { color: colors.text.secondary }]}>
              {dayData.day}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xs,
  },
  title: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.bold as any,
    marginBottom: SPACING.md,
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dayContainer: {
    alignItems: 'center',
    flex: 1,
    minWidth: 40,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  dayLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.medium as any,
  },
});

