import Toast from 'react-native-toast-message';

export class ToastService {
  public static success(message: string, title?: string): void {
    Toast.show({
      type: 'success',
      text1: title || 'Sucesso',
      text2: message,
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 50,
    });
  }

  public static error(message: string, title?: string): void {
    Toast.show({
      type: 'error',
      text1: title || 'Erro',
      text2: message,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 50,
    });
  }

  public static warning(message: string, title?: string): void {
    Toast.show({
      type: 'info', // Using 'info' type styled as warning
      text1: title || 'Atenção',
      text2: message,
      position: 'top',
      visibilityTime: 3500,
      autoHide: true,
      topOffset: 50,
    });
  }

  public static info(message: string, title?: string): void {
    Toast.show({
      type: 'info',
      text1: title || 'Informação',
      text2: message,
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 50,
    });
  }

  public static hide(): void {
    Toast.hide();
  }
}

export const toast = ToastService;

