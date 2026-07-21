const HIGH_RISK_TERMS = ['immediate danger', 'domestic violence', 'protective order', 'child abduction', 'threatened me'];

export function screenSafety(text = '') {
  const normalized = String(text).toLowerCase();
  const matches = HIGH_RISK_TERMS.filter(term => normalized.includes(term));
  return { requiresSafetyEscalation: matches.length > 0, matchedCategories: matches };
}

export function validateRule(rule, at = new Date()) {
  if (!rule.citation || !rule.sourceUrl || !rule.effectiveFrom) throw new Error('Rule citation, sourceUrl, and effectiveFrom are required');
  const from = new Date(rule.effectiveFrom);
  const until = rule.effectiveUntil ? new Date(rule.effectiveUntil) : null;
  if (Number.isNaN(from.getTime()) || (until && Number.isNaN(until.getTime()))) throw new Error('Rule effective dates must be valid');
  if (from > at || (until && until < at)) throw new Error('Rule is not effective on the calculation date');
  return true;
}

export function calculateCalendarDeadline({ triggerDate, dayCount, rule, now = new Date() }) {
  validateRule(rule, now);
  const trigger = new Date(`${triggerDate}T12:00:00Z`);
  const days = Number(dayCount);
  if (Number.isNaN(trigger.getTime()) || !Number.isInteger(days) || days < 0 || days > 3660) throw new Error('Trigger date and bounded integer dayCount are required');
  const due = new Date(trigger);
  due.setUTCDate(due.getUTCDate() + days);
  return { dueDate: due.toISOString().slice(0, 10), calculationMethod: 'calendar_days', requiresCourtCalendarVerification: true };
}

