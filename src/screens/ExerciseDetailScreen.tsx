import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button } from '../components';
import { SPACING, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { getMuscleGroupLabel } from '../constants';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from '../services/toast';
import { storageService } from '../services/storage';
import type { Exercise, Set as SetType } from '../models';
import { v4 as uuidv4 } from 'uuid';

interface ExerciseDetailScreenProps {
  exercise: Exercise;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

export function ExerciseDetailScreen({
  exercise,
  onEdit,
  onDelete,
  onBack,
}: ExerciseDetailScreenProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [sets, setSets] = useState<SetType[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingSet, setIsAddingSet] = useState(false);
  const [newSetWeight, setNewSetWeight] = useState('');
  const [newSetReps, setNewSetReps] = useState('');
  const [newSetRestTime, setNewSetRestTime] = useState('60');

  const loadSets = useCallback(async () => {
    try {
      const data = await storageService.getSetsByExercise(exercise.id);
      setSets(data);
    } catch (error) {
      console.error('Error loading sets:', error);
    }
  }, [exercise.id]);

  useEffect(() => {
    loadSets();
  }, [loadSets]);

  const handleDelete = async () => {
    Alert.alert(
      'Excluir Exercício',
      'Tem certeza que deseja excluir este exercício? Todas as séries serão perdidas.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await storageService.deleteExercise(exercise.id);
              toast.success('Exercício excluído!');
              onDelete();
            } catch (error) {
              console.error('Error deleting exercise:', error);
              toast.error('Não foi possível excluir o exercício');
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleAddSet = async () => {
    const weight = parseFloat(newSetWeight) || undefined;
    const reps = parseInt(newSetReps, 10) || undefined;
    const restTime = parseInt(newSetRestTime, 10) || 60;

    if (!weight && !reps) {
      toast.warning('Preencha pelo menos peso ou repetições');
      return;
    }

    try {
      await storageService.createSet({
        exerciseId: exercise.id,
        orderIndex: sets.length,
        weight,
        repetitions: reps,
        restTime,
        duration: undefined,
        completedAt: null,
        notes: undefined,
        syncedAt: null,
      });

      await loadSets();
      
      setNewSetWeight('');
      setNewSetReps('');
      setIsAddingSet(false);
      
      toast.success('Série adicionada!');
    } catch (error) {
      console.error('Error adding set:', error);
      toast.error('Não foi possível adicionar a série');
    }
  };

  const handleCopyLastSet = async () => {
    if (sets.length === 0) {
      toast.warning('Nenhuma série para copiar');
      return;
    }

    const lastSet = sets[sets.length - 1];
    
    try {
      await storageService.createSet({
        exerciseId: exercise.id,
        orderIndex: sets.length,
        weight: lastSet.weight,
        repetitions: lastSet.repetitions,
        duration: lastSet.duration,
        restTime: lastSet.restTime,
        completedAt: null,
        notes: undefined,
        syncedAt: null,
      });

      await loadSets();
      
      toast.success('Série copiada!');
    } catch (error) {
      console.error('Error copying set:', error);
      toast.error('Não foi possível copiar a série');
    }
  };

  const handleToggleSetComplete = async (set: SetType) => {
    try {
      await storageService.updateSet(set.id, {
        completedAt: set.completedAt ? null : new Date(),
        needsSync: true,
      });
      await loadSets();
    } catch (error) {
      console.error('Error toggling set completion:', error);
    }
  };

  const handleDeleteSet = async (set: SetType) => {
    Alert.alert(
      'Excluir Série',
      'Tem certeza que deseja excluir esta série?',
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
              await storageService.deleteSet(set.id);
              await loadSets();
              toast.success('Série excluída!');
            } catch (error) {
              console.error('Error deleting set:', error);
              toast.error('Não foi possível excluir a série');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background.secondary }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Button title="Voltar" onPress={onBack} variant="outline" size="small" />
      </View>

      <Text style={[styles.title, { color: colors.text.primary }]}>{exercise.name}</Text>

      <Card style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
          <Ionicons name="information-circle" size={24} color={colors.primary} style={{ marginRight: SPACING.sm }} />
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Informações</Text>
        </View>
        
        {exercise.muscleGroup && (
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>Grupo Muscular:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="body" size={16} color={colors.text.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.value, { color: colors.text.primary }]}>{getMuscleGroupLabel(exercise.muscleGroup)}</Text>
            </View>
          </View>
        )}

        {exercise.equipmentType && (
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>Equipamento:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="barbell-outline" size={16} color={colors.text.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.value, { color: colors.text.primary }]}>{exercise.equipmentType}</Text>
            </View>
          </View>
        )}

        {exercise.notes && (
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>Observações:</Text>
            <Text style={[styles.value, { color: colors.text.primary }]}>{exercise.notes}</Text>
          </View>
        )}
      </Card>

      <Card style={styles.card}>
        <View style={styles.setsHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="list" size={24} color={colors.primary} style={{ marginRight: SPACING.sm }} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Séries ({sets.length})</Text>
          </View>
          {sets.length > 0 && (
            <Button
              title="Copiar Última"
              onPress={handleCopyLastSet}
              size="small"
              variant="secondary"
            />
          )}
        </View>

        {sets.map((set, index) => (
          <View key={set.id} style={[styles.setRow, { backgroundColor: colors.background.secondary }]}>
            <TouchableOpacity
              style={[styles.setCheckbox, { backgroundColor: colors.primary }]}
              onPress={() => handleToggleSetComplete(set)}
            >
              <Text style={styles.setNumber}>{index + 1}</Text>
              {set.completedAt && (
                <Ionicons 
                  name="checkmark-circle" 
                  size={24} 
                  color={colors.success} 
                  style={{ position: 'absolute', top: -4, right: -4 }} 
                />
              )}
            </TouchableOpacity>

            <View style={styles.setInfo}>
              {set.weight && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="barbell" size={14} color={colors.text.primary} style={{ marginRight: 4 }} />
                  <Text style={[styles.setValue, { color: colors.text.primary }]}>
                    {set.weight} kg
                  </Text>
                </View>
              )}
              {set.repetitions && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="repeat" size={14} color={colors.text.primary} style={{ marginRight: 4 }} />
                  <Text style={[styles.setValue, { color: colors.text.primary }]}>
                    {set.repetitions} reps
                  </Text>
                </View>
              )}
              {set.duration && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="timer-outline" size={14} color={colors.text.primary} style={{ marginRight: 4 }} />
                  <Text style={[styles.setValue, { color: colors.text.primary }]}>
                    {set.duration}s
                  </Text>
                </View>
              )}
            </View>

            {set.restTime && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="pause-outline" size={14} color={colors.text.secondary} style={{ marginRight: 4 }} />
                <Text style={[styles.restTime, { color: colors.text.secondary }]}>
                  {set.restTime}s
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => handleDeleteSet(set)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}

        {isAddingSet ? (
          <View style={[styles.addSetForm, { backgroundColor: colors.background.secondary }]}>
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Peso (kg)</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.background.primary, 
                    borderColor: colors.border, 
                    color: colors.text.primary 
                  }]}
                  placeholder="0"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="numeric"
                  value={newSetWeight}
                  onChangeText={setNewSetWeight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Reps</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.background.primary, 
                    borderColor: colors.border, 
                    color: colors.text.primary 
                  }]}
                  placeholder="0"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="numeric"
                  value={newSetReps}
                  onChangeText={setNewSetReps}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Descanso (s)</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.background.primary, 
                    borderColor: colors.border, 
                    color: colors.text.primary 
                  }]}
                  placeholder="60"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="numeric"
                  value={newSetRestTime}
                  onChangeText={setNewSetRestTime}
                />
              </View>
            </View>

            <View style={styles.formButtons}>
              <Button
                title="Adicionar"
                onPress={handleAddSet}
                size="small"
                fullWidth
              />
              <Button
                title="Cancelar"
                onPress={() => {
                  setIsAddingSet(false);
                  setNewSetWeight('');
                  setNewSetReps('');
                  setNewSetRestTime('60');
                }}
                variant="outline"
                size="small"
                fullWidth
              />
            </View>
          </View>
        ) : (
          <Button
            title="Adicionar Série"
            onPress={() => setIsAddingSet(true)}
            variant="outline"
            fullWidth
            style={styles.addButton}
          />
        )}
      </Card>

      <View style={styles.actions}>
        <Button
          title="Editar Exercício"
          onPress={onEdit}
          variant="secondary"
          fullWidth
        />
        <Button
          title="Excluir Exercício"
          onPress={handleDelete}
          variant="danger"
          loading={isDeleting}
          disabled={isDeleting}
          fullWidth
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.size['3xl'],
    fontWeight: TYPOGRAPHY.weight.bold as any,
    marginBottom: SPACING.xl,
  },
  card: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
  },
  infoRow: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: TYPOGRAPHY.size.sm,
    marginBottom: SPACING.xs,
  },
  value: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.medium as any,
  },
  setsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  setCheckbox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  setNumber: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.bold as any,
    color: '#fff',
  },
  setInfo: {
    flex: 1,
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  setValue: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.medium as any,
  },
  restTime: {
    fontSize: TYPOGRAPHY.size.sm,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  addSetForm: {
    padding: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    marginBottom: SPACING.xs,
    fontWeight: TYPOGRAPHY.weight.medium as any,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.sm,
    fontSize: TYPOGRAPHY.size.base,
    textAlign: 'center',
  },
  formButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  addButton: {
    marginTop: SPACING.md,
  },
  actions: {
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
});
