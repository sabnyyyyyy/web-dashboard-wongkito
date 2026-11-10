// Phone number rules shared by the forms and the API (kasir accounts, store settings).
// Digits only, optionally a leading "+" and spaces or "-" as separators, e.g. 0812-7890-5544
// or +62 812 7890 5544. An empty value is allowed: the number is optional everywhere.

export const MIN_PHONE_DIGITS = 9;
export const MAX_PHONE_DIGITS = 15;

const PHONE_PATTERN = /^\+?[0-9][0-9 -]*$/;

// For onChange handlers: drops everything a phone number can't contain (letters, dots, ...).
export const sanitizePhoneInput = (raw: string): string => {
  const kept = raw.replace(/[^0-9+ -]/g, '');
  // "+" only makes sense as the very first character.
  return kept.charAt(0) + kept.slice(1).replace(/\+/g, '');
};

export const validatePhone = (phone: string): string | null => {
  if (phone === '') return null;
  if (!PHONE_PATTERN.test(phone)) {
    return 'Nomor telepon hanya boleh berisi angka (boleh diawali +, dipisah spasi atau -).';
  }
  const digits = phone.replace(/[^0-9]/g, '').length;
  if (digits < MIN_PHONE_DIGITS || digits > MAX_PHONE_DIGITS) {
    return `Nomor telepon harus ${MIN_PHONE_DIGITS}-${MAX_PHONE_DIGITS} digit angka.`;
  }
  return null;
};
