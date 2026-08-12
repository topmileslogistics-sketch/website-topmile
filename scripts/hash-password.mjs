#!/usr/bin/env node
/**
 * Generate a bcrypt hash for the admin password.
 *
 *   npm run hash-password -- "your-strong-password"
 *
 * The plaintext password is never written to disk, and should never be
 * committed or pasted into a file.
 */
import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run hash-password -- "your-strong-password"');
  process.exit(1);
}

if (password.length < 12) {
  console.error(
    "Refusing to hash: use a password of at least 12 characters for an account that can read applicant data.",
  );
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);

// Next.js runs dotenv-expand over .env files, which treats `$2a`, `$12` and
// the salt segment of a bcrypt hash as variable references and silently
// replaces them with empty strings. Escaping each `$` prevents that. Values
// set in the Vercel dashboard are NOT expanded, so they use the raw hash.
const escaped = hash.replace(/\$/g, "\\$");

console.log(`
For a .env / .env.local file (note the escaped $ — required, see README):

ADMIN_PASSWORD_HASH=${escaped}

For the Vercel dashboard (Settings → Environment Variables), paste the raw hash:

${hash}
`);
