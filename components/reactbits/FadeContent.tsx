'use client'

import * as React from 'react'
import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface FadeContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  container?: Element | string | null
  blur?: boolean
  duration?: number
  ease?: string
  delay?: number
  threshold?: number
  initialOpacity?: number
}

const FadeContent: React.FC<FadeContentProps> = ({
  children,
  container,
  blur = false,
  duration = 800,
  ease = 'power2.out',
  delay = 0,
  threshold = 0.1,
  initialOpacity = 0,
  className = '',
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let scrollerTarget: Element | string | null =
      container || document.getElementById('snap-main-container') || null

    if (typeof scrollerTarget === 'string') {
      scrollerTarget = document.querySelector(scrollerTarget)
    }

    const startPct = (1 - threshold) * 100
    const getSeconds = (val: number) => (val > 10 ? val / 1000 : val)

    gsap.set(el, {
      autoAlpha: initialOpacity,
      filter: blur ? 'blur(8px)' : 'blur(0px)',
      willChange: 'opacity, filter',
    })

    const tl = gsap.timeline({ paused: true, delay: getSeconds(delay) })

    tl.to(el, {
      autoAlpha: 1,
      filter: 'blur(0px)',
      duration: getSeconds(duration),
      ease,
    })

    const st = ScrollTrigger.create({
      trigger: el,
      scroller: scrollerTarget || window,
      start: `top ${startPct}%`,
      once: true,
      onEnter: () => tl.play(),
    })

    return () => {
      st.kill()
      tl.kill()
      gsap.killTweensOf(el)
    }
  }, [])

  return (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  )
}

export default FadeContent
