"use client"

import { useRef, useMemo, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

/**
 * Physically based Schwarzschild black hole.
 *
 * The fragment shader integrates null geodesics (photon paths) through the
 * Schwarzschild metric. Working in geometric units where the Schwarzschild
 * radius r_s = 2GM/c^2 = 1, a photon's trajectory obeys:
 *
 *     d^2u/dphi^2 + u = (3/2) r_s u^2      (u = 1/r)
 *
 * which, in Cartesian form, is reproduced by the acceleration
 *
 *     a = -(3/2) h^2 * r_vec / |r|^5
 *
 * where h = |r x v| is the conserved specific angular momentum. We march each
 * camera ray with this acceleration (RK4), detecting:
 *   - capture by the event horizon (r < 1)               -> black shadow
 *   - passage through the volumetric accretion disk      -> emissive sampling
 *   - escape to infinity                                 -> lensed starfield
 *
 * The disk is shaded with blackbody-like temperature falloff, relativistic
 * Doppler beaming/boosting and gravitational redshift. Photons that loop the
 * hole repeatedly produce the bright photon ring at 1.5 r_s and secondary
 * (lensed) images of the disk.
 */

const fragmentShader = /* glsl */ `
precision highp float;

uniform vec2  uResolution;
uniform float uTime;
uniform vec3  uCamPos;
uniform mat3  uCamBasis;   // columns: right, up, forward
uniform float uFov;        // tan(fov/2)
uniform float uDiskInner;  // ISCO ~ 3 r_s in this normalization (r_s = 1)
uniform float uDiskOuter;

#define PI 3.14159265359
#define STEPS 260
#define HORIZON 1.0
#define DISK_THICK 0.55   // vertical half-thickness of the accretion disk

// --- hash / noise ---
float hash21(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float hash31(vec3 p){
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise3(vec3 x){
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n = mix(
    mix(mix(hash31(i+vec3(0,0,0)), hash31(i+vec3(1,0,0)), f.x),
        mix(hash31(i+vec3(0,1,0)), hash31(i+vec3(1,1,0)), f.x), f.y),
    mix(mix(hash31(i+vec3(0,0,1)), hash31(i+vec3(1,0,1)), f.x),
        mix(hash31(i+vec3(0,1,1)), hash31(i+vec3(1,1,1)), f.x), f.y),
    f.z);
  return n;
}
float fbm(vec3 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++){
    v += a * noise3(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

// Lensed background star field, sampled by escape direction.
vec3 starField(vec3 dir){
  vec3 col = vec3(0.0);
  vec2 uv = vec2(atan(dir.z, dir.x), asin(clamp(dir.y, -1.0, 1.0)));
  for (float l = 0.0; l < 4.0; l += 1.0){
    float scale = 180.0 + l * 340.0;
    vec2 g = uv * scale;
    vec2 id = floor(g);
    float h = hash21(id + l * 37.0);
    if (h > 0.972){
      vec2 cell = fract(g) - 0.5;
      float d = length(cell);
      float bright = smoothstep(0.5, 0.0, d) * (h - 0.972) / 0.028;
      float tw = 0.6 + 0.4 * sin(uTime * 2.0 + h * 100.0);
      vec3 tint = mix(vec3(0.65, 0.78, 1.0), vec3(1.0, 0.86, 0.66), hash21(id + 5.0));
      col += bright * tw * tint * (1.0 + l * 0.4);
    }
  }
  // faint galactic haze band
  float band = exp(-pow(dir.y * 2.0, 2.0));
  float neb = fbm(dir * 4.0 + 3.0);
  col += band * mix(vec3(0.02,0.03,0.06), vec3(0.10,0.07,0.14), neb) * 0.5;
  col += pow(neb, 3.0) * band * vec3(0.12, 0.10, 0.16) * 0.4;
  return col;
}

// Blackbody-ish color ramp from temperature parameter t in [0,1].
vec3 temperatureColor(float t){
  vec3 c1 = vec3(0.6, 0.10, 0.01); // deep orange-red
  vec3 c2 = vec3(1.0, 0.45, 0.08); // orange
  vec3 c3 = vec3(1.0, 0.93, 0.72); // white-yellow
  vec3 c4 = vec3(0.72, 0.86, 1.0); // blue-white
  vec3 col = mix(c1, c2, smoothstep(0.0, 0.35, t));
  col = mix(col, c3, smoothstep(0.32, 0.72, t));
  col = mix(col, c4, smoothstep(0.72, 1.0, t));
  return col;
}

// Emissive sampling of the volumetric disk at point p with photon dir vel.
vec3 sampleDisk(vec3 p, vec3 vel){
  float r = length(p.xz);
  if (r < uDiskInner || r > uDiskOuter) return vec3(0.0);

  // Vertical gaussian falloff -> disk has real thickness, thinner outside.
  float thick = DISK_THICK * (0.5 + 0.5 * (r / uDiskOuter));
  float vert = exp(-pow(p.y / thick, 2.0));
  if (vert < 0.004) return vec3(0.0);

  float temp = pow(uDiskInner / r, 0.75);            // Shakura-Sunyaev T ~ r^-3/4

  float ang = atan(p.z, p.x);
  vec3 phiHat = vec3(-sin(ang), 0.0, cos(ang));      // Keplerian (CCW) direction
  float speed = clamp(sqrt(0.5 / r), 0.0, 0.9);      // v = sqrt(r_s / 2r)

  vec3 viewDir = normalize(vel);
  float beta = speed;
  float cosA = dot(phiHat, viewDir);
  float gamma = 1.0 / sqrt(1.0 - beta * beta);
  float doppler = 1.0 / (gamma * (1.0 - beta * cosA)); // relativistic Doppler
  float grav = sqrt(max(1.0 - 1.0 / r, 0.0001));       // gravitational redshift
  float shift = doppler * grav;

  // Differential rotation shear + turbulence.
  float swirl = ang + uTime * (1.1 / pow(r, 1.5)) * 6.0;
  vec3 sp = vec3(cos(swirl) * r, p.y * 2.0, sin(swirl) * r);
  float turb = fbm(sp * 1.1);
  float density = smoothstep(0.25, 0.95, turb) * 0.8 + 0.25;
  density *= vert;
  density *= smoothstep(uDiskOuter, uDiskOuter * 0.82, r);
  density *= smoothstep(uDiskInner, uDiskInner * 1.12, r);

  vec3 base = temperatureColor(clamp(temp * shift, 0.0, 1.0));
  float beam = pow(doppler, 3.0);                      // surface-brightness beaming
  float intensity = (0.12 + temp * 2.6) * density * beam * grav;

  return base * intensity;
}

// Geodesic acceleration: a = -1.5 h^2 r / |r|^5  (r_s = 1).
vec3 accel(vec3 pos, float h2){
  float r = length(pos);
  return -1.5 * h2 * pos / pow(r, 5.0);
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;

  vec3 dir = normalize(uv.x * uCamBasis[0] * uFov
                     + uv.y * uCamBasis[1] * uFov
                     + uCamBasis[2]);

  vec3 pos = uCamPos;
  vec3 vel = dir;

  float h2 = dot(cross(pos, vel), cross(pos, vel));

  vec3 color = vec3(0.0);
  float transmit = 1.0;     // remaining transparency through the disk
  bool captured = false;

  float prevY = pos.y;
  float windings = 0.0;     // accumulated bend angle -> photon ring proxy
  vec3 prevDir = vel;

  for (int i = 0; i < STEPS; i++){
    float r = length(pos);

    float dt = clamp(0.016 * r, 0.010, 0.42);

    vec3 k1p = vel;
    vec3 k1v = accel(pos, h2);
    vec3 k2p = vel + 0.5 * dt * k1v;
    vec3 k2v = accel(pos + 0.5 * dt * k1p, h2);
    vec3 k3p = vel + 0.5 * dt * k2v;
    vec3 k3v = accel(pos + 0.5 * dt * k2p, h2);
    vec3 k4p = vel + dt * k3v;
    vec3 k4v = accel(pos + dt * k3p, h2);

    vec3 newPos = pos + (dt / 6.0) * (k1p + 2.0 * k2p + 2.0 * k3p + k4p);
    vec3 newVel = vel + (dt / 6.0) * (k1v + 2.0 * k2v + 2.0 * k3v + k4v);

    // Sample the volumetric disk near the equatorial plane.
    if (abs(newPos.y) < DISK_THICK * 1.5 && transmit > 0.01){
      float rr = length(newPos.xz);
      if (rr > uDiskInner && rr < uDiskOuter){
        vec3 em = sampleDisk(newPos, newVel);
        float dens = length(em) * 0.18 + 0.02;
        float absorb = clamp(dens * dt * 2.2, 0.0, 1.0);
        color += transmit * em * dt * 1.4;
        transmit *= (1.0 - absorb * 0.5);
      }
    }

    prevY = newPos.y;
    pos = newPos;
    vel = newVel;

    // Track total deflection for the photon-ring glow.
    windings += acos(clamp(dot(normalize(vel), normalize(prevDir)), -1.0, 1.0));
    prevDir = vel;

    float nr = length(pos);
    if (nr < HORIZON){ captured = true; break; }
    if (nr > 70.0){ break; }
  }

  if (!captured){
    color += transmit * starField(normalize(vel));
  }

  // Photon ring: photons that bent a large total angle without being captured
  // graze the unstable circular orbit at 1.5 r_s -> add a thin bright halo.
  if (!captured){
    float ring = smoothstep(2.4, 4.2, windings) * (1.0 - smoothstep(5.5, 8.0, windings));
    color += ring * vec3(1.0, 0.85, 0.6) * 0.9;
  }

  // ACES-ish tonemap + gamma.
  vec3 x = color;
  vec3 mapped = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
  mapped = clamp(mapped, 0.0, 1.0);
  mapped = pow(mapped, vec3(0.4545));

  gl_FragColor = vec4(mapped, 1.0);
}
`

const vertexShader = /* glsl */ `
void main(){
  gl_Position = vec4(position, 1.0);
}
`

type Controls = {
  azimuth: number
  incline: number
  radius: number
  dragging: boolean
  lastX: number
  lastY: number
  autoVel: number
}

function BlackHoleQuad({ controls }: { controls: React.MutableRefObject<Controls> }) {
  const { size, viewport } = useThree()

  const uniforms = useMemo(
    () => ({
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uCamPos: { value: new THREE.Vector3(0, 2.2, 15) },
      uCamBasis: { value: new THREE.Matrix3() },
      uFov: { value: Math.tan((52 * Math.PI) / 180 / 2) },
      uDiskInner: { value: 3.0 },
      uDiskOuter: { value: 15.0 },
    }),
    [],
  )

  useFrame((state, delta) => {
    const u = uniforms
    const c = controls.current

    u.uResolution.value.set(size.width * viewport.dpr, size.height * viewport.dpr)
    u.uTime.value = state.clock.elapsedTime

    // Gentle auto-orbit when the user is not dragging.
    if (!c.dragging) {
      c.azimuth += c.autoVel * delta
    }

    const radius = c.radius
    const camPos = new THREE.Vector3(
      Math.cos(c.azimuth) * radius * Math.cos(c.incline),
      Math.sin(c.incline) * radius,
      Math.sin(c.azimuth) * radius * Math.cos(c.incline),
    )
    u.uCamPos.value.copy(camPos)

    const forward = new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 0), camPos).normalize()
    const worldUp = new THREE.Vector3(0, 1, 0)
    const right = new THREE.Vector3().crossVectors(forward, worldUp).normalize()
    const up = new THREE.Vector3().crossVectors(right, forward).normalize()
    u.uCamBasis.value.set(right.x, up.x, forward.x, right.y, up.y, forward.y, right.z, up.z, forward.z)
  })

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        fragmentShader={fragmentShader}
        vertexShader={vertexShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}

export default function BlackHole() {
  const controls = useRef<Controls>({
    azimuth: 0,
    incline: 0.28,
    radius: 15,
    dragging: false,
    lastX: 0,
    lastY: 0,
    autoVel: 0.12,
  })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onDown = (e: PointerEvent) => {
      const c = controls.current
      c.dragging = true
      c.lastX = e.clientX
      c.lastY = e.clientY
      el.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      const c = controls.current
      if (!c.dragging) return
      const dx = e.clientX - c.lastX
      const dy = e.clientY - c.lastY
      c.lastX = e.clientX
      c.lastY = e.clientY
      c.azimuth -= dx * 0.006
      c.incline = Math.max(-1.45, Math.min(1.45, c.incline + dy * 0.005))
    }
    const onUp = (e: PointerEvent) => {
      controls.current.dragging = false
      try {
        el.releasePointerCapture(e.pointerId)
      } catch {}
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const c = controls.current
      c.radius = Math.max(5.5, Math.min(40, c.radius + e.deltaY * 0.01))
    }

    el.addEventListener("pointerdown", onDown)
    el.addEventListener("pointermove", onMove)
    el.addEventListener("pointerup", onUp)
    el.addEventListener("pointerleave", onUp)
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      el.removeEventListener("pointerdown", onDown)
      el.removeEventListener("pointermove", onMove)
      el.removeEventListener("pointerup", onUp)
      el.removeEventListener("pointerleave", onUp)
      el.removeEventListener("wheel", onWheel)
    }
  }, [])

  return (
    <div ref={containerRef} className="h-screen w-full cursor-grab touch-none bg-black active:cursor-grabbing">
      <Canvas
        gl={{ antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 1], fov: 50 }}
      >
        <BlackHoleQuad controls={controls} />
      </Canvas>
    </div>
  )
}
