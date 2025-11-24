export type TechniqueType = 
  | 'standard'      // Série padrão
  | 'dropset'       // Drop Set
  | 'restpause'     // Rest Pause
  | 'clusterset';   // Cluster Set

export interface TechniqueOption {
  value: TechniqueType;
  label: string;
  description: string;
}

export const TECHNIQUES: TechniqueOption[] = [
  { 
    value: 'standard', 
    label: 'Padrão', 
    description: 'Série tradicional sem técnicas especiais' 
  },
  { 
    value: 'dropset', 
    label: 'Drop Set', 
    description: 'Redução progressiva de carga sem descanso' 
  },
  { 
    value: 'restpause', 
    label: 'Rest Pause', 
    description: 'Pausas breves durante a série para continuar' 
  },
  { 
    value: 'clusterset', 
    label: 'Cluster Set', 
    description: 'Mini-séries com descansos curtos entre elas' 
  },
];

export function getTechniqueLabel(technique?: TechniqueType | string): string {
  if (!technique || technique === 'standard') return 'Padrão';
  const tech = TECHNIQUES.find(t => t.value === technique);
  return tech?.label || 'Padrão';
}

export function getTechniqueColor(technique?: TechniqueType | string): string {
  switch (technique) {
    case 'dropset':
      return '#8B5CF6'; // Roxo
    case 'restpause':
      return '#EC4899'; // Rosa
    case 'clusterset':
      return '#14B8A6'; // Teal
    default:
      return '#6B7280'; // Cinza
  }
}

