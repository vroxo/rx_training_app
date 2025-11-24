# Feature: Grupos Musculares Pré-definidos e Filtro

## Data de Implementação
18 de Novembro de 2025

## Descrição
Implementação de grupos musculares pré-definidos com seletor dropdown e filtro de exercícios por grupo muscular nos gráficos de progressão.

## Alterações Implementadas

### 1. Constantes de Grupos Musculares (`src/constants/muscleGroups.ts`)

Criado arquivo com 14 grupos musculares pré-definidos:
- Peito
- Costas
- Ombros
- Bíceps
- Tríceps
- Antebraço
- Abdômen
- Quadríceps
- Posterior de Coxa
- Glúteos
- Panturrilha
- Trapézio
- Lombar
- Corpo Todo

**Utilidades criadas:**
- `getMuscleGroupLabel(value)`: Retorna o label formatado do grupo muscular
- `isValidMuscleGroup(value)`: Valida se o valor é um grupo muscular válido

### 2. Componente Select (`src/components/Select.tsx`)

Criado componente cross-platform para seleção:
- **Web**: Usa `<select>` HTML5 nativo
- **Mobile**: Usa Modal personalizado com TouchableOpacity e ScrollView
- **Features**:
  - Suporta placeholder
  - Validação de erro
  - Estilo consistente com o tema
  - Ícone de chevron
  - Opção selecionada destacada (mobile)

### 3. ExerciseFormScreen (`src/screens/ExerciseFormScreen.tsx`)

**Antes**: Campo de texto livre para grupo muscular
```typescript
<Input
  label="Grupo Muscular (opcional)"
  placeholder="Ex: Peito, Costas, Pernas..."
  value={value}
  onChangeText={onChange}
/>
```

**Depois**: Seletor dropdown com opções pré-definidas
```typescript
<Select
  label="Grupo Muscular (opcional)"
  placeholder="Selecione o grupo muscular"
  value={value}
  onChange={onChange}
  options={MUSCLE_GROUPS}
/>
```

### 4. PeriodizationChartsModal (`src/components/PeriodizationChartsModal.tsx`)

Adicionado filtro por grupo muscular:

**Novo estado:**
```typescript
const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all');
```

**Filtro com useMemo:**
```typescript
const filteredProgressionData = useMemo(() => {
  if (selectedMuscleGroup === 'all') {
    return progressionData;
  }
  // Filtra exercícios pelo grupo muscular selecionado
}, [progressionData, selectedMuscleGroup]);
```

**UI do filtro:**
- Select dropdown com opção "Todos os Grupos" + grupos musculares
- Badge do grupo muscular abaixo do nome do exercício
- Mensagens de "vazio" contextuais (sem dados vs. sem dados para o filtro)

### 5. StatsService (`src/services/stats/StatsService.ts`)

Modificado `getPeriodizationExerciseProgression` para incluir `muscleGroup`:

**Antes:**
```typescript
Promise<Map<string, { dates: Date[]; maxWeights: number[]; sessionNames: string[] }>>
```

**Depois:**
```typescript
Promise<Map<string, { 
  dates: Date[]; 
  maxWeights: number[]; 
  sessionNames: string[]; 
  muscleGroup?: string 
}>>
```

## Benefícios

### UX Melhorada
1. **Consistência**: Dados padronizados em todo o sistema
2. **Facilidade**: Seleção rápida ao invés de digitação
3. **Organização**: Filtragem eficiente de exercícios nos gráficos
4. **Descoberta**: Usuário vê todos os grupos disponíveis

### Técnicos
1. **Validação**: Apenas valores válidos podem ser selecionados
2. **Manutenibilidade**: Lista centralizada e fácil de modificar
3. **Performance**: Filtro otimizado com `useMemo`
4. **Cross-platform**: Componente funciona em web e mobile

## Compatibilidade

### Dados Existentes
- ✅ Exercícios sem `muscleGroup` continuam funcionando
- ✅ Exercícios com texto livre em `muscleGroup` são preservados
- ✅ Novo exercícios usam valores padronizados

### Migração
Não é necessária migração de dados. O sistema suporta:
- `muscleGroup` vazio/undefined
- `muscleGroup` com texto livre (legado)
- `muscleGroup` com valor padronizado (novo)

## Como Usar

### Para o Usuário

**Criar/Editar Exercício:**
1. Abrir formulário de exercício
2. Clicar no campo "Grupo Muscular"
3. Selecionar da lista (ou deixar vazio)

**Filtrar Gráficos:**
1. Abrir modal de gráficos da periodização
2. Usar o filtro "Filtrar por Grupo Muscular"
3. Selecionar grupo desejado ou "Todos os Grupos"

### Para Desenvolvedores

**Usar o componente Select:**
```typescript
import { Select } from '../components';
import { MUSCLE_GROUPS } from '../constants';

<Select
  label="Escolha uma opção"
  value={selectedValue}
  onChange={setSelectedValue}
  options={MUSCLE_GROUPS}
  placeholder="Selecione..."
/>
```

**Adicionar novo grupo muscular:**
```typescript
// src/constants/muscleGroups.ts
export const MUSCLE_GROUPS = [
  // ... grupos existentes
  { value: 'novo-grupo', label: 'Novo Grupo' },
] as const;
```

## Testes Realizados

### Funcionalidades Testadas
- ✅ Seleção de grupo muscular no formulário de exercício (web e mobile)
- ✅ Salvamento do grupo muscular selecionado
- ✅ Filtro "Todos os Grupos" mostra todos os exercícios
- ✅ Filtro por grupo específico mostra apenas exercícios daquele grupo
- ✅ Badge do grupo muscular aparece nos cards de exercício
- ✅ Mensagem de "vazio" apropriada quando não há exercícios no filtro
- ✅ Compatibilidade com exercícios sem grupo muscular (undefined)

### Casos de Teste
1. **Novo exercício**: Criar exercício com grupo muscular
2. **Edição**: Alterar grupo muscular de exercício existente
3. **Sem grupo**: Criar exercício sem selecionar grupo
4. **Filtro**: Alternar entre diferentes grupos no modal de gráficos
5. **Vazio**: Verificar mensagem quando não há exercícios no grupo selecionado

## Melhorias Futuras (Opcional)

1. **Análise por Grupo**: Dashboard com estatísticas por grupo muscular
2. **Ícones**: Adicionar ícones específicos para cada grupo muscular
3. **Cores**: Código de cores para identificar rapidamente os grupos
4. **Templates**: Sugerir exercícios baseados no grupo muscular
5. **Multi-seleção**: Permitir filtrar por múltiplos grupos simultaneamente
6. **Distribuição**: Gráfico mostrando distribuição de treino por grupo
7. **Sugestões**: IA sugerindo grupos musculares baseado no nome do exercício

## Arquivos Modificados

### Novos Arquivos
- `src/constants/muscleGroups.ts`
- `src/components/Select.tsx`
- `FEATURE_MUSCLE_GROUPS.md` (este arquivo)

### Arquivos Modificados
- `src/components/index.ts`
- `src/constants/index.ts`
- `src/screens/ExerciseFormScreen.tsx`
- `src/components/PeriodizationChartsModal.tsx`
- `src/services/stats/StatsService.ts`

## Observações

- O componente Select foi implementado sem dependências externas para manter o bundle size reduzido
- A implementação mobile usa Modal + TouchableOpacity para melhor experiência nativa
- A web usa `<select>` nativo para melhor acessibilidade e performance
- O filtro é performático graças ao `useMemo` que só recalcula quando necessário

