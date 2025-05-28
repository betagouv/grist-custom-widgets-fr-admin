import { NoDataMessage } from "../../lib/cleanData/types";

export const TITLE =
  "Ajouter la valeur d'un indicateur Inisut pour un code INSEE et une maille donnés";

export const COLUMN_MAPPING_NAMES = {
  CODE_INSEE: {
    name: "code_insee",
    title: "Code Insee (source)",
    type: "Any",
    optional: false,
  },
  MAILLE: {
    name: "maille",
    title: "Maille (source)",
    type: "Any",
    optional: false,
  },
  VALEUR_INDICATEUR: {
    name: "valeur_indicateur",
    title: "Valeur de l'indicateur (destination)",
    type: "Any",
    optional: false,
  },
};

export const NO_DATA_MESSAGES: NoDataMessage = {
  NO_DESTINATION_DATA:
    "Il n’existe pas de code INSEE dans les résultats pour la collectivité sélectionnée.",
  NO_RESULT:
    "Aucun résultat ne correspond à la collectivité sélectionnée. Veuillez vérifier si cette collectivité existe bien ou qu’il n’y ai pas d’erreur.",
  NO_SOURCE_DATA:
    "Afin de traiter la ligne sélectionnée, veuillez renseigner la collectivité recherchée.",
  API_ERROR:
    "Une erreur est survenue lors de l'appel à l'api, veuillez appeler le service technique.",
};
