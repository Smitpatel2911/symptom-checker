import { describe, expect, test } from 'vitest';
import { todayString, isUpcoming, formatTime, titleCase } from './format.js';

describe('format helpers', () => {
  test('todayString pads month and day', () => {
    expect(todayString(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  test('isUpcoming is true only for confirmed, non-past appointments', () => {
    const today = '2026-10-21';
    expect(isUpcoming({ status: 'Confirmed', date: '2026-10-21' }, today)).toBe(true);
    expect(isUpcoming({ status: 'Confirmed', date: '2026-10-20' }, today)).toBe(false);
    expect(isUpcoming({ status: 'Cancelled', date: '2026-10-25' }, today)).toBe(false);
  });

  test('formatTime converts 24h to 12h', () => {
    expect(formatTime('00:30')).toBe('12:30 AM');
    expect(formatTime('10:00')).toBe('10:00 AM');
    expect(formatTime('14:30')).toBe('2:30 PM');
  });

  test('titleCase capitalises each word', () => {
    expect(titleCase('shortness of breath')).toBe('Shortness Of Breath');
  });
});
