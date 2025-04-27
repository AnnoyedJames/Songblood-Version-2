"use client"

import { X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const toastVariants = cva("fixed bottom-4 right-4 z-50 flex items-center justify-between p-4 rounded-md shadow-md", {
  variants: {
    variant: {
      default: "bg-white text-foreground border",
      destructive: "bg-destructive text-destructive-foreground border-destructive",
      success: "bg-green-50 text-green-800 border-green-200",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export interface ToastProps extends VariantProps<typeof toastVariants> {
  title?: string
  description?: string
  onClose?: () => void
}

export function Toast({ title, description, variant, onClose }: ToastProps) {
  return (
    <div className={cn(toastVariants({ variant }))}>
      <div className="flex-1 mr-4">
        {title && <h4 className="font-medium">{title}</h4>}
        {description && <p className="text-sm">{description}</p>}
      </div>
      <button onClick={onClose} className="text-current hover:opacity-75 transition-opacity" aria-label="Close toast">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
