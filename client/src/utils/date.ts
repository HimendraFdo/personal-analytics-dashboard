//Helper methods to covert Date data type variables from string to Date and vice versa.
export function formatDateForInput(date: Date | string): string {
  const parsedDate = date instanceof Date ? date : new Date(date);
  return parsedDate.toISOString().split("T")[0];
}

export function parseStoredDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}