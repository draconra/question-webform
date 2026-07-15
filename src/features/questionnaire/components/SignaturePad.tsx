'use client'

import { useRef, useEffect, useState } from 'react'

interface SignaturePadProps {
  value: string
  onChange: (dataUrl: string) => void
}

/**
 * Hand-drawn signature pad using HTML Canvas + Pointer Events.
 *
 * How it works:
 *  - pointerdown  → begin a new path at the cursor position
 *  - pointermove  → draw line segments while pointer is held
 *  - pointerup    → finish stroke, export canvas as PNG base64 data URL
 *
 * setPointerCapture ensures the stroke continues even if the pointer
 * leaves the canvas boundary mid-draw.
 *
 * Canvas dimensions are set from the CSS layout size at mount time.
 * Resizing the window after mount does not resize the canvas (acceptable
 * for a fixed-height form element).
 */
export default function SignaturePad({ value, onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const [isEmpty, setIsEmpty] = useState(!value)

  // ----- initialise canvas size + restore existing signature -----
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0) return

    canvas.width = Math.floor(rect.width)
    canvas.height = Math.floor(rect.height)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (value && value.startsWith('data:image/')) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      img.src = value
      setIsEmpty(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ----- pointer helpers -----
  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    // Re-apply stroke style each stroke in case context was reset
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    isDrawing.current = true
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return
    const ctx = canvasRef.current!.getContext('2d')!
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const handlePointerUp = () => {
    if (!isDrawing.current) return
    isDrawing.current = false
    const canvas = canvasRef.current!
    setIsEmpty(false)
    onChange(canvas.toDataURL('image/png'))
  }

  const handleClear = () => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
    onChange('')
  }

  return (
    <div style={styles.wrapper}>
      <canvas
        ref={canvasRef}
        style={styles.canvas}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      <div style={styles.footer}>
        <span style={{ ...styles.hint, color: isEmpty ? '#94a3b8' : '#059669' }}>
          {isEmpty ? 'Gambar tanda tangan Anda di sini' : '✓ Tanda tangan tersimpan'}
        </span>
        <button type="button" onClick={handleClear} style={styles.clearBtn}>
          Hapus
        </button>
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    borderRadius: '16px',
    border: '2px solid #e2e8f0',
    overflow: 'hidden',
    backgroundColor: 'white',
    marginTop: '0.5rem',
  } as React.CSSProperties,
  canvas: {
    display: 'block',
    width: '100%',
    height: '200px',
    touchAction: 'none',   // prevent scroll-pan while drawing on touch
    cursor: 'crosshair',
    backgroundColor: 'white',
  } as React.CSSProperties,
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.625rem 1rem',
    borderTop: '1px solid #f1f5f9',
    backgroundColor: '#f8fafc',
  } as React.CSSProperties,
  hint: {
    fontSize: '13px',
    fontStyle: 'italic' as const,
    fontWeight: 500,
    transition: 'color 0.2s',
  } as React.CSSProperties,
  clearBtn: {
    padding: '14px 16px',
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#64748b',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  } as React.CSSProperties,
}
