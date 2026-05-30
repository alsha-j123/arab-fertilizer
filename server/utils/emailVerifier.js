const dns = require('dns').promises;

// Standard public/official allowed domains whitelisted immediately
const ALLOWED_DOMAINS = [
  'gmail.com',
  'outlook.com',
  'yahoo.com',
  'hotmail.com',
  'aol.com',
  'icloud.com',
  'arab-fertilizer.com',
  'arab.com'
];

/**
 * Validates syntax of email using a robust regular expression.
 * @param {string} email 
 * @returns {boolean}
 */
const validateEmailSyntax = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Verifies email domain existence in the real-world.
 * 1. Checks basic syntax.
 * 2. Checks whitelist of popular domains for immediate resolution.
 * 3. Falls back to DNS MX record query to verify real-world existence.
 * @param {string} email 
 * @returns {Promise<boolean>}
 */
const verifyEmailExistence = async (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const trimmedEmail = email.trim().toLowerCase();
  
  if (!validateEmailSyntax(trimmedEmail)) {
    return false;
  }
  
  const domain = trimmedEmail.split('@')[1];
  if (!domain) return false;
  
  // Whitelist check
  if (ALLOWED_DOMAINS.includes(domain)) {
    return true;
  }
  
  // Fallback: Real-world MX lookup
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (mxRecords && mxRecords.length > 0) {
      return true;
    }
  } catch (err) {
    console.warn(`[emailVerifier] MX lookup failed for domain "${domain}":`, err.message);
    
    // Domain-specific DNS errors that prove the domain does not exist or has no mail servers:
    // - ENOTFOUND: Host/domain not found (domain does not exist)
    // - ENODATA: DNS server returned no MX records for the domain
    const domainErrors = ['ENOTFOUND', 'ENODATA'];
    if (domainErrors.includes(err.code)) {
      return false; // Definitely non-existent email domain
    }
    
    // For other connection/network/system errors (e.g. ECONNREFUSED, ETIMEDOUT, ESERVFAIL),
    // we treat the lookup as passed to avoid blocking legitimate users due to network/sandbox issues.
    console.warn(`[emailVerifier] Temporary DNS network issue (${err.code || 'UNKNOWN'}). Allowing registration as fallback.`);
    return true;
  }
  
  return false;
};

module.exports = {
  verifyEmailExistence,
  validateEmailSyntax,
  ALLOWED_DOMAINS
};
