import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSafeDate(dateString: string | Date | undefined | null, formatStr: string) {
  if (!dateString) return 'N/A';
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return 'N/A';
    return format(date, formatStr);
  } catch (e) {
    return 'N/A';
  }
}

export function formatSafeDistanceToNow(dateString: string | Date | undefined | null) {
  if (!dateString) return 'recently';
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return 'recently';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (e) {
    return 'recently';
  }
}
