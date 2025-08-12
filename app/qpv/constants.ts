export const TITLE = "Vérificateur QPV";

export const COLUMN_MAPPING_NAMES = {
  LATITUDE: {
    name: "latitude",
    title: "Latitude",
    description: "Indiquez la colonne contenant la latitude à vérifier",
    optional: false,
    type: "Any",
  },
  LONGITUDE: {
    name: "longitude",
    title: "Longitude",
    description: "Indiquez la colonne contenant la longitude à vérifier",
    optional: false,
    type: "Any",
  },
  EST_QPV: {
    name: "est_qpv",
    title: "Est en QPV",
    description:
      "Indiquez la colonne (de type booléen) qui affichera Vrai si l'adresse est en QPV",
    optional: false,
    type: "Any",
  },
  NOM_QPV: {
    name: "nom_qpv",
    title: "Nom du QPV",
    description:
      "Indiquez la colonne qui affichera le nom du QPV, si l'adresse s'y trouve",
    optional: false,
    type: "Any",
  },
  CODE_QPV: {
    name: "code_qpv",
    title: "Code du QPV",
    description:
      "Sélectionnez la colonne qui affichera le code du QPV, si l'adresse s'y trouve",
    optional: false,
    type: "Any",
  },
};
