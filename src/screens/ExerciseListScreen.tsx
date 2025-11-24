import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, SyncStatusIndicator } from '../components';
import { SPACING, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { getMuscleGroupLabel } from '../constants';
import { useTheme } from '../contexts/ThemeContext';
import { storageService } from '../services/storage';
import type { Session, Exercise } from '../models';

interface ExerciseListScreenProps {
  session: Session;
  onCreateExercise: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  onBack: () => void;
}

export function ExerciseListScreen({
  session,
  onCreateExercise,
  onSelectExercise,
  onBack,
}: ExerciseListScreenProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadExercises = useCallback(async () => {
    try {
      const data = await storageService.getExercisesBySession(session.id);
      setExercises(data);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [session.id]);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadExercises();
  };

  const renderItem = ({ item, index }: { item: Exercise; index: number }) => {
    return (
      <TouchableOpacity onPress={() => onSelectExercise(item)}>
        <Card style={styles.exerciseCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.orderBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.orderText}>{index + 1}</Text>
            </View>
            <View style={styles.exerciseInfo}>
              <Text style={[styles.exerciseName, { color: colors.text.primary }]}>{item.name}</Text>
              {item.muscleGroup && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <Ionicons name="body" size={14} color={colors.text.secondary} style={{ marginRight: 4 }} />
                  <Text style={[styles.muscleGroup, { color: colors.text.secondary }]}>{getMuscleGroupLabel(item.muscleGroup)}</Text>
                </View>
              )}
              {item.equipmentType && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="barbell-outline" size={14} color={colors.text.secondary} style={{ marginRight: 4 }} />
                  <Text style={[styles.equipment, { color: colors.text.secondary }]}>{item.equipmentType}</Text>
                </View>
              )}
            </View>
            <SyncStatusIndicator needsSync={item.needsSync} variant="icon-only" size="small" />
          </View>

          {item.notes && (
            <Text style={[styles.exerciseNotes, { color: colors.text.secondary }]} numberOfLines={2}>
              {item.notes}
            </Text>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border }]}>
        <Button title="Voltar" onPress={onBack} variant="outline" size="small" />
        <Text style={[styles.sessionName, { color: colors.text.secondary }]} numberOfLines={1}>
          {session.name}
        </Text>
      </View>

      <View style={styles.titleRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="fitness" size={24} color={colors.primary} style={{ marginRight: SPACING.sm }} />
          <Text style={[styles.title, { color: colors.text.primary }]}>Exercícios</Text>
        </View>
        <Button
          title="Novo"
          onPress={onCreateExercise}
          size="small"
        />
      </View>

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>Carregando...</Text>
        </View>
      ) : exercises.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="barbell-outline" size={64} color={colors.text.tertiary} style={{ marginBottom: SPACING.md }} />
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>Nenhum exercício ainda</Text>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            Adicione exercícios para esta sessão de treino!
          </Text>
          <Button
            title="Adicionar Exercício"
            onPress={onCreateExercise}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <FlatList
          data={exercises}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    gap: SPACING.md,
  },
  sessionName: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.size['2xl'],
    fontWeight: TYPOGRAPHY.weight.bold as any,
  },
  list: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  exerciseCard: {
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  orderBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.bold as any,
    color: '#fff',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
    marginBottom: SPACING.xs,
  },
  muscleGroup: {
    fontSize: TYPOGRAPHY.size.sm,
  },
  equipment: {
    fontSize: TYPOGRAPHY.size.sm,
  },
  exerciseNotes: {
    fontSize: TYPOGRAPHY.size.sm,
    marginTop: SPACING.sm,
    marginLeft: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
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
