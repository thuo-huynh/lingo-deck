"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

/**
 * In-app notices styled like iOS notification banners (spec #2): top of the screen below the status bar,
 * frosted glass, icon + one line, gone after 3 s, swipe up to dismiss.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      position="top-center"
      duration={3000}
      swipeDirections={["top"]}
      offset={{ top: "max(12px, env(safe-area-inset-top))" }}
      mobileOffset={{ top: "max(12px, env(safe-area-inset-top))", left: "12px", right: "12px" }}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-5 text-good" />,
        info: <InfoIcon className="size-5 text-primary" />,
        warning: <TriangleAlertIcon className="size-5 text-hard" />,
        error: <OctagonXIcon className="size-5 text-again" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "color-mix(in oklab, var(--card) 82%, transparent)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "20px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast !min-h-14 !gap-3 !px-4 !py-3 !text-[15px] !font-medium !shadow-nav backdrop-blur-xl backdrop-saturate-150",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
