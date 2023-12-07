import { RowRecord } from "grist/GristData";
import { COLUMN_MAPPING_NAMES, NO_DATA_MESSAGES } from "./constants";

import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { MESSAGES } from "../../lib/util/constants";
import {
  CleanSirenCodeRecord,
  DirtySirenCodeRecord,
  NoResultSirenCodeRecord,
  NormalizedSirenResult,
  SirenCodeUncleanedRecord,
} from "./types";
import { MappedRecord } from "../../lib/util/types";

export const callSirenCodeApi = async (
  query: string,
): Promise<NormalizedSirenResult[]> => {
  const url = new URL("https://recherche-entreprises.api.gouv.fr/search");
  url.searchParams.set("q", query);
  const response = await fetch(url.toString());
  if (!response.ok) {
    console.error(
      "The call to the recherche-entreprises.api.gouv.fr api is not 200 status",
      response,
    );
  }
  const data = await response.json();
  // @ts-expect-error result in any type
  return (data.results ?? []).map((result) => {
    return {
      label: result.nom_complet,
      siren: result.siren,
      code_commune: result.siege.code_postal,
      siret: result.siege.siret,
      score: result.score,
    };
  });
};

export const getSirenCodeResults = async (
  mappedRecord: MappedRecord,
  mappings: WidgetColumnMap,
  checkDestinationIsEmpty: boolean,
): Promise<SirenCodeUncleanedRecord> => {
  let noResultMessage;
  let name = "";
  let sirenCodeResults: NormalizedSirenResult[] = [];
  let toIgnore = false;
  if (mappedRecord[COLUMN_MAPPING_NAMES.NAME.name]) {
    // Call the api if we don't have to check the destination column or if there are empty
    if (
      !checkDestinationIsEmpty ||
      !mappedRecord[COLUMN_MAPPING_NAMES.SIREN.name] ||
      (mappings[COLUMN_MAPPING_NAMES.NORMALIZED_NAME.name] &&
        !mappedRecord[COLUMN_MAPPING_NAMES.NORMALIZED_NAME.name])
    ) {
      name = mappedRecord[COLUMN_MAPPING_NAMES.NAME.name];
      sirenCodeResults = await callSirenCodeApi(name);
      if (sirenCodeResults === undefined) {
        console.error(
          "The call to the api give a response with undefined result",
        );
        noResultMessage = NO_DATA_MESSAGES.API_ERROR;
      } else if (sirenCodeResults.length === 0) {
        noResultMessage = NO_DATA_MESSAGES.NO_RESULT;
      }
    } else {
      toIgnore = true;
    }
  } else {
    noResultMessage = NO_DATA_MESSAGES.NO_SOURCE_DATA;
  }
  return {
    recordId: mappedRecord.id,
    name,
    results: sirenCodeResults,
    noResultMessage,
    toIgnore,
  };
};

export const getSirenCodeResultsForRecord = async (
  record: RowRecord,
  mappings: WidgetColumnMap,
) => {
  return await getSirenCodeResults(
    grist.mapColumnNames(record),
    mappings,
    false,
  );
};

export const getSirenCodeResultsForRecords = async (
  records: RowRecord[],
  mappings: WidgetColumnMap,
  // eslint-disable-next-line @typescript-eslint/ban-types
  callBackFunction: Function,
) => {
  const sirenCodeDataFromApi: SirenCodeUncleanedRecord[] = [];
  for (const i in records) {
    const record = records[i];
    // We call the API only if the source column is filled and if the destination column are not
    sirenCodeDataFromApi.push(
      await getSirenCodeResults(grist.mapColumnNames(record), mappings, true),
    );
    if (parseInt(i) % 100 === 0 || parseInt(i) === records.length - 1) {
      callBackFunction(sirenCodeDataFromApi, parseInt(i), records.length);
      // clear data
      sirenCodeDataFromApi.length = 0;
    }
  }
};

type ReduceReturnType = {
  dirty: { [recordId: number]: DirtySirenCodeRecord };
  clean: { [recordId: number]: CleanSirenCodeRecord };
  noResult: { [recordId: number]: NoResultSirenCodeRecord };
};

export const cleanRecordsData = (
  recordsUncleanedData: SirenCodeUncleanedRecord[],
): ReduceReturnType => {
  return recordsUncleanedData.reduce<ReduceReturnType>(
    (acc: ReduceReturnType, record) => {
      return record.toIgnore
        ? acc
        : !record.results.length
          ? {
              ...acc,
              noResult: {
                ...acc.noResult,
                [record.recordId]: {
                  recordId: record.recordId,
                  noResultMessage: record.noResultMessage!,
                },
              },
            }
          : isDoubtfulResults(record.results)
            ? {
                ...acc,
                dirty: {
                  ...acc.dirty,
                  [record.recordId]: {
                    ...record,
                    dirtyMessage: MESSAGES.DOUBTFUL_RESULT,
                  },
                },
              }
            : areTooCloseResults(record.results)
              ? {
                  ...acc,
                  dirty: {
                    ...acc.dirty,
                    [record.recordId]: {
                      ...record,
                      dirtyMessage: MESSAGES.TOO_CLOSE_RESULT,
                    },
                  },
                }
              : {
                  ...acc,
                  clean: {
                    ...acc.clean,
                    [record.recordId]: {
                      recordId: record.recordId,
                      name: record.name,
                      ...record.results[0],
                    },
                  },
                };
    },
    { dirty: {}, clean: {}, noResult: {} },
  );
};

const isDoubtfulResults = (dataFromApi: NormalizedSirenResult[]) => {
  return dataFromApi[0]?.score < 0.6;
};

const areTooCloseResults = (dataFromApi: NormalizedSirenResult[]) => {
  if (dataFromApi.length > 1) {
    const [firstChoice, secondChoice] = dataFromApi;
    const deviation = firstChoice.score === 1.0 ? 0.02 : 0.09;
    return firstChoice.score - secondChoice.score < deviation;
  }
  return false;
};

export const mappingsIsReady = (mappings: WidgetColumnMap | null) => {
  return (
    mappings &&
    mappings[COLUMN_MAPPING_NAMES.NAME.name] &&
    mappings[COLUMN_MAPPING_NAMES.SIREN.name]
  );
};
