import { z } from 'zod';

export const exerciseSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  notes: z.string().optional(),
  muscleGroup: z.string().optional(),
  equipmentType: z.string().optional(),
  conjugatedGroup: z.string().optional(),
  conjugatedOrder: z.number().int().positive().optional(),
});

export type ExerciseFormData = z.infer<typeof exerciseSchema>;

