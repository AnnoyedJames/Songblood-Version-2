"use client"

import type React from "react"

import { useToast } from "@/components/ui/use-toast"
import { useCallback } from "react"

type ToastType = "success" | "error" | "info" | "warning"

interface ToastOptions {
  duration?: number
  action?: React.ReactNode
}

export function useToastNotification() {
  const { toast } = useToast()

  const showToast = useCallback(
    (type: ToastType, title: string, description?: string, options?: ToastOptions) => {
      let variant: "default" | "destructive" | "success" = "default"

      switch (type) {
        case "success":
          variant = "success"
          break
        case "error":
          variant = "destructive"
          break
        case "warning":
        case "info":
          variant = "default"
          break
      }

      toast({
        title,
        description,
        variant,
        duration: options?.duration || 5000,
        action: options?.action,
      })
    },
    [toast],
  )

  const successToast = useCallback(
    (title: string, description?: string, options?: ToastOptions) => {
      showToast("success", title, description, options)
    },
    [showToast],
  )

  const errorToast = useCallback(
    (title: string, description?: string, options?: ToastOptions) => {
      showToast("error", title, description, options)
    },
    [showToast],
  )

  const infoToast = useCallback(
    (title: string, description?: string, options?: ToastOptions) => {
      showToast("info", title, description, options)
    },
    [showToast],
  )

  const warningToast = useCallback(
    (title: string, description?: string, options?: ToastOptions) => {
      showToast("warning", title, description, options)
    },
    [showToast],
  )

  return {
    showToast,
    successToast,
    errorToast,
    infoToast,
    warningToast,
  }
}
