import { useEffect, useMemo, useState } from 'react'
import Hero from './components/Hero'

const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function MultiplierPills({ multipliers, bucket }){
  return (
    <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-12 gap-2">
      {multipliers.map((m, i) => (
        <div key={i} className={`rounded px-2 py-1 text-xs text-white text-center ${i===bucket? 'bg-emerald-600':'bg-slate-700'}`}>
          x{m.toFixed(2)}
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [rows, setRows] = useState(16)
  const [risk, setRisk] = useState('medium')
  const [bet, setBet] = useState(1)
  const [clientSeed, setClientSeed] = useState('demo-client')
  const [nonce, setNonce] = useState(0)

  const [roundId, setRoundId] = useState(null)
  const [serverSeedHash, setServerSeedHash] = useState('')

  const [path, setPath] = useState([])
  const [bucket, setBucket] = useState(null)
  const [multiplier, setMultiplier] = useState(null)
  const [multipliers, setMultipliers] = useState([])
  const [rngValues, setRngValues] = useState([])
  const [payout, setPayout] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  // Fetch current multipliers for display
  useEffect(() => {
    fetch(`${baseUrl}/api/multipliers?rows=${rows}&risk=${risk}`)
      .then(r=>r.json())
      .then(d=> setMultipliers(d.multipliers || []))
      .catch(()=>{})
  }, [rows, risk])

  const commit = async () => {
    setStatus('committing')
    setError(null)
    setRoundId(null)
    setServerSeedHash('')
    setPath([])
    setBucket(null)
    setMultiplier(null)
    setRngValues([])
    setPayout(null)

    try {
      const r = await fetch(`${baseUrl}/api/commit`, { method: 'POST' })
      if (!r.ok) throw new Error('Commit failed')
      const data = await r.json()
      setRoundId(data.round_id)
      setServerSeedHash(data.server_seed_hash)
      setStatus('committed')
    } catch (e) {
      setError(String(e))
      setStatus('idle')
    }
  }

  const reveal = async () => {
    if (!roundId) return
    setStatus('revealing')
    setError(null)
    try {
      const r = await fetch(`${baseUrl}/api/reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round_id: roundId,
          client_seed: clientSeed,
          nonce: Number(nonce),
          rows: Number(rows),
          risk,
          bet_amount: Number(bet)
        })
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.detail || 'Reveal failed')
      setPath(data.path)
      setBucket(data.bucket)
      setMultiplier(data.multiplier)
      setRngValues(data.rng_values)
      setPayout(data.payout)
      setMultipliers(data.multipliers)
      setStatus('revealed')
    } catch (e) {
      setError(String(e))
      setStatus('committed')
    }
  }

  const play = async () => {
    await commit()
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Hero />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-lg p-5">
            <h2 className="text-xl font-semibold">Controls</h2>
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-slate-300 text-sm">Rows (8–20)</span>
                <input type="number" min={8} max={20} value={rows} onChange={e=>setRows(Number(e.target.value))} className="mt-1 w-full rounded bg-slate-800 border border-slate-700 px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-slate-300 text-sm">Risk</span>
                <select value={risk} onChange={e=>setRisk(e.target.value)} className="mt-1 w-full rounded bg-slate-800 border border-slate-700 px-3 py-2">
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </label>
              <label className="block">
                <span className="text-slate-300 text-sm">Bet</span>
                <input type="number" step="0.01" value={bet} onChange={e=>setBet(e.target.value)} className="mt-1 w-full rounded bg-slate-800 border border-slate-700 px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-slate-300 text-sm">Client Seed</span>
                <input value={clientSeed} onChange={e=>setClientSeed(e.target.value)} className="mt-1 w-full rounded bg-slate-800 border border-slate-700 px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-slate-300 text-sm">Nonce</span>
                <input type="number" value={nonce} onChange={e=>setNonce(e.target.value)} className="mt-1 w-full rounded bg-slate-800 border border-slate-700 px-3 py-2" />
              </label>
            </div>

            <div className="mt-4 flex gap-3">
              <button onClick={play} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500">Commit</button>
              <button onClick={reveal} disabled={!roundId || status==='revealing'} className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50">Reveal</button>
              <a href="/verify" className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600">Verify</a>
            </div>

            {serverSeedHash && (
              <div className="mt-4 text-sm text-slate-300">
                <div>Server Seed Hash: <span className="font-mono">{serverSeedHash}</span></div>
                <div>Round ID: <span className="font-mono">{roundId}</span></div>
              </div>
            )}

            {error && (
              <div className="mt-4 text-red-400 text-sm">{error}</div>
            )}

            {path.length>0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Outcome</h3>
                <MultiplierPills multipliers={multipliers} bucket={bucket} />
                <div className="mt-3 text-sm text-slate-300">
                  <div>Path: <span className="font-mono">{path.join(' ')}</span></div>
                  <div>Bucket: {bucket} &nbsp; Multiplier: {multiplier?.toFixed(4)} &nbsp; Payout: {payout?.toFixed(4)}</div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5">
            <h2 className="text-xl font-semibold">Recent Rounds</h2>
            <RecentRounds />
          </div>
        </div>
      </div>
    </div>
  )
}

function RecentRounds(){
  const [items, setItems] = useState([])
  useEffect(()=>{
    fetch(`${baseUrl}/api/rounds?limit=10`).then(r=>r.json()).then(setItems).catch(()=>{})
  },[])

  return (
    <div className="mt-4 space-y-3 text-sm">
      {items.length===0 && <div className="text-slate-400">No rounds yet.</div>}
      {items.map(it => (
        <a key={it.id} href={`/verify?server_seed=${encodeURIComponent(it.server_seed||'')}&client_seed=${encodeURIComponent(it.client_seed||'')}&nonce=${it.nonce||0}&rows=${it.rows||16}&risk=${it.risk||'medium'}`} className="block rounded border border-slate-800 hover:border-slate-700 p-3">
          <div className="flex items-center justify-between">
            <div className="font-mono text-xs text-slate-400 truncate">{it.server_seed_hash}</div>
            {typeof it.payout === 'number' && (
              <div className="text-emerald-400">+{it.payout.toFixed(2)}</div>
            )}
          </div>
          <div className="text-slate-300">{it.risk} • rows {it.rows} • bucket {it.bucket}</div>
        </a>
      ))}
    </div>
  )
}
