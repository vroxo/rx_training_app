# 🤝 Guia de Contribuição

Obrigado por considerar contribuir para o RX Training App! Este documento fornece diretrizes para contribuir com o projeto.

## 📋 Índice

1. [Código de Conduta](#código-de-conduta)
2. [Como Posso Contribuir?](#como-posso-contribuir)
3. [Processo de Desenvolvimento](#processo-de-desenvolvimento)
4. [Padrões de Código](#padrões-de-código)
5. [Commits e Pull Requests](#commits-e-pull-requests)
6. [Reportando Bugs](#reportando-bugs)
7. [Sugerindo Features](#sugerindo-features)

---

## Código de Conduta

### Nossos Valores

- 🤝 **Respeito**: Trate todos com respeito e empatia
- 💡 **Colaboração**: Trabalhe junto, compartilhe conhecimento
- 🎯 **Qualidade**: Priorize código limpo e bem documentado
- 🚀 **Inovação**: Esteja aberto a novas ideias e soluções

### Comportamento Esperado

- Use linguagem acolhedora e inclusiva
- Seja respeitoso com diferentes pontos de vista
- Aceite críticas construtivas graciosamente
- Foque no que é melhor para a comunidade

### Comportamento Inaceitável

- Linguagem ou imagens sexualizadas
- Comentários depreciativos ou ataques pessoais
- Assédio público ou privado
- Publicar informações privadas de outros

---

## Como Posso Contribuir?

### 1. Reportando Bugs

Encontrou um bug? Ajude-nos reportando!

**Antes de reportar:**
- ✅ Verifique se já existe uma issue sobre o bug
- ✅ Teste na versão mais recente
- ✅ Colete informações relevantes (logs, screenshots)

**Como reportar:**
- Use o template de bug report
- Descreva o comportamento esperado vs. atual
- Inclua passos para reproduzir
- Adicione informações do ambiente (OS, versão do app)

### 2. Sugerindo Features

Tem uma ideia? Compartilhe!

**Antes de sugerir:**
- ✅ Verifique se já existe uma issue similar
- ✅ Considere se a feature se alinha com os objetivos do projeto

**Como sugerir:**
- Use o template de feature request
- Descreva o problema que a feature resolve
- Explique como você imagina a solução
- Considere alternativas

### 3. Contribuindo com Código

Quer programar? Ótimo!

**Processo:**
1. Faça fork do repositório
2. Crie uma branch para sua feature/fix
3. Implemente as mudanças
4. Escreva/atualize testes
5. Atualize documentação
6. Submeta um Pull Request

---

## Processo de Desenvolvimento

### Setup Inicial

```bash
# 1. Fork e clone o repositório
git clone https://github.com/seu-usuario/rx_training_app.git
cd rx_training_app

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# 4. Inicie o servidor de desenvolvimento
npm start
```

### Estrutura de Branches

- `main`: Branch principal (produção)
- `develop`: Branch de desenvolvimento
- `feature/nome-da-feature`: Novas features
- `bugfix/nome-do-bug`: Correções de bugs
- `hotfix/nome-do-hotfix`: Correções urgentes

### Workflow

```bash
# 1. Atualize sua branch local
git checkout develop
git pull origin develop

# 2. Crie uma nova branch
git checkout -b feature/minha-feature

# 3. Faça suas alterações
# ... código ...

# 4. Commit suas mudanças
git add .
git commit -m "feat: adiciona nova feature"

# 5. Push para seu fork
git push origin feature/minha-feature

# 6. Abra um Pull Request no GitHub
```

---

## Padrões de Código

### TypeScript

- ✅ **Strict Mode**: Sempre use TypeScript strict
- ✅ **Tipos Explícitos**: Evite `any`, use tipos específicos
- ✅ **Interfaces**: Prefira interfaces para objetos
- ✅ **Enums**: Use enums para conjuntos fixos de valores

```typescript
// ✅ Bom
interface User {
  id: string;
  name: string;
  email: string;
}

function createUser(data: User): Promise<User> {
  // ...
}

// ❌ Ruim
function createUser(data: any): any {
  // ...
}
```

### Componentes React

- ✅ **Functional Components**: Use arrow functions
- ✅ **Props Tipadas**: Sempre defina interface para props
- ✅ **Hooks**: Use hooks do React corretamente
- ✅ **Tamanho**: Máximo 300 linhas por componente

```typescript
// ✅ Bom
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ 
  title, 
  onPress, 
  variant = 'primary' 
}) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
};
```

### Nomenclatura

- **Arquivos**: PascalCase para componentes (`Button.tsx`), camelCase para utils (`formatDate.ts`)
- **Componentes**: PascalCase (`MyComponent`)
- **Funções**: camelCase (`getUserData`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Interfaces**: PascalCase com sufixo descritivo (`UserData`, `ButtonProps`)

### Organização de Imports

```typescript
// 1. Imports externos
import React, { useState } from 'react';
import { View, Text } from 'react-native';

// 2. Imports de serviços/hooks
import { useAuth } from '@/hooks/useAuth';
import { DatabaseService } from '@/services/database';

// 3. Imports de componentes
import { Button } from '@/components/Button';

// 4. Imports de tipos
import type { User } from '@/models/User';

// 5. Imports de estilos/constantes
import { colors } from '@/constants/colors';
```

### Boas Práticas

1. **Sem Duplicação**: Reutilize código sempre que possível
2. **Single Responsibility**: Cada função/componente deve ter uma única responsabilidade
3. **DRY (Don't Repeat Yourself)**: Evite repetição de código
4. **KISS (Keep It Simple, Stupid)**: Prefira soluções simples
5. **YAGNI (You Aren't Gonna Need It)**: Não implemente algo que não é necessário agora

### Tratamento de Erros

```typescript
// ✅ Bom
try {
  const data = await fetchData();
  return { success: true, data };
} catch (error) {
  console.error('Error fetching data:', error);
  ToastService.error('Erro ao buscar dados');
  return { success: false, error };
}

// ❌ Ruim
const data = await fetchData(); // Pode quebrar sem tratamento
```

### Performance

- ✅ Use `React.memo` para componentes que renderizam frequentemente
- ✅ Use `useMemo` e `useCallback` para otimizar cálculos e callbacks
- ✅ Use `FlashList` para listas longas ao invés de `FlatList`
- ✅ Evite renderizações desnecessárias

---

## Commits e Pull Requests

### Mensagens de Commit

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

**Tipos:**
- `feat`: Nova feature
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não afeta o código)
- `refactor`: Refatoração de código
- `perf`: Melhorias de performance
- `test`: Adição/correção de testes
- `chore`: Tarefas de manutenção

**Exemplos:**

```bash
feat(auth): adiciona autenticação com biometria
fix(sync): corrige bug de sincronização duplicada
docs(readme): atualiza instruções de instalação
refactor(database): melhora estrutura do DatabaseService
perf(lists): otimiza renderização de listas longas
```

### Pull Requests

**Checklist antes de submeter:**

- [ ] Código segue os padrões do projeto
- [ ] Testes passando (se aplicável)
- [ ] Documentação atualizada
- [ ] Sem conflitos com a branch de destino
- [ ] Commit messages seguem o padrão
- [ ] PR tem descrição clara do que foi feito

**Template de PR:**

```markdown
## Descrição
Breve descrição das mudanças

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Como Testar
Passos para testar as mudanças

## Screenshots (se aplicável)
Adicione screenshots

## Checklist
- [ ] Código testado localmente
- [ ] Documentação atualizada
- [ ] Linter passou sem erros
```

---

## Reportando Bugs

### Template de Bug Report

```markdown
**Descrição do Bug**
Descrição clara e concisa do bug.

**Como Reproduzir**
Passos para reproduzir:
1. Vá para '...'
2. Clique em '...'
3. Role até '...'
4. Veja o erro

**Comportamento Esperado**
Descrição do que deveria acontecer.

**Screenshots**
Se aplicável, adicione screenshots.

**Ambiente:**
 - OS: [ex: iOS 17.0, Android 14]
 - Versão do App: [ex: 1.0.0]
 - Device: [ex: iPhone 15, Pixel 8]

**Informações Adicionais**
Qualquer outra informação relevante.
```

---

## Sugerindo Features

### Template de Feature Request

```markdown
**Problema Relacionado**
Descrição clara do problema. Ex: "É frustrante quando [...]"

**Solução Proposta**
Descrição clara da solução que você gostaria.

**Alternativas Consideradas**
Descrição de alternativas que você considerou.

**Contexto Adicional**
Qualquer outro contexto ou screenshots sobre a feature.
```

---

## Testando

### Testes Unitários

```bash
npm test
```

### Testes E2E

```bash
# iOS
npm run test:e2e:ios

# Android
npm run test:e2e:android
```

### Linting

```bash
npm run lint
```

### Formatação

```bash
npm run format
```

---

## Dúvidas?

- 📖 Consulte a [Documentação](./DOCUMENTATION.md)
- 💬 Abra uma issue com sua dúvida
- 📧 Entre em contato com o time

---

## Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto.

---

**Obrigado por contribuir! 🎉**

Juntos, estamos construindo uma ferramenta incrível para atletas e entusiastas do fitness!

