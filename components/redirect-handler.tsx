"use client"

import { useEffect } from "react"

type RedirectHandlerProps = {
  reason: string
}

export default function RedirectHandler({ reason }: RedirectHandlerProps) {
  useEffect(() => {
    // Log the redirect reason for debugging
    console.log(`Redirected to login. Reason: ${reason}`)
    
    // You could add analytics tracking here
    
  }, [reason])

  // This component doesn't render anything visible
  return null
}
