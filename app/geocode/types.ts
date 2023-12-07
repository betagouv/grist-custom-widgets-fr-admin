export type NormalizedGeocodeResult = {
  lat: number;
  lng: number;
  address_nomalized: string;
  score: number;
};

export type NormalizedGeocodeResults = {
  results: NormalizedGeocodeResult[];
  query: string;
};

export type GeoCodeUncleanedRecord = {
  results: NormalizedGeocodeResult[];
  recordId: number;
  address: string;
  noResultMessage?: string;
  toIgnore: boolean;
};

export type DirtyGeoCodeRecord = GeoCodeUncleanedRecord & {
  dirtyMessage: string;
};

export type CleanGeoCodeRecord = NormalizedGeocodeResult & {
  address: string;
  recordId: number;
};

export type NoResultGeoCodeRecord = {
  result?: NormalizedGeocodeResult;
  recordId: number;
  noResultMessage: string;
};

export type MappedRecord = {
  id: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type Step =
  | "loading"
  | "config"
  | "global_processing"
  | "specific_processing"
  | "menu";
