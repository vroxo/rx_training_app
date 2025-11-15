# 📋 Instruções de Setup do Supabase

## Passo 1: Executar o Schema SQL

1. Acesse seu projeto no Supabase: https://supabase.com/dashboard

2. No menu lateral, clique em **SQL Editor**

3. Clique em **New Query**

4. Copie todo o conteúdo do arquivo `supabase-schema.sql` e cole no editor SQL

5. Clique em **Run** (ou pressione Ctrl+Enter)

6. Verifique se todas as tabelas foram criadas:
   - periodizations
   - sessions
   - exercises
   - sets
   - sync_queue

## Passo 2: Verificar Row Level Security (RLS)

1. No menu lateral, clique em **Authentication** > **Policies**

2. Verifique se as políticas RLS foram criadas para todas as tabelas

3. Cada tabela deve ter 4 políticas:
   - SELECT (view own)
   - INSERT (insert own)
   - UPDATE (update own)
   - DELETE (delete own)

## Passo 3: Criar um usuário de teste (opcional)

1. No menu lateral, clique em **Authentication** > **Users**

2. Clique em **Add user**

3. Preencha:
   - Email: seu-email@exemplo.com
   - Password: senha-segura

4. Clique em **Create user**

## Passo 4: Testar no App

Agora você pode usar o app normalmente! As credenciais do Supabase já estão configuradas no arquivo `.env`.

## ✅ Checklist

- [ ] Schema SQL executado
- [ ] Tabelas criadas (5 tabelas)
- [ ] Políticas RLS ativas
- [ ] Índices criados
- [ ] Triggers criados
- [ ] Usuário de teste criado (opcional)

## 🔍 Verificação

Execute esta query no SQL Editor para verificar se tudo está ok:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('periodizations', 'sessions', 'exercises', 'sets', 'sync_queue');
```

Deve retornar 5 linhas.
