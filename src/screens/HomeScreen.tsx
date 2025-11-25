import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Card, WeekFrequency } from '../components';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useAuth } from '../hooks';
import { 
  statsService, 
  DashboardStats, 
  PersonalRecord, 
  TrainingIntensity, 
  MuscleGroupHighlight, 
  CurrentPeriodization 
} from '../services/stats';
import type { Session } from '../models';
import { startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isPast, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function HomeScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weekSessions, setWeekSessions] = useState<Session[]>([]);
  const [personalRecord, setPersonalRecord] = useState<PersonalRecord | null>(null);
  const [intensity, setIntensity] = useState<TrainingIntensity | null>(null);
  const [muscleHighlight, setMuscleHighlight] = useState<MuscleGroupHighlight | null>(null);
  const [currentPeriodization, setCurrentPeriodization] = useState<CurrentPeriodization | null>(null);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadStats();
        loadWeekSessions();
      }
    }, [user])
  );

  const loadStats = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [data, pr, intensityData, muscleData, periodData] = await Promise.all([
        statsService.getDashboardStats(user.id),
        statsService.getLatestPersonalRecord(user.id),
        statsService.getTrainingIntensity(user.id),
        statsService.getMuscleGroupHighlight(user.id),
        statsService.getCurrentPeriodization(user.id),
      ]);
      
      setStats(data);
      setPersonalRecord(pr);
      setIntensity(intensityData);
      setMuscleHighlight(muscleData);
      setCurrentPeriodization(periodData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWeekSessions = async () => {
    if (!user) return;
    
    try {
      const now = new Date();
      const weekStart = startOfWeek(now, { locale: ptBR });
      const weekEnd = endOfWeek(now, { locale: ptBR });
      
      const sessions = await statsService.getSessionsByDateRange(user.id, weekStart, weekEnd);
      setWeekSessions(sessions);
    } catch (error) {
      console.error('Error loading week sessions:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    await loadWeekSessions();
    setRefreshing(false);
  };

  const getWeekData = () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { locale: ptBR });
    const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(now, { locale: ptBR }) });
    
    const dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    
    return weekDays.map((day, index) => {
      const hasCompletedSession = weekSessions.some(
        session => session.completedAt && isSameDay(new Date(session.completedAt), day)
      );
      
      let status: 'completed' | 'today-pending' | 'missed' | 'upcoming';
      
      if (hasCompletedSession) {
        status = 'completed';
      } else if (isToday(day)) {
        status = 'today-pending';
      } else if (isPast(day)) {
        status = 'missed';
      } else {
        status = 'upcoming';
      }
      
      return {
        day: dayLabels[index],
        status,
      };
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Carregando...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
      }
    >
      <Text style={[styles.welcomeText, { color: colors.text.primary }]}>
        Bem-vindo, {user?.email || 'Atleta'}!
      </Text>

      {/* Motivational Stats Cards */}
      <View style={styles.statsGrid}>
        {/* Personal Record */}
        <Card style={[styles.statCard, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="trophy" size={24} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text.secondary }]}>RECORDE PESSOAL</Text>
          </View>
          {personalRecord ? (
            <>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                {personalRecord.weight}kg
              </Text>
              <Text style={[styles.exerciseName, { color: colors.text.primary }]} numberOfLines={1}>
                {personalRecord.exerciseName}
              </Text>
              <Text style={[styles.improvement, { color: colors.success }]}>
                ↑ +{personalRecord.improvement}kg
              </Text>
            </>
          ) : (
            <Text style={[styles.noDataText, { color: colors.text.tertiary }]}>
              Nenhum recorde nesta periodização
            </Text>
          )}
        </Card>

        {/* Training Intensity */}
        <Card style={[styles.statCard, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="flash" size={24} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text.secondary }]}>INTENSIDADE</Text>
          </View>
          {intensity && intensity.totalSets > 0 ? (
            <>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                RIR {intensity.averageRIR}
              </Text>
              <Text style={[styles.intensityMessage, { color: colors.primary }]}>
                {intensity.message}
              </Text>
            </>
          ) : (
            <Text style={[styles.noDataText, { color: colors.text.tertiary }]}>
              Complete treinos com RIR
            </Text>
          )}
        </Card>
      </View>

      {/* Muscle Group Highlight - Full Width */}
      <Card style={[styles.statCardFullWidth, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="fitness" size={24} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text.secondary }]}>GRUPO DESTAQUE</Text>
        </View>
        {muscleHighlight ? (
          <>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              {muscleHighlight.muscleGroup}
            </Text>
            {muscleHighlight.improvement > 0 ? (
              <Text style={[styles.improvement, { color: colors.success }]}>
                ↑ +{muscleHighlight.improvement}%
              </Text>
            ) : (
              <Text style={[styles.statHint, { color: colors.text.tertiary }]}>
                Mais treinado até agora
              </Text>
            )}
          </>
        ) : (
          <Text style={[styles.noDataText, { color: colors.text.tertiary }]}>
            Complete mais treinos
          </Text>
        )}
      </Card>

      {/* Week Frequency */}
      <Card style={[styles.weekCard, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
        <WeekFrequency weekData={getWeekData()} />
      </Card>

      {/* Periodization Detail Card */}
      {currentPeriodization && (
        <Card style={[styles.periodizationDetailCard, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
          <View style={styles.chartTitleRow}>
            <Ionicons name="calendar-outline" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Periodização Atual
            </Text>
          </View>
          
          <Text style={[styles.periodizationDetailName, { color: colors.text.primary }]}>
            {currentPeriodization.name}
          </Text>
          
          {currentPeriodization.description && (
            <Text style={[styles.periodizationDescription, { color: colors.text.secondary }]}>
              {currentPeriodization.description}
            </Text>
          )}
          
          <View style={styles.periodizationStats}>
            <View style={styles.periodizationStatItem}>
              <Text style={[styles.periodizationStatLabel, { color: colors.text.secondary }]}>Semana</Text>
              <Text style={[styles.periodizationStatValue, { color: colors.primary }]}>
                {currentPeriodization.currentWeek}/{currentPeriodization.totalWeeks}
              </Text>
            </View>
            <View style={styles.periodizationStatItem}>
              <Text style={[styles.periodizationStatLabel, { color: colors.text.secondary }]}>Progresso</Text>
              <Text style={[styles.periodizationStatValue, { color: colors.primary }]}>
                {currentPeriodization.progressPercentage}%
              </Text>
            </View>
            <View style={styles.periodizationStatItem}>
              <Text style={[styles.periodizationStatLabel, { color: colors.text.secondary }]}>Restam</Text>
              <Text style={[styles.periodizationStatValue, { color: colors.primary }]}>
                {currentPeriodization.daysRemaining} dias
              </Text>
            </View>
          </View>
          
          <View style={[styles.progressBarLarge, { backgroundColor: colors.background.primary }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: colors.primary,
                  width: `${currentPeriodization.progressPercentage}%`
                }
              ]} 
            />
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.size.base,
  },
  welcomeText: {
    fontSize: TYPOGRAPHY.size['2xl'],
    fontWeight: TYPOGRAPHY.weight.bold as any,
    marginBottom: SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    padding: SPACING.md,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  statCardFullWidth: {
    width: '100%',
    padding: SPACING.md,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: TYPOGRAPHY.size['2xl'],
    fontWeight: TYPOGRAPHY.weight.bold as any,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  exerciseName: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.medium as any,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  improvement: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
    marginBottom: SPACING.xs,
  },
  intensityMessage: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.medium as any,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  periodizationName: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  weekProgress: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.medium as any,
    marginBottom: SPACING.sm,
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statHint: {
    fontSize: TYPOGRAPHY.size.xs,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: TYPOGRAPHY.size.sm,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.size.sm,
    marginTop: SPACING.xs,
  },
  weekCard: {
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  periodizationDetailCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  periodizationDetailName: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold as any,
    marginBottom: SPACING.sm,
  },
  periodizationDescription: {
    fontSize: TYPOGRAPHY.size.sm,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  periodizationStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  periodizationStatItem: {
    alignItems: 'center',
  },
  periodizationStatLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    marginBottom: SPACING.xs,
  },
  periodizationStatValue: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
  },
  progressBarLarge: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  chartCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  chartHeader: {
    marginBottom: SPACING.md,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
  },
  exerciseSelectorContainer: {
    marginBottom: SPACING.md,
  },
  exerciseScroll: {
    flexDirection: 'row',
  },
  exerciseButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    marginRight: SPACING.xs,
    borderWidth: 1,
  },
  exerciseButtonText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.medium as any,
  },
  emptyChart: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyChartText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.size.base,
    textAlign: 'center',
  },
});
