import type { SetType } from '../models/Set';

export const SET_TYPES = [
  { value: 'warmup' as SetType, label: 'Aquecimento' },
  { value: 'feeder' as SetType, label: 'Feeder Set' },
  { value: 'workset' as SetType, label: 'Work Set' },
  { value: 'backoff' as SetType, label: 'Backoff' },
];

export function getSetTypeLabel(setType?: SetType): string {
  if (!setType) return '';
  const type = SET_TYPES.find(t => t.value === setType);
  return type?.label || '';
}

export function getSetTypeColor(setType?: SetType): string {
  switch (setType) {
    case 'warmup':
      return '#3B82F6'; // Azul
    case 'feeder':
      return '#10B981'; // Verde
    case 'workset':
      return '#EF4444'; // Vermelho
    case 'backoff':
      return '#F59E0B'; // Laranja
    default:
      return '#6B7280'; // Cinza
  }
}

