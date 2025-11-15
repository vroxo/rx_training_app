// Exercise model
export interface Exercise {
  id: string;
  userId: string;
  sessionId: string;
  name: string;
  muscleGroup?: string;
  equipment?: string;
  notes?: string;
  orderIndex: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  syncedAt?: Date;
  needsSync?: boolean;
}

export type CreateExerciseInput = Omit<
  Exercise,
  'id' | 'createdAt' | 'updatedAt' | 'syncedAt' | 'needsSync'
>;

export type UpdateExerciseInput = Partial<Omit<CreateExerciseInput, 'userId'>>;

