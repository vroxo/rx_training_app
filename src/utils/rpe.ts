/**
 * Calcula o RPE (Rate of Perceived Exertion) baseado no RIR (Reps In Reserve)
 * 
 * Relação:
 * - RIR 0 = RPE 10 (falha muscular ou muito próximo)
 * - RIR 1 = RPE 9 (muito difícil, poderia fazer mais 1-2 reps)
 * - RIR 2 = RPE 8 (difícil, poderia fazer mais 2-3 reps)
 * - RIR 3 = RPE 7 (moderado, poderia fazer mais 3-4 reps)
 * - RIR 4+ = RPE 6 (leve, poderia fazer mais 5 reps ou mais)
 */
export function calculateRPEFromRIR(rir: number | undefined): number | undefined {
  if (rir === undefined || rir === null) {
    return undefined;
  }

  // Conversão RIR → RPE
  if (rir === 0) return 10;
  if (rir === 1) return 9;
  if (rir === 2) return 8;
  if (rir === 3) return 7;
  if (rir >= 4) return 6;

  // Caso não esperado (RIR negativo)
  return undefined;
}

/**
 * Retorna o label formatado do RPE baseado no valor
 */
export function getRPELabel(rpe: number | undefined): string {
  if (rpe === undefined || rpe === null) return '';

  const labels: Record<number, string> = {
    6: '6 - Leve',
    7: '7 - Moderado',
    8: '8 - Difícil',
    9: '9 - Muito difícil',
    10: '10 - Máximo',
  };

  return labels[rpe] || '';
}

