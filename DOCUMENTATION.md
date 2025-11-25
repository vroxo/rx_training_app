# 📖 Documentação do RX Training App

> Documentação completa da aplicação de periodização de treino

## 📑 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Funcionalidades](#funcionalidades)
4. [Modelos de Dados](#modelos-de-dados)
5. [Sincronização](#sincronização)
6. [Design System](#design-system)
7. [Navegação](#navegação)
8. [Serviços](#serviços)
9. [Hooks Personalizados](#hooks-personalizados)
10. [Configuração do Supabase](#configuração-do-supabase)

---

## Visão Geral

O **RX Training App** é um aplicativo mobile-first desenvolvido com React Native e Expo para gerenciamento de periodização de treino, registro de sessões, exercícios e séries, com acompanhamento de evolução através de gráficos e estatísticas.

### Principais Características

- 📱 **Multiplataforma**: iOS, Android e Web
- 🔄 **Offline-First**: Funciona completamente offline com sincronização automática
- 📊 **Analytics**: Gráficos e estatísticas de evolução
- 🎨 **Design Moderno**: Interface elegante com dark theme
- 🔐 **Seguro**: Autenticação robusta e isolamento de dados por usuário

---

## Arquitetura

### Stack Tecnológico

- **Frontend**: React Native 0.81 + Expo 54
- **Linguagem**: TypeScript (strict mode)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Armazenamento Local**: AsyncStorage (web-compatible)
- **Estado Global**: Zustand
- **Navegação**: React Navigation v7
- **Formulários**: React Hook Form + Zod
- **Gráficos**: React Native Chart Kit
- **UI/UX**: Haptic Feedback, Toast Messages, Skeleton Loaders

### Padrão de Arquitetura

O app segue uma arquitetura em camadas:

```
┌─────────────────┐
│     Views       │ ← Screens & Components (React Native)
├─────────────────┤
│    Hooks        │ ← Custom Hooks (useAuth, useSync, etc.)
├─────────────────┤
│   Services      │ ← Business Logic (Auth, Sync, Stats, etc.)
├─────────────────┤
│    Stores       │ ← State Management (Zustand)
├─────────────────┤
│    Models       │ ← Data Structures (TypeScript interfaces)
├─────────────────┤
│   Database      │ ← AsyncStorage (local) + Supabase (cloud)
└─────────────────┘
```

### Estrutura de Pastas

```
src/
├── components/        # Componentes reutilizáveis
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── DatePicker.tsx
│   ├── Skeleton.tsx
│   └── ...
├── screens/           # Telas da aplicação
│   ├── HomeScreen.tsx
│   ├── LoginScreen.tsx
│   ├── PeriodizationsScreen.tsx
│   ├── SessionListScreen.tsx
│   └── ...
├── navigation/        # Configuração de navegação
│   ├── AppNavigator.tsx
│   ├── AuthStackNavigator.tsx
│   └── MainTabNavigator.tsx
├── services/          # Serviços de negócio
│   ├── auth/
│   ├── database/
│   ├── sync/
│   ├── stats/
│   └── ...
├── hooks/             # Custom hooks
│   ├── useAuth.ts
│   ├── useSync.ts
│   └── useAutoSync.ts
├── stores/            # Estado global (Zustand)
│   ├── authStore.ts
│   └── syncStore.ts
├── models/            # Interfaces TypeScript
│   ├── Periodization.ts
│   ├── Session.ts
│   ├── Exercise.ts
│   └── Set.ts
├── constants/         # Constantes e design tokens
│   ├── colors.ts
│   ├── theme.ts
│   ├── muscleGroups.ts
│   └── techniques.ts
└── utils/             # Funções utilitárias
    ├── timezone.ts
    └── rpe.ts
```

---

## Funcionalidades

### 1. Autenticação

- ✅ Login com email e senha
- ✅ Cadastro de novos usuários
- ✅ Persistência de sessão
- ✅ Logout
- ✅ Proteção de rotas

### 2. Periodizações

- ✅ Criar periodizações de treino
- ✅ Editar informações (nome, descrição, datas)
- ✅ Visualizar lista de periodizações
- ✅ Excluir periodizações (soft delete)
- ✅ Filtrar por status

### 3. Sessões de Treino

- ✅ Criar sessões dentro de uma periodização
- ✅ Editar sessões
- ✅ Marcar como planejada/em progresso/completa
- ✅ Adicionar notas e observações
- ✅ Visualizar histórico de sessões
- ✅ Excluir sessões (soft delete)

### 4. Exercícios

- ✅ Adicionar exercícios a uma sessão
- ✅ Definir grupo muscular
- ✅ Especificar equipamento
- ✅ Ordenar exercícios
- ✅ Exercícios conjugados (biset, triset)
- ✅ Marcar exercício como completo
- ✅ Editar e excluir exercícios

### 5. Séries

- ✅ Registrar séries com repetições e peso
- ✅ Tipos de série (warmup, feeder, workset, backoff)
- ✅ Técnicas avançadas (drop set, rest-pause, cluster set)
- ✅ RIR (Reps in Reserve)
- ✅ RPE (Rate of Perceived Exertion)
- ✅ Tempo de descanso
- ✅ Notas por série
- ✅ Marcar série como completa

### 6. Dashboard e Estatísticas

- ✅ Volume total de treino
- ✅ Frequência de treinos
- ✅ Gráficos de evolução de peso
- ✅ Lista de sessões recentes
- ✅ Sequência de dias consecutivos
- ✅ Filtros por período

### 7. Sincronização

- ✅ Sincronização manual
- ✅ Sincronização automática (configurável)
- ✅ Indicador de status online/offline
- ✅ Timestamp de última sincronização
- ✅ Retry logic com exponential backoff
- ✅ Resolução de conflitos (last-write-wins)

### 8. UX/UI

- ✅ Dark theme elegante
- ✅ Haptic feedback em botões
- ✅ Toast notifications
- ✅ Loading skeletons
- ✅ Pull-to-refresh
- ✅ Error boundaries
- ✅ Empty states
- ✅ Splash screen

---

## Modelos de Dados

### Hierarquia

```
Periodization (1:N) → Session (1:N) → Exercise (1:N) → Set
```

### Periodization

```typescript
interface Periodization {
  id: string;                    // UUID
  userId: string;                // Referência ao usuário
  name: string;                  // Nome da periodização
  description?: string;          // Descrição
  startDate: Date;               // Data de início
  endDate?: Date;                // Data de término
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;              // Soft delete
  syncedAt?: Date;               // Última sincronização
  needsSync: boolean;            // Precisa sincronizar
}
```

### Session

```typescript
interface Session {
  id: string;
  userId: string;
  periodizationId: string;
  name: string;
  scheduledAt?: Date;
  completedAt?: Date;
  status: 'planned' | 'in_progress' | 'completed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  syncedAt?: Date;
  needsSync: boolean;
}
```

### Exercise

```typescript
interface Exercise {
  id: string;
  userId: string;
  sessionId: string;
  name: string;
  muscleGroup?: MuscleGroup;
  equipment?: string;
  notes?: string;
  orderIndex: number;
  completedAt?: Date;
  conjugatedGroup?: string;      // UUID para agrupar exercícios
  conjugatedOrder?: number;      // Ordem no grupo conjugado
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  syncedAt?: Date;
  needsSync: boolean;
}
```

### Set

```typescript
interface Set {
  id: string;
  userId: string;
  exerciseId: string;
  orderIndex: number;
  repetitions: number;
  weight: number;
  technique?: Technique;
  setType?: SetType;
  restTime?: number;             // em segundos
  rir?: number;                  // Reps in Reserve (0-10)
  rpe?: number;                  // Rate of Perceived Exertion (1-10)
  notes?: string;
  completedAt?: Date;
  // Campos específicos para técnicas
  dropSetWeights?: number[];
  dropSetReps?: number[];
  restPauseDuration?: number;
  restPauseReps?: number[];
  clusterReps?: number;
  clusterRestDuration?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  syncedAt?: Date;
  needsSync: boolean;
}
```

### Enums

```typescript
type MuscleGroup = 
  | 'peito' | 'costas' | 'ombros' 
  | 'biceps' | 'triceps' | 'antebraco'
  | 'abdomen' | 'quadriceps' | 'posterior'
  | 'gluteos' | 'panturrilha' | 'trapezio' | 'lombar';

type SetType = 'warmup' | 'feeder' | 'workset' | 'backoff';

type Technique = 'standard' | 'dropset' | 'restpause' | 'clusterset';
```

---

## Sincronização

### Estratégia Offline-First

1. **Fonte Primária**: AsyncStorage (local)
2. **Sincronização**: Bidirecional com Supabase
3. **Conflitos**: Last-write-wins
4. **Rastreamento**: Campos `needsSync` e `syncedAt`

### Fluxo de Sincronização

```
1. Usuário faz alteração offline
   ↓
2. Dados salvos no AsyncStorage
   ↓
3. Campo needsSync = true
   ↓
4. Quando online, SyncService detecta
   ↓
5. Push: Envia dados para Supabase
   ↓
6. Pull: Busca atualizações do Supabase
   ↓
7. Merge: Aplica atualizações no AsyncStorage
   ↓
8. needsSync = false, syncedAt = now()
```

### Sincronização Automática

- Configurável via toggle no ProfileScreen
- Intervalo: 30 segundos quando habilitado
- Só ocorre quando online
- Retry automático em caso de erro (3 tentativas)

---

## Design System

### Cores

```typescript
// Theme Light
primary: '#A855F7'      // Roxo
background: '#FFFFFF'   // Branco
surface: '#F3F4F6'      // Cinza claro
text: '#1F2937'         // Cinza escuro

// Theme Dark (padrão)
primary: '#A855F7'      // Roxo
background: '#0A0A0A'   // Preto profundo
surface: '#1F1F1F'      // Cinza escuro
text: '#FFFFFF'         // Branco
```

### Espaçamento

```typescript
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
```

### Tipografia

```typescript
// Tamanhos
xs: 12px
sm: 14px
md: 16px
lg: 18px
xl: 20px
xxl: 24px

// Pesos
regular: '400'
medium: '500'
semibold: '600'
bold: '700'
```

### Componentes Base

- **Button**: Primário, secundário, outline
- **Card**: Container com sombra e bordas arredondadas
- **Input**: Campo de texto com validação
- **Select**: Dropdown nativo otimizado
- **DatePicker**: Cross-platform date picker
- **Skeleton**: Loading placeholder animado

---

## Navegação

### Estrutura

```
AppNavigator
├── AuthStack (não autenticado)
│   ├── LoginScreen
│   └── SignUpScreen
└── MainTabs (autenticado)
    ├── Home (HomeScreen)
    ├── Periodizations Stack
    │   ├── PeriodizationsScreen
    │   ├── PeriodizationDetailScreen
    │   ├── PeriodizationFormScreen
    │   ├── SessionListScreen
    │   ├── SessionDetailScreen
    │   ├── SessionFormScreen
    │   ├── ExerciseListScreen
    │   ├── ExerciseDetailScreen
    │   └── ExerciseFormScreen
    └── Profile (ProfileScreen)
```

---

## Serviços

### AuthService

- `signIn(email, password)`: Login
- `signUp(email, password)`: Cadastro
- `signOut()`: Logout
- `getCurrentUser()`: Usuário atual
- `getSession()`: Sessão ativa

### DatabaseService

- CRUD genérico para todas as entidades
- `create(table, data)`
- `read(table, id)`
- `update(table, id, data)`
- `delete(table, id)` (soft delete)
- `list(table, filters)`

### SyncService

- `syncAll()`: Sincroniza todas as entidades
- `push()`: Envia dados locais para cloud
- `pull()`: Busca dados da cloud
- `resolveConflicts()`: Resolve conflitos
- Retry automático com exponential backoff

### StatsService

- `getTotalVolume(periodizationId)`
- `getFrequency(periodizationId)`
- `getProgressionData(exerciseName)`
- `getRecentSessions(limit)`
- `getCurrentStreak()`

### HapticService

- `light()`: Feedback leve
- `medium()`: Feedback médio
- `heavy()`: Feedback pesado
- `success()`: Feedback de sucesso
- `error()`: Feedback de erro

### ToastService

- `success(message)`
- `error(message)`
- `info(message)`
- `warning(message)`

---

## Hooks Personalizados

### useAuth

```typescript
const { user, isLoading, signIn, signUp, signOut } = useAuth();
```

### useSync

```typescript
const { isSyncing, lastSyncedAt, syncAll } = useSync();
```

### useAutoSync

```typescript
// Sincronização automática a cada 30 segundos
useAutoSync();
```

### useNetworkSync

```typescript
const { isOnline } = useNetworkSync();
```

---

## Configuração do Supabase

### 1. Criar Projeto

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a URL e Anon Key

### 2. Executar Migration

Execute o arquivo `supabase/migrations/00000000000000_initial_schema.sql` no SQL Editor do Supabase.

Este script cria:
- ✅ Tabelas (periodizations, sessions, exercises, sets, sync_queue)
- ✅ Índices para performance
- ✅ Row Level Security (RLS) policies
- ✅ Triggers para updated_at
- ✅ Constraints e validações

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_APP_ENV=development
```

### 4. Testar

Execute o app e faça login. Os dados devem ser salvos localmente e sincronizados com o Supabase quando online.

---

## Desenvolvimento

### Scripts Disponíveis

```bash
npm start          # Inicia o Metro bundler
npm run android    # Roda no Android
npm run ios        # Roda no iOS (requer macOS)
npm run web        # Roda no navegador
npm run lint       # Executa ESLint
npm run format     # Formata código com Prettier
```

### Boas Práticas

1. **TypeScript Strict**: Sempre tipar corretamente
2. **Componentes Pequenos**: Máximo 300 linhas
3. **Sem Duplicação**: Reutilizar código sempre que possível
4. **Validação**: Usar Zod schemas para formulários
5. **Error Handling**: Try/catch em todas as operações async
6. **Loading States**: Sempre mostrar feedback visual
7. **Offline Support**: Todas as features devem funcionar offline

---

## Próximos Passos

### Fase 12: Testes e QA
- [ ] Testes unitários (Jest)
- [ ] Testes de integração
- [ ] Testes E2E (Detox)
- [ ] Teste de performance
- [ ] Teste de acessibilidade

### Fase 13: Build e Deployment
- [ ] Configurar EAS Build
- [ ] Gerar builds de produção (iOS + Android)
- [ ] Publicar na App Store
- [ ] Publicar na Play Store
- [ ] Deploy web (Vercel/Netlify)

### Fase 14: Melhorias Futuras
- [ ] Biblioteca de exercícios pré-cadastrados
- [ ] Templates de periodização
- [ ] Exportação de dados (PDF/CSV)
- [ ] Integração com wearables
- [ ] Modo coach (múltiplos alunos)
- [ ] Análise de IA para sugestões

---

## Suporte

Para dúvidas, problemas ou sugestões:
- Abra uma issue no repositório
- Consulte a documentação técnica
- Entre em contato com o time de desenvolvimento

---

**Versão da Documentação:** 1.0.0  
**Última Atualização:** Novembro 2025  
**Status do Projeto:** Em Desenvolvimento 🚧

