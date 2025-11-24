# Migration: Campos para Exercícios Conjugados

## 📋 Objetivo
Adicionar colunas `conjugated_group` e `conjugated_order` na tabela `exercises` para suportar exercícios conjugados (Biset, Triset, etc.).

## 🚀 Como Aplicar

### Via Supabase Dashboard (Recomendado)

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - Clique em "SQL Editor" no menu lateral
   - Clique em "New Query"

3. **Cole o SQL abaixo e execute:**

```sql
-- Migration: Add conjugated fields to exercises table
-- This allows exercises to be grouped as Biset, Triset, etc.

-- Add conjugated_group column (UUID to group exercises together)
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS conjugated_group UUID;

-- Add conjugated_order column (order of exercise within the conjugated group: 1, 2, 3...)
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS conjugated_order INTEGER;

-- Add comments explaining the columns
COMMENT ON COLUMN exercises.conjugated_group IS 
'UUID that groups exercises together for conjugated sets (Biset, Triset, etc.). All exercises with the same conjugated_group are executed in sequence.';

COMMENT ON COLUMN exercises.conjugated_order IS 
'Order of execution within a conjugated group (1, 2, 3...). Only relevant when conjugated_group is set.';

-- Add check constraint to ensure conjugated_order is positive when set
ALTER TABLE exercises
ADD CONSTRAINT exercises_conjugated_order_positive 
CHECK (conjugated_order IS NULL OR conjugated_order > 0);

-- Optional: Add index for faster querying of conjugated groups
CREATE INDEX IF NOT EXISTS idx_exercises_conjugated_group 
ON exercises(conjugated_group) 
WHERE conjugated_group IS NOT NULL;
```

4. **Clique em "Run"** (ou pressione Ctrl+Enter)

5. **Verifique o sucesso**
   - Você deve ver mensagens de sucesso
   - Se houver erro, me avise

## ✅ Verificação

Para verificar se as colunas foram criadas corretamente:

```sql
-- Ver estrutura da tabela exercises
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'exercises'
  AND column_name IN ('conjugated_group', 'conjugated_order')
ORDER BY ordinal_position;
```

## 🧪 Teste

Após aplicar, você pode testar criando exercícios conjugados:

```sql
-- Exemplo: Criar um Biset (2 exercícios conjugados)
-- Gerar UUID para o grupo
WITH new_group AS (
  SELECT gen_random_uuid() AS group_id
)
-- Inserir exercício 1
INSERT INTO exercises (
  id, user_id, session_id, name, muscle_group,
  order_index, conjugated_group, conjugated_order,
  created_at, updated_at
)
SELECT 
  gen_random_uuid(), 
  'seu-user-id', 
  'algum-session-id', 
  'Supino Reto',
  'peito',
  1,
  group_id,
  1,
  now(),
  now()
FROM new_group
RETURNING *;

-- Inserir exercício 2 (mesmo conjugated_group, order = 2)
-- ... (repita com conjugated_order = 2)
```

## 📝 O que as Colunas Fazem

### `conjugated_group` (UUID, nullable)
- **Propósito**: Agrupa exercícios que devem ser executados em sequência
- **Valor**: UUID compartilhado entre exercícios do mesmo grupo
- **NULL**: Exercício normal (não conjugado)
- **Exemplo**: 
  - Exercício A: `conjugated_group = '123e4567-e89b-12d3-a456-426614174000'`
  - Exercício B: `conjugated_group = '123e4567-e89b-12d3-a456-426614174000'`
  - → Esses 2 exercícios formam um BISET

### `conjugated_order` (INTEGER, nullable)
- **Propósito**: Define a ordem de execução dentro do grupo conjugado
- **Valor**: 1, 2, 3... (ordem de execução)
- **NULL**: Não relevante (exercício normal)
- **Exemplo**:
  - Supino Reto: `conjugated_order = 1` (executa primeiro)
  - Crucifixo: `conjugated_order = 2` (executa depois)

## 📊 Tipos de Conjugados

- **2 exercícios** → BISET
- **3 exercícios** → TRISET
- **4 exercícios** → QUADRISET
- **5+ exercícios** → "N EXERCÍCIOS"

## 🔄 Compatibilidade

- ✅ **Exercícios existentes**: Continuam funcionando (campos NULL)
- ✅ **Sem grupo**: `conjugated_group = NULL` e `conjugated_order = NULL`
- ✅ **Migração**: Não requer atualização de dados existentes
- ✅ **Rollback**: Pode remover colunas sem perda de dados dos exercícios

## 🛡️ Constraints e Validações

1. **Constraint de positividade**: `conjugated_order` deve ser > 0 ou NULL
2. **Index**: Criado em `conjugated_group` para consultas rápidas
3. **Comentários**: Documentação inline no banco de dados

## 🔙 Rollback (se necessário)

Se precisar reverter a migration:

```sql
-- Remover index
DROP INDEX IF EXISTS idx_exercises_conjugated_group;

-- Remover constraint
ALTER TABLE exercises
DROP CONSTRAINT IF EXISTS exercises_conjugated_order_positive;

-- Remover colunas
ALTER TABLE exercises
DROP COLUMN IF EXISTS conjugated_group,
DROP COLUMN IF EXISTS conjugated_order;
```

## 📌 Notas Importantes

- Aplique esta migration **antes** de usar a funcionalidade de conjugados no app
- Sem esta migration, a sincronização de exercícios conjugados falhará
- A migration é **idempotente** (pode executar múltiplas vezes sem problemas)

