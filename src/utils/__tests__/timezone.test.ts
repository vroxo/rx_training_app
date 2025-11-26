/**
 * Tests for Timezone utilities
 */

import {
  toUTCString,
  fromUTCString,
  getTimezoneOffset,
  getTimezoneName,
  getTimezoneInfo,
  createLocalDate,
  formatLocalDate,
  debugDate,
} from '../timezone';

describe('Timezone Utilities', () => {
  describe('toUTCString', () => {
    it('should convert Date to ISO string in UTC', () => {
      const date = new Date('2024-01-15T10:00:00.000Z');
      const result = toUTCString(date);
      
      expect(result).toBe('2024-01-15T10:00:00.000Z');
      expect(result).toContain('Z'); // UTC indicator
    });

    it('should return null for null input', () => {
      expect(toUTCString(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(toUTCString(undefined)).toBeNull();
    });

    it('should handle dates with different times', () => {
      const date1 = new Date('2024-06-20T14:30:45.123Z');
      const date2 = new Date('2024-12-25T23:59:59.999Z');
      
      expect(toUTCString(date1)).toBe('2024-06-20T14:30:45.123Z');
      expect(toUTCString(date2)).toBe('2024-12-25T23:59:59.999Z');
    });

    it('should preserve milliseconds', () => {
      const date = new Date('2024-01-01T12:00:00.456Z');
      const result = toUTCString(date);
      
      expect(result).toContain('.456Z');
    });
  });

  describe('fromUTCString', () => {
    it('should convert ISO string to Date object', () => {
      const isoString = '2024-01-15T10:00:00.000Z';
      const result = fromUTCString(isoString);
      
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe(isoString);
    });

    it('should return null for null input', () => {
      expect(fromUTCString(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(fromUTCString(undefined)).toBeNull();
    });

    it('should return null for invalid date string', () => {
      expect(fromUTCString('invalid-date')).toBeNull();
      expect(fromUTCString('not a date')).toBeNull();
      expect(fromUTCString('2024-13-45')).toBeNull(); // Invalid month/day
    });

    it('should handle various valid ISO formats', () => {
      const formats = [
        '2024-01-15T10:00:00.000Z',
        '2024-01-15T10:00:00Z',
        '2024-01-15T10:00:00.123Z',
        '2024-06-20T14:30:45.000Z',
      ];

      formats.forEach(format => {
        const result = fromUTCString(format);
        expect(result).toBeInstanceOf(Date);
        expect(result).not.toBeNull();
      });
    });

    it('should handle dates with milliseconds', () => {
      const result = fromUTCString('2024-01-01T12:00:00.456Z');
      
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMilliseconds()).toBe(456);
    });
  });

  describe('toUTCString and fromUTCString roundtrip', () => {
    it('should maintain date integrity through roundtrip conversion', () => {
      const originalDate = new Date('2024-03-15T14:30:00.000Z');
      
      // Convert to string and back
      const stringified = toUTCString(originalDate);
      const parsed = fromUTCString(stringified!);
      
      expect(parsed?.getTime()).toBe(originalDate.getTime());
      expect(parsed?.toISOString()).toBe(originalDate.toISOString());
    });

    it('should handle multiple roundtrips', () => {
      let date = new Date('2024-01-01T00:00:00.000Z');
      
      // Do 5 roundtrips
      for (let i = 0; i < 5; i++) {
        const str = toUTCString(date);
        date = fromUTCString(str!)!;
      }
      
      expect(date.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('getTimezoneOffset', () => {
    it('should return a number', () => {
      const offset = getTimezoneOffset();
      
      expect(typeof offset).toBe('number');
    });

    it('should return offset in minutes', () => {
      const offset = getTimezoneOffset();
      
      // Offset should be within reasonable range (-720 to +840 minutes)
      expect(offset).toBeGreaterThanOrEqual(-840);
      expect(offset).toBeLessThanOrEqual(840);
    });

    it('should match Date.getTimezoneOffset()', () => {
      const offset = getTimezoneOffset();
      const expected = new Date().getTimezoneOffset();
      
      expect(offset).toBe(expected);
    });
  });

  describe('getTimezoneName', () => {
    it('should return a string', () => {
      const name = getTimezoneName();
      
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    });

    it('should return a valid IANA timezone identifier', () => {
      const name = getTimezoneName();
      
      // Should contain at least one slash (e.g., America/Sao_Paulo)
      // or be UTC
      expect(name === 'UTC' || name.includes('/')).toBe(true);
    });

    it('should match Intl.DateTimeFormat timezone', () => {
      const name = getTimezoneName();
      const expected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      expect(name).toBe(expected);
    });
  });

  describe('getTimezoneInfo', () => {
    it('should return an object with all required properties', () => {
      const info = getTimezoneInfo();
      
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('offsetMinutes');
      expect(info).toHaveProperty('offsetHours');
      expect(info).toHaveProperty('offsetString');
    });

    it('should have correct types', () => {
      const info = getTimezoneInfo();
      
      expect(typeof info.name).toBe('string');
      expect(typeof info.offsetMinutes).toBe('number');
      expect(typeof info.offsetHours).toBe('number');
      expect(typeof info.offsetString).toBe('string');
    });

    it('should have valid offset string format', () => {
      const info = getTimezoneInfo();
      
      // Should be like "UTC+3" or "UTC-5"
      expect(info.offsetString).toMatch(/^UTC[+-]\d+(\.\d+)?$/);
    });

    it('should calculate offsetHours correctly from offsetMinutes', () => {
      const info = getTimezoneInfo();
      
      const expectedHours = Math.abs(info.offsetMinutes) / 60;
      expect(info.offsetHours).toBe(expectedHours);
    });

    it('should have correct sign in offsetString', () => {
      const info = getTimezoneInfo();
      
      if (info.offsetMinutes < 0) {
        // Negative offset (east of GMT) should show +
        expect(info.offsetString).toContain('UTC+');
      } else if (info.offsetMinutes > 0) {
        // Positive offset (west of GMT) should show -
        expect(info.offsetString).toContain('UTC-');
      } else {
        // Zero offset
        expect(info.offsetString).toBe('UTC+0');
      }
    });
  });

  describe('createLocalDate', () => {
    it('should create a Date with specified components', () => {
      const date = createLocalDate(2024, 0, 15, 14, 30, 45); // January 15, 2024 14:30:45
      
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getDate()).toBe(15);
      expect(date.getHours()).toBe(14);
      expect(date.getMinutes()).toBe(30);
      expect(date.getSeconds()).toBe(45);
    });

    it('should use default values for optional time parameters', () => {
      const date = createLocalDate(2024, 5, 20); // June 20, 2024
      
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(5); // June
      expect(date.getDate()).toBe(20);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
    });

    it('should create Date in local timezone', () => {
      const date = createLocalDate(2024, 0, 1, 12, 0, 0);
      
      // Date should be created in local timezone
      expect(date).toBeInstanceOf(Date);
      expect(date.getHours()).toBe(12); // Should be 12 in local time
    });

    it('should handle month boundaries correctly', () => {
      const date1 = createLocalDate(2024, 0, 31); // Last day of January
      const date2 = createLocalDate(2024, 1, 1);  // First day of February
      
      expect(date1.getMonth()).toBe(0);
      expect(date1.getDate()).toBe(31);
      expect(date2.getMonth()).toBe(1);
      expect(date2.getDate()).toBe(1);
    });

    it('should handle leap years', () => {
      const date = createLocalDate(2024, 1, 29); // Feb 29, 2024 (leap year)
      
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(1);
      expect(date.getDate()).toBe(29);
    });
  });

  describe('formatLocalDate', () => {
    it('should format date with given format string', () => {
      const date = new Date('2024-01-15T10:00:00.000Z');
      const result = formatLocalDate(date, 'yyyy-MM-dd');
      
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle different format patterns', () => {
      const date = new Date('2024-06-20T14:30:00.000Z');
      
      // Different formats should produce different outputs
      const format1 = formatLocalDate(date, 'yyyy-MM-dd');
      const format2 = formatLocalDate(date, 'dd/MM/yyyy');
      const format3 = formatLocalDate(date, 'MMM dd, yyyy');
      
      expect(format1).toBeTruthy();
      expect(format2).toBeTruthy();
      expect(format3).toBeTruthy();
      expect(format1).not.toBe(format2);
    });

    it('should use local timezone by default', () => {
      const date = new Date('2024-01-15T00:00:00.000Z');
      const result = formatLocalDate(date, 'yyyy-MM-dd HH:mm');
      
      // Should be a valid formatted string
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('debugDate', () => {
    it('should not throw when called', () => {
      const date = new Date('2024-01-15T10:00:00.000Z');
      
      expect(() => {
        debugDate(date, 'Test Date');
      }).not.toThrow();
    });

    it('should accept date without label', () => {
      const date = new Date();
      
      expect(() => {
        debugDate(date);
      }).not.toThrow();
    });

    it('should handle various date inputs', () => {
      const dates = [
        new Date(),
        new Date('2024-01-01'),
        new Date(0), // Unix epoch
        new Date('2024-12-31T23:59:59.999Z'),
      ];

      dates.forEach(date => {
        expect(() => {
          debugDate(date, 'Debug test');
        }).not.toThrow();
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should throw for invalid dates', () => {
      const invalidDate = new Date('invalid');
      
      // toUTCString throws for invalid dates (expected behavior)
      expect(() => toUTCString(invalidDate)).toThrow();
    });

    it('should handle very old dates', () => {
      const oldDate = new Date('1900-01-01T00:00:00.000Z');
      const str = toUTCString(oldDate);
      const parsed = fromUTCString(str!);
      
      // Date might be off by 1 due to timezone/calendar quirks with very old dates
      expect(parsed?.getFullYear()).toBeGreaterThanOrEqual(1899);
      expect(parsed?.getFullYear()).toBeLessThanOrEqual(1900);
    });

    it('should handle very future dates', () => {
      const futureDate = new Date('2100-12-31T23:59:59.999Z');
      const str = toUTCString(futureDate);
      const parsed = fromUTCString(str!);
      
      expect(parsed?.getFullYear()).toBe(2100);
    });

    it('should handle midnight dates', () => {
      const midnight = createLocalDate(2024, 5, 15, 0, 0, 0);
      
      expect(midnight.getHours()).toBe(0);
      expect(midnight.getMinutes()).toBe(0);
      expect(midnight.getSeconds()).toBe(0);
    });

    it('should handle dates at end of day', () => {
      const endOfDay = createLocalDate(2024, 5, 15, 23, 59, 59);
      
      expect(endOfDay.getHours()).toBe(23);
      expect(endOfDay.getMinutes()).toBe(59);
      expect(endOfDay.getSeconds()).toBe(59);
    });
  });
});

