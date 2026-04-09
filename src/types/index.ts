export type NodeType =
  | "character"
  | "location"
  | "event"
  | "faction"
  | "item"
  | "concept";

export interface WorldNode {
  id: string;
  type: NodeType;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string[];
  links: string[];
  graphPosition?: { x: number; y: number };
  metadata: {
    createdAt: string;
    updatedAt: string;
    color?: string;
    icon?: string;
    pinned?: boolean;
  };
}

export interface WorldEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type: "directed" | "bidirectional";
  metadata?: {
    strength?: "weak" | "moderate" | "strong";
    color?: string;
  };
}

export interface Theme {
  id: string;
  name: string;
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    borderSubtle: string;
    primary: string;
    primaryForeground: string;
    accent: string;
    accentForeground: string;
    text: string;
    textMuted: string;
    textSubtle: string;
    character: string;
    location: string;
    event: string;
    faction: string;
    item: string;
    concept: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  borderRadius: "none" | "sm" | "md" | "lg" | "full";
  animationSpeed: "none" | "slow" | "normal" | "fast";
}

export interface WorldSettings {
  autoLink: boolean;
  graphPhysics: boolean;
  clusterByType: boolean;
  defaultNodeType: NodeType;
  autoSave: boolean;
  saveIntervalMs: number;
}

export interface World {
  id: string;
  name: string;
  description: string;
  nodes: Record<string, WorldNode>;
  edges: WorldEdge[];
  theme: Theme;
  settings: WorldSettings;
  createdAt: string;
  updatedAt: string;
  version: number;
}
