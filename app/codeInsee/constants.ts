import { NoDataMessage } from "../../lib/cleanData/types";
import { EntiteAdmin } from "./types";

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
  NATURE_JURIDIQUE: {
    name: "nature_juridique",
    title: "Nature juridique (désambiguité)",
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
    "Aucun résultat ne correspond à la collectivité sélectionnée. Veuillez vérifier si cette collectivité existe bien ou qu’il n’y ai pas d’erreur.",
  NO_SOURCE_DATA:
    "Afin de traiter la ligne sélectionnée, veuillez renseigner la collectivité recherchée.",
  API_ERROR:
    "Une erreur est survenue lors de l'appel à l'api, veuillez appeler le service technique.",
};

// Used for addok-admin API
export const NATURE_JURIDIQUE: {
  [key: string]: EntiteAdmin;
} = {
  COM: { label: "Commune", key: "COM", typeCode: "INSEE" },
  CA: { label: "Communauté d’agglomération", key: "CA", typeCode: "SIREN" },
  CC: { label: "Communauté de communes", key: "CC", typeCode: "SIREN" },
  COLTER: {
    label: "Collectivités territoriales",
    key: "COLTER",
    typeCode: "SIREN",
  },
  EPT: {
    label: "Etablissement public territorial",
    key: "EPT",
    typeCode: "SIREN",
  },
  SMF: { label: "Syndicat mixte fermé", key: "SMF", typeCode: "SIREN" },
  SMO: { label: "Syndicat mixte ouvert", key: "SMO", typeCode: "SIREN" },
  SIVOS: {
    label: "Syndicat intercommunal à vocation multiple",
    key: "SIVOS",
    typeCode: "SIREN",
  },
  SIVU: {
    label: "Syndicat intercommunal à vocation unique",
    key: "SIVU",
    typeCode: "SIREN",
  },
  METRO: { label: "Métropole", key: "METRO", typeCode: "SIREN" },
  DEP: { label: "Département", key: "DEP", typeCode: "INSEE" },
  REG: { label: "Région", key: "REG", typeCode: "INSEE" },
};

// Used for api-geo API
export const DECOUPAGE_ADMIN: {
  [key: string]: EntiteAdmin;
} = {
  COM: {
    label: "communes",
    apiGeoUrl: "communes",
    key: "COM",
    typeCode: "INSEE",
  },
  COM_ASSOCIES_ET_DELEGUEES: {
    label: "communes associées et déléguées",
    apiGeoUrl: "communes_associees_deleguees",
    key: "COM_ASSOCIES_ET_DELEGUEES",
    typeCode: "INSEE",
  },
  EPCI: { label: "epci", apiGeoUrl: "epcis", key: "EPCI", typeCode: "SIREN" },
  DEPT: {
    label: "départements",
    apiGeoUrl: "departements",
    key: "DEPT",
    typeCode: "INSEE",
  },
  REG: {
    label: "régions",
    apiGeoUrl: "regions",
    key: "REG",
    typeCode: "INSEE",
  },
};
