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
import { Card, Button, Input, DatePicker } from '../components';
import { SPACING, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from '../services/toast';
import { periodizationSchema, PeriodizationFormData } from '../schemas';
import { storageService } from '../services/storage';
import { useAuth } from '../hooks';
import { v4 as uuidv4 } from 'uuid';
import type { Periodization } from '../models';

interface PeriodizationFormScreenProps {
  periodization?: Periodization;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PeriodizationFormScreen({
  periodization,
  onSuccess,
  onCancel,
}: PeriodizationFormScreenProps) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PeriodizationFormData>({
    resolver: zodResolver(periodizationSchema),
    defaultValues: periodization
      ? {
          name: periodization.name,
          description: periodization.description,
          startDate: periodization.startDate,
          endDate: periodization.endDate,
        }
      : {
          name: '',
          description: '',
          startDate: (() => {
            // Cria data de hoje com horário zerado
            const today = new Date();
            return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
          })(),
          endDate: (() => {
            // Cria data daqui a 30 dias com horário zerado
            const today = new Date();
            const in30Days = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30, 0, 0, 0, 0);
            return in30Days;
          })(),
        },
  });

  const onSubmit = async (data: PeriodizationFormData) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    setIsLoading(true);

    try {
      if (periodization) {
        await storageService.updatePeriodization(periodization.id, {
          ...data,
          updatedAt: new Date(),
          needsSync: true,
        });
        toast.success('Periodização atualizada!');
      } else {
        await storageService.createPeriodization({
          userId: user.id,
          ...data,
          syncedAt: null,
        });
        toast.success('Periodização criada!');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving periodization:', error);
      toast.error('Não foi possível salvar a periodização');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background.secondary }]} contentContainerStyle={styles.content}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl }}>
        <Ionicons 
          name={periodization ? "create-outline" : "add-circle-outline"} 
          size={28} 
          color={colors.primary} 
          style={{ marginRight: SPACING.sm }} 
        />
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {periodization ? 'Editar Periodização' : 'Nova Periodização'}
        </Text>
      </View>

      <Card>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Nome *"
              placeholder="Ex: Hipertrofia - Ciclo 1"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Descrição (opcional)"
              placeholder="Objetivos e observações..."
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={4}
              style={{ minHeight: 100 }}
            />
          )}
        />

        <Controller
          control={control}
          name="startDate"
          render={({ field: { onChange, value } }) => (
            <DatePicker
              label="Data de Início *"
              value={value}
              onChange={onChange}
              error={errors.startDate?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="endDate"
          render={({ field: { onChange, value } }) => (
            <DatePicker
              label="Data de Fim *"
              value={value}
              onChange={onChange}
              error={errors.endDate?.message}
              minimumDate={new Date()}
            />
          )}
        />
      </Card>

      <View style={styles.buttons}>
        <Button
          title={periodization ? 'Salvar Alterações' : 'Criar Periodização'}
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

