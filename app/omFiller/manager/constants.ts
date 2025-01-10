export const COLUMN_MAPPING_NAMES = {
  SIGNATURE: {
    name: "signature",
    title: "Signature",
    type: "Attachments",
    optional: true,
    form_field: {
      default: {
        x: 400,
        y: 255,
        maxHeight: 30,
      },
      alternate: {
        x: 400,
        y: 50,
        maxHeight: 30,
      },
    },
  },
  PDF_INPUT: {
    name: "pdf_input",
    title: "Ordre de mission signé agent (fichier)",
    type: "Attachments",
    optional: false,
    form_field: null,
  },
  PDF_OUTPUT: {
    name: "pdf_output",
    title: "Ordre de mission final (fichier)",
    type: "Attachments",
    optional: false,
    form_field: null,
  },
  PDF_EF_INPUT: {
    name: "pdf_ef_input",
    title: "État de frais signé agent (fichier)",
    type: "Attachments",
    optional: true,
    form_field: null,
  },
  PDF_EF_OUTPUT: {
    name: "pdf_ef_output",
    title: "État de frais final (fichier)",
    type: "Attachments",
    optional: true,
    form_field: null,
  },
} as const;

export const TITLE = "Générateur d'ordre de mission";

export const NO_DATA_MESSAGES = {
  NO_MAPPING: "Veuillez configurer les colonnes dans les paramètres du widget.",
  NO_RECORDS: "Veuillez sélectionner une ligne à traiter.",
};
