import { supabase } from '../supabase/client';
import type { User } from '../../models';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SESSION_KEY = 'rx_training_session';

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // ==============================================
  // AUTHENTICATION
  // ==============================================

  public async signUp(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Sign up failed');

    await this.saveSession(data.session);

    return {
      id: data.user.id,
      email: data.user.email!,
      createdAt: new Date(data.user.created_at),
      updatedAt: new Date(data.user.updated_at || data.user.created_at),
    };
  }

  public async signIn(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Sign in failed');

    await this.saveSession(data.session);

    return {
      id: data.user.id,
      email: data.user.email!,
      createdAt: new Date(data.user.created_at),
      updatedAt: new Date(data.user.updated_at || data.user.created_at),
    };
  }

  public async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    await this.clearSession();
  }

  public async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'rxtraining://reset-password',
    });

    if (error) throw error;
  }

  public async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  }

  // ==============================================
  // SESSION MANAGEMENT
  // ==============================================

  public async getCurrentUser(): Promise<User | null> {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) return null;

    return {
      id: data.user.id,
      email: data.user.email!,
      createdAt: new Date(data.user.created_at),
      updatedAt: new Date(data.user.updated_at || data.user.created_at),
    };
  }

  public async getSession(): Promise<any> {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  public async restoreSession(): Promise<User | null> {
    try {
      // Try to get from secure storage
      const sessionJson = await this.getStoredSession();
      
      if (!sessionJson) {
        console.log('No stored session found');
        return null;
      }

      const session = JSON.parse(sessionJson);
      
      // Set the session in Supabase with timeout
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          console.log('⚠️ Session restore timeout');
          resolve(null);
        }, 5000); // 5 seconds timeout
      });

      const sessionPromise = supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      const result = await Promise.race([sessionPromise, timeoutPromise]);

      if (!result || result === null) {
        await this.clearSession();
        return null;
      }

      const { data, error } = result;

      if (error || !data.user) {
        await this.clearSession();
        return null;
      }

      return {
        id: data.user.id,
        email: data.user.email!,
        createdAt: new Date(data.user.created_at),
        updatedAt: new Date(data.user.updated_at || data.user.created_at),
      };
    } catch (error) {
      console.error('Error restoring session:', error);
      await this.clearSession();
      return null;
    }
  }

  // ==============================================
  // STORAGE HELPERS
  // ==============================================

  private async saveSession(session: any): Promise<void> {
    if (!session) return;

    try {
      const sessionJson = JSON.stringify(session);
      
      if (Platform.OS === 'web') {
        localStorage.setItem(SESSION_KEY, sessionJson);
      } else {
        await SecureStore.setItemAsync(SESSION_KEY, sessionJson);
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  private async getStoredSession(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(SESSION_KEY);
      } else {
        return await SecureStore.getItemAsync(SESSION_KEY);
      }
    } catch (error) {
      console.error('Error getting stored session:', error);
      return null;
    }
  }

  private async clearSession(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(SESSION_KEY);
      } else {
        await SecureStore.deleteItemAsync(SESSION_KEY);
      }
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  // ==============================================
  // AUTH STATE LISTENER
  // ==============================================

  public onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await this.saveSession(session);
        callback({
          id: session.user.id,
          email: session.user.email!,
          createdAt: new Date(session.user.created_at),
          updatedAt: new Date(session.user.updated_at || session.user.created_at),
        });
      } else {
        await this.clearSession();
        callback(null);
      }
    });
  }
}

export const authService = AuthService.getInstance();

