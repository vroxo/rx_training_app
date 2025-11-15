# 📋 PLANO DE IMPLEMENTAÇÃO - RX TRAINING APP

## 🎯 Resumo Executivo

**Tecnologias Core:**
- React Native + Expo
- TypeScript (strict mode)
- Supabase (Auth + PostgreSQL + Realtime)
- SQLite local (expo-sqlite)
- Zustand (estado global)
- React Query (sync e cache)
- React Navigation
- NativeWind (Tailwind)
- React Native Chart Kit

**Estratégia de Dados:**
- SQLite como fonte primária (offline-first)
- Supabase como backend e sync
- Row Level Security (RLS) para isolamento de dados
- Sync em background bidirecional

---

## 📦 FASE 1: FUNDAÇÃO E SETUP (Dias 1-3)

### **1.1 Setup do Projeto Base**
- [ ] Inicializar projeto Expo com TypeScript
- [ ] Configurar estrutura de pastas MPP
- [ ] Setup ESLint + Prettier + Husky
- [ ] Configurar .gitignore e .env.example
- [ ] Criar README.md com instruções

**Comandos:**
```bash
npx create-expo-app@latest rx-training-app --template
cd rx-training-app
```

**Estrutura de pastas:**
```
src/
├── models/          # Interfaces TypeScript
├── presenters/      # Lógica de negócio
├── views/
│   ├── screens/
│   └── components/
├── services/
│   ├── database/    # SQLite
│   ├── supabase/    # Cliente Supabase
│   └── sync/        # Lógica de sincronização
├── hooks/
├── utils/
├── constants/
├── types/
└── navigation/
```

### **1.2 Instalação de Dependências**

**Core:**
```bash
npx expo install expo-sqlite expo-secure-store expo-constants
npm install @supabase/supabase-js
npm install zustand
npm install @tanstack/react-query
```

**Navegação:**
```bash
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
```

**UI e Styling:**
```bash
npm install nativewind
npm install --save-dev tailwindcss@3.3.2
npm install react-native-reanimated
npm install react-native-gesture-handler
npm install react-native-svg
```

**Formulários e Validação:**
```bash
npm install react-hook-form zod @hookform/resolvers
```

**Gráficos:**
```bash
npm install react-native-chart-kit
```

**Utilitários:**
```bash
npm install date-fns uuid
npm install --save-dev @types/uuid
```

### **1.3 Configuração do Supabase**
- [ ] Criar projeto no Supabase
- [ ] Configurar autenticação (email/password)
- [ ] Configurar variáveis de ambiente (.env)
- [ ] Criar cliente Supabase configurado

**Arquivo: `src/services/supabase/client.ts`**

### **1.4 Design System e Tema**
- [ ] Criar arquivo de constantes de cores
- [ ] Configurar NativeWind/Tailwind
- [ ] Criar tokens de design (spacing, typography, shadows)
- [ ] Criar tema base do app

**Arquivos:**
- `src/constants/colors.ts`
- `src/constants/typography.ts`
- `src/constants/spacing.ts`
- `tailwind.config.js`

---

## 🗄️ FASE 2: BANCO DE DADOS E MODELOS (Dias 4-6)

### **2.1 Schema do Supabase (PostgreSQL)**

**Tabelas a criar:**

```sql
-- users (gerenciado pelo Supabase Auth)

-- periodizations
CREATE TABLE periodizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ
);

-- sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  periodization_id UUID REFERENCES periodizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('planned', 'in_progress', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ
);

-- exercises
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_group TEXT,
  equipment TEXT,
  notes TEXT,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ
);

-- sets
CREATE TABLE sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  repetitions INTEGER NOT NULL,
  weight DECIMAL(10, 2) NOT NULL,
  technique TEXT,
  set_type TEXT CHECK (set_type IN ('warmup', 'feeder', 'workset', 'backoff')),
  rest_time INTEGER, -- segundos
  rir INTEGER,
  rpe INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ
);

-- sync_queue (para rastrear mudanças pendentes)
CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT CHECK (operation IN ('insert', 'update', 'delete')),
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced BOOLEAN DEFAULT FALSE
);
```

**Políticas RLS (Row Level Security):**

```sql
-- Habilitar RLS
ALTER TABLE periodizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

-- Políticas para periodizations
CREATE POLICY "Users can view own periodizations"
  ON periodizations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own periodizations"
  ON periodizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own periodizations"
  ON periodizations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own periodizations"
  ON periodizations FOR DELETE
  USING (auth.uid() = user_id);

-- Replicar políticas similares para sessions, exercises, sets, sync_queue
```

### **2.2 Schema SQLite Local**

**Arquivo: `src/services/database/schema.ts`**

Criar migrations SQLite que espelham o schema do Supabase:

```typescript
const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS periodizations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,
    synced_at TEXT,
    needs_sync INTEGER DEFAULT 1
  );
  
  -- Repetir para sessions, exercises, sets, sync_queue
`;
```

### **2.3 Models TypeScript**

**Arquivos a criar:**
- `src/models/Periodization.ts`
- `src/models/Session.ts`
- `src/models/Exercise.ts`
- `src/models/Set.ts`
- `src/models/User.ts`
- `src/models/index.ts`

**Exemplo: `src/models/Set.ts`**

```typescript
export interface Set {
  id: string;
  userId: string;
  exerciseId: string;
  orderIndex: number;
  repetitions: number;
  weight: number;
  technique?: string;
  setType?: 'warmup' | 'feeder' | 'workset' | 'backoff';
  restTime?: number; // seconds
  rir?: number;
  rpe?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  syncedAt?: Date;
  needsSync?: boolean;
}

export type CreateSetInput = Omit<Set, 'id' | 'createdAt' | 'updatedAt' | 'syncedAt'>;
export type UpdateSetInput = Partial<CreateSetInput>;
```

### **2.4 Database Service (SQLite)**

**Arquivo: `src/services/database/DatabaseService.ts`**

Implementar:
- Inicialização do banco
- CRUD operations para cada entidade
- Query helpers
- Transaction support

### **2.5 Supabase Service**

**Arquivo: `src/services/supabase/SupabaseService.ts`**

Implementar:
- CRUD operations que espelham o DatabaseService
- Queries otimizadas
- Realtime subscriptions (opcional para esta fase)

---

## 🔄 FASE 3: SINCRONIZAÇÃO E AUTH (Dias 7-10)

### **3.1 Sistema de Autenticação**

**Arquivos:**
- `src/services/auth/AuthService.ts`
- `src/hooks/useAuth.ts`
- `src/stores/authStore.ts` (Zustand)

**Funcionalidades:**
- Sign up
- Sign in
- Sign out
- Password reset
- Session management
- Persist auth state

### **3.2 Sync Service - Lógica de Sincronização**

**Arquivo: `src/services/sync/SyncService.ts`**

**Estratégia de Sincronização:**

1. **Push (Local → Supabase):**
   - Detectar mudanças locais (needs_sync = 1)
   - Enviar para Supabase em ordem cronológica
   - Marcar como sincronizado após sucesso
   - Tratar conflitos (last-write-wins)

2. **Pull (Supabase → Local):**
   - Buscar mudanças desde último sync (synced_at)
   - Aplicar mudanças localmente
   - Resolver conflitos (priorizar servidor)
   - Atualizar timestamp de sync

3. **Conflict Resolution:**
   - Comparar `updated_at` timestamps
   - Last-write-wins como padrão
   - Flag para revisão manual (futuro)

**Implementar:**
- `syncPeriodizations()`
- `syncSessions()`
- `syncExercises()`
- `syncSets()`
- `fullSync()` - sincroniza tudo
- `syncOnBackground()` - sync automático

### **3.3 Sync Store e Hooks**

**Arquivos:**
- `src/stores/syncStore.ts` (Zustand)
- `src/hooks/useSync.ts`
- `src/hooks/useSyncStatus.ts`

**Estado de Sincronização:**
```typescript
interface SyncState {
  isSyncing: boolean;
  lastSyncAt: Date | null;
  pendingChanges: number;
  syncError: string | null;
  isOnline: boolean;
}
```

### **3.4 Network Detector**

**Arquivo: `src/services/network/NetworkService.ts`**

- Detectar status online/offline
- Trigger sync quando ficar online
- Mostrar indicador visual

---

## 🎨 FASE 4: COMPONENTES BASE E DESIGN SYSTEM (Dias 11-13)

### **4.1 Componentes Comuns**

**Diretório: `src/views/components/common/`**

Criar componentes:
- `Button.tsx` (Primary, Secondary, FAB)
- `Card.tsx`
- `Input.tsx`
- `TextArea.tsx`
- `Select.tsx`
- `DatePicker.tsx`
- `TimePicker.tsx`
- `LoadingSpinner.tsx`
- `EmptyState.tsx`
- `ErrorBoundary.tsx`
- `SyncIndicator.tsx`

### **4.2 Componentes de Formulário**

**Diretório: `src/views/components/forms/`**

- `FormInput.tsx` (integrado com React Hook Form)
- `FormSelect.tsx`
- `FormDatePicker.tsx`
- `FormError.tsx`
- `FormLabel.tsx`

### **4.3 Layout Components**

- `Screen.tsx` (wrapper padrão para screens)
- `KeyboardAvoidingView.tsx`
- `SafeAreaView.tsx`
- `Header.tsx`
- `BottomSheet.tsx` (modal bottom)

### **4.4 Ícones e Assets**

- Setup React Native SVG
- Importar ou criar ícones necessários
- Criar componente `Icon.tsx` wrapper

---

## 🚢 FASE 5: NAVEGAÇÃO E FLUXO AUTH (Dias 14-15)

### **5.1 Estrutura de Navegação**

**Arquivo: `src/navigation/AppNavigator.tsx`**

```typescript
// Auth Stack
- LoginScreen
- SignUpScreen
- ForgotPasswordScreen

// Main App
- Bottom Tabs
  - Dashboard Tab
  - Periodizations Tab
  - Sessions Tab (ou Workouts)
  - Profile Tab
  
- Stack Navigators
  - Periodization Stack
    - PeriodizationListScreen
    - PeriodizationDetailScreen
    - CreatePeriodizationScreen
    - EditPeriodizationScreen
  
  - Session Stack
    - SessionListScreen
    - SessionDetailScreen
    - CreateSessionScreen
    - EditSessionScreen
    - WorkoutInProgressScreen
  
  - Exercise Stack
    - ExerciseDetailScreen
    - CreateExerciseScreen
  
  - Profile Stack
    - ProfileScreen
    - SettingsScreen
```

### **5.2 Telas de Autenticação**

**Arquivos:**
- `src/views/screens/Auth/LoginScreen.tsx`
- `src/views/screens/Auth/SignUpScreen.tsx`
- `src/views/screens/Auth/ForgotPasswordScreen.tsx`

Implementar formulários com:
- Validação em tempo real (Zod)
- Loading states
- Error handling
- Navegação condicional

---

## 📋 FASE 6: CRUD DE PERIODIZAÇÕES (Dias 16-19)

### **6.1 Periodization Presenter**

**Arquivo: `src/presenters/PeriodizationPresenter.ts`**

```typescript
class PeriodizationPresenter {
  async getAllPeriodizations(): Promise<Periodization[]>
  async getPeriodizationById(id: string): Promise<Periodization>
  async createPeriodization(data: CreatePeriodizationInput): Promise<Periodization>
  async updatePeriodization(id: string, data: UpdatePeriodizationInput): Promise<void>
  async deletePeriodization(id: string): Promise<void>
  async getActivePeriodization(): Promise<Periodization | null>
}
```

### **6.2 Telas de Periodização**

**`PeriodizationListScreen.tsx`:**
- Lista de periodizações
- Filtros (ativa, arquivada, todas)
- FAB para criar nova
- Card preview de cada periodização
- Swipe actions (editar, deletar)

**`PeriodizationDetailScreen.tsx`:**
- Detalhes da periodização
- Lista de sessões dentro
- Estatísticas resumidas
- Botões de ação (editar, adicionar sessão)

**`CreatePeriodizationScreen.tsx`:**
- Formulário de criação
- Validação
- Date pickers
- Save e cancel

**`EditPeriodizationScreen.tsx`:**
- Formulário de edição
- Pre-filled com dados existentes

### **6.3 Componentes Específicos**

**Diretório: `src/views/screens/Periodization/components/`**

- `PeriodizationCard.tsx`
- `PeriodizationForm.tsx`
- `PeriodizationStats.tsx`

---

## 🏋️ FASE 7: CRUD DE SESSÕES (Dias 20-24)

### **7.1 Session Presenter**

**Arquivo: `src/presenters/SessionPresenter.ts`**

```typescript
class SessionPresenter {
  async getSessionsByPeriodization(periodizationId: string): Promise<Session[]>
  async getSessionById(id: string): Promise<Session>
  async createSession(data: CreateSessionInput): Promise<Session>
  async updateSession(id: string, data: UpdateSessionInput): Promise<void>
  async deleteSession(id: string): Promise<void>
  async startSession(id: string): Promise<void>
  async completeSession(id: string): Promise<void>
  async getUpcomingSessions(): Promise<Session[]>
}
```

### **7.2 Telas de Sessão**

**`SessionListScreen.tsx`:**
- Lista de sessões
- Agrupadas por status (upcoming, completed)
- Filtros por periodização
- Timeline view (opcional)

**`SessionDetailScreen.tsx`:**
- Detalhes da sessão
- Lista de exercícios
- Status e notas
- Botões de ação

**`CreateSessionScreen.tsx`:**
- Formulário com nome, data, periodização
- Template selection (futuro)

**`EditSessionScreen.tsx`:**
- Edição de sessão existente

**`WorkoutInProgressScreen.tsx`:**
- Tela especial para registrar treino em tempo real
- Lista de exercícios
- Adicionar exercícios dinamicamente
- Timer de descanso
- Quick add séries
- Finalizar treino

### **7.3 Componentes Específicos**

- `SessionCard.tsx`
- `SessionForm.tsx`
- `SessionStatusBadge.tsx`
- `WorkoutTimer.tsx`
- `RestTimer.tsx`

---

## 💪 FASE 8: CRUD DE EXERCÍCIOS E SÉRIES (Dias 25-29)

### **8.1 Exercise Presenter**

**Arquivo: `src/presenters/ExercisePresenter.ts`**

```typescript
class ExercisePresenter {
  async getExercisesBySession(sessionId: string): Promise<Exercise[]>
  async getExerciseById(id: string): Promise<Exercise>
  async createExercise(data: CreateExerciseInput): Promise<Exercise>
  async updateExercise(id: string, data: UpdateExerciseInput): Promise<void>
  async deleteExercise(id: string): Promise<void>
  async reorderExercises(sessionId: string, order: string[]): Promise<void>
  async getExerciseHistory(name: string): Promise<Exercise[]>
}
```

### **8.2 Set Presenter**

**Arquivo: `src/presenters/SetPresenter.ts`**

```typescript
class SetPresenter {
  async getSetsByExercise(exerciseId: string): Promise<Set[]>
  async createSet(data: CreateSetInput): Promise<Set>
  async updateSet(id: string, data: UpdateSetInput): Promise<void>
  async deleteSet(id: string): Promise<void>
  async duplicateSet(setId: string): Promise<Set>
}
```

### **8.3 Telas e Componentes**

**`ExerciseDetailScreen.tsx`:**
- Detalhes do exercício
- Lista de séries
- Histórico de pesos
- Adicionar/editar séries

**Componentes:**
- `ExerciseCard.tsx`
- `ExerciseForm.tsx`
- `SetForm.tsx`
- `SetCard.tsx`
- `SetTypeSelector.tsx`
- `TechniqueSelector.tsx`
- `RIRPicker.tsx`
- `RPEPicker.tsx`
- `WeightInput.tsx`
- `RepsInput.tsx`

### **8.4 Quick Add Features**

- Template de séries (copiar série anterior)
- Auto-incremento de peso
- Sugestões baseadas em histórico

---

## 📊 FASE 9: DASHBOARD E ANALYTICS (Dias 30-36)

### **9.1 Dashboard Presenter**

**Arquivo: `src/presenters/DashboardPresenter.ts`**

```typescript
class DashboardPresenter {
  // Métricas gerais
  async getTotalVolumeByPeriod(periodizationId: string): Promise<number>
  async getWorkoutFrequency(days: number): Promise<number>
  async getAverageRestTime(periodizationId: string): Promise<number>
  async getMostPerformedExercises(limit: number): Promise<ExerciseStat[]>
  
  // Gráficos
  async getWeightProgressionByExercise(
    exerciseName: string, 
    filters: ChartFilters
  ): Promise<ChartDataPoint[]>
  
  async compareExercises(
    exerciseNames: string[], 
    filters: ChartFilters
  ): Promise<ComparisonChartData>
  
  // Estatísticas
  async getSetTypeDistribution(periodizationId: string): Promise<Distribution>
  async getAverageProgressionRate(exerciseName: string): Promise<number>
}
```

### **9.2 Chart Service**

**Arquivo: `src/services/charts/ChartService.ts`**

- Processar dados para formato do Chart Kit
- Calcular escalas e eixos
- Formatação de labels
- Cores e estilos

### **9.3 Dashboard Screen**

**`DashboardScreen.tsx`:**

**Layout:**
1. Header com período selecionado
2. Cards de métricas principais (grid 2x2)
   - Volume total
   - Frequência semanal
   - Progressão média
   - Sessões completadas
3. Seção "Progresso por Exercício"
   - Dropdown para selecionar exercício
   - Gráfico de linha
   - Filtros de período
4. Seção "Estatísticas Detalhadas"
   - Exercícios mais realizados
   - Distribuição de tipos de série
   - Tempo médio de descanso

### **9.4 Componentes de Dashboard**

**Diretório: `src/views/screens/Dashboard/components/`**

- `MetricCard.tsx`
- `ExerciseProgressChart.tsx`
- `ExerciseSelector.tsx`
- `PeriodFilter.tsx`
- `StatsCard.tsx`
- `ExerciseComparisonChart.tsx`

### **9.5 Chart Components**

**Diretório: `src/views/components/charts/`**

- `LineChart.tsx` (wrapper do Chart Kit)
- `BarChart.tsx`
- `ChartTooltip.tsx`
- `ChartLegend.tsx`

---

## 🎨 FASE 10: POLISH E UX (Dias 37-40)

### **10.1 Animações**

**Usando React Native Reanimated:**
- Transições entre telas
- Animação de cards (entrada/saída)
- Swipe gestures
- Pull to refresh
- Loading skeletons
- Progress bars animados

### **10.2 Feedback Visual**

- Toast notifications
- Success/error messages
- Confirmação de ações destrutivas
- Loading states consistentes
- Empty states informativos

### **10.3 Micro-interações**

- Haptic feedback em ações importantes
- Botão de FAB com animação
- Ripple effects
- Smooth scrolling
- Bounce animations

### **10.4 Onboarding**

- Splash screen elegante
- Welcome screen (primeira vez)
- Tutoriais contextuais (opcional)

---

## ⚡ FASE 11: OTIMIZAÇÃO E PERFORMANCE (Dias 41-43)

### **11.1 Performance**

- [ ] Implementar FlashList para listas longas
- [ ] Memoização de componentes pesados
- [ ] Lazy loading de imagens
- [ ] Code splitting (se web)
- [ ] Bundle size analysis
- [ ] Otimizar queries SQLite (índices)

### **11.2 Cache Strategy**

- [ ] Configurar React Query com políticas adequadas
- [ ] Implementar stale-while-revalidate
- [ ] Preload de dados comuns
- [ ] Cache de imagens (se houver)

### **11.3 Error Handling**

- [ ] Error boundaries globais
- [ ] Retry logic em sync
- [ ] Fallbacks graciosos
- [ ] Error tracking (Sentry ou similar - opcional)

---

## 🧪 FASE 12: TESTES E QA (Dias 44-47)

### **12.1 Testes Unitários**

**Testar:**
- Presenters (lógica de negócio)
- Utils e helpers
- Cálculos de dashboard
- Conversões de dados

### **12.2 Testes de Integração**

- Database operations
- Sync flow
- Auth flow

### **12.3 Testes E2E (Opcional)**

- Fluxo completo: criar periodização → sessão → exercício → séries
- Fluxo de sync
- Fluxo de auth

### **12.4 QA Manual**

- [ ] Testar offline
- [ ] Testar sync em diferentes cenários
- [ ] Testar em diferentes tamanhos de tela
- [ ] Testar performance com dados massivos
- [ ] Testar edge cases

---

## 📱 FASE 13: BUILD E DEPLOYMENT (Dias 48-50)

### **13.1 Preparação para Build**

- [ ] Configurar app.json/app.config.js
- [ ] Definir versioning
- [ ] Criar ícones (1024x1024)
- [ ] Criar splash screens
- [ ] Configurar deep linking (opcional)

### **13.2 Build iOS**

- [ ] Configurar bundle identifier
- [ ] Provisioning profiles
- [ ] Build com EAS (Expo Application Services)
- [ ] TestFlight beta

### **13.3 Build Android**

- [ ] Configurar package name
- [ ] Keystore
- [ ] Build APK/AAB
- [ ] Google Play Console beta

### **13.4 CI/CD (Opcional)**

- GitHub Actions para build automatizado
- Automated tests no CI
- Deployment automatizado

---

## 📚 FASE 14: DOCUMENTAÇÃO (Dias 51-52)

### **14.1 Documentação Técnica**

- [ ] Architecture Decision Records (ADRs)
- [ ] API documentation (Presenters)
- [ ] Database schema docs
- [ ] Sync strategy docs
- [ ] Setup instructions

### **14.2 README**

- [ ] Descrição do projeto
- [ ] Features principais
- [ ] Stack tecnológico
- [ ] Como rodar localmente
- [ ] Como buildar
- [ ] Variáveis de ambiente

### **14.3 User Guide (Opcional)**

- Manual do usuário
- FAQs
- Troubleshooting

---

## 🔄 FLUXO DE DESENVOLVIMENTO RECOMENDADO

### Daily Workflow:
1. Pull das mudanças
2. Criar branch feature/nome-da-feature
3. Desenvolver e testar
4. Commit com mensagens claras
5. Push e criar PR
6. Code review
7. Merge

### Commits Semânticos:
```
feat: adiciona tela de criar periodização
fix: corrige bug no sync de séries
refactor: melhora performance do dashboard
docs: atualiza README
test: adiciona testes para ExercisePresenter
style: aplica lint em todos os arquivos
```

---

## 📋 CHECKLIST DE VALIDAÇÃO POR FASE

### Fase 1-2 ✅
- [ ] Projeto roda sem erros
- [ ] TypeScript strict configurado
- [ ] Banco SQLite inicializa corretamente
- [ ] Supabase conecta
- [ ] Models estão tipados

### Fase 3 ✅
- [ ] Login funciona
- [ ] Sign up funciona
- [ ] Tokens persistem
- [ ] Sync push funciona
- [ ] Sync pull funciona
- [ ] Conflitos resolvidos corretamente

### Fase 4-5 ✅
- [ ] Componentes base renderizam
- [ ] Navegação funciona
- [ ] Tema aplicado consistentemente
- [ ] Auth flow completo

### Fase 6-8 ✅
- [ ] CRUD de periodizações funciona
- [ ] CRUD de sessões funciona
- [ ] CRUD de exercícios funciona
- [ ] CRUD de séries funciona
- [ ] Todas alterações sincronizam
- [ ] Dados persistem offline

### Fase 9 ✅
- [ ] Dashboard carrega métricas corretas
- [ ] Gráficos renderizam
- [ ] Filtros funcionam
- [ ] Performance aceitável com muitos dados

### Fase 10-11 ✅
- [ ] Animações suaves (60fps)
- [ ] App responsivo
- [ ] Performance otimizada
- [ ] Sem memory leaks

### Fase 12-13 ✅
- [ ] Testes passam
- [ ] Build iOS sucesso
- [ ] Build Android sucesso
- [ ] App funcional em produção

---

## 🎯 ESTIMATIVA TOTAL

**Timeline Otimista:** 52 dias (~2.5 meses)
**Timeline Realista:** 70-80 dias (~3-4 meses)
**Timeline Conservadora:** 90-100 dias (~4-5 meses)

**Nota:** Trabalhando full-time, um desenvolvedor experiente em React Native + Supabase pode completar em 2-3 meses. Ajuste conforme disponibilidade.

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

Para começar a implementação:

1. **Setup inicial do projeto** (Fase 1.1-1.2)
2. **Configuração do Supabase** (criar schema SQL)
3. **Estrutura de pastas completa**
4. **Arquivos de configuração** (tsconfig, tailwind, etc)

---

## 📝 NOTAS IMPORTANTES

### Decisões Arquiteturais

**1. Por que SQLite + Supabase?**
- SQLite garante funcionamento offline completo
- Supabase fornece sync, auth e backup em nuvem
- Melhor experiência de usuário (app sempre responsivo)

**2. Por que MPP (Model-Presenter-Pattern)?**
- Separação clara de responsabilidades
- Lógica de negócio testável independente da UI
- Facilita manutenção e escalabilidade

**3. Por que Zustand ao invés de Redux?**
- API mais simples e menos boilerplate
- Performance equivalente
- Menor curva de aprendizado
- Bundle size menor

**4. Por que React Query?**
- Cache inteligente out-of-the-box
- Retry logic automático
- Gerenciamento de loading/error states
- Sincronização em background

### Pontos de Atenção

1. **Sincronização:**
   - Implementar retry logic robusto
   - Lidar com conflitos de forma elegante
   - Testar cenários de rede instável

2. **Performance:**
   - Monitorar tamanho do bundle
   - Otimizar queries SQLite com índices
   - Usar memoization quando apropriado

3. **UX:**
   - Feedback visual constante
   - Loading states informativos
   - Animações suaves mas não exageradas

4. **Segurança:**
   - Nunca expor API keys no código
   - Usar variáveis de ambiente
   - Implementar RLS corretamente no Supabase

---

## 🎓 Recursos Úteis

### Documentação
- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [React Navigation](https://reactnavigation.org/)
- [NativeWind](https://www.nativewind.dev/)

### Tutoriais
- Expo SQLite: https://docs.expo.dev/versions/latest/sdk/sqlite/
- Supabase Auth: https://supabase.com/docs/guides/auth
- React Query: https://tanstack.com/query/latest

### Ferramentas
- Expo Go (teste em dispositivo real)
- React Native Debugger
- Flipper (debugging)
- Supabase Studio (gerenciar banco)

---

**Versão do Plano:** 1.0  
**Data:** Novembro 2025  
**Status:** Pronto para implementação

