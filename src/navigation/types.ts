import type { NavigatorScreenParams } from '@react-navigation/native';

// Root Stack Navigator
export type RootStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Periodizations: undefined;
  Profile: undefined;
};

// Auth Stack Navigator
export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

