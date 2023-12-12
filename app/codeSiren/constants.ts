export const TITLE = "Ajouter les codes SIREN à partir d'un nom";

export const COLUMN_MAPPING_NAMES = {
  NAME: {
    name: "name",
    title: "Nom (source)",
    type: "Any",
    optional: false,
  },
  DEPARTEMENT: {
    name: "departement",
    title: "Code Insee du département (désambiguité)",
    type: "Any",
    optional: true,
  },
  CODE_COMMUNE: {
    name: "code_commune",
    title: "Code Insee de la commune (désambiguité)",
    type: "Any",
    optional: true,
  },
  CODE_POSTAL: {
    name: "code_postal",
    title: "Code postal de la commune (désambiguité)",
    type: "Any",
    optional: true,
  },
  SIREN: {
    name: "siren",
    title: "SIREN (destination)",
    type: "Any",
    optional: false,
  },
  NORMALIZED_NAME: {
    name: "nom_normalise",
    title: "Nom normalisé (destination)",
    type: "Any",
    optional: true,
  },
};

export const NO_DATA_MESSAGES = {
  NO_INSEE_CODE:
    "Il n’existe pas de code INSEE dans les résultats pour la collectivité sélectionnée.",
  NO_RESULT:
    "Aucun résultat ne correspond à la collectivité sélectionnée. Veuillez vérifier si cette collectivité existe bien ou qu’il n’y a pas d’erreur.",
  NO_SOURCE_DATA:
    "Afin de traiter la ligne sélectionnée, veuillez renseigner la collectivité recherchée.",
  API_ERROR:
    "Une erreur est survenue lors de l'appel à l'api, veuillez appeler le service technique.",
};
