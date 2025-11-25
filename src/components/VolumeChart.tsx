import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors, SPACING, TYPOGRAPHY } from '../constants/theme';

interface VolumeChartProps {
  dates: Date[];
  values: number[];
  reps?: number[];
  yAxisLabel?: string;
}

export function VolumeChart({ dates, values, reps = [], yAxisLabel = 'Volume (kg)' }: VolumeChartProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const screenWidth = Dimensions.get('window').width;

  // Handle empty data
  if (dates.length === 0 || values.length === 0) {
    return null;
  }

  // Calculate stats
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;

  // Use only real data points
  const chartLabels = dates.map((date) => format(date, 'dd/MM', { locale: ptBR }));

  // Prepare chart data - ONLY real session data
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        data: values,
        color: (opacity = 1) => colors.primary,
        strokeWidth: 3,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: colors.background.secondary,
    backgroundGradientFrom: colors.background.secondary,
    backgroundGradientTo: colors.background.secondary,
    decimalPlaces: 1,
    color: (opacity = 1) => colors.primary,
    labelColor: (opacity = 1) => colors.text.secondary,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
      fill: colors.background.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '', // solid lines
      stroke: colors.border,
      strokeWidth: 1,
    },
    segments: 4, // 4 segmentos = 5 linhas horizontais
  };

  return (
    <View style={styles.container}>
      <View style={[styles.statsContainer, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.text.secondary }]}>{yAxisLabel}</Text>
        
        {/* Stats summary */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Máximo</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>{maxValue.toFixed(1)}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Média</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{avgValue.toFixed(1)}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Mínimo</Text>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>{minValue.toFixed(1)}</Text>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={screenWidth - 80}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines
            withOuterLines
            withVerticalLines={false}
            withHorizontalLines
            withDots
            withShadow={false}
            yAxisSuffix=" kg"
            yAxisInterval={1}
            fromZero={false}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    width: '100%',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  label: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.bold as any,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  chart: {
    borderRadius: 12,
  },
});
