# 🐛 BUGFIX: Items Deletados Voltando Após Sync

## 📋 **Problema Relatado**

Ao deletar periodizações (e outros items), eles desapareciam temporariamente mas voltavam para a lista após a sincronização automática.

## 🔍 **Causa Raiz**

O problema estava na lógica de **pull (sincronização do Supabase para local)**:

### ❌ **Fluxo Errado (antes):**

1. Usuário deleta uma periodização localmente
2. `deletedAt` é marcado localmente
3. `getPeriodizationById` filtra items com `deletedAt`, então retorna `null`
4. Sync automático roda:
   - **Pull**: Verifica se a periodização existe localmente usando `getPeriodizationById`
   - Como retorna `null`, o sync pensa que não existe
   - **Cria ela de novo** (sem `deletedAt`)! ❌
   - **Push**: Deleta no Supabase (hard delete) ✅
5. Resultado: Item deletado no Supabase, mas recriado localmente

### 📊 **Diagrama do Bug:**

```
Local Storage               Supabase
─────────────               ────────

[Periodization A]          [Periodization A]
deletedAt: null            deleted_at: null
     ↓                          ↓
 User deleta                    │
     ↓                          │
[Periodization A]              │
deletedAt: 2025-01-15     [Periodization A]
needsSync: true           deleted_at: null
     ↓                          │
Auto-sync executa              │
     ↓                          ↓
PULL: getPeriodizationById(A)  │
      returns null (filtrado)  │
      → Cria nova! ❌           │
     ↓                          ↓
[Periodization A] (nova!)      │
deletedAt: null           [Periodization A]
     ↓                          ↓
PUSH: Deleta no Supabase       │
     ↓                          ↓
[Periodization A]          [DELETED]
deletedAt: null           
↑ ITEM VOLTOU! ❌
```

---

## ✅ **Solução Implementada**

### 1. **Novos Métodos no `StorageService`:**

Adicionados métodos que retornam items **incluindo os soft-deleted**:

```typescript
// StorageService.ts

/**
 * Get periodization by ID, including soft-deleted ones (for sync purposes)
 */
public async getPeriodizationByIdIncludingDeleted(id: string): Promise<Periodization | null> {
  const all = await this.getAll<Periodization>(KEYS.PERIODIZATIONS);
  return all.find(p => p.id === id) || null; // ✅ SEM FILTRO deletedAt
}

// Similar methods for:
// - getSessionByIdIncludingDeleted
// - getExerciseByIdIncludingDeleted
// - getSetByIdIncludingDeleted
```

### 2. **Atualização no `SyncService`:**

Pull agora usa os novos métodos e **skipa items deletados localmente**:

```typescript
// SyncService.ts - pullPeriodizations

for (const remote of data) {
  try {
    // ✅ Check including deleted to avoid recreating deleted items
    const local = await storageService.getPeriodizationByIdIncludingDeleted(remote.id);

    // Skip if locally deleted (soft delete)
    if (local?.deletedAt) {
      console.log(`⏭️ Skipping locally deleted periodization: ${remote.name}`);
      continue; // ✅ NÃO RECRIA!
    }

    // Se não existe, cria normalmente
    if (!local) {
      await storageService.createPeriodization({...});
    }
    // ...
  }
}
```

### ✅ **Fluxo Correto (agora):**

```
Local Storage               Supabase
─────────────               ────────

[Periodization A]          [Periodization A]
deletedAt: null            deleted_at: null
     ↓                          ↓
 User deleta                    │
     ↓                          │
[Periodization A]              │
deletedAt: 2025-01-15     [Periodization A]
needsSync: true           deleted_at: null
     ↓                          │
Auto-sync executa              │
     ↓                          ↓
PULL: getPeriodizationById     │
      IncludingDeleted(A)      │
      returns item ✅           │
      → Verifica deletedAt     │
      → SKIP! ✅               │
     ↓                          ↓
[Periodization A]              │
deletedAt: 2025-01-15          │
needsSync: true           [Periodization A]
     ↓                          ↓
PUSH: Deleta no Supabase       │
     ↓                          ↓
[Periodization A]          [DELETED]
deletedAt: 2025-01-15     
needsSync: false
↑ ITEM PERMANECE DELETADO ✅
```

---

## 📁 **Arquivos Modificados**

### 1. `src/services/storage/StorageService.ts`
- ✅ Adicionado `getPeriodizationByIdIncludingDeleted`
- ✅ Adicionado `getSessionByIdIncludingDeleted`
- ✅ Adicionado `getExerciseByIdIncludingDeleted`
- ✅ Adicionado `getSetByIdIncludingDeleted`

### 2. `src/services/sync/SyncService.ts`
- ✅ Atualizado `pullPeriodizations` para usar o novo método
- ✅ Atualizado `pullSessions` para usar o novo método
- ✅ Atualizado `pullExercises` para usar o novo método
- ✅ Atualizado `pullSets` para usar o novo método
- ✅ Adicionado skip de items com `deletedAt` em todos os pulls

---

## 🧪 **Como Testar**

1. Criar uma periodização/sessão/exercício/série
2. Sincronizar (manual ou automático)
3. Deletar o item
4. Aguardar sync automático ou forçar sync manual
5. ✅ Verificar que o item **NÃO volta** para a lista

---

## 📊 **Impacto**

- ✅ **Periodizações deletadas** não voltam mais
- ✅ **Sessões deletadas** não voltam mais
- ✅ **Exercícios deletados** não voltam mais
- ✅ **Séries deletadas** não voltam mais
- ✅ Sincronização bidirecional funcionando corretamente
- ✅ Soft delete preservado mesmo após syncs múltiplos

---

## 🎯 **Conclusão**

O bug foi **completamente resolvido**! Agora, quando um item é deletado localmente:
1. Ele permanece marcado como `deletedAt`
2. O sync push deleta no Supabase (hard delete)
3. O sync pull **não recria** items deletados localmente
4. O item permanece invisível na lista (filtrado por `!deletedAt`)

---

**Data do Fix:** 2025-01-15  
**Versão:** 1.1.1  
**Status:** ✅ **RESOLVIDO**

