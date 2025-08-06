import { request, gql } from "graphql-request";
import { RowRecord } from "grist/GristData";
import { COLUMN_MAPPING_NAMES } from "./constants";
import {
  FetchIndicateurReturnType,
  FetchIndicateursReturnType,
  MailleLabel,
  mailleLabelValues,
  NarrowedTypeIndicateur,
  Stats,
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

const getQueryFragmentForRecord = (
  mappedRecord: MappedRecord,
  checkDestinationIsEmpty: boolean,
): { query: string; error: string } => {
  const inseeCode = mappedRecord[COLUMN_MAPPING_NAMES.CODE_INSEE.name];
  const maille = mappedRecord[COLUMN_MAPPING_NAMES.MAILLE.name];
  const indicateurValue =
    mappedRecord[COLUMN_MAPPING_NAMES.VALEUR_INDICATEUR.name];
  const response = { query: "", error: "" };
  // On s'intéresse à la ligne seulement si la colonne de destination est vide
  // ou si on doit ignorer cette information
  if (!checkDestinationIsEmpty || (!indicateurValue && indicateurValue !== 0)) {
    // Vérifier la validité des colonnes insee code et maille
    if (!inseeCode) {
      response.error = "Le code insee est vide";
    } else if (!/^\w+$/.test(inseeCode)) {
      response.error = "Le code insee n'est pas valide";
    } else if (!maille) {
      response.error = "La maille est vide";
    } else if (!mailleLabelValues.includes(maille)) {
      response.error = "La maille n'est pas valide";
    } else {
      response.query = generateQueryFragmentByTerritoire(
        maille,
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
      // TODO : faire des stats pour informer l'utilisateur du nombre d'élément mis à jour - ici 0
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
