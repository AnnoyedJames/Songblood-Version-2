import { Loader2 } from "lucide-react"

interface DataLoadingProps {
  message?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function DataLoading({ message = "Loading data...", size = "md", className = "" }: DataLoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
