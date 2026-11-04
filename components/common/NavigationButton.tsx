'use client'

import { useRouter } from 'next/navigation'
import type { CSSProperties, ReactNode } from 'react'

type NavigationButtonProps = {
  href: string
  children: ReactNode
  style?: CSSProperties
  className?: string
  ariaLabel?: string
  disabled?: boolean
  replace?: boolean
}

export default function NavigationButton({
  href,
  children,
  style,
  className,
  ariaLabel,
  disabled = false,
  replace = false,
}: NavigationButtonProps) {
  const router = useRouter()

  function handleClick() {
    if (disabled) {
      return
    }

    if (replace) {
      router.replace(href)
      return
    }

    router.push(href)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      style={style}
      className={className}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      {children}
    </button>
  )
}