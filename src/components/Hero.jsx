import Spline from '@splinetool/react-spline'

export default function Hero() {
  return (
    <section className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
      <Spline scene="https://prod.spline.design/4TrRyLcIHhcItjnk/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
      <div className="absolute inset-0 flex items-end md:items-center justify-center p-6">
        <div className="text-center text-white drop-shadow-lg">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Plinko Lab</h1>
          <p className="mt-3 text-sm md:text-base opacity-90">Provably‑Fair Plinko with seed replay + verifier</p>
        </div>
      </div>
    </section>
  )
}
