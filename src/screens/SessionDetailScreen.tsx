import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, RestTimerModal } from '../components';
import { SPACING, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from '../services/toast';
import { storageService } from '../services/storage';
import type { Session, Exercise, Set } from '../models';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calculateRPEFromRIR, getRPELabel } from '../utils/rpe';

interface SessionDetailScreenProps {
  session: Session;
  onEdit: () => void;
  onDelete: () => void;
  onViewExerciseDetail: (exerciseId: string) => void;
  onAddExercise: () => void;
  onBack: () => void;
}

export function SessionDetailScreen({
  session,
  onEdit,
  onDelete,
  onViewExerciseDetail,
  onAddExercise,
  onBack,
}: SessionDetailScreenProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [exerciseSets, setExerciseSets] = useState<Record<string, Set[]>>({});
  const [loadingSets, setLoadingSets] = useState<Record<string, boolean>>({});
  const [editingSet, setEditingSet] = useState<{ exerciseId: string; setId: string; isNew?: boolean } | null>(null);
  const [editValues, setEditValues] = useState<{ weight: string; reps: string; rest: string; rir: string }>({ weight: '', reps: '', rest: '', rir: '' });
  const [tempSetId, setTempSetId] = useState<string>(''); // ID temporário para série nova
  const [timerModalVisible, setTimerModalVisible] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60);
  
  // Refs para manter os valores atuais mesmo durante re-renders
  const editingSetRef = useRef<{ exerciseId: string; setId: string; isNew?: boolean } | null>(null);
  const tempSetIdRef = useRef<string>('');
  
  // Sincroniza refs com estados
  useEffect(() => {
    editingSetRef.current = editingSet;
    tempSetIdRef.current = tempSetId;
  }, [editingSet, tempSetId]);

  useEffect(() => {
    loadExercises();
  }, [session.id]);

  const loadExercises = async () => {
    try {
      setLoadingExercises(true);
      const exercisesList = await storageService.getExercisesBySession(session.id);
      setExercises(exercisesList);
    } catch (error) {
      console.error('Error loading exercises:', error);
      toast.error('Erro ao carregar exercícios');
    } finally {
      setLoadingExercises(false);
    }
  };

  const loadSets = async (exerciseId: string) => {
    try {
      setLoadingSets(prev => ({ ...prev, [exerciseId]: true }));
      const sets = await storageService.getSetsByExercise(exerciseId);
      
      // Filtra séries inválidas (sem ID)
      const validSets = sets.filter(set => set.id);
      
      setExerciseSets(prev => ({ ...prev, [exerciseId]: validSets }));
    } catch (error) {
      console.error('Error loading sets:', error);
      toast.error('Erro ao carregar séries');
    } finally {
      setLoadingSets(prev => ({ ...prev, [exerciseId]: false }));
    }
  };

  const toggleExercise = async (exerciseId: string) => {
    const newExpanded = new Set(expandedExercises);
    if (newExpanded.has(exerciseId)) {
      newExpanded.delete(exerciseId);
    } else {
      newExpanded.add(exerciseId);
      // Carrega as séries se ainda não foram carregadas
      if (!exerciseSets[exerciseId]) {
        await loadSets(exerciseId);
      }
    }
    setExpandedExercises(newExpanded);
  };

  const handleAddSet = (exerciseId: string) => {
    // Cria uma série temporária no estado (não salva no banco ainda)
    const tempId = `temp-${Date.now()}`;
    const existingSets = exerciseSets[exerciseId] || [];
    const orderIndex = existingSets.length;
    
    const newTempSet: Set = {
      id: tempId,
      userId: session.userId,
      exerciseId,
      orderIndex,
      weight: 0,
      repetitions: 0,
      restTime: 60,
      rir: undefined,
      rpe: undefined,
      notes: undefined,
      completedAt: undefined,
      syncedAt: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      needsSync: true,
    };

    // Adiciona a série temporária à lista
    setExerciseSets(prev => ({
      ...prev,
      [exerciseId]: [...(prev[exerciseId] || []), newTempSet],
    }));

    // Abre em modo de edição marcando como nova
    setTempSetId(tempId);
    startEditingSet(exerciseId, newTempSet, true);
  };

  const handleDeleteSet = async (exerciseId: string, setId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta série?')) {
      return;
    }
    try {
      await storageService.deleteSet(setId);
      await loadSets(exerciseId);
      toast.success('Série excluída!');
    } catch (error) {
      console.error('Error deleting set:', error);
      toast.error('Erro ao excluir série');
    }
  };

  const startEditingSet = (exerciseId: string, set: Set, isNew = false) => {
    setEditingSet({ exerciseId, setId: set.id, isNew });
    setEditValues({
      weight: set.weight.toString(),
      reps: set.repetitions.toString(),
      rest: set.restTime?.toString() || '60',
      rir: set.rir?.toString() || '',
    });
  };

  const cancelEditingSet = () => {
    // Usa refs para ter o valor mais atual, mesmo se o estado foi limpo
    const currentEditingSet = editingSetRef.current;
    const currentTempSetId = tempSetIdRef.current;

    // Se for uma série nova (temporária) que está sendo cancelada, remove do estado
    if (currentEditingSet?.isNew && currentEditingSet.setId === currentTempSetId) {
      setExerciseSets(prev => ({
        ...prev,
        [currentEditingSet.exerciseId]: (prev[currentEditingSet.exerciseId] || []).filter(
          set => set.id !== currentTempSetId
        ),
      }));
      setTempSetId('');
    }
    setEditingSet(null);
    setEditValues({ weight: '', reps: '', rest: '', rir: '' });
  };

  const saveSet = async () => {
    if (!editingSet) return;
    
    try {
      const weight = parseFloat(editValues.weight) || 0;
      const repetitions = parseInt(editValues.reps) || 0;
      const restTime = parseInt(editValues.rest) || 60;
      const rir = editValues.rir ? parseInt(editValues.rir) : undefined;
      const rpe = calculateRPEFromRIR(rir); // Calcula RPE automaticamente a partir do RIR

      if (editingSet.isNew && editingSet.setId === tempSetId) {
        // É uma série nova (temporária) - remove do estado e cria no banco
        const exerciseId = editingSet.exerciseId;
        
        // Remove a série temporária do estado antes de salvar
        const currentSets = exerciseSets[exerciseId] || [];
        const filteredSets = currentSets.filter(set => set.id !== tempSetId);
        setExerciseSets(prev => ({
          ...prev,
          [exerciseId]: filteredSets,
        }));
        
        // Calcula o orderIndex baseado nas séries existentes (excluindo a temporária)
        const orderIndex = filteredSets.length;
        
        // Cria no banco
        await storageService.createSet({
          exerciseId,
          orderIndex,
          weight,
          repetitions,
          restTime,
          rir,
          rpe,
          notes: undefined,
          completedAt: undefined,
          syncedAt: undefined,
          needsSync: true,
        });
        
        setTempSetId('');
        toast.success('Série adicionada!');
        
        // Recarrega as séries do banco
        await loadSets(exerciseId);
      } else {
        // É uma série existente - atualiza no banco
        await storageService.updateSet(editingSet.setId, {
          weight,
          repetitions,
          restTime,
          rir,
          rpe,
          needsSync: true,
        });
        toast.success('Série atualizada!');
        
        // Recarrega as séries do banco
        await loadSets(editingSet.exerciseId);
      }

      setEditingSet(null);
      setEditValues({ weight: '', reps: '', rest: '', rir: '' });
    } catch (error) {
      console.error('Error saving set:', error);
      toast.error('Erro ao salvar série');
    }
  };

  const handleDelete = () => {
    if (!confirm('Tem certeza que deseja excluir esta sessão? Esta ação não pode ser desfeita.')) {
      return;
    }

    setIsDeleting(true);
    storageService.deleteSession(session.id)
      .then(() => {
        toast.success('Sessão excluída!');
        onDelete();
      })
      .catch((error) => {
        console.error('Error deleting session:', error);
        toast.error('Não foi possível excluir a sessão');
        setIsDeleting(false);
      });
  };

  const handleToggleSetComplete = async (setId: string, exerciseId: string, isCompleted: boolean) => {
    try {
      await storageService.updateSet(setId, {
        completedAt: isCompleted ? null : new Date(),
        needsSync: true,
      });
      
      // Recarrega as séries para atualizar a UI
      await loadSets(exerciseId);
      
      toast.success(isCompleted ? 'Série desmarcada!' : 'Série concluída!');
    } catch (error) {
      console.error('Error toggling set completion:', error);
      toast.error('Erro ao atualizar série');
    }
  };

  const handleToggleExerciseComplete = async (exerciseId: string, isCompleted: boolean) => {
    try {
      await storageService.updateExercise(exerciseId, {
        completedAt: isCompleted ? null : new Date(),
        needsSync: true,
      });
      
      // Recarrega os exercícios para atualizar a UI
      await loadExercises();
      
      toast.success(isCompleted ? 'Exercício desmarcado!' : 'Exercício concluído!');
    } catch (error) {
      console.error('Error toggling exercise completion:', error);
      toast.error('Erro ao atualizar exercício');
    }
  };

  const handleStartTimer = (restTime: number) => {
    setTimerSeconds(restTime);
    setTimerModalVisible(true);
  };

  const handleToggleComplete = async () => {
    setIsCompleting(true);
    try {
      if (session.completedAt) {
        await storageService.updateSession(session.id, {
          completedAt: null,
          needsSync: true,
        });
        toast.success('Sessão marcada como não concluída!');
      } else {
        await storageService.updateSession(session.id, {
          completedAt: new Date(),
          needsSync: true,
        });
        toast.success('Sessão marcada como concluída!');
      }
      onBack();
    } catch (error) {
      console.error('Error toggling completion:', error);
      toast.error('Não foi possível atualizar a sessão');
    } finally {
      setIsCompleting(false);
    }
  };

  const isCompleted = !!session.completedAt;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background.secondary }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>{session.name}</Text>
        <Button title="Voltar" onPress={onBack} variant="outline" size="small" />
      </View>

      {isCompleted && (
        <Card style={[styles.card, { backgroundColor: colors.success + '10', borderColor: colors.success, borderWidth: 2 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs }}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} style={{ marginRight: SPACING.sm }} />
            <Text style={[styles.completedTitle, { color: colors.success }]}>Treino Concluído!</Text>
          </View>
          <Text style={[styles.completedText, { color: colors.success }]}>
            {format(session.completedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </Text>
        </Card>
      )}

      <Card style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
          <Ionicons name="information-circle" size={24} color={colors.primary} style={{ marginRight: SPACING.sm }} />
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Informações</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>Data Agendada:</Text>
          <Text style={[styles.value, { color: colors.text.primary }]}>
            {format(session.scheduledAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </Text>
        </View>

        {session.notes && (
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>Observações:</Text>
            <Text style={[styles.value, { color: colors.text.primary }]}>{session.notes}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>Status:</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons 
              name={session.needsSync ? "sync-outline" : "checkmark-circle"} 
              size={16} 
              color={session.needsSync ? colors.warning : colors.success} 
              style={{ marginRight: SPACING.xs }}
            />
            <Text style={[styles.value, { color: session.needsSync ? colors.warning : colors.success }]}>
              {session.needsSync ? 'Pendente sync' : 'Sincronizado'}
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="barbell" size={24} color={colors.primary} style={{ marginRight: SPACING.sm }} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Exercícios</Text>
          </View>
          <TouchableOpacity onPress={onAddExercise} style={styles.addIconButton}>
            <Ionicons name="add-circle" size={32} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {loadingExercises ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Carregando...</Text>
          </View>
        ) : exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={48} color={colors.text.tertiary} style={{ marginBottom: SPACING.md }} />
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              Nenhum exercício cadastrado
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.text.tertiary }]}>
              Toque no ícone + acima para adicionar
            </Text>
          </View>
        ) : (
          <View style={styles.exercisesList}>
            {exercises.map((exercise) => {
              const isExpanded = expandedExercises.has(exercise.id);
              const sets = exerciseSets[exercise.id] || [];
              const isLoadingSets = loadingSets[exercise.id];

              return (
                <View key={exercise.id} style={styles.exerciseContainer}>
                  <TouchableOpacity
                    style={[
                      styles.exerciseItem,
                      {
                        backgroundColor: colors.background.secondary,
                        borderColor: colors.border,
                        borderLeftColor: colors.primary,
                      },
                    ]}
                    onPress={() => toggleExercise(exercise.id)}
                  >
                    <View style={styles.exerciseIconContainer}>
                      <Ionicons name="barbell" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.exerciseContent}>
                      <Text style={[styles.exerciseName, { color: colors.text.primary }]}>
                        {exercise.name}
                      </Text>
                      {exercise.muscleGroup && (
                        <Text style={[styles.exerciseMuscle, { color: colors.text.secondary }]}>
                          {exercise.muscleGroup}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleToggleExerciseComplete(exercise.id, !!exercise.completedAt);
                      }}
                      style={{ marginRight: SPACING.sm }}
                    >
                      <Ionicons 
                        name={exercise.completedAt ? "checkmark-circle" : "checkmark-circle-outline"} 
                        size={24} 
                        color={exercise.completedAt ? colors.success : colors.text.tertiary} 
                      />
                    </TouchableOpacity>
                    <Ionicons 
                      name={isExpanded ? "chevron-down" : "chevron-forward"} 
                      size={20} 
                      color={colors.text.tertiary} 
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={[styles.setsContainer, { backgroundColor: colors.background.tertiary }]}>
                      <View style={styles.setsHeader}>
                        <Text style={[styles.setsTitle, { color: colors.text.primary }]}>
                          Séries
                        </Text>
                        <TouchableOpacity 
                          onPress={() => handleAddSet(exercise.id)}
                          style={styles.addSetButton}
                        >
                          <Ionicons name="add-circle" size={28} color={colors.primary} />
                        </TouchableOpacity>
                      </View>

                      {isLoadingSets ? (
                        <View style={styles.setsLoading}>
                          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
                            Carregando...
                          </Text>
                        </View>
                      ) : sets.length === 0 ? (
                        <View style={styles.emptySets}>
                          <Text style={[styles.emptySetsText, { color: colors.text.secondary }]}>
                            Nenhuma série cadastrada
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.setsList}>
                          {sets.map((set, index) => {
                            const isEditing = editingSet?.setId === set.id;
                            
                            return (
                              <View 
                                key={set.id} 
                                style={[
                                  styles.setItem,
                                  { 
                                    backgroundColor: colors.background.secondary,
                                    borderColor: colors.border,
                                  }
                                ]}
                              >
                                <Text style={[styles.setNumber, { color: colors.primary }]}>
                                  #{index + 1}
                                </Text>

                                {isEditing ? (
                                  <React.Fragment key={`editing-${set.id}`}>
                                    <View style={styles.setEditContainer}>
                                      <View key={`weight-${set.id}`} style={styles.setInputGroup}>
                                        <Text style={[styles.setInputLabel, { color: colors.text.secondary }]}>
                                          Peso (kg)
                                        </Text>
                                        <TextInput
                                          style={[
                                            styles.setInput,
                                            {
                                              backgroundColor: colors.background.primary,
                                              borderColor: colors.border,
                                              color: colors.text.primary,
                                            }
                                          ]}
                                          value={editValues.weight}
                                          onChangeText={(text) => setEditValues({ ...editValues, weight: text })}
                                          keyboardType="numeric"
                                          placeholder="0"
                                          placeholderTextColor={colors.text.tertiary}
                                        />
                                      </View>
                                      <View key={`reps-${set.id}`} style={styles.setInputGroup}>
                                        <Text style={[styles.setInputLabel, { color: colors.text.secondary }]}>
                                          Reps
                                        </Text>
                                        <TextInput
                                          style={[
                                            styles.setInput,
                                            {
                                              backgroundColor: colors.background.primary,
                                              borderColor: colors.border,
                                              color: colors.text.primary,
                                            }
                                          ]}
                                          value={editValues.reps}
                                          onChangeText={(text) => setEditValues({ ...editValues, reps: text })}
                                          keyboardType="numeric"
                                          placeholder="0"
                                          placeholderTextColor={colors.text.tertiary}
                                        />
                                      </View>
                                      <View key={`rest-${set.id}`} style={styles.setInputGroup}>
                                        <Text style={[styles.setInputLabel, { color: colors.text.secondary }]}>
                                          Rest (s)
                                        </Text>
                                        <TextInput
                                          style={[
                                            styles.setInput,
                                            {
                                              backgroundColor: colors.background.primary,
                                              borderColor: colors.border,
                                              color: colors.text.primary,
                                            }
                                          ]}
                                          value={editValues.rest}
                                          onChangeText={(text) => setEditValues({ ...editValues, rest: text })}
                                          keyboardType="numeric"
                                          placeholder="60"
                                          placeholderTextColor={colors.text.tertiary}
                                        />
                                      </View>
                                      <View key={`rir-${set.id}`} style={styles.setInputGroup}>
                                        <Text style={[styles.setInputLabel, { color: colors.text.secondary }]}>
                                          RIR (0-10)
                                        </Text>
                                        <TextInput
                                          style={[
                                            styles.setInput,
                                            {
                                              backgroundColor: colors.background.primary,
                                              borderColor: colors.border,
                                              color: colors.text.primary,
                                            }
                                          ]}
                                          value={editValues.rir}
                                          onChangeText={(text) => setEditValues({ ...editValues, rir: text })}
                                          keyboardType="numeric"
                                          placeholder="0-10"
                                          placeholderTextColor={colors.text.tertiary}
                                        />
                                      </View>
                                    </View>
                                    <View style={styles.setEditActions}>
                                      <TouchableOpacity onPress={saveSet} style={[styles.setActionButton, { marginRight: SPACING.xs }]}>
                                        <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                                      </TouchableOpacity>
                                      <TouchableOpacity onPress={cancelEditingSet} style={styles.setActionButton}>
                                        <Ionicons name="close-circle" size={24} color={colors.error} />
                                      </TouchableOpacity>
                                    </View>
                                  </React.Fragment>
                                ) : (
                                  <React.Fragment key={`display-${set.id}`}>
                                    <View style={styles.setInfo}>
                                      <View key={`weight-info-${set.id}`} style={styles.setInfoItem}>
                                        <Ionicons name="barbell-outline" size={16} color={colors.text.secondary} style={{ marginRight: SPACING.xs }} />
                                        <Text style={[styles.setInfoText, { color: colors.text.primary }]}>
                                          {set.weight} kg
                                        </Text>
                                      </View>
                                      <View key={`reps-info-${set.id}`} style={styles.setInfoItem}>
                                        <Ionicons name="repeat" size={16} color={colors.text.secondary} style={{ marginRight: SPACING.xs }} />
                                        <Text style={[styles.setInfoText, { color: colors.text.primary }]}>
                                          {set.repetitions} reps
                                        </Text>
                                      </View>
                                      <View key={`rest-info-${set.id}`} style={styles.setInfoItem}>
                                        <Ionicons name="timer-outline" size={16} color={colors.text.secondary} style={{ marginRight: SPACING.xs }} />
                                        <Text style={[styles.setInfoText, { color: colors.text.primary }]}>
                                          {set.restTime}s
                                        </Text>
                                      </View>
                                      {set.rir !== undefined && set.rir !== null && (
                                        <View key={`rir-info-${set.id}`} style={styles.setInfoItem}>
                                          <Text style={[styles.setInfoLabel, { color: colors.text.secondary, marginRight: SPACING.xs }]}>
                                            RIR:
                                          </Text>
                                          <Text style={[styles.setInfoText, { color: colors.primary }]}>
                                            {set.rir}
                                          </Text>
                                        </View>
                                      )}
                                      {set.rpe !== undefined && set.rpe !== null && (
                                        <View key={`rpe-info-${set.id}`} style={styles.setInfoItem}>
                                          <Text style={[styles.setInfoLabel, { color: colors.text.secondary, marginRight: SPACING.xs }]}>
                                            RPE:
                                          </Text>
                                          <Text style={[styles.setInfoText, { color: colors.warning }]}>
                                            {getRPELabel(set.rpe)}
                                          </Text>
                                        </View>
                                      )}
                                    </View>
                                    <View style={styles.setActions}>
                                      <TouchableOpacity 
                                        onPress={() => handleStartTimer(set.restTime)}
                                        style={[styles.setActionButton, { marginRight: SPACING.sm }]}
                                      >
                                        <Ionicons 
                                          name="timer" 
                                          size={20} 
                                          color={colors.primary} 
                                        />
                                      </TouchableOpacity>
                                      <TouchableOpacity 
                                        onPress={() => handleToggleSetComplete(set.id, exercise.id, !!set.completedAt)}
                                        style={[styles.setActionButton, { marginRight: SPACING.sm }]}
                                      >
                                        <Ionicons 
                                          name={set.completedAt ? "checkmark-circle" : "checkmark-circle-outline"} 
                                          size={20} 
                                          color={set.completedAt ? colors.success : colors.text.tertiary} 
                                        />
                                      </TouchableOpacity>
                                      <TouchableOpacity 
                                        onPress={() => startEditingSet(exercise.id, set)}
                                        style={[styles.setActionButton, { marginRight: SPACING.sm }]}
                                      >
                                        <Ionicons name="create-outline" size={20} color={colors.primary} />
                                      </TouchableOpacity>
                                      <TouchableOpacity 
                                        onPress={() => handleDeleteSet(exercise.id, set.id)}
                                        style={styles.setActionButton}
                                      >
                                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                                      </TouchableOpacity>
                                    </View>
                                  </React.Fragment>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </Card>

      <View style={styles.actions}>
        <Button
          title={isCompleted ? 'Marcar como Não Concluído' : 'Marcar como Concluído'}
          onPress={handleToggleComplete}
          loading={isCompleting}
          disabled={isCompleting}
          fullWidth
          style={{ marginBottom: SPACING.md }}
        />
        <Button
          title="Editar"
          onPress={onEdit}
          variant="secondary"
          fullWidth
          style={{ marginBottom: SPACING.md }}
        />
        <Button
          title="Excluir"
          onPress={handleDelete}
          variant="danger"
          loading={isDeleting}
          disabled={isDeleting}
          fullWidth
        />
      </View>

      {/* Rest Timer Modal */}
      <RestTimerModal
        visible={timerModalVisible}
        initialSeconds={timerSeconds}
        onClose={() => setTimerModalVisible(false)}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.size['2xl'],
    fontWeight: TYPOGRAPHY.weight.bold as any,
    flex: 1,
    marginRight: SPACING.md,
  },
  card: {
    marginBottom: SPACING.md,
  },
  completedTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold as any,
  },
  completedText: {
    fontSize: TYPOGRAPHY.size.base,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.size.base,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.size.sm,
    textAlign: 'center',
  },
  addButton: {
    minWidth: 200,
  },
  addIconButton: {
    padding: SPACING.xs,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.size.base,
  },
  exercisesList: {
    // gap removido para compatibilidade com React Native Web
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: SPACING.sm,
  },
  exerciseIconContainer: {
    marginRight: SPACING.md,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
    marginBottom: SPACING.xs,
  },
  exerciseMuscle: {
    fontSize: TYPOGRAPHY.size.sm,
  },
  exerciseContainer: {
    marginBottom: SPACING.sm,
  },
  setsContainer: {
    marginTop: SPACING.xs,
    padding: SPACING.md,
    borderRadius: 8,
  },
  setsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  setsTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
  },
  addSetButton: {
    padding: SPACING.xs,
  },
  setsLoading: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  emptySets: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  emptySetsText: {
    fontSize: TYPOGRAPHY.size.sm,
  },
  setsList: {
    // gap não funciona bem no React Native Web, usando marginBottom nos itens
  },
  setItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: SPACING.xs,
  },
  setNumber: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.bold as any,
    marginRight: SPACING.md,
    minWidth: 30,
  },
  setInfo: {
    flex: 1,
    flexDirection: 'row',
  },
  setInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  setInfoText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.medium as any,
  },
  setInfoLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
  },
  setActions: {
    flexDirection: 'row',
  },
  setActionButton: {
    padding: SPACING.xs,
  },
  setEditContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  setInputGroup: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  setInputLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    marginBottom: SPACING.xs,
  },
  setInput: {
    borderWidth: 1,
    borderRadius: 6,
    padding: SPACING.sm,
    fontSize: TYPOGRAPHY.size.sm,
  },
  setEditActions: {
    flexDirection: 'row',
    marginLeft: SPACING.sm,
  },
  actions: {
    marginTop: SPACING.lg,
  },
});
