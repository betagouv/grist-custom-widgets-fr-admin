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

export type DecoupageAdmin = {
  label: string;
  apiUrl: string;
  key: string;
};
