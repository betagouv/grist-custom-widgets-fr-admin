import { NoDataMessage } from "../../lib/cleanData/types";

export const TITLE = "Ajouter les codes INSEE à partir d'une localité";

export const COLUMN_MAPPING_NAMES = {
  COLLECTIVITE: {
    name: "collectivite",
    title: "Collectivité (source)",
    type: "Any",
    optional: false,
  },
  DEPARTEMENT: {
    name: "departement",
    title: "Code Insee du département (désambiguité)",
    type: "Any",
    optional: true,
  },
  CODE_INSEE: {
    name: "code_insee",
    title: "Code Insee (destination)",
    type: "Any",
    optional: false,
  },
  LIB_GROUPEMENT: {
    name: "lib_groupement",
    title: "Destination libellé normalisé (destination)",
    type: "Any",
    optional: true,
  },
};

export const NO_DATA_MESSAGES: NoDataMessage = {
  NO_DESTINATION_DATA:
    "Il n’existe pas de code INSEE dans les résultats pour la collectivité sélectionnée.",
  NO_RESULT:
    "Aucun résultat ne correspond à la collectivité sélectionnée. Veuillez vérifier si cette collectivité existe bien ou qu’il n’y a pas d’erreur.",
  NO_SOURCE_DATA:
    "Afin de traiter la ligne sélectionnée, veuillez renseigner la collectivité recherchée.",
  API_ERROR:
    "Une erreur est survenue lors de l'appel à l'api, veuillez appeler le service technique.",
};

export const DECOUPAGE_ADMIN = {
  COM: { label: "communes", apiUrl: "communes", key: "COM" },
  COM_ASSOCIES_ET_DELEGUEES: {
    label: "communes associées et déléguées",
    apiUrl: "communes_associees_deleguees",
    key: "COM_ASSOCIES_ET_DELEGUEES",
  },
  EPCI: { label: "epci", apiUrl: "epcis", key: "EPCI" },
  DEPT: { label: "départements", apiUrl: "departements", key: "DEPT" },
  REG: { label: "régions", apiUrl: "regions", key: "REG" },
};
