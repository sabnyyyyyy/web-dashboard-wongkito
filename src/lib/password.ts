// Password rules shared by the login UI and the API. Hashing happens on the server only
// (see src/server/password-hash.ts).

export const MIN_PASSWORD_LENGTH = 8;
// Upper bound keeps hashing cost predictable for absurdly long inputs.
export const MAX_PASSWORD_LENGTH = 128;

// Each rule a new password must meet. The forms show them as a live checklist; the server
// rejects a password that misses any of them.
export const PASSWORD_RULES: readonly { label: string; test: (password: string) => boolean }[] = [
  { label: `Minimal ${MIN_PASSWORD_LENGTH} karakter`, test: (p) => p.length >= MIN_PASSWORD_LENGTH },
  { label: 'Ada huruf besar (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'Ada huruf kecil (a-z)', test: (p) => /[a-z]/.test(p) },
  { label: 'Ada angka (0-9)', test: (p) => /[0-9]/.test(p) },
  { label: 'Ada simbol (misalnya ! @ # - _)', test: (p) => /[^A-Za-z0-9\s]/.test(p) },
  { label: 'Tanpa spasi', test: (p) => !/\s/.test(p) },
];

export const validateNewPassword = (password: string): string | null => {
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password maksimal ${MAX_PASSWORD_LENGTH} karakter.`;
  }
  const missing = PASSWORD_RULES.filter((rule) => !rule.test(password));
  if (missing.length > 0) {
    const labels = missing.map((rule) => rule.label.charAt(0).toLowerCase() + rule.label.slice(1));
    return `Password belum memenuhi syarat: ${labels.join(', ')}.`;
  }
  return null;
};
