export interface MapConfig {
  imagePath: string;
  imageWidth: number;
  imageHeight: number;
  initialZoom: number;
  minZoom: number;
  maxZoom: number;
  defaultLocationZoom: number;
}

export interface MapLocation {
  id: string;
  name: string;
  description: string;
  polygon: [number, number][];
  zoom: number;
  icon?: string;
  unlocked: boolean;
  discovered: boolean;
  difficulty?: number;
  npcCount?: number;
  quests?: string[];
  image?: string;
  connectedLocations?: string[];
  category: "city" | "forest" | "dungeon" | "harbor" | "mountain" | "ruin" | "temple" | "shop" | "landmark";
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export interface MapState {
  camera: CameraState;
  selectedId: string | null;
  hoveredId: string | null;
  discovered: Set<string>;
  locations: MapLocation[];
  showFog: boolean;
  dayNight: "day" | "night";
  targetCamera: CameraState | null;
}

export type ZoomLevel = "world" | "region" | "local";

export interface PanelData {
  location: MapLocation;
  visible: boolean;
}

export interface TooltipData {
  location: MapLocation;
  x: number;
  y: number;
  visible: boolean;
}

export type MapMarkerType = "quest" | "npc" | "combat" | "merchant" | "boss" | "player" | "event";

export interface MapMarker {
  id: string;
  locationId: string;
  type: MapMarkerType;
  x: number;
  y: number;
  label?: string;
  visible: boolean;
  zoomRange?: [number, number];
  pulse?: boolean;
  icon?: string;
}
