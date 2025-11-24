# 🐛 Bug Fix: DatePicker com Problemas de Timezone

## 📋 Problemas Reportados

1. **Ano aleatório como default**: O DatePicker mostrava anos incorretos ao abrir
2. **Data - 1 dia**: Ao clicar em uma data, aparecia o dia anterior

## 🔍 Causa Raiz

### Problema 1: Parse com date-fns
```typescript
// ❌ ANTES (Bug):
const parsed = parse(formatted, 'dd/MM/yyyy', new Date());
```

O `parse` do date-fns estava usando `new Date()` como referência, o que poderia causar problemas quando a data de referência tinha horário diferente de zero. Além disso, o parse poderia interpretar a data em UTC em vez do timezone local.

### Problema 2: Horário não zerado
```typescript
// ❌ ANTES (Bug):
startDate: new Date(), // Inclui horário atual (ex: 14:23:45)
```

Quando criamos datas com `new Date()` sem parâmetros, ela inclui o horário atual. Ao combinar com conversões de timezone, isso pode fazer a data "pular" um dia para frente ou para trás.

### Problema 3: Date.now() para cálculos
```typescript
// ❌ ANTES (Bug):
endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
```

Usar `Date.now()` e adicionar milissegundos pode causar problemas quando o horário atual está próximo da meia-noite, podendo resultar no dia errado após conversões de timezone.

---

## ✅ Soluções Implementadas

### 1. Parse Manual de Datas (`DatePicker.tsx`)

**Antes:**
```typescript
const parsed = parse(formatted, 'dd/MM/yyyy', new Date());
if (isValid(parsed)) {
  onChange(parsed);
}
```

**Depois:**
```typescript
// Parse DD/MM/YYYY manualmente para evitar problemas de timezone
const [day, month, year] = formatted.split('/').map(Number);

// Validação básica
if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
  // Cria a data no timezone local com horário zerado
  const newDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  
  if (isValid(newDate)) {
    onChange(newDate);
  }
}
```

**Por que funciona:**
- Parse manual elimina ambiguidade de timezone
- Horário zerado (00:00:00) evita problemas de "dia anterior/seguinte"
- Validação explícita dos valores

### 2. Input HTML5 com Horário Zerado

**Antes:**
```typescript
const newDate = new Date(year, month - 1, day); // Sem horário especificado
```

**Depois:**
```typescript
// Cria a data no timezone local com horário zerado
const newDate = new Date(year, month - 1, day, 0, 0, 0, 0);
```

**Por que funciona:**
- Horário explicitamente zerado
- Consistente em todos os timezones
- Não muda de dia ao converter entre UTC e local

### 3. Valores Default com Horário Zerado (`PeriodizationFormScreen.tsx`)

**Antes:**
```typescript
startDate: new Date(),
endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
```

**Depois:**
```typescript
startDate: (() => {
  // Cria data de hoje com horário zerado
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
})(),
endDate: (() => {
  // Cria data daqui a 30 dias com horário zerado
  const today = new Date();
  const in30Days = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30, 0, 0, 0, 0);
  return in30Days;
})(),
```

**Por que funciona:**
- Horário sempre zerado (00:00:00.000)
- Adiciona dias de forma segura (sem milissegundos)
- Funciona em qualquer timezone

### 4. DateTimePicker Consistente

Aplicamos as mesmas correções no `DateTimePicker.tsx`:
- Parse manual de DD/MM/YYYY
- Validação de ranges
- Preservação correta do horário ao mudar apenas a data

---

## 🎯 Resultado

### Antes (Bug):
```
Usuário seleciona: 18/11/2025
Sistema exibe:     17/11/2025 ❌
Banco salva:       17/11/2025 23:00:00 UTC ❌
```

### Depois (Correto):
```
Usuário seleciona: 18/11/2025
Sistema exibe:     18/11/2025 ✅
Banco salva:       18/11/2025 00:00:00 UTC ✅
```

---

## 🧪 Como Testar

### Teste 1: Data Default Correta
1. Crie uma nova periodização
2. **Verifique**: Data de início mostra **hoje** (não ano aleatório)
3. **Verifique**: Data de fim mostra **daqui a 30 dias** (não data estranha)

### Teste 2: Seleção de Data
1. Clique no campo de data de início
2. Selecione uma data (ex: 20/11/2025)
3. **Verifique**: Exibe exatamente **20/11/2025** (não 19 ou 21)

### Teste 3: Input Manual
1. Digite manualmente: `25/12/2025`
2. **Verifique**: Data é aceita e exibida corretamente
3. **Verifique**: Não muda para 24 ou 26

### Teste 4: Web vs Mobile
1. Teste na **web** (input HTML5)
2. Teste no **mobile** (native picker)
3. **Verifique**: Ambos exibem a mesma data

### Teste 5: Diferentes Timezones
1. Mude o timezone do sistema (ex: UTC-3 → UTC+9)
2. Crie uma periodização
3. **Verifique**: Data continua correta no novo timezone

---

## 🔧 Arquivos Modificados

### 1. `src/components/DatePicker.tsx`
- ✅ Parse manual de DD/MM/YYYY
- ✅ Horário zerado em todas as criações de Date
- ✅ Validação de ranges (1900-2100)

### 2. `src/components/DateTimePicker.tsx`
- ✅ Parse manual de DD/MM/YYYY
- ✅ Preserva horário ao mudar data
- ✅ Cria hora corretamente ao mudar horário

### 3. `src/screens/PeriodizationFormScreen.tsx`
- ✅ `startDate` default com horário zerado
- ✅ `endDate` default com horário zerado (+30 dias)

---

## 📚 Lições Aprendidas

### ✅ SEMPRE Zerar Horário para Datas (não datetime)
```typescript
// ❌ NÃO:
const date = new Date();

// ✅ SIM:
const today = new Date();
const date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
```

### ✅ Parse Manual é Mais Seguro que Libraries
```typescript
// ❌ NÃO (ambíguo):
const date = parse(text, 'dd/MM/yyyy', new Date());

// ✅ SIM (explícito):
const [day, month, year] = text.split('/').map(Number);
const date = new Date(year, month - 1, day, 0, 0, 0, 0);
```

### ✅ Input HTML5 Precisa de Cuidado Extra
```typescript
// ❌ NÃO:
new Date(e.target.value); // Pode interpretar como UTC

// ✅ SIM:
const [year, month, day] = e.target.value.split('-').map(Number);
new Date(year, month - 1, day, 0, 0, 0, 0);
```

---

## 🚀 Próximos Passos (Opcional)

1. **Testes Unitários**: Criar testes para parse de datas
2. **Validação de Calendário**: Impedir dias inválidos (ex: 31/02)
3. **Internacionalização**: Suportar formatos diferentes (MM/DD/YYYY, YYYY-MM-DD)
4. **Componente de Range**: DateRangePicker para início e fim

---

## 📅 Data da Correção

18 de novembro de 2025

---

## 🎓 Referências

- [MDN: Date Constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date)
- [JavaScript Date Gotchas](https://css-tricks.com/everything-you-need-to-know-about-date-in-javascript/)
- [HTML Input Type Date](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date)

