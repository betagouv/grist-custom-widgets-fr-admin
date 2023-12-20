export type NormalizedSirenResult = {
  label: string;
  code_commune: string;
  siren: string;
  siret: string;
  score: number;
};

export type NormalizedSirenResults = {
  results: NormalizedSirenResult[];
  query: string;
};
