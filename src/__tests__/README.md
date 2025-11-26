# 🧪 Guia de Testes - RX Training App

## 📋 Índice

- [Introdução](#introdução)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Executando Testes](#executando-testes)
- [Tipos de Testes](#tipos-de-testes)
- [Escrevendo Testes](#escrevendo-testes)
- [Mocks e Fixtures](#mocks-e-fixtures)
- [Boas Práticas](#boas-práticas)

---

## Introdução

Este projeto utiliza **Jest** como framework de testes e **Testing Library** para testar componentes React Native.

### Tecnologias

- **Jest** - Framework de testes
- **@testing-library/react-native** - Para testar componentes
- **@testing-library/react-hooks** - Para testar hooks customizados

### Cobertura Mínima

- Services críticos: **80%+**
- Utilities: **90%+**
- Components: **60%+**
- Global: **70%+**

---

## Estrutura de Pastas

```
src/
├── __tests__/              # Testes gerais e configuração
│   ├── mocks/              # Mocks globais
│   │   ├── fileMock.js     # Mock para assets
│   │   ├── supabase.mock.ts
│   │   └── sqlite.mock.ts
│   ├── fixtures/           # Dados de teste
│   │   └── testData.ts     # Mock data reutilizáveis
│   ├── integration/        # Testes de integração
│   └── utils/              # Utilities para testes
│
├── components/__tests__/   # Testes de componentes
├── services/               # Cada service tem sua pasta __tests__
│   ├── auth/__tests__/
│   ├── database/__tests__/
│   ├── stats/__tests__/
│   └── sync/__tests__/
├── utils/__tests__/        # Testes de utilities
├── schemas/__tests__/      # Testes de schemas Zod
└── stores/__tests__/       # Testes de stores Zustand
```

---

## Executando Testes

### Comandos Disponíveis

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch (re-run on changes)
npm run test:watch

# Executar testes com relatório de cobertura
npm run test:coverage

# Executar apenas testes unitários
npm run test:unit

# Executar apenas testes de integração
npm run test:integration

# Executar testes com output detalhado
npm run test:verbose

# Limpar cache do Jest
npm run test:clear
```

### Executar Testes Específicos

```bash
# Executar um arquivo específico
npm test -- path/to/test.test.ts

# Executar testes que contenham um padrão no nome
npm test -- --testPathPatterns=DatabaseService

# Executar testes com um describe/it específico
npm test -- -t "should create periodization"
```

---

## Tipos de Testes

### 1. Testes Unitários

Testam funções, métodos e componentes isoladamente.

**Exemplo:**

```typescript
describe('sum', () => {
  it('should add two numbers', () => {
    expect(sum(2, 3)).toBe(5);
  });
});
```

### 2. Testes de Integração

Testam a interação entre múltiplos módulos.

**Exemplo:**

```typescript
describe('Auth Flow', () => {
  it('should login and store session', async () => {
    const user = await authService.signIn(email, password);
    const session = await storageService.getSession();
    expect(session).toBeDefined();
  });
});
```

### 3. Testes de Componentes

Testam a renderização e interação de componentes React Native.

**Exemplo:**

```typescript
import { render, fireEvent } from '@testing-library/react-native';

describe('Button', () => {
  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Click" onPress={onPress} />);
    
    fireEvent.press(getByText('Click'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

---

## Escrevendo Testes

### Estrutura Básica

```typescript
describe('Feature/Component Name', () => {
  // Setup antes de cada teste
  beforeEach(() => {
    // Inicialização
  });

  // Cleanup após cada teste
  afterEach(() => {
    // Limpeza
  });

  describe('specific functionality', () => {
    it('should do something specific', () => {
      // Arrange - preparar dados
      const input = 'test';
      
      // Act - executar ação
      const result = myFunction(input);
      
      // Assert - verificar resultado
      expect(result).toBe('expected');
    });
  });
});
```

### Testando Funções Async

```typescript
it('should fetch data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});

// Ou usando resolves/rejects
it('should fetch data', () => {
  return expect(fetchData()).resolves.toBeDefined();
});

it('should throw error', () => {
  return expect(badFunction()).rejects.toThrow('Error message');
});
```

### Testando com Mocks

```typescript
import { mockSupabase } from '../__tests__/mocks/supabase.mock';

describe('AuthService', () => {
  it('should sign in user', async () => {
    // Mock já está configurado globalmente
    const user = await authService.signIn('test@test.com', 'password');
    
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled();
    expect(user).toBeDefined();
  });
});
```

---

## Mocks e Fixtures

### Usando Fixtures (Dados de Teste)

```typescript
import { mockUser, mockPeriodization, createMockSession } from '../__tests__/fixtures/testData';

it('should process periodization', () => {
  const result = processData(mockPeriodization);
  expect(result).toBeDefined();
});

// Criar dados customizados
it('should handle custom session', () => {
  const session = createMockSession({ 
    name: 'Custom Session',
    status: 'completed' 
  });
  
  expect(session.name).toBe('Custom Session');
});
```

### Criando Mocks Customizados

```typescript
// Mock de um módulo específico
jest.mock('../../services/database', () => ({
  databaseService: {
    getPeriodizationById: jest.fn().mockResolvedValue(mockPeriodization),
  },
}));
```

---

## Boas Práticas

### ✅ DO

- **Teste comportamento, não implementação**
- **Use nomes descritivos** para describes e its
- **Siga o padrão AAA** (Arrange, Act, Assert)
- **Mantenha testes isolados** - cada teste deve ser independente
- **Use factory functions** para criar dados de teste
- **Limpe mocks entre testes** (jest.clearAllMocks())
- **Teste edge cases** (null, undefined, empty arrays, etc)

### ❌ DON'T

- **Não teste detalhes de implementação**
- **Não compartilhe estado entre testes**
- **Não faça testes muito longos** (split em múltiplos its)
- **Não ignore testes falhando** (fix or remove)
- **Não use dados reais** de produção
- **Não teste bibliotecas de terceiros**

---

## Exemplos Práticos

### Testando um Service

```typescript
import { DatabaseService } from '../DatabaseService';
import { mockPeriodization } from '../../__tests__/fixtures/testData';

describe('DatabaseService', () => {
  let service: DatabaseService;

  beforeEach(async () => {
    service = DatabaseService.getInstance();
    await service.init();
  });

  afterEach(async () => {
    await service.close();
  });

  describe('createPeriodization', () => {
    it('should create a new periodization', async () => {
      const result = await service.createPeriodization(mockPeriodization);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(mockPeriodization.id);
      expect(result.needsSync).toBe(true);
    });

    it('should throw error with invalid data', async () => {
      const invalid = { ...mockPeriodization, name: '' };
      
      await expect(
        service.createPeriodization(invalid)
      ).rejects.toThrow();
    });
  });
});
```

### Testando um Hook

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '../useAuth';

describe('useAuth', () => {
  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('should login user', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.signIn('test@test.com', 'password');
    });
    
    expect(result.current.user).toBeDefined();
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

---

## Troubleshooting

### Problema: "Cannot find module"

```bash
# Limpar cache do Jest
npm run test:clear

# Reinstalar node_modules
rm -rf node_modules && npm install
```

### Problema: "Timeout"

```typescript
// Aumentar timeout para testes específicos
it('should handle long operation', async () => {
  // Teste aqui
}, 10000); // 10 segundos
```

### Problema: "Memory leak"

```typescript
// Garantir que resources são liberados
afterEach(() => {
  jest.clearAllMocks();
  // Cleanup manual se necessário
});
```

---

## Próximos Passos

1. ✅ Setup básico completo
2. 🔄 Implementar testes para utilities
3. 🔄 Implementar testes para schemas
4. 🔄 Implementar testes para DatabaseService
5. ⏳ Implementar testes para outros services
6. ⏳ Implementar testes de componentes
7. ⏳ Implementar testes de integração

---

## Recursos Úteis

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library React Native](https://callstack.github.io/react-native-testing-library/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Jest Matchers](https://jestjs.io/docs/expect)

