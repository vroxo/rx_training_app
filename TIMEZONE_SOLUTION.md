# 🌍 Solução de Timezone - RX Training App

## 📋 Problema Original

As datas estavam sendo salvas em UTC no banco de dados, mas não estavam sendo tratadas corretamente ao criar e exibir, causando confusão:

- **Exemplo**: Usuário no Brasil (UTC-3) agenda treino para "18/11/2025 14:00"
- **Salvava**: "18/11/2025 17:00 UTC" (converteu +3 horas)
- **Exibia**: "18/11/2025 17:00" (mostrava horário UTC ao invés do local)

Resultado: O usuário via um horário diferente do que havia escolhido! 😱

---

## ✅ Solução Implementada

### 🎯 Estratégia

1. **Banco de dados**: SEMPRE em UTC (TIMESTAMPTZ no PostgreSQL)
2. **Cliente**: Date objects em timezone local
3. **Salvando**: Converter local → UTC via `toISOString()`
4. **Lendo**: Date() converte automaticamente UTC → local
5. **Exibindo**: date-fns format() usa timezone local automaticamente

### 📦 Componentes Criados

#### 1. **Utilitários de Timezone** (`src/utils/timezone.ts`)

```typescript
// Converter Date local para UTC string
toUTCString(date: Date): string

// Converter UTC string para Date local
fromUTCString(dateString: string): Date

// Obter informações do timezone
getTimezoneName(): string
getTimezoneOffset(): number
getTimezoneInfo(): object

// Debug
debugDate(date: Date, label: string): void
```

#### 2. **DateTimePicker Completo** (`src/components/DateTimePicker.tsx`)

- Permite escolher **data E hora**
- Preserva timezone local corretamente
- Funciona em **mobile** (Android/iOS) e **web**
- Inputs separados para data e hora
- Formatação automática DD/MM/AAAA e HH:MM

**Correção crítica no input HTML5 de data:**

```typescript
// ❌ ANTES (Bug):
const newDate = new Date(e.target.value); // Interpretava como UTC

// ✅ DEPOIS (Correto):
const [year, month, day] = e.target.value.split('-').map(Number);
const newDate = new Date(year, month - 1, day); // Cria no timezone local
```

### 🔄 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USUÁRIO ESCOLHE DATA/HORA                                │
│    Input: "18/11/2025 14:00" no timezone UTC-3              │
│    Date object criado: Date(2025-11-18T14:00:00-03:00)     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. SALVAR NO ASYNCSTORAGE (LOCAL)                           │
│    date.toISOString() → "2025-11-18T17:00:00.000Z"         │
│    Salvou em UTC ✓                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. SYNC COM SUPABASE                                        │
│    Envia: "2025-11-18T17:00:00.000Z"                       │
│    Supabase salva em TIMESTAMPTZ (UTC) ✓                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. LER DO BANCO                                             │
│    Recebe: "2025-11-18T17:00:00.000Z"                      │
│    new Date(string) converte para timezone local            │
│    Date object: Date(2025-11-18T14:00:00-03:00) ✓          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. EXIBIR PARA USUÁRIO                                      │
│    format(date, "dd/MM/yyyy 'às' HH:mm")                   │
│    Output: "18/11/2025 às 14:00" ✓                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Arquivos Modificados

### 1. `src/components/DatePicker.tsx`
- **Correção**: Input HTML5 agora cria Date no timezone local
- **Antes**: `new Date(e.target.value)` → interpretava como UTC
- **Depois**: `new Date(year, month-1, day)` → cria no timezone local

### 2. `src/components/DateTimePicker.tsx` (NOVO)
- Component completo para data + hora
- Inputs separados e formatados
- Preserva timezone local corretamente
- Compatível com web e mobile

### 3. `src/screens/SessionFormScreen.tsx`
- **Mudança**: Usa `DateTimePickerComponent` ao invés de `DatePicker`
- Permite escolher hora do treino, não apenas data

### 4. `src/utils/timezone.ts` (NOVO)
- Utilitários centralizados para conversão de timezone
- Funções de debug para investigar problemas

### 5. `src/utils/index.ts` (NOVO)
- Exporta todos os utilitários

---

## 🧪 Como Testar

### Teste 1: Criar Sessão

1. Vá para "Periodizações" → Selecione uma → "Nova Sessão"
2. Escolha data: **18/11/2025**
3. Escolha hora: **14:00**
4. Salve
5. **Verifique**: A sessão deve mostrar "18/11/2025 às 14:00"

### Teste 2: Sync e Leitura

1. Crie uma sessão com horário específico
2. Faça sync manual (Profile → Sincronizar Agora)
3. **Verifique no Supabase**: 
   - Abra o SQL Editor
   - Execute: `SELECT scheduled_at FROM sessions ORDER BY created_at DESC LIMIT 1;`
   - Deve mostrar em UTC (ex: "2025-11-18 17:00:00+00")
4. Faça logout e login novamente (força sync)
5. **Verifique no app**: Deve mostrar o horário local original (14:00)

### Teste 3: Completar Sessão

1. Abra uma sessão
2. Clique em "Marcar como Concluída"
3. **Verifique**: A data de conclusão deve mostrar o horário atual correto

### Teste 4: Web vs Mobile

1. Crie uma sessão na versão **web**
2. Sincronize
3. Abra a versão **mobile** (ou vice-versa)
4. **Verifique**: O horário deve ser o mesmo em ambas as plataformas

---

## 🐛 Debugging

Use os utilitários de debug para investigar problemas:

```typescript
import { debugDate, getTimezoneInfo } from '../utils/timezone';

// Ver informações do timezone
console.log(getTimezoneInfo());
// {
//   name: "America/Sao_Paulo",
//   offsetMinutes: 180,
//   offsetHours: 3,
//   offsetString: "UTC-3"
// }

// Debug de uma data específica
const date = new Date();
debugDate(date, 'Minha Data');
// 🕐 Minha Data:
//   Local String: Mon Nov 18 2025 14:00:00 GMT-0300 (Brasília Standard Time)
//   UTC String:   2025-11-18T17:00:00.000Z
//   Timezone:     UTC-3 (America/Sao_Paulo)
//   Timestamp:    1731945600000
```

---

## ✨ Benefícios

### ✅ Para o Usuário
- Horários sempre corretos no seu timezone
- Funciona em qualquer lugar do mundo
- Consistente entre web e mobile

### ✅ Para o Desenvolvedor
- Código centralizado e reutilizável
- Fácil de debugar problemas de timezone
- Segue best practices da indústria

### ✅ Para o Sistema
- Banco de dados sempre em UTC (facilita queries)
- Sincronização confiável entre dispositivos
- Compatível com horário de verão

---

## 📚 Referências

- [MDN: Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [PostgreSQL: Datetime Types](https://www.postgresql.org/docs/current/datatype-datetime.html)
- [date-fns Documentation](https://date-fns.org/)
- [JavaScript Date Gotchas](https://css-tricks.com/everything-you-need-to-know-about-date-in-javascript/)

---

## 📅 Data da Implementação

18 de novembro de 2025

---

## 🚀 Próximos Passos (Opcional)

1. **Migração de dados existentes**: Se houver dados com timezone incorreto, criar script de migração
2. **Timezone do servidor**: Garantir que o servidor Supabase está configurado em UTC
3. **Testes automatizados**: Criar testes unitários para funções de timezone
4. **Suporte a múltiplos timezones**: Permitir usuário escolher timezone diferente do dispositivo

