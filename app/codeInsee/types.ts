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

export type InseeCodeUncleanedRecord = {
  results: NormalizedInseeResult[];
  collectivite: string;
  recordId: number;
  noResultMessage?: string;
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

export type mappedRecord = {
  id: number;
  [key: string]: any;
};
