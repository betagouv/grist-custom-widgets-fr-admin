export type NormalizedGeocodeResult = {
  lat: number;
  lng: number;
  address_nomalized: string;
  score: number;
  departement: string;
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
