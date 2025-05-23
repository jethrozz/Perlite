import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  let dateStr = new Date(date).toLocaleString();
  let splitDate = dateStr.split(" ");
  return `${dateStr}`;
}
export function showAddress(address: string): string {
  return truncateMiddle(address, 4, 4);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function getInitials(name: string): string {
  if (!name) return "";

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return name.slice(0, 2).toUpperCase();
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
export function showStatus(status: number | undefined): string {
  let result = "";
  if (status == 0) {
    result = "未发布";
  } else if (status == 1) {
    result = "已发布";
  } else if (status == 2) {
    result = "已下架";
  }

  return result;
}

export function truncateMiddle(
  str: string,
  startLength: number = 4,
  endLength: number = 4,
): string {
  if (!str) return "";
  if (str.length <= startLength + endLength) return str;

  const start = str.slice(0, startLength);
  const end = str.slice(str.length - endLength);

  return `${start}...${end}`;
}

export function getRandomGradient() {
  const gradients = [
    "from-purple-600 to-pink-500",
    "from-purple-800 to-violet-500",
    "from-cyan-500 to-purple-600",
    "from-indigo-600 to-purple-500",
    "from-fuchsia-600 to-violet-500",
  ];

  return gradients[Math.floor(Math.random() * gradients.length)];
}

export const cyberpunkColors = {
  purple: "hsl(var(--cyber-purple))",
  magenta: "hsl(var(--cyber-magenta))",
  cyan: "hsl(var(--cyber-cyan))",
  dark: "hsl(var(--cyber-dark))",
  surface: "hsl(var(--cyber-surface))",
  text: "hsl(var(--cyber-text))",
  glow: "hsl(var(--cyber-glow))",
};

export function createCursor(color = "#8A2BE2") {
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(
    color,
  )}' stroke-width='2'%3E%3Cpath d='M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z'/%3E%3Cpath d='M13 13l6 6'/%3E%3C/svg%3E"), auto`;
}
