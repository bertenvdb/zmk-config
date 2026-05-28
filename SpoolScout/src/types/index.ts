export interface SpoolmanVendor {
  id: number;
  name: string;
  comment?: string | null;
  empty_spool_weight?: number | null;
}

export interface SpoolmanFilament {
  id: number;
  name?: string | null;
  vendor?: SpoolmanVendor | null;
  material?: string | null;
  color_hex?: string | null;
  settings_extruder_temp?: number | null;
  settings_bed_temp?: number | null;
  weight?: number | null;
  comment?: string | null;
  article_number?: string | null;
}

export interface SpoolmanLocation {
  id: number;
  name: string;
}

export interface SpoolmanSpool {
  id: number;
  filament: SpoolmanFilament;
  location?: SpoolmanLocation | null;
  remaining_weight?: number | null;
  initial_weight?: number | null;
  first_used?: string | null;
  last_used?: string | null;
  archived: boolean;
  comment?: string | null;
  price?: number | null;
}

export interface OpenSpoolTag {
  protocol: string;
  version: string;
  type: string;
  color_hex: string;
  brand: string;
  min_temp: string;
  max_temp: string;
  spoolman_id?: number;
}

export interface AppSettings {
  spoolmanUrl: string;
  moonrakerUrl: string;
}

export type RootStackParamList = {
  Main: undefined;
  ConnectionError: undefined;
  QuickAction: { tag: OpenSpoolTag };
};

export type TabParamList = {
  Spools: undefined;
  Filaments: undefined;
  Manufacturers: undefined;
  Settings: undefined;
};

export type SpoolStackParamList = {
  SpoolsList: undefined;
  SpoolDetail: { spoolId: number };
  SpoolCreateEdit: { spoolId?: number };
};

export type ManufacturerStackParamList = {
  ManufacturersList: undefined;
  ManufacturerOverride: { vendorId: number; vendorName: string };
};
