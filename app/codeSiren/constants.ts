import { NoDataMessage } from "../../lib/cleanData/types";

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

export const NO_DATA_MESSAGES: NoDataMessage = {
  NO_DESTINATION_DATA:
    "Il n’existe pas de code SIREN dans les résultats pour le nom sélectionné.",
  NO_RESULT:
    "Aucun résultat ne correspond à au nom sélectionné. Veuillez vérifier si ce nom existe bien ou qu’il n’y a pas d’erreur.",
  NO_SOURCE_DATA:
    "Afin de traiter la ligne sélectionnée, veuillez renseigner le nom recherchée.",
  API_ERROR:
    "Une erreur est survenue lors de l'appel à l'api, veuillez appeler le service technique.",
};
