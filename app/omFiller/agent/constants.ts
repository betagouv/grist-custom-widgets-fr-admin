export const COLUMN_MAPPING_NAMES = {
  NOM: {
    name: "nom",
    title: "Nom",
    type: "Text",
    optional: true,
    form_field: "Nom OM",
  },
  PRENOM: {
    name: "prenom",
    title: "Prénom",
    type: "Text",
    optional: true,
    form_field: "Prénom OM",
  },
  STRUCTURE: {
    name: "structure",
    title: "Structure",
    type: "Text",
    optional: true,
    form_field: "service",
  },
  RESIDENCE_DEPART: {
    name: "residence_depart",
    title: "Résidence de départ",
    type: "Choice",
    options: ["Administrative", "Familiale"],
    optional: true,
    form_field: {
      Administrative: "résidence administrative départ",
      Familiale: "résidence familiale départ",
    },
  },
  RESIDENCE_RETOUR: {
    name: "residence_retour",
    title: "Résidence de retour",
    type: "Choice",
    options: ["Administrative", "Familiale"],
    optional: true,
    form_field: {
      Administrative: "résidence administrative retour",
      Familiale: "résidence familiale retour",
    },
  },
  LIEU_MISSION: {
    name: "lieu_mission",
    title: "Lieu de la mission",
    type: "Text",
    optional: true,
    form_field: "destination principale OM",
  },
  OBJET_MISSION: {
    name: "objet_mission",
    title: "Objet de la mission",
    type: "Text",
    optional: true,
    form_field: "Motif OM",
  },
  DATE_HEURE_DEPART: {
    name: "date_heure_depart",
    title: "Date et Heure de départ",
    type: "DateTime",
    optional: true,
    form_field: {
      date: "date départ",
      time: "Heure départ",
    },
  },
  DATE_HEURE_RETOUR: {
    name: "date_heure_retour",
    title: "Date et Heure de retour",
    type: "DateTime",
    optional: true,
    form_field: {
      date: "date retour",
      time: "Heure retour",
    },
  },
  ETAPE: {
    name: "etape",
    title: "Étape",
    type: "Bool",
    optional: true,
    form_field: {
      true: "oui etape",
      false: "non étape",
    },
  },
  TRANSPORT: {
    name: "transport",
    title: "Moyen de transport",
    type: "Choice",
    options: ["Voiture", "Train", "Avion", "Autre"],
    optional: true,
    form_field: {
      Train: "Train",
      Avion: "Avion",
      Autre: "Autre précisez",
      Precision: "précisez",
    },
  },
  HORAIRE: {
    name: "horaire",
    title: "Horaires et gares",
    type: "Text",
    optional: true,
    form_field: "horaires et gares",
  },
  HEBERGEMENT: {
    name: "hebergement",
    title: "Hébergement",
    type: "Bool",
    optional: true,
    form_field: {
      true: "Oui_2",
      false: "Non_2",
    },
  },
  AVANCE: {
    name: "avance",
    title: "Avance",
    type: "Bool",
    optional: true,
    form_field: {
      true: "Oui_3",
      false: "Non_3",
    },
  },
  NOMBRE_NUITES: {
    name: "nombre_nuites",
    title: "Nombre de nuitées",
    type: "Int",
    optional: true,
    form_field: "Nombre de nuités",
  },
  DEMANDE_COMPLEMENTAIRE: {
    name: "demande_complementaire",
    title: "Demande complémentaire",
    type: "Text",
    optional: true,
    form_field:
      "Vous souhaitez nous donner dautres informations sur cette mission  Demande complémentaire",
  },
  SIGNATURE: {
    name: "signature",
    title: "Signature",
    type: "Attachments",
    optional: true,
    form_field: {
      x: 200, // X coordinate for signature placement
      y: 255, // Y coordinate from bottom
      maxHeight: 30, // Maximum height for signature image
    },
  },
  SIGNATURE_DATE: {
    name: "signature_date",
    title: "Date de signature",
    type: "Date",
    optional: true,
    form_field: {
      x: 80, // X coordinate for date placement
      y: 265, // Y coordinate from bottom
      fontSize: 11, // Font size for the date
    },
  },
  SIGNATURE_LOCATION: {
    name: "signature_location",
    title: "Lieu de signature",
    type: "Text",
    optional: true,
    form_field: {
      x: 80, // X coordinate for location text placement
      y: 290, // Y coordinate from bottom (higher than date signature)
      fontSize: 11, // Font size for the text
    },
  },
  PDF_OUTPUT: {
    name: "pdf_output",
    title: "Ordre de mission généré (fichier)",
    type: "Attachments",
    optional: false,
    form_field: null,
  },
} as const;

export const TITLE = "Générateur d'ordre de mission";

export const NO_DATA_MESSAGES = {
  NO_MAPPING: "Veuillez configurer les colonnes dans les paramètres du widget.",
  NO_RECORDS: "Veuillez sélectionner une ligne à traiter.",
};
