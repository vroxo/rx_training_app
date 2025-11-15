# Prompt para Criação do RX Training App

## 📋 Visão Geral do Projeto

Criar um aplicativo mobile-first de **periodização de treino** com versões web, Android e iOS usando React Native. O app permitirá aos usuários criar e gerenciar suas periodizações de treino, sessões, exercícios e séries, além de visualizar a evolução do desempenho através de dashboards intuitivos.

---

## 🎯 Requisitos Funcionais

### 1. Estrutura Hierárquica de Dados

#### 1.1 Periodização
- Criar, editar e excluir periodizações de treino
- Visualizar lista de periodizações
- Cada periodização contém N sessões de treinamento
- Definir período de duração (data início/fim)
- Nome e descrição da periodização

#### 1.2 Sessão de Treinamento
- Criar N sessões dentro de uma periodização
- Cada sessão contém N exercícios
- Nome da sessão (ex: "Treino A - Peito e Tríceps")
- Data/hora de execução da sessão
- Status da sessão (Planejada, Em Andamento, Concluída)
- Notas/observações da sessão

#### 1.3 Exercício
- Criar N exercícios dentro de uma sessão
- Nome do exercício (ex: "Supino Reto")
- Grupo muscular alvo
- Equipamento utilizado
- Notas/observações do exercício
- Cada exercício contém N séries

#### 1.4 Série (Set)
- Criar N séries para cada exercício
- Cada série possui:
  - **Número de repetições** (ex: 12 reps)
  - **Peso usado** (ex: 80kg)
  - **Técnica aplicada** (ex: "Drop set", "Rest-pause", "Cluster set", etc.)
  - **Tipo de série** (opcional):
    - Aquecimento (Warm-up)
    - Feeder Set
    - Work Set
    - Backoff Set
  - **Tempo de descanso** (em segundos ou formato MM:SS)
  - **RIR/RPE** (Reps in Reserve / Rate of Perceived Exertion) - opcional
  - **Ordem da série** (1ª, 2ª, 3ª, etc.)

---

## 📊 Dashboard e Analytics

### 2.1 Evolução de Carga por Exercício
- Gráfico de linha para cada exercício
- Eixo X: Sessões de treino (ordenadas por data)
- Eixo Y: Peso (kg)
- **Lógica de seleção de peso**: Para cada sessão, pegar a série com maior peso aplicado naquele exercício específico
- Possibilidade de filtrar por:
  - Período (últimos 7 dias, 30 dias, 3 meses, 6 meses, ano, personalizado)
  - Tipo de série (apenas Work Sets, apenas séries com técnicas específicas, etc.)

### 2.2 Métricas do Dashboard
- Volume total levantado na periodização (peso x reps x séries)
- Exercícios mais realizados
- Progressão média de carga
- Frequência de treino (sessões por semana)
- Tempo médio de descanso
- Distribuição de tipos de série
- Cards com estatísticas destacadas

### 2.3 Gráficos
- Gráfico de linha individual para cada exercício
- Possibilidade de comparar 2-3 exercícios no mesmo gráfico
- Zoom e navegação no gráfico
- Tooltips com detalhes ao tocar/hover nos pontos

---

## 🎨 Design e UX

### 3.1 Paleta de Cores
**Cores Principais:**
- **Roxo**: `#8B5CF6` (Primary), `#7C3AED` (Primary Dark), `#A78BFA` (Primary Light)
- **Preto**: `#0A0A0A` (Background), `#1F1F1F` (Surface), `#2D2D2D` (Card)
- **Branco**: `#FFFFFF` (Text Primary), `#E5E5E5` (Text Secondary), `#F5F5F5` (Disabled)

**Cores de Suporte:**
- Success: `#10B981`
- Warning: `#F59E0B`
- Error: `#EF4444`
- Info: `#3B82F6`

### 3.2 Princípios de Design
- **Minimalista**: Interfaces limpas, sem elementos desnecessários
- **Elegante**: Uso de sombras sutis, bordas arredondadas, transições suaves
- **Hierarquia Visual**: Clara distinção entre elementos primários, secundários e terciários
- **Espaçamento Generoso**: Respiração entre elementos (mínimo 16px)
- **Tipografia**: Fonte moderna (Inter, SF Pro, Roboto)
  - Títulos: 24-32px, Bold
  - Subtítulos: 18-20px, SemiBold
  - Corpo: 14-16px, Regular
  - Captions: 12px, Medium

### 3.3 Componentes de UI Principais

#### Cards
- Bordas arredondadas (12-16px)
- Sombra sutil (`shadow-lg`)
- Padding generoso (16-24px)
- Hover states com elevação

#### Botões
- Primary: Fundo roxo, texto branco
- Secondary: Borda roxa, texto roxo, fundo transparente
- Floating Action Button (FAB) para adicionar novos itens
- Estados: Normal, Hover, Active, Disabled

#### Inputs e Forms
- Inputs com borda sutil
- Labels flutuantes
- Validação em tempo real
- Feedback visual claro (erro/sucesso)

#### Gráficos
- Estilo minimalista
- Linhas suaves (curvas)
- Grid discreto
- Cores roxas para as linhas principais
- Tooltips informativos

### 3.4 Navegação
- Bottom Tab Navigation (Mobile)
  - Home/Dashboard
  - Periodizações
  - Sessões
  - Perfil/Configurações
- Stack Navigation para navegação hierárquica
- Drawer opcional para configurações avançadas (Web)

---

## 🏗️ Arquitetura e Padrões

### 4.1 Padrão MPP (Model-Presenter-Pattern)

#### Estrutura de Pastas
```
src/
├── models/
│   ├── Periodization.ts
│   ├── Session.ts
│   ├── Exercise.ts
│   ├── Set.ts
│   └── index.ts
├── presenters/
│   ├── PeriodizationPresenter.ts
│   ├── SessionPresenter.ts
│   ├── ExercisePresenter.ts
│   ├── DashboardPresenter.ts
│   └── index.ts
├── views/
│   ├── screens/
│   │   ├── Dashboard/
│   │   │   ├── DashboardScreen.tsx
│   │   │   └── components/
│   │   ├── Periodization/
│   │   │   ├── PeriodizationListScreen.tsx
│   │   │   ├── PeriodizationDetailScreen.tsx
│   │   │   └── components/
│   │   ├── Session/
│   │   │   ├── SessionListScreen.tsx
│   │   │   ├── SessionDetailScreen.tsx
│   │   │   └── components/
│   │   └── Exercise/
│   │       ├── ExerciseDetailScreen.tsx
│   │       └── components/
│   └── components/
│       ├── common/
│       ├── charts/
│       └── forms/
├── services/
│   ├── api/
│   ├── storage/
│   └── analytics/
├── hooks/
├── utils/
├── constants/
└── navigation/
```

#### Models (Camada de Dados)
```typescript
// Exemplo: models/Set.ts
export interface Set {
  id: string;
  exerciseId: string;
  order: number;
  repetitions: number;
  weight: number;
  technique?: string;
  setType?: 'warmup' | 'feeder' | 'workset' | 'backoff';
  restTime: number; // segundos
  rir?: number;
  rpe?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Presenters (Lógica de Negócio)
```typescript
// Exemplo: presenters/DashboardPresenter.ts
export class DashboardPresenter {
  // Lógica para processar dados e preparar para visualização
  getMaxWeightPerSession(exerciseId: string): ChartDataPoint[];
  calculateTotalVolume(periodizationId: string): number;
  getProgressionRate(exerciseId: string): number;
  // ... outras lógicas de negócio
}
```

#### Views (Interface do Usuário)
- Componentes React Native puros
- Recebem dados processados do Presenter
- Emitem eventos para o Presenter
- Não contêm lógica de negócio

### 4.2 Tecnologias e Bibliotecas

#### Core
- **React Native** (Latest stable)
- **TypeScript** (Strict mode)
- **Expo** (para desenvolvimento multiplataforma simplificado)

#### Estado e Dados
- **Zustand** ou **Jotai** (gerenciamento de estado leve)
- **React Query** ou **SWR** (cache e sincronização de dados)
- **SQLite** ou **WatermelonDB** (banco de dados local)
- **Async Storage** (dados simples)

#### Navegação
- **React Navigation v6+**
  - Stack Navigator
  - Bottom Tab Navigator
  - Drawer Navigator (opcional)

#### UI e Styling
- **NativeWind** (Tailwind CSS para React Native)
- **React Native Reanimated** (animações performáticas)
- **React Native Gesture Handler** (gestos)
- **React Native SVG** (ícones e gráficos)

#### Gráficos
- **Victory Native** ou **React Native Chart Kit**
- Alternativa: **Recharts** (web) + custom para mobile

#### Formulários
- **React Hook Form**
- **Zod** (validação de schemas)

#### Utilitários
- **date-fns** (manipulação de datas)
- **uuid** (geração de IDs)
- **lodash** (utilitários gerais)

#### Desenvolvimento
- **ESLint** + **Prettier** (formatação)
- **Husky** + **lint-staged** (pre-commit hooks)
- **Jest** + **React Native Testing Library** (testes)

---

## 🔄 Fluxos de Usuário Principais

### 5.1 Criar Nova Periodização
1. Usuário clica em "Nova Periodização"
2. Preenche formulário (nome, descrição, data início/fim)
3. Salva periodização
4. É redirecionado para tela de detalhes da periodização

### 5.2 Adicionar Sessão de Treino
1. Dentro da periodização, clica em "Nova Sessão"
2. Preenche nome, data e observações
3. Salva sessão
4. Pode adicionar exercícios imediatamente ou depois

### 5.3 Registrar Treino
1. Seleciona sessão planejada ou cria nova
2. Adiciona exercícios um por um
3. Para cada exercício:
   - Adiciona série
   - Preenche reps, peso, técnica, tipo
   - Define tempo de descanso
   - Salva série
   - Repete para próximas séries
4. Finaliza treino
5. Sessão marcada como concluída

### 5.4 Visualizar Evolução
1. Acessa Dashboard
2. Visualiza cards com métricas gerais
3. Rola para ver gráficos de exercícios
4. Toca em gráfico para ver detalhes
5. Pode filtrar por período

---

## 📱 Requisitos Técnicos

### 6.1 Performance
- Renderização de listas longas otimizada (FlatList, FlashList)
- Lazy loading de dados
- Cache inteligente
- Animações com native driver
- Bundle size otimizado

### 6.2 Offline-First
- App funcional sem conexão
- Sincronização em background quando online
- Indicador visual de status de sincronização
- Resolução de conflitos (last-write-wins ou manual)

### 6.3 Acessibilidade
- Labels descritivos
- Contraste adequado (WCAG AA)
- Suporte a screen readers
- Tamanho mínimo de toque (44x44px)
- Navegação por teclado (web)

### 6.4 Responsividade
- Mobile: 360px - 428px
- Tablet: 768px - 1024px
- Desktop: 1280px+
- Orientação portrait e landscape

---

## 🚀 Implementação Sugerida (Fases)

### Fase 1: Setup e Fundação (Sprint 1)
- Setup do projeto React Native com Expo
- Configuração TypeScript e linting
- Setup do banco de dados local
- Estrutura de pastas (MPP)
- Tema e design system
- Navegação básica

### Fase 2: Models e Data Layer (Sprint 2)
- Implementação dos models (Periodization, Session, Exercise, Set)
- Serviço de banco de dados
- CRUD básico
- Migrations
- Seeders para testes

### Fase 3: Telas de CRUD (Sprint 3-4)
- Telas de Periodização (List, Create, Detail, Edit)
- Telas de Sessão (List, Create, Detail, Edit)
- Telas de Exercício e Séries
- Formulários com validação
- Feedback visual

### Fase 4: Dashboard e Analytics (Sprint 5)
- Cálculo de métricas
- Implementação dos gráficos
- Cards de estatísticas
- Filtros de período
- Exportação de dados (opcional)

### Fase 5: Polish e Otimização (Sprint 6)
- Animações e transições
- Melhorias de UX
- Testes de performance
- Correção de bugs
- Documentação

---

## ✅ Critérios de Aceite

### Funcionalidade
- [ ] Usuário consegue criar periodizações, sessões, exercícios e séries
- [ ] Todas as séries salvam corretamente reps, peso, técnica, tipo e tempo de descanso
- [ ] Dashboard exibe corretamente a evolução de peso por exercício
- [ ] Gráficos são interativos e informativos
- [ ] App funciona offline

### Qualidade
- [ ] Código TypeScript sem erros
- [ ] Componentes seguem padrão MPP
- [ ] Não há duplicação de código
- [ ] Performance aceitável (60fps)
- [ ] Sem memory leaks

### Design
- [ ] Design minimalista e elegante
- [ ] Paleta de cores roxo/preto/branco aplicada consistentemente
- [ ] Responsivo em todos os tamanhos
- [ ] Animações suaves
- [ ] Acessível (WCAG AA)

---

## 📚 Referências de Design

### Inspirações Visuais
- Cards de atividade com métricas (Apple Fitness)
- Gráficos minimalistas (Calm, Headspace)
- Formulários limpos (Notion, Linear)
- Animações sutis (Stripe)

### Componentes Base (da busca de inspiração)
- Activity Cards com métricas circulares e progresso
- Workout Summary Cards com estatísticas detalhadas
- Cards de progresso com animações (Vo2 Max style)
- Listas de estatísticas com ícones e valores destacados

---

## 🎯 Próximos Passos Sugeridos

1. **Revisar e ajustar este prompt** conforme necessário
2. **Criar protótipo no Figma** (opcional mas recomendado)
3. **Setup inicial do projeto** com as tecnologias escolhidas
4. **Implementar design system** (cores, tipografia, componentes base)
5. **Desenvolver em sprints** seguindo as fases sugeridas
6. **Testes contínuos** em dispositivos reais
7. **Iteração baseada em feedback**

---

## 📝 Observações Finais

- Este é um projeto ambicioso com foco em qualidade e escalabilidade
- Priorize código limpo e bem documentado
- Escreva testes para lógicas críticas (cálculos de dashboard)
- Mantenha componentes pequenos e reutilizáveis
- Use TypeScript de forma rigorosa (evite `any`)
- Documente decisões arquiteturais importantes
- Considere internacionalização (i18n) desde o início se houver planos futuros

**Objetivo**: Criar um app profissional, escalável e fácil de manter que ajude atletas e praticantes de musculação a gerenciar suas periodizações de treino e acompanhar sua evolução de forma clara e motivadora.

