import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors, SPACING, TYPOGRAPHY } from '../constants/theme';
import { haptic } from '../services/haptic';

interface RestTimerModalProps {
  visible: boolean;
  initialSeconds: number;
  onClose: () => void;
}

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(width * 0.7, 280);
const STROKE_WIDTH = 12;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RestTimerModal({ visible, initialSeconds, onClose }: RestTimerModalProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasPlayedSound = useRef(false);

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setSecondsLeft(initialSeconds);
      setTotalSeconds(initialSeconds);
      setIsRunning(true); // Auto-start
      hasPlayedSound.current = false;
    }
  }, [visible, initialSeconds]);

  // Timer logic
  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            // Vibrate and haptic feedback when timer ends
            if (!hasPlayedSound.current) {
              Vibration.vibrate([0, 200, 100, 200]);
              haptic.success();
              hasPlayedSound.current = true;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, secondsLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (secondsLeft === 0) {
      // Restart
      setSecondsLeft(totalSeconds);
      setIsRunning(true);
      hasPlayedSound.current = false;
    } else {
      setIsRunning(!isRunning);
    }
    haptic.light();
  };

  const handleReset = () => {
    setSecondsLeft(totalSeconds);
    setIsRunning(false);
    hasPlayedSound.current = false;
    haptic.light();
  };

  const handleAddTime = (seconds: number) => {
    setSecondsLeft((prev) => prev + seconds);
    setTotalSeconds((prev) => prev + seconds);
    haptic.light();
  };

  const handleClose = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    onClose();
  };

  // Calculate progress
  const progress = secondsLeft / totalSeconds;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  // Dynamic color based on progress
  const getProgressColor = () => {
    if (progress > 0.66) return colors.success;
    if (progress > 0.33) return colors.warning;
    return colors.error;
  };

  const progressColor = getProgressColor();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.9)' }]}>
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
          {/* Close Button */}
          <TouchableOpacity
            onPress={handleClose}
            style={[styles.closeButton, { backgroundColor: colors.background.secondary }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={28} color={colors.text.primary} />
          </TouchableOpacity>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Tempo de Descanso
          </Text>

          {/* Circular Progress */}
          <View style={styles.circleContainer}>
            <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
              {/* Background Circle */}
              <Circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                stroke={colors.background.tertiary}
                strokeWidth={STROKE_WIDTH}
                fill="none"
              />
              {/* Progress Circle */}
              <Circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                stroke={progressColor}
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
              />
            </Svg>

            {/* Time Display */}
            <View style={styles.timeContainer}>
              <Text style={[styles.timeText, { color: progressColor }]}>
                {formatTime(secondsLeft)}
              </Text>
              <Text style={[styles.statusText, { color: colors.text.secondary }]}>
                {secondsLeft === 0
                  ? 'Descanso concluído!'
                  : isRunning
                  ? 'Descansando...'
                  : 'Pausado'}
              </Text>
            </View>
          </View>

          {/* Quick Add Time Buttons */}
          <View style={styles.quickAddContainer}>
            <TouchableOpacity
              onPress={() => handleAddTime(10)}
              style={[styles.quickAddButton, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}
            >
              <Text style={[styles.quickAddText, { color: colors.text.primary }]}>+10s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleAddTime(30)}
              style={[styles.quickAddButton, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}
            >
              <Text style={[styles.quickAddText, { color: colors.text.primary }]}>+30s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleAddTime(60)}
              style={[styles.quickAddButton, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}
            >
              <Text style={[styles.quickAddText, { color: colors.text.primary }]}>+1min</Text>
            </TouchableOpacity>
          </View>

          {/* Control Buttons */}
          <View style={styles.controls}>
            <TouchableOpacity
              onPress={handlePlayPause}
              style={[styles.controlButton, styles.playButton, { backgroundColor: colors.primary }]}
            >
              <Ionicons
                name={secondsLeft === 0 ? 'refresh' : isRunning ? 'pause' : 'play'}
                size={32}
                color={colors.background.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleReset}
              style={[styles.controlButton, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}
            >
              <Ionicons name="reload" size={28} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderRadius: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.size['2xl'],
    fontWeight: TYPOGRAPHY.weight.bold as any,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  circleContainer: {
    position: 'relative',
    marginBottom: SPACING.xl,
  },
  timeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 56,
    fontWeight: TYPOGRAPHY.weight.bold as any,
    fontVariant: ['tabular-nums'] as any,
  },
  statusText: {
    fontSize: TYPOGRAPHY.size.base,
    marginTop: SPACING.xs,
  },
  quickAddContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  quickAddButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickAddText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.semibold as any,
  },
  controls: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'center',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 0,
  },
});

