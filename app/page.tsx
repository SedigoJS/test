"use client"

import dynamic from "next/dynamic"

const BlackHole = dynamic(() => import("@/components/black-hole"), { ssr: false })

export default function Page() {
  return (
    <main className="relative h-screen w-full overflow-hidden bg-black text-white">
      <BlackHole />

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6 md:p-10">
        <header className="max-w-md">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/50">Schwarzschild Metric</p>
          <h1 className="mt-2 text-pretty text-2xl font-semibold leading-tight md:text-4xl">Ray-traced black hole</h1>
          <p className="mt-3 max-w-sm text-pretty text-sm leading-relaxed text-white/60">
            Light paths are integrated as null geodesics through curved spacetime — producing real gravitational
            lensing, the photon ring, Doppler beaming, and gravitational redshift.
          </p>
        </header>

        <dl className="grid max-w-md grid-cols-2 gap-x-6 gap-y-3 font-mono text-[11px] text-white/50 sm:grid-cols-3">
          <div>
            <dt className="text-white/30">Horizon</dt>
            <dd className="text-white/80">r = r_s</dd>
          </div>
          <div>
            <dt className="text-white/30">Photon ring</dt>
            <dd className="text-white/80">1.5 r_s</dd>
          </div>
          <div>
            <dt className="text-white/30">ISCO</dt>
            <dd className="text-white/80">3 r_s</dd>
          </div>
          <div>
            <dt className="text-white/30">Integrator</dt>
            <dd className="text-white/80">RK4</dd>
          </div>
          <div>
            <dt className="text-white/30">Disk T(r)</dt>
            <dd className="text-white/80">{"∝ r^-3/4"}</dd>
          </div>
          <div>
            <dt className="text-white/30">v_orbit</dt>
            <dd className="text-white/80">{"√(r_s/2r)"}</dd>
          </div>
        </dl>
      </div>
    </main>
  )
}
