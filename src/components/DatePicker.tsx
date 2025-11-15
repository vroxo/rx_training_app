import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, TYPOGRAPHY } from '../constants';
import { getThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DatePickerProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

export function DatePicker({
  label,
  value,
  onChange,
  error,
  minimumDate,
  maximumDate,
}: DatePickerProps) {
  const [show, setShow] = useState(false);
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [textValue, setTextValue] = useState(format(value, 'dd/MM/yyyy'));
  const inputRef = React.useRef<TextInput>(null);
  const dateInputRef = React.useRef<HTMLInputElement>(null);

  // Atualiza o texto quando o valor externo muda
  useEffect(() => {
    setTextValue(format(value, 'dd/MM/yyyy'));
  }, [value]);

  const formatDateInput = (text: string): string => {
    // Remove tudo que não é número
    const numbers = text.replace(/\D/g, '');
    
    // Formata progressivamente: DD/MM/YYYY
    let formatted = '';
    
    if (numbers.length > 0) {
      formatted = numbers.substring(0, 2); // DD
      if (numbers.length >= 3) {
        formatted += '/' + numbers.substring(2, 4); // MM
      }
      if (numbers.length >= 5) {
        formatted += '/' + numbers.substring(4, 8); // YYYY
      }
    }
    
    return formatted;
  };

  const handleTextChange = (text: string) => {
    const formatted = formatDateInput(text);
    setTextValue(formatted);

    // Tenta parsear a data quando estiver completa (formato: DD/MM/YYYY = 10 caracteres)
    if (formatted.length === 10) {
      try {
        const parsed = parse(formatted, 'dd/MM/yyyy', new Date());
        if (isValid(parsed)) {
          onChange(parsed);
        }
      } catch (e) {
        // Data inválida, não faz nada
        console.log('Data inválida:', formatted);
      }
    }
  };

  const handleChange = (event: any, selectedDate?: Date) => {
    // On Android, the picker closes automatically after selection
    if (Platform.OS === 'android') {
      setShow(false);
    }
    
    if (selectedDate) {
      onChange(selectedDate);
      setTextValue(format(selectedDate, 'dd/MM/yyyy'));
    }
  };

  const handleCalendarPress = () => {
    if (Platform.OS === 'web') {
      // Na web, aciona o input HTML5 invisível para abrir o calendário nativo
      dateInputRef.current?.showPicker?.();
    } else {
      // No mobile, abre o date picker nativo
      setShow(true);
    }
  };

  const handleDone = () => {
    setShow(false);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text.primary }]}>{label}</Text>
      
      <View style={styles.inputWrapper}>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              backgroundColor: colors.background.secondary,
              borderColor: error ? colors.error : colors.border,
              color: colors.text.primary,
            },
          ]}
          value={textValue}
          onChangeText={handleTextChange}
          placeholder="DD/MM/AAAA"
          placeholderTextColor={colors.text.tertiary}
          keyboardType="numeric"
          maxLength={10}
        />
        <TouchableOpacity 
          style={styles.calendarIcon}
          onPress={handleCalendarPress}
        >
          <Ionicons name="calendar-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        {/* Input HTML5 invisível para web */}
        {Platform.OS === 'web' && (
          <input
            ref={dateInputRef as any}
            type="date"
            value={format(value, 'yyyy-MM-dd')}
            onChange={(e) => {
              const newDate = new Date(e.target.value);
              if (!isNaN(newDate.getTime())) {
                onChange(newDate);
                setTextValue(format(newDate, 'dd/MM/yyyy'));
              }
            }}
            style={{
              position: 'absolute',
              opacity: 0,
              pointerEvents: 'none',
              width: 0,
              height: 0,
            }}
          />
        )}
      </View>

      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}

      {show && Platform.OS !== 'web' && (
        <View>
          <DateTimePicker
            value={value}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            locale="pt-BR"
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity 
              style={[styles.doneButton, { backgroundColor: colors.primary }]} 
              onPress={handleDone}
            >
              <Text style={styles.doneButtonText}>Confirmar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    paddingRight: 48, // Espaço para o ícone
    fontSize: TYPOGRAPHY.size.base,
  },
  calendarIcon: {
    position: 'absolute',
    right: SPACING.md,
    padding: SPACING.xs,
  },
  error: {
    fontSize: TYPOGRAPHY.size.sm,
    marginTop: SPACING.xs,
  },
  doneButton: {
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
  },
});
