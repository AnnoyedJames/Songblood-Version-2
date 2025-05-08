"use client"

import type React from "react"

import { useContext, createContext } from "react"

type Toast = {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  duration?: number
  variant?: "default" | "destructive" | "success" | "warning"
}

type ToastAction = {
  dismiss: (toastId?: string) => void
  toast: (props: Toast) => { id: string }
}

const ToastContext = createContext<ToastAction>({
  dismiss: () => {},
  toast: () => ({ id: "" }),
})

const useToast = () => {
  return useContext(ToastContext)
}

export { ToastContext, useToast }
