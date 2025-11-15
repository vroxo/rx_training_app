# 💪 RX Training App

> Aplicativo mobile-first para periodização de treino e acompanhamento de evolução

## 📱 Sobre o Projeto

RX Training App é um aplicativo React Native desenvolvido com Expo que permite aos usuários gerenciar periodizações de treino, registrar sessões, exercícios e séries, além de acompanhar sua evolução através de gráficos e estatísticas.

## 🚀 Tecnologias

- **React Native** + **Expo** - Framework mobile
- **TypeScript** - Tipagem estática
- **Supabase** - Backend (Auth + PostgreSQL + Realtime)
- **AsyncStorage** - Armazenamento local (offline-first, web-compatible)
- **Zustand** - Gerenciamento de estado
- **React Navigation** - Navegação
- **React Hook Form** + **Zod** - Formulários e validação
- **date-fns** - Manipulação de datas

## 📋 Funcionalidades

- ✅ Autenticação de usuários
- ✅ Gerenciamento de periodizações
- ✅ Registro de sessões de treino
- ✅ Cadastro de exercícios e séries
- ✅ Acompanhamento de evolução (gráficos)
- ✅ Funcionamento offline completo
- ✅ Sincronização automática com cloud

## 🛠️ Setup do Projeto

### Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- Conta no Supabase (para backend)

### Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd rx_training_app
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` e preencha com suas credenciais do Supabase:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_APP_ENV=development
```

4. Inicie o projeto:
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

Ou use o **Expo Go** app no seu smartphone e escaneie o QR code.

## 📁 Estrutura do Projeto

```
rx_training_app/
├── src/
│   ├── models/          # Interfaces TypeScript
│   ├── presenters/      # Lógica de negócio (MPP)
│   ├── views/
│   │   ├── screens/     # Telas do app
│   │   └── components/  # Componentes reutilizáveis
│   ├── services/
│   │   ├── database/    # SQLite local
│   │   ├── supabase/    # Cliente Supabase
│   │   └── sync/        # Lógica de sincronização
│   ├── hooks/           # Custom hooks
│   ├── utils/           # Funções utilitárias
│   ├── constants/       # Constantes (cores, spacing, etc)
│   ├── types/           # Tipos TypeScript
│   └── navigation/      # Configuração de navegação
├── assets/              # Imagens, ícones, fontes
├── App.tsx              # Entry point
└── package.json
```

## 🏗️ Arquitetura

O projeto segue o padrão **MPP (Model-Presenter-Pattern)**:

- **Models**: Definem a estrutura de dados
- **Presenters**: Contêm a lógica de negócio
- **Views**: Componentes de UI (React Native)

### Estratégia Offline-First

- AsyncStorage é a fonte primária de dados (compatível com web e mobile)
- Todas as operações funcionam offline
- Sincronização bidirecional com Supabase quando online
- Resolução de conflitos (last-write-wins)
- Campo `needsSync` marca dados que precisam ser sincronizados
- Campo `syncedAt` rastreia última sincronização

## 🎨 Design System

O app utiliza um design system customizado baseado em:
- Paleta de cores definida em `src/constants/colors.ts`
- Sistema de tipografia em `src/constants/typography.ts`
- Espaçamento consistente em `src/constants/spacing.ts`
- NativeWind para aplicar estilos com sintaxe Tailwind

## 📝 Scripts Disponíveis

```bash
npm start          # Inicia o Metro bundler
npm run android    # Roda no Android
npm run ios        # Roda no iOS
npm run web        # Roda no navegador
npm run lint       # Executa ESLint
npm run format     # Formata código com Prettier
```

## 🔐 Configuração do Supabase

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a URL e Anon Key do projeto

### 2. Executar Migrations SQL

Execute o schema SQL disponível em `IMPLEMENTATION_PLAN.md` (Fase 2.1) no SQL Editor do Supabase para criar as tabelas necessárias.

### 3. Configurar Row Level Security (RLS)

Execute as políticas RLS do `IMPLEMENTATION_PLAN.md` para garantir isolamento de dados por usuário.

## 🧪 Testes

```bash
npm test
```

## 📦 Build para Produção

### Android (APK/AAB)
```bash
eas build --platform android
```

### iOS (IPA)
```bash
eas build --platform ios
```

> Requer configuração do EAS (Expo Application Services)

## 📄 Licença

Este projeto é proprietário.

## 👥 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Em caso de dúvidas ou problemas, abra uma issue no repositório.

---

**Versão:** 1.0.0  
**Status:** Em desenvolvimento 🚧

---

## ✅ Progresso de Desenvolvimento

### Fase 1-7: Fundação ✅
- ✅ Setup inicial (Expo, TypeScript, ESLint, Prettier)
- ✅ Design system (cores, tipografia, espaçamento)
- ✅ Configuração Supabase
- ✅ Autenticação (login, cadastro, logout)
- ✅ Navegação (Auth + Main Tabs)
- ✅ Armazenamento local (AsyncStorage)
- ✅ CRUD completo (Periodizations, Sessions, Exercises, Sets)
- ✅ UI responsiva e moderna

### Fase 8: Sincronização ✅
- ✅ SyncService (push/pull bidirecional)
- ✅ Sincronização de todas as entidades
- ✅ Resolução de conflitos
- ✅ UI de sincronização manual
- ✅ Indicador de status online/offline
- ✅ Timestamp de última sincronização
- ✅ Sincronização automática configurável

### Fase 9: Dashboard e Gráficos ✅
- ✅ StatsService (cálculo de estatísticas)
- ✅ Dashboard completo com cards de resumo
- ✅ Gráfico de progressão de peso por exercício (Victory/Victory Native)
- ✅ Lista de sessões recentes
- ✅ Cálculo de sequência de dias consecutivos
- ✅ Pull-to-refresh para atualizar dados
- ✅ Loading e empty states
- ✅ Seletor cross-platform de exercícios

### Fase 10: Polish e UX ✅
- ✅ Toast Notifications (react-native-toast-message)
- ✅ Haptic Feedback (expo-haptics)
- ✅ Loading Skeleton components
- ✅ Splash Screen (expo-splash-screen)
- ✅ Feedback visual consistente em todo o app
- ✅ Feedback tátil automático em botões
- ⏸️ Animações básicas (cancelado - baixa prioridade)
- ⏸️ FAB (cancelado - não essencial)

### Fase 11: Otimização e Performance ✅
- ✅ FlashList para listas longas (@shopify/flash-list)
- ✅ Memoização de componentes (React.memo, useMemo, useCallback)
- ✅ Error Boundaries globais
- ✅ Retry logic no SyncService (3 tentativas com exponential backoff)
- ✅ Fallbacks graciosos para todos os erros
- ✅ Logging detalhado para debugging

### Próximas Fases 🚧
- ⏳ Fase 12: Testes e QA
- ⏳ Fase 13: Build e Deployment
- ⏳ Fase 14: Documentação
