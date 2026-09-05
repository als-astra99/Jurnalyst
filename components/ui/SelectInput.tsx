'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { CaretDown, Check } from '@phosphor-icons/react'

export interface SelectOption {
  value: string
  label: string
  sublabel?: string
  /** Jika true, item ini adalah header grup (tidak bisa dipilih) */
  isGroup?: boolean
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
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  const selected = options.find((o) => o.value === value)

  useEffect(() => { setMounted(true) }, [])

  // Hitung posisi dropdown berdasarkan posisi trigger di viewport
  const updatePos = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const itemCount = options.filter((o) => !o.isGroup).length
    const groupCount = options.filter((o) => o.isGroup).length
    const dropdownHeight = Math.min(itemCount * 54 + groupCount * 32 + 16, 320)

    // Buka ke atas kalau space bawah tidak cukup
    const openUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow

    setDropdownPos({
      top: openUp
        ? rect.top + window.scrollY - dropdownHeight - 6
        : rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
      width: rect.width,
    })
  }, [options.length])

  const handleOpen = () => {
    if (disabled) return
    updatePos()
    setOpen((v) => !v)
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape & update pos on scroll/resize
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onScroll = () => updatePos()
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open, updatePos])

  const dropdownContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 99999,
            background: '#FFFFFF',
            border: '1.5px solid #E8E4DC',
            borderRadius: '0.75rem',
            boxShadow: '0 8px 32px rgba(26,31,46,0.14), 0 2px 8px rgba(26,31,46,0.08)',
            overflow: 'hidden',
          }}
        >
          {/* Gold accent top line */}
          <div style={{
            height: '2px',
            background: 'linear-gradient(to right, transparent, #C9973A 30%, #E8B455 60%, transparent)',
            flexShrink: 0,
          }} />

          <div style={{
            maxHeight: '320px',
            overflowY: 'auto',
            padding: '0.375rem',
          }}>
            {options.map((opt, idx) => {
              // ── Group header — tidak bisa diklik ──────────────────
              if (opt.isGroup) {
                return (
                  <div
                    key={`group-${opt.label}-${idx}`}
                    style={{
                      padding: '0.375rem 0.625rem 0.25rem',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      letterSpacing: '0.07em',
                      textTransform: 'uppercase',
                      color: '#C9973A',
                      borderTop: idx > 0 ? '1px solid #F0EDE5' : 'none',
                      marginTop: idx > 0 ? '0.25rem' : 0,
                    }}
                  >
                    {opt.label}
                  </div>
                )
              }

              // ── Item biasa ────────────────────────────────────────
              const isSelected = opt.value === value
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.13, delay: idx * 0.025, ease: 'easeOut' }}
                  onClick={() => { onChange(opt.value); setOpen(false) }}
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
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#F9F6EF' }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                >
                  <div>
                    <span className="block">{opt.label}</span>
                    {opt.sublabel && (
                      <span
                        className="block text-[11px] mt-0.5 font-medium"
                        style={{
                          color: opt.sublabel.includes('Terbuka')
                            ? '#2F9E6E'
                            : opt.sublabel.includes('Ditutup')
                            ? '#94A3B8'
                            : '#94A3B8',
                        }}
                      >
                        {opt.sublabel}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check size={13} weight="bold" style={{ color: '#C9973A', flexShrink: 0 }} />
                  )}
                </motion.button>
              )
            })}

            {options.length === 0 && (
              <p className="text-center py-4 text-xs" style={{ color: '#94A3B8' }}>
                Tidak ada opsi tersedia
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-[#C9973A] ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className="w-full text-left flex items-center justify-between gap-2 transition-all duration-150"
        style={{
          borderRadius: '0.5625rem',
          border: open ? '1.5px solid #C9973A' : '1px solid #DDD9D1',
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
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          style={{ flexShrink: 0 }}
        >
          <CaretDown size={14} weight="bold" style={{ color: open ? '#C9973A' : '#94A3B8' }} />
        </motion.span>
      </button>

      {/* Render dropdown via Portal — keluar dari semua overflow:hidden parent */}
      {mounted && createPortal(dropdownContent, document.body)}
    </div>
  )
}
