import { supabase } from './client';
import type { Periodization, Session, Exercise, Set } from '../../models';

export class SupabaseService {
  private static instance: SupabaseService;

  private constructor() {}

  // Singleton pattern
  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  // ==============================================
  // PERIODIZATIONS
  // ==============================================

  public async getAllPeriodizations(userId: string): Promise<Periodization[]> {
    const { data, error } = await supabase
      .from('periodizations')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(this.mapPeriodization);
  }

  public async getPeriodizationById(id: string): Promise<Periodization | null> {
    const { data, error } = await supabase
      .from('periodizations')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return this.mapPeriodization(data);
  }

  public async createPeriodization(periodization: Omit<Periodization, 'createdAt' | 'updatedAt'>): Promise<Periodization> {
    const { data, error } = await supabase
      .from('periodizations')
      .insert({
        id: periodization.id,
        user_id: periodization.userId,
        name: periodization.name,
        description: periodization.description,
        start_date: periodization.startDate.toISOString(),
        end_date: periodization.endDate?.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapPeriodization(data);
  }

  public async updatePeriodization(id: string, updates: Partial<Periodization>): Promise<void> {
    const payload: any = {};

    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.startDate !== undefined) payload.start_date = updates.startDate.toISOString();
    if (updates.endDate !== undefined) payload.end_date = updates.endDate?.toISOString();

    const { error } = await supabase
      .from('periodizations')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
  }

  public async deletePeriodization(id: string): Promise<void> {
    const { error } = await supabase
      .from('periodizations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  // ==============================================
  // SESSIONS
  // ==============================================

  public async getSessionsByPeriodization(periodizationId: string): Promise<Session[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('periodization_id', periodizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(this.mapSession);
  }

  public async getSessionById(id: string): Promise<Session | null> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.mapSession(data);
  }

  public async createSession(session: Omit<Session, 'createdAt' | 'updatedAt'>): Promise<Session> {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        id: session.id,
        user_id: session.userId,
        periodization_id: session.periodizationId,
        name: session.name,
        scheduled_at: session.scheduledAt?.toISOString(),
        completed_at: session.completedAt?.toISOString(),
        status: session.status,
        notes: session.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapSession(data);
  }

  public async updateSession(id: string, updates: Partial<Session>): Promise<void> {
    const payload: any = {};

    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.scheduledAt !== undefined) payload.scheduled_at = updates.scheduledAt?.toISOString();
    if (updates.completedAt !== undefined) payload.completed_at = updates.completedAt?.toISOString();
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const { error } = await supabase
      .from('sessions')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
  }

  public async deleteSession(id: string): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  // ==============================================
  // EXERCISES
  // ==============================================

  public async getExercisesBySession(sessionId: string): Promise<Exercise[]> {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('session_id', sessionId)
      .is('deleted_at', null)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data.map(this.mapExercise);
  }

  public async getExerciseById(id: string): Promise<Exercise | null> {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.mapExercise(data);
  }

  public async createExercise(exercise: Omit<Exercise, 'createdAt' | 'updatedAt'>): Promise<Exercise> {
    const { data, error } = await supabase
      .from('exercises')
      .insert({
        id: exercise.id,
        user_id: exercise.userId,
        session_id: exercise.sessionId,
        name: exercise.name,
        muscle_group: exercise.muscleGroup,
        equipment: exercise.equipment,
        notes: exercise.notes,
        order_index: exercise.orderIndex,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapExercise(data);
  }

  public async updateExercise(id: string, updates: Partial<Exercise>): Promise<void> {
    const payload: any = {};

    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.muscleGroup !== undefined) payload.muscle_group = updates.muscleGroup;
    if (updates.equipment !== undefined) payload.equipment = updates.equipment;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.orderIndex !== undefined) payload.order_index = updates.orderIndex;

    const { error } = await supabase
      .from('exercises')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
  }

  public async deleteExercise(id: string): Promise<void> {
    const { error} = await supabase
      .from('exercises')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  // ==============================================
  // SETS
  // ==============================================

  public async getSetsByExercise(exerciseId: string): Promise<Set[]> {
    const { data, error } = await supabase
      .from('sets')
      .select('*')
      .eq('exercise_id', exerciseId)
      .is('deleted_at', null)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data.map(this.mapSet);
  }

  public async getSetById(id: string): Promise<Set | null> {
    const { data, error } = await supabase
      .from('sets')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.mapSet(data);
  }

  public async createSet(set: Omit<Set, 'createdAt' | 'updatedAt'>): Promise<Set> {
    const { data, error } = await supabase
      .from('sets')
      .insert({
        id: set.id,
        user_id: set.userId,
        exercise_id: set.exerciseId,
        order_index: set.orderIndex,
        repetitions: set.repetitions,
        weight: set.weight,
        technique: set.technique,
        set_type: set.setType,
        rest_time: set.restTime,
        rir: set.rir,
        rpe: set.rpe,
        notes: set.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapSet(data);
  }

  public async updateSet(id: string, updates: Partial<Set>): Promise<void> {
    const payload: any = {};

    if (updates.orderIndex !== undefined) payload.order_index = updates.orderIndex;
    if (updates.repetitions !== undefined) payload.repetitions = updates.repetitions;
    if (updates.weight !== undefined) payload.weight = updates.weight;
    if (updates.technique !== undefined) payload.technique = updates.technique;
    if (updates.setType !== undefined) payload.set_type = updates.setType;
    if (updates.restTime !== undefined) payload.rest_time = updates.restTime;
    if (updates.rir !== undefined) payload.rir = updates.rir;
    if (updates.rpe !== undefined) payload.rpe = updates.rpe;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const { error } = await supabase
      .from('sets')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
  }

  public async deleteSet(id: string): Promise<void> {
    const { error } = await supabase
      .from('sets')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  // ==============================================
  // MAPPER FUNCTIONS
  // ==============================================

  private mapPeriodization(data: any): Periodization {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description,
      startDate: new Date(data.start_date),
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      deletedAt: data.deleted_at ? new Date(data.deleted_at) : undefined,
      syncedAt: data.synced_at ? new Date(data.synced_at) : undefined,
    };
  }

  private mapSession(data: any): Session {
    return {
      id: data.id,
      userId: data.user_id,
      periodizationId: data.periodization_id,
      name: data.name,
      scheduledAt: data.scheduled_at ? new Date(data.scheduled_at) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      status: data.status,
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      deletedAt: data.deleted_at ? new Date(data.deleted_at) : undefined,
      syncedAt: data.synced_at ? new Date(data.synced_at) : undefined,
    };
  }

  private mapExercise(data: any): Exercise {
    return {
      id: data.id,
      userId: data.user_id,
      sessionId: data.session_id,
      name: data.name,
      muscleGroup: data.muscle_group,
      equipment: data.equipment,
      notes: data.notes,
      orderIndex: data.order_index,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      deletedAt: data.deleted_at ? new Date(data.deleted_at) : undefined,
      syncedAt: data.synced_at ? new Date(data.synced_at) : undefined,
    };
  }

  private mapSet(data: any): Set {
    return {
      id: data.id,
      userId: data.user_id,
      exerciseId: data.exercise_id,
      orderIndex: data.order_index,
      repetitions: data.repetitions,
      weight: Number(data.weight),
      technique: data.technique,
      setType: data.set_type,
      restTime: data.rest_time,
      rir: data.rir,
      rpe: data.rpe,
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      deletedAt: data.deleted_at ? new Date(data.deleted_at) : undefined,
      syncedAt: data.synced_at ? new Date(data.synced_at) : undefined,
    };
  }
}

// Export singleton instance
export const supabaseService = SupabaseService.getInstance();

