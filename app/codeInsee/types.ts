export type NormalizedInseeResult = {
  nom: string;
  code: string;
  _score: number;
  departement?: {
    code: string;
    nom: string;
  };
};

export type NormalizedInseeResults = NormalizedInseeResult[];

export type InseeCodeUncleanedRecord = {
  results: NormalizedInseeResult[];
  collectivite: string;
  recordId: number;
  noResultMessage?: string;
  toIgnore: boolean;
};

export type DirtyInseeCodeRecord = InseeCodeUncleanedRecord & {
  dirtyMessage: string;
};

export type CleanInseeCodeRecord = NormalizedInseeResult & {
  collectivite: string;
  recordId: number;
};

export type NoResultInseeCodeRecord = {
  result?: NormalizedInseeResult;
  recordId: number;
  noResultMessage: string;
};

export type DecoupageAdmin = {
  label: string;
  apiUrl: string;
  key: string;
};
