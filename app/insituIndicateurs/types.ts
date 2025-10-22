export type MailleLabel =
  | "region"
  | "departement"
  | "pays"
  | "commune"
  | "epci";

export enum MailleLabelEnum {
  Reg = "region",
  Dep = "departement",
  Pays = "pays",
  Com = "commune",
  Epci = "epci",
}

// Mapping of accepted string values for each mailleLabel (normalized: lowercase, no accents)
export const MAILLE_ACCEPTED_VALUES: Record<MailleLabel, string[]> = {
  region: ["region", "reg"],
  departement: ["departement", "dep"],
  pays: ["pays", "country", "fr", "france"],
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

export type InsituIndicSteps = "loading" | "menu";

export type Metadata = {
  identifiant?: string | null;
  nom?: string | null;
  description?: string | null;
  unite?: string | null;
  mailles?: MailleLabel[];
  returnType: string | null;
};

export type IndicateurOneValue = {
  __typename: "IndicateurOneValue";
  valeur: number | string;
};

export type IndicateurRow = {
  __typename: "IndicateurRow";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: any;
};

export type IndicateurRows = {
  __typename: "IndicateurRows";
  count: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any;
};

export type IndicateurListe = {
  __typename: "IndicateurListe";
  count: number;
  liste: string[];
};

export type IndicateurListeGeo = {
  __typename: "IndicateurListeGeo";
  count: number;
  properties: string[];
};

export type NarrowedTypeIndicateur =
  | IndicateurOneValue
  | IndicateurRow
  | IndicateurRows
  | IndicateurListe
  | IndicateurListeGeo;

export type FetchIndicateurReturnType<
  T extends NarrowedTypeIndicateur = NarrowedTypeIndicateur,
> = {
  metadata: Metadata;
  mailles: Record<string, T>;
};

export type FetchIndicateursReturnType = {
  indicateurs: FetchIndicateurReturnType[];
};

export type Stats = {
  toUpdateCount: number;
  updatedCount: number;
  invalidCount: number;
};
