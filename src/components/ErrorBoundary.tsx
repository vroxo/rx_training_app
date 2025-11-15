import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, TYPOGRAPHY } from '../constants/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console (or send to error tracking service)
    console.error('❌ [ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <View style={styles.container}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.title}>Oops! Algo deu errado</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'Ocorreu um erro inesperado'}
          </Text>
          
          {__DEV__ && this.state.error?.stack && (
            <View style={styles.errorDetails}>
              <Text style={styles.errorTitle}>Detalhes do Erro (Dev):</Text>
              <Text style={styles.errorStack} numberOfLines={10}>
                {this.state.error.stack}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={this.handleReset}
          >
            <Ionicons name="refresh-outline" size={20} color="#FFF" style={{ marginRight: SPACING.xs }} />
            <Text style={styles.buttonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: TYPOGRAPHY.size['2xl'],
    fontWeight: TYPOGRAPHY.weight.bold as any,
    color: '#1F2937',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: TYPOGRAPHY.size.base,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  errorDetails: {
    backgroundColor: '#FEE2E2',
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
    width: '100%',
    maxWidth: 500,
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
    color: '#991B1B',
    marginBottom: SPACING.xs,
  },
  errorStack: {
    fontSize: TYPOGRAPHY.size.xs,
    color: '#7F1D1D',
    fontFamily: 'monospace',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
  },
});

