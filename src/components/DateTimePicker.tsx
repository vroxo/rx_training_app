import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, TextInput } from 'react-native';
import DateTimePickerModal from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, TYPOGRAPHY } from '../constants';
import { getThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DateTimePickerProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
}

export function DateTimePickerComponent({
  label,
  value,
  onChange,
  error,
  mode = 'datetime',
  minimumDate,
  maximumDate,
}: DateTimePickerProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  
  const [dateText, setDateText] = useState(format(value, 'dd/MM/yyyy'));
  const [timeText, setTimeText] = useState(format(value, 'HH:mm'));

  // Atualiza os textos quando o valor externo muda
  useEffect(() => {
    setDateText(format(value, 'dd/MM/yyyy'));
    setTimeText(format(value, 'HH:mm'));
  }, [value]);

  const formatDateInput = (text: string): string => {
    const numbers = text.replace(/\D/g, '');
    let formatted = '';
    
    if (numbers.length > 0) {
      formatted = numbers.substring(0, 2);
      if (numbers.length >= 3) {
        formatted += '/' + numbers.substring(2, 4);
      }
      if (numbers.length >= 5) {
        formatted += '/' + numbers.substring(4, 8);
      }
    }
    
    return formatted;
  };

  const formatTimeInput = (text: string): string => {
    const numbers = text.replace(/\D/g, '');
    let formatted = '';
    
    if (numbers.length > 0) {
      formatted = numbers.substring(0, 2);
      if (numbers.length >= 3) {
        formatted += ':' + numbers.substring(2, 4);
      }
    }
    
    return formatted;
  };

  const handleDateTextChange = (text: string) => {
    const formatted = formatDateInput(text);
    setDateText(formatted);

    if (formatted.length === 10) {
      try {
        // Parse DD/MM/YYYY manualmente para evitar problemas de timezone
        const [day, month, year] = formatted.split('/').map(Number);
        
        // Validação básica
        if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          // Preserva a hora atual
          const newDate = new Date(
            year,
            month - 1, // month é 0-indexed
            day,
            value.getHours(),
            value.getMinutes(),
            value.getSeconds()
          );
          
          if (isValid(newDate)) {
            onChange(newDate);
          }
        }
      } catch (e) {
        console.log('Data inválida:', formatted);
      }
    }
  };

  const handleTimeTextChange = (text: string) => {
    const formatted = formatTimeInput(text);
    setTimeText(formatted);

    if (formatted.length === 5) {
      try {
        const [hours, minutes] = formatted.split(':').map(Number);
        if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
          // Preserva a data atual
          const newDate = new Date(
            value.getFullYear(),
            value.getMonth(),
            value.getDate(),
            hours,
            minutes,
            0
          );
          onChange(newDate);
        }
      } catch (e) {
        console.log('Hora inválida:', formatted);
      }
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      // Preserva a hora atual ao mudar apenas a data
      const newDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        value.getHours(),
        value.getMinutes(),
        value.getSeconds()
      );
      onChange(newDate);
      setDateText(format(newDate, 'dd/MM/yyyy'));
    }
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selectedDate) {
      // Preserva a data atual ao mudar apenas a hora
      const newDate = new Date(
        value.getFullYear(),
        value.getMonth(),
        value.getDate(),
        selectedDate.getHours(),
        selectedDate.getMinutes(),
        0
      );
      onChange(newDate);
      setTimeText(format(newDate, 'HH:mm'));
    }
  };

  const handleWebDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // e.target.value retorna "YYYY-MM-DD"
    const [year, month, day] = e.target.value.split('-').map(Number);
    const newDate = new Date(
      year,
      month - 1, // month é 0-indexed
      day,
      value.getHours(),
      value.getMinutes(),
      value.getSeconds()
    );
    
    if (!isNaN(newDate.getTime())) {
      onChange(newDate);
      setDateText(format(newDate, 'dd/MM/yyyy'));
    }
  };

  const handleWebTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // e.target.value retorna "HH:mm"
    const [hours, minutes] = e.target.value.split(':').map(Number);
    const newDate = new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
      hours,
      minutes,
      0
    );
    
    if (!isNaN(newDate.getTime())) {
      onChange(newDate);
      setTimeText(format(newDate, 'HH:mm'));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text.primary }]}>{label}</Text>
      
      <View style={styles.row}>
        {/* Data Input */}
        {(mode === 'date' || mode === 'datetime') && (
          <View style={[styles.inputWrapper, mode === 'datetime' && styles.halfWidth]}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: error ? colors.error : colors.border,
                  color: colors.text.primary,
                },
              ]}
              value={dateText}
              onChangeText={handleDateTextChange}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="numeric"
              maxLength={10}
            />
            <TouchableOpacity 
              style={styles.icon}
              onPress={() => {
                if (Platform.OS === 'web') {
                  const dateInput = document.getElementById('date-input-' + label) as HTMLInputElement;
                  dateInput?.showPicker?.();
                } else {
                  setShowDatePicker(true);
                }
              }}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            
            {Platform.OS === 'web' && (
              <input
                id={'date-input-' + label}
                type="date"
                value={format(value, 'yyyy-MM-dd')}
                onChange={handleWebDateChange}
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
        )}

        {/* Hora Input */}
        {(mode === 'time' || mode === 'datetime') && (
          <View style={[styles.inputWrapper, mode === 'datetime' && styles.halfWidth]}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: error ? colors.error : colors.border,
                  color: colors.text.primary,
                },
              ]}
              value={timeText}
              onChangeText={handleTimeTextChange}
              placeholder="HH:MM"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="numeric"
              maxLength={5}
            />
            <TouchableOpacity 
              style={styles.icon}
              onPress={() => {
                if (Platform.OS === 'web') {
                  const timeInput = document.getElementById('time-input-' + label) as HTMLInputElement;
                  timeInput?.showPicker?.();
                } else {
                  setShowTimePicker(true);
                }
              }}
            >
              <Ionicons name="time-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            
            {Platform.OS === 'web' && (
              <input
                id={'time-input-' + label}
                type="time"
                value={format(value, 'HH:mm')}
                onChange={handleWebTimeChange}
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
        )}
      </View>

      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}

      {/* Native Date Picker */}
      {showDatePicker && Platform.OS !== 'web' && (
        <View>
          <DateTimePickerModal
            value={value}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            locale="pt-BR"
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity 
              style={[styles.doneButton, { backgroundColor: colors.primary }]} 
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.doneButtonText}>Confirmar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Native Time Picker */}
      {showTimePicker && Platform.OS !== 'web' && (
        <View>
          <DateTimePickerModal
            value={value}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
            locale="pt-BR"
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity 
              style={[styles.doneButton, { backgroundColor: colors.primary }]} 
              onPress={() => setShowTimePicker(false)}
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
  row: {
    flexDirection: 'column',
    gap: SPACING.sm,
  },
  inputWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  halfWidth: {
    width: '100%',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    paddingRight: 40,
    fontSize: TYPOGRAPHY.size.base,
  },
  icon: {
    position: 'absolute',
    right: SPACING.sm,
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

