import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, Button, Input } from '../components';
import { SPACING, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from '../services/toast';
import { exerciseSchema, ExerciseFormData } from '../schemas';
import { storageService } from '../services/storage';
import { v4 as uuidv4 } from 'uuid';
import type { Exercise, Session } from '../models';

interface ExerciseFormScreenProps {
  session: Session;
  exercise?: Exercise;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ExerciseFormScreen({
  session,
  exercise,
  onSuccess,
  onCancel,
}: ExerciseFormScreenProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [isLoading, setIsLoading] = useState(false);

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
        }
      : {
          name: '',
          notes: '',
          muscleGroup: '',
          equipmentType: '',
        },
  });

  const onSubmit = async (data: ExerciseFormData) => {
    setIsLoading(true);

    try {
      if (exercise) {
        await storageService.updateExercise(exercise.id, {
          ...data,
          updatedAt: new Date(),
          needsSync: true,
        });
        toast.success('Exercício atualizado!');
      } else {
        await storageService.createExercise({
          sessionId: session.id,
          ...data,
          syncedAt: null,
        });
        toast.success('Exercício criado!');
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
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Grupo Muscular (opcional)"
              placeholder="Ex: Peito, Costas, Pernas..."
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
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
});
