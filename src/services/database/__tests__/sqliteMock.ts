/**
 * In-memory SQLite mock for DatabaseService tests
 * Simulates a real SQLite database using JavaScript data structures
 */

interface TableData {
  [tableName: string]: any[];
}

export class MockSQLiteDatabase {
  private tables: TableData = {
    periodizations: [],
    sessions: [],
    exercises: [],
    sets: [],
    sync_queue: [],
  };

  async execAsync(sql: string): Promise<void> {
    // Handle CREATE TABLE statements
    if (sql.includes('CREATE TABLE')) {
      // Tables are already initialized
      return;
    }
    
    // Handle ALTER TABLE (migrations)
    if (sql.includes('ALTER TABLE')) {
      // Ignore for mock - columns are already "available"
      return;
    }
    
    // Handle CREATE INDEX
    if (sql.includes('CREATE INDEX')) {
      // Ignore for mock
      return;
    }
  }

  async runAsync(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowId: number }> {
    // Handle INSERT
    if (sql.includes('INSERT INTO')) {
      const match = sql.match(/INSERT INTO (\w+)/);
      if (match) {
        const tableName = match[1];
        const columns = sql.match(/\((.*?)\)/)?.[1].split(',').map(c => c.trim());
        
        if (columns) {
          const record: any = {};
          columns.forEach((col, index) => {
            record[col] = params[index];
          });
          this.tables[tableName].push(record);
        }
      }
      return { changes: 1, lastInsertRowId: 1 };
    }

    // Handle UPDATE
    if (sql.includes('UPDATE')) {
      const match = sql.match(/UPDATE (\w+)/);
      if (match) {
        const tableName = match[1];
        const idParam = params[params.length - 1]; // Last param is usually the ID
        
        const recordIndex = this.tables[tableName].findIndex(r => r.id === idParam);
        if (recordIndex >= 0) {
          // Parse SET clause
          const setClause = sql.match(/SET (.+?) WHERE/)?.[1];
          if (setClause) {
            const updates = setClause.split(',');
            let paramIndex = 0;
            
            updates.forEach(update => {
              const column = update.trim().split('=')[0].trim();
              this.tables[tableName][recordIndex][column] = params[paramIndex];
              paramIndex++;
            });
          }
        }
      }
      return { changes: 1, lastInsertRowId: 1 };
    }

    return { changes: 0, lastInsertRowId: 0 };
  }

  async getAllAsync<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const match = sql.match(/FROM (\w+)/);
    if (!match) return [];

    const tableName = match[1];
    let records = this.tables[tableName] || [];

    // Handle WHERE user_id = ?
    if (sql.includes('user_id = ?')) {
      const userId = params[0];
      records = records.filter(r => r.user_id === userId);
    }

    // Handle WHERE id = ?
    if (sql.includes('WHERE id = ?')) {
      const id = params[0];
      records = records.filter(r => r.id === id);
    }

    // Handle WHERE deleted_at IS NULL
    if (sql.includes('deleted_at IS NULL')) {
      records = records.filter(r => !r.deleted_at);
    }

    // Handle ORDER BY created_at DESC
    if (sql.includes('ORDER BY created_at DESC')) {
      records = [...records].sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
    }

    // Handle ORDER BY order_index ASC
    if (sql.includes('ORDER BY order_index ASC')) {
      records = [...records].sort((a, b) => {
        return (a.order_index || 0) - (b.order_index || 0);
      });
    }

    return records as T[];
  }

  async getFirstAsync<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const results = await this.getAllAsync<T>(sql, params);
    return results[0] || null;
  }

  async closeAsync(): Promise<void> {
    // Reset tables
    this.tables = {
      periodizations: [],
      sessions: [],
      exercises: [],
      sets: [],
      sync_queue: [],
    };
  }

  // Helper to reset database between tests
  reset(): void {
    this.tables = {
      periodizations: [],
      sessions: [],
      exercises: [],
      sets: [],
      sync_queue: [],
    };
  }
}

// Create a shared instance for tests
export const mockSQLiteDatabase = new MockSQLiteDatabase();

// Mock the expo-sqlite module for tests
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue(mockSQLiteDatabase),
}));

