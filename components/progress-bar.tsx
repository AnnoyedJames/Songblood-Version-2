"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import NProgress from "nprogress"

export default function ProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [prevPathname, setPrevPathname] = useState("")
  const [prevSearchParams, setPrevSearchParams] = useState("")

  useEffect(() => {
    // Configure NProgress
    NProgress.configure({ showSpinner: false })

    // Add CSS for NProgress
    const style = document.createElement("style")
    style.textContent = `
      #nprogress {
        pointer-events: none;
      }
      #nprogress .bar {
        background: hsl(var(--primary));
        position: fixed;
        z-index: 1031;
        top: 0;
        left: 0;
        width: 100%;
        height: 3px;
      }
      #nprogress .peg {
        display: block;
        position: absolute;
        right: 0px;
        width: 100px;
        height: 100%;
        box-shadow: 0 0 10px hsl(var(--primary)), 0 0 5px hsl(var(--primary));
        opacity: 1.0;
        transform: rotate(3deg) translate(0px, -4px);
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  useEffect(() => {
    if (!searchParams) return // Guard against undefined searchParams

    const currentSearchParams = searchParams.toString()

    // Only trigger progress bar when the path or search params change
    if (pathname !== prevPathname || currentSearchParams !== prevSearchParams) {
      NProgress.start()

      // Simulate a minimum loading time for better UX
      const timer = setTimeout(() => {
        NProgress.done()
      }, 300)

      setPrevPathname(pathname)
      setPrevSearchParams(currentSearchParams)

      return () => {
        clearTimeout(timer)
      }
    }
  }, [pathname, searchParams, prevPathname, prevSearchParams])

  return null
}
