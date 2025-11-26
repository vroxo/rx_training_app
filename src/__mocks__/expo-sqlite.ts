/**
 * Manual mock for expo-sqlite
 * This file is automatically used by Jest when expo-sqlite is imported
 */

const mockTables: { [key: string]: any[] } = {
  periodizations: [],
  sessions: [],
  exercises: [],
  sets: [],
  sync_queue: [],
};

// Mock database implementation
const mockDatabase = {
  execAsync: async () => undefined,
  
  runAsync: async (sql: string, params: any[] = []) => {
    if (sql.includes('INSERT INTO')) {
      const tableName = sql.match(/INSERT INTO (\w+)/)?.[1];
      if (tableName) {
        const columnsMatch = sql.match(/\((.*?)\)\s*VALUES/);
        const columns = columnsMatch?.[1].split(',').map(c => c.trim()) || [];
        
        // Parse VALUES clause to find which columns have ? (placeholders)
        const valuesMatch = sql.match(/VALUES\s*\((.*?)\)/);
        const values = valuesMatch?.[1].split(',').map(v => v.trim()) || [];
        
        const record: any = {};
        let paramIndex = 0;
        columns.forEach((col, index) => {
          if (values[index] === '?') {
            record[col] = params[paramIndex];
            paramIndex++;
          } else {
            // Handle literal values (like "1" for needs_sync)
            const literalValue = values[index];
            if (literalValue && !isNaN(Number(literalValue))) {
              record[col] = Number(literalValue);
            } else if (literalValue === 'NULL' || literalValue === 'null') {
              record[col] = null;
            } else {
              record[col] = literalValue?.replace(/'/g, ''); // Remove quotes from string literals
            }
          }
        });
        
        if (!mockTables[tableName]) mockTables[tableName] = [];
        mockTables[tableName].push(record);
      }
    }
    
    if (sql.includes('UPDATE')) {
      const tableName = sql.match(/UPDATE (\w+)/)?.[1];
      if (tableName) {
        const idParam = params[params.length - 1];
        const records = mockTables[tableName] || [];
        const recordIndex = records.findIndex(r => r.id === idParam);
        if (recordIndex >= 0) {
          const setMatch = sql.match(/SET (.+?) WHERE/)?.[1];
          if (setMatch) {
            const updates = setMatch.split(',').map(u => u.trim());
            let paramIndex = 0;
            updates.forEach(update => {
              const [columnPart, valuePart] = update.split('=').map(s => s.trim());
              
              // Check if it's a placeholder (?) or literal value
              if (valuePart === '?') {
                records[recordIndex][columnPart] = params[paramIndex];
                paramIndex++;
              } else {
                // Handle literal values like "needs_sync = 1"
                if (!isNaN(Number(valuePart))) {
                  records[recordIndex][columnPart] = Number(valuePart);
                } else if (valuePart === 'NULL' || valuePart === 'null') {
                  records[recordIndex][columnPart] = null;
                } else {
                  records[recordIndex][columnPart] = valuePart.replace(/'/g, '');
                }
              }
            });
          }
        }
      }
    }
    
    return { changes: 1, lastInsertRowId: 1 };
  },
  
  getAllAsync: async (sql: string, params: any[] = []) => {
    const tableName = sql.match(/FROM (\w+)/)?.[1];
    if (!tableName) return [];

    let records = mockTables[tableName] || [];
    let paramIndex = 0;

    // Handle WHERE clauses in order they appear
    if (sql.includes('WHERE id = ?')) {
      records = records.filter(r => r.id === params[paramIndex]);
      paramIndex++;
    } else if (sql.includes('WHERE periodization_id = ?')) {
      records = records.filter(r => r.periodization_id === params[paramIndex]);
      paramIndex++;
    } else if (sql.includes('WHERE session_id = ?')) {
      records = records.filter(r => r.session_id === params[paramIndex]);
      paramIndex++;
    } else if (sql.includes('WHERE exercise_id = ?')) {
      records = records.filter(r => r.exercise_id === params[paramIndex]);
      paramIndex++;
    } else if (sql.includes('user_id = ?')) {
      records = records.filter(r => r.user_id === params[paramIndex]);
      paramIndex++;
    }
    
    // Handle AND clauses
    if (sql.includes('deleted_at IS NULL')) {
      records = records.filter(r => !r.deleted_at);
    }
    
    // Handle ORDER BY
    if (sql.includes('ORDER BY created_at DESC')) {
      records = [...records].sort((a, b) => {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
    }
    if (sql.includes('ORDER BY order_index ASC')) {
      records = [...records].sort((a, b) => {
        return (a.order_index || 0) - (b.order_index || 0);
      });
    }

    return records;
  },
  
  getFirstAsync: async (sql: string, params: any[] = []) => {
    const results = await mockDatabase.getAllAsync(sql, params);
    return results[0] || null;
  },
  
  closeAsync: async () => undefined,
};

// Create openDatabaseAsync function
export async function openDatabaseAsync(databaseName: string) {
  return mockDatabase;
}

// Export helper functions for testing
export const _resetMockTables = () => {
  Object.keys(mockTables).forEach(key => {
    mockTables[key] = [];
  });
};

// Export _mockTables and _mockDatabase for testing
export const _mockTables = mockTables;
export const _mockDatabase = mockDatabase;

// Export default object for namespace imports (import * as SQLite)
export default {
  openDatabaseAsync,
  _resetMockTables,
  _mockTables: mockTables,
  _mockDatabase: mockDatabase,
};

