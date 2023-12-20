export type NormalizedGeocodeResult = {
  lat: number;
  lng: number;
  address_nomalized: string;
  score: number;
  departement: string;
};

export type CleanGeoCodeRecord = NormalizedGeocodeResult & {
  address: string;
  recordId: number;
};
