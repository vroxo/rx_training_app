// Exercise model
export interface Exercise {
  id: string;
  userId: string;
  sessionId: string;
  name: string;
  muscleGroup?: string;
  equipmentType?: string;
  notes?: string;
  orderIndex: number;
  // Campos para exercícios conjugados (Biset/Triset)
  conjugatedGroup?: string;  // UUID do grupo conjugado
  conjugatedOrder?: number;  // Ordem no grupo (1, 2, 3...)
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

/**
 * Retorna o tipo de conjugado baseado no número de exercícios
 */
export function getConjugatedType(count: number): string | null {
  switch (count) {
    case 2: return 'BISET';
    case 3: return 'TRISET';
    case 4: return 'QUADRISET';
    default: return count > 4 ? `${count} EXERCÍCIOS` : null;
  }
}

