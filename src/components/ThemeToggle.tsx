import React from 'react';
import { TouchableOpacity, View, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, SPACING } from '../constants/theme';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[
        styles.container,
        {
          backgroundColor: colors.background.tertiary,
          borderColor: colors.border,
        },
      ]}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer,
        !isDark && styles.activeIcon,
        !isDark && { backgroundColor: colors.primary },
      ]}>
        <Ionicons
          name="sunny"
          size={18}
          color={isDark ? colors.text.tertiary : colors.background.primary}
        />
      </View>

      <View style={[
        styles.iconContainer,
        isDark && styles.activeIcon,
        isDark && { backgroundColor: colors.primary },
      ]}>
        <Ionicons
          name="moon"
          size={18}
          color={isDark ? colors.background.primary : colors.text.tertiary}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    gap: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  },
  activeIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

