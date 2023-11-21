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
  NO_INSEE_CODE: "Il n'y a pas de code insee dans la réponse rendue",
  NO_RESULT: "Aucun résultat n'a été trouvé correspondant à la collectivité",
  NO_SOURCE_DATA: "La donnée source est manquante",
  DESTINATION_ALREADY_FILLED_IN: "Le code insee est déjà renseigné",
  API_ERROR:
    "Une erreur est survenue lors de l'appel à l'api, veuillez appeler le service technique",
};
