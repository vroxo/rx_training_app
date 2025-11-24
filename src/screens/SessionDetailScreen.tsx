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
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, Button, RestTimerModal, SyncStatusIndicator, Select, TechniqueFields } from '../components';
import { SPACING, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from '../services/toast';
import { storageService } from '../services/storage';
import type { Session, Exercise, Set } from '../models';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calculateRPEFromRIR, getRPELabel } from '../utils/rpe';
import { getMuscleGroupLabel, SET_TYPES, getSetTypeLabel, getSetTypeColor, TECHNIQUES, getTechniqueLabel, getTechniqueColor } from '../constants';
import { useSyncStore } from '../stores/syncStore';
import { getConjugatedType } from '../models/Exercise';
import type { SetType } from '../models/Set';
import type { TechniqueType } from '../constants/techniques';

// Create drag handle context
const DragHandleContext = React.createContext<any>(null);

// Sortable Exercise Item Component
interface SortableExerciseItemProps {
  id: string;
  children: React.ReactNode;
}

function SortableExerciseItem({ id, children }: SortableExerciseItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : `${transition}, transform 200ms ease`,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 1,
    scale: isDragging ? 1.02 : 1,
    boxShadow: isDragging 
      ? '0 8px 16px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(37, 99, 235, 0.5)' 
      : 'none',
  };

  return (
    <DragHandleContext.Provider value={{ attributes, listeners }}>
      <View ref={setNodeRef} style={style}>
        {children}
      </View>
    </DragHandleContext.Provider>
  );
}

// Drag Handle Component - apenas o ícone é arrastável
function DragHandle() {
  const dragHandleProps = React.useContext(DragHandleContext);
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  
  return (
    <View 
      {...dragHandleProps?.attributes} 
      {...dragHandleProps?.listeners}
      style={{ 
        marginLeft: SPACING.xs,
        marginRight: SPACING.xs,
        padding: SPACING.xs,
        cursor: 'grab',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <Ionicons 
        name="reorder-three-outline" 
        size={24} 
        color={colors.text.tertiary} 
      />
    </View>
  );
}

interface SessionDetailScreenProps {
  session: Session;
  onEdit: () => void;
  onDelete: () => void;
  onViewExerciseDetail: (exerciseId: string) => void;
  onEditExercise: (exerciseId: string) => void;
  onAddExercise: () => void;
  onBack: () => void;
}

export function SessionDetailScreen({
  session,
  onEdit,
  onDelete,
  onViewExerciseDetail,
  onEditExercise,
  onAddExercise,
  onBack,
}: SessionDetailScreenProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { lastSyncedAt } = useSyncStore();
  const [currentSession, setCurrentSession] = useState<Session>(session);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [exerciseSets, setExerciseSets] = useState<Record<string, Set[]>>({});
  const [loadingSets, setLoadingSets] = useState<Record<string, boolean>>({});
  const [editingSet, setEditingSet] = useState<{ exerciseId: string; setId: string; isNew?: boolean } | null>(null);
  const [editValues, setEditValues] = useState<{ 
    weight: string; 
    reps: string; 
    rest: string; 
    rir: string; 
    setType: string;
    technique: string;
    dropSetWeights: number[];
    dropSetReps: number[];
    restPauseDuration: string;
    restPauseReps: number[];
    clusterReps: string;
    clusterRestDuration: string;
  }>({ 
    weight: '', 
    reps: '', 
    rest: '', 
    rir: '', 
    setType: '',
    technique: 'standard',
    dropSetWeights: [],
    dropSetReps: [],
    restPauseDuration: '',
    restPauseReps: [],
    clusterReps: '',
    clusterRestDuration: ''
  });
  const [tempSetId, setTempSetId] = useState<string>(''); // ID temporário para série nova
  const [timerModalVisible, setTimerModalVisible] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [conjugatedGroupRestTime, setConjugatedGroupRestTime] = useState<Record<string, number>>({});
  const [editingConjugatedRestTime, setEditingConjugatedRestTime] = useState<string | null>(null);
  const [expandedTechniques, setExpandedTechniques] = useState<Set<string>>(new Set());
  
  // Refs para manter os valores atuais mesmo durante re-renders
  const editingSetRef = useRef<{ exerciseId: string; setId: string; isNew?: boolean } | null>(null);
  const tempSetIdRef = useRef<string>('');
  
  // Sincroniza refs com estados
  useEffect(() => {
    editingSetRef.current = editingSet;
    tempSetIdRef.current = tempSetId;
  }, [editingSet, tempSetId]);

  // Atualiza session quando prop muda
  useEffect(() => {
    setCurrentSession(session);
  }, [session]);

  // Recarrega session do storage quando sync completa
  useEffect(() => {
    if (lastSyncedAt) {
      console.log('🔄 [SESSION_DETAIL] Recarregando session após sync...');
      storageService.getSessionById(session.id).then((updatedSession) => {
        if (updatedSession) {
          setCurrentSession(updatedSession);
          console.log('✅ [SESSION_DETAIL] Session recarregada');
        }
      }).catch((error) => {
        console.error('❌ [SESSION_DETAIL] Erro ao recarregar session:', error);
      });
    }
  }, [lastSyncedAt, session.id]);

  useEffect(() => {
    loadExercises();
  }, [session.id]);

  const loadExercises = async () => {
    try {
      setLoadingExercises(true);
      const exercisesList = await storageService.getExercisesBySession(currentSession.id);
      setExercises(exercisesList);
      
      // Carrega tempos de descanso dos grupos conjugados
      await loadConjugatedGroupRestTimes(exercisesList);
    } catch (error) {
      console.error('Error loading exercises:', error);
      toast.error('Erro ao carregar exercícios');
    } finally {
      setLoadingExercises(false);
    }
  };

  const loadConjugatedGroupRestTimes = async (exercisesList: Exercise[]) => {
    const groupsRestTime: Record<string, number> = {};
    
    // Agrupa exercícios por conjugatedGroup
    const conjugatedExercises = exercisesList.filter(ex => ex.conjugatedGroup);
    const groups = new Map<string, Exercise[]>();
    
    conjugatedExercises.forEach(ex => {
      if (!groups.has(ex.conjugatedGroup!)) {
        groups.set(ex.conjugatedGroup!, []);
      }
      groups.get(ex.conjugatedGroup!)!.push(ex);
    });
    
    // Para cada grupo, pega o tempo de descanso do primeiro set do primeiro exercício
    for (const [groupId, groupExercises] of groups.entries()) {
      const sortedExercises = groupExercises.sort((a, b) => (a.conjugatedOrder || 0) - (b.conjugatedOrder || 0));
      const firstExercise = sortedExercises[0];
      
      try {
        const sets = await storageService.getSetsByExercise(firstExercise.id);
        if (sets.length > 0 && sets[0].restTime) {
          groupsRestTime[groupId] = sets[0].restTime;
        } else {
          groupsRestTime[groupId] = 180; // Default: 180s (3 min) para grupos conjugados
        }
      } catch (error) {
        groupsRestTime[groupId] = 180;
      }
    }
    
    setConjugatedGroupRestTime(groupsRestTime);
  };

  const loadSets = async (exerciseId: string) => {
    try {
      setLoadingSets(prev => ({ ...prev, [exerciseId]: true }));
      const sets = await storageService.getSetsByExercise(exerciseId);
      
      // Debug: Log sets with techniques
      sets.forEach(set => {
        if (set.technique && set.technique !== 'standard') {
          console.log(`🎯 Set ${set.id} - Technique: ${set.technique}`, {
            dropSetWeights: set.dropSetWeights,
            restPauseDuration: set.restPauseDuration,
            restPauseReps: set.restPauseReps,
            clusterReps: set.clusterReps,
            clusterRestDuration: set.clusterRestDuration,
          });
        }
      });
      
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

  // Agrupa exercícios por conjugatedGroup
  const groupedExercises = React.useMemo(() => {
    const groups: Array<{ isConjugated: boolean; conjugatedType?: string; exercises: Exercise[]; minOrderIndex: number }> = [];
    const processedExercises = new Set<string>();

    // Agrupa exercícios conjugados
    const conjugatedGroups = new Map<string, Exercise[]>();
    exercises.forEach(ex => {
      if (ex.conjugatedGroup) {
        if (!conjugatedGroups.has(ex.conjugatedGroup)) {
          conjugatedGroups.set(ex.conjugatedGroup, []);
        }
        conjugatedGroups.get(ex.conjugatedGroup)!.push(ex);
      }
    });

    // Processa na ordem original do array (respeitando orderIndex)
    exercises.forEach(ex => {
      if (processedExercises.has(ex.id)) return;

      if (ex.conjugatedGroup) {
        // É um exercício conjugado
        const groupExercises = conjugatedGroups.get(ex.conjugatedGroup)!;
        const sortedGroup = groupExercises.sort((a, b) => (a.conjugatedOrder || 0) - (b.conjugatedOrder || 0));
        const minOrderIndex = Math.min(...sortedGroup.map(e => e.orderIndex));
        
        groups.push({
          isConjugated: true,
          conjugatedType: getConjugatedType(sortedGroup.length) || 'CONJUGADO',
          exercises: sortedGroup,
          minOrderIndex,
        });
        
        // Marca todos os exercícios do grupo como processados
        sortedGroup.forEach(e => processedExercises.add(e.id));
      } else {
        // Exercício normal (não conjugado)
        groups.push({
          isConjugated: false,
          exercises: [ex],
          minOrderIndex: ex.orderIndex,
        });
        processedExercises.add(ex.id);
      }
    });

    // Ordena grupos pelo menor orderIndex (mantém posição original)
    return groups.sort((a, b) => a.minOrderIndex - b.minOrderIndex);
  }, [exercises]);

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
    
    // Busca o exercício para verificar se é conjugado
    const exercise = exercises.find(ex => ex.id === exerciseId);
    const isConjugated = !!exercise?.conjugatedGroup;
    const conjugatedRestTime = exercise?.conjugatedGroup ? conjugatedGroupRestTime[exercise.conjugatedGroup] : undefined;
    
    const newTempSet: Set = {
      id: tempId,
      userId: currentSession.userId,
      exerciseId,
      orderIndex,
      weight: 0,
      repetitions: 0,
      restTime: isConjugated && conjugatedRestTime ? conjugatedRestTime : 60,
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

  const handleDuplicateSet = async (exerciseId: string, setId: string) => {
    try {
      await storageService.duplicateSet(setId);
      await loadSets(exerciseId);
      toast.success('Série duplicada!');
    } catch (error) {
      console.error('Error duplicating set:', error);
      toast.error('Erro ao duplicar série');
    }
  };

  const handleDuplicateExercise = async (exerciseId: string) => {
    try {
      const newExercise = await storageService.duplicateExercise(exerciseId);
      await loadExercises();
      // Expand the new exercise automatically
      setExpandedExercises(prev => new Set(prev).add(newExercise.id));
      toast.success('Exercício duplicado!');
    } catch (error) {
      console.error('Error duplicating exercise:', error);
      toast.error('Erro ao duplicar exercício');
    }
  };

  const handleDeleteExercise = async (exerciseId: string, exerciseName: string) => {
    Alert.alert(
      'Excluir Exercício',
      `Tem certeza que deseja excluir "${exerciseName}"? Esta ação não pode ser desfeita.`,
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
              await storageService.deleteExercise(exerciseId);
              await loadExercises();
              toast.success('Exercício excluído!');
            } catch (error) {
              console.error('Error deleting exercise:', error);
              toast.error('Erro ao excluir exercício');
            }
          },
        },
      ]
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250, // 250ms de pressão antes de ativar o drag
        tolerance: 5, // Permite 5px de movimento durante o delay
      },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    try {
      const oldIndex = exercises.findIndex((ex) => ex.id === active.id);
      const newIndex = exercises.findIndex((ex) => ex.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      // Reorder array
      const reorderedExercises = arrayMove(exercises, oldIndex, newIndex);

      // Update orderIndex for all exercises
      const updatedExercises = reorderedExercises.map((ex, idx) => ({
        ...ex,
        orderIndex: idx,
        needsSync: true,
      }));

      // Update state immediately for smooth UX
      setExercises(updatedExercises);

      // Update in storage
      for (const ex of updatedExercises) {
        await storageService.updateExercise(ex.id, {
          orderIndex: ex.orderIndex,
          needsSync: true,
        });
      }

      toast.success('Ordem atualizada!');
    } catch (error) {
      console.error('Error reordering exercises:', error);
      toast.error('Erro ao reordenar exercícios');
      // Reload to revert on error
      await loadExercises();
    }
  };

  const startEditingSet = (exerciseId: string, set: Set, isNew = false) => {
    setEditingSet({ exerciseId, setId: set.id, isNew });
    setEditValues({
      weight: set.weight.toString(),
      reps: set.repetitions.toString(),
      rest: set.restTime?.toString() || '60',
      rir: set.rir?.toString() || '',
      setType: set.setType || '',
      technique: set.technique || 'standard',
      dropSetWeights: set.dropSetWeights || [],
      dropSetReps: set.dropSetReps || [],
      restPauseDuration: set.restPauseDuration?.toString() || '',
      restPauseReps: set.restPauseReps || [],
      clusterReps: set.clusterReps?.toString() || '',
      clusterRestDuration: set.clusterRestDuration?.toString() || '',
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
    setEditValues({ 
      weight: '', 
      reps: '', 
      rest: '', 
      rir: '', 
      setType: '',
      technique: 'standard',
      dropSetWeights: [],
      dropSetReps: [],
      restPauseDuration: '',
      restPauseReps: [],
      clusterReps: '',
      clusterRestDuration: ''
    });
  };

  const saveSet = async () => {
    if (!editingSet) return;
    
    try {
      const weight = parseFloat(editValues.weight) || 0;
      const repetitions = parseInt(editValues.reps) || 0;
      const restTime = parseInt(editValues.rest) || 60;
      const rir = editValues.rir ? parseInt(editValues.rir) : undefined;
      const rpe = calculateRPEFromRIR(rir); // Calcula RPE automaticamente a partir do RIR
      const setType = editValues.setType ? (editValues.setType as SetType) : undefined;
      const technique = editValues.technique && editValues.technique !== 'standard' ? (editValues.technique as TechniqueType) : undefined;
      
      // Parse technique-specific fields
      const dropSetWeights = editValues.technique === 'dropset' && editValues.dropSetWeights.length > 0 
        ? editValues.dropSetWeights 
        : undefined;
      const dropSetReps = editValues.technique === 'dropset' && editValues.dropSetReps.length > 0 
        ? editValues.dropSetReps 
        : undefined;
      // Rest pause: não usa mais restPauseDuration único, usa array
      const restPauseDuration = undefined;
      const restPauseReps = editValues.technique === 'restpause' && editValues.restPauseReps.length > 0
        ? editValues.restPauseReps
        : undefined;
      
      // Debug: Log Rest Pause data
      if (editValues.technique === 'restpause') {
        console.log('🎯 [REST PAUSE] Salvando série:', {
          technique: editValues.technique,
          restPauseReps: editValues.restPauseReps,
          restPauseRepsLength: editValues.restPauseReps.length,
          finalRestPauseReps: restPauseReps,
        });
      }
      const clusterReps = editValues.technique === 'clusterset' && editValues.clusterReps 
        ? parseInt(editValues.clusterReps) 
        : undefined;
      const clusterRestDuration = editValues.technique === 'clusterset' && editValues.clusterRestDuration 
        ? parseInt(editValues.clusterRestDuration) 
        : undefined;

      // Verifica se é uma série temporária (ID começa com 'temp-' ou isNew flag)
      const isTempSet = editingSet.setId.startsWith('temp-') || editingSet.isNew;
      
      if (isTempSet) {
        // É uma série nova (temporária) - remove do estado e cria no banco
        const exerciseId = editingSet.exerciseId;
        
        // Remove a série temporária do estado antes de salvar
        const currentSets = exerciseSets[exerciseId] || [];
        const filteredSets = currentSets.filter(set => set.id === editingSet.setId ? false : true);
        setExerciseSets(prev => ({
          ...prev,
          [exerciseId]: filteredSets,
        }));
        
        // Calcula o orderIndex baseado nas séries existentes (excluindo a temporária)
        const orderIndex = filteredSets.length;
        
        // Cria no banco
        await storageService.createSet({
          userId: currentSession.userId,
          exerciseId,
          orderIndex,
          weight,
          repetitions,
          restTime,
          rir,
          rpe,
          setType,
          technique,
          dropSetWeights,
          dropSetReps,
          restPauseDuration,
          restPauseReps,
          clusterReps,
          clusterRestDuration,
          notes: undefined,
          completedAt: undefined,
          deletedAt: undefined,
          syncedAt: undefined,
          needsSync: true,
        });
        
        // Limpa o ID temporário
        if (tempSetId === editingSet.setId) {
          setTempSetId('');
        }
        
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
          setType,
          technique,
          dropSetWeights,
          dropSetReps,
          restPauseDuration,
          restPauseReps,
          clusterReps,
          clusterRestDuration,
          needsSync: true,
        });
        toast.success('Série atualizada!');
        
        // Recarrega as séries do banco
        await loadSets(editingSet.exerciseId);
      }

      setEditingSet(null);
      setEditValues({ 
        weight: '', 
        reps: '', 
        rest: '', 
        rir: '', 
        setType: '',
        technique: 'standard',
        dropSetWeights: [],
        dropSetReps: [],
        restPauseDuration: '',
        clusterReps: '',
        clusterRestDuration: ''
      });
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
    storageService.deleteSession(currentSession.id)
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

  const toggleTechniqueExpansion = (setId: string) => {
    setExpandedTechniques(prev => {
      const newSet = new Set(prev);
      if (newSet.has(setId)) {
        newSet.delete(setId);
      } else {
        newSet.add(setId);
      }
      return newSet;
    });
  };

  const getTechniqueCompactInfo = (set: Set): string => {
    if (!set.technique || set.technique === 'standard') return '';
    
    if (set.technique === 'dropset' && set.dropSetWeights) {
      return `${set.dropSetWeights.length}x`;
    }
    if (set.technique === 'restpause' && set.restPauseReps && set.restPauseReps.length > 0) {
      // Show compact info: "15s×3" if all same, or "10s+15s+20s" if different
      const allSame = set.restPauseReps.every(d => d === set.restPauseReps![0]);
      if (allSame) {
        return `${set.restPauseReps[0]}s×${set.restPauseReps.length}`;
      }
      return set.restPauseReps.slice(0, 3).join('s+') + 's' + (set.restPauseReps.length > 3 ? '...' : '');
    }
    if (set.technique === 'clusterset') {
      // Show compact info: "3r/10s" (3 reps per cluster, 10s rest)
      if (set.clusterReps && set.clusterRestDuration) {
        return `${set.clusterReps}r/${set.clusterRestDuration}s`;
      }
      if (set.clusterReps) return `${set.clusterReps}r`;
      return '';
    }
    return '';
  };

  const handleToggleComplete = async () => {
    setIsCompleting(true);
    try {
      if (currentSession.completedAt) {
        await storageService.updateSession(currentSession.id, {
          completedAt: null,
          needsSync: true,
        });
        toast.success('Sessão marcada como não concluída!');
      } else {
        await storageService.updateSession(currentSession.id, {
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

  const isCompleted = !!currentSession.completedAt;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background.secondary }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>{currentSession.name}</Text>
        <Button title="Voltar" onPress={onBack} variant="outline" size="small" />
      </View>

      {isCompleted && (
        <Card style={[styles.card, { backgroundColor: colors.success + '10', borderColor: colors.success, borderWidth: 2 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs }}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} style={{ marginRight: SPACING.sm }} />
            <Text style={[styles.completedTitle, { color: colors.success }]}>Treino Concluído!</Text>
          </View>
          <Text style={[styles.completedText, { color: colors.success }]}>
            {format(currentSession.completedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </Text>
        </Card>
      )}

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={exercises.map((ex) => ex.id)}
              strategy={verticalListSortingStrategy}
            >
              <View style={styles.exercisesList}>
                {groupedExercises.map((group, groupIndex) => {
              // Renderiza grupo conjugado
              if (group.isConjugated) {
                // Use first exercise ID as group representative
                const groupId = group.exercises[0]?.id || `group-${groupIndex}`;
                return (
                  <SortableExerciseItem key={groupId} id={groupId}>
                    <View 
                      style={[
                        styles.conjugatedGroup,
                        {
                          backgroundColor: colors.background.tertiary,
                          borderColor: colors.primary,
                        }
                      ]}
                    >
                    {/* Badge do tipo de conjugado + Tempo de descanso */}
                    <View style={styles.conjugatedBadgeRow}>
                      <View style={[styles.conjugatedBadge, { backgroundColor: colors.primary }]}>
                        <Ionicons name="link" size={16} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={styles.conjugatedBadgeText}>{group.conjugatedType}</Text>
                      </View>
                      
                      {/* Tempo de descanso do grupo */}
                      {group.exercises[0]?.conjugatedGroup && (
                        <View style={styles.conjugatedRestTimeContainer}>
                          <TouchableOpacity
                            onPress={() => {
                              const groupId = group.exercises[0].conjugatedGroup!;
                              const restTime = conjugatedGroupRestTime[groupId] || 180;
                              handleStartTimer(restTime);
                            }}
                            style={[styles.conjugatedRestTimeButton, { backgroundColor: colors.background.secondary }]}
                          >
                            <Ionicons name="timer" size={20} color={colors.primary} />
                            <Text style={[styles.conjugatedRestTimeText, { color: colors.text.primary }]}>
                              {conjugatedGroupRestTime[group.exercises[0].conjugatedGroup!] || 180}s
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              const groupId = group.exercises[0].conjugatedGroup!;
                              setEditingConjugatedRestTime(groupId);
                              setEditValues(prev => ({ 
                                ...prev, 
                                rest: (conjugatedGroupRestTime[groupId] || 180).toString() 
                              }));
                            }}
                            style={styles.conjugatedRestTimeEditButton}
                          >
                            <Ionicons name="create-outline" size={18} color={colors.primary} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                    
                    {/* Editor de tempo de descanso do grupo */}
                    {group.exercises[0]?.conjugatedGroup && editingConjugatedRestTime === group.exercises[0].conjugatedGroup && (
                      <View style={[styles.conjugatedRestTimeEditor, { backgroundColor: colors.background.secondary }]}>
                        <TextInput
                          style={[
                            styles.conjugatedRestTimeInput,
                            {
                              backgroundColor: colors.background.primary,
                              borderColor: colors.border,
                              color: colors.text.primary,
                            }
                          ]}
                          value={editValues.rest}
                          onChangeText={(text) => setEditValues({ ...editValues, rest: text })}
                          keyboardType="numeric"
                          placeholder="180"
                          placeholderTextColor={colors.text.tertiary}
                          autoFocus
                        />
                        <Text style={[styles.conjugatedRestTimeLabel, { color: colors.text.secondary }]}>segundos</Text>
                        <TouchableOpacity
                          onPress={async () => {
                            const groupId = group.exercises[0].conjugatedGroup!;
                            const newRestTime = parseInt(editValues.rest) || 180;
                            
                            try {
                              // Atualiza todas as séries do grupo com o novo tempo
                              for (const ex of group.exercises) {
                                const sets = exerciseSets[ex.id] || [];
                                for (const set of sets) {
                                  await storageService.updateSet(set.id, { 
                                    restTime: newRestTime, 
                                    needsSync: true 
                                  });
                                }
                              }
                              
                              // Atualiza o estado local
                              setConjugatedGroupRestTime(prev => ({
                                ...prev,
                                [groupId]: newRestTime,
                              }));
                              setEditingConjugatedRestTime(null);
                              
                              // Recarrega os exercícios para refletir as mudanças
                              await loadExercises();
                              
                              toast.success('Tempo de descanso atualizado!');
                            } catch (error) {
                              console.error('Error updating rest time:', error);
                              toast.error('Erro ao atualizar tempo de descanso');
                            }
                          }}
                          style={[styles.conjugatedRestTimeSaveButton, { backgroundColor: colors.success }]}
                        >
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setEditingConjugatedRestTime(null)}
                          style={[styles.conjugatedRestTimeCancelButton, { backgroundColor: colors.error }]}
                        >
                          <Ionicons name="close" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Exercícios do grupo */}
                    {group.exercises.map((exercise, exerciseIndex) => {
                      const isExpanded = expandedExercises.has(exercise.id);
                      const sets = exerciseSets[exercise.id] || [];
                      const isLoadingSets = loadingSets[exercise.id];

                      return (
                        <React.Fragment key={exercise.id}>
                          {exerciseIndex > 0 && (
                            <View style={[styles.conjugatedSeparator, { backgroundColor: colors.border }]} />
                          )}
                          <View>
                            {/* Row com badge de número + exercício */}
                            <View style={styles.conjugatedExerciseContainer}>
                              {/* Número da ordem */}
                              <View style={[styles.conjugatedOrderBadge, { backgroundColor: colors.primary }]}>
                                <Text style={styles.conjugatedOrderText}>{exercise.conjugatedOrder}</Text>
                              </View>

                              <TouchableOpacity
                                style={[
                                  styles.exerciseItem,
                                  styles.conjugatedExerciseItem,
                                  {
                                    backgroundColor: 'transparent',
                                    borderColor: 'transparent',
                                  }
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
                                      {getMuscleGroupLabel(exercise.muscleGroup)}
                                    </Text>
                                  )}
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <DragHandle />
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
                                </View>
                              </TouchableOpacity>

                              {/* Ações secundárias - aparecem quando expandido */}
                              {isExpanded && (
                                <View style={[styles.exerciseSecondaryActions, { backgroundColor: colors.background.tertiary }]}>
                                  <TouchableOpacity
                                    onPress={() => onEditExercise(exercise.id)}
                                    style={styles.exerciseSecondaryButton}
                                  >
                                    <Ionicons name="create-outline" size={18} color={colors.primary} />
                                    <Text style={[styles.exerciseSecondaryButtonText, { color: colors.primary }]}>Editar</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={() => handleDuplicateExercise(exercise.id)}
                                    style={styles.exerciseSecondaryButton}
                                  >
                                    <Ionicons name="copy-outline" size={18} color={colors.text.primary} />
                                    <Text style={[styles.exerciseSecondaryButtonText, { color: colors.text.primary }]}>Duplicar</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={() => handleDeleteExercise(exercise.id, exercise.name)}
                                    style={styles.exerciseSecondaryButton}
                                  >
                                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                                    <Text style={[styles.exerciseSecondaryButtonText, { color: colors.error }]}>Excluir</Text>
                                  </TouchableOpacity>
                                </View>
                              )}
                            </View>

                            {/* Séries abaixo do exercício */}
                            {isExpanded && (
                              <View style={[styles.setsContainer, styles.conjugatedSetsContainer, { backgroundColor: colors.background.tertiary }]}>
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
                                  <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
                                    Carregando séries...
                                  </Text>
                                ) : sets.length === 0 ? (
                                  <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                                    Nenhuma série registrada
                                  </Text>
                                ) : (
                                  <View style={styles.setsList}>
                                    {sets.map((set, index) => {
                                      const isEditing = editingSet?.setId === set.id;
                                      
                                      return (
                                        <View key={set.id}>
                                          <View 
                                            style={[
                                              styles.setItem,
                                              { 
                                                backgroundColor: colors.background.secondary,
                                                borderColor: colors.border,
                                              }
                                            ]}
                                          >
                                          <View style={styles.setNumberContainer}>
                                            <Text style={[styles.setNumber, { color: colors.primary }]}>
                                              #{index + 1}
                                            </Text>
                                            {set.setType && (
                                              <View style={[styles.setTypeBadge, { backgroundColor: getSetTypeColor(set.setType) }]}>
                                                <Text style={styles.setTypeBadgeText}>{getSetTypeLabel(set.setType)}</Text>
                                              </View>
                                            )}
                                            {set.technique && set.technique !== 'standard' && (
                                              <>
                                      {set.technique === 'dropset' ? (
                                        <View style={[styles.setTypeBadge, { backgroundColor: getTechniqueColor(set.technique) }]}>
                                          <Text style={styles.setTypeBadgeText}>Drop Set</Text>
                                        </View>
                                      ) : (
                                        <TouchableOpacity
                                                    onPress={() => toggleTechniqueExpansion(set.id)}
                                                    style={[styles.setTypeBadge, { backgroundColor: getTechniqueColor(set.technique) }]}
                                                  >
                                                    <Text style={styles.setTypeBadgeText}>
                                                      {getTechniqueCompactInfo(set) ? `${getTechniqueCompactInfo(set)}` : getTechniqueLabel(set.technique)}
                                                    </Text>
                                                    <Ionicons 
                                                      name={expandedTechniques.has(set.id) ? "chevron-up" : "chevron-down"} 
                                                      size={10} 
                                                      color="#fff" 
                                                    />
                                                  </TouchableOpacity>
                                                )}
                                              </>
                                            )}
                                          </View>

                                          {isEditing ? (
                                            <React.Fragment key={`editing-${set.id}`}>
                                              {/* Linha 1: Peso, Reps, Rest, RIR */}
                                              <View style={styles.setEditRow1}>
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
                                                    RIR
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

                                              {/* Linha 2: Tipo e Técnica */}
                                              <View style={styles.setEditRow2}>
                                                <View key={`type-${set.id}`} style={styles.setInputGroup}>
                                                  <Text style={[styles.setInputLabel, { color: colors.text.secondary }]}>
                                                    Tipo
                                                  </Text>
                                                  <Select
                                                    value={editValues.setType}
                                                    onChange={(value) => setEditValues({ ...editValues, setType: value })}
                                                    options={[{ value: '', label: 'Nenhum' }, ...SET_TYPES]}
                                                  />
                                                </View>
                                              </View>

                                              {/* Linha 3: Botões de ação */}
                                              <View style={styles.setEditActions}>
                                                <TouchableOpacity onPress={saveSet} style={styles.setActionButton}>
                                                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={cancelEditingSet} style={styles.setActionButton}>
                                                  <Ionicons name="close-circle" size={24} color={colors.error} />
                                                </TouchableOpacity>
                                              </View>
                                            </React.Fragment>
                                          ) : (
                                            <React.Fragment key={`display-${set.id}`}>
                                              {/* Container principal com divisória */}
                                              <View style={styles.setMainContainer}>
                                                {/* Linha principal: Peso e Reps */}
                                                <View style={styles.setMainInfo}>
                                                  <View style={styles.setMainItem}>
                                                    <Ionicons name="barbell-outline" size={20} color={colors.primary} />
                                                    <Text style={[styles.setMainValue, { color: colors.text.primary }]}>
                                                      {set.weight} kg
                                                    </Text>
                                                  </View>
                                                  <View style={styles.setMainItem}>
                                                    <Ionicons name="repeat" size={20} color={colors.primary} />
                                                    <Text style={[styles.setMainValue, { color: colors.text.primary }]}>
                                                      {set.repetitions}
                                                    </Text>
                                                    <Text style={[styles.setMainLabel, { color: colors.text.secondary }]}>
                                                      reps
                                                    </Text>
                                                  </View>
                                                </View>

                                                {/* Drops em linhas separadas */}
                                                {set.technique === 'dropset' && set.dropSetWeights && set.dropSetWeights.length > 0 && (
                                                  <View style={styles.dropWeightsVertical}>
                                                    {set.dropSetWeights.map((weight, idx) => (
                                                      <View key={idx} style={styles.dropWeightRow}>
                                                        <Ionicons name="arrow-forward" size={14} color={getTechniqueColor('dropset')} />
                                                        <Text style={[styles.dropWeightText, { color: getTechniqueColor('dropset') }]}>
                                                          {weight} kg
                                                        </Text>
                                                        {set.dropSetReps && set.dropSetReps[idx] !== undefined && (
                                                          <>
                                                            <Ionicons name="close" size={12} color={getTechniqueColor('dropset')} />
                                                            <Text style={[styles.dropWeightText, { color: getTechniqueColor('dropset') }]}>
                                                              {set.dropSetReps[idx]} reps
                                                            </Text>
                                                          </>
                                                        )}
                                                      </View>
                                                    ))}
                                                  </View>
                                                )}
                                              </View>
                                              
                                              {/* Linha secundária: RIR/RPE se existirem */}
                                              {(set.rir !== undefined && set.rir !== null) || (set.rpe !== undefined && set.rpe !== null) ? (
                                                <View style={styles.setSecondaryInfo}>
                                                  {set.rir !== undefined && set.rir !== null && (
                                                    <View style={styles.setSecondaryItem}>
                                                      <Text style={[styles.setSecondaryLabel, { color: colors.text.tertiary }]}>
                                                        RIR:
                                                      </Text>
                                                      <Text style={[styles.setSecondaryValue, { color: colors.primary }]}>
                                                        {set.rir}
                                                      </Text>
                                                    </View>
                                                  )}
                                                  {set.rpe !== undefined && set.rpe !== null && (
                                                    <View style={styles.setSecondaryItem}>
                                                      <Text style={[styles.setSecondaryLabel, { color: colors.text.tertiary }]}>
                                                        RPE:
                                                      </Text>
                                                      <Text style={[styles.setSecondaryValue, { color: colors.warning }]}>
                                                        {getRPELabel(set.rpe)}
                                                      </Text>
                                                    </View>
                                                  )}
                                                </View>
                                              ) : null}
                                              
                                              <View style={styles.setActions}>
                                                {/* Botão de cronômetro com tempo de descanso para exercícios não-conjugados */}
                                                {!exercise.conjugatedGroup && (
                                                  <TouchableOpacity 
                                                    onPress={() => handleStartTimer(set.restTime)}
                                                    style={[styles.restTimerButton, { backgroundColor: colors.background.secondary }]}
                                                  >
                                                    <Ionicons 
                                                      name="timer" 
                                                      size={18} 
                                                      color={colors.primary} 
                                                    />
                                                    <Text style={[styles.restTimerText, { color: colors.text.primary }]}>
                                                      {set.restTime}s
                                                    </Text>
                                                  </TouchableOpacity>
                                                )}
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
                                                  onPress={() => handleDuplicateSet(exercise.id, set.id)}
                                                  style={[styles.setActionButton, { marginRight: SPACING.sm }]}
                                                >
                                                  <Ionicons name="copy-outline" size={20} color={colors.text.secondary} />
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
                                        
                                        {/* Detalhes expandidos da técnica - APENAS Rest Pause e Cluster Set */}
                                        {set.technique && set.technique !== 'standard' && set.technique !== 'dropset' && expandedTechniques.has(set.id) && (
                                          <View style={[styles.techniqueExpandedDetails, { 
                                            backgroundColor: `${getTechniqueColor(set.technique)}15`,
                                            borderLeftColor: getTechniqueColor(set.technique)
                                          }]}>
                                            {set.technique === 'restpause' && set.restPauseReps && set.restPauseReps.length > 0 && (
                                              <>
                                                <View style={styles.techniqueDetailHeader}>
                                                  <Ionicons name="pause-circle" size={18} color={getTechniqueColor(set.technique)} />
                                                  <Text style={[styles.techniqueDetailTitle, { color: getTechniqueColor(set.technique) }]}>
                                                    Rest Pause
                                                  </Text>
                                                </View>
                                                <View style={styles.techniqueDetailContent}>
                                                  <Text style={[styles.techniqueDetailText, { color: colors.text.secondary, fontSize: TYPOGRAPHY.size.xs, marginBottom: SPACING.xs }]}>
                                                    Faça reps até a falha, pause e continue
                                                  </Text>
                                                  <View style={styles.restPauseTimersContainer}>
                                                    {set.restPauseReps.map((duration, idx) => (
                                                      <TouchableOpacity
                                                        key={idx}
                                                        onPress={() => handleStartTimer(duration)}
                                                        style={[styles.restPauseTimerButton, { 
                                                          backgroundColor: colors.background.secondary,
                                                          borderColor: getTechniqueColor('restpause')
                                                        }]}
                                                      >
                                                        <View style={[styles.restPauseTimerBadge, { backgroundColor: getTechniqueColor('restpause') }]}>
                                                          <Text style={styles.restPauseTimerBadgeText}>{idx + 1}</Text>
                                                        </View>
                                                        <Ionicons name="timer" size={20} color={getTechniqueColor('restpause')} />
                                                        <Text style={[styles.restPauseTimerText, { color: colors.text.primary }]}>
                                                          {duration}s
                                                        </Text>
                                                      </TouchableOpacity>
                                                    ))}
                                                  </View>
                                                </View>
                                              </>
                                            )}
                                            {set.technique === 'clusterset' && (set.clusterReps || set.clusterRestDuration) && (
                                              <>
                                                <View style={styles.techniqueDetailHeader}>
                                                  <Ionicons name="layers" size={18} color={getTechniqueColor(set.technique)} />
                                                  <Text style={[styles.techniqueDetailTitle, { color: getTechniqueColor(set.technique) }]}>
                                                    Cluster Set
                                                  </Text>
                                                </View>
                                                <View style={styles.techniqueDetailContent}>
                                                  <Text style={[styles.techniqueDetailText, { color: colors.text.secondary, fontSize: TYPOGRAPHY.size.xs, marginBottom: SPACING.xs }]}>
                                                    Mini-séries com descansos curtos entre elas
                                                  </Text>
                                                  <View style={styles.clusterInfoContainer}>
                                                    {set.clusterReps && (
                                                      <View style={styles.clusterInfoItem}>
                                                        <Ionicons name="fitness" size={16} color={getTechniqueColor('clusterset')} />
                                                        <Text style={[styles.clusterInfoText, { color: colors.text.primary }]}>
                                                          <Text style={{ fontWeight: '600' }}>{set.clusterReps}</Text> reps
                                                        </Text>
                                                      </View>
                                                    )}
                                                    {set.clusterRestDuration && (
                                                      <TouchableOpacity
                                                        onPress={() => handleStartTimer(set.clusterRestDuration!)}
                                                        style={[styles.clusterTimerButton, { 
                                                          backgroundColor: colors.background.secondary,
                                                          borderColor: getTechniqueColor('clusterset')
                                                        }]}
                                                      >
                                                        <Ionicons name="timer" size={20} color={getTechniqueColor('clusterset')} />
                                                        <Text style={[styles.clusterTimerText, { color: colors.text.primary }]}>
                                                          {set.clusterRestDuration}s
                                                        </Text>
                                                      </TouchableOpacity>
                                                    )}
                                                  </View>
                                                </View>
                                              </>
                                            )}
                                          </View>
                                        )}
                                      </View>
                                      );
                                    })}
                                  </View>
                                )}
                              </View>
                            )}
                          </View>
                        </React.Fragment>
                      );
                    })}
                    </View>
                  </SortableExerciseItem>
                );
              }

              // Renderiza exercício normal (não conjugado)
              const exercise = group.exercises[0];
              const isExpanded = expandedExercises.has(exercise.id);
              const sets = exerciseSets[exercise.id] || [];
              const isLoadingSets = loadingSets[exercise.id];

              return (
                <SortableExerciseItem key={exercise.id} id={exercise.id}>
                  <View style={styles.exerciseContainer}>
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
                          {getMuscleGroupLabel(exercise.muscleGroup)}
                        </Text>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <DragHandle />
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
                    </View>
                  </TouchableOpacity>

                  {/* Ações secundárias - aparecem quando expandido */}
                  {isExpanded && (
                    <View style={[styles.exerciseSecondaryActions, { backgroundColor: colors.background.tertiary }]}>
                      <TouchableOpacity
                        onPress={() => onEditExercise(exercise.id)}
                        style={styles.exerciseSecondaryButton}
                      >
                        <Ionicons name="create-outline" size={18} color={colors.primary} />
                        <Text style={[styles.exerciseSecondaryButtonText, { color: colors.primary }]}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDuplicateExercise(exercise.id)}
                        style={styles.exerciseSecondaryButton}
                      >
                        <Ionicons name="copy-outline" size={18} color={colors.text.primary} />
                        <Text style={[styles.exerciseSecondaryButtonText, { color: colors.text.primary }]}>Duplicar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteExercise(exercise.id, exercise.name)}
                        style={styles.exerciseSecondaryButton}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.error} />
                        <Text style={[styles.exerciseSecondaryButtonText, { color: colors.error }]}>Excluir</Text>
                      </TouchableOpacity>
                    </View>
                  )}

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
                              <View key={set.id}>
                                <View 
                                  style={[
                                    styles.setItem,
                                    { 
                                      backgroundColor: colors.background.secondary,
                                      borderColor: colors.border,
                                    }
                                  ]}
                                >
                                <View style={styles.setNumberContainer}>
                                  <Text style={[styles.setNumber, { color: colors.primary }]}>
                                    #{index + 1}
                                  </Text>
                                  {set.setType && (
                                    <View style={[styles.setTypeBadge, { backgroundColor: getSetTypeColor(set.setType) }]}>
                                      <Text style={styles.setTypeBadgeText}>{getSetTypeLabel(set.setType)}</Text>
                                    </View>
                                  )}
                                  {set.technique && set.technique !== 'standard' && (
                                    <>
                                      {set.technique === 'dropset' ? (
                                        <View style={[styles.setTypeBadge, { backgroundColor: getTechniqueColor(set.technique) }]}>
                                          <Text style={styles.setTypeBadgeText}>Drop Set</Text>
                                        </View>
                                      ) : (
                                        <TouchableOpacity 
                                          onPress={() => toggleTechniqueExpansion(set.id)}
                                          style={[styles.setTypeBadge, { backgroundColor: getTechniqueColor(set.technique) }]}
                                        >
                                          <Text style={styles.setTypeBadgeText}>
                                            {getTechniqueCompactInfo(set) ? `${getTechniqueCompactInfo(set)}` : getTechniqueLabel(set.technique)}
                                          </Text>
                                          <Ionicons 
                                            name={expandedTechniques.has(set.id) ? "chevron-up" : "chevron-down"} 
                                            size={10} 
                                            color="#fff" 
                                          />
                                        </TouchableOpacity>
                                      )}
                                    </>
                                  )}
                                </View>

                                {isEditing ? (
                                  <React.Fragment key={`editing-${set.id}`}>
                                    {/* Linha 1: Peso, Reps, Rest, RIR */}
                                    <View style={styles.setEditRow1}>
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
                                          RIR
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

                                    {/* Linha 2: Tipo e Técnica */}
                                    <View style={styles.setEditRow2}>
                                      <View key={`type-${set.id}`} style={styles.setInputGroup}>
                                        <Text style={[styles.setInputLabel, { color: colors.text.secondary }]}>
                                          Tipo
                                        </Text>
                                        <Select
                                          value={editValues.setType}
                                          onChange={(value) => setEditValues({ ...editValues, setType: value })}
                                          options={[{ value: '', label: 'Nenhum' }, ...SET_TYPES]}
                                        />
                                      </View>
                                      <View key={`technique-${set.id}`} style={styles.setInputGroup}>
                                        <Text style={[styles.setInputLabel, { color: colors.text.secondary }]}>
                                          Técnica
                                        </Text>
                                        <Select
                                          value={editValues.technique}
                                          onChange={(value) => setEditValues({ ...editValues, technique: value })}
                                          options={TECHNIQUES}
                                        />
                                      </View>
                                    </View>

                                    {/* Campos dinâmicos de técnica */}
                                    <TechniqueFields
                                      technique={editValues.technique}
                                      dropSetWeights={editValues.dropSetWeights}
                                      dropSetReps={editValues.dropSetReps}
                                      restPauseDuration={editValues.restPauseDuration ? parseInt(editValues.restPauseDuration) : undefined}
                                      restPauseReps={editValues.restPauseReps}
                                      clusterReps={editValues.clusterReps ? parseInt(editValues.clusterReps) : undefined}
                                      clusterRestDuration={editValues.clusterRestDuration ? parseInt(editValues.clusterRestDuration) : undefined}
                                      colors={colors}
                                      onDropSetWeightsChange={(weights) => setEditValues(prev => ({ ...prev, dropSetWeights: weights }))}
                                      onDropSetRepsChange={(reps) => setEditValues(prev => ({ ...prev, dropSetReps: reps }))}
                                      onRestPauseDurationChange={(duration) => setEditValues(prev => ({ ...prev, restPauseDuration: duration.toString() }))}
                                      onRestPauseRepsChange={(durations) => setEditValues(prev => ({ ...prev, restPauseReps: durations }))}
                                      onClusterRepsChange={(reps) => setEditValues(prev => ({ ...prev, clusterReps: reps.toString() }))}
                                      onClusterRestDurationChange={(duration) => setEditValues(prev => ({ ...prev, clusterRestDuration: duration.toString() }))}
                                    />

                                    {/* Linha 3: Botões de ação */}
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
                                    {/* Container principal com divisória */}
                                    <View style={styles.setMainContainer}>
                                      {/* Linha principal: Peso e Reps */}
                                      <View style={styles.setMainInfo}>
                                        <View style={styles.setMainItem}>
                                          <Ionicons name="barbell-outline" size={20} color={colors.primary} />
                                          <Text style={[styles.setMainValue, { color: colors.text.primary }]}>
                                            {set.weight} kg
                                          </Text>
                                        </View>
                                        <View style={styles.setMainItem}>
                                          <Ionicons name="repeat" size={20} color={colors.primary} />
                                          <Text style={[styles.setMainValue, { color: colors.text.primary }]}>
                                            {set.repetitions}
                                          </Text>
                                          <Text style={[styles.setMainLabel, { color: colors.text.secondary }]}>
                                            reps
                                          </Text>
                                        </View>
                                      </View>

                                      {/* Drops em linhas separadas */}
                                      {set.technique === 'dropset' && set.dropSetWeights && set.dropSetWeights.length > 0 && (
                                        <View style={styles.dropWeightsVertical}>
                                          {set.dropSetWeights.map((weight, idx) => (
                                            <View key={idx} style={styles.dropWeightRow}>
                                              <Ionicons name="arrow-forward" size={14} color={getTechniqueColor('dropset')} />
                                              <Text style={[styles.dropWeightText, { color: getTechniqueColor('dropset') }]}>
                                                {weight} kg
                                              </Text>
                                              {set.dropSetReps && set.dropSetReps[idx] !== undefined && (
                                                <>
                                                  <Ionicons name="close" size={12} color={getTechniqueColor('dropset')} />
                                                  <Text style={[styles.dropWeightText, { color: getTechniqueColor('dropset') }]}>
                                                    {set.dropSetReps[idx]} reps
                                                  </Text>
                                                </>
                                              )}
                                            </View>
                                          ))}
                                        </View>
                                      )}
                                    </View>
                                    
                                    {/* Linha secundária: RIR/RPE se existirem */}
                                    {(set.rir !== undefined && set.rir !== null) || (set.rpe !== undefined && set.rpe !== null) ? (
                                      <View style={styles.setSecondaryInfo}>
                                        {set.rir !== undefined && set.rir !== null && (
                                          <View style={styles.setSecondaryItem}>
                                            <Text style={[styles.setSecondaryLabel, { color: colors.text.tertiary }]}>
                                              RIR:
                                            </Text>
                                            <Text style={[styles.setSecondaryValue, { color: colors.primary }]}>
                                              {set.rir}
                                            </Text>
                                          </View>
                                        )}
                                        {set.rpe !== undefined && set.rpe !== null && (
                                          <View style={styles.setSecondaryItem}>
                                            <Text style={[styles.setSecondaryLabel, { color: colors.text.tertiary }]}>
                                              RPE:
                                            </Text>
                                            <Text style={[styles.setSecondaryValue, { color: colors.warning }]}>
                                              {getRPELabel(set.rpe)}
                                            </Text>
                                          </View>
                                        )}
                                      </View>
                                    ) : null}
                                    
                                    <View style={styles.setActions}>
                                      <TouchableOpacity 
                                        onPress={() => handleStartTimer(set.restTime)}
                                        style={[styles.restTimerButton, { backgroundColor: colors.background.secondary }]}
                                      >
                                        <Ionicons 
                                          name="timer" 
                                          size={18} 
                                          color={colors.primary} 
                                        />
                                        <Text style={[styles.restTimerText, { color: colors.text.primary }]}>
                                          {set.restTime}s
                                        </Text>
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
                                        onPress={() => handleDuplicateSet(exercise.id, set.id)}
                                        style={[styles.setActionButton, { marginRight: SPACING.sm }]}
                                      >
                                        <Ionicons name="copy-outline" size={20} color={colors.text.secondary} />
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
                              
                              {/* Detalhes expandidos da técnica - APENAS Rest Pause e Cluster Set */}
                              {set.technique && set.technique !== 'standard' && set.technique !== 'dropset' && expandedTechniques.has(set.id) && (
                                <View style={[styles.techniqueExpandedDetails, { 
                                  backgroundColor: `${getTechniqueColor(set.technique)}15`,
                                  borderLeftColor: getTechniqueColor(set.technique)
                                }]}>
                                  {set.technique === 'restpause' && set.restPauseReps && set.restPauseReps.length > 0 && (
                                    <>
                                      <View style={styles.techniqueDetailHeader}>
                                        <Ionicons name="pause-circle" size={18} color={getTechniqueColor(set.technique)} />
                                        <Text style={[styles.techniqueDetailTitle, { color: getTechniqueColor(set.technique) }]}>
                                          Rest Pause
                                        </Text>
                                      </View>
                                      <View style={styles.techniqueDetailContent}>
                                        <Text style={[styles.techniqueDetailText, { color: colors.text.secondary, fontSize: TYPOGRAPHY.size.xs, marginBottom: SPACING.xs }]}>
                                          Faça reps até a falha, pause e continue
                                        </Text>
                                        <View style={styles.restPauseTimersContainer}>
                                          {set.restPauseReps.map((duration, idx) => (
                                            <TouchableOpacity
                                              key={idx}
                                              onPress={() => handleStartTimer(duration)}
                                              style={[styles.restPauseTimerButton, { 
                                                backgroundColor: colors.background.secondary,
                                                borderColor: getTechniqueColor('restpause')
                                              }]}
                                            >
                                              <View style={[styles.restPauseTimerBadge, { backgroundColor: getTechniqueColor('restpause') }]}>
                                                <Text style={styles.restPauseTimerBadgeText}>{idx + 1}</Text>
                                              </View>
                                              <Ionicons name="timer" size={20} color={getTechniqueColor('restpause')} />
                                              <Text style={[styles.restPauseTimerText, { color: colors.text.primary }]}>
                                                {duration}s
                                              </Text>
                                            </TouchableOpacity>
                                          ))}
                                        </View>
                                      </View>
                                    </>
                                  )}
                                  {set.technique === 'clusterset' && (set.clusterReps || set.clusterRestDuration) && (
                                    <>
                                      <View style={styles.techniqueDetailHeader}>
                                        <Ionicons name="layers" size={18} color={getTechniqueColor(set.technique)} />
                                        <Text style={[styles.techniqueDetailTitle, { color: getTechniqueColor(set.technique) }]}>
                                          Cluster Set
                                        </Text>
                                      </View>
                                      <View style={styles.techniqueDetailContent}>
                                        <Text style={[styles.techniqueDetailText, { color: colors.text.secondary, fontSize: TYPOGRAPHY.size.xs, marginBottom: SPACING.xs }]}>
                                          Mini-séries com descansos curtos entre elas
                                        </Text>
                                        <View style={styles.clusterInfoContainer}>
                                          {set.clusterReps && (
                                            <View style={styles.clusterInfoItem}>
                                              <Ionicons name="fitness" size={16} color={getTechniqueColor('clusterset')} />
                                              <Text style={[styles.clusterInfoText, { color: colors.text.primary }]}>
                                                <Text style={{ fontWeight: '600' }}>{set.clusterReps}</Text> reps
                                              </Text>
                                            </View>
                                          )}
                                          {set.clusterRestDuration && (
                                            <TouchableOpacity
                                              onPress={() => handleStartTimer(set.clusterRestDuration!)}
                                              style={[styles.clusterTimerButton, { 
                                                backgroundColor: colors.background.secondary,
                                                borderColor: getTechniqueColor('clusterset')
                                              }]}
                                            >
                                              <Ionicons name="timer" size={20} color={getTechniqueColor('clusterset')} />
                                              <Text style={[styles.clusterTimerText, { color: colors.text.primary }]}>
                                                {set.clusterRestDuration}s
                                              </Text>
                                            </TouchableOpacity>
                                          )}
                                        </View>
                                      </View>
                                    </>
                                  )}
                                </View>
                              )}
                            </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  )}
                  </View>
                </SortableExerciseItem>
              );
            })}
              </View>
            </SortableContext>
          </DndContext>
        )}
      </Card>

      <View style={styles.actions}>
        <Button
          title={isCompleted ? 'Marcar como Não Concluído' : 'Marcar como Concluído'}
          onPress={handleToggleComplete}
          loading={isCompleting}
          disabled={isCompleting}
          fullWidth
        />
      </View>

      {/* Card de Informações - compacto */}
      <Card style={styles.infoCard}>
        <View style={styles.infoCompactRow}>
          <View style={styles.infoCompactItem}>
            <Text style={[styles.infoCompactLabel, { color: colors.text.secondary }]}>Data Agendada:</Text>
            <Text style={[styles.infoCompactValue, { color: colors.text.primary }]}>
              {format(currentSession.scheduledAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </Text>
          </View>
          <View style={styles.infoCompactItem}>
            <Text style={[styles.infoCompactLabel, { color: colors.text.secondary }]}>Status:</Text>
            <SyncStatusIndicator needsSync={currentSession.needsSync} variant="full" size="small" />
          </View>
        </View>
      </Card>

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
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: SPACING.xs,
  },
  setNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  setNumber: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.bold as any,
    minWidth: 30,
  },
  setTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 2,
  },
  setTypeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold as any,
  },
  setMainContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  setMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: SPACING.sm,
  },
  setMainItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  setMainValue: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold as any,
  },
  setMainLabel: {
    fontSize: TYPOGRAPHY.size.sm,
    marginLeft: SPACING.xs,
  },
  dropWeightsVertical: {
    paddingLeft: SPACING.xl,
    paddingTop: SPACING.xs,
  },
  dropWeightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: 2,
  },
  dropWeightText: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.medium as any,
  },
  setSecondaryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  setSecondaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  setSecondaryLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
    textTransform: 'uppercase',
  },
  setSecondaryValue: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
  },
  setActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  setActionButton: {
    padding: SPACING.xs,
  },
  restTimerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    gap: SPACING.xs,
    marginRight: SPACING.sm,
  },
  restTimerText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  setText: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.medium as any,
  },
  setEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  setEditInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  setEditButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setEditContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  setEditRow1: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  setEditRow2: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  setInputGroup: {
    flex: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actions: {
    marginTop: SPACING.lg,
  },
  // Estilos para exercícios conjugados
  conjugatedGroup: {
    borderRadius: 12,
    borderWidth: 2,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  conjugatedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  conjugatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
  },
  conjugatedBadgeText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.bold as any,
  },
  conjugatedRestTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  conjugatedRestTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    gap: SPACING.xs,
  },
  conjugatedRestTimeText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
  },
  conjugatedRestTimeEditButton: {
    padding: SPACING.xs,
  },
  conjugatedRestTimeEditor: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xs,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  conjugatedRestTimeInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    fontSize: TYPOGRAPHY.size.sm,
    width: 60,
    textAlign: 'center',
  },
  conjugatedRestTimeLabel: {
    fontSize: TYPOGRAPHY.size.xs,
  },
  conjugatedRestTimeSaveButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },
  conjugatedRestTimeCancelButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conjugatedSeparator: {
    height: 1,
    marginVertical: SPACING.sm,
  },
  conjugatedExerciseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conjugatedOrderBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    flexShrink: 0,
  },
  conjugatedOrderText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.bold as any,
  },
  conjugatedExerciseItem: {
    flex: 1,
    marginBottom: 0,
    borderWidth: 0,
    borderLeftWidth: 0,
  },
  conjugatedSetsContainer: {
    marginLeft: 44, // Compensa o badge de número (32px) + marginRight (12px)
  },
  exerciseContainer: {
    marginBottom: SPACING.sm,
  },
  techniqueExpandedDetails: {
    width: '100%',
    marginTop: SPACING.xs,
    padding: SPACING.md,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  techniqueDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  techniqueDetailTitle: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.bold as any,
  },
  techniqueDetailContent: {
    gap: SPACING.xs,
  },
  techniqueDetailText: {
    fontSize: TYPOGRAPHY.size.sm,
    lineHeight: 20,
  },
  exerciseSecondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  exerciseSecondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  exerciseSecondaryButtonText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.medium as any,
  },
  infoCard: {
    marginTop: SPACING.lg,
    padding: SPACING.sm,
  },
  infoCompactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  infoCompactItem: {
    flex: 1,
  },
  infoCompactLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    marginBottom: SPACING.xs,
  },
  infoCompactValue: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.medium as any,
  },
  restPauseTimersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  restPauseTimerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
    borderWidth: 2,
  },
  restPauseTimerBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restPauseTimerBadgeText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.bold as any,
  },
  restPauseTimerText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
  },
  clusterInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  clusterInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  clusterInfoText: {
    fontSize: TYPOGRAPHY.size.sm,
  },
  clusterTimerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
    borderWidth: 2,
  },
  clusterTimerText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
  },
});
