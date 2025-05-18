import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number with commas for better readability
 * @param num The number to format
 * @returns Formatted number string with commas
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Truncates a string if it's longer than the specified max length
 * @param str The string to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated string with ellipsis
 */
export function truncateString(str: string, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

/**
 * Extracts initials from a name
 * @param name Full name
 * @param maxChars Maximum number of characters
 * @returns Initials (e.g., "John Doe" -> "JD")
 */
export function getInitials(name: string, maxChars = 2): string {
  if (!name) return '';
  
  const parts = name.split(' ').filter(part => part.length > 0);
  const initials = parts.map(part => part[0]?.toUpperCase() || '').join('');
  
  return initials.slice(0, maxChars);
}

/**
 * Converts a date to a human-readable format
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Get time elapsed since a date in human-readable format
 * @param date Date to calculate elapsed time from
 * @returns Human-readable elapsed time (e.g., "3 days ago")
 */
export function timeAgo(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  // Less than a minute
  if (seconds < 60) {
    return 'just now';
  }
  
  // Less than an hour
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Less than a day
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Less than a month
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  
  // Less than a year
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  
  // More than a year
  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

/**
 * Get icon name for a category
 */
export function getCategoryIcon(iconName: string): string {
  return iconName || 'category';
}

/**
 * Generate a random avatar color based on a string
 * @param str String to generate color from
 * @returns Tailwind background color class
 */
export function getAvatarColor(str: string): string {
  if (!str) return 'bg-primary/30';
  
  const colors = [
    'bg-primary/30',
    'bg-secondary/30',
    'bg-accent/30',
    'bg-purple-600/30',
    'bg-blue-600/30',
    'bg-pink-600/30'
  ];
  
  // Simple hash function to get a deterministic color based on string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
