# Modelos de Dados - RX Training App

## 📊 Estrutura de Dados Completa

### 1. Periodization (Periodização)

```typescript
interface Periodization {
  id: string;                    // UUID
  userId: string;                // Referência ao usuário
  name: string;                  // "Hipertrofia - Ciclo 1"
  description?: string;          // Descrição detalhada
  startDate: Date;               // Data de início
  endDate: Date;                 // Data prevista de término
  goal: PeriodizationGoal;       // Objetivo da periodização
  status: PeriodizationStatus;   // Status atual
  sessions: Session[];           // Array de sessões
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;              // Soft delete
}

enum PeriodizationGoal {
  HYPERTROPHY = 'hypertrophy',
  STRENGTH = 'strength',
  ENDURANCE = 'endurance',
  POWER = 'power',
  MIXED = 'mixed',
}

enum PeriodizationStatus {
  PLANNED = 'planned',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
}
```

### 2. Session (Sessão de Treino)

```typescript
interface Session {
  id: string;                    // UUID
  periodizationId: string;       // Referência à periodização
  name: string;                  // "Treino A - Peito e Tríceps"
  description?: string;
  scheduledDate?: Date;          // Data planejada
  completedDate?: Date;          // Data de conclusão real
  duration?: number;             // Duração em minutos
  status: SessionStatus;
  exercises: Exercise[];         // Array de exercícios
  notes?: string;                // Observações gerais
  rating?: number;               // Avaliação de 1-5
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

enum SessionStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}
```

### 3. Exercise (Exercício)

```typescript
interface Exercise {
  id: string;                    // UUID
  sessionId: string;             // Referência à sessão
  exerciseTemplateId?: string;   // Referência a template (biblioteca)
  name: string;                  // "Supino Reto com Barra"
  muscleGroup: MuscleGroup;      // Grupo muscular principal
  secondaryMuscles?: MuscleGroup[]; // Músculos secundários
  equipment: Equipment;          // Equipamento usado
  order: number;                 // Ordem na sessão
  sets: Set[];                   // Array de séries
  notes?: string;                // Observações do exercício
  videoUrl?: string;             // URL de vídeo demonstrativo
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

enum MuscleGroup {
  CHEST = 'chest',
  BACK = 'back',
  SHOULDERS = 'shoulders',
  BICEPS = 'biceps',
  TRICEPS = 'triceps',
  FOREARMS = 'forearms',
  QUADRICEPS = 'quadriceps',
  HAMSTRINGS = 'hamstrings',
  GLUTES = 'glutes',
  CALVES = 'calves',
  ABS = 'abs',
  CORE = 'core',
  FULL_BODY = 'full_body',
}

enum Equipment {
  BARBELL = 'barbell',
  DUMBBELL = 'dumbbell',
  MACHINE = 'machine',
  CABLE = 'cable',
  BODYWEIGHT = 'bodyweight',
  KETTLEBELL = 'kettlebell',
  RESISTANCE_BAND = 'resistance_band',
  SMITH_MACHINE = 'smith_machine',
  OTHER = 'other',
}
```

### 4. Set (Série)

```typescript
interface Set {
  id: string;                    // UUID
  exerciseId: string;            // Referência ao exercício
  order: number;                 // 1ª, 2ª, 3ª série
  repetitions: number;           // Número de repetições executadas
  targetReps?: number;           // Repetições planejadas
  weight: number;                // Peso em kg
  unit: WeightUnit;              // Unidade (kg, lbs)
  technique?: Technique;         // Técnica avançada aplicada
  setType?: SetType;             // Tipo de série
  restTime: number;              // Tempo de descanso em segundos
  rir?: number;                  // Reps in Reserve (0-5)
  rpe?: number;                  // Rate of Perceived Exertion (1-10)
  tempo?: string;                // Tempo de execução (ex: "3-1-2-0")
  notes?: string;                // Observações da série
  completed: boolean;            // Se foi completada
  completedAt?: Date;            // Quando foi completada
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

enum SetType {
  WARMUP = 'warmup',             // Aquecimento
  FEEDER = 'feeder',             // Feeder Set
  WORKSET = 'workset',           // Work Set (série principal)
  BACKOFF = 'backoff',           // Backoff Set
}

enum Technique {
  NONE = 'none',
  DROP_SET = 'drop_set',
  REST_PAUSE = 'rest_pause',
  CLUSTER_SET = 'cluster_set',
  SUPER_SET = 'super_set',
  GIANT_SET = 'giant_set',
  MYO_REPS = 'myo_reps',
  TEMPO = 'tempo',
  PAUSE_REPS = 'pause_reps',
  PARTIAL_REPS = 'partial_reps',
  NEGATIVE = 'negative',
}

enum WeightUnit {
  KG = 'kg',
  LBS = 'lbs',
}
```

---

## 🔗 Relacionamentos

```
Periodization (1) ──< (N) Session
Session (1) ──< (N) Exercise  
Exercise (1) ──< (N) Set
```

---

## 📈 Dados Calculados para Dashboard

### ChartDataPoint (Ponto no Gráfico)

```typescript
interface ChartDataPoint {
  sessionId: string;
  sessionDate: Date;
  exerciseName: string;
  maxWeight: number;              // Maior peso da sessão
  totalVolume: number;            // Peso total levantado
  totalReps: number;              // Total de repetições
  averageRir?: number;            // RIR médio
  averageRpe?: number;            // RPE médio
}
```

### ExerciseProgress (Evolução do Exercício)

```typescript
interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  dataPoints: ChartDataPoint[];
  firstWeight: number;            // Peso inicial
  currentWeight: number;          // Peso atual (última sessão)
  progressPercentage: number;     // % de evolução
  bestSet: Set;                   // Melhor série já realizada
  totalSessions: number;          // Quantas sessões realizadas
}
```

### DashboardMetrics (Métricas Gerais)

```typescript
interface DashboardMetrics {
  periodizationId: string;
  totalVolume: number;            // Volume total da periodização
  totalSessions: number;          // Sessões realizadas
  totalExercises: number;         // Exercícios únicos
  totalSets: number;              // Total de séries
  averageSessionDuration: number; // Duração média em minutos
  frequencyPerWeek: number;       // Sessões por semana
  topExercises: TopExercise[];    // Exercícios mais realizados
  muscleGroupDistribution: MuscleGroupStats[];
  progressionRate: number;        // Taxa de progressão média
}

interface TopExercise {
  exerciseId: string;
  name: string;
  timesPerformed: number;
  totalVolume: number;
  progress: number;               // % de evolução
}

interface MuscleGroupStats {
  muscleGroup: MuscleGroup;
  sessionsCount: number;
  volumePercentage: number;
}
```

---

## 💾 Exemplo de Dados (Seed)

### Periodização de Exemplo

```typescript
const examplePeriodization: Periodization = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  userId: 'user-123',
  name: 'Hipertrofia - Meso 1',
  description: 'Fase de acumulação com foco em volume',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-03-31'),
  goal: PeriodizationGoal.HYPERTROPHY,
  status: PeriodizationStatus.ACTIVE,
  sessions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

### Sessão de Exemplo

```typescript
const exampleSession: Session = {
  id: '660e8400-e29b-41d4-a716-446655440001',
  periodizationId: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Treino A - Peito e Tríceps',
  description: 'Foco em peito superior e tríceps lateral',
  scheduledDate: new Date('2025-01-15'),
  completedDate: new Date('2025-01-15T18:30:00'),
  duration: 75,
  status: SessionStatus.COMPLETED,
  exercises: [],
  notes: 'Bom treino, energia alta',
  rating: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

### Exercício de Exemplo

```typescript
const exampleExercise: Exercise = {
  id: '770e8400-e29b-41d4-a716-446655440002',
  sessionId: '660e8400-e29b-41d4-a716-446655440001',
  name: 'Supino Inclinado com Halteres',
  muscleGroup: MuscleGroup.CHEST,
  secondaryMuscles: [MuscleGroup.SHOULDERS, MuscleGroup.TRICEPS],
  equipment: Equipment.DUMBBELL,
  order: 1,
  sets: [],
  notes: 'Focar em amplitude completa',
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

### Séries de Exemplo

```typescript
const exampleSets: Set[] = [
  {
    id: '880e8400-e29b-41d4-a716-446655440003',
    exerciseId: '770e8400-e29b-41d4-a716-446655440002',
    order: 1,
    repetitions: 12,
    targetReps: 12,
    weight: 20,
    unit: WeightUnit.KG,
    technique: Technique.NONE,
    setType: SetType.WARMUP,
    restTime: 90,
    rir: 5,
    rpe: 6,
    completed: true,
    completedAt: new Date('2025-01-15T18:35:00'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440004',
    exerciseId: '770e8400-e29b-41d4-a716-446655440002',
    order: 2,
    repetitions: 10,
    targetReps: 10,
    weight: 32,
    unit: WeightUnit.KG,
    technique: Technique.NONE,
    setType: SetType.WORKSET,
    restTime: 120,
    rir: 2,
    rpe: 8,
    completed: true,
    completedAt: new Date('2025-01-15T18:37:00'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440005',
    exerciseId: '770e8400-e29b-41d4-a716-446655440002',
    order: 3,
    repetitions: 8,
    targetReps: 10,
    weight: 32,
    unit: WeightUnit.KG,
    technique: Technique.REST_PAUSE,
    setType: SetType.WORKSET,
    restTime: 120,
    rir: 0,
    rpe: 9,
    completed: true,
    completedAt: new Date('2025-01-15T18:40:00'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
```

---

## 🔍 Queries Úteis

### Buscar maior peso por exercício em cada sessão

```typescript
function getMaxWeightPerSession(
  exerciseName: string, 
  sessions: Session[]
): ChartDataPoint[] {
  return sessions
    .filter(session => session.status === SessionStatus.COMPLETED)
    .map(session => {
      const exercise = session.exercises.find(ex => ex.name === exerciseName);
      if (!exercise) return null;
      
      // Pegar apenas Work Sets para análise
      const workSets = exercise.sets.filter(
        set => set.setType === SetType.WORKSET && set.completed
      );
      
      if (workSets.length === 0) return null;
      
      // Encontrar maior peso
      const maxWeightSet = workSets.reduce((max, set) => 
        set.weight > max.weight ? set : max
      );
      
      // Calcular volume total
      const totalVolume = workSets.reduce(
        (sum, set) => sum + (set.weight * set.repetitions), 
        0
      );
      
      return {
        sessionId: session.id,
        sessionDate: session.completedDate!,
        exerciseName,
        maxWeight: maxWeightSet.weight,
        totalVolume,
        totalReps: workSets.reduce((sum, set) => sum + set.repetitions, 0),
        averageRir: workSets.reduce((sum, set) => sum + (set.rir || 0), 0) / workSets.length,
        averageRpe: workSets.reduce((sum, set) => sum + (set.rpe || 0), 0) / workSets.length,
      };
    })
    .filter(Boolean) as ChartDataPoint[];
}
```

---

## 📝 Validações Importantes

### Validação de Set

```typescript
const setSchema = z.object({
  repetitions: z.number().min(1).max(100),
  weight: z.number().min(0),
  restTime: z.number().min(0).max(600), // Máximo 10 minutos
  rir: z.number().min(0).max(10).optional(),
  rpe: z.number().min(1).max(10).optional(),
  tempo: z.string().regex(/^\d{1}-\d{1}-\d{1}-\d{1}$/).optional(),
});
```

### Validação de Periodização

```typescript
const periodizationSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  startDate: z.date(),
  endDate: z.date(),
  goal: z.nativeEnum(PeriodizationGoal),
}).refine(data => data.endDate > data.startDate, {
  message: "Data de término deve ser após data de início",
});
```

---

Este documento define toda a estrutura de dados necessária para o RX Training App.

