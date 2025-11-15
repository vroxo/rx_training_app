import { z } from 'zod';

export const periodizationSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string().optional(),
  startDate: z.date({
    required_error: 'Data de início é obrigatória',
    invalid_type_error: 'Data inválida',
  }),
  endDate: z.date({
    required_error: 'Data de fim é obrigatória',
    invalid_type_error: 'Data inválida',
  }),
}).refine((data) => data.endDate > data.startDate, {
  message: 'Data de fim deve ser posterior à data de início',
  path: ['endDate'],
});

export type PeriodizationFormData = z.infer<typeof periodizationSchema>;

