const { verifyEmailExistence } = require('../utils/emailVerifier');

// Define the password validation logic directly as in auth.js to test it
const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special symbol';
  return null; // Valid!
};

async function runTests() {
  console.log('🧪 Starting Auth Hardening Validation Tests...\n');

  // --- Email Existence Tests ---
  console.log('--- Checking Email Existence Verification ---');
  const emailsToTest = [
    { email: 'test@gmail.com', expected: true, desc: 'Whitelisted popular domain' },
    { email: 'user@arab.com', expected: true, desc: 'Whitelisted corporate domain' },
    { email: 'valid-dns@google.com', expected: true, desc: 'Non-whitelisted domain but exists in real-world (Google)' },
    { email: 'user@nonexistentdomainfake12345.xyz', expected: false, desc: 'Non-existent fake domain' },
    { email: 'invalid-email-format', expected: false, desc: 'Invalid email syntax' }
  ];

  for (const item of emailsToTest) {
    const result = await verifyEmailExistence(item.email);
    const passed = result === item.expected;
    console.log(`${passed ? '✅' : '❌'} Email: "${item.email}" (${item.desc}) -> got: ${result}, expected: ${item.expected}`);
  }

  // --- Password Strength Tests ---
  console.log('\n--- Checking Password Strength Verification ---');
  const passwordsToTest = [
    { pass: 'Ab1!cd2#ef', expected: null, desc: 'Valid strong password (length, upper, lower, num, symbol)' },
    { pass: 'short1!', expected: 'Password must be at least 8 characters long', desc: 'Too short' },
    { pass: 'lowercase1!', expected: 'Password must contain at least one uppercase letter', desc: 'No uppercase' },
    { pass: 'UPPERCASE1!', expected: 'Password must contain at least one lowercase letter', desc: 'No lowercase' },
    { pass: 'NoNumber!', expected: 'Password must contain at least one number', desc: 'No numbers' },
    { pass: 'NoSymbol12', expected: 'Password must contain at least one special symbol', desc: 'No symbols' }
  ];

  for (const item of passwordsToTest) {
    const result = validatePasswordStrength(item.pass);
    const passed = result === item.expected;
    console.log(`${passed ? '✅' : '❌'} Password: "${item.pass}" (${item.desc}) -> got error: "${result}", expected error: "${item.expected}"`);
  }

  console.log('\n🏁 Tests Completed.');
}

runTests();
