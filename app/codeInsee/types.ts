export type NormalizedInseeResult = {
  lib_groupement: string;
  siren_groupement: string;
  nature_juridique: string;
  code_insee: string;
  insee_dep: string;
  score: number;
};

export type NormalizedInseeResults = {
  results: NormalizedInseeResult[];
  query: string;
};

export type EntiteAdmin = {
  label: string;
  apiGeoUrl?: string;
  key: string;
  typeCode: string;
  echelonGeo?: string;
};
