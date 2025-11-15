import { z } from 'zod';

export const sessionSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  notes: z.string().optional(),
  scheduledAt: z.date({
    required_error: 'Data do treino é obrigatória',
    invalid_type_error: 'Data inválida',
  }),
});

export type SessionFormData = z.infer<typeof sessionSchema>;

