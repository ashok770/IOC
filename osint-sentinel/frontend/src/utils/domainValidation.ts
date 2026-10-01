/**
 * Client-side domain validation mirroring the backend's strict normalization rules.
 * The backend remains the authoritative validator.
 */

const DOMAIN_LABEL_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
const TLD_REGEX = /^([a-z]{2,63}|xn--[a-z0-9-]{2,59})$/i;
const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  normalizedDomain?: string;
}

export function validateDomainInput(rawInput: string): ValidationResult {
  if (!rawInput || typeof rawInput !== 'string') {
    return { isValid: false, error: 'Target domain cannot be empty.' };
  }

  const cleaned = rawInput.trim();
  if (!cleaned) {
    return { isValid: false, error: 'Target domain cannot be empty.' };
  }

  // Reject IP literals
  if (IPV4_REGEX.test(cleaned) || cleaned.includes(':')) {
    return {
      isValid: false,
      error: 'IP addresses are not permitted. An assessment target must be a fully qualified domain name (FQDN).',
    };
  }

  // Reject protocols and URLs
  if (cleaned.includes('://') || cleaned.startsWith('//') || cleaned.startsWith('/')) {
    return {
      isValid: false,
      error: 'Arbitrary URLs with protocols or paths are prohibited. Enter only the domain name (e.g., example.com).',
    };
  }

  // Reject paths, queries, ports, credentials, or whitespace
  if (/[\/\?#@: \t\n\\]/.test(cleaned)) {
    return {
      isValid: false,
      error: 'Invalid characters detected. Domain must not include paths, ports, credentials, or query parameters.',
    };
  }

  const domain = cleaned.toLowerCase().replace(/\.+$/, '');

  if (domain === 'localhost') {
    return {
      isValid: false,
      error: "'localhost' is not a valid public assessment target.",
    };
  }

  if (domain.length > 253) {
    return {
      isValid: false,
      error: 'Domain name exceeds maximum permitted length of 253 characters.',
    };
  }

  const labels = domain.split('.');
  if (labels.length < 2) {
    return {
      isValid: false,
      error: `Invalid domain '${domain}'. Target must contain at least a second-level domain and a top-level domain (e.g., example.com).`,
    };
  }

  for (const label of labels) {
    if (!label) {
      return { isValid: false, error: `Domain '${domain}' contains empty labels.` };
    }
    if (label.length > 63) {
      return { isValid: false, error: `Domain label '${label}' exceeds maximum length of 63 characters.` };
    }
    if (!DOMAIN_LABEL_REGEX.test(label)) {
      return {
        isValid: false,
        error: `Domain label '${label}' contains invalid characters or leading/trailing hyphens.`,
      };
    }
  }

  const tld = labels[labels.length - 1];
  if (!TLD_REGEX.test(tld)) {
    return {
      isValid: false,
      error: `Top-level domain '.${tld}' is invalid. TLD must be alphabetic or valid punycode.`,
    };
  }

  return { isValid: true, normalizedDomain: domain };
}
