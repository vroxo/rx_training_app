# 💪 RX Training App

> Aplicativo mobile-first para periodização de treino e acompanhamento de evolução

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000020?style=flat&logo=expo&logoColor=white)](https://expo.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)

## 📱 Sobre o Projeto

**RX Training App** é um aplicativo React Native desenvolvido com Expo que permite aos usuários gerenciar periodizações de treino, registrar sessões, exercícios e séries, além de acompanhar sua evolução através de gráficos e estatísticas.

### ✨ Principais Diferenciais

- 🔄 **Offline-First**: Funciona completamente offline com sincronização automática
- 💪 **Técnicas Avançadas**: Suporte para drop sets, rest-pause, cluster sets
- 📊 **Analytics Detalhados**: Gráficos de evolução e estatísticas de performance
- 🎯 **Tipos de Série**: Warmup, feeder set, work set, backoff
- 📈 **RIR e RPE**: Controle preciso de intensidade
- 🎨 **Design Elegante**: Interface moderna com dark theme

---

## 🚀 Tecnologias

### Core
- **React Native 0.81** - Framework mobile cross-platform
- **Expo 54** - Plataforma de desenvolvimento mobile
- **TypeScript 5.9** - Tipagem estática e maior segurança

### Backend & Database
- **Supabase** - Backend as a Service (PostgreSQL + Auth + Realtime)
- **AsyncStorage** - Armazenamento local (offline-first, web-compatible)
- **Row Level Security (RLS)** - Segurança e isolamento de dados

### Estado e Dados
- **Zustand** - Gerenciamento de estado global
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas e dados
- **date-fns** - Manipulação de datas

### UI/UX
- **React Navigation 7** - Navegação entre telas
- **React Native Chart Kit** - Gráficos e visualizações
- **FlashList** - Listas de alta performance
- **Expo Haptics** - Feedback tátil
- **Toast Messages** - Notificações elegantes
- **Skeleton Loaders** - Loading states

---

## 📋 Funcionalidades

### Autenticação
- ✅ Login e cadastro com email/senha
- ✅ Persistência de sessão
- ✅ Logout seguro

### Periodizações
- ✅ Criar e gerenciar ciclos de treino
- ✅ Definir datas de início e término
- ✅ Adicionar descrições e notas
- ✅ Soft delete (recuperável)

### Sessões de Treino
- ✅ Criar sessões dentro de periodizações
- ✅ Status: planejada, em progresso, completa
- ✅ Agendar treinos
- ✅ Adicionar notas e observações

### Exercícios
- ✅ Biblioteca com 13 grupos musculares:
  - Peito, Costas, Ombros
  - Bíceps, Tríceps, Antebraço
  - Abdômen, Quadríceps, Posterior de Coxa
  - Glúteos, Panturrilha, Trapézio, Lombar
- ✅ Exercícios conjugados (biset, triset)
- ✅ Ordenação customizável
- ✅ Marcação de conclusão

### Séries
- ✅ Registro de repetições e peso
- ✅ 4 tipos de série:
  - 🔵 **Warmup** - Aquecimento
  - 🟢 **Feeder Set** - Série preparatória
  - 🔴 **Work Set** - Série principal
  - 🟠 **Backoff** - Série de redução
- ✅ Técnicas avançadas:
  - 🟣 **Drop Set** - Redução progressiva de carga
  - 🌸 **Rest Pause** - Pausas breves durante a série
  - 🔷 **Cluster Set** - Mini-séries com descansos
- ✅ RIR (Reps in Reserve) - 0 a 10
- ✅ RPE (Rate of Perceived Exertion) - 1 a 10
- ✅ Tempo de descanso em segundos
- ✅ Notas por série

### Dashboard e Estatísticas
- ✅ Volume total de treino
- ✅ Frequência de treinos (sessões/semana)
- ✅ Gráficos de evolução de peso
- ✅ Lista de sessões recentes
- ✅ Sequência de dias consecutivos
- ✅ Filtros por período e exercício

### Sincronização
- ✅ Sincronização manual e automática
- ✅ Indicador de status online/offline
- ✅ Timestamp de última sincronização
- ✅ Retry automático com exponential backoff
- ✅ Resolução de conflitos (last-write-wins)
- ✅ Queue de sincronização para mudanças offline

### UX/UI
- ✅ Dark theme elegante (roxo, preto, branco)
- ✅ Light theme disponível
- ✅ Haptic feedback em interações
- ✅ Toast notifications para feedback
- ✅ Loading skeletons
- ✅ Pull-to-refresh
- ✅ Error boundaries
- ✅ Empty states informativos

---

## 🛠️ Setup do Projeto

### Pré-requisitos

- **Node.js** 20+ instalado
- **npm** 10+ ou **yarn**
- **Expo CLI** (opcional, mas recomendado)
- Conta no **Supabase** (gratuita)

### Instalação

1. **Clone o repositório:**

```bash
git clone <url-do-repositorio>
cd rx_training_app
```

2. **Instale as dependências:**

```bash
npm install
```

3. **Configure as variáveis de ambiente:**

Crie um arquivo `.env` na raiz do projeto:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_APP_ENV=development
```

> 💡 Veja [SUPABASE_SETUP_INSTRUCTIONS.md](./SUPABASE_SETUP_INSTRUCTIONS.md) para instruções detalhadas

4. **Execute o schema SQL no Supabase:**

Execute o arquivo `supabase/migrations/00000000000000_initial_schema.sql` no SQL Editor do seu projeto Supabase.

5. **Inicie o projeto:**

```bash
npm start
```

### Rodando em Dispositivos

**iOS (requer macOS):**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

**Web:**
```bash
npm run web
```

**Mobile com Expo Go:**
1. Instale o app **Expo Go** no seu smartphone
2. Escaneie o QR code exibido no terminal

---

## 📁 Estrutura do Projeto

```
rx_training_app/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── DatePicker.tsx
│   │   ├── Skeleton.tsx
│   │   ├── VolumeChart.tsx
│   │   └── ...
│   ├── screens/             # Telas da aplicação
│   │   ├── HomeScreen.tsx
│   │   ├── PeriodizationsScreen.tsx
│   │   ├── SessionListScreen.tsx
│   │   ├── ExerciseListScreen.tsx
│   │   └── ...
│   ├── navigation/          # Configuração de navegação
│   │   ├── AppNavigator.tsx
│   │   ├── AuthStackNavigator.tsx
│   │   └── MainTabNavigator.tsx
│   ├── services/            # Serviços de negócio
│   │   ├── auth/            # Autenticação
│   │   ├── database/        # Database local
│   │   ├── supabase/        # Cliente Supabase
│   │   ├── sync/            # Sincronização
│   │   ├── stats/           # Estatísticas
│   │   ├── haptic/          # Feedback tátil
│   │   └── toast/           # Notificações
│   ├── hooks/               # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useSync.ts
│   │   └── useAutoSync.ts
│   ├── stores/              # Estado global (Zustand)
│   │   ├── authStore.ts
│   │   └── syncStore.ts
│   ├── models/              # Interfaces TypeScript
│   │   ├── Periodization.ts
│   │   ├── Session.ts
│   │   ├── Exercise.ts
│   │   └── Set.ts
│   ├── schemas/             # Schemas Zod
│   │   ├── periodization.schema.ts
│   │   ├── session.schema.ts
│   │   ├── exercise.schema.ts
│   │   └── set.schema.ts
│   ├── constants/           # Constantes e design tokens
│   │   ├── colors.ts
│   │   ├── theme.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   ├── muscleGroups.ts
│   │   ├── setTypes.ts
│   │   └── techniques.ts
│   └── utils/               # Funções utilitárias
│       ├── timezone.ts
│       └── rpe.ts
├── supabase/
│   └── migrations/          # Migrations SQL
│       └── 00000000000000_initial_schema.sql
├── assets/                  # Imagens, ícones, fontes
├── docs/                    # Documentação adicional
├── App.tsx                  # Entry point
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🏗️ Arquitetura

### Estratégia Offline-First

```
┌─────────────────────┐
│   User Interface    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   AsyncStorage      │ ◄── Fonte primária de dados
│   (Local Storage)   │
└──────────┬──────────┘
           │
           │ Sync quando online
           ▼
┌─────────────────────┐
│     Supabase        │
│  (PostgreSQL +      │
│   Realtime + Auth)  │
└─────────────────────┘
```

**Fluxo:**
1. Todas as operações são salvas primeiro no AsyncStorage
2. Dados marcados com `needsSync: true`
3. SyncService detecta mudanças e sincroniza com Supabase quando online
4. Pull busca atualizações do servidor
5. Merge aplica mudanças localmente (last-write-wins)

### Hierarquia de Dados

```
Periodization (1:N)
    └── Session (1:N)
            └── Exercise (1:N)
                    └── Set
```

---

## 🎨 Design System

### Paleta de Cores

**Dark Theme (padrão):**
- 🟣 Primary: `#A855F7` (Roxo)
- ⬛ Background: `#0A0A0A` (Preto profundo)
- ⬛ Surface: `#1F1F1F` (Cinza escuro)
- ⬜ Text: `#FFFFFF` (Branco)

**Light Theme:**
- 🟣 Primary: `#A855F7` (Roxo)
- ⬜ Background: `#FFFFFF` (Branco)
- ⬜ Surface: `#F3F4F6` (Cinza claro)
- ⬛ Text: `#1F2937` (Cinza escuro)

### Espaçamento

```
xs:  4px
sm:  8px
md:  16px
lg:  24px
xl:  32px
xxl: 48px
```

### Tipografia

```
xs:  12px
sm:  14px
md:  16px (base)
lg:  18px
xl:  20px
xxl: 24px
```

---

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
npm start          # Inicia o Metro bundler
npm run android    # Roda no Android
npm run ios        # Roda no iOS (requer macOS)
npm run web        # Roda no navegador

# Qualidade de Código
npm run lint       # Executa ESLint
npm run format     # Formata código com Prettier

# Build (requer EAS CLI)
npm run build      # Build de produção
```

---

## 🔐 Configuração do Supabase

### Passo 1: Criar Projeto

1. Acesse [supabase.com](https://supabase.com)
2. Clique em **"New Project"**
3. Escolha um nome e senha
4. Aguarde a criação (1-2 minutos)

### Passo 2: Executar Migration

1. Vá para **SQL Editor** no painel do Supabase
2. Clique em **"New Query"**
3. Copie o conteúdo de `supabase/migrations/00000000000000_initial_schema.sql`
4. Cole no editor e clique em **"Run"**

### Passo 3: Configurar Variáveis

1. No painel do Supabase, vá em **Settings** → **API**
2. Copie:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Adicione ao arquivo `.env`

### Passo 4: Verificar

Execute esta query no SQL Editor para verificar:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('periodizations', 'sessions', 'exercises', 'sets', 'sync_queue');
```

Deve retornar 5 tabelas.

---

## 🧪 Testes

[![Tests](https://img.shields.io/badge/tests-396%20passing-brightgreen)](./TEST_STATUS.md)
[![Coverage](https://img.shields.io/badge/coverage-75%25-brightgreen)](./TEST_STATUS.md)

### Executar Testes

```bash
# Todos os testes
npm test

# Watch mode (útil durante desenvolvimento)
npm run test:watch

# Com relatório de cobertura
npm run test:coverage

# Apenas unitários
npm run test:unit

# Apenas integração
npm run test:integration

# Teste específico
npm test -- StatsService
```

### Cobertura Atual

| Camada | Testes | Cobertura | Status |
|--------|--------|-----------|--------|
| Setup & Config | 8 | 100% | ✅ |
| Utilities | 68 | 100% | ✅ |
| Schemas (Zod) | 154 | 100% | ✅ |
| DatabaseService | 69 | ~85% | ✅ |
| StorageService | 75 | ~80% | ✅ |
| StatsService | 22 | ~60% | ✅ |
| **Total** | **396** | **75%** | ✅ |

### Documentação de Testes

- 📊 [Status dos Testes](./TEST_STATUS.md) - Progresso e roadmap completo
- 🔧 [Setup de Testes](./TESTING_SETUP.md) - Configuração e dependências
- 📖 [Guia de Testes](./src/__tests__/README.md) - Best practices e exemplos

### Performance

- ⚡ **396 testes** executam em **~2.1 segundos**
- 🎯 **100% de sucesso** (0 falhas)
- 🔄 **Isolamento perfeito** entre testes
- 💾 **Mocks em memória** (SQLite + AsyncStorage)

### Infraestrutura de Testes

- ✅ **Jest** - Framework de testes
- ✅ **@testing-library/react-native** - Testing utilities
- ✅ **Mock SQLite** - Database em memória
- ✅ **Mock AsyncStorage** - Storage funcional
- ✅ **Test Factories** - Geração de dados de teste
- ✅ **Custom Matchers** - Assertions específicas

```bash
# Lint e type check
npm run lint
npx tsc --noEmit
```

---

## 📦 Build para Produção

### Usando EAS (Expo Application Services)

1. **Instale o EAS CLI:**
```bash
npm install -g eas-cli
```

2. **Configure o EAS:**
```bash
eas build:configure
```

3. **Build Android (APK/AAB):**
```bash
eas build --platform android
```

4. **Build iOS (IPA):**
```bash
eas build --platform ios
```

> 💡 Requer conta Expo e configuração de credenciais

---

## 📚 Documentação

- 📖 [Documentação Completa](./DOCUMENTATION.md) - Guia detalhado da aplicação
- 🔧 [Setup Supabase](./SUPABASE_SETUP_INSTRUCTIONS.md) - Configuração do backend
- 🤝 [Guia de Contribuição](./CONTRIBUTING.md) - Como contribuir
- 🧪 [Status dos Testes](./TEST_STATUS.md) - Cobertura e roadmap de testes
- 🔧 [Setup de Testes](./TESTING_SETUP.md) - Configuração do ambiente de testes

---

## ✅ Progresso de Desenvolvimento

### Fases Concluídas ✅

- ✅ **Fase 1-7**: Fundação completa
  - Setup inicial, design system, autenticação, navegação, CRUD
- ✅ **Fase 8**: Sincronização
  - Push/pull bidirecional, resolução de conflitos, auto-sync
- ✅ **Fase 9**: Dashboard e Gráficos
  - Estatísticas, gráficos de evolução, métricas
- ✅ **Fase 10**: Polish e UX
  - Toast, haptics, skeletons, splash screen
- ✅ **Fase 11**: Otimização e Performance
  - FlashList, memoização, error boundaries, retry logic

### Próximas Fases 🚧

- ✅ **Fase 12**: Testes e QA (75% Completo)
  - ✅ 396 testes automatizados
  - ✅ Cobertura de 75% do código
  - ⏳ Testes E2E pendentes
- ⏳ **Fase 13**: Build e Deployment
  - Publicação nas stores (iOS + Android)
- ⏳ **Fase 14**: Features Futuras
  - Biblioteca de exercícios, templates, exportação de dados

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja o [Guia de Contribuição](./CONTRIBUTING.md) para mais detalhes.

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

## 📞 Suporte

- 📖 Consulte a [Documentação](./DOCUMENTATION.md)
- 🐛 Reporte bugs abrindo uma [issue](../../issues)
- 💡 Sugira features através de [issues](../../issues)
- 📧 Entre em contato com o time de desenvolvimento

---

## 🙏 Agradecimentos

- [Expo](https://expo.dev) - Plataforma incrível para React Native
- [Supabase](https://supabase.com) - Backend as a Service open source
- [React Native Community](https://reactnative.dev) - Ecossistema vibrante

---

<div align="center">

**Versão:** 1.0.0  
**Status:** Em desenvolvimento 🚧

---

Feito com 💜 para atletas e entusiastas do fitness

[⬆ Voltar ao topo](#-rx-training-app)

</div>
