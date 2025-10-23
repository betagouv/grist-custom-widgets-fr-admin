import { RowRecord } from "grist/GristData";
import { MappedRecord } from "../../../lib/util/types";
import { COLUMN_MAPPING_NAMES, ERROR_DATA_MESSAGE } from "../constants";
import { MAILLE_ACCEPTED_VALUES, MailleLabel, MailleLabelEnum, Stats } from "../types";
import { gql } from "graphql-request";


export const generateQuery = (
  records: RowRecord[],
  checkDestinationIsEmpty: boolean,
  stats: Stats,
): { query: string; errors: { recordId: number; error: string }[] } => {
  const queryRecordList = [];
  const errorRecordList = [];
  for (const record of records) {
    const { query, error } = getQueryFragmentForRecord(
      grist.mapColumnNames(record),
      checkDestinationIsEmpty,
    );
    if (query) {
      queryRecordList.push(query);
      stats.toUpdateCount++;
    }
    if (error) {
      errorRecordList.push({ recordId: record.id, error });
      stats.invalidCount++;
    }
  }
  return {
    query:
      queryRecordList.length === 0
        ? ""
        : gql`
query IndicateurCountQuery($identifiant: String!) {
  indicateurs(filtre: { identifiants: [$identifiant] }) {
    metadata {
      identifiant
      mailles
      nom
      description
      returnType
      unite
    }
    mailles {
      ${queryRecordList.join(" ")}
    }
  }
}
`,
    errors: errorRecordList,
  };
};


export const getQueryFragmentForRecord = (
  mappedRecord: MappedRecord,
  checkDestinationIsEmpty: boolean,
): { query: string; error: string } => {
  const inseeCode = mappedRecord[COLUMN_MAPPING_NAMES.CODE_INSEE.name];
  const rawMaille = mappedRecord[COLUMN_MAPPING_NAMES.MAILLE.name];
  const indicateurValue =
    mappedRecord[COLUMN_MAPPING_NAMES.VALEUR_INDICATEUR.name];
  const response = { query: "", error: "" };

  // On s'intéresse à la ligne seulement si la colonne de destination est vide
  // ou si on doit ignorer cette information
  if (!checkDestinationIsEmpty || !indicateurValue) {
    const normalizedMaille = normalizeMaille(rawMaille);

    // Vérifier la validité des colonnes insee code et maille
    if (!inseeCode && normalizedMaille !== MailleLabelEnum.Pays) {
      response.error = ERROR_DATA_MESSAGE.CODE_INSEE_VIDE;
    } else if (
      !/^\w+$/.test(inseeCode) &&
      normalizedMaille !== MailleLabelEnum.Pays
    ) {
      response.error = ERROR_DATA_MESSAGE.CODE_INSEE_INVALIDE;
    } else if (!rawMaille) {
      response.error = ERROR_DATA_MESSAGE.MAILLE_VIDE;
    } else if (!normalizedMaille) {
      response.error = ERROR_DATA_MESSAGE.MAILLE_INVALIDE;
    } else {
      response.query = generateQueryFragmentByTerritoire(
        normalizedMaille,
        inseeCode,
        mappedRecord.id,
      );
    }
  }

  return response;
};


export const generateQueryFragmentByTerritoire = (
  mailleLabel: MailleLabel,
  inseeCode: string,
  recordId: number,
) => {
  const code =
    mailleLabel === MailleLabelEnum.Pays ? "" : `(code: "${inseeCode}")`;
  return `recordId_${recordId}: ${mailleLabel} ${code} {
        ... on IndicateurOneValue {
          __typename
          valeur
        }
        ... on IndicateurListe {
          __typename
          count
          liste
        }
        ... on IndicateurRow {
          __typename
          row
        }
        ... on IndicateurRows {
          __typename
          count
          rows
        }
        ... on IndicateurListeGeo {
          __typename
          count
          properties
        }
      }`;
};

const removeAccents = (str: string): string => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const normalizeMaille = (inputMaille: string): MailleLabel | null => {
  if (!inputMaille) {
    return null;
  }
  const normalizedInput = removeAccents(inputMaille.toLowerCase().trim());
  // Check each maille type and its accepted values
  for (const [mailleLabel, acceptedValues] of Object.entries(
    MAILLE_ACCEPTED_VALUES,
  )) {
    if (acceptedValues.includes(normalizedInput)) {
      return mailleLabel as MailleLabel;
    }
  }
  return null;
};
