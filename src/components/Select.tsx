import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Modal, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors, SPACING, TYPOGRAPHY } from '../constants/theme';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  error?: string;
}

/**
 * Componente Select/Picker cross-platform
 * Usa <select> nativo na web e Modal custom no mobile
 */
export function Select({
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  error,
}: SelectProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [modalVisible, setModalVisible] = useState(false);

  const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={[styles.label, { color: colors.text.primary }]}>{label}</Text>
        <View 
          style={[
            styles.selectButton,
            {
              backgroundColor: colors.background.secondary,
              borderColor: error ? colors.error : colors.border,
            },
          ]}
        >
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              outline: 'none',
              backgroundColor: colors.background.secondary,
              color: colors.text.primary,
              fontSize: `${TYPOGRAPHY.size.base}px`,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              fontWeight: TYPOGRAPHY.weight.normal,
              cursor: 'pointer',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none',
              paddingRight: '30px',
              paddingLeft: 0,
            } as any}
          >
            <option 
              value="" 
              disabled
              style={{
                backgroundColor: colors.background.secondary,
                color: colors.text.tertiary,
              }}
            >
              {placeholder}
            </option>
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                style={{
                  backgroundColor: colors.background.secondary,
                  color: colors.text.primary,
                  padding: '8px',
                }}
              >
                {option.label}
              </option>
            ))}
          </select>
          <View style={styles.iconWebContainer} pointerEvents="none">
            <Ionicons 
              name="chevron-down" 
              size={20} 
              color={colors.text.tertiary}
            />
          </View>
        </View>
        {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
      </View>
    );
  }

  // Mobile (Android/iOS) - Modal personalizado
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text.primary }]}>{label}</Text>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={[
          styles.selectButton,
          {
            backgroundColor: colors.background.secondary,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.selectButtonText,
            {
              color: value ? colors.text.primary : colors.text.tertiary,
            },
          ]}
        >
          {selectedLabel}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.text.tertiary} />
      </TouchableOpacity>
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: colors.background.secondary }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                {label}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalOption,
                    {
                      backgroundColor:
                        value === option.value
                          ? colors.primary + '20'
                          : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    onChange(option.value);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      {
                        color:
                          value === option.value
                            ? colors.primary
                            : colors.text.primary,
                        fontWeight:
                          value === option.value
                            ? TYPOGRAPHY.weight.semibold
                            : TYPOGRAPHY.weight.normal,
                      } as any,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {value === option.value && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.medium as any,
    marginBottom: SPACING.xs,
  },
  selectButton: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    overflow: 'hidden',
  },
  iconWebContainer: {
    position: 'absolute',
    right: SPACING.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: TYPOGRAPHY.size.base,
    flex: 1,
  },
  error: {
    fontSize: TYPOGRAPHY.size.sm,
    marginTop: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  modalOptionText: {
    fontSize: TYPOGRAPHY.size.base,
    flex: 1,
  },
});

