import { z } from 'zod';

export const setSchema = z.object({
  weight: z.number().min(0, 'Peso não pode ser negativo').optional(),
  reps: z.number().min(0, 'Repetições não podem ser negativas').optional(),
  duration: z.number().min(0, 'Duração não pode ser negativa').optional(),
  restTime: z.number().min(0, 'Tempo de descanso não pode ser negativo').optional(),
  notes: z.string().optional(),
  technique: z.enum(['standard', 'dropset', 'restpause', 'clusterset']).optional(),
  
  // Drop Set fields
  dropSetWeights: z.array(z.number().min(0, 'Peso não pode ser negativo')).optional(),
  dropSetReps: z.array(z.number().min(1, 'Mínimo 1 repetição')).optional(),
  
  // Rest Pause fields
  restPauseDuration: z.number().min(5, 'Duração mínima: 5 segundos').max(60, 'Duração máxima: 60 segundos').optional(),
  
  // Cluster Set fields
  clusterReps: z.number().min(1, 'Mínimo 1 rep por cluster').optional(),
  clusterRestDuration: z.number().min(5, 'Duração mínima: 5 segundos').max(60, 'Duração máxima: 60 segundos').optional(),
});

export type SetFormData = z.infer<typeof setSchema>;

