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

const formattersCache = new Map<
  string,
  Intl.NumberFormat | Intl.DateTimeFormat | Intl.ListFormat
>();

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
// =============================================================================

export const formatNumber = (num: number, options: NumberFormatOptions = {}): string => {
  if (!Number.isFinite(num)) {
    return num.toString();
  }

  const { locale = 'en-IN', ...intlOptions } = options;
  const formatter = getCachedFormatter('number', locale, intlOptions);

  return formatter.format(num);
};

// THE FIX: Changed defaults to INR and en-IN
export const formatCurrency = (
  amount: number,
  currency: string = 'INR',
  locale: string = 'en-IN',
  options: Intl.NumberFormatOptions = {}
): string => {
  return formatNumber(amount, {
    locale,
    style: 'currency',
    currency,
    ...options,
  });
};

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
    maximumFractionDigits: i === 0 ? 0 : decimals,
  })} ${sizes[i]}`;
};

// =============================================================================
// =============================================================================

export const toTitleCase = (str: string, options: StringCaseOptions = {}): string => {
  if (!str) return '';

  const { preserveAcronyms = true } = options;

  const articles = new Set([
    'a',
    'an',
    'and',
    'as',
    'at',
    'but',
    'by',
    'for',
    'if',
    'in',
    'nor',
    'of',
    'on',
    'or',
    'so',
    'the',
    'to',
    'up',
    'yet',
  ]);

  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (index === 0 || !articles.has(word)) {
        if (preserveAcronyms && word.toUpperCase() === word && word.length <= 4) {
          return word.toUpperCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(' ');
};

export const snakeToTitleCase = (str: string): string => {
  if (!str) return '';

  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const formatEmail = (email: string): string => {
  if (!email) return '';

  return email.trim().toLowerCase();
};

// =============================================================================
// =============================================================================

type FormatDateOptions = Intl.DateTimeFormatOptions & {
  locale?: string;
  format?:
    | 'short'
    | 'medium'
    | 'long'
    | 'full'
    | 'ddmmyyyy'
    | 'yyyy-mm-dd'
    | 'dd/mm/yyyy'
    | 'mm/dd/yyyy'
    | 'dd MMM yyyy'
    | 'dd-mm-yyyy';
};

const DATE_FORMATS: Record<'short' | 'medium' | 'long' | 'full', Intl.DateTimeFormatOptions> = {
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
    locale = 'en-IN', // Changed default
    format,
    ...intlOptions
  } = options;

  try {
    if (typeof date === 'string') {
      const trimmed = date.trim();
      if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
        return 'No Date';
      }
    }

    const dateObj = new Date(date);

    if (isNaN(dateObj.getTime()) || isSuspiciousUnixEpoch(date, dateObj)) {
      return 'No Date';
    }

    if (typeof format === 'string') {
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear().toString();
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
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
      }
    }

    const mergedOptions = {
      ...(format && DATE_FORMATS[format as keyof typeof DATE_FORMATS]),
      ...intlOptions,
    };

    const formatter = getCachedFormatter('date', locale, mergedOptions);
    return formatter.format(dateObj);
  } catch {
    return 'No Date';
  }
};

function isSuspiciousUnixEpoch(originalInput: Date | string | number, dateObj: Date): boolean {
  const time = dateObj.getTime();
  const isUnixEpoch = time === 0; // January 1, 1970 00:00:00 UTC

  if (!isUnixEpoch) return false;

  if (originalInput instanceof Date) {
    return false;
  }

  if (originalInput === 0) {
    return false;
  }

  if (typeof originalInput === 'number') {
    return true;
  }

  if (typeof originalInput === 'string') {
    const trimmed = originalInput.trim();

    const validUnixEpochStrings = [
      '0',
      '1970-01-01',
      '01/01/1970',
      '1/1/1970',
      '01-01-1970',
      '1970-01-01T00:00:00.000Z',
      '1970-01-01T00:00:00Z',
    ];

    const isExactMatch =
      validUnixEpochStrings.includes(trimmed) ||
      validUnixEpochStrings.includes(trimmed.toLowerCase());

    return !isExactMatch;
  }

  return true;
}

// =============================================================================
// =============================================================================

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

export const formatValidationErrors = (
  errors: ValidationError[] | Record<string, string>
): string[] => {
  if (Array.isArray(errors)) {
    return errors
      .filter((error) => error.message?.trim())
      .map((error) => `${toTitleCase(error.field.replace(/([A-Z])/g, ' $1'))}: ${error.message}`);
  }

  return Object.entries(errors)
    .filter(([, message]) => message?.trim())
    .map(([field, message]) => `${toTitleCase(field.replace(/([A-Z])/g, ' $1'))}: ${message}`);
};

// =============================================================================
// =============================================================================

export const normalizeSearchQuery = (query: string): string => {
  if (!query) return '';

  return query
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .toLowerCase();
};

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

  terms.forEach((term) => {
    if (!term.trim()) return;

    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = wholeWords ? `\\b${escapedTerm}\\b` : escapedTerm;
    const regex = new RegExp(pattern, flags);

    result = result.replace(regex, `<span class="${className}">$&</span>`);
  });

  return result;
};

export const sanitizeSheetFileName = (name: string) => {
  return name
    .replace(/[*?:\\/\[\]]/g, '_') // replace invalid chars
    .substring(0, 31); // Excel limit (31 chars)
};

export const formatIP = (ip: unknown): string => {
  if (!ip || typeof ip !== 'string') return '';
  // Split by '/' to remove subnet mask if present (e.g., "192.168.1.1/32" -> "192.168.1.1")
  return ip.split('/')[0];
};

// =============================================================================
// =============================================================================

const formatters = {
  formatNumber,
  formatCurrency,
  formatFileSize,

  toTitleCase,
  snakeToTitleCase,
  formatEmail,

  formatDate,

  formatErrorMessage,
  formatValidationErrors,

  normalizeSearchQuery,
  highlightSearchTerms,
  sanitizeSheetFileName,
  formatIP,
};

export default formatters;
