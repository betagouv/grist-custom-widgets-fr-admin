import { LatLngExpression } from "leaflet";

export const TITLE = "Geocoder une adresse";

export const COLUMN_MAPPING_NAMES = {
  ADDRESS: {
    name: "address",
    title: "adresse (source)",
    type: "Any",
    optional: false,
  },
  NORMALIZED_ADDRESS: {
    name: "address_normalisee",
    title: "adresse Normalisee (destination)",
    type: "Any",
    optional: true,
  },
  LATITUDE: {
    name: "latitude",
    title: "Latitude (destination)",
    type: "Any",
    optional: false,
  },
  LONGITUDE: {
    name: "longitude",
    title: "Longitude (destination)",
    type: "Any",
    optional: false,
  },
};

export const DEFAULT_MAP_CENTER: LatLngExpression = [48.864716, 2.349]; // Paris

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
