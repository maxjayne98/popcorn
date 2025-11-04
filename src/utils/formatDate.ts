export type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatYear(value: DateInput): string {
  const date = toDate(value);
  if (!date) {
    return '';
  }
  return date.getFullYear().toString();
}
