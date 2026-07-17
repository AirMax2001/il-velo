import { MapConfig, CameraState, MapLocation } from "@/types/map";

// ── Default config ──
export const DEFAULT_CONFIG: MapConfig = {
  imagePath: "/maps/world.png",
  imageWidth: 3840,
  imageHeight: 2160,
  initialZoom: 0.25,
  minZoom: 0.15,
  maxZoom: 3,
  defaultLocationZoom: 1.2,
};

// ── Convert image coords to screen coords ──
export function imageToScreen(
  ix: number,
  iy: number,
  camera: CameraState,
  config: MapConfig,
  viewW: number,
  viewH: number
): [number, number] {
  const cx = viewW / 2 - camera.x * camera.zoom;
  const cy = viewH / 2 - camera.y * camera.zoom;
  return [ix * camera.zoom + cx, iy * camera.zoom + cy];
}

// ── Convert screen coords to image coords ──
export function screenToImage(
  sx: number,
  sy: number,
  camera: CameraState,
  config: MapConfig,
  viewW: number,
  viewH: number
): [number, number] {
  const cx = viewW / 2 - camera.x * camera.zoom;
  const cy = viewH / 2 - camera.y * camera.zoom;
  return [(sx - cx) / camera.zoom, (sy - cy) / camera.zoom];
}

// ── Check if a point is inside a polygon ──
export function pointInPolygon(
  px: number,
  py: number,
  polygon: [number, number][]
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1];
    const xj = polygon[j][0],
      yj = polygon[j][1];
    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// ── Get polygon center ──
export function polygonCenter(polygon: [number, number][]): [number, number] {
  let cx = 0,
    cy = 0;
  for (const [x, y] of polygon) {
    cx += x;
    cy += y;
  }
  return [cx / polygon.length, cy / polygon.length];
}

// ── Clamp camera to valid area ──
export function clampCamera(
  cam: CameraState,
  config: MapConfig,
  viewW: number,
  viewH: number
): CameraState {
  const maxX = config.imageWidth;
  const maxY = config.imageHeight;
  const vw = viewW / cam.zoom;
  const vh = viewH / cam.zoom;
  return {
    x: Math.max(vw / 2, Math.min(maxX - vw / 2, cam.x)),
    y: Math.max(vh / 2, Math.min(maxY - vh / 2, cam.y)),
    zoom: Math.max(config.minZoom, Math.min(config.maxZoom, cam.zoom)),
  };
}

// ── Lerp ──
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ── Ease in-out ──
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ── Spring physics (single step) ──
export function spring(
  current: number,
  target: number,
  velocity: number,
  stiffness = 180,
  damping = 18
): [number, number] {
  const force = (target - current) * stiffness;
  const damp = velocity * damping;
  const accel = force - damp;
  const newVelocity = velocity + accel * (1 / 60);
  const newValue = current + newVelocity * (1 / 60);
  return [newValue, newVelocity];
}

// ── Spring-based camera step ──
export function springCamera(
  current: CameraState,
  target: CameraState,
  vx: number,
  vy: number,
  vz: number
): [CameraState, number, number, number] {
  const [nx, nvx] = spring(current.x, target.x, vx);
  const [ny, nvy] = spring(current.y, target.y, vy);
  const [nz, nvz] = spring(current.zoom, target.zoom, vz);
  return [{ x: nx, y: ny, zoom: nz }, nvx, nvy, nvz];
}

// ── Get zoom level label ──
export function getZoomLevel(zoom: number): "world" | "region" | "local" {
  if (zoom < 0.5) return "world";
  if (zoom < 1) return "region";
  return "local";
}

// ── Find location at point ──
export function findLocationAt(
  ix: number,
  iy: number,
  locations: MapLocation[]
): MapLocation | null {
  for (let i = locations.length - 1; i >= 0; i--) {
    const loc = locations[i];
    if (!loc.unlocked) continue;
    if (pointInPolygon(ix, iy, loc.polygon)) return loc;
  }
  return null;
}

// ── SVG path from polygon ──
export function polygonToPath(polygon: [number, number][]): string {
  if (polygon.length === 0) return "";
  let d = `M ${polygon[0][0]} ${polygon[0][1]}`;
  for (let i = 1; i < polygon.length; i++) {
    d += ` L ${polygon[i][0]} ${polygon[i][1]}`;
  }
  d += " Z";
  return d;
}
