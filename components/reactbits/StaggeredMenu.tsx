'use client'

import { useEffect, useRef, useState } from 'react'

interface StaggeredMenuProps {
  children: React.ReactNode
  staggerDelay?: number
  initialDelay?: number
  className?: string
}

export default function StaggeredMenu({
  children,
  staggerDelay = 0.08,
  initialDelay = 0.1,
  className = '',
}: StaggeredMenuProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Convert children to array and add stagger animation to each
  const childrenArray = Array.isArray(children) ? children : [children]

  return (
    <div ref={ref} className={className}>
      {childrenArray.map((child, index) => (
        <div
          key={index}
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateX(0)' : 'translateX(-12px)',
            transition: `all 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${initialDelay + index * staggerDelay}s`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}
