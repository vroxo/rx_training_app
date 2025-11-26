/**
 * Mock do cliente Supabase para testes
 */

export const createMockSupabaseClient = () => {
  const mockData: any[] = [];
  const mockError: any = null;

  return {
    auth: {
      signUp: jest.fn().mockResolvedValue({ 
        data: { 
          user: { 
            id: 'test-user-id', 
            email: 'test@example.com',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, 
          session: { 
            access_token: 'test-token',
            refresh_token: 'test-refresh-token',
          } 
        }, 
        error: null 
      }),
      
      signInWithPassword: jest.fn().mockResolvedValue({ 
        data: { 
          user: { 
            id: 'test-user-id', 
            email: 'test@example.com',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, 
          session: { 
            access_token: 'test-token',
            refresh_token: 'test-refresh-token',
          } 
        }, 
        error: null 
      }),
      
      signOut: jest.fn().mockResolvedValue({ error: null }),
      
      getUser: jest.fn().mockResolvedValue({ 
        data: { 
          user: { 
            id: 'test-user-id', 
            email: 'test@example.com',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } 
        }, 
        error: null 
      }),
      
      getSession: jest.fn().mockResolvedValue({ 
        data: { 
          session: { 
            access_token: 'test-token',
            refresh_token: 'test-refresh-token',
          } 
        }, 
        error: null 
      }),
      
      setSession: jest.fn().mockResolvedValue({ 
        data: { 
          user: { 
            id: 'test-user-id', 
            email: 'test@example.com',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, 
          session: { 
            access_token: 'test-token',
            refresh_token: 'test-refresh-token',
          } 
        }, 
        error: null 
      }),
      
      resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
      
      updateUser: jest.fn().mockResolvedValue({ 
        data: { user: { id: 'test-user-id', email: 'test@example.com' } }, 
        error: null 
      }),
      
      onAuthStateChange: jest.fn((callback) => {
        // Return unsubscribe function
        return { 
          data: { subscription: { unsubscribe: jest.fn() } }
        };
      }),
    },
    
    from: jest.fn((table: string) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockData[0] || null, error: mockError }),
      then: jest.fn((callback) => callback({ data: mockData, error: mockError })),
    })),
  };
};

// Export singleton instance
export const mockSupabase = createMockSupabaseClient();

// Mock do módulo supabase
jest.mock('../../services/supabase/client', () => ({
  supabase: mockSupabase,
}));

