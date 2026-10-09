const whole = new Intl.NumberFormat('en');
const one = new Intl.NumberFormat('en', { maximumFractionDigits: 1 });

export const count = (n) => whole.format(Math.round(n ?? 0));
export const hours = (n) => ((n ?? 0) >= 100 ? whole.format(Math.round(n)) : one.format(n ?? 0));

const DAY = { day: 'numeric', month: 'short', year: 'numeric' };
const MONTH = { month: 'short', year: 'numeric' };

/** '2023-05-20' or '2023-05' to words. Read as a plain date, with no time zone shift. */
export function day(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d || 1).toLocaleDateString('en-GB', d ? DAY : MONTH);
}

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** 21 becomes '9 pm'. */
export function hourName(h) {
  if (h === 0) return '12 am';
  if (h === 12) return '12 pm';
  return h < 12 ? `${h} am` : `${h - 12} pm`;
}

let names;
/** 'IN' becomes 'India'. An unknown code stays as it is. */
export function country(code) {
  try {
    names ??= new Intl.DisplayNames(['en'], { type: 'region' });
    return names.of(code) || code;
  } catch {
    return code;
  }
}
