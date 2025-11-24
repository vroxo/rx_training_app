import { supabase } from '../supabase';
import { storageService } from '../storage';
import type { Periodization, Session, Exercise, Set as SetType } from '../../models';

export class SyncService {
  private static instance: SyncService;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000; // 1 second

  private constructor() {}

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * Retry logic wrapper for any async operation
   * Retries up to MAX_RETRIES times with exponential backoff
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `⚠️ [Retry ${attempt}/${this.MAX_RETRIES}] ${operationName} failed:`,
          error
        );

        if (attempt < this.MAX_RETRIES) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    console.error(`❌ ${operationName} failed after ${this.MAX_RETRIES} attempts`);
    throw lastError;
  }

  // ==============================================
  // MAIN SYNC FUNCTION
  // ==============================================

  public async syncAll(userId: string): Promise<void> {
    console.log('🔄 Starting full sync for user:', userId);

    try {
      // Sync in order with retry logic: Periodizations → Sessions → Exercises → Sets
      console.log('📋 STEP 1/4: Syncing periodizations...');
      await this.withRetry(
        () => this.syncPeriodizations(userId),
        'Sync Periodizations'
      );
      
      console.log('💪 STEP 2/4: Syncing sessions...');
      await this.withRetry(
        () => this.syncSessions(userId),
        'Sync Sessions'
      );
      
      console.log('🏋️ STEP 3/4: Syncing exercises...');
      await this.withRetry(
        () => this.syncExercises(userId),
        'Sync Exercises'
      );
      
      console.log('📊 STEP 4/4: Syncing sets...');
      await this.withRetry(
        () => this.syncSets(userId),
        'Sync Sets'
      );

      console.log('✅ Full sync completed successfully!');
    } catch (error) {
      console.error('❌ Sync failed after all retries:', error);
      throw error;
    }
  }

  // ==============================================
  // PERIODIZATIONS SYNC
  // ==============================================

  private async syncPeriodizations(userId: string): Promise<void> {
    console.log('📋 Syncing periodizations...');

    // 1. Push local changes to Supabase
    await this.pushPeriodizations(userId);

    // 2. Pull remote changes from Supabase
    await this.pullPeriodizations(userId);
  }

  private async pushPeriodizations(userId: string): Promise<void> {
    // ✅ Use *IncludingDeleted to sync deleted items too!
    const localPeriodizations = await storageService.getAllPeriodizationsIncludingDeleted(userId);
    const needsSync = localPeriodizations.filter(p => p.needsSync);

    if (needsSync.length === 0) {
      console.log('✅ No periodizations to push');
      return;
    }

    console.log(`📤 Pushing ${needsSync.length} periodizations...`);

    for (const periodization of needsSync) {
      try {
        const syncedAt = new Date();
        
        console.log('🔍 [DEBUG] Pushing periodization:', {
          id: periodization.id,
          name: periodization.name,
          deletedAt: periodization.deletedAt,
          deletedAtISO: periodization.deletedAt?.toISOString(),
        });
        
        // Always use upsert, including deleted items (soft delete)
        const payload = {
          id: periodization.id,
          user_id: periodization.userId,
          name: periodization.name,
          description: periodization.description,
          start_date: periodization.startDate.toISOString(),
          end_date: periodization.endDate.toISOString(),
          created_at: periodization.createdAt.toISOString(),
          updated_at: periodization.updatedAt.toISOString(),
          deleted_at: periodization.deletedAt?.toISOString() || null, // ✅ Soft delete!
          synced_at: syncedAt.toISOString(),
        };
        
        console.log('📤 [DEBUG] Payload to Supabase:', payload);
        
        const { error } = await supabase
          .from('periodizations')
          .upsert(payload);

        if (error) {
          console.error('❌ [DEBUG] Supabase error:', error);
          throw error;
        }
        
        console.log('✅ [DEBUG] Push successful!');

        
        // Update local with same timestamp
        await storageService.updatePeriodization(periodization.id, {
          needsSync: false,
          syncedAt: syncedAt,
        });

        console.log(`✅ Synced: ${periodization.name}`);
      } catch (error) {
        console.error(`❌ Failed to push periodization ${periodization.id}:`, error);
      }
    }
  }

  private async pullPeriodizations(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('periodizations')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    if (!data || data.length === 0) {
      console.log('✅ No remote periodizations to pull');
      return;
    }

    console.log(`📥 Pulling ${data.length} periodizations...`);

    for (const remote of data) {
      try {
        // ✅ Check including deleted to avoid recreating deleted items
        const local = await storageService.getPeriodizationByIdIncludingDeleted(remote.id);

        // Skip if locally deleted (soft delete)
        if (local?.deletedAt) {
          console.log(`⏭️ Skipping locally deleted periodization: ${remote.name}`);
          continue;
        }

        // If doesn't exist locally, create it
        if (!local) {
          await storageService.createPeriodization({
            id: remote.id,
            userId: remote.user_id,
            name: remote.name,
            description: remote.description,
            startDate: new Date(remote.start_date),
            endDate: new Date(remote.end_date),
            deletedAt: remote.deleted_at ? new Date(remote.deleted_at) : undefined, // ✅ Pull deleted_at
            syncedAt: new Date(),
            needsSync: false,
          });
          console.log(`✅ Pulled new periodization: ${remote.name}${remote.deleted_at ? ' (deleted)' : ''}`);
          continue;
        }

        // If exists locally but remote is newer, update local
        const remoteUpdated = new Date(remote.updated_at);
        if (remoteUpdated > local.updatedAt) {
          await storageService.updatePeriodization(remote.id, {
            name: remote.name,
            description: remote.description,
            startDate: new Date(remote.start_date),
            endDate: new Date(remote.end_date),
            deletedAt: remote.deleted_at ? new Date(remote.deleted_at) : undefined, // ✅ Pull deleted_at
            updatedAt: remoteUpdated,
            syncedAt: new Date(),
            needsSync: false,
          });
          console.log(`✅ Updated periodization from remote: ${remote.name}${remote.deleted_at ? ' (deleted)' : ''}`);
        }
      } catch (error) {
        console.error(`❌ Failed to pull periodization ${remote.id}:`, error);
      }
    }
  }

  // ==============================================
  // SESSIONS SYNC
  // ==============================================

  private async syncSessions(userId: string): Promise<void> {
    console.log('💪 Syncing sessions...');

    await this.pushSessions(userId);
    await this.pullSessions(userId);
  }

  private async pushSessions(userId: string): Promise<void> {
    const periodizations = await storageService.getAllPeriodizations(userId);
    let syncedCount = 0;
    
    for (const periodization of periodizations) {
      // ✅ Use *IncludingDeleted to sync deleted items too!
      const sessions = await storageService.getSessionsByPeriodizationIncludingDeleted(periodization.id);
      const needsSync = sessions.filter(s => s.needsSync);

      if (needsSync.length === 0) continue;

      for (const session of needsSync) {
        try {
          const syncedAt = new Date();
          
          // Always use upsert, including deleted items (soft delete)
          const { error } = await supabase
            .from('sessions')
            .upsert({
              id: session.id,
              user_id: userId, // REQUIRED FOR RLS
              periodization_id: session.periodizationId,
              name: session.name,
              notes: session.notes,
              scheduled_at: session.scheduledAt.toISOString(),
              completed_at: session.completedAt?.toISOString(),
              status: 'planned', // Default status
              created_at: session.createdAt.toISOString(),
              updated_at: session.updatedAt.toISOString(),
              deleted_at: session.deletedAt?.toISOString() || null, // ✅ Soft delete!
              synced_at: syncedAt.toISOString(),
            });

          if (error) throw error;
          
          // Update local with same timestamp
          await storageService.updateSession(session.id, {
            needsSync: false,
            syncedAt: syncedAt,
          });

          syncedCount++;
        } catch (error) {
          console.error(`❌ Failed to push session ${session.id}:`, error);
        }
      }
    }
    
    if (syncedCount > 0) {
      console.log(`✅ Synced ${syncedCount} sessions`);
    } else {
      console.log('✅ No sessions to push');
    }
  }

  private async pullSessions(userId: string): Promise<void> {
    // Get all user's periodizations
    const periodizations = await storageService.getAllPeriodizations(userId);
    const periodizationIds = periodizations.map(p => p.id);

    if (periodizationIds.length === 0) return;

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .in('periodization_id', periodizationIds);

    if (error) throw error;
    if (!data || data.length === 0) {
      console.log('✅ No remote sessions to pull');
      return;
    }

    console.log(`📥 Pulling ${data.length} sessions...`);

    for (const remote of data) {
      try {
        // ✅ Check including deleted to avoid recreating deleted items
        const local = await storageService.getSessionByIdIncludingDeleted(remote.id);

        // Skip if locally deleted (soft delete)
        if (local?.deletedAt) {
          console.log(`⏭️ Skipping locally deleted session: ${remote.name}`);
          continue;
        }

        if (!local) {
          await storageService.createSession({
            id: remote.id,
            periodizationId: remote.periodization_id,
            name: remote.name,
            notes: remote.notes,
            scheduledAt: new Date(remote.scheduled_at),
            completedAt: remote.completed_at ? new Date(remote.completed_at) : null,
            deletedAt: remote.deleted_at ? new Date(remote.deleted_at) : undefined, // ✅ Pull deleted_at
            syncedAt: new Date(),
            needsSync: false,
          });
          console.log(`✅ Pulled new session: ${remote.name}${remote.deleted_at ? ' (deleted)' : ''}`);
          continue;
        }

        const remoteUpdated = new Date(remote.updated_at);
        if (remoteUpdated > local.updatedAt) {
          await storageService.updateSession(remote.id, {
            name: remote.name,
            notes: remote.notes,
            scheduledAt: new Date(remote.scheduled_at),
            completedAt: remote.completed_at ? new Date(remote.completed_at) : null,
            deletedAt: remote.deleted_at ? new Date(remote.deleted_at) : undefined, // ✅ Pull deleted_at
            updatedAt: remoteUpdated,
            syncedAt: new Date(),
            needsSync: false,
          });
          console.log(`✅ Updated session from remote: ${remote.name}${remote.deleted_at ? ' (deleted)' : ''}`);
        }
      } catch (error) {
        console.error(`❌ Failed to pull session ${remote.id}:`, error);
      }
    }
  }

  // ==============================================
  // EXERCISES SYNC
  // ==============================================

  private async syncExercises(userId: string): Promise<void> {
    console.log('🏋️ Syncing exercises...');

    await this.pushExercises(userId);
    await this.pullExercises(userId);
  }

  private async pushExercises(userId: string): Promise<void> {
    const periodizations = await storageService.getAllPeriodizations(userId);
    let syncedCount = 0;
    
    for (const periodization of periodizations) {
      const sessions = await storageService.getSessionsByPeriodization(periodization.id);
      
      for (const session of sessions) {
        // ✅ Use *IncludingDeleted to sync deleted items too!
        const exercises = await storageService.getExercisesBySessionIncludingDeleted(session.id);
        const needsSync = exercises.filter(e => e.needsSync);

        if (needsSync.length === 0) continue;

        for (const exercise of needsSync) {
          try {
            const syncedAt = new Date();
            
            // Always use upsert, including deleted items (soft delete)
            const { error } = await supabase
              .from('exercises')
              .upsert({
                id: exercise.id,
                user_id: userId, // REQUIRED FOR RLS
                session_id: exercise.sessionId,
                name: exercise.name,
                notes: exercise.notes,
                muscle_group: exercise.muscleGroup,
                equipment: exercise.equipmentType, // Fixed column name
                order_index: exercise.orderIndex,
                conjugated_group: exercise.conjugatedGroup || null,
                conjugated_order: exercise.conjugatedOrder || null,
                completed_at: exercise.completedAt?.toISOString() || null,
                deleted_at: exercise.deletedAt?.toISOString() || null, // ✅ Soft delete!
                created_at: exercise.createdAt.toISOString(),
                updated_at: exercise.updatedAt.toISOString(),
                synced_at: syncedAt.toISOString(),
              });

            if (error) throw error;
            
            // Update local with same timestamp
            await storageService.updateExercise(exercise.id, {
              needsSync: false,
              syncedAt: syncedAt,
            });

            syncedCount++;
          } catch (error) {
            console.error(`❌ Failed to push exercise ${exercise.id}:`, error);
          }
        }
      }
    }
    
    if (syncedCount > 0) {
      console.log(`✅ Synced ${syncedCount} exercises`);
    } else {
      console.log('✅ No exercises to push');
    }
  }

  private async pullExercises(userId: string): Promise<void> {
    const periodizations = await storageService.getAllPeriodizations(userId);
    const sessions: Session[] = [];
    
    for (const p of periodizations) {
      const s = await storageService.getSessionsByPeriodization(p.id);
      sessions.push(...s);
    }

    const sessionIds = sessions.map(s => s.id);
    if (sessionIds.length === 0) return;

    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .in('session_id', sessionIds);

    if (error) throw error;
    if (!data || data.length === 0) {
      console.log('✅ No remote exercises to pull');
      return;
    }

    console.log(`📥 Pulling ${data.length} exercises...`);

    for (const remote of data) {
      try {
        // ✅ Check including deleted to avoid recreating deleted items
        const local = await storageService.getExerciseByIdIncludingDeleted(remote.id);

        // Skip if locally deleted (soft delete)
        if (local?.deletedAt) {
          console.log(`⏭️ Skipping locally deleted exercise: ${remote.name}`);
          continue;
        }

        if (!local) {
          await storageService.createExercise({
            id: remote.id,
            sessionId: remote.session_id,
            name: remote.name,
            notes: remote.notes,
            muscleGroup: remote.muscle_group,
            equipmentType: remote.equipment, // Fixed: equipment not equipment_type
            orderIndex: remote.order_index,
            conjugatedGroup: remote.conjugated_group || undefined,
            conjugatedOrder: remote.conjugated_order || undefined,
            completedAt: remote.completed_at ? new Date(remote.completed_at) : null,
            deletedAt: remote.deleted_at ? new Date(remote.deleted_at) : undefined, // ✅ Pull deleted_at
            syncedAt: new Date(),
            needsSync: false,
          });
          console.log(`✅ Pulled new exercise: ${remote.name}${remote.deleted_at ? ' (deleted)' : ''}`);
          continue;
        }

        const remoteUpdated = new Date(remote.updated_at);
        if (remoteUpdated > local.updatedAt) {
          await storageService.updateExercise(remote.id, {
            name: remote.name,
            notes: remote.notes,
            muscleGroup: remote.muscle_group,
            equipmentType: remote.equipment, // Fixed: equipment not equipment_type
            orderIndex: remote.order_index,
            conjugatedGroup: remote.conjugated_group || undefined,
            conjugatedOrder: remote.conjugated_order || undefined,
            completedAt: remote.completed_at ? new Date(remote.completed_at) : null,
            deletedAt: remote.deleted_at ? new Date(remote.deleted_at) : undefined, // ✅ Pull deleted_at
            updatedAt: remoteUpdated,
            syncedAt: new Date(),
            needsSync: false,
          });
          console.log(`✅ Updated exercise from remote: ${remote.name}${remote.deleted_at ? ' (deleted)' : ''}`);
        }
      } catch (error) {
        console.error(`❌ Failed to pull exercise ${remote.id}:`, error);
      }
    }
  }

  // ==============================================
  // SETS SYNC
  // ==============================================

  private async syncSets(userId: string): Promise<void> {
    console.log('📊 Syncing sets...');

    await this.pushSets(userId);
    await this.pullSets(userId);
  }

  private async pushSets(userId: string): Promise<void> {
    const periodizations = await storageService.getAllPeriodizations(userId);
    let syncedCount = 0;
    
    for (const periodization of periodizations) {
      const sessions = await storageService.getSessionsByPeriodization(periodization.id);
      
      for (const session of sessions) {
        const exercises = await storageService.getExercisesBySession(session.id);
        
        for (const exercise of exercises) {
          // ✅ Use *IncludingDeleted to sync deleted items too!
          const sets = await storageService.getSetsByExerciseIncludingDeleted(exercise.id);
          const needsSync = sets.filter(s => s.needsSync);

          if (needsSync.length === 0) continue;

          for (const set of needsSync) {
            try {
              // Skip sets without repetitions or orderIndex (invalid data)
              if (!set.deletedAt && (!set.repetitions || set.orderIndex === undefined || set.orderIndex === null)) {
                console.warn(`⚠️ Skipping set ${set.id} - missing repetitions or orderIndex`, {
                  repetitions: set.repetitions,
                  orderIndex: set.orderIndex,
                });
                // Mark as synced to prevent infinite retry
                await storageService.updateSet(set.id, {
                  needsSync: false,
                  syncedAt: new Date(),
                });
                continue;
              }

              const syncedAt = new Date();
              
              // Always use upsert, including deleted items (soft delete)
              const { error } = await supabase
                .from('sets')
                .upsert({
                  id: set.id,
                  user_id: userId, // REQUIRED FOR RLS
                  exercise_id: set.exerciseId,
                  order_index: set.orderIndex || 0, // Default to 0 for deleted sets
                  weight: set.weight,
                  repetitions: set.repetitions || 0, // Default to 0 for deleted sets
                  rest_time: set.restTime,
                  notes: set.notes,
                  completed_at: set.completedAt?.toISOString() || null,
                  deleted_at: set.deletedAt?.toISOString() || null, // ✅ Soft delete!
                  technique: set.technique || null,
                  set_type: set.setType || null,
                  rir: set.rir !== undefined ? set.rir : null,
                  rpe: set.rpe !== undefined ? set.rpe : null,
                  // Technique fields
                  drop_set_weights: set.dropSetWeights || null,
                  drop_set_reps: set.dropSetReps || null,
                  rest_pause_duration: set.restPauseDuration || null,
                  rest_pause_reps: set.restPauseReps || null,
                  cluster_reps: set.clusterReps || null,
                  cluster_rest_duration: set.clusterRestDuration || null,
                  created_at: set.createdAt.toISOString(),
                  updated_at: set.updatedAt.toISOString(),
                  synced_at: syncedAt.toISOString(),
                });

              if (error) throw error;
              
              // Update local with same timestamp
              await storageService.updateSet(set.id, {
                needsSync: false,
                syncedAt: syncedAt,
              });

              syncedCount++;
            } catch (error) {
              console.error(`❌ Failed to push set ${set.id}:`, error);
            }
          }
        }
      }
    }
    
    if (syncedCount > 0) {
      console.log(`✅ Synced ${syncedCount} sets`);
    } else {
      console.log('✅ No sets to push');
    }
  }

  private async pullSets(userId: string): Promise<void> {
    const periodizations = await storageService.getAllPeriodizations(userId);
    const exercises: Exercise[] = [];
    
    for (const p of periodizations) {
      const sessions = await storageService.getSessionsByPeriodization(p.id);
      for (const s of sessions) {
        const e = await storageService.getExercisesBySession(s.id);
        exercises.push(...e);
      }
    }

    const exerciseIds = exercises.map(e => e.id);
    if (exerciseIds.length === 0) return;

    const { data, error } = await supabase
      .from('sets')
      .select('*')
      .in('exercise_id', exerciseIds);

    if (error) throw error;
    if (!data || data.length === 0) {
      console.log('✅ No remote sets to pull');
      return;
    }

    console.log(`📥 Pulling ${data.length} sets...`);

    for (const remote of data) {
      try {
        // ✅ Check including deleted to avoid recreating deleted items
        const local = await storageService.getSetByIdIncludingDeleted(remote.id);

        // Skip if locally deleted (soft delete)
        if (local?.deletedAt) {
          console.log(`⏭️ Skipping locally deleted set #${remote.order_index + 1}`);
          continue;
        }

        if (!local) {
          await storageService.createSet({
            id: remote.id,
            exerciseId: remote.exercise_id,
            orderIndex: remote.order_index,
            weight: remote.weight,
            repetitions: remote.repetitions, // ✅ Fixed: was reps
            restTime: remote.rest_time,
            rir: remote.rir !== null ? remote.rir : undefined,
            rpe: remote.rpe !== null ? remote.rpe : undefined,
            technique: remote.technique || undefined,
            setType: remote.set_type || undefined,
            notes: remote.notes,
            completedAt: remote.completed_at ? new Date(remote.completed_at) : undefined,
            deletedAt: remote.deleted_at ? new Date(remote.deleted_at) : undefined, // ✅ Pull deleted_at
            // Technique fields
            dropSetWeights: remote.drop_set_weights || undefined,
            dropSetReps: remote.drop_set_reps || undefined,
            restPauseDuration: remote.rest_pause_duration || undefined,
            clusterReps: remote.cluster_reps || undefined,
            clusterRestDuration: remote.cluster_rest_duration || undefined,
            syncedAt: new Date(),
            needsSync: false,
          });
          console.log(`✅ Pulled new set #${remote.order_index + 1}${remote.deleted_at ? ' (deleted)' : ''}`);
          continue;
        }

        const remoteUpdated = new Date(remote.updated_at);
        if (remoteUpdated > local.updatedAt) {
          await storageService.updateSet(remote.id, {
            weight: remote.weight,
            repetitions: remote.repetitions, // ✅ Fixed: was reps
            restTime: remote.rest_time,
            rir: remote.rir !== null ? remote.rir : undefined,
            rpe: remote.rpe !== null ? remote.rpe : undefined,
            technique: remote.technique || undefined,
            setType: remote.set_type || undefined,
            notes: remote.notes,
            completedAt: remote.completed_at ? new Date(remote.completed_at) : undefined,
            deletedAt: remote.deleted_at ? new Date(remote.deleted_at) : undefined, // ✅ Pull deleted_at
            // Technique fields
            dropSetWeights: remote.drop_set_weights || undefined,
            dropSetReps: remote.drop_set_reps || undefined,
            restPauseDuration: remote.rest_pause_duration || undefined,
            restPauseReps: remote.rest_pause_reps || undefined,
            clusterReps: remote.cluster_reps || undefined,
            clusterRestDuration: remote.cluster_rest_duration || undefined,
            updatedAt: remoteUpdated,
            syncedAt: new Date(),
            needsSync: false,
          });
          console.log(`✅ Updated set from remote #${remote.order_index + 1}${remote.deleted_at ? ' (deleted)' : ''}`);
        }
      } catch (error) {
        console.error(`❌ Failed to pull set ${remote.id}:`, error);
      }
    }
  }
}

export const syncService = SyncService.getInstance();
