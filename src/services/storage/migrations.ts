import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Exercise, Set } from '../../models';
import { storageService } from './index';

/**
 * Migra séries antigas sem orderIndex, adicionando o índice baseado na ordem atual
 */
export async function migrateSetOrderIndex() {
  try {
    console.log('🔄 [MIGRATION] Verificando séries sem orderIndex...');
    
    // Busca todos os exercícios direto do AsyncStorage
    const exercisesData = await AsyncStorage.getItem('@rx_training:exercises');
    if (!exercisesData) {
      console.log('✅ [MIGRATION] No exercises found');
      return 0;
    }
    
    const exercises: Exercise[] = JSON.parse(exercisesData);
    let fixed = 0;
    
    for (const exercise of exercises) {
      if (exercise.deletedAt) continue;
      
      const sets = await storageService.getSetsByExercise(exercise.id);
      
      for (let i = 0; i < sets.length; i++) {
        const set = sets[i];
        
        // Se o set não tem orderIndex, adiciona
        if (set.orderIndex === undefined || set.orderIndex === null) {
          await storageService.updateSet(set.id, {
            orderIndex: i,
            needsSync: true, // Marca para sincronizar com Supabase
          });
          fixed++;
          console.log(`✅ [MIGRATION] Fixed orderIndex for set ${set.id}: ${i}`);
        }
      }
    }
    
    if (fixed > 0) {
      console.log(`✅ [MIGRATION] Fixed ${fixed} sets without orderIndex`);
    } else {
      console.log('✅ [MIGRATION] All sets have orderIndex');
    }
    
    return fixed;
  } catch (error) {
    console.error('❌ [MIGRATION] Error migrating orderIndex:', error);
    throw error;
  }
}

