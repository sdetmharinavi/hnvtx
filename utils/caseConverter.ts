/**
 * Type-safe case conversion utilities for JavaScript objects
 * Supports deep nested objects and arrays with proper TypeScript inference
 */

// === TYPE DEFINITIONS ===

/**
 * Primitive values that don't need transformation
 * Note: Functions are treated as primitives and returned as-is
 */
type Primitive = string | number | boolean | null | undefined | Date | RegExp;

/**
 * Check if a value is a plain object (not Date, Array, etc.)
 */
type IsPlainObject<T> = T extends Primitive
  ? false
  : T extends readonly unknown[]
  ? false
  : T extends Record<string, unknown>
  ? true
  : false;

/**
 * Transform object keys while preserving type structure
 */
type TransformKeys<T, U extends string> = T extends Primitive
  ? T
  : T extends readonly (infer Item)[]
  ? readonly TransformKeys<Item, U>[]
  : IsPlainObject<T> extends true
  ? {
      [K in keyof T as K extends string ? U : K]: TransformKeys<T[K], U>
    }
  : T;

// Case transformation type mappings
type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}`
  ? `${P1}${Capitalize<CamelCase<P2>>}`
  : S;

type SnakeCase<S extends string> = S extends `${infer C}${infer T}`
  ? C extends Lowercase<C>
    ? `${C}${SnakeCase<T>}`
    : `_${Lowercase<C>}${SnakeCase<T>}`
  : S;

type KebabCase<S extends string> = S extends `${infer C}${infer T}`
  ? C extends Lowercase<C>
    ? `${C}${KebabCase<T>}`
    : `-${Lowercase<C>}${KebabCase<T>}`
  : S;

type PascalCase<S extends string> = Capitalize<CamelCase<S>>;

type ScreamingSnakeCase<S extends string> = Uppercase<
  S extends `${infer C}${infer T}`
    ? C extends Lowercase<C>
      ? `${C}${ScreamingSnakeCase<T>}`
      : `_${Lowercase<C>}${ScreamingSnakeCase<T>}`
    : S
>;

// === UTILITY FUNCTIONS ===

/**
 * Type guard to check if a value is a plain object
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof RegExp) &&
    typeof value !== 'function'
  );
}

/**
 * Type guard to check if a value is primitive
 */
function isPrimitive(value: unknown): value is Primitive {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value instanceof Date ||
    value instanceof RegExp ||
    typeof value === 'function'
  );
}

// === KEY TRANSFORMATION FUNCTIONS ===

/**
 * Convert string to camelCase
 */
function toCamelCaseKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

/**
 * Convert string to snake_case
 */
function toSnakeCaseKey(key: string): string {
  return key.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`);
}

/**
 * Convert string to PascalCase
 */
function toPascalCaseKey(key: string): string {
  const camelKey = toCamelCaseKey(key);
  return camelKey.charAt(0).toUpperCase() + camelKey.slice(1);
}

/**
 * Convert string to kebab-case
 */
function toKebabCaseKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

/**
 * Convert string to SCREAMING_SNAKE_CASE
 */
function toScreamingSnakeCaseKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/-/g, '_')
    .toUpperCase();
}

// === GENERIC CONVERTER FACTORY ===

/**
 * Key transformation function type
 */
type KeyTransformer = (key: string) => string;

/**
 * Creates a type-safe object converter function
 */
function createConverter<T extends KeyTransformer>(transformer: T) {
  function convert<TInput>(input: TInput): TransformKeys<TInput, string> {
    if (isPrimitive(input)) {
      return input as TransformKeys<TInput, string>;
    }

    if (Array.isArray(input)) {
      return input.map(convert) as TransformKeys<TInput, string>;
    }

    if (isPlainObject(input)) {
      const result: Record<string, unknown> = {};
      
      for (const [key, value] of Object.entries(input)) {
        const transformedKey = transformer(key);
        result[transformedKey] = convert(value);
      }
      
      return result as TransformKeys<TInput, string>;
    }

    return input as TransformKeys<TInput, string>;
  }

  return convert;
}

// === EXPORTED CONVERTERS ===

/**
 * Converts object keys to camelCase
 * 
 * @example
 * ```typescript
 * const input = { user_name: 'John', user_age: 30 };
 * const output = toCamelCase(input);
 * // Result: { userName: 'John', userAge: 30 }
 * ```
 */
export const toCamelCase = createConverter(toCamelCaseKey);

/**
 * Converts object keys to snake_case
 * 
 * @example
 * ```typescript
 * const input = { userName: 'John', userAge: 30 };
 * const output = toSnakeCase(input);
 * // Result: { user_name: 'John', user_age: 30 }
 * ```
 */
export const toSnakeCase = createConverter(toSnakeCaseKey);

/**
 * Converts object keys to PascalCase
 * 
 * @example
 * ```typescript
 * const input = { user_name: 'John', user_age: 30 };
 * const output = toPascalCase(input);
 * // Result: { UserName: 'John', UserAge: 30 }
 * ```
 */
export const toPascalCase = createConverter(toPascalCaseKey);

/**
 * Converts object keys to kebab-case
 * 
 * @example
 * ```typescript
 * const input = { userName: 'John', userAge: 30 };
 * const output = toKebabCase(input);
 * // Result: { 'user-name': 'John', 'user-age': 30 }
 * ```
 */
export const toKebabCase = createConverter(toKebabCaseKey);

/**
 * Converts object keys to SCREAMING_SNAKE_CASE
 * 
 * @example
 * ```typescript
 * const input = { userName: 'John', userAge: 30 };
 * const output = toScreamingSnakeCase(input);
 * // Result: { USER_NAME: 'John', USER_AGE: 30 }
 * ```
 */
export const toScreamingSnakeCase = createConverter(toScreamingSnakeCaseKey);

// === ADVANCED USAGE ===

/**
 * Creates a custom converter with a user-defined transformation function
 * 
 * @param transformer - Function that transforms a single key
 * @returns A converter function that applies the transformation recursively
 * 
 * @example
 * ```typescript
 * const addPrefix = createCustomConverter(key => `prefix_${key}`);
 * const input = { name: 'John', age: 30 };
 * const output = addPrefix(input);
 * // Result: { prefix_name: 'John', prefix_age: 30 }
 * ```
 */
export const createCustomConverter = createConverter;

// === TYPE EXPORTS FOR ADVANCED USAGE ===

export type {
  TransformKeys,
  KeyTransformer,
  CamelCase,
  SnakeCase,
  KebabCase,
  PascalCase,
  ScreamingSnakeCase,
  Primitive,
  IsPlainObject
};

// === USAGE EXAMPLES ===

/**
 * Example usage with Supabase or similar database libraries
 * 
 * @example
 * ```typescript
 * interface UserProfile {
 *   id: string;
 *   firstName: string;
 *   lastName: string;
 *   createdAt: Date;
 * }
 * 
 * // Converting from database (snake_case) to frontend (camelCase)
 * const { data } = await supabase.from('user_profiles').select('*');
 * const profiles: UserProfile[] = data?.map(toCamelCase) ?? [];
 * 
 * // Converting from frontend (camelCase) to database (snake_case)
 * const newProfile: Partial<UserProfile> = {
 *   firstName: 'John',
 *   lastName: 'Doe'
 * };
 * await supabase.from('user_profiles').insert(toSnakeCase(newProfile));
 * ```
 */

/**
 * Example with nested objects and arrays
 * 
 * @example
 * ```typescript
 * const complexData = {
 *   user_profile: {
 *     personal_info: {
 *       first_name: 'Jane',
 *       last_name: 'Smith'
 *     },
 *     contact_methods: [
 *       { method_type: 'email', contact_value: 'jane@example.com' },
 *       { method_type: 'phone', contact_value: '+1234567890' }
 *     ]
 *   },
 *   created_at: new Date(),
 *   is_active: true
 * };
 * 
 * const camelCaseData = toCamelCase(complexData);
 * // TypeScript knows the exact shape of the result!
 * // camelCaseData.userProfile.personalInfo.firstName is properly typed
 * ```
 */