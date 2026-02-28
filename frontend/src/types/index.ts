export interface ConnectionConfig {
  hass_url: string;
  token_stored: boolean;
}

export interface SidebarConfig {
  width: number;
  visible: boolean;
  show_clock: boolean;
  show_weather: boolean;
  weather_entity: string;
}

export interface HacsCardEntry {
  name: string;
  url: string;
  version: string;
}

export interface AppConfiguration {
  version: number;
  connection: ConnectionConfig;
  locale: string;
  custom_js_enabled: boolean;
  hacs_cards: HacsCardEntry[];
  sidebar: SidebarConfig;
}

export interface CardItem {
  id: string;
  type: string;
  entity: string;
  size: string;
  config: Record<string, unknown>;
  order?: number;
  visible?: boolean;
  customLabel?: string;
  customIcon?: string;
  customColor?: string;
}

export interface SubSection {
  id: string;
  title: string;
  items: CardItem[];
}

export interface Section {
  id: string;
  title: string;
  icon: string;
  items: CardItem[];
  subsections: SubSection[];
}

export interface HeaderConfig {
  show_badges: boolean;
  badges: string[];
}

export interface ViewConfig {
  id: string;
  name: string;
  icon: string;
  type: "grid" | "object_page";
  area: string;
  header: HeaderConfig;
  layout: Record<string, unknown>;
  sections: Section[];
}

export interface DashboardConfig {
  version: number;
  theme: string;
  accent_color: string;
  auto_theme: boolean;
  sidebar_visible: boolean;
  default_view: string;
  views: ViewConfig[];
}

export interface EntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export interface Area {
  area_id: string;
  name: string;
  picture: string | null;
  floor_id: string | null;
}

export interface Device {
  id: string;
  name: string;
  area_id: string | null;
  manufacturer: string;
  model: string;
}

export interface Floor {
  floor_id: string;
  name: string;
  level: number;
}
