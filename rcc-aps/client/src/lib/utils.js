export const fmt = n =>
  '₱' + parseFloat(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const esc = s =>
  String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

export const initials = (f, l) => ((f || '')[0] + ((l || '')[0] || '')).toUpperCase();

export function displayName(u) {
  if (!u) return '';
  return `${u.first} ${u.last}`;
}
