/**
 * Tests for RPE (Rate of Perceived Exertion) utilities
 */

import { calculateRPEFromRIR, getRPELabel } from '../rpe';

describe('RPE Utilities', () => {
  describe('calculateRPEFromRIR', () => {
    describe('valid RIR values', () => {
      it('should convert RIR 0 to RPE 10 (max effort)', () => {
        expect(calculateRPEFromRIR(0)).toBe(10);
      });

      it('should convert RIR 1 to RPE 9 (very difficult)', () => {
        expect(calculateRPEFromRIR(1)).toBe(9);
      });

      it('should convert RIR 2 to RPE 8 (difficult)', () => {
        expect(calculateRPEFromRIR(2)).toBe(8);
      });

      it('should convert RIR 3 to RPE 7 (moderate)', () => {
        expect(calculateRPEFromRIR(3)).toBe(7);
      });

      it('should convert RIR 4 to RPE 6 (light)', () => {
        expect(calculateRPEFromRIR(4)).toBe(6);
      });

      it('should convert RIR 5+ to RPE 6 (light)', () => {
        expect(calculateRPEFromRIR(5)).toBe(6);
        expect(calculateRPEFromRIR(6)).toBe(6);
        expect(calculateRPEFromRIR(10)).toBe(6);
        expect(calculateRPEFromRIR(100)).toBe(6);
      });
    });

    describe('edge cases', () => {
      it('should return undefined for undefined input', () => {
        expect(calculateRPEFromRIR(undefined)).toBeUndefined();
      });

      it('should return undefined for null input', () => {
        expect(calculateRPEFromRIR(null as any)).toBeUndefined();
      });

      it('should return undefined for negative RIR', () => {
        expect(calculateRPEFromRIR(-1)).toBeUndefined();
        expect(calculateRPEFromRIR(-5)).toBeUndefined();
      });
    });

    describe('type handling', () => {
      it('should handle number type correctly', () => {
        const rir: number = 2;
        const result = calculateRPEFromRIR(rir);
        expect(typeof result).toBe('number');
        expect(result).toBe(8);
      });

      it('should handle optional parameter', () => {
        const rir: number | undefined = undefined;
        expect(calculateRPEFromRIR(rir)).toBeUndefined();
      });
    });
  });

  describe('getRPELabel', () => {
    describe('valid RPE values', () => {
      it('should return correct label for RPE 10', () => {
        expect(getRPELabel(10)).toBe('10 - Máximo');
      });

      it('should return correct label for RPE 9', () => {
        expect(getRPELabel(9)).toBe('9 - Muito difícil');
      });

      it('should return correct label for RPE 8', () => {
        expect(getRPELabel(8)).toBe('8 - Difícil');
      });

      it('should return correct label for RPE 7', () => {
        expect(getRPELabel(7)).toBe('7 - Moderado');
      });

      it('should return correct label for RPE 6', () => {
        expect(getRPELabel(6)).toBe('6 - Leve');
      });
    });

    describe('invalid RPE values', () => {
      it('should return empty string for undefined', () => {
        expect(getRPELabel(undefined)).toBe('');
      });

      it('should return empty string for null', () => {
        expect(getRPELabel(null as any)).toBe('');
      });

      it('should return empty string for values not in range', () => {
        expect(getRPELabel(0)).toBe('');
        expect(getRPELabel(1)).toBe('');
        expect(getRPELabel(5)).toBe('');
        expect(getRPELabel(11)).toBe('');
        expect(getRPELabel(100)).toBe('');
      });

      it('should return empty string for negative values', () => {
        expect(getRPELabel(-1)).toBe('');
        expect(getRPELabel(-10)).toBe('');
      });
    });

    describe('type handling', () => {
      it('should handle number type correctly', () => {
        const rpe: number = 8;
        const result = getRPELabel(rpe);
        expect(typeof result).toBe('string');
        expect(result).toBe('8 - Difícil');
      });

      it('should handle optional parameter', () => {
        const rpe: number | undefined = undefined;
        expect(getRPELabel(rpe)).toBe('');
      });
    });
  });

  describe('integration: RIR to RPE to Label', () => {
    it('should convert RIR 0 through complete chain', () => {
      const rpe = calculateRPEFromRIR(0);
      const label = getRPELabel(rpe);
      expect(label).toBe('10 - Máximo');
    });

    it('should convert RIR 1 through complete chain', () => {
      const rpe = calculateRPEFromRIR(1);
      const label = getRPELabel(rpe);
      expect(label).toBe('9 - Muito difícil');
    });

    it('should convert RIR 2 through complete chain', () => {
      const rpe = calculateRPEFromRIR(2);
      const label = getRPELabel(rpe);
      expect(label).toBe('8 - Difícil');
    });

    it('should convert RIR 3 through complete chain', () => {
      const rpe = calculateRPEFromRIR(3);
      const label = getRPELabel(rpe);
      expect(label).toBe('7 - Moderado');
    });

    it('should convert RIR 4+ through complete chain', () => {
      const rpe = calculateRPEFromRIR(4);
      const label = getRPELabel(rpe);
      expect(label).toBe('6 - Leve');
    });

    it('should handle undefined through complete chain', () => {
      const rpe = calculateRPEFromRIR(undefined);
      const label = getRPELabel(rpe);
      expect(label).toBe('');
    });
  });
});

