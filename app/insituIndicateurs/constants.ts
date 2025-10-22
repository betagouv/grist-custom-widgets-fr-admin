export const TITLE =
  "Ajouter la valeur d'un indicateur Insitu pour un code INSEE et une maille donnés";

export const DESCRIPTION_COLONNE_INDICATEUR =
  "Cette colonne correspond aux valeurs de l'indicateur du catalogue d'indicateur de l'ANCT portant l'identifiant: ";

export const COLUMN_MAPPING_NAMES = {
  CODE_INSEE: {
    name: "code_insee",
    title: "Code Insee",
    description: "Indiquez la colonne comportant le code Insee du territoire",
    type: "Any",
    optional: false,
  },
  MAILLE: {
    name: "maille",
    title: "Maille",
    description:
      "Indiquez la colonne comportant la maille du territoire (valeurs acceptées: commune, epci, departement, region, pays)",
    type: "Any",
    optional: false,
  },
  VALEUR_INDICATEUR: {
    name: "valeur_indicateur",
    title: "Indicateur",
    description:
      "Indiquez la colonne dans laquelle vous souhaitez remplir les valeurs d'un indicateur que vous choisirez par la suite",
    type: "Any",
    optional: false,
  },
};

export const ERROR_DATA_MESSAGE = {
  CODE_INSEE_VIDE: "Erreur: Le code insee est vide",
  CODE_INSEE_INVALIDE: "Erreur: Le code insee n'est pas valide",
  MAILLE_VIDE: "Erreur: La maille est vide",
  MAILLE_INVALIDE: "Erreur: La maille n'est pas valide",
};
