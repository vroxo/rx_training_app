import { storageService } from '../storage';
import type { Periodization, Session, Exercise, Set } from '../../models';

export interface DashboardStats {
  totalPeriodizations: number;
  activePeriodizations: number;
  totalSessions: number;
  completedSessions: number;
  totalExercises: number;
  totalSets: number;
  completedSets: number;
  lastSession: Session | null;
  lastWorkoutDate: Date | null;
  totalVolume: number; // kg * reps
  averageVolume: number;
  currentStreak: number; // dias consecutivos
}

export interface ExerciseProgress {
  exerciseName: string;
  dates: Date[];
  maxWeights: number[];
  totalVolumes: number[];
}

export class StatsService {
  private static instance: StatsService;

  private constructor() {}

  public static getInstance(): StatsService {
    if (!StatsService.instance) {
      StatsService.instance = new StatsService();
    }
    return StatsService.instance;
  }

  // ==============================================
  // DASHBOARD STATS
  // ==============================================

  public async getDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      // Get all data
      const periodizations = await storageService.getAllPeriodizations(userId);
      
      let totalSessions = 0;
      let completedSessions = 0;
      let totalExercises = 0;
      let totalSets = 0;
      let completedSets = 0;
      let totalVolume = 0;
      let lastSession: Session | null = null;
      let lastWorkoutDate: Date | null = null;
      const allSessions: Session[] = [];

      // Aggregate data from all periodizations
      for (const periodization of periodizations) {
        const sessions = await storageService.getSessionsByPeriodization(periodization.id);
        allSessions.push(...sessions);
        totalSessions += sessions.length;

        for (const session of sessions) {
          if (session.completedAt) {
            completedSessions++;
            if (!lastWorkoutDate || session.completedAt > lastWorkoutDate) {
              lastWorkoutDate = session.completedAt;
              lastSession = session;
            }
          }

          const exercises = await storageService.getExercisesBySession(session.id);
          totalExercises += exercises.length;

          for (const exercise of exercises) {
            const sets = await storageService.getSetsByExercise(exercise.id);
            totalSets += sets.length;

            for (const set of sets) {
              if (set.completedAt) {
                completedSets++;
              }
              // Calculate volume: weight * repetitions
              totalVolume += (set.weight || 0) * (set.repetitions || 0);
            }
          }
        }
      }

      // Calculate active periodizations (not ended or end date in future)
      const now = new Date();
      const activePeriodizations = periodizations.filter(p => 
        !p.endDate || new Date(p.endDate) >= now
      ).length;

      // Calculate average volume per session
      const averageVolume = completedSessions > 0 
        ? totalVolume / completedSessions 
        : 0;

      // Calculate current streak (simplified - count last 7 days)
      const currentStreak = await this.calculateStreak(allSessions);

      return {
        totalPeriodizations: periodizations.length,
        activePeriodizations,
        totalSessions,
        completedSessions,
        totalExercises,
        totalSets,
        completedSets,
        lastSession,
        lastWorkoutDate,
        totalVolume,
        averageVolume,
        currentStreak,
      };
    } catch (error) {
      console.error('❌ Error calculating dashboard stats:', error);
      throw error;
    }
  }

  // ==============================================
  // EXERCISE PROGRESS
  // ==============================================

  public async getExerciseProgress(
    userId: string,
    exerciseName: string,
    limit: number = 10
  ): Promise<ExerciseProgress> {
    try {
      const periodizations = await storageService.getAllPeriodizations(userId);
      const dates: Date[] = [];
      const maxWeights: number[] = [];
      const totalVolumes: number[] = [];

      for (const periodization of periodizations) {
        const sessions = await storageService.getSessionsByPeriodization(periodization.id);

        for (const session of sessions) {
          if (!session.completedAt) continue;

          const exercises = await storageService.getExercisesBySession(session.id);
          const matchingExercise = exercises.find(e => 
            e.name.toLowerCase().includes(exerciseName.toLowerCase())
          );

          if (matchingExercise) {
            const sets = await storageService.getSetsByExercise(matchingExercise.id);
            
            if (sets.length > 0) {
              const maxWeight = Math.max(...sets.map(s => s.weight || 0));
              const volume = sets.reduce((acc, s) => 
                acc + ((s.weight || 0) * (s.repetitions || 0)), 0
              );

              dates.push(session.completedAt);
              maxWeights.push(maxWeight);
              totalVolumes.push(volume);
            }
          }
        }
      }

      // Sort by date and limit
      const combined = dates.map((date, i) => ({
        date,
        maxWeight: maxWeights[i],
        volume: totalVolumes[i],
      }));

      combined.sort((a, b) => a.date.getTime() - b.date.getTime());
      const limited = combined.slice(-limit);

      return {
        exerciseName,
        dates: limited.map(c => c.date),
        maxWeights: limited.map(c => c.maxWeight),
        totalVolumes: limited.map(c => c.volume),
      };
    } catch (error) {
      console.error('❌ Error calculating exercise progress:', error);
      throw error;
    }
  }

  // ==============================================
  // RECENT SESSIONS
  // ==============================================

  public async getRecentSessions(userId: string, limit: number = 5): Promise<Session[]> {
    try {
      const periodizations = await storageService.getAllPeriodizations(userId);
      const allSessions: Session[] = [];

      for (const periodization of periodizations) {
        const sessions = await storageService.getSessionsByPeriodization(periodization.id);
        allSessions.push(...sessions);
      }

      // Sort by completed date (or scheduled date if not completed)
      allSessions.sort((a, b) => {
        const dateA = a.completedAt || a.scheduledAt;
        const dateB = b.completedAt || b.scheduledAt;
        return dateB.getTime() - dateA.getTime();
      });

      return allSessions.slice(0, limit);
    } catch (error) {
      console.error('❌ Error getting recent sessions:', error);
      throw error;
    }
  }

  // ==============================================
  // EXERCISE WEIGHT PROGRESSION
  // ==============================================

  public async getExerciseWeightProgression(
    userId: string,
    exerciseName: string,
    limit: number = 10
  ): Promise<{
    dates: Date[];
    maxWeights: number[];
    sessionNames: string[];
  }> {
    try {
      const periodizations = await storageService.getAllPeriodizations(userId);
      const progressionData: { date: Date; maxWeight: number; sessionName: string }[] = [];

      for (const periodization of periodizations) {
        const sessions = await storageService.getSessionsByPeriodization(periodization.id);

        for (const session of sessions) {
          if (!session.completedAt) continue;

          const exercises = await storageService.getExercisesBySession(session.id);
          
          for (const exercise of exercises) {
            // Match exercise by name (case insensitive)
            if (exercise.name.toLowerCase() !== exerciseName.toLowerCase()) continue;

            const sets = await storageService.getSetsByExercise(exercise.id);
            if (sets.length === 0) continue;

            // Find the maximum weight among all sets in this session
            const maxWeight = Math.max(...sets.map(s => s.weight || 0));

            progressionData.push({
              date: session.completedAt,
              maxWeight,
              sessionName: session.name,
            });
          }
        }
      }

      // Sort by date
      progressionData.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Take last N entries
      const limited = progressionData.slice(-limit);

      return {
        dates: limited.map(d => d.date),
        maxWeights: limited.map(d => d.maxWeight),
        sessionNames: limited.map(d => d.sessionName),
      };
    } catch (error) {
      console.error('❌ Error getting exercise weight progression:', error);
      throw error;
    }
  }

  public async getAllExerciseNames(userId: string): Promise<string[]> {
    try {
      const periodizations = await storageService.getAllPeriodizations(userId);
      const exerciseNames = new Set<string>();

      for (const periodization of periodizations) {
        const sessions = await storageService.getSessionsByPeriodization(periodization.id);

        for (const session of sessions) {
          const exercises = await storageService.getExercisesBySession(session.id);
          exercises.forEach(ex => exerciseNames.add(ex.name));
        }
      }

      return Array.from(exerciseNames).sort();
    } catch (error) {
      console.error('❌ Error getting exercise names:', error);
      throw error;
    }
  }

  /**
   * Get weight progression for all exercises within a specific periodization
   */
  public async getPeriodizationExerciseProgression(
    periodizationId: string
  ): Promise<Map<string, { dates: Date[]; maxWeights: number[]; sessionNames: string[]; muscleGroup?: string }>> {
    try {
      const progressionByExercise = new Map<
        string,
        { date: Date; maxWeight: number; sessionName: string; muscleGroup?: string }[]
      >();

      // Get all sessions for this periodization
      const sessions = await storageService.getSessionsByPeriodization(periodizationId);
      
      // Filter only completed sessions and sort by date
      const completedSessions = sessions
        .filter(s => s.completedAt)
        .sort((a, b) => a.completedAt!.getTime() - b.completedAt!.getTime());

      for (const session of completedSessions) {
        const exercises = await storageService.getExercisesBySession(session.id);

        for (const exercise of exercises) {
          const sets = await storageService.getSetsByExercise(exercise.id);
          if (sets.length === 0) continue;

          // Find the maximum weight among all sets in this session
          const maxWeight = Math.max(...sets.map(s => s.weight || 0));

          // Initialize array for this exercise if needed
          if (!progressionByExercise.has(exercise.name)) {
            progressionByExercise.set(exercise.name, []);
          }

          // Add data point with muscle group
          progressionByExercise.get(exercise.name)!.push({
            date: session.completedAt!,
            maxWeight,
            sessionName: session.name,
            muscleGroup: exercise.muscleGroup,
          });
        }
      }

      // Convert to final format
      const result = new Map<string, { dates: Date[]; maxWeights: number[]; sessionNames: string[]; muscleGroup?: string }>();
      
      for (const [exerciseName, dataPoints] of progressionByExercise.entries()) {
        // Sort by date
        dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());

        result.set(exerciseName, {
          dates: dataPoints.map(d => d.date),
          maxWeights: dataPoints.map(d => d.maxWeight),
          sessionNames: dataPoints.map(d => d.sessionName),
          muscleGroup: dataPoints[0]?.muscleGroup, // Use muscleGroup do primeiro exercício
        });
      }

      return result;
    } catch (error) {
      console.error('❌ Error getting periodization exercise progression:', error);
      throw error;
    }
  }

  // ==============================================
  // VOLUME EVOLUTION (last 30 days)
  // ==============================================

  public async getVolumeEvolution(userId: string, days: number = 30): Promise<{
    dates: Date[];
    volumes: number[];
  }> {
    try {
      const periodizations = await storageService.getAllPeriodizations(userId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const sessionVolumes: { date: Date; volume: number }[] = [];

      for (const periodization of periodizations) {
        const sessions = await storageService.getSessionsByPeriodization(periodization.id);

        for (const session of sessions) {
          if (!session.completedAt || session.completedAt < cutoffDate) continue;

          let sessionVolume = 0;
          const exercises = await storageService.getExercisesBySession(session.id);

          for (const exercise of exercises) {
            const sets = await storageService.getSetsByExercise(exercise.id);
            sessionVolume += sets.reduce((acc, s) => 
              acc + ((s.weight || 0) * (s.repetitions || 0)), 0
            );
          }

          sessionVolumes.push({
            date: session.completedAt,
            volume: sessionVolume,
          });
        }
      }

      // Sort by date
      sessionVolumes.sort((a, b) => a.date.getTime() - b.date.getTime());

      return {
        dates: sessionVolumes.map(sv => sv.date),
        volumes: sessionVolumes.map(sv => sv.volume),
      };
    } catch (error) {
      console.error('❌ Error calculating volume evolution:', error);
      throw error;
    }
  }

  // ==============================================
  // HELPER METHODS
  // ==============================================

  private async calculateStreak(sessions: Session[]): Promise<number> {
    const completedSessions = sessions
      .filter(s => s.completedAt)
      .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());

    if (completedSessions.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const session of completedSessions) {
      const sessionDate = new Date(session.completedAt!);
      sessionDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0 || diffDays === 1) {
        streak++;
        currentDate = sessionDate;
      } else {
        break;
      }
    }

    return streak;
  }

  // ==============================================
  // DATE RANGE QUERIES
  // ==============================================

  public async getSessionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Session[]> {
    try {
      const periodizations = await storageService.getAllPeriodizations(userId);
      const allSessions: Session[] = [];

      for (const periodization of periodizations) {
        const sessions = await storageService.getSessionsByPeriodization(periodization.id);
        allSessions.push(...sessions);
      }

      // Filter by date range
      return allSessions.filter(session => {
        const sessionDate = new Date(session.scheduledAt);
        return sessionDate >= startDate && sessionDate <= endDate;
      });
    } catch (error) {
      console.error('Error getting sessions by date range:', error);
      return [];
    }
  }
}

export const statsService = StatsService.getInstance();

