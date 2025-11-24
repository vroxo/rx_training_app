# Feature: Exercícios Conjugados (Biset/Triset)

## Status: ✅ COMPLETO

## Data de Implementação
19 de Novembro de 2025

## Descrição
Implementação de exercícios conjugados (Biset, Triset, Quadriset, etc.) que permite agrupar múltiplos exercícios para serem executados em sequência sem descanso entre eles.

## ✅ Progresso Atual

### Concluído:
1. ✅ **Modelo Exercise atualizado**
   - Adicionado `conjugatedGroup?: string` (UUID do grupo)
   - Adicionado `conjugatedOrder?: number` (ordem no grupo: 1, 2, 3...)
   - Criada função helper `getConjugatedType(count)` → retorna 'BISET', 'TRISET', etc.

2. ✅ **Schema de validação atualizado**
   - `conjugatedGroup` como string opcional
   - `conjugatedOrder` como número inteiro positivo opcional

3. ✅ **Lógica de agrupamento criada**
   - useMemo em `SessionDetailScreen` que agrupa exercícios por `conjugatedGroup`
   - Ordena exercícios conjugados por `conjugatedOrder`
   - Mantém exercícios não-conjugados separados

4. ✅ **Visual de grupos conjugados** (SessionDetailScreen)
   - ✅ Renderizado com visual especial: borda dupla azul, background diferenciado
   - ✅ Badge no topo com tipo (BISET/TRISET)
   - ✅ Números de ordem (1, 2, 3) em badges circulares
   - ✅ Separadores entre exercícios do grupo
   - ✅ Ícone de link no badge

5. ✅ **Formulário de exercício completo**
   - ✅ UI para criar novo grupo conjugado
   - ✅ UI para adicionar a grupo existente
   - ✅ Listagem de grupos disponíveis na sessão
   - ✅ Seleção por radio buttons (3 opções: Não conjugar / Criar novo / Adicionar existente)
   - ✅ Ordem automática calculada ao adicionar a grupo
   - ✅ Feedback visual para cada modo

6. ✅ **Sincronização**
   - ✅ Push de `conjugated_group` e `conjugated_order` para Supabase
   - ✅ Pull de `conjugated_group` e `conjugated_order` do Supabase
   - ✅ Funciona para criação e edição

7. ✅ **Migration Supabase**
   - ✅ SQL criado: `20251119_add_conjugated_fields_to_exercises.sql`
   - ✅ Adiciona colunas `conjugated_group` (uuid, nullable)
   - ✅ Adiciona coluna `conjugated_order` (integer, nullable)
   - ✅ Constraint de positividade
   - ✅ Index para performance
   - ⚠️ **AÇÃO NECESSÁRIA**: Aplicar via Dashboard (ver `MIGRATION_CONJUGATED_EXERCISES.md`)

## 📋 Estrutura de Dados

```typescript
// Modelo
interface Exercise {
  // ... campos existentes
  conjugatedGroup?: string;   // UUID compartilhado por exercícios do mesmo grupo
  conjugatedOrder?: number;   // 1, 2, 3... (ordem de execução)
}

// Helper
function getConjugatedType(count: number): string | null {
  // 2 → 'BISET'
  // 3 → 'TRISET'
  // 4 → 'QUADRISET'
  // 5+ → '5 EXERCÍCIOS'
}

// Estrutura agrupada (UI)
type ExerciseGroup = {
  isConjugated: boolean;
  conjugatedType?: string;  // 'BISET', 'TRISET', etc.
  exercises: Exercise[];     // Ordenados por conjugatedOrder
};
```

## 🎨 Design Visual Recomendado

### Visual de Grupo Conjugado (Opção B - Escolhida):

```
╔═══════════════════════════════════╗
║ 🔗 BISET                          ║
╠═══════════════════════════════════╣
║ 1️⃣ Supino Reto       [✓] [✏️] [v]║
║    Peito                          ║
║ ─────────────────────────────────║
║ 2️⃣ Crucifixo         [✓] [✏️] [v]║
║    Peito                          ║
╚═══════════════════════════════════╝

╔═══════════════════════════════════╗
║ 🔗 TRISET                         ║
╠═══════════════════════════════════╣
║ 1️⃣ Rosca Direta      [✓] [✏️] [v]║
║    Bíceps                         ║
║ ─────────────────────────────────║
║ 2️⃣ Rosca Martelo     [✓] [✏️] [v]║
║    Bíceps                         ║
║ ─────────────────────────────────║
║ 3️⃣ Rosca Concentrada [✓] [✏️] [v]║
║    Bíceps                         ║
╚═══════════════════════════════════╝
```

**Características:**
- 🟦 Background diferenciado (mais escuro)
- 🔗 Ícone de link no badge
- 🏷️ Badge com tipo (BISET/TRISET)
- 🔢 Números nos exercícios (1️⃣, 2️⃣, 3️⃣)
- ➖ Separadores entre exercícios
- 📦 Borda dupla para destacar

## 🔧 Como Criar Conjugado (Funcionalidade Futura)

### Opção 1: Durante Criação
```
Criar Exercício
├─ Nome: Supino Reto
├─ Grupo Muscular: Peito
└─ Conjugado:
    ☐ Não conjugar
    ☑ Criar novo grupo
    ☐ Adicionar a grupo existente
    
    [Próximo: Crucifixo] →
```

### Opção 2: Após Criação (Multi-seleção)
```
[Lista de Exercícios]
☑ Supino Reto
☑ Crucifixo

[Agrupar como Biset]
```

## 🧪 Casos de Uso

1. **Biset de Peito:**
   - Supino Reto + Crucifixo
   - Sem descanso entre exercícios
   - Descanso após completar ambos

2. **Triset de Bíceps:**
   - Rosca Direta + Rosca Martelo + Rosca Concentrada
   - Executados em sequência
   - Descanso após o terceiro

3. **Quadriset de Core:**
   - 4 exercícios abdominais
   - Circuito sem pausa

## 📁 Arquivos Modificados

### Concluídos:
- ✅ `src/models/Exercise.ts` - Adicionados campos `conjugatedGroup` e `conjugatedOrder`
- ✅ `src/schemas/exercise.schema.ts` - Validação dos novos campos
- ✅ `src/screens/SessionDetailScreen.tsx` - Lógica de agrupamento + visual completo
- ✅ `src/screens/ExerciseFormScreen.tsx` - UI completa para criar/gerenciar conjugados
- ✅ `src/services/sync/SyncService.ts` - Push/Pull dos novos campos
- ✅ `supabase/migrations/20251119_add_conjugated_fields_to_exercises.sql` - Migration SQL

## 🚀 Uso da Feature

### Como Criar um Biset/Triset:

1. **Acesse uma Sessão de Treino**
2. **Clique em "+" para adicionar exercício**
3. **Preencha o nome e dados do exercício**
4. **Na seção "Exercício Conjugado":**
   - Selecione "Criar novo grupo" para iniciar um Biset/Triset
   - OU selecione "Adicionar a grupo existente" para continuar um grupo
5. **Salve o exercício**
6. **Repita** para adicionar mais exercícios ao grupo

### Visualização:
- Exercícios conjugados aparecem **agrupados** com:
  - 🟦 **Borda dupla azul**
  - 🔗 **Badge BISET/TRISET** no topo
  - 🔢 **Números de ordem** (1, 2, 3...)
  - ➖ **Separadores** entre exercícios

## ⚠️ AÇÃO NECESSÁRIA

**Antes de usar a feature, você DEVE aplicar a migration no Supabase!**

👉 Siga as instruções em: `MIGRATION_CONJUGATED_EXERCISES.md`

## 🚀 Próximas Melhorias Futuras (Opcional)

1. **Desfazer agrupamento:**
   - Botão para remover exercício de um grupo
   - Botão para desfazer todo o grupo

2. **Reordenar dentro do grupo:**
   - Arrastar e soltar para mudar ordem

3. **Multi-seleção:**
   - Selecionar múltiplos exercícios existentes
   - Agrupar todos de uma vez

## 💡 Considerações Futuras

- **Descanso:** Como tratar descanso entre exercícios conjugados?
- **Séries:** Contar como 1 série ou séries separadas?
- **Progresso:** Como calcular evolução de carga?
- **Gráficos:** Como exibir conjugados nos gráficos de progressão?

## 🔄 Compatibilidade

- ✅ **Exercícios existentes:** Continuam funcionando normalmente
- ✅ **Sem grupo:** `conjugatedGroup` é opcional (undefined)
- ✅ **Migração:** Não requer migração de dados existentes

