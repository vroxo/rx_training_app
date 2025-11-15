# 🚀 Próximos Passos Práticos

## Guia de Implementação Passo a Passo

Este documento orienta sobre os passos práticos para começar a implementar o RX Training App.

---

## 📋 Fase 1: Setup Inicial do Projeto

### 1.1 Criar Projeto React Native com Expo

```bash
# Criar novo projeto com Expo
npx create-expo-app@latest rx-training-app --template blank-typescript

# Entrar no diretório
cd rx-training-app

# Instalar dependências adicionais
npx expo install react-native-reanimated react-native-gesture-handler react-native-screens react-native-safe-area-context
```

### 1.2 Instalar Dependências Core

```bash
# Navegação
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs @react-navigation/drawer

# Estado
npm install zustand immer

# Dados
npm install @tanstack/react-query expo-sqlite

# Formulários
npm install react-hook-form zod @hookform/resolvers

# UI e Styling
npm install nativewind tailwindcss clsx

# Gráficos
npm install victory-native react-native-svg

# Utilitários
npm install date-fns uuid lodash
npm install -D @types/uuid @types/lodash

# Desenvolvimento
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier
```

### 1.3 Configurar TypeScript (tsconfig.json)

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@models/*": ["src/models/*"],
      "@presenters/*": ["src/presenters/*"],
      "@views/*": ["src/views/*"],
      "@services/*": ["src/services/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"],
      "@constants/*": ["src/constants/*"],
      "@theme/*": ["src/theme/*"]
    }
  }
}
```

### 1.4 Configurar ESLint (.eslintrc.js)

```javascript
module.exports = {
  extends: [
    'expo',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
  },
};
```

### 1.5 Configurar Prettier (.prettierrc)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "avoid"
}
```

### 1.6 Criar Estrutura de Pastas

```bash
mkdir -p src/{models,presenters,views/{screens,components},services,hooks,utils,constants,theme,navigation}
mkdir -p src/views/screens/{Dashboard,Periodization,Session,Exercise}
mkdir -p src/views/components/{common,charts,forms}
mkdir -p src/services/{database,storage,analytics}
```

---

## 🎨 Fase 2: Design System

### 2.1 Criar Arquivo de Tema (src/theme/index.ts)

```typescript
// Copiar conteúdo de DESIGN_TOKENS.md
export const theme = {
  colors: { /* ... */ },
  typography: { /* ... */ },
  spacing: { /* ... */ },
  // ... resto do tema
};

export type Theme = typeof theme;
```

### 2.2 Criar ThemeProvider (src/theme/ThemeProvider.tsx)

```typescript
import React, { createContext, useContext, useState } from 'react';
import { theme } from './index';

type ThemeContextType = {
  theme: typeof theme;
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true); // Default dark

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

### 2.3 Criar Componentes Base

#### Button (src/views/components/common/Button.tsx)

```typescript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@theme/ThemeProvider';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled }: ButtonProps) {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' && { backgroundColor: theme.colors.purple[600] },
        variant === 'secondary' && styles.secondary,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.white} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#9333EA',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
```

#### Card (src/views/components/common/Card.tsx)

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@theme/ThemeProvider';

interface CardProps {
  children: React.ReactNode;
}

export function Card({ children }: CardProps) {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.card, { backgroundColor: theme.surface.dark.card }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3D3D3D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
});
```

---

## 💾 Fase 3: Database e Models

### 3.1 Setup SQLite (src/services/database/setup.ts)

```typescript
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('rx_training.db');

export const initDatabase = () => {
  db.transaction(tx => {
    // Periodization
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS periodizations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        goal TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      )`
    );

    // Sessions
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        periodization_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        scheduled_date TEXT,
        completed_date TEXT,
        duration INTEGER,
        status TEXT NOT NULL,
        notes TEXT,
        rating INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        FOREIGN KEY (periodization_id) REFERENCES periodizations(id)
      )`
    );

    // Exercises
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS exercises (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        name TEXT NOT NULL,
        muscle_group TEXT NOT NULL,
        equipment TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )`
    );

    // Sets
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS sets (
        id TEXT PRIMARY KEY,
        exercise_id TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        repetitions INTEGER NOT NULL,
        target_reps INTEGER,
        weight REAL NOT NULL,
        unit TEXT NOT NULL,
        technique TEXT,
        set_type TEXT,
        rest_time INTEGER NOT NULL,
        rir INTEGER,
        rpe INTEGER,
        tempo TEXT,
        notes TEXT,
        completed INTEGER NOT NULL,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id)
      )`
    );
  });
};

export { db };
```

### 3.2 Criar Models (src/models/index.ts)

```typescript
// Copiar interfaces de DATA_MODELS.md
export interface Periodization {
  // ...
}

export interface Session {
  // ...
}

export interface Exercise {
  // ...
}

export interface Set {
  // ...
}

export enum SetType {
  WARMUP = 'warmup',
  FEEDER = 'feeder',
  WORKSET = 'workset',
  BACKOFF = 'backoff',
}

// ... resto dos enums
```

### 3.3 Criar Repository Base (src/services/database/repository.ts)

```typescript
import { db } from './setup';

export class BaseRepository<T> {
  constructor(protected tableName: string) {}

  async findAll(): Promise<T[]> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM ${this.tableName} WHERE deleted_at IS NULL`,
          [],
          (_, { rows }) => resolve(rows._array),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async findById(id: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM ${this.tableName} WHERE id = ? AND deleted_at IS NULL`,
          [id],
          (_, { rows }) => resolve(rows._array[0] || null),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Implementar create, update, delete...
}
```

---

## 🧭 Fase 4: Navegação

### 4.1 Configurar Navegação (src/navigation/index.tsx)

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

// Importar screens (criar depois)
import { DashboardScreen } from '@views/screens/Dashboard/DashboardScreen';
import { PeriodizationListScreen } from '@views/screens/Periodization/PeriodizationListScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Periodizations" component={PeriodizationListScreen} />
      {/* Adicionar outras tabs */}
    </Tab.Navigator>
  );
}

export function AppNavigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        {/* Adicionar outras screens */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## 📱 Fase 5: Primeira Tela - Dashboard

### 5.1 Criar DashboardPresenter (src/presenters/DashboardPresenter.ts)

```typescript
import { useState, useEffect } from 'react';
import { SessionRepository } from '@services/database/SessionRepository';

export class DashboardPresenter {
  private sessionRepository: SessionRepository;

  constructor() {
    this.sessionRepository = new SessionRepository();
  }

  async getDashboardMetrics() {
    const sessions = await this.sessionRepository.findAll();
    
    return {
      totalSessions: sessions.length,
      totalVolume: this.calculateTotalVolume(sessions),
      // ... outras métricas
    };
  }

  private calculateTotalVolume(sessions: Session[]): number {
    // Implementar lógica
    return 0;
  }
}

// Hook para usar no componente
export function useDashboardPresenter() {
  const [presenter] = useState(() => new DashboardPresenter());
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    presenter.getDashboardMetrics().then(setMetrics);
  }, []);

  return { metrics };
}
```

### 5.2 Criar DashboardScreen (src/views/screens/Dashboard/DashboardScreen.tsx)

```typescript
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useDashboardPresenter } from '@presenters/DashboardPresenter';
import { Card } from '@views/components/common/Card';

export function DashboardScreen() {
  const { metrics } = useDashboardPresenter();

  if (!metrics) {
    return <Text>Loading...</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      
      <Card>
        <Text>Total Sessions: {metrics.totalSessions}</Text>
        <Text>Total Volume: {metrics.totalVolume}kg</Text>
      </Card>

      {/* Adicionar gráficos depois */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#0A0A0A',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
});
```

---

## 🔄 Fase 6: App.tsx Principal

### 6.1 Atualizar App.tsx

```typescript
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { AppNavigation } from './src/navigation';
import { initDatabase } from './src/services/database/setup';

export default function App() {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <ThemeProvider>
      <AppNavigation />
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
```

---

## ✅ Checklist de Implementação

### Sprint 1 - Setup
- [ ] Criar projeto Expo
- [ ] Instalar todas as dependências
- [ ] Configurar TypeScript, ESLint, Prettier
- [ ] Criar estrutura de pastas
- [ ] Implementar design system (theme)
- [ ] Criar componentes base (Button, Card, Input)
- [ ] Configurar navegação básica

### Sprint 2 - Database
- [ ] Setup SQLite
- [ ] Criar tabelas (migrations)
- [ ] Implementar models TypeScript
- [ ] Criar repositories
- [ ] Testar CRUD básico
- [ ] Criar seeders

### Sprint 3 - Telas Principais
- [ ] Dashboard Screen (básico)
- [ ] Periodization List Screen
- [ ] Periodization Detail Screen
- [ ] Session List Screen
- [ ] Session Detail Screen

### Sprint 4 - Registro de Treino
- [ ] Exercise Form
- [ ] Set Form
- [ ] Timer de descanso
- [ ] Validações
- [ ] Salvar dados completos

### Sprint 5 - Gráficos
- [ ] Implementar cálculo de max weight
- [ ] Criar componente de gráfico
- [ ] Integrar com dados reais
- [ ] Adicionar filtros
- [ ] Tooltips e interatividade

### Sprint 6 - Polish
- [ ] Animações
- [ ] Splash screen
- [ ] Ícones customizados
- [ ] Feedback visual
- [ ] Testes
- [ ] Build para produção

---

## 🎯 Comandos Úteis

```bash
# Iniciar desenvolvimento
npm start

# Limpar cache
npx expo start -c

# Rodar testes
npm test

# Verificar tipos TypeScript
npx tsc --noEmit

# Lint
npm run lint

# Build para produção
eas build --platform android
eas build --platform ios
```

---

## 📚 Recursos Úteis

- [React Native Docs](https://reactnative.dev)
- [Expo Docs](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [Victory Native](https://formidable.com/open-source/victory/docs/native)
- [Zustand](https://github.com/pmndrs/zustand)

---

**Boa sorte no desenvolvimento! 💜**

