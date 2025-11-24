/**
 * Grupos musculares pré-definidos para exercícios
 */

export const MUSCLE_GROUPS = [
  { value: 'peito', label: 'Peito' },
  { value: 'costas', label: 'Costas' },
  { value: 'ombros', label: 'Ombros' },
  { value: 'biceps', label: 'Bíceps' },
  { value: 'triceps', label: 'Tríceps' },
  { value: 'antebraco', label: 'Antebraço' },
  { value: 'abdomen', label: 'Abdômen' },
  { value: 'quadriceps', label: 'Quadríceps' },
  { value: 'posterior', label: 'Posterior de Coxa' },
  { value: 'gluteos', label: 'Glúteos' },
  { value: 'panturrilha', label: 'Panturrilha' },
  { value: 'trapezio', label: 'Trapézio' },
  { value: 'lombar', label: 'Lombar' },
] as const;

export type MuscleGroupValue = typeof MUSCLE_GROUPS[number]['value'];

/**
 * Retorna o label de um grupo muscular pelo value
 */
export function getMuscleGroupLabel(value: string | undefined): string {
  if (!value) return 'Não especificado';
  const group = MUSCLE_GROUPS.find(g => g.value === value);
  return group ? group.label : value;
}

/**
 * Valida se um value é um grupo muscular válido
 */
export function isValidMuscleGroup(value: string): boolean {
  return MUSCLE_GROUPS.some(g => g.value === value);
}

