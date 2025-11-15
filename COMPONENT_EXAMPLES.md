# 🎨 Exemplos de Componentes

## Inspirações de Design e Implementações

Este documento contém exemplos de componentes com base nas inspirações obtidas e adaptados para o contexto do RX Training App.

---

## 📊 Cards de Estatísticas

### 1. WorkoutSessionCard

Inspirado no Workout Summary Card, adaptado para exibir dados de uma sessão de treino.

```typescript
// src/views/components/common/WorkoutSessionCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Session } from '@models/index';
import { format } from 'date-fns';

interface WorkoutSessionCardProps {
  session: Session;
  onPress: () => void;
}

export function WorkoutSessionCard({ session, onPress }: WorkoutSessionCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{session.name}</Text>
          <Text style={styles.subtitle}>
            {session.completedDate 
              ? format(session.completedDate, 'dd/MM/yyyy HH:mm')
              : 'Não realizada'
            }
          </Text>
        </View>
        {session.status === 'completed' && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✓ Concluída</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <StatItem 
          label="Exercícios" 
          value={session.exercises?.length || 0} 
          icon="💪"
        />
        <StatItem 
          label="Duração" 
          value={`${session.duration || 0}min`} 
          icon="⏱️"
        />
        {session.rating && (
          <StatItem 
            label="Avaliação" 
            value={`${session.rating}/5`} 
            icon="⭐"
          />
        )}
      </View>

      {/* Notes Preview */}
      {session.notes && (
        <View style={styles.notes}>
          <Text style={styles.notesText} numberOfLines={2}>
            {session.notes}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

interface StatItemProps {
  label: string;
  value: string | number;
  icon: string;
}

function StatItem({ label, value, icon }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.icon}>{icon}</Text>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2D2D2D',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3D3D3D',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#A3A3A3',
  },
  badge: {
    backgroundColor: '#10B98133',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#3D3D3D',
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#A3A3A3',
  },
  notes: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
  },
  notesText: {
    fontSize: 14,
    color: '#E5E5E5',
    lineHeight: 20,
  },
});
```

---

## 📈 Progress Card (Evolução de Peso)

Inspirado no Vo2 Max Card, adaptado para mostrar progresso de um exercício.

```typescript
// src/views/components/charts/ExerciseProgressCard.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Svg, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
} from 'react-native-reanimated';

interface ExerciseProgressCardProps {
  exerciseName: string;
  currentWeight: number;
  initialWeight: number;
  progressPercentage: number;
  unit?: 'kg' | 'lbs';
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ExerciseProgressCard({
  exerciseName,
  currentWeight,
  initialWeight,
  progressPercentage,
  unit = 'kg',
}: ExerciseProgressCardProps) {
  const progress = useSharedValue(0);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    progress.value = withTiming(progressPercentage, { duration: 1500 });
  }, [progressPercentage]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - (progress.value / 100) * circumference,
  }));

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{exerciseName}</Text>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📊</Text>
        </View>
      </View>

      {/* Circular Progress */}
      <View style={styles.progressContainer}>
        <Svg width={180} height={180} style={styles.svg}>
          {/* Background Circle */}
          <Circle
            cx={90}
            cy={90}
            r={radius}
            stroke="#3D3D3D"
            strokeWidth={12}
            fill="none"
            strokeDasharray="8 12"
            strokeLinecap="round"
          />
          {/* Progress Circle */}
          <AnimatedCircle
            cx={90}
            cy={90}
            r={radius}
            stroke="#A855F7"
            strokeWidth={12}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeLinecap="round"
            animatedProps={animatedProps}
            rotation={-90}
            origin="90, 90"
          />
        </Svg>

        {/* Center Content */}
        <View style={styles.centerContent}>
          <Text style={styles.weightValue}>{currentWeight}</Text>
          <Text style={styles.weightUnit}>{unit}</Text>
          <Text style={styles.progressText}>
            +{progressPercentage.toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Você evoluiu de <Text style={styles.highlight}>{initialWeight}{unit}</Text>
          {'\n'}
          para <Text style={styles.highlight}>{currentWeight}{unit}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2D2D2D',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#3D3D3D',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E5E5E5',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  progressContainer: {
    position: 'relative',
    marginVertical: 24,
  },
  svg: {
    transform: [{ rotate: '-90deg' }],
  },
  centerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weightValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weightUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: '#A3A3A3',
    marginTop: -8,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 20,
  },
  highlight: {
    color: '#A855F7',
    fontWeight: '700',
  },
});
```

---

## 📊 Line Chart (Gráfico de Evolução)

```typescript
// src/views/components/charts/ProgressLineChart.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';
import { ChartDataPoint } from '@models/index';
import { format } from 'date-fns';

interface ProgressLineChartProps {
  data: ChartDataPoint[];
  exerciseName: string;
}

export function ProgressLineChart({ data, exerciseName }: ProgressLineChartProps) {
  const chartData = data.map(point => ({
    x: format(point.sessionDate, 'dd/MM'),
    y: point.maxWeight,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{exerciseName}</Text>
      
      <VictoryChart
        theme={VictoryTheme.material}
        width={Dimensions.get('window').width - 32}
        height={250}
        padding={{ top: 20, bottom: 50, left: 50, right: 20 }}
        style={{
          background: { fill: '#2D2D2D' },
        }}
      >
        <VictoryAxis
          style={{
            axis: { stroke: '#3D3D3D' },
            tickLabels: { fill: '#A3A3A3', fontSize: 12 },
            grid: { stroke: '#3D3D3D', strokeDasharray: '5,5' },
          }}
        />
        <VictoryAxis
          dependentAxis
          style={{
            axis: { stroke: '#3D3D3D' },
            tickLabels: { fill: '#A3A3A3', fontSize: 12 },
            grid: { stroke: '#3D3D3D', strokeDasharray: '5,5' },
          }}
        />
        <VictoryLine
          data={chartData}
          style={{
            data: {
              stroke: '#A855F7',
              strokeWidth: 3,
            },
          }}
          interpolation="natural"
        />
      </VictoryChart>

      {/* Stats Summary */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Inicial</Text>
          <Text style={styles.statValue}>{chartData[0]?.y}kg</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Atual</Text>
          <Text style={styles.statValue}>{chartData[chartData.length - 1]?.y}kg</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Progresso</Text>
          <Text style={[styles.statValue, styles.progressValue]}>
            +{((chartData[chartData.length - 1]?.y - chartData[0]?.y) / chartData[0]?.y * 100).toFixed(1)}%
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2D2D2D',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3D3D3D',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#3D3D3D',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#A3A3A3',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressValue: {
    color: '#10B981',
  },
});
```

---

## 🏋️ Set Input Card

Componente para registro de uma série durante o treino.

```typescript
// src/views/components/forms/SetInputCard.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SetType } from '@models/index';

interface SetInputCardProps {
  setNumber: number;
  onSave: (data: SetData) => void;
  previousSet?: SetData;
}

interface SetData {
  repetitions: number;
  weight: number;
  setType?: SetType;
  restTime: number;
}

export function SetInputCard({ setNumber, onSave, previousSet }: SetInputCardProps) {
  const [reps, setReps] = useState(previousSet?.repetitions.toString() || '');
  const [weight, setWeight] = useState(previousSet?.weight.toString() || '');
  const [setType, setSetTypeState] = useState<SetType | undefined>(previousSet?.setType);
  const [restTime, setRestTimeState] = useState(previousSet?.restTime.toString() || '90');

  const handleSave = () => {
    onSave({
      repetitions: parseInt(reps),
      weight: parseFloat(weight),
      setType,
      restTime: parseInt(restTime),
    });
  };

  const setTypes = [
    { value: SetType.WARMUP, label: 'Aquecimento', emoji: '🔥' },
    { value: SetType.FEEDER, label: 'Feeder', emoji: '⚡' },
    { value: SetType.WORKSET, label: 'Work Set', emoji: '💪' },
    { value: SetType.BACKOFF, label: 'Backoff', emoji: '📉' },
  ];

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Série {setNumber}</Text>
        {previousSet && (
          <Text style={styles.previousData}>
            Anterior: {previousSet.repetitions}x @ {previousSet.weight}kg
          </Text>
        )}
      </View>

      {/* Inputs Row */}
      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Reps</Text>
          <TextInput
            style={styles.input}
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
            placeholder="12"
            placeholderTextColor="#737373"
          />
        </View>

        <Text style={styles.separator}>×</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Peso (kg)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="80"
            placeholderTextColor="#737373"
          />
        </View>
      </View>

      {/* Set Type Selection */}
      <View style={styles.typeContainer}>
        <Text style={styles.label}>Tipo de Série</Text>
        <View style={styles.typeButtons}>
          {setTypes.map(type => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeButton,
                setType === type.value && styles.typeButtonActive,
              ]}
              onPress={() => setSetTypeState(type.value)}
            >
              <Text style={styles.typeEmoji}>{type.emoji}</Text>
              <Text
                style={[
                  styles.typeLabel,
                  setType === type.value && styles.typeLabelActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Rest Time */}
      <View style={styles.restTimeContainer}>
        <Text style={styles.label}>Descanso (segundos)</Text>
        <TextInput
          style={styles.input}
          value={restTime}
          onChangeText={setRestTimeState}
          keyboardType="number-pad"
          placeholder="90"
          placeholderTextColor="#737373"
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>✓ Salvar Série</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2D2D2D',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3D3D3D',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  previousData: {
    fontSize: 12,
    color: '#A3A3A3',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A3A3A3',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3D3D3D',
  },
  separator: {
    fontSize: 24,
    fontWeight: '700',
    color: '#A855F7',
    marginHorizontal: 12,
  },
  typeContainer: {
    marginBottom: 16,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3D3D3D',
    gap: 6,
  },
  typeButtonActive: {
    backgroundColor: '#A855F733',
    borderColor: '#A855F7',
  },
  typeEmoji: {
    fontSize: 16,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A3A3A3',
  },
  typeLabelActive: {
    color: '#A855F7',
  },
  restTimeContainer: {
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#A855F7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
```

---

## 🎯 EmptyState Component

```typescript
// src/views/components/common/EmptyState.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  emoji = '📋',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#A3A3A3',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#A855F7',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
```

---

## 🎨 Paleta de Emojis para o App

### Ícones de Navegação
- 📊 Dashboard
- 📅 Periodizações
- 💪 Sessões/Treinos
- ⚙️ Configurações

### Grupos Musculares
- 💪 Peito
- 🏋️ Costas
- 🤸 Ombros
- 💪 Bíceps
- 🔥 Tríceps
- 🦵 Pernas
- 🏃 Cardio

### Status e Feedback
- ✅ Completo
- ⏱️ Em Andamento
- 📝 Planejado
- ⚡ High Intensity
- 🎯 Meta Atingida
- 📈 Progresso
- 🔥 Streak/Sequência

---

Este arquivo serve como referência visual e de implementação para os principais componentes do app.

