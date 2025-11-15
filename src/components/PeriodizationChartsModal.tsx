import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors, SPACING, TYPOGRAPHY } from '../constants/theme';
import { VolumeChart } from './VolumeChart';
import { statsService } from '../services/stats';
import { toast } from '../services/toast';

interface PeriodizationChartsModalProps {
  visible: boolean;
  periodizationId: string;
  periodizationName: string;
  onClose: () => void;
}

export function PeriodizationChartsModal({
  visible,
  periodizationId,
  periodizationName,
  onClose,
}: PeriodizationChartsModalProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [loading, setLoading] = useState(true);
  const [progressionData, setProgressionData] = useState<
    Map<string, { dates: Date[]; maxWeights: number[]; sessionNames: string[] }>
  >(new Map());

  useEffect(() => {
    if (visible) {
      loadProgressionData();
    }
  }, [visible, periodizationId]);

  const loadProgressionData = async () => {
    try {
      setLoading(true);
      const data = await statsService.getPeriodizationExerciseProgression(periodizationId);
      setProgressionData(data);
    } catch (error) {
      console.error('Error loading progression data:', error);
      toast.error('Erro ao carregar dados de progressão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Ionicons name="trending-up" size={24} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Progressão de Carga
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Periodization Name */}
        <View style={styles.periodizationInfo}>
          <Text style={[styles.periodizationName, { color: colors.text.secondary }]}>
            {periodizationName}
          </Text>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
                Carregando dados...
              </Text>
            </View>
          ) : progressionData.size === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="bar-chart-outline" size={64} color={colors.text.tertiary} />
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                Nenhum dado de progressão disponível
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.text.tertiary }]}>
                Complete sessões com exercícios para ver a progressão
              </Text>
            </View>
          ) : (
            <View style={styles.chartsContainer}>
              {Array.from(progressionData.entries()).map(([exerciseName, data]) => (
                <View
                  key={exerciseName}
                  style={[
                    styles.chartCard,
                    {
                      backgroundColor: colors.background.secondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.chartHeader}>
                    <Ionicons name="barbell-outline" size={20} color={colors.primary} />
                    <Text style={[styles.exerciseName, { color: colors.text.primary }]}>
                      {exerciseName}
                    </Text>
                  </View>
                  
                  <VolumeChart
                    dates={data.dates}
                    values={data.maxWeights}
                    yAxisLabel="Carga Máxima (kg)"
                  />

                  {/* Stats */}
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>
                        Sessões
                      </Text>
                      <Text style={[styles.statValue, { color: colors.text.primary }]}>
                        {data.dates.length}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>
                        Carga Inicial
                      </Text>
                      <Text style={[styles.statValue, { color: colors.text.primary }]}>
                        {data.maxWeights[0]}kg
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>
                        Carga Atual
                      </Text>
                      <Text style={[styles.statValue, { color: colors.success }]}>
                        {data.maxWeights[data.maxWeights.length - 1]}kg
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>
                        Evolução
                      </Text>
                      <Text style={[styles.statValue, { color: colors.primary }]}>
                        +{data.maxWeights[data.maxWeights.length - 1] - data.maxWeights[0]}kg
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold as any,
    marginLeft: SPACING.sm,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  periodizationInfo: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  periodizationName: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 3,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.size.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 3,
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.size.md,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  chartsContainer: {
    padding: SPACING.lg,
  },
  chartCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  exerciseName: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.bold as any,
    marginLeft: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: TYPOGRAPHY.size.sm,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.bold as any,
  },
});

