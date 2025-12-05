export type NormalizedInseeResult = {
  lib_groupement: string;
  maille: string;
  code: string;
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

export type MailleLabel =
  | "region"
  | "departement"
  | "commune"
  | "epci";

export enum MailleLabelEnum {
  Reg = "region",
  Dep = "departement",
  Com = "commune",
  Epci = "epci",
}

// Mapping of accepted string values for each mailleLabel (normalized: lowercase, no accents)
export const MAILLE_ACCEPTED_VALUES: Record<MailleLabel, string[]> = {
  region: ["region", "reg"],
  departement: ["departement", "dep"],
  commune: ["commune", "com", "city", "ville"],
  epci: [
    "epci",
    "petr",
    "cc",
    "communaute de communes",
    "comcom",
    "ca",
    "communaute d'agglomeration",
    "cu",
    "communaute urbaine",
    "metro",
    "metropole",
  ],
};
