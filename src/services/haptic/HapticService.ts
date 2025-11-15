import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export class HapticService {
  /**
   * Light impact feedback for small UI interactions
   * (e.g., button press, toggle)
   */
  public static light(): void {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  /**
   * Medium impact feedback for standard interactions
   * (e.g., selection, navigation)
   */
  public static medium(): void {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }

  /**
   * Heavy impact feedback for significant actions
   * (e.g., delete, complete)
   */
  public static heavy(): void {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }

  /**
   * Success feedback for positive actions
   * (e.g., save, complete)
   */
  public static success(): void {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  /**
   * Warning feedback for caution actions
   * (e.g., delete confirmation)
   */
  public static warning(): void {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }

  /**
   * Error feedback for negative actions
   * (e.g., validation failed)
   */
  public static error(): void {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  /**
   * Selection feedback for picker/select interactions
   */
  public static selection(): void {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }
}

export const haptic = HapticService;

