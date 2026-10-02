/**
 * Characters for a temporary password: no `0/O`, `1/l/I` pairs, so a password
 * read off a screen and typed on a phone does not fail on a lookalike.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%*";

export const TEMP_PASSWORD_LENGTH = 16;

/**
 * A one-off password for a new staff account.
 *
 * Shown once to the admin who created the account, who passes it on; the person
 * is expected to change it (see /admin/doi-mat-khau). Rejection sampling rather
 * than `% ALPHABET.length`, which would favour the first characters.
 */
export function tempPassword(length = TEMP_PASSWORD_LENGTH): string {
  const out: string[] = [];
  const limit = 256 - (256 % ALPHABET.length);

  while (out.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length - out.length));
    for (const byte of bytes) {
      if (byte >= limit) continue;
      out.push(ALPHABET[byte % ALPHABET.length]);
      if (out.length === length) break;
    }
  }

  return out.join("");
}
