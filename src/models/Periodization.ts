// Periodization model
export interface Periodization {
  id: string;
  userId: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  syncedAt?: Date;
  needsSync?: boolean;
}

export type CreatePeriodizationInput = Omit<
  Periodization,
  'id' | 'createdAt' | 'updatedAt' | 'syncedAt' | 'needsSync'
>;

export type UpdatePeriodizationInput = Partial<
  Omit<CreatePeriodizationInput, 'userId'>
>;

