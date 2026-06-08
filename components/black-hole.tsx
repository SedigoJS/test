"use client"

import { useRef, useMemo } from "react"
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
 *   - capture by the event horizon (r < 1)
 *   - crossing of the equatorial accretion disk (between ISCO at r=3 and r_out)
 *   - escape to infinity -> lensed background starfield
 *
 * The disk is shaded with blackbody-like temperature falloff, relativistic
 * Doppler beaming/boosting from orbital velocity, and gravitational redshift.
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
#define STEPS 220
#define HORIZON 1.0

// --- hash / noise for stars + disk turbulence ---
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

// Lensed background star field, sampled by escape direction.
vec3 starField(vec3 dir){
  vec3 col = vec3(0.0);
  // Use direction projected onto a grid for stable stars.
  vec2 uv = vec2(atan(dir.z, dir.x), asin(clamp(dir.y, -1.0, 1.0)));
  for (float l = 0.0; l < 3.0; l += 1.0){
    float scale = 220.0 + l * 360.0;
    vec2 g = uv * scale;
    vec2 id = floor(g);
    float h = hash21(id + l * 37.0);
    if (h > 0.978){
      vec2 cell = fract(g) - 0.5;
      float d = length(cell);
      float bright = smoothstep(0.5, 0.0, d) * (h - 0.978) / 0.022;
      float tw = 0.7 + 0.3 * sin(uTime * 2.0 + h * 100.0);
      vec3 tint = mix(vec3(0.7, 0.8, 1.0), vec3(1.0, 0.9, 0.75), hash21(id + 5.0));
      col += bright * tw * tint * 0.9;
    }
  }
  // faint milky-way style haze band
  float band = exp(-pow(dir.y * 2.2, 2.0)) * 0.04;
  col += band * vec3(0.18, 0.2, 0.32) * (0.5 + 0.5 * noise3(dir * 6.0));
  return col;
}

// Blackbody-ish color ramp from temperature parameter t in [0,1].
vec3 temperatureColor(float t){
  // cool outer (orange) -> hot inner (blue-white)
  vec3 c1 = vec3(0.55, 0.12, 0.02); // deep orange-red
  vec3 c2 = vec3(1.0,  0.5,  0.12); // orange
  vec3 c3 = vec3(1.0,  0.92, 0.7);  // white-yellow
  vec3 c4 = vec3(0.75, 0.85, 1.0);  // blue-white
  vec3 col = mix(c1, c2, smoothstep(0.0, 0.35, t));
  col = mix(col, c3, smoothstep(0.3, 0.7, t));
  col = mix(col, c4, smoothstep(0.7, 1.0, t));
  return col;
}

// Emission + relativistic effects when a ray crosses the disk plane.
vec3 sampleDisk(vec3 p, vec3 vel){
  float r = length(p.xz);
  if (r < uDiskInner || r > uDiskOuter) return vec3(0.0);

  float tNorm = clamp((r - uDiskInner) / (uDiskOuter - uDiskInner), 0.0, 1.0);

  // Temperature follows ~ r^-3/4 (Shakura-Sunyaev thin disk).
  float temp = pow(uDiskInner / r, 0.75);

  // Keplerian orbital direction (counter-clockwise) in the equatorial plane.
  float ang = atan(p.z, p.x);
  vec3 phiHat = vec3(-sin(ang), 0.0, cos(ang));
  // Orbital speed (fraction of c): v = sqrt(r_s / (2 r)) for circular orbit.
  float speed = sqrt(0.5 / r);
  speed = clamp(speed, 0.0, 0.85);

  // Doppler factor from line-of-sight velocity component.
  vec3 viewDir = normalize(vel);
  float beta = speed;
  float cosA = dot(phiHat, viewDir);
  float gamma = 1.0 / sqrt(1.0 - beta * beta);
  // Relativistic Doppler factor (approaching > 1 -> brighter & blueshifted).
  float doppler = 1.0 / (gamma * (1.0 - beta * cosA));

  // Gravitational redshift factor sqrt(1 - r_s/r).
  float grav = sqrt(max(1.0 - 1.0 / r, 0.0001));

  // Combined frequency shift (affects color temperature).
  float shift = doppler * grav;

  // Turbulent emission pattern, sheared by differential rotation.
  float swirl = ang + uTime * (1.2 / pow(r, 1.5)) * 6.0;
  vec3 sp = vec3(cos(swirl) * r, p.y, sin(swirl) * r);
  float turb = noise3(sp * 1.4) * 0.6 + noise3(sp * 4.0) * 0.4;
  float density = smoothstep(0.0, 1.0, turb) * 0.7 + 0.3;
  // soften edges
  density *= smoothstep(uDiskOuter, uDiskOuter * 0.8, r);
  density *= smoothstep(uDiskInner, uDiskInner * 1.15, r);

  vec3 base = temperatureColor(clamp(temp * shift, 0.0, 1.0));

  // Brightness: emission * relativistic beaming (doppler^3 for surface bright.)
  float beam = pow(doppler, 3.0);
  float intensity = (0.15 + temp * 2.4) * density * beam * grav;

  return base * intensity;
}

// Geodesic acceleration: a = -1.5 h^2 r / |r|^5  (r_s = 1).
vec3 accel(vec3 pos, float h2){
  float r = length(pos);
  return -1.5 * h2 * pos / pow(r, 5.0);
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;

  // Build the primary ray in world space.
  vec3 dir = normalize(uv.x * uCamBasis[0] * uFov
                     + uv.y * uCamBasis[1] * uFov
                     + uCamBasis[2]);

  vec3 pos = uCamPos;
  vec3 vel = dir;

  // Conserved angular momentum for this photon.
  float h2 = dot(cross(pos, vel), cross(pos, vel));

  vec3 color = vec3(0.0);
  bool captured = false;
  bool escaped = false;

  float prevY = pos.y;

  for (int i = 0; i < STEPS; i++){
    float r = length(pos);

    // Adaptive step: small near the hole, large far away.
    float dt = 0.018 * r;
    dt = clamp(dt, 0.012, 0.45);

    // RK4 integration of d(pos)/dt = vel, d(vel)/dt = accel.
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

    // Disk crossing: equatorial plane y = 0.
    if (prevY * newPos.y < 0.0){
      float tCross = prevY / (prevY - newPos.y);
      vec3 cross = mix(pos, newPos, tCross);
      vec3 crossVel = mix(vel, newVel, tCross);
      vec3 disk = sampleDisk(cross, crossVel);
      // Disk is emissive; accumulate (front to back, simple add since thin).
      color += disk;
    }

    prevY = newPos.y;
    pos = newPos;
    vel = newVel;

    float nr = length(pos);
    if (nr < HORIZON){ captured = true; break; }
    if (nr > 60.0){ escaped = true; break; }
  }

  if (!captured){
    color += starField(normalize(vel));
  }

  // Subtle bloom-ish tonemap (ACES approximation).
  color *= 1.0;
  vec3 x = color;
  vec3 mapped = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
  mapped = clamp(mapped, 0.0, 1.0);
  // mild gamma
  mapped = pow(mapped, vec3(0.4545));

  gl_FragColor = vec4(mapped, 1.0);
}
`

const vertexShader = /* glsl */ `
void main(){
  gl_Position = vec4(position, 1.0);
}
`

function BlackHoleQuad() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const { size, viewport } = useThree()

  const uniforms = useMemo(
    () => ({
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uCamPos: { value: new THREE.Vector3(0, 2.2, 14) },
      uCamBasis: { value: new THREE.Matrix3() },
      uFov: { value: Math.tan((55 * Math.PI) / 180 / 2) },
      uDiskInner: { value: 3.0 },
      uDiskOuter: { value: 14.0 },
    }),
    [],
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const u = uniforms

    u.uResolution.value.set(size.width * viewport.dpr, size.height * viewport.dpr)
    u.uTime.value = t

    // Camera slowly orbits the black hole at a shallow inclination so the
    // lensed far side of the disk arcs over the top.
    const radius = 15.0
    const azimuth = t * 0.12
    const incline = 0.32 + Math.sin(t * 0.18) * 0.06
    const camPos = new THREE.Vector3(
      Math.cos(azimuth) * radius * Math.cos(incline),
      Math.sin(incline) * radius,
      Math.sin(azimuth) * radius * Math.cos(incline),
    )
    u.uCamPos.value.copy(camPos)

    // Build an orthonormal camera basis looking at the origin.
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
        ref={matRef}
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
  return (
    <div className="h-screen w-full bg-black">
      <Canvas
        gl={{ antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 1], fov: 50 }}
      >
        <BlackHoleQuad />
      </Canvas>
    </div>
  )
}
