// Set model
import type { TechniqueType } from '../constants/techniques';

export type SetType = 'warmup' | 'feeder' | 'workset' | 'backoff';

export interface Set {
  id: string;
  userId: string;
  exerciseId: string;
  orderIndex: number;
  repetitions: number;
  weight: number;
  technique?: TechniqueType | string;
  setType?: SetType;
  restTime?: number; // seconds
  rir?: number; // Reps in Reserve (0-10)
  rpe?: number; // Rate of Perceived Exertion (1-10)
  notes?: string;
  
  // Drop Set fields
  dropSetWeights?: number[]; // Array de pesos para cada drop
  dropSetReps?: number[]; // Array de repetições para cada drop
  
  // Rest Pause fields
  restPauseDuration?: number; // Duração do descanso em segundos (ex: 15-20s)
  
  // Cluster Set fields
  clusterReps?: number; // Reps por mini-série
  clusterRestDuration?: number; // Descanso entre clusters em segundos
  
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  syncedAt?: Date;
  needsSync?: boolean;
}

export type CreateSetInput = Omit<
  Set,
  'id' | 'createdAt' | 'updatedAt' | 'syncedAt' | 'needsSync'
>;

export type UpdateSetInput = Partial<Omit<CreateSetInput, 'userId'>>;

