// Password rules shared by the login UI and the API. Hashing happens on the server only
// (see src/server/password-hash.ts).

export const MIN_PASSWORD_LENGTH = 8;
// Upper bound keeps hashing cost predictable for absurdly long inputs.
export const MAX_PASSWORD_LENGTH = 128;

export const validateNewPassword = (password: string): string | null => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password minimal ${MIN_PASSWORD_LENGTH} karakter.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password maksimal ${MAX_PASSWORD_LENGTH} karakter.`;
  }
  return null;
};
