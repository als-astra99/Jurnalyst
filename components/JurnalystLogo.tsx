import React from 'react'
import Image from 'next/image'
import BlurText from '@/components/reactbits/BlurText'

interface JurnalystLogoProps {
  className?: string
  iconSize?: number
  showText?: boolean
  lightText?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function JurnalystLogo({
  className = '',
  iconSize,
  showText = true,
  lightText = true,
  size = 'lg',
}: JurnalystLogoProps) {
  // Determine badge dimensions
  const badgeClasses =
    size === 'xl'
      ? 'w-16 h-16 rounded-2xl shadow-md'
      : size === 'lg'
      ? 'w-12 h-12 rounded-xl shadow-xs'
      : size === 'md'
      ? 'w-10 h-10 rounded-xl'
      : 'w-8 h-8 rounded-lg'

  const titleClasses =
    size === 'xl'
      ? 'text-3xl font-serif-heading font-bold'
      : size === 'lg'
      ? 'text-2xl font-serif-heading font-bold'
      : size === 'md'
      ? 'text-xl font-serif-heading font-bold'
      : 'text-base font-serif-heading font-bold'

  const subClasses =
    size === 'xl'
      ? 'text-xs tracking-widest mt-1 font-medium'
      : size === 'lg'
      ? 'text-[10px] tracking-widest mt-0.5 font-medium'
      : size === 'md'
      ? 'text-[9px] tracking-wider mt-0.5'
      : 'text-[8px] tracking-wider'

  return (
    <div className={`inline-flex items-center gap-3.5 ${className}`}>
      {/* PURE ICON BADGE: Cropped to show ONLY the J-Feather Symbol */}
      <div
        className={`bg-white border border-slate-200/80 shrink-0 flex items-center justify-center relative overflow-hidden ${badgeClasses}`}
      >
        {/* We position & scale the PNG image so only the upper J-Feather symbol is displayed */}
        <div className="absolute inset-0 flex items-start justify-center pt-1.5 overflow-hidden">
          <div className="relative w-[160%] h-[160%] -mt-1">
            <Image
              src="/Logo_Jurnalyst.png"
              alt="Logo Jurnalyst"
              fill
              className="object-contain object-top"
              priority
            />
          </div>
        </div>
      </div>

      {/* BRAND TYPOGRAPHY */}
      {showText && (
        <div className="flex flex-col justify-center">
          <BlurText
            text="Jurnalyst"
            delay={80}
            animateBy="letters"
            direction="top"
            threshold={0.05}
            stepDuration={0.25}
            className={`tracking-tight leading-none ${titleClasses} ${
              lightText ? 'text-white' : 'text-slate-900'
            }`}
          />
          <BlurText
            text="Personal Finance & Journal"
            delay={40}
            animateBy="letters"
            direction="bottom"
            threshold={0.05}
            stepDuration={0.2}
            className={`uppercase leading-none ${subClasses} ${
              lightText ? 'text-amber-300' : 'text-[#B8802E]'
            }`}
          />
        </div>
      )}
    </div>
  )
}
