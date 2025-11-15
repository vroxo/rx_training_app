import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryTheme, VictoryTooltip, VictoryVoronoiContainer, VictoryScatter } from 'victory';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../constants/theme';

interface VolumeChartProps {
  dates: Date[];
  values: number[];
  yAxisLabel?: string;
}

export function VolumeChart({ dates, values, yAxisLabel = 'Volume (kg)' }: VolumeChartProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { width } = Dimensions.get('window');
  const chartWidth = Math.min(width - 48, 600);

  // Handle empty data
  if (dates.length === 0 || values.length === 0) {
    return null;
  }

  // Check if all values are zero or near zero
  const maxValue = Math.max(...values);
  const hasValidData = maxValue > 0;

  // Handle single data point - create a 5-day range
  let chartData;
  let tickDates;
  
  if (dates.length === 1) {
    // Create a 5-day range starting from the single date
    const baseDate = dates[0];
    chartData = [
      { x: baseDate, y: values[0] },
      { x: addDays(baseDate, 1), y: null },
      { x: addDays(baseDate, 2), y: null },
      { x: addDays(baseDate, 3), y: null },
      { x: addDays(baseDate, 4), y: null },
    ];
    tickDates = chartData.map(d => d.x);
  } else {
    // Normal case: convert to Victory data format
    chartData = dates.map((date, index) => ({
      x: date,
      y: values[index],
    }));
    tickDates = dates;
  }

  // Set Y axis domain
  let yAxisDomain;
  if (!hasValidData) {
    // Default domain when no valid data
    yAxisDomain = [0, 25];
  } else {
    // Auto domain with some padding
    yAxisDomain = [0, maxValue * 1.2];
  }

  return (
    <View style={styles.container}>
      <VictoryChart
        width={chartWidth}
        height={300}
        theme={VictoryTheme.material}
        domain={{ y: yAxisDomain }}
        containerComponent={
          <VictoryVoronoiContainer
            labels={({ datum }) => {
              if (datum.y === null || datum.y === undefined) return '';
              return `${format(datum.x, 'dd/MM', { locale: ptBR })}\n${datum.y}kg`;
            }}
            labelComponent={
              <VictoryTooltip
                style={{ fill: colors.text.primary }}
                flyoutStyle={{
                  stroke: colors.border,
                  fill: colors.background.secondary,
                }}
              />
            }
          />
        }
      >
        <VictoryAxis
          tickValues={tickDates}
          tickFormat={(date) => format(date, 'dd/MM', { locale: ptBR })}
          style={{
            axis: { stroke: colors.border },
            tickLabels: { fill: colors.text.secondary, fontSize: 10 },
            grid: { stroke: colors.border, strokeDasharray: '4,4' },
          }}
        />
        <VictoryAxis
          dependentAxis
          label={yAxisLabel}
          tickValues={!hasValidData ? [0, 5, 10, 15, 20, 25] : undefined}
          style={{
            axis: { stroke: colors.border },
            axisLabel: { fill: colors.text.secondary, fontSize: 12, padding: 35 },
            tickLabels: { fill: colors.text.secondary, fontSize: 10 },
            grid: { stroke: colors.border, strokeDasharray: '4,4' },
          }}
        />
        
        {/* Line connecting points (only for valid data) */}
        {dates.length > 1 && (
          <VictoryLine
            data={chartData.filter(d => d.y !== null)}
            style={{
              data: { stroke: colors.primary, strokeWidth: 3 },
            }}
          />
        )}
        
        {/* Scatter points for actual data */}
        <VictoryScatter
          data={chartData.filter(d => d.y !== null)}
          size={6}
          style={{
            data: { fill: colors.primary },
          }}
        />
      </VictoryChart>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
