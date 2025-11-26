/**
 * Mock do SQLite para testes
 * Simula um banco de dados em memória para testes
 */

export interface MockSQLiteDatabase {
  execAsync: jest.Mock;
  runAsync: jest.Mock;
  getAllAsync: jest.Mock;
  getFirstAsync: jest.Mock;
  closeAsync: jest.Mock;
}

export const createMockDatabase = (): MockSQLiteDatabase => {
  // In-memory storage para simular o banco
  const tables: Record<string, any[]> = {
    periodizations: [],
    sessions: [],
    exercises: [],
    sets: [],
  };

  return {
    execAsync: jest.fn().mockResolvedValue(undefined),
    
    runAsync: jest.fn().mockImplementation((sql: string, params?: any[]) => {
      // Simular INSERT básico
      if (sql.includes('INSERT INTO')) {
        const match = sql.match(/INSERT INTO (\w+)/);
        if (match) {
          const tableName = match[1];
          if (tables[tableName]) {
            const record = { id: params?.[0], ...params };
            tables[tableName].push(record);
          }
        }
      }
      
      // Simular UPDATE básico
      if (sql.includes('UPDATE')) {
        const match = sql.match(/UPDATE (\w+)/);
        if (match) {
          const tableName = match[1];
          // Implementação básica - pode ser expandida conforme necessário
        }
      }
      
      return Promise.resolve({ changes: 1, lastInsertRowId: 1 });
    }),
    
    getAllAsync: jest.fn().mockImplementation((sql: string, params?: any[]) => {
      // Simular SELECT * FROM table
      const match = sql.match(/FROM (\w+)/);
      if (match) {
        const tableName = match[1];
        return Promise.resolve(tables[tableName] || []);
      }
      return Promise.resolve([]);
    }),
    
    getFirstAsync: jest.fn().mockImplementation((sql: string, params?: any[]) => {
      const match = sql.match(/FROM (\w+)/);
      if (match) {
        const tableName = match[1];
        const records = tables[tableName] || [];
        return Promise.resolve(records[0] || null);
      }
      return Promise.resolve(null);
    }),
    
    closeAsync: jest.fn().mockResolvedValue(undefined),
  };
};

// Mock global do expo-sqlite
export const mockOpenDatabaseAsync = jest.fn(() => 
  Promise.resolve(createMockDatabase())
);

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: mockOpenDatabaseAsync,
}));

// Helper para resetar o banco entre testes
export const resetMockDatabase = () => {
  mockOpenDatabaseAsync.mockClear();
};

