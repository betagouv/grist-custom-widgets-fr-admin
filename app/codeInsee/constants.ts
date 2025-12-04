import { NoDataMessage } from "../../lib/cleanData/types";
import { EntiteAdmin } from "./types";

export const TITLE =
  "Ajouter les codes INSEE (et SIREN) à partir d'une localité";

export const COLUMN_MAPPING_NAMES = {
  COLLECTIVITE: {
    name: "collectivite",
    title: "Collectivité (source)",
    type: "Any",
    optional: false,
  },
  MAILLE: {
    name: "maille",
    title: "Maille",
    description:
      "Indiquez la colonne comportant la maille du territoire (exemple de valeurs acceptées: commune, epci, departement, region, pays)",
    type: "Any",
    optional: true,
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
    "Il n'existe pas de code INSEE dans les résultats pour la collectivité sélectionnée.",
  NO_RESULT:
    "Aucun résultat ne correspond à la collectivité sélectionnée. Veuillez vérifier si cette collectivité existe bien ou qu'il n'y ai pas d'erreur.",
  NO_SOURCE_DATA:
    "Afin de traiter la ligne sélectionnée, veuillez renseigner la collectivité recherchée ainsi que sa maille.",
  API_ERROR:
    "Une erreur est survenue lors de l'appel à l'api, veuillez appeler le service technique.",
};

// Used for api-geo API
export const DECOUPAGE_ADMIN: {
  [key: string]: EntiteAdmin;
} = {
  commune: {
    label: "Communes",
    apiGeoUrl: "communes",
    key: "COM",
    typeCode: "INSEE",
  },
  COM_ASSOCIES_ET_DELEGUEES: {
    label: "Communes associées et déléguées",
    apiGeoUrl: "communes_associees_deleguees",
    key: "COM_ASSOCIES_ET_DELEGUEES",
    typeCode: "INSEE",
  },
  epci: { label: "EPCI", apiGeoUrl: "epcis", key: "EPCI", typeCode: "SIREN" },
  departement: {
    label: "Départements",
    apiGeoUrl: "departements",
    key: "DEPT",
    typeCode: "INSEE",
  },
  region: {
    label: "Régions",
    apiGeoUrl: "regions",
    key: "REG",
    typeCode: "INSEE",
  },
};
