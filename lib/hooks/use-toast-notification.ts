"use client"

import { useToast } from "@/components/ui/use-toast"
import { ErrorType, getUserFriendlyErrorMessage } from "@/lib/error-handling"

type ToastVariant = "default" | "destructive" | "success" | "warning" | undefined

interface ToastOptions {
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export function useToastNotification() {
  const { toast } = useToast()

  // Function to show a success toast
  const showSuccess = (message: string, options?: Omit<ToastOptions, "variant">) => {
    toast({
      title: options?.title || "Success",
      description: message,
      variant: "success",
      duration: options?.duration || 5000,
      action: options?.action,
    })
  }

  // Function to show an error toast
  const showError = (error: unknown, options?: Omit<ToastOptions, "variant">) => {
    const errorMessage = getUserFriendlyErrorMessage(error)

    toast({
      title: options?.title || "Error",
      description: options?.description || errorMessage,
      variant: "destructive",
      duration: options?.duration || 7000,
      action: options?.action,
    })
  }

  // Function to show a warning toast
  const showWarning = (message: string, options?: Omit<ToastOptions, "variant">) => {
    toast({
      title: options?.title || "Warning",
      description: message,
      variant: "warning",
      duration: options?.duration || 6000,
      action: options?.action,
    })
  }

  // Function to show an info toast
  const showInfo = (message: string, options?: Omit<ToastOptions, "variant">) => {
    toast({
      title: options?.title || "Information",
      description: message,
      variant: "default",
      duration: options?.duration || 5000,
      action: options?.action,
    })
  }

  // Function to show a custom toast
  const showCustom = (options: ToastOptions) => {
    toast({
      title: options.title,
      description: options.description,
      variant: options.variant,
      duration: options.duration,
      action: options.action,
    })
  }

  // Function to show a toast based on error type
  const showErrorByType = (error: unknown, errorType: ErrorType, options?: Omit<ToastOptions, "variant">) => {
    const errorMessage = getUserFriendlyErrorMessage(error)

    let title = options?.title || "Error"
    let variant: ToastVariant = "destructive"

    switch (errorType) {
      case ErrorType.DATABASE_CONNECTION:
        title = options?.title || "Database Connection Error"
        break
      case ErrorType.AUTHENTICATION:
        title = options?.title || "Authentication Error"
        break
      case ErrorType.VALIDATION:
        title = options?.title || "Validation Error"
        break
      case ErrorType.NOT_FOUND:
        title = options?.title || "Not Found"
        break
      case ErrorType.TIMEOUT:
        title = options?.title || "Request Timeout"
        break
      case ErrorType.RATE_LIMIT:
        title = options?.title || "Rate Limit Exceeded"
        break
      case ErrorType.CONFLICT:
        title = options?.title || "Conflict Error"
        variant = "warning"
        break
      case ErrorType.NAVIGATION:
        title = options?.title || "Navigation Error"
        variant = "warning"
        break
      default:
        title = options?.title || "Server Error"
        break
    }

    toast({
      title,
      description: options?.description || errorMessage,
      variant,
      duration: options?.duration || 7000,
      action: options?.action,
    })
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showCustom,
    showErrorByType,
  }
}
