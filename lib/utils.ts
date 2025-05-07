import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a blood type with Rh factor
 */
export function formatBloodType(bloodType: string, rhFactor?: string): string {
  if (!bloodType) return ""

  if (rhFactor) {
    return `${bloodType}${rhFactor}`
  }

  return bloodType
}

/**
 * Formats a date to a readable string
 */
export function formatDate(date: string | Date): string {
  if (!date) return ""

  const d = new Date(date)
  return d.toLocaleDateString()
}

/**
 * Truncates a string to a specified length
 */
export function truncate(str: string, length: number): string {
  if (!str) return ""
  if (str.length <= length) return str

  return str.slice(0, length) + "..."
}
