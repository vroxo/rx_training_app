import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, ThemeToggle } from '../components';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useAuth, useSync } from '../hooks';
import { useSyncStore } from '../stores/syncStore';
import { toast } from '../services/toast';
import { haptic } from '../services/haptic';

const INTERVAL_OPTIONS = [
  { label: '1 minuto', value: 1 },
  { label: '5 minutos', value: 5 },
  { label: '10 minutos', value: 10 },
  { label: '15 minutos', value: 15 },
  { label: '30 minutos', value: 30 },
  { label: '1 hora', value: 60 },
];

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { isSyncing, isOnline, lastSyncedAt, sync } = useSync();
  const { autoSyncConfig, setAutoSyncConfig, loadAutoSyncConfig } = useSyncStore();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  
  const [selectedInterval, setSelectedInterval] = useState(autoSyncConfig.intervalMinutes);

  // Load config on mount
  useEffect(() => {
    loadAutoSyncConfig();
  }, [loadAutoSyncConfig]);

  // Sync local state with store
  useEffect(() => {
    setSelectedInterval(autoSyncConfig.intervalMinutes);
  }, [autoSyncConfig]);

  const handleSignOut = async () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              haptic.success();
              toast.success('Logout realizado com sucesso');
            } catch (error) {
              haptic.error();
              toast.error('Erro ao sair. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  const handleManualSync = async () => {
    try {
      await sync();
      haptic.success();
      toast.success('Sincronização concluída!');
    } catch (error) {
      haptic.error();
      toast.error('Erro ao sincronizar. Tente novamente.');
    }
  };

  const handleSync = async () => {
    if (!user) return;
    
    try {
      await sync(user.id);
      haptic.success();
      toast.success('Dados sincronizados com sucesso!');
    } catch (error) {
      haptic.error();
      toast.error('Erro ao sincronizar. Tente novamente.');
    }
  };

  const handleIntervalChange = async (minutes: number) => {
    setSelectedInterval(minutes);
    await setAutoSyncConfig({
      intervalMinutes: minutes,
    });
    toast.success(`Intervalo de sincronização alterado para ${INTERVAL_OPTIONS.find(o => o.value === minutes)?.label}`);
  };

  const dynamicStyles = createDynamicStyles(colors);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background.primary }]} 
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text.primary }]}>Perfil</Text>

      {/* Theme Toggle Card */}
      <Card style={[styles.card, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Ionicons name="color-palette" size={20} color={colors.primary} />
            <Text style={[styles.label, { color: colors.text.primary }]}>Tema:</Text>
          </View>
          <ThemeToggle />
        </View>
      </Card>

      {/* User Info Card */}
      <Card style={[styles.card, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-circle" size={24} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Informações</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>E-mail:</Text>
          <Text style={[styles.value, { color: colors.text.primary }]}>{user?.email || 'N/A'}</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Ionicons 
              name={isOnline ? 'cloud-done' : 'cloud-offline'} 
              size={18} 
              color={isOnline ? colors.success : colors.text.tertiary} 
            />
            <Text style={[styles.label, { color: colors.text.secondary }]}>Status:</Text>
          </View>
          <Text style={[styles.value, { color: isOnline ? colors.success : colors.text.tertiary }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>

        {lastSyncedAt && (
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>Última sync:</Text>
            <Text style={[styles.value, { color: colors.text.primary }]}>
              {new Date(lastSyncedAt).toLocaleString('pt-BR')}
            </Text>
          </View>
        )}
      </Card>

      {/* Auto Sync Card */}
      <Card style={[styles.card, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="sync" size={24} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Sincronização Automática</Text>
        </View>
        
        <Text style={[styles.syncDescription, { color: colors.text.secondary }]}>
          A sincronização está sempre ativa quando você estiver online.
        </Text>

        <View style={styles.intervalContainer}>
          <View style={styles.labelContainer}>
            <Ionicons name="timer" size={18} color={colors.text.secondary} />
            <Text style={[styles.intervalLabel, { color: colors.text.secondary }]}>
              Intervalo de sincronização:
            </Text>
          </View>
          <View style={styles.intervalButtons}>
            {INTERVAL_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleIntervalChange(option.value)}
                style={[
                  styles.intervalButton,
                  { 
                    backgroundColor: selectedInterval === option.value 
                      ? colors.primary 
                      : colors.background.tertiary,
                    borderColor: selectedInterval === option.value 
                      ? colors.primary 
                      : colors.border,
                  }
                ]}
              >
                <Text
                  style={[
                    styles.intervalButtonText,
                    {
                      color: selectedInterval === option.value
                        ? colors.background.primary
                        : colors.text.secondary,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Card>

      {/* Manual Sync Card */}
      <Card style={[styles.card, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="cloud-upload" size={24} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Sincronização Manual</Text>
        </View>
        <Text style={[styles.hint, { color: colors.text.tertiary }]}>
          Force uma sincronização imediata com a nuvem
        </Text>
        <Button
          title={isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
          onPress={handleSync}
          disabled={!isOnline || isSyncing}
          loading={isSyncing}
          fullWidth
          style={styles.syncButton}
        />
      </Card>

      <Button
        title="Sair"
        onPress={handleSignOut}
        variant="danger"
        fullWidth
        style={styles.signOutButton}
      />
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
  title: {
    fontSize: TYPOGRAPHY.size['3xl'],
    fontWeight: TYPOGRAPHY.weight.bold as any,
    marginBottom: SPACING.lg,
  },
  card: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
  },
  syncDescription: {
    fontSize: TYPOGRAPHY.size.sm,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  label: {
    fontSize: TYPOGRAPHY.size.base,
  },
  value: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.medium as any,
  },
  autoSyncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  intervalContainer: {
    marginTop: SPACING.sm,
  },
  intervalLabel: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.medium as any,
    marginBottom: SPACING.sm,
  },
  intervalButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  intervalButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  intervalButtonText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.medium as any,
  },
  hint: {
    fontSize: TYPOGRAPHY.size.sm,
    marginBottom: SPACING.md,
  },
  syncButton: {
    marginTop: SPACING.sm,
  },
  signOutButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
});

function createDynamicStyles(colors: ReturnType<typeof getThemeColors>) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.background.primary,
    },
  });
}
