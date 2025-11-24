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
import { Card, Button, Input, DateTimePickerComponent } from '../components';
import { SPACING, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from '../services/toast';
import { sessionSchema, SessionFormData } from '../schemas';
import { storageService } from '../services/storage';
import { v4 as uuidv4 } from 'uuid';
import type { Session, Periodization } from '../models';

interface SessionFormScreenProps {
  periodization: Periodization;
  session?: Session;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SessionFormScreen({
  periodization,
  session,
  onSuccess,
  onCancel,
}: SessionFormScreenProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: session
      ? {
          name: session.name,
          notes: session.notes,
          scheduledAt: session.scheduledAt,
        }
      : {
          name: '',
          notes: '',
          scheduledAt: new Date(),
        },
  });

  const onSubmit = async (data: SessionFormData) => {
    setIsLoading(true);

    try {
      if (session) {
        await storageService.updateSession(session.id, {
          ...data,
          updatedAt: new Date(),
          needsSync: true,
        });
        toast.success('Sessão atualizada!');
      } else {
        await storageService.createSession({
          periodizationId: periodization.id,
          ...data,
          completedAt: null,
          syncedAt: null,
        });
        toast.success('Sessão criada!');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Não foi possível salvar a sessão');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background.primary }]} contentContainerStyle={styles.content}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl }}>
        <Ionicons 
          name={session ? "create-outline" : "add-circle-outline"} 
          size={28} 
          color={colors.primary} 
          style={{ marginRight: SPACING.sm }} 
        />
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {session ? 'Editar Sessão' : 'Nova Sessão'}
        </Text>
      </View>

      <Card style={{ backgroundColor: colors.background.secondary, borderColor: colors.border }}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Nome da Sessão *"
              placeholder="Ex: Treino A - Peito e Tríceps"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="scheduledAt"
          render={({ field: { onChange, value } }) => (
            <DateTimePickerComponent
              label="Data e Hora do Treino *"
              value={value}
              onChange={onChange}
              mode="datetime"
              error={errors.scheduledAt?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Observações (opcional)"
              placeholder="Notas sobre o treino, dicas, lembretes..."
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
          title={session ? 'Salvar Alterações' : 'Criar Sessão'}
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
