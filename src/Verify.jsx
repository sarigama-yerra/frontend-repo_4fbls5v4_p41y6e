import { useState } from 'react'

export default function Verify() {
  const [serverSeed, setServerSeed] = useState('')
  const [clientSeed, setClientSeed] = useState('demo-client')
  const [nonce, setNonce] = useState(0)
  const [rows, setRows] = useState(16)
  const [risk, setRisk] = useState('medium')
  const [bet, setBet] = useState('1.0')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  const onVerify = async () => {
    if (!serverSeed || !clientSeed) return
    setLoading(true)
    setResult(null)
    try {
      const params = new URLSearchParams({
        server_seed: serverSeed,
        client_seed: clientSeed,
        nonce: String(nonce),
        rows: String(rows),
        risk,
        bet_amount: bet ? String(bet) : ''
      })
      const r = await fetch(`${baseUrl}/api/verify?${params.toString()}`)
      const data = await r.json()
      setResult(data)
    } catch (e) {
      setResult({ error: String(e) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold">Verify Outcome</h1>
        <p className="mt-2 text-slate-300">Deterministically recompute a Plinko result with seeds + nonce.</p>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm text-slate-300">Server Seed</span>
            <input value={serverSeed} onChange={e=>setServerSeed(e.target.value)} placeholder="paste revealed server seed" className="mt-1 w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </label>
          <label className="block">
            <span className="text-sm text-slate-300">Client Seed</span>
            <input value={clientSeed} onChange={e=>setClientSeed(e.target.value)} className="mt-1 w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </label>
          <label className="block">
            <span className="text-sm text-slate-300">Nonce</span>
            <input type="number" value={nonce} onChange={e=>setNonce(Number(e.target.value))} className="mt-1 w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </label>
          <label className="block">
            <span className="text-sm text-slate-300">Rows (8–20)</span>
            <input type="number" value={rows} onChange={e=>setRows(Number(e.target.value))} className="mt-1 w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </label>
          <label className="block">
            <span className="text-sm text-slate-300">Risk</span>
            <select value={risk} onChange={e=>setRisk(e.target.value)} className="mt-1 w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-slate-300">Bet (optional)</span>
            <input type="number" step="0.01" value={bet} onChange={e=>setBet(e.target.value)} className="mt-1 w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </label>
        </div>

        <div className="mt-4 flex gap-3">
          <button onClick={onVerify} disabled={loading || !serverSeed || !clientSeed} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50">
            {loading ? 'Verifying…' : 'Verify'}
          </button>
          <a href="/" className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600">Back</a>
        </div>

        {result && (
          <div className="mt-6 bg-slate-900/60 border border-slate-800 rounded p-4 overflow-x-auto">
            {result.error ? (
              <p className="text-red-400">{String(result.error)}</p>
            ) : (
              <div className="space-y-2 text-sm">
                <div><span className="text-slate-400">Server Seed Hash:</span> <span className="font-mono">{result.server_seed_hash}</span></div>
                <div><span className="text-slate-400">Bucket:</span> {result.bucket} &nbsp; <span className="text-slate-400">Multiplier:</span> {result.multiplier?.toFixed(4)}</div>
                <div><span className="text-slate-400">Path:</span> <span className="font-mono">{(result.path||[]).join(' ')}</span></div>
                <div><span className="text-slate-400">RNG:</span> <span className="font-mono">{(result.rng_values||[]).slice(0,8).map(v=>v.toFixed(6)).join(', ')}{(result.rng_values||[]).length>8?' …':''}</span></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
