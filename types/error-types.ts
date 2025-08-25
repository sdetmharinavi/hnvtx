export type DetailedError = Error & { details?: unknown };

export function hasDetails(error: unknown): error is DetailedError {
  return typeof error === "object" && error !== null && "details" in error;
}