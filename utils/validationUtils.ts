/**
 * Enhanced Validation Utility Functions
 * Improved security, robustness, and modern best practices
 */

// Types for better type safety
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
  minSize?: number;
}

export interface PasswordOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  maxLength?: number;
}

// Enhanced email validation with more comprehensive regex
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  
  // More comprehensive email regex following RFC 5322 guidelines
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  // Additional checks
  if (email.length > 254) return false; // RFC 5321 limit
  if (email.includes('..')) return false; // Consecutive dots not allowed
  
  return emailRegex.test(email.trim().toLowerCase());
};

// Enhanced password validation with configurable options
export const validatePassword = (
  password: string, 
  options: PasswordOptions = {}
): ValidationResult => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
    maxLength = 128
  } = options;

  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  if (password.length > maxLength) {
    errors.push(`Password must be no more than ${maxLength} characters long`);
  }
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>_+=\-\[\]\\;'\/~`]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common weak patterns
  if (password.toLowerCase().includes('password')) {
    errors.push('Password cannot contain the word "password"');
  }

  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password cannot contain more than 2 consecutive identical characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Enhanced phone number validation with country code support
export const isValidPhoneNumber = (phone: string, countryCode?: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove all non-digit characters except +
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // Basic international format validation
  if (countryCode === 'US') {
    // US phone number: 10 digits
    const usPhoneRegex = /^(\+1)?[2-9]\d{2}[2-9]\d{2}\d{4}$/;
    return usPhoneRegex.test(cleanPhone);
  }
  
  // International format: + followed by 1-15 digits
  const intlPhoneRegex = /^\+[1-9]\d{1,14}$/;
  // National format: 7-15 digits
  const nationalPhoneRegex = /^[1-9]\d{6,14}$/;
  
  return intlPhoneRegex.test(cleanPhone) || nationalPhoneRegex.test(cleanPhone);
};

// Enhanced name validation
export const isValidName = (name: string, options: { minLength?: number; maxLength?: number } = {}): ValidationResult => {
  const { minLength = 2, maxLength = 50 } = options;
  const errors: string[] = [];

  if (!name || typeof name !== 'string') {
    errors.push('Name is required');
    return { isValid: false, errors };
  }

  const trimmedName = name.trim();
  
  if (trimmedName.length < minLength) {
    errors.push(`Name must be at least ${minLength} characters long`);
  }
  
  if (trimmedName.length > maxLength) {
    errors.push(`Name must be no more than ${maxLength} characters long`);
  }

  // Allow letters, spaces, hyphens, apostrophes, and common international characters
  if (!/^[a-zA-ZÀ-ÿ\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\s\-'\.]+$/.test(trimmedName)) {
    errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
  }

  // Prevent excessive consecutive spaces or special characters
  if (/\s{2,}/.test(trimmedName) || /[\-'\.]{2,}/.test(trimmedName)) {
    errors.push('Name cannot contain consecutive spaces or special characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Enhanced URL validation
export const isValidUrl = (url: string, options: { allowedProtocols?: string[] } = {}): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  const { allowedProtocols = ['http:', 'https:'] } = options;
  
  try {
    const parsedUrl = new URL(url.trim());
    
    // Check if protocol is allowed
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      return false;
    }
    
    // Additional security checks
    if (parsedUrl.hostname === '') return false;
    if (parsedUrl.hostname.includes('..')) return false;
    
    return true;
  } catch {
    return false;
  }
};

// Enhanced required field validation with better type checking
export const isRequired = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !isNaN(value);
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
};

// Enhanced numeric validation
export const isValidNumber = (value: unknown, min?: number, max?: number): ValidationResult => {
  const errors: string[] = [];
  
  let num: number;
  if (typeof value === 'string') {
    num = parseFloat(value.trim());
  } else if (typeof value === 'number') {
    num = value;
  } else {
    errors.push('Value must be a number');
    return { isValid: false, errors };
  }
  
  if (isNaN(num) || !isFinite(num)) {
    errors.push('Value must be a valid number');
    return { isValid: false, errors };
  }
  
  if (min !== undefined && num < min) {
    errors.push(`Value must be at least ${min}`);
  }
  
  if (max !== undefined && num > max) {
    errors.push(`Value must be no more than ${max}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Enhanced integer validation
export const isValidInteger = (value: unknown, min?: number, max?: number): ValidationResult => {
  const errors: string[] = [];
  
  let num: number;
  if (typeof value === 'string') {
    num = parseInt(value.trim(), 10);
  } else if (typeof value === 'number') {
    num = value;
  } else {
    errors.push('Value must be an integer');
    return { isValid: false, errors };
  }
  
  if (isNaN(num) || !Number.isInteger(num)) {
    errors.push('Value must be a valid integer');
    return { isValid: false, errors };
  }
  
  if (min !== undefined && num < min) {
    errors.push(`Value must be at least ${min}`);
  }
  
  if (max !== undefined && num > max) {
    errors.push(`Value must be no more than ${max}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Enhanced date validation
export const isValidDate = (date: string | Date): ValidationResult => {
  const errors: string[] = [];
  
  let parsedDate: Date;
  
  if (date instanceof Date) {
    parsedDate = date;
  } else if (typeof date === 'string') {
    if (!date.trim()) {
      errors.push('Date is required');
      return { isValid: false, errors };
    }
    parsedDate = new Date(date.trim());
  } else {
    errors.push('Date must be a string or Date object');
    return { isValid: false, errors };
  }
  
  if (isNaN(parsedDate.getTime())) {
    errors.push('Invalid date format');
  }

  // Check for reasonable date range (year 1900-2100)
  const year = parsedDate.getFullYear();
  if (year < 1900 || year > 2100) {
    errors.push('Date must be between 1900 and 2100');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Enhanced file size formatter
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  if (bytes < 0) return 'Invalid size';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  if (i >= sizes.length) return 'File too large';
  
  const size = bytes / Math.pow(k, i);
  return `${size.toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
};

// Comprehensive validation utilities object
const validationUtils = {
  isValidEmail,
  validatePassword,
  isValidPhoneNumber,
  isValidName,
  isValidUrl,
  isRequired,
  isValidNumber,
  isValidInteger,
  isValidDate,
  formatFileSize
};

export default validationUtils;