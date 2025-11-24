# Migration: Drop Set Reps

## Status: ✅ Completo

## Descrição
Adição de repetições (reps) para cada drop em um drop set, permitindo configurar diferentes números de repetições para cada peso.

## Progresso Atual

### ✅ Completado:
1. **Migration Supabase** - `20251120_add_drop_set_reps_to_sets.sql`
2. **Modelo** - Adicionado `dropSetReps?: number[]` em `Set`
3. **Schema** - Validação Zod para `dropSetReps`
4. **UI Form** - `TechniqueFields` atualizado com inputs de peso E reps lado a lado
5. **SessionDetailScreen** - Estado, handlers e display atualizados
6. **DatabaseService** - SQLite schema, createSet, updateSet e mapSet atualizados
7. **SyncService** - pushSets e pullSets atualizados para sincronizar com Supabase
8. **Migration SQLite** - Adiciona coluna automaticamente em bancos existentes

### 🔄 Pendente:
1. **Aplicar Migration no Supabase** - Executar SQL manualmente no dashboard
2. **Testar** - End-to-end (criar, editar, exibir, sincronizar)

## Próximos Passos

### 1. Aplicar Migration no Supabase
```sql
-- Executar manualmente no Supabase Dashboard
ALTER TABLE sets
ADD COLUMN drop_set_reps JSONB;
```

### 2. Atualizar UI Display
Modificar `SessionDetailScreen.tsx` onde os pesos dos drops são exibidos para incluir as reps também.

### 3. Atualizar DatabaseService
- Adicionar `drop_set_reps` ao schema SQLite
- Atualizar `createSet`, `updateSet`, `mapSet` para incluir o campo
- Adicionar migration para adicionar a coluna

### 4. Atualizar SyncService
- `pushSets`: Incluir `drop_set_reps` no upsert do Supabase
- `pullSets`: Mapear `drop_set_reps` do Supabase para o modelo local

## Estrutura de Dados

```typescript
// Exemplo de dropSetWeights e dropSetReps
dropSetWeights: [65, 60, 55] // kg
dropSetReps: [12, 10, 8]      // reps

// Display:
// 70 kg × 10 reps     <- Peso e reps principais
//   → 65 kg × 12 reps <- Drop 1
//   → 60 kg × 10 reps <- Drop 2
//   → 55 kg × 8 reps  <- Drop 3
```

## Referências
- Modelo: `src/models/Set.ts`
- Schema: `src/schemas/set.schema.ts`
- Form: `src/components/TechniqueFields.tsx`
- Display: `src/screens/SessionDetailScreen.tsx`

