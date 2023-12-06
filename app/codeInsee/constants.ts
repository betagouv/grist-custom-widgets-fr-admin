import { KeyAsString } from "../../lib/util/constants";

export const COLUMN_MAPPING_NAMES = {
  COLLECTIVITE: {
    name: "collectivite",
    title: "Collectivité (source)",
    type: "Any",
    optional: false,
  },
  DEPARTEMENT: {
    name: "departement",
    title: "Code Insee du département (désambiguité - optionnel)",
    type: "Any",
    optional: true,
  },
  NATURE_JURIDIQUE: {
    name: "nature_juridique",
    title: "Nature juridique (désambiguité - optionnel)",
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
    title: "Destination libellé normalisé (destination - optionnel)",
    type: "Any",
    optional: true,
  },
};

export const NATURE_JURIDIQUE: KeyAsString = {
  COM: "Commune",
  CA: "Communauté d’agglomération",
  CC: "Communauté de communes",
  SIVU: "SIVU",
  DEP: "département",
  COLTER: "Collectivités territoriales",
  SMO: "SMO",
  SMF: "SMF",
  SIVOS: "SIVOS",
};

export const MESSAGES = {
  DOUBTFUL_RESULT: "Les scores de fiabilités sont douteux",
  TOO_CLOSE_RESULT:
    "Les scores de fiabilités sont trop proches pour sélectionner le bon groupement automatiquement",
};

export const NO_DATA_MESSAGES = {
  NO_INSEE_CODE:
    "Il n’existe pas de code INSEE dans les résultats pour la collectivité sélectionnée.",
  NO_RESULT:
    "Aucun résultat ne correspond à la collectivité sélectionnée. Veuillez vérifier si cette collectivité existe bien ou qu’il n’y a pas d’erreur.",
  NO_SOURCE_DATA:
    "Afin de traiter la ligne sélectionnée, veuillez renseigner la collectivité recherchée.",
  DESTINATION_ALREADY_FILLED_IN: "Le code insee est déjà renseigné.",
  API_ERROR:
    "Une erreur est survenue lors de l'appel à l'api, veuillez appeler le service technique.",
};
