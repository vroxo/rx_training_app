// Session model
export type SessionStatus = 'planned' | 'in_progress' | 'completed';

export interface Session {
  id: string;
  userId: string;
  periodizationId: string;
  name: string;
  scheduledAt?: Date;
  completedAt?: Date;
  status: SessionStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  syncedAt?: Date;
  needsSync?: boolean;
}

export type CreateSessionInput = Omit<
  Session,
  'id' | 'createdAt' | 'updatedAt' | 'syncedAt' | 'needsSync' | 'status'
> & {
  status?: SessionStatus;
};

export type UpdateSessionInput = Partial<Omit<CreateSessionInput, 'userId'>>;

