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

// Enhanced time validation with format options
export const isValidTime = (time: string, format: '12' | '24' = '24'): ValidationResult => {
  const errors: string[] = [];
  
  if (!time || typeof time !== 'string') {
    errors.push('Time is required');
    return { isValid: false, errors };
  }

  const trimmedTime = time.trim();
  
  if (format === '24') {
    // 24-hour format: HH:MM or HH:MM:SS
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (!timeRegex.test(trimmedTime)) {
      errors.push('Time must be in HH:MM or HH:MM:SS format (24-hour)');
    }
  } else {
    // 12-hour format: HH:MM AM/PM
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM|am|pm)$/;
    if (!timeRegex.test(trimmedTime)) {
      errors.push('Time must be in HH:MM AM/PM format');
    }
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

// Enhanced future date validation
export const isFutureDate = (date: string | Date, allowToday = false): ValidationResult => {
  const dateValidation = isValidDate(date);
  if (!dateValidation.isValid) {
    return dateValidation;
  }

  const errors: string[] = [];
  const inputDate = typeof date === 'string' ? new Date(date.trim()) : date;
  const now = new Date();
  
  // Set time to start of day for comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const compareDate = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
  
  if (allowToday ? compareDate < today : compareDate <= today) {
    errors.push(allowToday ? 'Date must be today or in the future' : 'Date must be in the future');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Enhanced past date validation
export const isPastDate = (date: string | Date, allowToday = false): ValidationResult => {
  const dateValidation = isValidDate(date);
  if (!dateValidation.isValid) {
    return dateValidation;
  }

  const errors: string[] = [];
  const inputDate = typeof date === 'string' ? new Date(date.trim()) : date;
  const now = new Date();
  
  // Set time to start of day for comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const compareDate = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
  
  if (allowToday ? compareDate > today : compareDate >= today) {
    errors.push(allowToday ? 'Date must be today or in the past' : 'Date must be in the past');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Enhanced file validation
export const validateFile = (
  file: File,
  options: FileValidationOptions = {}
): ValidationResult => {
  const errors: string[] = [];

  if (!file || !(file instanceof File)) {
    errors.push('Valid file is required');
    return { isValid: false, errors };
  }

  // Check minimum file size
  if (options.minSize && file.size < options.minSize) {
    errors.push(`File size must be at least ${formatFileSize(options.minSize)}`);
  }

  // Check maximum file size
  if (options.maxSize && file.size > options.maxSize) {
    errors.push(`File size must be less than ${formatFileSize(options.maxSize)}`);
  }

  // Check file type
  if (options.allowedTypes && options.allowedTypes.length > 0) {
    if (!options.allowedTypes.includes(file.type)) {
      errors.push(`File type "${file.type}" is not allowed. Allowed types: ${options.allowedTypes.join(', ')}`);
    }
  }

  // Check file extension
  if (options.allowedExtensions && options.allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !options.allowedExtensions.map(ext => ext.toLowerCase()).includes(extension)) {
      errors.push(`File extension must be one of: ${options.allowedExtensions.join(', ')}`);
    }
  }

  // Check for potentially dangerous file names
  if (/[<>:"|?*]/.test(file.name)) {
    errors.push('File name contains invalid characters');
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

// Enhanced sanitization with more comprehensive XSS prevention
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')    // Must be first
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;');
};

// Credit card validation (Luhn algorithm)
export const isValidCreditCard = (cardNumber: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!cardNumber || typeof cardNumber !== 'string') {
    errors.push('Card number is required');
    return { isValid: false, errors };
  }

  // Remove spaces and hyphens
  const cleanCard = cardNumber.replace(/[\s-]/g, '');
  
  // Check if all digits
  if (!/^\d+$/.test(cleanCard)) {
    errors.push('Card number must contain only digits');
    return { isValid: false, errors };
  }

  // Check length
  if (cleanCard.length < 13 || cleanCard.length > 19) {
    errors.push('Card number must be between 13 and 19 digits');
    return { isValid: false, errors };
  }

  // Luhn algorithm
  let sum = 0;
  let alternate = false;
  
  for (let i = cleanCard.length - 1; i >= 0; i--) {
    let n = parseInt(cleanCard.charAt(i), 10);
    
    if (alternate) {
      n *= 2;
      if (n > 9) {
        n = (n % 10) + 1;
      }
    }
    
    sum += n;
    alternate = !alternate;
  }

  if (sum % 10 !== 0) {
    errors.push('Invalid card number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Enhanced validation schemas
export const validationSchemas = {
  register: {
    firstName: (value: string) => {
      const nameValidation = isValidName(value);
      return {
        isValid: isRequired(value) && nameValidation.isValid,
        error: !isRequired(value) ? 'First name is required' : nameValidation.errors[0] || ''
      };
    },
    lastName: (value: string) => {
      const nameValidation = isValidName(value);
      return {
        isValid: isRequired(value) && nameValidation.isValid,
        error: !isRequired(value) ? 'Last name is required' : nameValidation.errors[0] || ''
      };
    },
    email: (value: string) => ({
      isValid: isRequired(value) && isValidEmail(value),
      error: !isRequired(value) ? 'Email is required' : 
             !isValidEmail(value) ? 'Please enter a valid email address' : ''
    }),
    password: (value: string) => {
      const validation = validatePassword(value);
      return {
        isValid: validation.isValid,
        error: validation.errors[0] || ''
      };
    },
    confirmPassword: (value: string, password: string) => ({
      isValid: isRequired(value) && value === password,
      error: !isRequired(value) ? 'Please confirm your password' : 
             value !== password ? 'Passwords do not match' : ''
    })
  },

  login: {
    email: (value: string) => ({
      isValid: isRequired(value) && isValidEmail(value),
      error: !isRequired(value) ? 'Email is required' : 
             !isValidEmail(value) ? 'Please enter a valid email address' : ''
    }),
    password: (value: string) => ({
      isValid: isRequired(value),
      error: !isRequired(value) ? 'Password is required' : ''
    })
  }
};

// Enhanced generic form validator with better type safety
export const validateForm = <T extends Record<string, unknown>>(
  data: T,
  schema: Record<keyof T, (value: T[keyof T], ...args: unknown[]) => { isValid: boolean; error: string }>
): { isValid: boolean; errors: Record<keyof T, string> } => {
  const errors = {} as Record<keyof T, string>;
  let isValid = true;

  (Object.keys(schema) as Array<keyof T>).forEach(key => {
    try {
      const validation = schema[key](data[key]);
      if (!validation.isValid) {
        errors[key] = validation.error;
        isValid = false;
      }
    } catch (error) {
      console.error(`Validation error for field ${String(key)}:`, error);
      errors[key] = 'Validation error occurred';
      isValid = false;
    }
  });

  return { isValid, errors };
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
  isValidTime,
  isValidDate,
  isFutureDate,
  isPastDate,
  validateFile,
  formatFileSize,
  sanitizeInput,
  isValidCreditCard,
  validationSchemas,
  validateForm
};

export default validationUtils;