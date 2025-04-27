"use client"

import type React from "react"

import { createContext, useContext, useState } from "react"
import { Toast, type ToastProps } from "@/components/ui/toast"

type ToastContextType = {
  toast: (props: ToastProps) => void
  dismissToast: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastProps | null>(null)

  const showToast = (props: ToastProps) => {
    setToast(props)

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToast(null)
    }, 5000)
  }

  const dismissToast = () => {
    setToast(null)
  }

  return (
    <ToastContext.Provider value={{ toast: showToast, dismissToast }}>
      {children}
      {toast && <Toast {...toast} onClose={dismissToast} />}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
