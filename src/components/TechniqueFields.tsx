import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, TYPOGRAPHY } from '../constants/theme';
import type { TechniqueType } from '../constants/techniques';
import { getTechniqueColor } from '../constants/techniques';

interface TechniqueFieldsProps {
  technique?: TechniqueType | string;
  dropSetWeights?: number[];
  dropSetReps?: number[];
  restPauseDuration?: number;
  restPauseReps?: number[]; // Array de durações de pausa em segundos
  clusterReps?: number;
  clusterRestDuration?: number;
  colors: any;
  onDropSetWeightsChange?: (weights: number[]) => void;
  onDropSetRepsChange?: (reps: number[]) => void;
  onRestPauseDurationChange?: (duration: number) => void;
  onRestPauseRepsChange?: (durations: number[]) => void; // Callback para durações
  onClusterRepsChange?: (reps: number) => void;
  onClusterRestDurationChange?: (duration: number) => void;
}

export function TechniqueFields({
  technique,
  dropSetWeights = [],
  dropSetReps = [],
  restPauseDuration,
  restPauseReps = [],
  clusterReps,
  clusterRestDuration,
  colors,
  onDropSetWeightsChange,
  onDropSetRepsChange,
  onRestPauseDurationChange,
  onRestPauseRepsChange,
  onClusterRepsChange,
  onClusterRestDurationChange,
}: TechniqueFieldsProps) {
  // Drop Set Fields
  if (technique === 'dropset') {
    const addDrop = () => {
      const newWeights = [...dropSetWeights, 0];
      const newReps = [...dropSetReps, 0];
      onDropSetWeightsChange?.(newWeights);
      onDropSetRepsChange?.(newReps);
    };

    const removeDrop = (index: number) => {
      const newWeights = dropSetWeights.filter((_, i) => i !== index);
      const newReps = dropSetReps.filter((_, i) => i !== index);
      onDropSetWeightsChange?.(newWeights);
      onDropSetRepsChange?.(newReps);
    };

    const updateDropWeight = (index: number, value: string) => {
      const newWeights = [...dropSetWeights];
      newWeights[index] = parseFloat(value) || 0;
      onDropSetWeightsChange?.(newWeights);
    };

    const updateDropReps = (index: number, value: string) => {
      const newReps = [...dropSetReps];
      newReps[index] = parseInt(value) || 0;
      onDropSetRepsChange?.(newReps);
    };

    return (
      <View style={styles.techniqueContainer}>
        <Text style={[styles.techniqueTitle, { color: colors.text.secondary }]}>
          Drop Set - Pesos e Reps
        </Text>
        {dropSetWeights.map((weight, index) => (
          <View key={index} style={styles.dropRow}>
            <Text style={[styles.dropLabel, { color: colors.text.secondary }]}>
              Drop {index + 1}:
            </Text>
            <View style={styles.dropInputs}>
              <TextInput
                style={[styles.dropInput, { 
                  backgroundColor: colors.background.primary, 
                  borderColor: colors.border, 
                  color: colors.text.primary 
                }]}
                placeholder="kg"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="numeric"
                value={weight.toString()}
                onChangeText={(value) => updateDropWeight(index, value)}
              />
              <TextInput
                style={[styles.dropInput, { 
                  backgroundColor: colors.background.primary, 
                  borderColor: colors.border, 
                  color: colors.text.primary 
                }]}
                placeholder="reps"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="numeric"
                value={(dropSetReps[index] || 0).toString()}
                onChangeText={(value) => updateDropReps(index, value)}
              />
            </View>
            <TouchableOpacity onPress={() => removeDrop(index)}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity onPress={addDrop} style={styles.addDropButton}>
          <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
          <Text style={[styles.addDropText, { color: colors.primary }]}>
            Adicionar Drop
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Rest Pause Fields
  if (technique === 'restpause') {
    const handleAddRestPause = () => {
      const newDurations = [...restPauseReps, 15]; // Adiciona 15s por padrão
      onRestPauseRepsChange?.(newDurations);
    };

    const handleRemoveRestPause = (index: number) => {
      const newDurations = restPauseReps.filter((_, i) => i !== index);
      onRestPauseRepsChange?.(newDurations);
    };

    const handleChangeDuration = (index: number, value: string) => {
      const newDurations = [...restPauseReps];
      newDurations[index] = parseInt(value) || 0;
      onRestPauseRepsChange?.(newDurations);
    };

    return (
      <View style={styles.techniqueContainer}>
        <Text style={[styles.techniqueTitle, { color: colors.text.secondary }]}>
          Rest Pause - Pausas
        </Text>
        
        {restPauseReps.length > 0 && (
          <View style={styles.restPauseList}>
            {restPauseReps.map((duration, index) => (
              <View key={index} style={styles.restPauseRow}>
                <View style={[styles.restPauseBadge, { backgroundColor: getTechniqueColor('restpause') }]}>
                  <Text style={styles.restPauseBadgeText}>{index + 1}</Text>
                </View>
                <TextInput
                  style={[styles.restPauseInput, { 
                    backgroundColor: colors.background.primary, 
                    borderColor: colors.border, 
                    color: colors.text.primary 
                  }]}
                  placeholder="15"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="numeric"
                  value={duration?.toString() || ''}
                  onChangeText={(value) => handleChangeDuration(index, value)}
                />
                <Text style={[styles.unit, { color: colors.text.secondary }]}>s</Text>
                <TouchableOpacity onPress={() => handleRemoveRestPause(index)}>
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity 
          style={styles.addDropButton} 
          onPress={handleAddRestPause}
        >
          <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
          <Text style={[styles.addDropText, { color: colors.primary }]}>
            Adicionar Pausa
          </Text>
        </TouchableOpacity>

        <Text style={[styles.hint, { color: colors.text.tertiary }]}>
          Faça reps até a falha, pause o tempo definido, repita
        </Text>
      </View>
    );
  }

  // Cluster Set Fields
  if (technique === 'clusterset') {
    return (
      <View style={styles.techniqueContainer}>
        <Text style={[styles.techniqueTitle, { color: colors.text.secondary }]}>
          Cluster Set - Configuração
        </Text>
        <View style={styles.inputRow}>
          <View style={styles.clusterInputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Reps por Cluster</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.background.primary, 
                borderColor: colors.border, 
                color: colors.text.primary 
              }]}
              placeholder="2-3"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="numeric"
              value={clusterReps?.toString() || ''}
              onChangeText={(value) => onClusterRepsChange?.(parseInt(value) || 0)}
            />
          </View>
          <View style={styles.clusterInputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Descanso (s)</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.background.primary, 
                borderColor: colors.border, 
                color: colors.text.primary 
              }]}
              placeholder="10-15"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="numeric"
              value={clusterRestDuration?.toString() || ''}
              onChangeText={(value) => onClusterRestDurationChange?.(parseInt(value) || 0)}
            />
          </View>
        </View>
        <Text style={[styles.hint, { color: colors.text.tertiary }]}>
          Mini-séries com descansos curtos entre elas
        </Text>
      </View>
    );
  }

  // No technique selected or standard
  return null;
}

const styles = StyleSheet.create({
  techniqueContainer: {
    marginTop: SPACING.sm,
    marginHorizontal: SPACING.sm,
    padding: SPACING.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  techniqueTitle: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  dropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: 6,
  },
  dropLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    minWidth: 45,
  },
  dropInputs: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  dropInput: {
    fontSize: TYPOGRAPHY.size.sm,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: 60,
    textAlign: 'center',
  },
  addDropButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
    borderStyle: 'dashed',
  },
  addDropText: {
    fontSize: TYPOGRAPHY.size.xs,
    marginLeft: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  input: {
    fontSize: TYPOGRAPHY.size.sm,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    flex: 1,
  },
  unit: {
    fontSize: TYPOGRAPHY.size.sm,
    marginLeft: SPACING.sm,
  },
  hint: {
    fontSize: TYPOGRAPHY.size.xs,
    fontStyle: 'italic',
  },
  clusterInputGroup: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    marginBottom: SPACING.xs,
  },
  restPauseList: {
    marginBottom: SPACING.xs,
  },
  restPauseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  restPauseBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restPauseBadgeText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.bold as any,
  },
  restPauseInput: {
    fontSize: TYPOGRAPHY.size.sm,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: 60,
    textAlign: 'center',
  },
});

