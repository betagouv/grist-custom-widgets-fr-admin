export type MailleLabel =
  | "région"
  | "département"
  | "pays"
  | "commune"
  | "epci";

enum MailleLabelEnum {
  Reg = "région",
  Dep = "département",
  Pays = "pays",
  Com = "commune",
  Epci = "epci",
}
export const mailleLabelValues = Object.values(MailleLabelEnum);

export type InsituIndicSteps =
  | "loading"
  | "config"
  | "init_processing"
  | "update_processing"
  | "menu";

export type Metadata = {
  identifiant?: string | null;
  nom?: string | null;
  description?: string | null;
  unite?: string | null;
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
};

export type IndicateurListe = {
  __typename: "IndicateurListe";
  count: number;
};

export type IndicateurListeGeo = {
  __typename: "IndicateurListeGeo";
  count: number;
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
