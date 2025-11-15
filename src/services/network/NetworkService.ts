import NetInfo from '@react-native-community/netinfo';

export class NetworkService {
  private static instance: NetworkService;
  private isOnline = true;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  private constructor() {
    this.init();
  }

  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  private async init() {
    // Subscribe to network state changes
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // Notify listeners if state changed
      if (wasOnline !== this.isOnline) {
        console.log(`📡 Network status: ${this.isOnline ? 'ONLINE' : 'OFFLINE'}`);
        this.notifyListeners();
      }
    });

    // Get initial state
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  public subscribe(callback: (isOnline: boolean) => void): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.isOnline));
  }
}

export const networkService = NetworkService.getInstance();

