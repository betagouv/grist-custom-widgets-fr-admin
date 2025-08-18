export type QPVCheckResult = {
  inQPV: boolean;
  qpvInfo: Array<{ nom: string; code: string }>;
};

export type QPVWidgetSteps = "loading" | "qpv_data_loading" | "menu";

export type QPVInfo = {
  nom: string;
  code: string;
  commune: string;
  epci: string;
  departement: string;
  region: string;
};

export type QPVData = {
  features: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>[];
};

export type ResultStats = {
  validCount: number;
  qpvCount: number;
  invalidCount: number;
};
