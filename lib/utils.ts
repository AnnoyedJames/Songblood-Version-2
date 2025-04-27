import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function formatBloodType(bloodType: string, rh?: string): string {
  if (rh) {
    return `${bloodType}${rh}`
  }
  return bloodType
}

export function getBloodTypeColor(bloodType: string, rh?: string): string {
  switch (bloodType) {
    case "A":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
    case "B":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
    case "AB":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
    case "O":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
