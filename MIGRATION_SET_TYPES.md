# Migration: Tipos de Set

## 📋 Objetivo
Adicionar coluna `set_type` na tabela `sets` para classificar séries como:
- **Aquecimento** (`warmup`)
- **Feeder Set** (`feeder`)
- **Work Set** (`workset`)
- **Backoff** (`backoff`)

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
-- Migration: Add set_type column to sets table
-- This allows classification of sets as warmup, feeder, workset, or backoff

-- Add set_type column
ALTER TABLE sets
ADD COLUMN IF NOT EXISTS set_type VARCHAR(20);

-- Add check constraint to ensure valid set types
ALTER TABLE sets
ADD CONSTRAINT sets_set_type_check 
CHECK (set_type IS NULL OR set_type IN ('warmup', 'feeder', 'workset', 'backoff'));

-- Add comment explaining the column
COMMENT ON COLUMN sets.set_type IS 
'Type of set: warmup (warm-up set), feeder (feeder set), workset (work set), backoff (backoff set). NULL means unspecified type.';

-- Create index for faster filtering by set type (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_sets_set_type 
ON sets(set_type) 
WHERE set_type IS NOT NULL;
```

4. **Clique em "Run"** (ou pressione Ctrl+Enter)

5. **Verifique o sucesso**
   - Você deve ver mensagens de sucesso
   - Se houver erro, me avise

## ✅ Verificação

Para verificar se a coluna foi criada corretamente:

```sql
-- Ver estrutura da coluna set_type
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sets'
  AND column_name = 'set_type';
```

## 📊 Tipos de Set

### 1. Aquecimento (`warmup`)
- **Cor**: Azul (`#3B82F6`)
- **Propósito**: Séries de aquecimento antes das work sets
- **Características**: Peso mais leve, preparação neuromuscular

### 2. Feeder Set (`feeder`)
- **Cor**: Verde (`#10B981`)
- **Propósito**: Séries intermediárias entre aquecimento e work sets
- **Características**: Aumento gradual de carga

### 3. Work Set (`workset`)
- **Cor**: Vermelho (`#EF4444`)
- **Propósito**: Séries principais de trabalho
- **Características**: Intensidade máxima, foco do treino

### 4. Backoff (`backoff`)
- **Cor**: Laranja (`#F59E0B`)
- **Propósito**: Séries após work sets com carga reduzida
- **Características**: Volume adicional com menor intensidade

## 🎨 Interface

### Como Definir Tipo de Set:
1. Ao criar ou editar uma série, selecione o tipo no dropdown "Tipo"
2. Opções: "Nenhum" (padrão), "Aquecimento", "Feeder Set", "Work Set", "Backoff"
3. Salve a série

### Visualização:
- Tipo aparece como badge colorido ao lado do número da série
- Cores diferentes para cada tipo facilitam identificação visual

### Exemplo Visual:
```
#1 [Aquecimento]  🏋️ 40 kg  🔁 10 reps
#2 [Feeder Set]   🏋️ 60 kg  🔁 8 reps
#3 [Work Set]     🏋️ 80 kg  🔁 6 reps
#4 [Work Set]     🏋️ 80 kg  🔁 6 reps
#5 [Backoff]      🏋️ 65 kg  🔁 8 reps
```

## 🔄 Compatibilidade

- ✅ **Séries existentes**: Continuam funcionando (set_type NULL)
- ✅ **Opcional**: Não é obrigatório definir tipo de set
- ✅ **Sincronização**: Tipo é sincronizado entre dispositivos
- ✅ **Migração**: Não requer atualização de dados existentes

## 📝 Benefícios

1. **Organização**: Classificação clara das séries
2. **Planejamento**: Estrutura de treino mais profissional
3. **Análise**: Facilita revisão e ajustes do programa
4. **Visual**: Identificação rápida por cores
5. **Flexível**: Uso opcional, não obrigatório

## 🔙 Rollback (se necessário)

Se precisar reverter a migration:

```sql
-- Remover index
DROP INDEX IF EXISTS idx_sets_set_type;

-- Remover constraint
ALTER TABLE sets
DROP CONSTRAINT IF EXISTS sets_set_type_check;

-- Remover coluna
ALTER TABLE sets
DROP COLUMN IF EXISTS set_type;
```

## 📌 Notas

- A migration é **idempotente** (pode executar múltiplas vezes sem problemas)
- A coluna é **opcional** (NULL é permitido)
- O constraint garante apenas valores válidos
- O index melhora performance ao filtrar por tipo

