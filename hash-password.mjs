#!/usr/bin/env node
/**
 * Generate a bcrypt hash for the admin password.
 *
 *   npm run hash-password -- "your-strong-password"
 *
 * Copy the output into ADMIN_PASSWORD_HASH. The plaintext password is never
 * written to disk, and should never be committed or pasted into a file.
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

console.log("\nAdd this to your environment variables:\n");
console.log(`ADMIN_PASSWORD_HASH='${hash}'\n`);
