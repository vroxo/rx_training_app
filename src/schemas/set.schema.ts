import { z } from 'zod';

export const setSchema = z.object({
  weight: z.number().min(0, 'Peso não pode ser negativo').optional(),
  reps: z.number().min(0, 'Repetições não podem ser negativas').optional(),
  duration: z.number().min(0, 'Duração não pode ser negativa').optional(),
  restTime: z.number().min(0, 'Tempo de descanso não pode ser negativo').optional(),
  notes: z.string().optional(),
});

export type SetFormData = z.infer<typeof setSchema>;

