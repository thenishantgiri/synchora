import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeChannelName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Allow letters, numbers, spaces & dashes
    .replace(/\s+/g, "-") // Replace whitespace with dash
    .replace(/-+/g, "-") // Collapse multiple dashes
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing dashes
}
