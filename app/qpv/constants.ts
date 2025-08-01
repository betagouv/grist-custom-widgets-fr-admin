export const COLUMN_MAPPING_NAMES = {
  LATITUDE: {
    name: "latitude",
    title: "Latitude",
    description: "Colonne contenant les coordonnées de latitude",
    optional: false,
    type: "any",
  },
  LONGITUDE: {
    name: "longitude",
    title: "Longitude",
    description: "Colonne contenant les coordonnées de longitude",
    optional: false,
    type: "any",
  },
  EST_QPV: {
    name: "est_qpv",
    title: "Est en QPV",
    description:
      "Colonne qui contiendra true si l'adresse est en QPV, false sinon",
    optional: false,
    type: "any",
  },
  NOM_QPV: {
    name: "nom_qpv",
    title: "Nom du QPV",
    description: "Colonne qui contiendra le nom du QPV si l'adresse s'y trouve",
    optional: false,
    type: "any",
  },
  CODE_QPV: {
    name: "code_qpv",
    title: "Code du QPV",
    description:
      "Colonne qui contiendra le code du QPV si l'adresse s'y trouve",
    optional: false,
    type: "any",
  },
};
