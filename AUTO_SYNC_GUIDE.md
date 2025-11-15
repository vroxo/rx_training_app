# 🔄 Guia de Sincronização Automática

## 📋 Visão Geral

O RX Training App agora possui sincronização automática inteligente que:
- ✅ Funciona **apenas quando o usuário está logado**
- ✅ Respeita a **conexão de internet** (online/offline)
- ✅ É **totalmente configurável** pelo usuário
- ✅ **Persiste as configurações** entre sessões
- ✅ Mantém a **sincronização manual** disponível

---

## 🎯 Funcionalidades

### 1. **Sincronização Automática**
- Executa automaticamente em intervalos configuráveis
- Apenas quando o usuário está logado e online
- Pode ser ativada/desativada a qualquer momento

### 2. **Sincronização Manual**
- Sempre disponível no botão "🔄 Sincronizar Agora"
- Executa sincronização imediata
- Funciona independente da configuração de auto-sync

### 3. **Intervalos Configuráveis**
- 1 minuto (útil para testes)
- 5 minutos (padrão)
- 10 minutos
- 15 minutos
- 30 minutos
- 1 hora

---

## 🛠️ Arquitetura

### **1. SyncStore** (`src/stores/syncStore.ts`)
```typescript
interface SyncState {
  isSyncing: boolean;
  isOnline: boolean;
  lastSyncedAt: Date | null;
  error: string | null;
  autoSyncConfig: AutoSyncConfig;
  
  // Actions
  sync: (userId: string) => Promise<void>;
  setAutoSyncConfig: (config: AutoSyncConfig) => Promise<void>;
  loadAutoSyncConfig: () => Promise<void>;
}
```

**Responsabilidades:**
- Gerenciar estado da sincronização
- Armazenar configurações de auto-sync no AsyncStorage
- Executar sincronização (manual ou automática)

### **2. useAutoSync Hook** (`src/hooks/useAutoSync.ts`)
```typescript
export function useAutoSync() {
  const { user } = useAuth();
  const { sync, autoSyncConfig, isOnline } = useSyncStore();
  
  // Setup setInterval based on config
  // Only runs if user is logged in, auto-sync enabled, and online
}
```

**Responsabilidades:**
- Monitorar estado de login
- Criar/destruir intervalo de sincronização
- Executar sync automático

### **3. ProfileScreen** (`src/screens/ProfileScreen.tsx`)
```typescript
// UI para configurar auto-sync
- Switch (ativar/desativar)
- Botões de intervalo (1min, 5min, 10min, etc.)
- Botão de sincronização manual
```

**Responsabilidades:**
- Exibir configurações de auto-sync
- Permitir ativar/desativar
- Permitir escolher intervalo
- Botão de sincronização manual

---

## 🔍 Fluxo de Funcionamento

### **Inicialização**
```
1. App inicia
2. useAutoSync hook é chamado no AppNavigator
3. Hook carrega configurações salvas do AsyncStorage
4. Se user está logado + auto-sync ativado + online:
   → Cria setInterval com intervalo configurado
5. Caso contrário:
   → Aguarda condições serem satisfeitas
```

### **Sincronização Automática**
```
A cada X minutos (configurado):
1. Verifica se user está logado
2. Verifica se está online
3. Verifica se já não está sincronizando
4. Executa syncService.syncAll(userId)
5. Atualiza lastSyncedAt
```

### **Sincronização Manual**
```
Usuário clica em "🔄 Sincronizar Agora":
1. Executa sync(user.id)
2. Mostra loading
3. Atualiza lastSyncedAt
4. Exibe mensagem de sucesso/erro
```

### **Mudança de Configuração**
```
Usuário altera intervalo ou ativa/desativa:
1. Salva nova config no AsyncStorage
2. Atualiza estado do syncStore
3. useAutoSync detecta mudança (via useEffect)
4. Destrói intervalo antigo
5. Cria novo intervalo (se auto-sync ativado)
```

---

## 📝 Como Usar

### **Para Desenvolvedores**

#### **Ativar Auto-Sync Programaticamente**
```typescript
import { useSyncStore } from './stores/syncStore';

const { setAutoSyncConfig } = useSyncStore();

await setAutoSyncConfig({
  enabled: true,
  intervalMinutes: 5,
});
```

#### **Verificar Status**
```typescript
const { isSyncing, lastSyncedAt, autoSyncConfig } = useSyncStore();

console.log('Sincronizando?', isSyncing);
console.log('Última sync:', lastSyncedAt);
console.log('Auto-sync ativo?', autoSyncConfig.enabled);
console.log('Intervalo:', autoSyncConfig.intervalMinutes);
```

#### **Forçar Sincronização**
```typescript
import { useSync } from './hooks';

const { sync } = useSync();
await sync(userId);
```

### **Para Usuários**

1. **Abrir tela de Perfil**
2. **Encontrar seção "Sincronização Automática"**
3. **Ativar o switch**
4. **Escolher intervalo desejado**
5. **Pronto!** O app vai sincronizar automaticamente

**Sincronização Manual:**
- Sempre disponível na seção "Sincronização Manual"
- Clique em "🔄 Sincronizar Agora"

---

## 🧪 Testes

### **Testar Auto-Sync**
1. Faça login
2. Ative auto-sync com intervalo de 1 minuto
3. Crie uma periodização/sessão/exercício
4. Aguarde 1 minuto
5. Verifique os logs: `✅ [AUTO-SYNC] Sincronização automática concluída!`
6. Abra o Supabase Dashboard → Dados devem estar lá

### **Testar Desativação**
1. Desative auto-sync
2. Aguarde alguns minutos
3. Verifique que não há logs de auto-sync
4. Sincronização manual ainda deve funcionar

### **Testar Offline**
1. Ative auto-sync
2. Desconecte da internet
3. Auto-sync não deve executar
4. Reconecte
5. Auto-sync deve retomar

### **Testar Logout**
1. Ative auto-sync
2. Faça logout
3. Auto-sync deve parar
4. Faça login novamente
5. Auto-sync deve retomar (se configuração persistida)

---

## 🔧 Configurações Persistidas

As configurações são salvas no **AsyncStorage** com a chave:
```
@rx_training:auto_sync_config
```

**Formato:**
```json
{
  "enabled": true,
  "intervalMinutes": 5
}
```

**Persistência:**
- ✅ Sobrevive a reinicialização do app
- ✅ Sobrevive a logout/login
- ✅ É por usuário (não compartilhada)

---

## 📊 Logs

Os logs seguem o padrão:

```
⏰ Auto-sync ativado: a cada 5 minutos
🔄 [AUTO-SYNC] Iniciando sincronização automática...
✅ [AUTO-SYNC] Sincronização automática concluída!
```

ou

```
⏸️ Auto-sync desabilitado: {userLoggedIn: false, autoSyncEnabled: true, isOnline: true}
🛑 Auto-sync parado
```

---

## 🎯 Benefícios

1. **Experiência do Usuário**
   - Dados sempre atualizados
   - Menor chance de perda de dados
   - Sincronização transparente

2. **Controle Total**
   - Usuário decide se quer auto-sync
   - Usuário define a frequência
   - Sincronização manual sempre disponível

3. **Eficiência**
   - Só sincroniza quando necessário
   - Respeita status online/offline
   - Não gasta bateria quando offline

4. **Confiabilidade**
   - Configurações persistidas
   - Logs detalhados para debug
   - Tratamento de erros robusto

---

## 🚀 Próximos Passos

Possíveis melhorias futuras:
- [ ] Notificação quando sincronização falha
- [ ] Estatísticas de sincronização (quantas vezes sincronizou, dados transferidos)
- [ ] Sincronização inteligente (só quando há mudanças pendentes)
- [ ] Background sync (sincronizar mesmo com app em background)
- [ ] Sincronização seletiva (escolher quais entidades sincronizar)

---

**Versão:** 1.0.0  
**Data:** 13/11/2025  
**Fase:** 8 - Sincronização Completa ✅

