// Sync Queue model
export type SyncOperation = 'insert' | 'update' | 'delete';

export interface SyncQueue {
  id: string;
  userId: string;
  tableName: string;
  recordId: string;
  operation: SyncOperation;
  data?: Record<string, any>;
  createdAt: Date;
  synced: boolean;
}

export type CreateSyncQueueInput = Omit<SyncQueue, 'id' | 'createdAt' | 'synced'>;

