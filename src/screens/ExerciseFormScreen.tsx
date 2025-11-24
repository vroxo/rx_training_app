import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, Button, Input, Select } from '../components';
import { SPACING, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { MUSCLE_GROUPS } from '../constants';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from '../services/toast';
import { exerciseSchema, ExerciseFormData } from '../schemas';
import { storageService } from '../services/storage';
import { v4 as uuidv4 } from 'uuid';
import type { Exercise, Session } from '../models';
import { getConjugatedType } from '../models/Exercise';

interface ExerciseFormScreenProps {
  session: Session;
  exercise?: Exercise;
  onSuccess: () => void;
  onCancel: () => void;
}

type ConjugatedGroupOption = {
  value: string;
  label: string;
  exerciseCount: number;
};

export function ExerciseFormScreen({
  session,
  exercise,
  onSuccess,
  onCancel,
}: ExerciseFormScreenProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [isLoading, setIsLoading] = useState(false);
  const [conjugatedMode, setConjugatedMode] = useState<'none' | 'new' | 'existing'>('none');
  const [availableGroups, setAvailableGroups] = useState<ConjugatedGroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: exercise
      ? {
          name: exercise.name,
          notes: exercise.notes,
          muscleGroup: exercise.muscleGroup,
          equipmentType: exercise.equipmentType,
          conjugatedGroup: exercise.conjugatedGroup,
          conjugatedOrder: exercise.conjugatedOrder,
        }
      : {
          name: '',
          notes: '',
          muscleGroup: '',
          equipmentType: '',
          conjugatedGroup: undefined,
          conjugatedOrder: undefined,
        },
  });

  // Carrega grupos conjugados existentes na sessão
  useEffect(() => {
    loadAvailableGroups();
  }, [session.id]);

  // Define modo inicial baseado no exercício existente
  useEffect(() => {
    if (exercise?.conjugatedGroup) {
      setConjugatedMode('existing');
      setSelectedGroupId(exercise.conjugatedGroup);
    }
  }, [exercise]);

  const loadAvailableGroups = async () => {
    try {
      const exercises = await storageService.getExercisesBySession(session.id);
      const groupsMap = new Map<string, Exercise[]>();

      // Agrupa exercícios por conjugatedGroup
      exercises.forEach(ex => {
        if (ex.conjugatedGroup && (!exercise || ex.conjugatedGroup !== exercise.conjugatedGroup)) {
          if (!groupsMap.has(ex.conjugatedGroup)) {
            groupsMap.set(ex.conjugatedGroup, []);
          }
          groupsMap.get(ex.conjugatedGroup)!.push(ex);
        }
      });

      // Converte para opções do select
      const options: ConjugatedGroupOption[] = Array.from(groupsMap.entries()).map(([groupId, groupExercises]) => {
        const sortedExercises = groupExercises.sort((a, b) => (a.conjugatedOrder || 0) - (b.conjugatedOrder || 0));
        const exerciseNames = sortedExercises.map(ex => ex.name).join(' + ');
        const type = getConjugatedType(sortedExercises.length) || 'GRUPO';
        
        return {
          value: groupId,
          label: `${type}: ${exerciseNames}`,
          exerciseCount: sortedExercises.length,
        };
      });

      setAvailableGroups(options);
    } catch (error) {
      console.error('Error loading available groups:', error);
    }
  };

  const onSubmit = async (data: ExerciseFormData) => {
    setIsLoading(true);

    try {
      let conjugatedGroup: string | undefined;
      let conjugatedOrder: number | undefined;

      // Define conjugatedGroup e conjugatedOrder baseado no modo
      if (conjugatedMode === 'new') {
        // Criar novo grupo conjugado
        conjugatedGroup = uuidv4();
        conjugatedOrder = 1;
      } else if (conjugatedMode === 'existing' && selectedGroupId) {
        // Adicionar a grupo existente
        conjugatedGroup = selectedGroupId;
        
        // Encontra o próximo número de ordem
        const exercises = await storageService.getExercisesBySession(session.id);
        const groupExercises = exercises.filter(ex => ex.conjugatedGroup === selectedGroupId);
        conjugatedOrder = Math.max(0, ...groupExercises.map(ex => ex.conjugatedOrder || 0)) + 1;
      }

      if (exercise) {
        await storageService.updateExercise(exercise.id, {
          ...data,
          conjugatedGroup,
          conjugatedOrder,
          updatedAt: new Date(),
          needsSync: true,
        });
        toast.success('Exercício atualizado!');
      } else {
        // Calcula o orderIndex para o novo exercício
        const allExercises = await storageService.getExercisesBySession(session.id);
        const maxOrderIndex = allExercises.length > 0 
          ? Math.max(...allExercises.map(ex => ex.orderIndex)) 
          : -1;
        
        await storageService.createExercise({
          sessionId: session.id,
          ...data,
          orderIndex: maxOrderIndex + 1, // Adiciona no final
          conjugatedGroup,
          conjugatedOrder,
          syncedAt: null,
        });
        
        const message = conjugatedMode === 'new' 
          ? 'Exercício criado! Adicione mais exercícios ao grupo conjugado.' 
          : 'Exercício criado!';
        toast.success(message);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving exercise:', error);
      toast.error('Não foi possível salvar o exercício');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background.secondary }]} contentContainerStyle={styles.content}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl }}>
        <Ionicons 
          name={exercise ? "create-outline" : "add-circle-outline"} 
          size={28} 
          color={colors.primary} 
          style={{ marginRight: SPACING.sm }} 
        />
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {exercise ? 'Editar Exercício' : 'Novo Exercício'}
        </Text>
      </View>

      <Card>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Nome do Exercício *"
              placeholder="Ex: Supino Reto"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="muscleGroup"
          render={({ field: { onChange, value } }) => (
            <Select
              label="Grupo Muscular (opcional)"
              placeholder="Selecione o grupo muscular"
              value={value}
              onChange={onChange}
              options={MUSCLE_GROUPS}
            />
          )}
        />

        <Controller
          control={control}
          name="equipmentType"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Equipamento (opcional)"
              placeholder="Ex: Barra, Halteres, Máquina..."
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
      </Card>

      {/* Card de Conjugados */}
      <Card style={{ marginTop: SPACING.md }}>
        <View style={styles.sectionHeader}>
          <Ionicons name="link" size={20} color={colors.primary} style={{ marginRight: SPACING.sm }} />
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Exercício Conjugado (opcional)
          </Text>
        </View>
        <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
          Agrupe exercícios para executá-los em sequência (Biset, Triset, etc.)
        </Text>

        {/* Opções de Conjugado */}
        <View style={styles.conjugatedOptions}>
          <TouchableOpacity
            style={[
              styles.conjugatedOption,
              {
                backgroundColor: conjugatedMode === 'none' ? colors.primary + '20' : 'transparent',
                borderColor: conjugatedMode === 'none' ? colors.primary : colors.border,
              }
            ]}
            onPress={() => setConjugatedMode('none')}
          >
            <Ionicons 
              name={conjugatedMode === 'none' ? "radio-button-on" : "radio-button-off"} 
              size={24} 
              color={conjugatedMode === 'none' ? colors.primary : colors.text.tertiary} 
            />
            <Text style={[styles.conjugatedOptionText, { color: colors.text.primary }]}>
              Não conjugar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.conjugatedOption,
              {
                backgroundColor: conjugatedMode === 'new' ? colors.primary + '20' : 'transparent',
                borderColor: conjugatedMode === 'new' ? colors.primary : colors.border,
              }
            ]}
            onPress={() => setConjugatedMode('new')}
          >
            <Ionicons 
              name={conjugatedMode === 'new' ? "radio-button-on" : "radio-button-off"} 
              size={24} 
              color={conjugatedMode === 'new' ? colors.primary : colors.text.tertiary} 
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.conjugatedOptionText, { color: colors.text.primary }]}>
                Criar novo grupo
              </Text>
              <Text style={[styles.conjugatedOptionHint, { color: colors.text.tertiary }]}>
                Inicia um Biset/Triset
              </Text>
            </View>
          </TouchableOpacity>

          {availableGroups.length > 0 && (
            <TouchableOpacity
              style={[
                styles.conjugatedOption,
                {
                  backgroundColor: conjugatedMode === 'existing' ? colors.primary + '20' : 'transparent',
                  borderColor: conjugatedMode === 'existing' ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setConjugatedMode('existing')}
            >
              <Ionicons 
                name={conjugatedMode === 'existing' ? "radio-button-on" : "radio-button-off"} 
                size={24} 
                color={conjugatedMode === 'existing' ? colors.primary : colors.text.tertiary} 
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.conjugatedOptionText, { color: colors.text.primary }]}>
                  Adicionar a grupo existente
                </Text>
                <Text style={[styles.conjugatedOptionHint, { color: colors.text.tertiary }]}>
                  {availableGroups.length} grupo(s) disponível(is)
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Select de Grupos Existentes */}
        {conjugatedMode === 'existing' && availableGroups.length > 0 && (
          <View style={{ marginTop: SPACING.md }}>
            <Select
              label="Selecione o grupo"
              placeholder="Escolha um grupo conjugado"
              value={selectedGroupId}
              onChange={setSelectedGroupId}
              options={availableGroups}
            />
          </View>
        )}
      </Card>

      <Card style={{ marginTop: SPACING.md }}>
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Observações (opcional)"
              placeholder="Técnica, dicas, cuidados..."
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={4}
              style={{ minHeight: 100 }}
            />
          )}
        />
      </Card>

      <View style={styles.buttons}>
        <Button
          title={exercise ? 'Salvar Alterações' : 'Criar Exercício'}
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          disabled={isLoading}
          fullWidth
        />
        <Button
          title="Cancelar"
          onPress={onCancel}
          variant="outline"
          disabled={isLoading}
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
  title: {
    fontSize: TYPOGRAPHY.size['2xl'],
    fontWeight: TYPOGRAPHY.weight.bold as any,
  },
  buttons: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
  },
  sectionDescription: {
    fontSize: TYPOGRAPHY.size.sm,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  conjugatedOptions: {
    gap: SPACING.sm,
  },
  conjugatedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 2,
    gap: SPACING.sm,
  },
  conjugatedOptionText: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.medium as any,
  },
  conjugatedOptionHint: {
    fontSize: TYPOGRAPHY.size.sm,
    marginTop: 2,
  },
});
