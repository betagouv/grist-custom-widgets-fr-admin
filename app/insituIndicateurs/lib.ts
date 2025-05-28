import { request, gql } from "graphql-request";
import { RowRecord } from "grist/GristData";
import { COLUMN_MAPPING_NAMES } from "./constants";
import {
  FetchIndicateurReturnType,
  FetchIndicateursReturnType,
  MailleLabel,
  NarrowedTypeIndicateur,
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

const generateQueryFragmentByTerritoire = (
  mailleLabel: MailleLabel,
  inseeCode: string,
  recordId: number,
) => {
  return `recordId_${recordId}: ${mailleLabel} (code: "${inseeCode}") {
        ... on IndicateurOneValue {
          __typename
          valeur
        }
        ... on IndicateurListe {
          __typename
          count
        }
        ... on IndicateurRow {
          __typename
          row
        }
        ... on IndicateurRows {
          __typename
          count
        }
        ... on IndicateurListeGeo {
          __typename
          count
        }
      }`;
};

export const generateQuery = (
  records: RowRecord[],
  checkDestinationIsEmpty: boolean,
) => {
  const queryRecordList = [];
  for (const i in records) {
    const record = records[i];
    const queryFragmentForRecord = getQueryFragmentForRecord(
      grist.mapColumnNames(record),
      checkDestinationIsEmpty,
    );
    if (queryFragmentForRecord) {
      queryRecordList.push(queryFragmentForRecord);
    }
  }
  return gql`
query IndicateurCountQuery($identifiant: String!) {
  indicateurs(filtre: { identifiants: [$identifiant] }) {
    metadata {
      identifiant
      mailles
    }
    mailles {
      ${queryRecordList.join(" ")}
    }
  }
}
`;
};

const getQueryFragmentForRecord = (
  mappedRecord: MappedRecord,
  checkDestinationIsEmpty: boolean,
) => {
  const inseeCode = mappedRecord[COLUMN_MAPPING_NAMES.CODE_INSEE.name];
  const maille = mappedRecord[COLUMN_MAPPING_NAMES.MAILLE.name];
  const indicateurValue =
    mappedRecord[COLUMN_MAPPING_NAMES.VALEUR_INDICATEUR.name];
  // Vérifier la validité des colonnes insee code et maille
  if (
    inseeCode &&
    maille &&
    /^\w+$/.test(inseeCode) &&
    (maille as MailleLabel)
  ) {
    if (
      !checkDestinationIsEmpty ||
      (!indicateurValue && indicateurValue !== 0)
    ) {
      return generateQueryFragmentByTerritoire(
        maille,
        inseeCode,
        mappedRecord.id,
      );
    }
  }
  // TODO : else afficher une erreur ou un message
};

export const getInsituIndicateursResultsForRecords = async (
  records: RowRecord[],
  mappings: WidgetColumnMap,
  callBackFunction: (
    data: FetchIndicateurReturnType<NarrowedTypeIndicateur> | null,
    error: string | null,
  ) => void,
  checkDestinationIsEmpty: boolean,
) => {
  const query = generateQuery(records, checkDestinationIsEmpty);
  const identifiant = mappings[COLUMN_MAPPING_NAMES.VALEUR_INDICATEUR.name];
  if (typeof identifiant === "string") {
    const insituIndicateursResults = await callInsituIndicateurApi(
      query,
      identifiant,
    );
    callBackFunction(insituIndicateursResults, null);
  } else {
    callBackFunction(
      null,
      "L'identifiant de la colonne n'est pas compréhensible, ce doit être l'identifiant le l'indicateur insitu",
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
