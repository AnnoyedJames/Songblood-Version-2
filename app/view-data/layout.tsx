import type React from "react"
export default function ViewDataLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="view-data-layout">{children}</div>
}
