// Set model
export type SetType = 'warmup' | 'feeder' | 'workset' | 'backoff';

export interface Set {
  id: string;
  userId: string;
  exerciseId: string;
  orderIndex: number;
  repetitions: number;
  weight: number;
  technique?: string;
  setType?: SetType;
  restTime?: number; // seconds
  rir?: number; // Reps in Reserve (0-10)
  rpe?: number; // Rate of Perceived Exertion (1-10)
  notes?: string;
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

