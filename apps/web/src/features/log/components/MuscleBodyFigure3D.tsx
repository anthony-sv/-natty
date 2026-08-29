import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "@tanstack/react-store";
import { themeStore } from "@/features/theme/theme-store";
import { muscleSchema, type MuscleId } from "@/data/exercises";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Real anatomical geometry (CC BY-SA 4.0, Z-Anatomy / Open3DModel project —
 * see /about for attribution), exported from the Blender source at
 * `C:\Users\antho\OneDrive\Documents\Gym\Models\3D-Human-muscle.blend`.
 * Each of the 18 `muscleSchema` ids has its own material, named `muscle.<id>`
 * and shared between its `_l`/`_r` mesh pair — colouring one material colours
 * both sides. Bone materials are untouched, always their neutral tone.
 */
const MODEL_URL = "/models/muscle-figure.glb";
const MUSCLE_IDS = new Set<string>(muscleSchema.options);

let colorProbeEl: HTMLDivElement | null = null;
let colorProbeCtx: CanvasRenderingContext2D | null = null;

/**
 * Resolves a `var(--token)` (or any CSS colour) to something `THREE.Color.set`
 * can parse. Tokens here can be plain hex (`--fatigue-*`, `--status-*`) or
 * `oklch(...)` (`--muted`, from shadcn's palette) — three.js only understands
 * hex/rgb/hsl/named, not oklch.
 *
 * **Two steps, not one.** `var(--muted)` first needs the DOM's cascade to
 * resolve it at all — a bare canvas has no access to custom properties.
 * But `getComputedStyle(el).color` on a modern Chrome no longer normalises to
 * `rgb()` the way it used to: it now *preserves* the source colour space, so
 * an oklch token comes back as `"oklch(0.97 0 0)"` verbatim — and canvas
 * `fillStyle`'s own getter has the same "preserve, don't normalise" behaviour
 * on readback, so reading `ctx.fillStyle` back doesn't help either. Actually
 * *drawing* the fill and reading the rendered pixel bytes does: a canvas's
 * pixel buffer is always concrete sRGB 0-255 regardless of what colour space
 * the fill was specified in, so `getImageData` is what finally forces a real
 * value out of it. Without this step, every `--muted` (untrained) muscle
 * silently kept its original Blender-authored colour instead of graying out
 * — `THREE.Color.set` failed on the unparsed oklch string with no visible
 * error, so it looked like coloring worked (fatigue tokens are hex, and hex
 * *does* normalise to rgb() on both steps) while roughly two-thirds of the
 * figure was quietly never being recoloured at all.
 */
function resolveCssColor(value: string): string {
  if (typeof document === "undefined") return value;

  colorProbeEl ??= document.createElement("div");
  colorProbeEl.style.color = value;
  document.body.appendChild(colorProbeEl);
  const cascaded = getComputedStyle(colorProbeEl).color;
  document.body.removeChild(colorProbeEl);
  if (!cascaded) return value;

  if (!colorProbeCtx) {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    colorProbeCtx = canvas.getContext("2d");
  }
  if (!colorProbeCtx) return cascaded;

  colorProbeCtx.fillStyle = cascaded;
  colorProbeCtx.fillRect(0, 0, 1, 1);
  const [r, g, b] = colorProbeCtx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

function muscleIdForMaterial(material: THREE.Material): MuscleId | null {
  if (!material.name.startsWith("muscle.")) return null;
  const id = material.name.slice("muscle.".length);
  return MUSCLE_IDS.has(id) ? (id as MuscleId) : null;
}

/**
 * A material persists in `useGLTF`'s cache (and is shared by reference across
 * every `scene.clone()`) for the whole tab's lifetime, so re-reading `mat.color`
 * fresh on each mount would, after the *first* mount ever recolours a muscle,
 * "capture" that recolouring as if it were the Blender-authored original —
 * silently losing the real native tone on every mount after the first. Keyed
 * by material identity rather than muscle id so a mesh's own material object
 * is what's checked, not a re-derived assumption about which material it is.
 */
const originalColorByMaterial = new WeakMap<THREE.Material, THREE.Color>();
function originalColorOf(mat: THREE.MeshStandardMaterial): THREE.Color {
  let color = originalColorByMaterial.get(mat);
  if (!color) {
    color = mat.color.clone();
    originalColorByMaterial.set(mat, color);
  }
  return color;
}

function Figure({
  colorFor,
  onSelect,
  onHover,
}: {
  colorFor: (muscle: MuscleId) => string | null;
  onSelect?: (muscle: MuscleId) => void;
  onHover: (muscle: MuscleId | null) => void;
}) {
  const { scene } = useGLTF(MODEL_URL);
  const theme = useStore(themeStore);
  const { camera, raycaster, pointer, gl } = useThree();

  // `/progress`'s tabs fully unmount their inactive panels (see
  // `VolumePanel`'s own doc comment), so this component mounts and unmounts
  // every time the tab is left and revisited — and `scene` is the *same*
  // cached object (by URL) across every one of those mounts, `useGLTF`
  // never refetches it. Handing that literal object to `<primitive>` a
  // second time, on a second mount, is what broke: three.js/R3F attach
  // bookkeeping directly onto the mesh/material instances the first time
  // they're adopted into a Canvas, and a second `<primitive>` adopting the
  // *same* already-tagged objects into a *new* reconciler tree collided with
  // it (surfaced here as an R3F prop-application error on the second mount —
  // the model silently never reappeared). `scene.clone()` gives each mount
  // its own fresh, never-before-adopted Object3D/Mesh graph to hand to
  // `<primitive>`, while sharing the *materials* by reference (three.js's
  // default shallow clone) — which is exactly what's wanted, since colouring
  // a shared material is what makes recolouring visible on whichever mount
  // currently renders it. `useMemo`'s cache doesn't survive an unmount, so
  // this naturally re-clones once per real mount and nowhere else.
  //
  // **A previous version of this effect called `useGLTF.clear(MODEL_URL)`
  // (and, before that, manually `.dispose()`d the scene) on every unmount, on
  // the mistaken belief that the cache needed invalidating or the shared
  // scene needed disposing.** Neither was true — `<primitive>` is explicitly
  // exempt from R3F's auto-dispose ("Never dispose of primitives because
  // their state may be kept outside of React!", R3F's own comment in
  // `removeChild`) — and clearing the cache forced a full network refetch +
  // Draco re-decode + fresh GLTF parse on every single remount, repeatedly,
  // fast enough to peg the tab and leak memory badly. Don't reintroduce any
  // cache-clearing or manual disposal here; cloning is the whole fix.
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  const meshToMuscle = useMemo(() => {
    const map = new Map<THREE.Object3D, MuscleId>();
    clonedScene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
      const id = mat ? muscleIdForMaterial(mat) : null;
      if (id) map.set(obj, id);
    });
    return map;
  }, [clonedScene]);

  // Original colour per material, captured once before anything recolours
  // it — `colorFor` returning `null` (natural, un-flagged state) means
  // "put it back to this," not "skip it": without a real original to
  // revert to, a muscle coloured once by the spectrum toggle would stay
  // that colour forever after switching back, since skipping a `.set()`
  // call leaves whatever the *previous* render left behind, not the
  // Blender-authored tone.
  const materialsByMuscle = useMemo(() => {
    const map = new Map<MuscleId, { mat: THREE.MeshStandardMaterial; original: THREE.Color }[]>();
    clonedScene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of mats) {
        const id = muscleIdForMaterial(mat);
        if (!id) continue;
        const list = map.get(id) ?? [];
        const m = mat as THREE.MeshStandardMaterial;
        list.push({ mat: m, original: originalColorOf(m) });
        map.set(id, list);
      }
    });
    return map;
  }, [clonedScene]);

  useEffect(() => {
    for (const [muscle, entries] of materialsByMuscle) {
      const requested = colorFor(muscle);
      for (const { mat, original } of entries) {
        if (requested === null) {
          mat.color.copy(original);
        } else {
          mat.color.set(resolveCssColor(requested));
        }
      }
    }
    // `theme` isn't read directly, but a toggle changes what CSS vars resolve
    // to — re-running the resolve step is the whole point of the dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialsByMuscle, colorFor, theme]);

  const meshes = useMemo(() => [...meshToMuscle.keys()], [meshToMuscle]);

  useFrame(() => {
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(meshes, false)[0];
    onHover(hit ? (meshToMuscle.get(hit.object) ?? null) : null);
  });

  useEffect(() => {
    if (!onSelect) return;
    const canvas = gl.domElement;
    const handleClick = () => {
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(meshes, false)[0];
      const id = hit ? meshToMuscle.get(hit.object) : undefined;
      if (id) onSelect(id);
    };
    canvas.addEventListener("click", handleClick);
    return () => canvas.removeEventListener("click", handleClick);
  }, [gl, camera, raycaster, pointer, meshes, meshToMuscle, onSelect]);

  return <primitive object={clonedScene} />;
}

/**
 * One orbit-able 3D figure, replacing the front/back SVG pair
 * (`MuscleBodyMap.tsx`) with real anatomy. Same `colorFor`/`labelFor`
 * contract as `MuscleBodyFigure` so callers barely change.
 *
 * **Known gap, not silently dropped:** the SVG version's per-region
 * `tabIndex`/keyboard `Enter`/`Space` selection has no equivalent here —
 * hover/click detection is raycasting against the loaded mesh, which isn't
 * keyboard-reachable. `FatigueCard`'s own "recovering" list already exposes
 * the same muscle/state data as real, accessible DOM text, so nothing is
 * lost — but tabbing to an individual muscle *on the figure itself* isn't
 * possible the way it was on the SVG.
 */
export function MuscleBodyFigure3D({
  summary,
  colorFor,
  labelFor,
  onSelect,
}: {
  summary: string;
  colorFor: (muscle: MuscleId) => string | null;
  labelFor: (muscle: MuscleId) => string;
  onSelect?: (muscle: MuscleId) => void;
}) {
  const [hovered, setHovered] = useState<MuscleId | null>(null);

  return (
    <div
      className="relative aspect-square w-full max-w-xs"
      role="img"
      aria-label={summary}
    >
      <Suspense fallback={<Skeleton className="size-full rounded-md" />}>
        <Canvas camera={{ position: [0, 1.05, 2.6], fov: 35 }} dpr={[1, 2]}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[2, 3, 3]} intensity={1.2} />
          <directionalLight position={[-2, 1, -2]} intensity={0.4} />
          <Figure colorFor={colorFor} onSelect={onSelect} onHover={setHovered} />
          <OrbitControls
            enablePan={false}
            enableDamping
            minDistance={1.5}
            maxDistance={4}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={(Math.PI * 5) / 6}
            target={[0, 1.05, 0]}
          />
        </Canvas>
      </Suspense>
      {hovered ? (
        <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-md bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-md">
          {labelFor(hovered)}
        </div>
      ) : null}
    </div>
  );
}

useGLTF.preload(MODEL_URL);
