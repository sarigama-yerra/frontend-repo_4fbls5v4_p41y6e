import { useEffect, useMemo, useRef, useState } from 'react'
import Hero from './components/Hero'
import PlinkoBoard from './components/PlinkoBoard'

const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function Paytable({ rows = 12 }){
  const [multipliers, setMultipliers] = useState([])
  useEffect(() => {
    // Use a symmetric example paytable from backend logic (binomial reciprocal normalized)
    // Our backend v2 returns it only during start; for display we approximate with rows=12 via verify of dummy seeds
    const fetchTable = async () => {
      try {
        const r = await fetch(`${baseUrl}/api/verify?server_seed=dummy&client_seed=dummy&nonce=0&rows=${rows}&drop_column=6`)
        const d = await r.json()
        // not returned; compute locally as fallback
        const n = rows
        const probs = Array.from({length:n+1}, (_,k)=> comb(n,k) / (2 ** n))
        const base = probs.map(p => 1.0/p)
        const ev = probs.reduce((acc,p,i)=> acc + p*base[i], 0)
        const factor = 1.0/ev
        const table = base.map(m => m*factor)
        setMultipliers(table)
      } catch {}
    }
    fetchTable()
  }, [rows])

  // simple comb
  function comb(n,k){
    if(k<0||k>n) return 0
    if(k===0||k===n) return 1
    let res=1
    for(let i=1;i<=k;i++) res = res*(n-(k-i))/i
    return res
  }

  return (
    <div>
      <h3 className="font-semibold mb-2">Paytable (bin multipliers)</h3>
      <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-13 gap-2">
        {multipliers.map((m,i)=> (
          <div key={i} className="rounded bg-slate-800 border border-slate-700 p-2 text-center">
            <div className="text-xs text-slate-400">{i}</div>
            <div className="text-white font-semibold">x{m.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const rows = 12
  const [dropColumn, setDropColumn] = useState(6)
  const [betCents, setBetCents] = useState(100)
  const [clientSeed, setClientSeed] = useState('candidate-demo')
  const [roundId, setRoundId] = useState(null)
  const [commitHex, setCommitHex] = useState('')
  const [nonce, setNonce] = useState('')

  const [path, setPath] = useState([])
  const [binIndex, setBinIndex] = useState(null)
  const [payoutMultiplier, setPayoutMultiplier] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [muted, setMuted] = useState(false)
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Accessibility: keyboard controls
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault(); setDropColumn(c => Math.max(0, c-1))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault(); setDropColumn(c => Math.min(12, c+1))
      } else if (e.code === 'Space') {
        e.preventDefault(); startRound()
      } else if (e.key.toLowerCase() === 'm') {
        setMuted(m => !m)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const commit = async () => {
    setStatus('committing')
    setError(null)
    setPath([])
    setBinIndex(null)
    setPayoutMultiplier(null)
    try {
      const r = await fetch(`${baseUrl}/api/rounds/commit`, { method: 'POST' })
      const data = await r.json()
      if (!r.ok) throw new Error(data.detail || 'Commit failed')
      setRoundId(data.roundId)
      setCommitHex(data.commitHex)
      setNonce(data.nonce)
      setStatus('committed')
      return data.roundId
    } catch (e) {
      setError(String(e))
      setStatus('idle')
      return null
    }
  }

  const startRound = async () => {
    const id = roundId || await commit()
    if (!id) return
    setStatus('starting')
    try {
      const r = await fetch(`${baseUrl}/api/rounds/${id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientSeed, betCents: Number(betCents), dropColumn: Number(dropColumn) })
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.detail || 'Start failed')
      setPath(data.path)
      setBinIndex(data.binIndex)
      setPayoutMultiplier(data.payoutMultiplier)
      setStatus('started')
      // Auto reveal after animation ends via callback
    } catch (e) {
      setError(String(e))
      setStatus('committed')
    }
  }

  const reveal = async () => {
    if (!roundId) return
    setStatus('revealing')
    try {
      const r = await fetch(`${baseUrl}/api/rounds/${roundId}/reveal`, { method: 'POST' })
      const data = await r.json()
      if (!r.ok) throw new Error(data.detail || 'Reveal failed')
      setStatus('revealed')
    } catch (e) {
      setError(String(e))
      setStatus('started')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Hero />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-lg p-5">
            <h2 className="text-xl font-semibold">Game</h2>
            <div className="mt-4">
              <PlinkoBoard rows={rows} path={path} reducedMotion={prefersReducedMotion} muted={muted} onDone={reveal} />
            </div>

            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-slate-300 text-sm">Drop Column (0–12)</span>
                <input type="range" min={0} max={12} value={dropColumn} onChange={e=>setDropColumn(Number(e.target.value))} className="w-full" />
                <div className="text-sm text-slate-400">Selected: {dropColumn}</div>
              </label>
              <label className="block">
                <span className="text-slate-300 text-sm">Bet (cents)</span>
                <input type="number" min={0} value={betCents} onChange={e=>setBetCents(e.target.value)} className="mt-1 w-full rounded bg-slate-800 border border-slate-700 px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-slate-300 text-sm">Client Seed</span>
                <input value={clientSeed} onChange={e=>setClientSeed(e.target.value)} className="mt-1 w-full rounded bg-slate-800 border border-slate-700 px-3 py-2" />
              </label>
              <div className="flex items-end gap-3">
                <button onClick={commit} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500">Commit</button>
                <button onClick={startRound} className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500">Drop</button>
                <button onClick={()=>setMuted(m=>!m)} className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600">{muted? 'Unmute':'Mute'}</button>
                <a href="/verify" className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600">Verify</a>
              </div>
            </div>

            <div className="mt-4 text-sm text-slate-300 space-y-1">
              {commitHex && <div>Commit Hex: <span className="font-mono break-all">{commitHex}</span></div>}
              {roundId && <div>Round ID: <span className="font-mono">{roundId}</span></div>}
              {nonce && <div>Nonce: <span className="font-mono">{nonce}</span></div>}
              {binIndex !== null && <div>Result bin: <span className="font-semibold">{binIndex}</span>{payoutMultiplier? ` • Multiplier x${payoutMultiplier.toFixed(2)}`:''}</div>}
              {error && <div className="text-red-400">{error}</div>}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5">
            <Paytable rows={rows} />
            <div className="mt-6">
              <h3 className="font-semibold">Tips</h3>
              <ul className="mt-2 list-disc list-inside text-sm text-slate-300 space-y-1">
                <li>Use ←/→ to select drop column</li>
                <li>Press Space to drop</li>
                <li>Press M to mute/unmute</li>
                <li>Respects reduced motion preference</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
