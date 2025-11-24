# Migration: Constraint de Grupo Muscular

## 📋 Objetivo
Adicionar uma constraint CHECK na coluna `muscle_group` da tabela `exercises` para limitar os valores aceitos apenas aos grupos musculares pré-definidos nas constantes.

## 🚀 Como Aplicar

### Opção 1: Via Supabase Dashboard (Recomendado)

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - Clique em "SQL Editor" no menu lateral
   - Clique em "New Query"

3. **Cole o SQL abaixo e execute:**

```sql
-- Remover constraint existente (se houver)
ALTER TABLE exercises
DROP CONSTRAINT IF EXISTS exercises_muscle_group_check;

-- Adicionar constraint que valida os valores
ALTER TABLE exercises
ADD CONSTRAINT exercises_muscle_group_check 
CHECK (
  muscle_group IS NULL OR
  muscle_group IN (
    'peito',
    'costas',
    'ombros',
    'biceps',
    'triceps',
    'antebraco',
    'abdomen',
    'quadriceps',
    'posterior',
    'gluteos',
    'panturrilha',
    'trapezio',
    'lombar'
  )
);

-- Adicionar comentário explicativo
COMMENT ON CONSTRAINT exercises_muscle_group_check ON exercises IS 
'Valida que muscle_group contém apenas valores pré-definidos de MUSCLE_GROUPS';

-- Limpar dados inválidos existentes (se houver)
UPDATE exercises
SET muscle_group = NULL
WHERE muscle_group IS NOT NULL
  AND muscle_group NOT IN (
    'peito',
    'costas',
    'ombros',
    'biceps',
    'triceps',
    'antebraco',
    'abdomen',
    'quadriceps',
    'posterior',
    'gluteos',
    'panturrilha',
    'trapezio',
    'lombar'
  );
```

4. **Clique em "Run"** (ou pressione Ctrl+Enter)

5. **Verifique o sucesso**
   - Você deve ver mensagens de sucesso
   - Se houver erro, me avise

### Opção 2: Via Supabase CLI

Se você tiver o Supabase CLI instalado e configurado:

```bash
# No diretório do projeto
cd /home/vitorhugo/personal-projects/rx_training_app

# Aplicar a migration
supabase db push
```

## ✅ Verificação

Para verificar se a constraint foi aplicada corretamente:

```sql
-- Verificar constraints da tabela exercises
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE conrelid = 'exercises'::regclass
  AND conname LIKE '%muscle%';
```

## 🧪 Teste

Após aplicar, você pode testar se a constraint funciona:

```sql
-- Este comando deve FALHAR (valor inválido)
INSERT INTO exercises (id, user_id, session_id, name, muscle_group, created_at, updated_at)
VALUES (gen_random_uuid(), 'seu-user-id', 'algum-session-id', 'Teste', 'invalido', now(), now());
-- Erro esperado: new row for relation "exercises" violates check constraint

-- Este comando deve FUNCIONAR (valor válido)
INSERT INTO exercises (id, user_id, session_id, name, muscle_group, created_at, updated_at)
VALUES (gen_random_uuid(), 'seu-user-id', 'algum-session-id', 'Teste', 'peito', now(), now());
-- Sucesso esperado
```

## 📝 O que a Constraint Faz

1. **Permite NULL**: Exercícios podem não ter grupo muscular definido
2. **Valida Valores**: Apenas os 13 grupos musculares são aceitos:
   - peito, costas, ombros, biceps, triceps
   - antebraco, abdomen, quadriceps, posterior
   - gluteos, panturrilha, trapezio, lombar
3. **Rejeita Inválidos**: Qualquer outro valor será rejeitado com erro
4. **Limpa Existentes**: Valores inválidos já existentes serão limpos (set NULL)

## 🔄 Sincronização

Após aplicar:
- ✅ Novas inserções só aceitam valores válidos
- ✅ App continua funcionando normalmente
- ✅ Dados antigos inválidos são limpos automaticamente
- ✅ Sincronização do app funciona normalmente

## 🛡️ Benefícios

- **Integridade de Dados**: Garante consistência no banco
- **Validação no Servidor**: Proteção adicional além do app
- **Segurança**: Impede inserções maliciosas via API
- **Documentação**: Constraint serve como documentação do schema

