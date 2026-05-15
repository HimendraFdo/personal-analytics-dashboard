export function formatDateForInput(date: Date | string): string {
  const parsedDate = parseStoredDate(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }
  return parsedDate.toISOString().split("T")[0];
}

export function parseStoredDate(value: string | Date): Date {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? new Date() : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function formatDisplayDate(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }
  return date.toLocaleDateString();
}

export function parseApiDate(value: string): Date {
  return parseStoredDate(value);
}
