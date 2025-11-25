import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, PeriodizationChartsModal, SyncStatusIndicator } from '../components';
import { SPACING, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { storageService } from '../services/storage';
import { toast } from '../services/toast';
import { useAuth } from '../hooks';
import type { Periodization, Session, Exercise } from '../models';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PeriodizationFormScreen } from './PeriodizationFormScreen';
import { PeriodizationDetailScreen } from './PeriodizationDetailScreen';
import { SessionListScreen } from './SessionListScreen';
import { SessionFormScreen } from './SessionFormScreen';
import { SessionDetailScreen } from './SessionDetailScreen';
import { ExerciseListScreen } from './ExerciseListScreen';
import { ExerciseFormScreen } from './ExerciseFormScreen';
import { ExerciseDetailScreen } from './ExerciseDetailScreen';

type Screen = 'list' | 'form' | 'detail' | 'sessions' | 'sessionForm' | 'sessionDetail' | 'exercises' | 'exerciseForm' | 'exerciseDetail';
type SelectedSession = Session | undefined;
type SelectedExercise = Exercise | undefined;

export function PeriodizationsScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [screen, setScreen] = useState<Screen>('list');
  const [periodizations, setPeriodizations] = useState<Periodization[]>([]);
  const [selectedPeriodization, setSelectedPeriodization] = useState<Periodization | undefined>();
  const [selectedSession, setSelectedSession] = useState<SelectedSession>();
  const [selectedExercise, setSelectedExercise] = useState<SelectedExercise>();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chartsModalVisible, setChartsModalVisible] = useState(false);
  const [selectedPeriodizationForCharts, setSelectedPeriodizationForCharts] = useState<Periodization | undefined>();

  const loadPeriodizations = useCallback(async () => {
    if (!user) return;
    
    try {
      const data = await storageService.getPeriodizationsByUser(user.id);
      setPeriodizations(data);
    } catch (error) {
      console.error('Error loading periodizations:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadPeriodizations();
  }, [loadPeriodizations]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPeriodizations();
  };

  const handleCreateSuccess = () => {
    setScreen('list');
    loadPeriodizations();
  };

  const handleEditSuccess = () => {
    setScreen('list');
    setSelectedPeriodization(undefined);
    loadPeriodizations();
  };

  const handleDelete = () => {
    setScreen('list');
    setSelectedPeriodization(undefined);
    loadPeriodizations();
  };

  const handleDeletePeriodization = async (periodizationId: string, periodizationName: string) => {
    Alert.alert(
      'Excluir Periodização',
      `Tem certeza que deseja excluir "${periodizationName}"? Esta ação não pode ser desfeita.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.deletePeriodization(periodizationId);
              await loadPeriodizations();
              toast.success('Periodização excluída!');
            } catch (error) {
              console.error('Error deleting periodization:', error);
              toast.error('Erro ao excluir periodização');
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    setScreen('form');
  };

  const handleViewSessions = () => {
    setScreen('sessions');
  };

  const handleCreateSession = () => {
    setSelectedSession(undefined);
    setScreen('sessionForm');
  };

  const handleSelectSession = (session: Session) => {
    setSelectedSession(session);
    setScreen('sessionDetail');
  };

  const handleSelectSessionById = async (sessionId: string) => {
    try {
      const session = await storageService.getSessionById(sessionId);
      if (session) {
        setSelectedSession(session);
        setScreen('sessionDetail');
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const handleEditSession = () => {
    setScreen('sessionForm');
  };

  const handleSessionFormSuccess = () => {
    setScreen('detail');
    setSelectedSession(undefined);
  };

  const handleSessionDelete = () => {
    setScreen('detail');
    setSelectedSession(undefined);
  };

  const handleCreateExercise = () => {
    setSelectedExercise(undefined);
    setScreen('exerciseForm');
  };

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setScreen('exerciseDetail');
  };

  const handleSelectExerciseById = async (exerciseId: string) => {
    try {
      const exercise = await storageService.getExerciseById(exerciseId);
      if (exercise) {
        setSelectedExercise(exercise);
        setScreen('exerciseDetail');
      }
    } catch (error) {
      console.error('Error loading exercise:', error);
    }
  };

  const handleEditExercise = async (exerciseId: string) => {
    try {
      const exercise = await storageService.getExerciseById(exerciseId);
      if (exercise) {
        setSelectedExercise(exercise);
        setScreen('exerciseForm');
      }
    } catch (error) {
      console.error('Error loading exercise:', error);
      toast.error('Não foi possível carregar o exercício');
    }
  };

  const handleExerciseFormSuccess = () => {
    setScreen('sessionDetail');
    setSelectedExercise(undefined);
  };

  const handleExerciseDelete = () => {
    setScreen('sessionDetail');
    setSelectedExercise(undefined);
  };

  // ⚠️ renderItem DEVE estar ANTES de todos os returns condicionais (regras dos hooks)
  const renderItem = useCallback(({ item }: { item: Periodization }) => {
    const durationDays = Math.ceil(
      (item.endDate.getTime() - item.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedPeriodization(item);
          setScreen('detail');
        }}
      >
        <Card style={styles.periodizationCard}>
          <View style={styles.cardHeader}>
            <Text style={[styles.periodizationName, { color: colors.text.primary }]}>{item.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedPeriodizationForCharts(item);
                  setChartsModalVisible(true);
                }}
              >
                <Ionicons name="stats-chart" size={22} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedPeriodization(item);
                  setScreen('form');
                }}
              >
                <Ionicons name="create-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeletePeriodization(item.id, item.name);
                }}
              >
                <Ionicons name="trash-outline" size={22} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
          {item.description && (
            <Text style={[styles.periodizationDescription, { color: colors.text.secondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.cardFooter}>
            <Text style={[styles.periodizationDates, { color: colors.text.secondary }]}>
              {format(item.startDate, 'dd/MM/yy', { locale: ptBR })} → {format(item.endDate, 'dd/MM/yy', { locale: ptBR })}
            </Text>
            <Text style={[styles.periodizationDuration, { color: colors.primary }]}>{durationDays} dias</Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  }, [colors, setSelectedPeriodization, setScreen, setSelectedPeriodizationForCharts, setChartsModalVisible]);

  if (screen === 'form') {
    return (
      <PeriodizationFormScreen
        periodization={selectedPeriodization}
        onSuccess={selectedPeriodization ? handleEditSuccess : handleCreateSuccess}
        onCancel={() => {
          setScreen(selectedPeriodization ? 'detail' : 'list');
          if (!selectedPeriodization) {
            setSelectedPeriodization(undefined);
          }
        }}
      />
    );
  }

  if (screen === 'detail' && selectedPeriodization) {
    return (
      <PeriodizationDetailScreen
        periodization={selectedPeriodization}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewSessions={handleViewSessions}
        onViewSessionDetail={handleSelectSessionById}
        onAddSession={handleCreateSession}
        onEditSession={(session) => {
          setSelectedSession(session);
          setScreen('sessionForm');
        }}
        onBack={() => {
          setScreen('list');
          setSelectedPeriodization(undefined);
        }}
      />
    );
  }

  if (screen === 'sessions' && selectedPeriodization) {
    return (
      <SessionListScreen
        periodization={selectedPeriodization}
        onCreateSession={handleCreateSession}
        onSelectSession={handleSelectSession}
        onEditSession={(session) => {
          setSelectedSession(session);
          setScreen('sessionForm');
        }}
        onBack={() => setScreen('detail')}
      />
    );
  }

  if (screen === 'sessionForm' && selectedPeriodization) {
    return (
      <SessionFormScreen
        periodization={selectedPeriodization}
        session={selectedSession}
        onSuccess={handleSessionFormSuccess}
        onCancel={() => {
          setScreen('detail');
          setSelectedSession(undefined);
        }}
      />
    );
  }

  if (screen === 'sessionDetail' && selectedSession) {
    return (
      <SessionDetailScreen
        session={selectedSession}
        onEdit={handleEditSession}
        onDelete={handleSessionDelete}
        onViewExerciseDetail={handleSelectExerciseById}
        onEditExercise={handleEditExercise}
        onAddExercise={handleCreateExercise}
        onBack={() => {
          setScreen('detail');
          setSelectedSession(undefined);
        }}
      />
    );
  }

  if (screen === 'exercises' && selectedSession) {
    return (
      <ExerciseListScreen
        session={selectedSession}
        onCreateExercise={handleCreateExercise}
        onSelectExercise={handleSelectExercise}
        onBack={() => setScreen('sessionDetail')}
      />
    );
  }

  if (screen === 'exerciseForm' && selectedSession) {
    return (
      <ExerciseFormScreen
        session={selectedSession}
        exercise={selectedExercise}
        onSuccess={handleExerciseFormSuccess}
        onCancel={() => {
          setScreen('sessionDetail');
          setSelectedExercise(undefined);
        }}
      />
    );
  }

  if (screen === 'exerciseDetail' && selectedExercise) {
    return (
      <ExerciseDetailScreen
        exercise={selectedExercise}
        onEdit={handleEditExercise}
        onDelete={handleExerciseDelete}
        onBack={() => {
          setScreen('sessionDetail');
          setSelectedExercise(undefined);
        }}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="calendar" size={24} color={colors.primary} style={{ marginRight: SPACING.sm }} />
          <Text style={[styles.title, { color: colors.text.primary }]}>Periodizações</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setSelectedPeriodization(undefined);
            setScreen('form');
          }}
        >
          <Ionicons name="add-circle" size={32} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>Carregando...</Text>
        </View>
      ) : periodizations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={colors.text.tertiary} style={styles.emptyIcon} />
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>Nenhuma periodização ainda</Text>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            Crie sua primeira periodização para começar a treinar!
          </Text>
          <Button
            title="Criar Periodização"
            onPress={() => setScreen('form')}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <FlashList
          data={periodizations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={200}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* Charts Modal */}
      {selectedPeriodizationForCharts && (
        <PeriodizationChartsModal
          visible={chartsModalVisible}
          periodizationId={selectedPeriodizationForCharts.id}
          periodizationName={selectedPeriodizationForCharts.name}
          onClose={() => {
            setChartsModalVisible(false);
            setSelectedPeriodizationForCharts(undefined);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.size['2xl'],
    fontWeight: TYPOGRAPHY.weight.bold as any,
  },
  list: {
    padding: SPACING.lg,
  },
  periodizationCard: {
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  periodizationName: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
    flex: 1,
  },
  periodizationDescription: {
    fontSize: TYPOGRAPHY.size.sm,
    marginBottom: SPACING.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodizationDates: {
    fontSize: TYPOGRAPHY.size.sm,
  },
  periodizationDuration: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.medium as any,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyIcon: {
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.size.base,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  emptyButton: {
    minWidth: 200,
  },
});

