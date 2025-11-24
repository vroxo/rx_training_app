# 🐛 Bug Fix: Soft Delete não estava sincronizando com Supabase

## 📋 Problema

O campo `deleted_at` das entidades (Periodizations, Sessions, Exercises, Sets) não estava sendo sincronizado com o Supabase.

### Comportamento Observado

- ✅ Deletar localmente funcionava (marcava `deletedAt` no AsyncStorage)
- ❌ O `deleted_at` **não era enviado** ao Supabase
- ❌ O `deleted_at` **não era recebido** do Supabase
- ❌ Items deletados eram **hard deleted** do Supabase em vez de soft deleted

## 🔍 Causa Raiz

### ⚠️ **CAUSA PRINCIPAL: Items deletados eram FILTRADOS antes do sync!**

O verdadeiro problema estava nos métodos que **buscam items para sincronizar**:

```typescript
// ❌ ERRADO: Filtra items deletados!
const localPeriodizations = await storageService.getAllPeriodizations(userId);
// Este método retorna: .filter(p => !p.deletedAt)
```

**Resultado:** Items deletados **nunca entravam na lista de sync**, então o `deleted_at` nunca era enviado ao Supabase!

### 1. Push (Local → Supabase)

**Problema 1:** Items deletados não entravam na lista de sync
**Problema 2:** Quando entravam, fazíamos **hard delete**:

```typescript
if (periodization.deletedAt) {
  await supabase
    .from('periodizations')
    .delete()  // ❌ Hard delete!
    .eq('id', periodization.id);
}
```

### 2. Pull (Supabase → Local)

No pull, nunca pegávamos o campo `deleted_at` do remote:

```typescript
await storageService.createPeriodization({
  id: remote.id,
  name: remote.name,
  // ... outros campos ...
  // ❌ Faltava: deletedAt: remote.deleted_at
});
```

## ✅ Solução

### 0. Criar métodos *IncludingDeleted no StorageService

**A correção mais importante:** Criar métodos que retornam items **incluindo deletados** para o sync:

```typescript
// ✅ CORRETO: Retorna TODOS os items, incluindo deletados
public async getAllPeriodizationsIncludingDeleted(userId: string): Promise<Periodization[]> {
  const data = await this.getAll<Periodization>(KEYS.PERIODIZATIONS);
  return data
    .filter(p => p.userId === userId) // ✅ Sem filtro de deletedAt!
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
```

Criados para:
- ✅ `getAllPeriodizationsIncludingDeleted()`
- ✅ `getSessionsByPeriodizationIncludingDeleted()`
- ✅ `getExercisesBySessionIncludingDeleted()`
- ✅ `getSetsByExerciseIncludingDeleted()`

### 1. Push: Usar métodos *IncludingDeleted + Soft Delete

**Mudança no SyncService:**

```typescript
// ❌ ANTES: Filtrava deletados
const localPeriodizations = await storageService.getAllPeriodizations(userId);

// ✅ DEPOIS: Inclui deletados para sync
const localPeriodizations = await storageService.getAllPeriodizationsIncludingDeleted(userId);
```

Agora sempre usamos `upsert` para **todas** as entidades, incluindo deletadas:

```typescript
// ✅ Soft delete!
const { error } = await supabase
  .from('periodizations')
  .upsert({
    id: periodization.id,
    // ... outros campos ...
    deleted_at: periodization.deletedAt?.toISOString() || null, // ✅
    synced_at: syncedAt.toISOString(),
  });
```

**Vantagens:**
- ✅ Mantém histórico no banco
- ✅ Permite auditoria
- ✅ Possibilita recuperação futura
- ✅ Sincronização bidirecional funciona

### 2. Pull: Puxar deleted_at do Remote

Agora incluímos `deleted_at` ao criar/atualizar do remote:

```typescript
await storageService.createPeriodization({
  id: remote.id,
  name: remote.name,
  // ... outros campos ...
  deletedAt: remote.deleted_at ? new Date(remote.deleted_at) : undefined, // ✅
});
```

## 📦 Entidades Corrigidas

1. ✅ **Periodizations** (Push + Pull)
2. ✅ **Sessions** (Push + Pull)
3. ✅ **Exercises** (Push + Pull)
4. ✅ **Sets** (Push + Pull)

## 🧪 Como Testar

### Teste 1: Soft Delete Local → Supabase

1. Criar uma periodização no app
2. Deletar a periodização
3. Executar sync manual
4. Verificar no Supabase:
   - ✅ Registro existe
   - ✅ Campo `deleted_at` tem timestamp
   - ✅ Campo `synced_at` atualizado

### Teste 2: Soft Delete Supabase → Local

1. No Supabase, marcar `deleted_at` de uma periodização
2. Executar sync no app
3. Verificar no app:
   - ✅ Item não aparece na lista
   - ✅ No AsyncStorage, `deletedAt` está preenchido

### Teste 3: Sincronização em Múltiplos Dispositivos

1. Dispositivo A: deletar item
2. Dispositivo A: sincronizar
3. Dispositivo B: sincronizar
4. Verificar:
   - ✅ Item desaparece em B
   - ✅ Não há conflitos

## 📝 Arquivos Modificados

### `src/services/storage/StorageService.ts`

**Novos métodos criados:**
- `getAllPeriodizationsIncludingDeleted(userId)`
- `getSessionsByPeriodizationIncludingDeleted(periodizationId)`
- `getExercisesBySessionIncludingDeleted(sessionId)`
- `getSetsByExerciseIncludingDeleted(exerciseId)`

**Propósito:** Permitir que o sync acesse items deletados para sincronizá-los.

### `src/services/sync/SyncService.ts`

**Push methods:**
- Usa métodos `*IncludingDeleted` para buscar items
- Sempre usa `upsert` com `deleted_at`

**Pull methods:**
- Pega `deleted_at` do remote
- Cria/atualiza items locais com `deletedAt`

## 🎯 Resultado

Agora o soft delete funciona **perfeitamente** em todas as direções:

```
Local (deletedAt) ←→ Supabase (deleted_at)
     ✅ Push          ✅ Pull
```

---

**Data da Correção:** 15/11/2025  
**Fase:** 11 - Optimization and Performance  
**Prioridade:** 🔴 Alta (Bug Crítico)

