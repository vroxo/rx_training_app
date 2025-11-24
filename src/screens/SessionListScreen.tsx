import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, SyncStatusIndicator } from '../components';
import { SPACING, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { storageService } from '../services/storage';
import { toast } from '../services/toast';
import type { Periodization, Session } from '../models';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SessionListScreenProps {
  periodization: Periodization;
  onCreateSession: () => void;
  onSelectSession: (session: Session) => void;
  onEditSession: (session: Session) => void;
  onBack: () => void;
}

export function SessionListScreen({
  periodization,
  onCreateSession,
  onSelectSession,
  onEditSession,
  onBack,
}: SessionListScreenProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const data = await storageService.getSessionsByPeriodization(periodization.id);
      setSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [periodization.id]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadSessions();
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

  const getStatusBadge = (session: Session) => {
    if (session.completedAt) {
      return { text: 'Concluído', icon: 'checkmark-circle' as const, color: colors.success };
    }
    const now = new Date();
    const scheduled = new Date(session.scheduledAt);
    if (scheduled.toDateString() === now.toDateString()) {
      return { text: 'Hoje', icon: 'flame' as const, color: colors.warning };
    }
    if (scheduled < now) {
      return { text: 'Atrasado', icon: 'time-outline' as const, color: colors.error };
    }
    return { text: 'Agendado', icon: 'calendar-outline' as const, color: colors.primary };
  };

  const renderItem = ({ item }: { item: Session }) => {
    const status = getStatusBadge(item);

    return (
      <TouchableOpacity onPress={() => onSelectSession(item)}>
        <Card style={styles.sessionCard}>
          <View style={styles.cardHeader}>
            <Text style={[styles.sessionName, { color: colors.text.primary }]}>{item.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onEditSession(item);
                }}
              >
                <Ionicons name="create-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteSession(item.id, item.name);
                }}
              >
                <Ionicons name="trash-outline" size={22} color={colors.error} />
              </TouchableOpacity>
              <SyncStatusIndicator needsSync={item.needsSync} variant="icon-only" size="small" />
            </View>
          </View>
          <View style={styles.statusRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name={status.icon} size={16} color={status.color} style={{ marginRight: SPACING.xs }} />
              <Text style={[styles.statusBadge, { color: status.color }]}>
                {status.text}
              </Text>
            </View>
            <Text style={[styles.sessionDate, { color: colors.text.secondary }]}>
              {format(item.scheduledAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </Text>
          </View>

          {item.notes && (
            <Text style={[styles.sessionNotes, { color: colors.text.secondary }]} numberOfLines={2}>
              {item.notes}
            </Text>
          )}

          {item.completedAt && (
            <Text style={[styles.completedText, { color: colors.success }]}>
              Concluído em {format(item.completedAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
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
        <Text style={[styles.periodizationName, { color: colors.text.secondary }]} numberOfLines={1}>
          {periodization.name}
        </Text>
      </View>

      <View style={styles.titleRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="barbell" size={24} color={colors.primary} style={{ marginRight: SPACING.sm }} />
          <Text style={[styles.title, { color: colors.text.primary }]}>Sessões de Treino</Text>
        </View>
        <Button
          title="Nova"
          onPress={onCreateSession}
          size="small"
        />
      </View>

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>Carregando...</Text>
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={colors.text.tertiary} style={{ marginBottom: SPACING.md }} />
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>Nenhuma sessão ainda</Text>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            Crie sua primeira sessão de treino para esta periodização!
          </Text>
          <Button
            title="Criar Sessão"
            onPress={onCreateSession}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <FlatList
          data={sessions}
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
  periodizationName: {
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
  sessionCard: {
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sessionName: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statusBadge: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
  },
  sessionDate: {
    fontSize: TYPOGRAPHY.size.sm,
  },
  sessionNotes: {
    fontSize: TYPOGRAPHY.size.sm,
    marginTop: SPACING.xs,
  },
  completedText: {
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
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
