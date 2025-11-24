import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, SyncStatusIndicator } from '../components';
import { SPACING, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from '../services/toast';
import { storageService } from '../services/storage';
import type { Periodization, Session } from '../models';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSyncStore } from '../stores/syncStore';

interface PeriodizationDetailScreenProps {
  periodization: Periodization;
  onEdit: () => void;
  onDelete: () => void;
  onViewSessions: () => void;
  onViewSessionDetail: (sessionId: string) => void;
  onAddSession: () => void;
  onEditSession: (session: Session) => void;
  onBack: () => void;
}

export function PeriodizationDetailScreen({
  periodization,
  onEdit,
  onDelete,
  onViewSessions,
  onViewSessionDetail,
  onAddSession,
  onEditSession,
  onBack,
}: PeriodizationDetailScreenProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { lastSyncedAt } = useSyncStore();
  const [currentPeriodization, setCurrentPeriodization] = useState<Periodization>(periodization);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Atualiza periodization quando prop muda
  useEffect(() => {
    setCurrentPeriodization(periodization);
  }, [periodization]);

  // Recarrega periodization do storage quando sync completa
  useEffect(() => {
    if (lastSyncedAt) {
      console.log('🔄 [PERIODIZATION_DETAIL] Recarregando periodization após sync...');
      storageService.getPeriodizationById(periodization.id).then((updated) => {
        if (updated) {
          setCurrentPeriodization(updated);
          console.log('✅ [PERIODIZATION_DETAIL] Periodization recarregada');
        }
      }).catch((error) => {
        console.error('❌ [PERIODIZATION_DETAIL] Erro ao recarregar:', error);
      });
    }
  }, [lastSyncedAt, periodization.id]);

  useEffect(() => {
    loadSessions();
  }, [periodization.id]);

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const loadedSessions = await storageService.getSessionsByPeriodization(currentPeriodization.id);
      setSessions(loadedSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Erro ao carregar sessões');
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleDuplicateSession = async (sessionId: string) => {
    try {
      await storageService.duplicateSession(sessionId);
      await loadSessions();
      toast.success('Sessão duplicada!');
    } catch (error) {
      console.error('Error duplicating session:', error);
      toast.error('Erro ao duplicar sessão');
    }
  };

  const handleEditSessionClick = (session: Session) => {
    onEditSession(session);
  };

  const handleDeleteSession = async (sessionId: string, sessionName: string) => {
    Alert.alert(
      'Excluir Sessão',
      `Tem certeza que deseja excluir "${sessionName}"? Esta ação não pode ser desfeita.`,
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
              await storageService.deleteSession(sessionId);
              await loadSessions();
              toast.success('Sessão excluída!');
            } catch (error) {
              console.error('Error deleting session:', error);
              toast.error('Erro ao excluir sessão');
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    if (!confirm('Tem certeza que deseja excluir esta periodização? Esta ação não pode ser desfeita.')) {
      return;
    }

    setIsDeleting(true);
    storageService.deletePeriodization(currentPeriodization.id)
      .then(() => {
        toast.success('Periodização excluída!');
        onDelete();
      })
      .catch((error) => {
        console.error('Error deleting periodization:', error);
        toast.error('Não foi possível excluir a periodização');
        setIsDeleting(false);
      });
  };

  const durationDays = Math.ceil(
    (currentPeriodization.endDate.getTime() - currentPeriodization.startDate.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background.secondary }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>{currentPeriodization.name}</Text>
        <Button title="Voltar" onPress={onBack} variant="outline" size="small" />
      </View>

      <Card style={styles.infoCard}>
        {currentPeriodization.description && (
          <View style={styles.infoCompactDescription}>
            <Text style={[styles.infoCompactLabel, { color: colors.text.secondary }]}>Descrição:</Text>
            <Text style={[styles.infoCompactValue, { color: colors.text.primary }]}>{currentPeriodization.description}</Text>
          </View>
        )}
        
        <View style={styles.infoCompactGrid}>
          <View style={styles.infoCompactItem}>
            <Text style={[styles.infoCompactLabel, { color: colors.text.secondary }]}>Data de Início:</Text>
            <Text style={[styles.infoCompactValue, { color: colors.text.primary }]}>
              {format(currentPeriodization.startDate, 'dd/MM/yyyy', { locale: ptBR })}
            </Text>
          </View>

          <View style={styles.infoCompactItem}>
            <Text style={[styles.infoCompactLabel, { color: colors.text.secondary }]}>Data de Fim:</Text>
            <Text style={[styles.infoCompactValue, { color: colors.text.primary }]}>
              {format(currentPeriodization.endDate, 'dd/MM/yyyy', { locale: ptBR })}
            </Text>
          </View>

          <View style={styles.infoCompactItem}>
            <Text style={[styles.infoCompactLabel, { color: colors.text.secondary }]}>Duração:</Text>
            <Text style={[styles.infoCompactValue, { color: colors.text.primary }]}>{durationDays} dias</Text>
          </View>

          <View style={styles.infoCompactItem}>
            <Text style={[styles.infoCompactLabel, { color: colors.text.secondary }]}>Status:</Text>
            <SyncStatusIndicator needsSync={currentPeriodization.needsSync} variant="full" size="small" />
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="barbell" size={24} color={colors.primary} style={{ marginRight: SPACING.sm }} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Sessões de Treino</Text>
          </View>
          <TouchableOpacity onPress={onAddSession} style={styles.addIconButton}>
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {loadingSessions ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Carregando...</Text>
          </View>
        ) : sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={colors.text.tertiary} style={{ marginBottom: SPACING.md }} />
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              Nenhuma sessão cadastrada
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.text.tertiary }]}>
              Toque no ícone + acima para adicionar
            </Text>
          </View>
        ) : (
          <View style={styles.sessionsList}>
            {sessions.map((session) => {
              const isCompleted = !!session.completedAt;
              const displayDate = session.completedAt || session.scheduledAt;

              return (
                <TouchableOpacity
                  key={session.id}
                  style={[
                    styles.sessionItem,
                    {
                      backgroundColor: colors.background.tertiary,
                      borderLeftColor: isCompleted ? colors.success : colors.warning,
                    },
                  ]}
                  onPress={() => onViewSessionDetail(session.id)}
                >
                  <View style={styles.sessionIconContainer}>
                    <Ionicons
                      name={isCompleted ? 'checkmark-circle' : 'time-outline'}
                      size={24}
                      color={isCompleted ? colors.success : colors.warning}
                    />
                  </View>
                  <View style={styles.sessionContent}>
                    <Text style={[styles.sessionName, { color: colors.text.primary }]}>
                      {session.name}
                    </Text>
                    <Text style={[styles.sessionDate, { color: colors.text.secondary }]}>
                      {format(displayDate, "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleEditSessionClick(session);
                      }}
                      style={{ padding: SPACING.xs }}
                    >
                      <Ionicons name="create-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDuplicateSession(session.id);
                      }}
                      style={{ padding: SPACING.xs }}
                    >
                      <Ionicons name="copy-outline" size={20} color={colors.text.secondary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id, session.name);
                      }}
                      style={{ padding: SPACING.xs }}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </Card>
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
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.size.sm,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  addButton: {
    minWidth: 200,
  },
  addIconButton: {
    padding: SPACING.xs,
  },
  loadingContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.size.base,
  },
  sessionsList: {
    gap: SPACING.sm,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  sessionIconContainer: {
    marginRight: SPACING.md,
  },
  sessionContent: {
    flex: 1,
  },
  sessionName: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
    marginBottom: 2,
  },
  sessionDate: {
    fontSize: TYPOGRAPHY.size.sm,
  },
  actions: {
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  infoCard: {
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  infoCompactDescription: {
    marginBottom: SPACING.sm,
  },
  infoCompactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  infoCompactItem: {
    flex: 1,
    minWidth: '45%',
  },
  infoCompactLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    marginBottom: SPACING.xs,
  },
  infoCompactValue: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.medium as any,
  },
});

