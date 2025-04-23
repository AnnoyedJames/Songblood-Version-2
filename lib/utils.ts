import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date to Thai locale
export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Format blood type with Rh factor
export function formatBloodType(bloodType: string, rh?: string) {
  if (!rh || rh === "") {
    return bloodType
  }
  return `${bloodType}${rh}`
}

// Get color for blood type
export function getBloodTypeColor(bloodType: string, rh?: string) {
  const fullType = formatBloodType(bloodType, rh)

  const colorMap: Record<string, string> = {
    "A+": "bg-blue-100 text-blue-800",
    "A-": "bg-blue-50 text-blue-600",
    "B+": "bg-green-100 text-green-800",
    "B-": "bg-green-50 text-green-600",
    "AB+": "bg-purple-100 text-purple-800",
    "AB-": "bg-purple-50 text-purple-600",
    "O+": "bg-red-100 text-red-800",
    "O-": "bg-red-50 text-red-600",
    A: "bg-blue-100 text-blue-800",
    B: "bg-green-100 text-green-800",
    AB: "bg-purple-100 text-purple-800",
    O: "bg-red-100 text-red-800",
  }

  return colorMap[fullType] || "bg-gray-100 text-gray-800"
}
