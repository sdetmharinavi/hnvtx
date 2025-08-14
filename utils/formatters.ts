/**
 * Professional data formatting utility library
 * Provides comprehensive formatting functions with optimizations and error handling
 */

// Types and interfaces
export interface NumberFormatOptions extends Intl.NumberFormatOptions {
  locale?: string;
}

export interface PhoneFormatOptions {
  format?: 'US' | 'international' | 'E164';
}

export interface ListFormatOptions {
  conjunction?: 'and' | 'or';
  style?: 'long' | 'short' | 'narrow';
  type?: 'conjunction' | 'disjunction' | 'unit';
}

export interface StringCaseOptions {
  preserveAcronyms?: boolean;
  delimiter?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Performance optimizations - cached formatters
const formattersCache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat | Intl.ListFormat>();

// Overloaded function signatures for type safety
function getCachedFormatter(
  type: 'number',
  locale: string,
  options: Intl.NumberFormatOptions
): Intl.NumberFormat;
function getCachedFormatter(
  type: 'date',
  locale: string,
  options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat;
function getCachedFormatter(
  type: 'list',
  locale: string,
  options: Intl.ListFormatOptions
): Intl.ListFormat;
function getCachedFormatter(
  type: 'number' | 'date' | 'list',
  locale: string,
  options: Intl.NumberFormatOptions | Intl.DateTimeFormatOptions | Intl.ListFormatOptions
): Intl.NumberFormat | Intl.DateTimeFormat | Intl.ListFormat {
  const key = `${type}-${locale}-${JSON.stringify(options)}`;
  
  if (!formattersCache.has(key)) {
    let formatter: Intl.NumberFormat | Intl.DateTimeFormat | Intl.ListFormat;
    switch (type) {
      case 'number':
        formatter = new Intl.NumberFormat(locale, options as Intl.NumberFormatOptions);
        break;
      case 'date':
        formatter = new Intl.DateTimeFormat(locale, options as Intl.DateTimeFormatOptions);
        break;
      case 'list':
        formatter = new Intl.ListFormat(locale, options as Intl.ListFormatOptions);
        break;
      default:
        throw new Error(`Unsupported formatter type: ${type}`);
    }
    formattersCache.set(key, formatter);
  }
  
  return formattersCache.get(key)!;
}

// =============================================================================
// NUMBER FORMATTERS
// =============================================================================

/**
 * Format a number with locale-aware formatting
 */
export const formatNumber = (
  num: number,
  options: NumberFormatOptions = {}
): string => {
  if (!Number.isFinite(num)) {
    return num.toString();
  }

  const { locale = 'en-US', ...intlOptions } = options;
  const formatter = getCachedFormatter('number', locale, intlOptions);
  
  return formatter.format(num);
};

/**
 * Format a number as currency
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US',
  options: Intl.NumberFormatOptions = {}
): string => {
  return formatNumber(amount, {
    locale,
    style: 'currency',
    currency,
    ...options
  });
};

/**
 * Format a number as percentage
 */
export const formatPercentage = (
  value: number,
  decimals: number = 1,
  locale: string = 'en-US'
): string => {
  return formatNumber(value / 100, {
    locale,
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Format a score with optional fraction display
 */
export const formatScore = (
  score: number,
  total: number,
  options: {
    showFraction?: boolean;
    decimals?: number;
    locale?: string;
  } = {}
): string => {
  const { showFraction = true, decimals = 1, locale = 'en-US' } = options;
  
  if (total <= 0) {
    return showFraction ? `${score}/0 (0%)` : '0%';
  }

  const percentage = (score / total) * 100;
  const formattedPercentage = formatPercentage(percentage, decimals, locale);
  
  return showFraction 
    ? `${formatNumber(score, { locale })}/${formatNumber(total, { locale })} (${formattedPercentage})`
    : formattedPercentage;
};

/**
 * Format file size in human-readable format
 */
export const formatFileSize = (
  bytes: number,
  options: {
    binary?: boolean;
    decimals?: number;
    locale?: string;
  } = {}
): string => {
  const { binary = false, decimals = 2, locale = 'en-US' } = options;
  
  if (bytes === 0) return '0 B';
  if (!Number.isFinite(bytes) || bytes < 0) return 'Invalid size';

  const base = binary ? 1024 : 1000;
  const sizes = binary 
    ? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'] 
    : ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(base));
  const size = bytes / Math.pow(base, i);
  
  return `${formatNumber(size, { 
    locale,
    minimumFractionDigits: i === 0 ? 0 : decimals,
    maximumFractionDigits: i === 0 ? 0 : decimals
  })} ${sizes[i]}`;
};

// =============================================================================
// STRING FORMATTERS
// =============================================================================

/**
 * Convert string to title case with smart handling
 */
export const toTitleCase = (
  str: string,
  options: StringCaseOptions = {}
): string => {
  if (!str) return '';
  
  const { preserveAcronyms = true } = options;
  
  // Common words that should remain lowercase in titles
  const articles = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet']);
  
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      // Always capitalize first and last word
      if (index === 0 || !articles.has(word)) {
        // Preserve acronyms if option is set
        if (preserveAcronyms && word.toUpperCase() === word && word.length <= 4) {
          return word.toUpperCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(' ');
};

/**
 * Convert snake_case to Title Case
 */
export const snakeToTitleCase = (str: string): string => {
  if (!str) return '';
  
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Convert camelCase to kebab-case
 */
export const camelToKebab = (str: string): string => {
  if (!str) return '';
  
  return str
    .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
    .toLowerCase();
};

/**
 * Convert kebab-case to camelCase
 */
export const kebabToCamel = (str: string): string => {
  if (!str) return '';
  
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Convert snake_case to camelCase
 */
export const snakeToCamel = (str: string): string => {
  if (!str) return '';
  
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Convert camelCase to snake_case
 */
export const camelToSnake = (str: string): string => {
  if (!str) return '';
  
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
};

/**
 * Create URL-friendly slug from text
 */
export const createSlug = (
  text: string,
  options: {
    maxLength?: number;
    separator?: string;
    lowercase?: boolean;
  } = {}
): string => {
  const { maxLength = 50, separator = '-', lowercase = true } = options;
  
  if (!text) return '';
  
  let slug = text
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, separator) // Replace spaces with separator
    .replace(new RegExp(`${separator}+`, 'g'), separator) // Replace multiple separators
    .replace(new RegExp(`^${separator}|${separator}$`, 'g'), ''); // Remove leading/trailing separators
  
  if (lowercase) {
    slug = slug.toLowerCase();
  }
  
  if (maxLength && slug.length > maxLength) {
    slug = slug.substring(0, maxLength).replace(new RegExp(`${separator}$`), '');
  }
  
  return slug;
};

/**
 * Truncate text with smart word boundaries
 */
export const truncateText = (
  text: string,
  maxLength: number,
  options: {
    suffix?: string;
    preserveWords?: boolean;
  } = {}
): string => {
  const { suffix = '...', preserveWords = true } = options;
  
  if (!text || text.length <= maxLength) return text;
  
  if (!preserveWords) {
    return text.substring(0, maxLength - suffix.length) + suffix;
  }
  
  const words = text.split(' ');
  let truncated = '';
  
  for (const word of words) {
    const nextText = truncated ? `${truncated} ${word}` : word;
    if (nextText.length > maxLength - suffix.length) {
      break;
    }
    truncated = nextText;
  }
  
  return truncated ? truncated + suffix : text.substring(0, maxLength - suffix.length) + suffix;
};

// =============================================================================
// CONTACT INFORMATION FORMATTERS
// =============================================================================

/**
 * Format user name with various display options
 */
export const formatUserName = (
  firstName: string,
  lastName: string,
  format: 'full' | 'lastFirst' | 'initials' | 'firstInitial' = 'full'
): string => {
  const first = firstName?.trim() || '';
  const last = lastName?.trim() || '';
  
  if (!first && !last) return '';
  
  switch (format) {
    case 'full':
      return `${first} ${last}`.trim();
    case 'lastFirst':
      return last ? `${last}, ${first}`.trim() : first;
    case 'initials':
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    case 'firstInitial':
      return `${first.charAt(0).toUpperCase()}. ${last}`.trim();
    default:
      return `${first} ${last}`.trim();
  }
};

/**
 * Format phone number with international support
 */
export const formatPhoneNumber = (
  phone: string,
  options: PhoneFormatOptions = {}
): string => {
  const { format = 'US' } = options;
  
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  switch (format) {
    case 'US':
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      }
      if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
      }
      break;
      
    case 'E164':
      if (cleaned.length === 10) {
        return `+1${cleaned}`;
      }
      if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return `+${cleaned}`;
      }
      break;
      
    case 'international':
      // Basic international formatting - could be expanded
      if (cleaned.length >= 10) {
        return `+${cleaned}`;
      }
      break;
  }
  
  return phone; // Return original if can't format
};

/**
 * Format email address (basic validation and normalization)
 */
export const formatEmail = (email: string): string => {
  if (!email) return '';
  
  return email.trim().toLowerCase();
};

// =============================================================================
// DATE AND TIME FORMATTERS
// =============================================================================

/**
 * Format date with locale support
 */
type FormatDateOptions = Intl.DateTimeFormatOptions & {
  locale?: string;
  format?: 'short' | 'medium' | 'long' | 'full' | 'ddmmyyyy' | 'yyyy-mm-dd' | 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'dd MMM yyyy' | 'dd-mm-yyyy';
};

const DATE_FORMATS: Record<
  'short' | 'medium' | 'long' | 'full',
  Intl.DateTimeFormatOptions
> = {
  short: { year: '2-digit', month: 'numeric', day: 'numeric' },
  medium: { year: 'numeric', month: 'short', day: 'numeric' },
  long: { year: 'numeric', month: 'long', day: 'numeric' },
  full: {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
};

export const formatDate = (
  date: Date | string | number,
  options: FormatDateOptions = {}
): string => {
  const {
    locale = 'en-US',
    format,
    ...intlOptions
  } = options;

  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';

    // Handle custom string formats
    if (typeof format === 'string') {
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear().toString();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[dateObj.getMonth()];

      switch (format) {
        case 'ddmmyyyy':
          return `${day}${month}${year}`;
        case 'yyyy-mm-dd':
          return `${year}-${month}-${day}`;
        case 'dd-mm-yyyy':
          return `${day}-${month}-${year}`;
        case 'dd/mm/yyyy':
          return `${day}/${month}/${year}`;
        case 'mm/dd/yyyy':
          return `${month}/${day}/${year}`;
        case 'dd MMM yyyy':
          return `${day} ${monthName} ${year}`;
        // Fall through to Intl formats below
      }
    }

    // Use Intl for short/medium/long/full/custom Intl options
    const mergedOptions = {
      ...(format && DATE_FORMATS[format as keyof typeof DATE_FORMATS]),
      ...intlOptions,
    };

    const formatter = getCachedFormatter('date', locale, mergedOptions);
    return formatter.format(dateObj);
  } catch {
    return 'Invalid Date';
  }
};



/**
 * Format time range
 */
export const formatTimeRange = (
  startTime: Date | string,
  endTime: Date | string,
  options: Intl.DateTimeFormatOptions & { locale?: string } = {}
): string => {
  const { locale = 'en-US', ...intlOptions } = options;
  
  const formatOptions = {
    hour: 'numeric' as const,
    minute: '2-digit' as const,
    ...intlOptions
  };
  
  const start = formatDate(startTime, { locale, ...formatOptions });
  const end = formatDate(endTime, { locale, ...formatOptions });
  
  return `${start} - ${end}`;
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (
  date: Date | string | number,
  locale: string = 'en-US'
): string => {
  try {
    const dateObj = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
    if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
    
    // For older dates, return formatted date
    return formatDate(dateObj, { locale, dateStyle: 'medium' });
  } catch {
    return 'Invalid Date';
  }
};

// =============================================================================
// LIST AND ARRAY FORMATTERS
// =============================================================================

/**
 * Format array as a grammatically correct list
 */
export const formatList = (
  items: (string | number)[],
  options: ListFormatOptions & { locale?: string } = {}
): string => {
  const { locale = 'en-US', conjunction = 'and', ...intlOptions } = options;
  
  if (!Array.isArray(items) || items.length === 0) return '';
  
  const stringItems = items.map(String).filter(Boolean);
  
  if (stringItems.length === 0) return '';
  if (stringItems.length === 1) return stringItems[0];
  
  try {
    const listFormatOptions: Intl.ListFormatOptions = {
      style: 'long',
      type: conjunction === 'or' ? 'disjunction' : 'conjunction',
      ...intlOptions
    };
    
    const formatter = getCachedFormatter('list', locale, listFormatOptions);
    
    return formatter.format(stringItems);
  } catch {
    // Fallback for older browsers
    if (stringItems.length === 2) {
      return `${stringItems[0]} ${conjunction} ${stringItems[1]}`;
    }
    
    const lastItem = stringItems[stringItems.length - 1];
    const otherItems = stringItems.slice(0, -1);
    return `${otherItems.join(', ')}, ${conjunction} ${lastItem}`;
  }
};

/**
 * Format array with truncation support
 */
export const formatArrayWithLimit = (
  items: (string | number)[],
  options: {
    maxItems?: number;
    moreText?: string;
    conjunction?: 'and' | 'or';
    locale?: string;
  } = {}
): string => {
  const { maxItems = 5, moreText = 'more', conjunction = 'and', locale = 'en-US' } = options;
  
  if (!Array.isArray(items) || items.length === 0) return '';
  
  const stringItems = items.map(String).filter(Boolean);
  
  if (stringItems.length <= maxItems) {
    return formatList(stringItems, { conjunction, locale });
  }
  
  const visibleItems = stringItems.slice(0, maxItems);
  const remainingCount = stringItems.length - maxItems;
  
  return `${formatList(visibleItems, { conjunction, locale })} and ${remainingCount} ${moreText}`;
};

// =============================================================================
// ERROR AND VALIDATION FORMATTERS
// =============================================================================

/**
 * Format error messages consistently
 */
export const formatErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    if ('error' in error && typeof error.error === 'string') {
      return error.error;
    }
  }
  return 'An unexpected error occurred';
};

/**
 * Format validation errors with field names
 */
export const formatValidationErrors = (
  errors: ValidationError[] | Record<string, string>
): string[] => {
  if (Array.isArray(errors)) {
    return errors
      .filter(error => error.message?.trim())
      .map(error => `${toTitleCase(error.field.replace(/([A-Z])/g, ' $1'))}: ${error.message}`);
  }
  
  return Object.entries(errors)
    .filter(([, message]) => message?.trim())
    .map(([field, message]) => `${toTitleCase(field.replace(/([A-Z])/g, ' $1'))}: ${message}`);
};

// =============================================================================
// SEARCH AND UTILITY FORMATTERS
// =============================================================================

/**
 * Normalize search query
 */
export const normalizeSearchQuery = (query: string): string => {
  if (!query) return '';
  
  return query
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .toLowerCase();
};

/**
 * Highlight search terms in text
 */
export const highlightSearchTerms = (
  text: string,
  searchTerms: string | string[],
  options: {
    className?: string;
    caseSensitive?: boolean;
    wholeWords?: boolean;
  } = {}
): string => {
  const { className = 'highlight', caseSensitive = false, wholeWords = false } = options;
  
  if (!text || !searchTerms) return text;
  
  const terms = Array.isArray(searchTerms) ? searchTerms : [searchTerms];
  const flags = caseSensitive ? 'g' : 'gi';
  
  let result = text;
  
  terms.forEach(term => {
    if (!term.trim()) return;
    
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = wholeWords ? `\\b${escapedTerm}\\b` : escapedTerm;
    const regex = new RegExp(pattern, flags);
    
    result = result.replace(regex, `<span class="${className}">$&</span>`);
  });
  
  return result;
};

// =============================================================================
// EXPORTS
// =============================================================================

const formatters = {
  // Numbers
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatScore,
  formatFileSize,
  
  // Strings
  toTitleCase,
  snakeToTitleCase,
  camelToKebab,
  kebabToCamel,
  snakeToCamel,
  camelToSnake,
  createSlug,
  truncateText,
  
  // Contact
  formatUserName,
  formatPhoneNumber,
  formatEmail,
  
  // Dates
  formatDate,
  formatTimeRange,
  formatRelativeTime,
  
  // Lists
  formatList,
  formatArrayWithLimit,
  
  // Errors
  formatErrorMessage,
  formatValidationErrors,
  
  // Search
  normalizeSearchQuery,
  highlightSearchTerms,
};

export default formatters;