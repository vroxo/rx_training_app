import React, { useState } from 'react';
import { LoginScreen, SignUpScreen } from '../screens';

export function AuthStackNavigator() {
  const [showSignUp, setShowSignUp] = useState(false);

  if (showSignUp) {
    return <SignUpScreen onSwitchToLogin={() => setShowSignUp(false)} />;
  }
  
  return <LoginScreen onSwitchToSignUp={() => setShowSignUp(true)} />;
}

