import { useEffect, useMemo, useRef, useState } from 'react'

// Simple deterministic board renderer + path animation
// Props: rows, path (array of 'L'/'R'), onDone, reducedMotion (bool), muted (bool)
export default function PlinkoBoard({ rows = 12, path = [], onDone, reducedMotion = false, muted = false }) {
  const containerRef = useRef(null)
  const [stepIndex, setStepIndex] = useState(-1)

  const pegs = useMemo(() => {
    const arr = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c <= r; c++) {
        arr.push({ r, c })
      }
    }
    return arr
  }, [rows])

  // Basic tick sound via WebAudio
  const audioCtxRef = useRef(null)
  const playTick = () => {
    if (muted || reducedMotion) return
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || window.webkitAudioContext)()
      audioCtxRef.current = ctx
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'triangle'
      o.frequency.value = 880
      g.gain.value = 0.06
      o.connect(g)
      g.connect(ctx.destination)
      o.start()
      setTimeout(() => { o.stop() }, 40)
    } catch {}
  }

  // Animate through path
  useEffect(() => {
    if (!path || path.length === 0) return
    setStepIndex(-1)
    let i = -1
    const interval = reducedMotion ? 0 : 180
    const id = setInterval(() => {
      i++
      if (i >= path.length) {
        clearInterval(id)
        onDone && onDone()
      } else {
        setStepIndex(i)
        playTick()
      }
    }, Math.max(16, interval))
    return () => clearInterval(id)
  }, [path, reducedMotion])

  // Compute positions for SVG layout
  const width = 350
  const pegSpacing = width / (rows + 1)
  const height = pegSpacing * (rows + 2)

  // Ball position derived from path up to stepIndex
  const ballPos = useMemo(() => {
    let pos = 0
    const steps = Math.max(0, stepIndex + 1)
    for (let i = 0; i < steps; i++) {
      if (path[i] === 'R') pos += 1
    }
    const r = Math.min(steps, rows - 1)
    const x = ((r - pos) * 0.5 + pos) * pegSpacing + pegSpacing
    const y = (r + 1) * pegSpacing
    return { x, y }
  }, [stepIndex, path, rows, pegSpacing])

  const bins = new Array(rows + 1).fill(0)

  return (
    <div ref={containerRef} className="w-full flex items-center justify-center">
      <svg width={width} height={height} className="max-w-full">
        {/* pegs */}
        {pegs.map(({ r, c }, idx) => {
          const x = (c + 1 + (rows - r) * 0.5) * pegSpacing
          const y = (r + 1) * pegSpacing
          return <circle key={idx} cx={x} cy={y} r={4} className="fill-slate-400" />
        })}
        {/* bins */}
        {bins.map((_, i) => {
          const x = (i + 1) * pegSpacing
          const y = (rows + 1.4) * pegSpacing
          const active = stepIndex >= rows - 1 && i === path.reduce((acc, s) => acc + (s === 'R' ? 1 : 0), 0)
          return <rect key={i} x={x - pegSpacing * 0.4} y={y} width={pegSpacing * 0.8} height={pegSpacing * 0.5} className={"rounded " + (active ? 'fill-emerald-500' : 'fill-slate-700')} />
        })}
        {/* ball */}
        {path.length > 0 && (
          <circle cx={ballPos.x} cy={ballPos.y} r={6} className="fill-white drop-shadow" />
        )}
      </svg>
    </div>
  )
}
