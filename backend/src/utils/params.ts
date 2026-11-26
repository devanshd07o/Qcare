/** Safely extract a single string from Express req.params or req.query (never an array). */
export function param(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}
