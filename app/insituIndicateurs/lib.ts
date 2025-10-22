import { request, gql } from "graphql-request";
import { RowRecord } from "grist/GristData";
import { COLUMN_MAPPING_NAMES, ERROR_DATA_MESSAGE } from "./constants";
import {
  FetchIndicateurReturnType,
  FetchIndicateursReturnType,
  MailleLabel,
  MailleLabelEnum,
  NarrowedTypeIndicateur,
  Stats,
  MAILLE_ACCEPTED_VALUES,
} from "./types";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { MappedRecord } from "../../lib/util/types";

export const callInsituIndicateurApi = async (
  query: string,
  identifiant: string,
): Promise<FetchIndicateurReturnType<NarrowedTypeIndicateur>> => {
  const params = { identifiant };
  const results: FetchIndicateursReturnType = await request(
    "https://servitu.donnees.incubateur.anct.gouv.fr/graphql",
    query,
    params,
    {
      ["x-client-name"]: "Widget Grist insituIndicateur",
    },
  );

  const data = results.indicateurs[0];
  return data;
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

export const generateQuery = (
  records: RowRecord[],
  checkDestinationIsEmpty: boolean,
  stats: Stats,
): { query: string; errors: { recordId: number; error: string }[] } => {
  const queryRecordList = [];
  const errorRecordList = [];
  for (const i in records) {
    const record = records[i];
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
  if (!checkDestinationIsEmpty || (!indicateurValue && indicateurValue !== 0)) {
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

export const getInsituIndicateursResultsForRecords = async (
  identifiant: string,
  records: RowRecord[],
  callBackFunction: (
    data: FetchIndicateurReturnType<NarrowedTypeIndicateur> | null,
    error: string | null,
    errorByRecord: { recordId: number; error: string }[] | null,
  ) => void,
  checkDestinationIsEmpty: boolean,
  stats: Stats,
) => {
  // TODO faire plus de check de la qualité de l'identifiant avant de créer la requête
  if (typeof identifiant === "string") {
    const { query, errors } = generateQuery(
      records,
      checkDestinationIsEmpty,
      stats,
    );
    if (!query) {
      callBackFunction(null, null, errors);
    } else {
      try {
        const insituIndicateursResults = await callInsituIndicateurApi(
          query,
          identifiant,
        );
        callBackFunction(insituIndicateursResults, null, errors);
      } catch (e) {
        let errorMessage = "La requête à Insitu a échoué";
        if (e instanceof Error) {
          errorMessage = e.message.slice(0, 200) + "...";
        }
        callBackFunction(null, errorMessage, null);
      }
    }
  } else {
    callBackFunction(
      null,
      "L'identifiant de la colonne n'est pas compréhensible, ce doit être l'identifiant le l'indicateur insitu",
      null,
    );
  }
};

export const mappingsIsReady = (mappings: WidgetColumnMap | null) => {
  return (
    mappings &&
    mappings[COLUMN_MAPPING_NAMES.VALEUR_INDICATEUR.name] &&
    mappings[COLUMN_MAPPING_NAMES.CODE_INSEE.name] &&
    mappings[COLUMN_MAPPING_NAMES.MAILLE.name]
  );
};

export const removeAccents = (str: string): string => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export const normalizeMaille = (inputMaille: string): MailleLabel | null => {
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

export const listObjectToString = (objList: object[]): string => {
  return objList
    .map(
      (row: object) =>
        "{" +
        Object.entries(row)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ") +
        "}",
    )
    .join(", ");
};
