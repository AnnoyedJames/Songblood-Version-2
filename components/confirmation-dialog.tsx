"use client"

import type React from "react"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface ConfirmationDialogProps {
  title: string
  description: string
  actionLabel: string
  cancelLabel?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  onConfirm: () => Promise<void> | void
  trigger: React.ReactNode
}

export function ConfirmationDialog({
  title,
  description,
  actionLabel,
  cancelLabel = "Cancel",
  variant = "destructive",
  onConfirm,
  trigger,
}: ConfirmationDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    try {
      setIsLoading(true)
      await onConfirm()
      setOpen(false)
    } catch (error) {
      console.error("Error during confirmation action:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant={variant} onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? "Processing..." : actionLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
