'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CaretDown, Check } from '@phosphor-icons/react'

export interface SelectOption {
  value: string
  label: string
  sublabel?: string
}

interface SelectInputProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export default function SelectInput({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  label,
  required,
  disabled,
  className = '',
}: SelectInputProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className={`relative ${className}`} ref={ref}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-[#C9973A] ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left flex items-center justify-between gap-2 transition-all duration-150"
        style={{
          borderRadius: '0.5625rem',
          border: open
            ? '1.5px solid #C9973A'
            : '1px solid #DDD9D1',
          padding: '0.5625rem 0.8125rem',
          fontSize: '0.8125rem',
          color: selected ? '#1A1F2E' : '#B0A99E',
          background: open ? '#FFFFFF' : '#FDFCFA',
          boxShadow: open
            ? '0 0 0 3px rgba(201,151,58,0.12)'
            : '0 1px 2px rgba(26,31,46,0.04)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          outline: 'none',
        }}
      >
        <span className="truncate">
          {selected ? selected.label : placeholder}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          style={{ flexShrink: 0 }}
        >
          <CaretDown
            size={14}
            weight="bold"
            style={{ color: open ? '#C9973A' : '#94A3B8' }}
          />
        </motion.span>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              zIndex: 9999,
              background: '#FFFFFF',
              border: '1.5px solid #E8E4DC',
              borderRadius: '0.75rem',
              boxShadow:
                '0 8px 32px rgba(26,31,46,0.12), 0 2px 8px rgba(26,31,46,0.06)',
              overflow: 'hidden',
            }}
          >
            {/* Top gold accent line */}
            <div
              style={{
                height: '2px',
                background:
                  'linear-gradient(to right, transparent, #C9973A 30%, #E8B455 60%, transparent)',
              }}
            />

            <div
              style={{
                maxHeight: '220px',
                overflowY: 'auto',
                padding: '0.375rem',
              }}
            >
              {options.map((opt, idx) => {
                const isSelected = opt.value === value
                return (
                  <motion.button
                    key={opt.value}
                    type="button"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.15,
                      delay: idx * 0.03,
                      ease: 'easeOut',
                    }}
                    onClick={() => {
                      onChange(opt.value)
                      setOpen(false)
                    }}
                    className="w-full text-left flex items-center justify-between gap-2 rounded-lg transition-all duration-100"
                    style={{
                      padding: '0.5rem 0.625rem',
                      fontSize: '0.8125rem',
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? '#1A1F2E' : '#374151',
                      background: isSelected
                        ? 'linear-gradient(135deg, #FEF7EC, #FDF3E0)'
                        : 'transparent',
                      border: isSelected
                        ? '1px solid rgba(201,151,58,0.25)'
                        : '1px solid transparent',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = '#F9F6EF'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    <div>
                      <span className="block">{opt.label}</span>
                      {opt.sublabel && (
                        <span
                          className="block text-[11px] mt-0.5"
                          style={{ color: '#94A3B8' }}
                        >
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check
                        size={13}
                        weight="bold"
                        style={{ color: '#C9973A', flexShrink: 0 }}
                      />
                    )}
                  </motion.button>
                )
              })}

              {options.length === 0 && (
                <p
                  className="text-center py-4 text-xs"
                  style={{ color: '#94A3B8' }}
                >
                  Tidak ada opsi tersedia
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
