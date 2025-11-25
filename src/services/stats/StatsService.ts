import { storageService } from '../storage';
import type { Periodization, Session, Exercise, Set } from '../../models';
import { getMuscleGroupLabel } from '../../constants/muscleGroups';

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

export interface PersonalRecord {
  exerciseName: string;
  weight: number;
  reps: number;
  achievedAt: Date;
  improvement: number; // kg melhorados
}

export interface TrainingIntensity {
  averageRIR: number;
  totalSets: number;
  highIntensitySets: number; // RIR <= 3
  intensityPercentage: number;
  message: string;
}

export interface MuscleGroupHighlight {
  muscleGroup: string;
  totalVolume: number;
  improvement: number; // % de melhora
  sessionsCount: number;
}

export interface CurrentPeriodization {
  name: string;
  currentWeek: number;
  totalWeeks: number;
  progressPercentage: number;
  description?: string;
  daysRemaining: number;
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
  ): Promise<Map<string, { dates: Date[]; maxWeights: number[]; reps: number[]; sessionNames: string[]; muscleGroup?: string }>> {
    try {
      const progressionByExercise = new Map<
        string,
        { date: Date; maxWeight: number; reps: number; sessionName: string; muscleGroup?: string }[]
      >();

      // Get all sessions for this periodization
      const sessions = await storageService.getSessionsByPeriodization(periodizationId);
      
      // Filter only completed sessions that are not deleted, sort by date
      const completedSessions = sessions
        .filter(s => s.completedAt && !s.deletedAt)
        .sort((a, b) => a.completedAt!.getTime() - b.completedAt!.getTime());

      for (const session of completedSessions) {
        const exercises = await storageService.getExercisesBySession(session.id);

        for (const exercise of exercises) {
          const allSets = await storageService.getSetsByExercise(exercise.id);
          
          // Filter: only sets that are completed and not deleted
          const validSets = allSets.filter(s => 
            s.completedAt && !s.deletedAt
          );
          
          if (validSets.length === 0) continue;

          // Find the set with maximum weight
          const maxWeightSet = validSets.reduce((max, set) => 
            (set.weight || 0) > (max.weight || 0) ? set : max
          );

          // Initialize array for this exercise if needed
          if (!progressionByExercise.has(exercise.name)) {
            progressionByExercise.set(exercise.name, []);
          }

          // Add data point with muscle group and reps
          progressionByExercise.get(exercise.name)!.push({
            date: session.completedAt!,
            maxWeight: maxWeightSet.weight || 0,
            reps: maxWeightSet.repetitions || 0,
            sessionName: session.name,
            muscleGroup: exercise.muscleGroup,
          });
        }
      }

      // Convert to final format
      const result = new Map<string, { dates: Date[]; maxWeights: number[]; reps: number[]; sessionNames: string[]; muscleGroup?: string }>();
      
      for (const [exerciseName, dataPoints] of progressionByExercise.entries()) {
        // Sort by date
        dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());

        result.set(exerciseName, {
          dates: dataPoints.map(d => d.date),
          maxWeights: dataPoints.map(d => d.maxWeight),
          reps: dataPoints.map(d => d.reps),
          sessionNames: dataPoints.map(d => d.sessionName),
          muscleGroup: dataPoints[0]?.muscleGroup,
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

  // ==============================================
  // MOTIVATIONAL METRICS
  // ==============================================

  public async getLatestPersonalRecord(userId: string): Promise<PersonalRecord | null> {
    try {
      const now = new Date();
      const periodizations = await storageService.getAllPeriodizations(userId);
      
      // Find current periodization (not deleted and not ended)
      const currentPeriodization = periodizations
        .filter(p => {
          if (p.deletedAt) return false;
          const endDate = p.endDate ? new Date(p.endDate) : new Date(9999, 0, 1);
          return endDate >= now;
        })
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
      
      if (!currentPeriodization) return null;
      
      const periodStartDate = new Date(currentPeriodization.startDate);
      const periodEndDate = currentPeriodization.endDate ? new Date(currentPeriodization.endDate) : now;
      
      const exerciseRecords = new Map<string, { weight: number; reps: number; date: Date; previousWeight: number }>();

      const sessions = await storageService.getSessionsByPeriodization(currentPeriodization.id);
      
      // Sort sessions by completion date and filter deleted
      const completedSessions = sessions
        .filter(s => s.completedAt && !s.deletedAt)
        .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());

      for (const session of completedSessions) {
        const exercises = await storageService.getExercisesBySession(session.id);
        
        for (const exercise of exercises) {
          if (exercise.deletedAt) continue;
          
          const sets = await storageService.getSetsByExercise(exercise.id);
          const completedSets = sets.filter(s => s.completedAt && !s.deletedAt);
          
          for (const set of completedSets) {
            const key = exercise.name;
            const existing = exerciseRecords.get(key);
            
            if (!existing || set.weight > existing.weight) {
              exerciseRecords.set(key, {
                weight: set.weight,
                reps: set.repetitions,
                date: set.completedAt!,
                previousWeight: existing?.weight || 0,
              });
            }
          }
        }
      }

      // Find the most recent PR within current periodization
      let latestPR: PersonalRecord | null = null;
      let latestDate = new Date(0);

      for (const [exerciseName, record] of exerciseRecords.entries()) {
        const recordDate = new Date(record.date);
        if (recordDate >= periodStartDate && recordDate <= periodEndDate && recordDate > latestDate && record.previousWeight > 0) {
          latestDate = recordDate;
          latestPR = {
            exerciseName,
            weight: record.weight,
            reps: record.reps,
            achievedAt: record.date,
            improvement: record.weight - record.previousWeight,
          };
        }
      }

      return latestPR;
    } catch (error) {
      console.error('Error getting latest personal record:', error);
      return null;
    }
  }

  public async getTrainingIntensity(userId: string): Promise<TrainingIntensity> {
    try {
      const now = new Date();
      const periodizations = await storageService.getAllPeriodizations(userId);
      
      // Find current periodization (not deleted and not ended)
      const currentPeriodization = periodizations
        .filter(p => {
          if (p.deletedAt) return false;
          const endDate = p.endDate ? new Date(p.endDate) : new Date(9999, 0, 1);
          return endDate >= now;
        })
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
      
      if (!currentPeriodization) {
        return {
          averageRIR: 0,
          totalSets: 0,
          highIntensitySets: 0,
          intensityPercentage: 0,
          message: 'Crie uma periodização',
        };
      }
      
      const periodStartDate = new Date(currentPeriodization.startDate);
      const periodEndDate = currentPeriodization.endDate ? new Date(currentPeriodization.endDate) : now;
      
      let totalSets = 0;
      let totalRIR = 0;
      let setsWithRIR = 0;
      let highIntensitySets = 0;

      const sessions = await storageService.getSessionsByPeriodization(currentPeriodization.id);
      
      for (const session of sessions) {
        if (!session.completedAt || session.deletedAt) continue;
        
        const exercises = await storageService.getExercisesBySession(session.id);
        
        for (const exercise of exercises) {
          if (exercise.deletedAt) continue;
          
          const sets = await storageService.getSetsByExercise(exercise.id);
          const completedSets = sets.filter(s => s.completedAt && !s.deletedAt);
          
          for (const set of completedSets) {
            totalSets++;
            if (set.rir !== undefined && set.rir !== null) {
              totalRIR += set.rir;
              setsWithRIR++;
              if (set.rir <= 3) {
                highIntensitySets++;
              }
            }
          }
        }
      }

      const averageRIR = setsWithRIR > 0 ? totalRIR / setsWithRIR : 0;
      const intensityPercentage = setsWithRIR > 0 ? (highIntensitySets / setsWithRIR) * 100 : 0;

      let message = 'Sem dados suficientes';
      if (setsWithRIR > 0) {
        if (averageRIR <= 2) {
          message = 'Treinando muito pesado! 🔥';
        } else if (averageRIR <= 3) {
          message = 'Alta intensidade! 💪';
        } else if (averageRIR <= 5) {
          message = 'Intensidade moderada 👍';
        } else {
          message = 'Pode aumentar a intensidade 📈';
        }
      }

      return {
        averageRIR: Math.round(averageRIR * 10) / 10,
        totalSets: setsWithRIR,
        highIntensitySets,
        intensityPercentage: Math.round(intensityPercentage),
        message,
      };
    } catch (error) {
      console.error('Error getting training intensity:', error);
      return {
        averageRIR: 0,
        totalSets: 0,
        highIntensitySets: 0,
        intensityPercentage: 0,
        message: 'Erro ao calcular',
      };
    }
  }

  public async getMuscleGroupHighlight(userId: string): Promise<MuscleGroupHighlight | null> {
    try {
      const now = new Date();
      const periodizations = await storageService.getAllPeriodizations(userId);
      
      // Find current periodization (not deleted and not ended)
      const currentPeriodization = periodizations
        .filter(p => {
          if (p.deletedAt) return false;
          const endDate = p.endDate ? new Date(p.endDate) : new Date(9999, 0, 1);
          return endDate >= now;
        })
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
      
      if (!currentPeriodization) {
        return null;
      }
      
      const periodStartDate = new Date(currentPeriodization.startDate);
      const periodEndDate = currentPeriodization.endDate ? new Date(currentPeriodization.endDate) : now;
      
      // Calculate midpoint for comparison
      const periodDuration = periodEndDate.getTime() - periodStartDate.getTime();
      const midPoint = new Date(periodStartDate.getTime() + (periodDuration / 2));
      
      const muscleGroupData = new Map<string, { 
        currentVolume: number; 
        previousVolume: number; 
        secondHalfSessions: Set<string>; 
        firstHalfSessions: Set<string>;
        allSessions: Set<string>;
      }>();

      const sessions = await storageService.getSessionsByPeriodization(currentPeriodization.id);
      
      for (const session of sessions) {
        if (!session.completedAt || session.deletedAt) continue;
        
        const completedDate = new Date(session.completedAt);
        if (completedDate < periodStartDate || completedDate > periodEndDate) continue;
        
        const exercises = await storageService.getExercisesBySession(session.id);
        
        for (const exercise of exercises) {
          if (!exercise.muscleGroup || exercise.deletedAt) continue;
          
          const sets = await storageService.getSetsByExercise(exercise.id);
          const completedSets = sets.filter(s => s.completedAt && !s.deletedAt);
          const volume = completedSets.reduce((sum, set) => sum + (set.weight * set.repetitions), 0);
          
          const key = exercise.muscleGroup;
          const existing = muscleGroupData.get(key) || { 
            currentVolume: 0, 
            previousVolume: 0, 
            secondHalfSessions: new Set<string>(),
            firstHalfSessions: new Set<string>(),
            allSessions: new Set<string>()
          };
          
          existing.allSessions.add(session.id);
          
          // Second half vs first half comparison
          if (completedDate >= midPoint) {
            existing.currentVolume += volume;
            existing.secondHalfSessions.add(session.id);
          } else {
            existing.previousVolume += volume;
            existing.firstHalfSessions.add(session.id);
          }
          
          muscleGroupData.set(key, existing);
        }
      }

      // Find muscle group with highest improvement or highest volume
      let bestGroup: MuscleGroupHighlight | null = null;
      let bestImprovement = 0;
      let bestVolume = 0;
      let hasComparableData = false;

      for (const [muscleGroup, data] of muscleGroupData.entries()) {
        const totalVolume = data.previousVolume + data.currentVolume;
        
        // Check if we have data in both halves for comparison
        if (data.previousVolume > 0 && data.currentVolume > 0) {
          hasComparableData = true;
          const improvement = ((data.currentVolume - data.previousVolume) / data.previousVolume) * 100;
          
          if (improvement > bestImprovement) {
            bestImprovement = improvement;
            bestGroup = {
              muscleGroup: getMuscleGroupLabel(muscleGroup),
              totalVolume: data.currentVolume,
              improvement: Math.round(improvement),
              sessionsCount: data.secondHalfSessions.size,
            };
          }
        } else {
          // If no comparable data, track highest volume group
          if (totalVolume > bestVolume) {
            bestVolume = totalVolume;
            const volumeInHalf = data.currentVolume > 0 ? data.currentVolume : data.previousVolume;
            
            if (!hasComparableData) {
              bestGroup = {
                muscleGroup: getMuscleGroupLabel(muscleGroup),
                totalVolume: volumeInHalf,
                improvement: 0, // No comparison possible yet
                sessionsCount: data.allSessions.size,
              };
            }
          }
        }
      }

      return bestGroup;
    } catch (error) {
      console.error('Error getting muscle group highlight:', error);
      return null;
    }
  }

  public async getCurrentPeriodization(userId: string): Promise<CurrentPeriodization | null> {
    try {
      const periodizations = await storageService.getAllPeriodizations(userId);
      const now = new Date();

      // Find active periodization (ongoing or most recent, not deleted)
      const activePeriodization = periodizations
        .filter(p => {
          if (p.deletedAt) return false;
          const endDate = p.endDate ? new Date(p.endDate) : new Date(9999, 0, 1);
          return endDate >= now;
        })
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];

      if (!activePeriodization) return null;

      const startDate = new Date(activePeriodization.startDate);
      const endDate = activePeriodization.endDate ? new Date(activePeriodization.endDate) : now;
      
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysPassed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, totalDays - daysPassed);
      
      const totalWeeks = Math.ceil(totalDays / 7);
      const currentWeek = Math.min(Math.ceil(daysPassed / 7), totalWeeks);
      const progressPercentage = Math.min(Math.round((daysPassed / totalDays) * 100), 100);

      return {
        name: activePeriodization.name,
        currentWeek,
        totalWeeks,
        progressPercentage,
        description: activePeriodization.description,
        daysRemaining,
      };
    } catch (error) {
      console.error('Error getting current periodization:', error);
      return null;
    }
  }
}

export const statsService = StatsService.getInstance();

