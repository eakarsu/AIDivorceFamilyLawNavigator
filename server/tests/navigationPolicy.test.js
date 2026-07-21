import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateCalendarDeadline, screenSafety, validateRule } from '../services/navigationPolicy.js';

test('safety screening escalates without making a legal conclusion', () => {
  const result = screenSafety('There is immediate danger and I need help');
  assert.equal(result.requiresSafetyEscalation, true);
});

test('deadline calculations retain source and require calendar verification', () => {
  const rule = { citation: 'Rule 1', sourceUrl: 'https://court.example/rule', effectiveFrom: '2026-01-01' };
  const result = calculateCalendarDeadline({ triggerDate: '2026-07-01', dayCount: 30, rule, now: new Date('2026-07-18') });
  assert.equal(result.dueDate, '2026-07-31');
  assert.equal(result.requiresCourtCalendarVerification, true);
});

test('expired rules cannot drive deadlines', () => {
  assert.throws(() => validateRule({ citation: 'Old', sourceUrl: 'https://court.example/old', effectiveFrom: '2020-01-01', effectiveUntil: '2021-01-01' }, new Date('2026-07-18')), /not effective/);
});

