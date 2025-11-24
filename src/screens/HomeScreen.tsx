import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Card, WeekFrequency, RecentSessionsList } from '../components';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useAuth } from '../hooks';
import { statsService, DashboardStats } from '../services/stats';
import type { Session } from '../models';
import { startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSyncStore } from '../stores/syncStore';

export function HomeScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { lastSyncedAt } = useSyncStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [weekSessions, setWeekSessions] = useState<Session[]>([]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadStats();
        loadRecentSessions();
        loadWeekSessions();
      }
    }, [user])
  );

  // Reload data when sync completes
  useEffect(() => {
    if (user && lastSyncedAt) {
      console.log('🔄 [HOME] Recarregando dados após sync em:', lastSyncedAt);
      loadStats();
      loadRecentSessions();
      loadWeekSessions();
    }
  }, [lastSyncedAt, user]);

  const loadStats = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await statsService.getDashboardStats(user.id);
      setStats(data);
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

  const loadRecentSessions = async () => {
    if (!user) return;
    
    try {
      const sessions = await statsService.getRecentSessions(user.id, 5);
      setRecentSessions(sessions);
    } catch (error) {
      console.error('Error loading recent sessions:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    await loadRecentSessions();
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

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <Card style={[styles.statCard, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
          <Ionicons name="barbell" size={32} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {stats?.totalSessions || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Treinos
          </Text>
        </Card>

        <Card style={[styles.statCard, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
          <Ionicons name="flame" size={32} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {stats?.totalExercises || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Exercícios
          </Text>
        </Card>

        <Card style={[styles.statCard, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
          <Ionicons name="fitness" size={32} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {stats?.totalSets || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Volume
          </Text>
        </Card>

        <Card style={[styles.statCard, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
          <Ionicons name="analytics" size={32} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {(stats?.totalVolume || 0).toLocaleString('pt-BR')}kg
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Carga Total
          </Text>
        </Card>
      </View>

      {/* Week Frequency */}
      <Card style={[styles.weekCard, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
        <WeekFrequency weekData={getWeekData()} />
      </Card>

      {/* Recent Sessions */}
      <Card style={[styles.recentSessionsCard, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
        <View style={styles.chartTitleRow}>
          <Ionicons name="calendar" size={24} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Sessões Recentes
          </Text>
        </View>
        <RecentSessionsList sessions={recentSessions} />
      </Card>
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
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    padding: SPACING.md,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  statValue: {
    fontSize: TYPOGRAPHY.size['2xl'],
    fontWeight: TYPOGRAPHY.weight.bold as any,
    marginTop: SPACING.sm,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.size.sm,
    marginTop: SPACING.xs,
  },
  weekCard: {
    padding: SPACING.sm,
    marginBottom: SPACING.xl,
    borderRadius: 12,
    borderWidth: 1,
  },
  recentSessionsCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
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
