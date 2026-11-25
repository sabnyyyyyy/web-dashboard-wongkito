// Rules for people's names (kasir accounts, own profile). Kept identical in
// frontend/src/lib/name.ts and backend/src/utils/name.ts.
// Letters (any alphabet), spaces, and . ' - for names like "Siti A." or "Abdul-Rahman".

export const MAX_NAME_LENGTH = 100;

const DIGIT = /[0-9]/;
const ALLOWED = /^[\p{L}\p{M} .'-]+$/u;
const LETTER = /\p{L}/u;

export const validatePersonName = (name: string): string | null => {
  const trimmed = name.trim();
  if (trimmed === '') return 'Nama wajib diisi.';
  if (DIGIT.test(trimmed)) return 'Nama tidak boleh berisi angka.';
  if (!ALLOWED.test(trimmed)) {
    return "Nama hanya boleh berisi huruf, spasi, titik ( . ), apostrof ( ' ), dan tanda hubung ( - ).";
  }
  if (!LETTER.test(trimmed)) return 'Nama harus berisi huruf.';
  if (trimmed.length > MAX_NAME_LENGTH) return `Nama maksimal ${MAX_NAME_LENGTH} karakter.`;
  return null;
};
