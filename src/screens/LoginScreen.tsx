import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors, SPACING, TYPOGRAPHY } from '../constants/theme';
import { toast } from '../services/toast';

interface LoginScreenProps {
  onSwitchToSignUp: () => void;
}

export function LoginScreen({ onSwitchToSignUp }: LoginScreenProps) {
  const { signIn, isLoading, error, clearError } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.warning('Por favor, preencha todos os campos');
      return;
    }

    try {
      clearError();
      await signIn(email, password);
      toast.success('Login realizado com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha no login');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons name="barbell" size={64} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text.primary }]}>RX Training</Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Faça login para continuar
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={colors.text.tertiary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text.primary, borderColor: colors.border, backgroundColor: colors.background.secondary }]}
              placeholder="Email"
              placeholderTextColor={colors.text.tertiary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.text.tertiary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text.primary, borderColor: colors.border, backgroundColor: colors.background.secondary }]}
              placeholder="Senha"
              placeholderTextColor={colors.text.tertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.background.primary} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.background.primary }]}>
                Entrar
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={onSwitchToSignUp}
          >
            <Text style={[styles.switchText, { color: colors.text.secondary }]}>
              Não tem uma conta?{' '}
              <Text style={[styles.switchTextBold, { color: colors.primary }]}>
                Cadastre-se
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.size['3xl'],
    fontWeight: TYPOGRAPHY.weight.bold as any,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.size.base,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  inputIcon: {
    position: 'absolute',
    left: SPACING.md,
    top: 18,
    zIndex: 1,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 48,
    paddingRight: SPACING.md,
    fontSize: TYPOGRAPHY.size.base,
  },
  eyeIcon: {
    position: 'absolute',
    right: SPACING.md,
    top: 18,
    zIndex: 1,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
  },
  switchButton: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  switchText: {
    fontSize: TYPOGRAPHY.size.base,
  },
  switchTextBold: {
    fontWeight: TYPOGRAPHY.weight.semibold as any,
  },
});
