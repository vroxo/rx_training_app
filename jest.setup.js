// Setup for Jest tests
// Note: @testing-library/react-native now includes matchers by default

// Mock expo modules
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// AsyncStorage mock with actual implementation
jest.mock('@react-native-async-storage/async-storage', () => {
  const mockStorage = new Map();
  
  return {
    __esModule: true,
    default: {
      setItem: async (key, value) => {
        mockStorage.set(key, value);
      },
      getItem: async (key) => {
        const value = mockStorage.get(key);
        return value !== undefined ? value : null;
      },
      removeItem: async (key) => {
        mockStorage.delete(key);
      },
      clear: async () => {
        mockStorage.clear();
      },
      getAllKeys: async () => {
        return Array.from(mockStorage.keys());
      },
    },
  };
});

// Mock SQLite with in-memory database
// Note: expo-sqlite mock is defined in individual test files as needed

// Mock React Native Toast
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
  addEventListener: jest.fn(() => jest.fn()),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

// Suppress console warnings during tests (optional)
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Set up timezone for consistent date testing
process.env.TZ = 'UTC';

