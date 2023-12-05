import { RowRecord } from "grist/GristData";
import { COLUMN_MAPPING_NAMES, MESSAGES, NO_DATA_MESSAGES } from "./constants";
import {
  DirtyInseeCodeRecord,
  CleanInseeCodeRecord,
  InseeCodeUncleanedRecord,
  NormalizedInseeResult,
  NormalizedInseeResults,
  NoResultInseeCodeRecord,
  MappedRecord,
} from "./types";
import { WidgetColumnMap } from "grist/CustomSectionAPI";

export const callInseeCodeApi = async (
  collectivity: string,
  dept?: string,
  nature_juridique?: string,
): Promise<NormalizedInseeResult[]> => {
  const url = new URL("https://addokadmin.sit.incubateur.tech/search");
  url.searchParams.set("q", collectivity);
  dept && url.searchParams.set("insee_dep", dept);
  nature_juridique &&
    url.searchParams.set("nature_juridique", nature_juridique);

  const response = await fetch(url.toString());
  if (!response.ok) {
    console.error(
      "The call to the addokadmin.sit.incubateur.tech api is not 200 status",
      response,
    );
  }
  const data: NormalizedInseeResults = await response.json();
  return data.results;
};

export const getInseeCodeResults = async (
  mappedRecord: MappedRecord,
  mappings: WidgetColumnMap,
  checkDestinationIsEmpty: boolean,
): Promise<InseeCodeUncleanedRecord> => {
  let noResultMessage;
  let collectivite = "";
  let inseeCodeResults: NormalizedInseeResult[] = [];
  if (mappedRecord[COLUMN_MAPPING_NAMES.COLLECTIVITE.name]) {
    // Call the api if we don't have to check the destination column or if there are empty
    if (
      !checkDestinationIsEmpty ||
      !mappedRecord[COLUMN_MAPPING_NAMES.CODE_INSEE.name] ||
      (mappings[COLUMN_MAPPING_NAMES.LIB_GROUPEMENT.name] &&
        !mappedRecord[COLUMN_MAPPING_NAMES.LIB_GROUPEMENT.name])
    ) {
      collectivite = mappedRecord[COLUMN_MAPPING_NAMES.COLLECTIVITE.name];
      const departement = mappedRecord[COLUMN_MAPPING_NAMES.DEPARTEMENT.name];
      const nature_juridique =
        mappedRecord[COLUMN_MAPPING_NAMES.NATURE_JURIDIQUE.name];
      inseeCodeResults = await callInseeCodeApi(
        collectivite,
        departement,
        nature_juridique,
      );
      if (inseeCodeResults === undefined) {
        console.error(
          "The call to the api give a response with undefined result",
        );
        noResultMessage = NO_DATA_MESSAGES.API_ERROR;
      } else if (inseeCodeResults.length === 0) {
        noResultMessage = NO_DATA_MESSAGES.NO_RESULT;
      }
    } else {
      noResultMessage = NO_DATA_MESSAGES.DESTINATION_ALREADY_FILLED_IN;
    }
  } else {
    noResultMessage = NO_DATA_MESSAGES.NO_SOURCE_DATA;
  }
  return {
    recordId: mappedRecord.id,
    collectivite,
    results: inseeCodeResults,
    noResultMessage,
  };
};

export const getInseeCodeResultsForRecord = async (
  record: RowRecord,
  mappings: WidgetColumnMap,
) => {
  return await getInseeCodeResults(
    grist.mapColumnNames(record),
    mappings,
    false,
  );
};

export const getInseeCodeResultsForRecords = async (
  records: RowRecord[],
  mappings: WidgetColumnMap,
  // eslint-disable-next-line @typescript-eslint/ban-types
  callBackFunction: Function,
) => {
  const inseeCodeDataFromApi: InseeCodeUncleanedRecord[] = [];
  for (const i in records) {
    const record = records[i];
    // We call the API only if the source column is filled and if the destination column are not
    inseeCodeDataFromApi.push(
      await getInseeCodeResults(grist.mapColumnNames(record), mappings, true),
    );
    if (parseInt(i) % 100 === 0 || parseInt(i) === records.length - 1) {
      callBackFunction(inseeCodeDataFromApi, parseInt(i), records.length);
      // clear data
      inseeCodeDataFromApi.length = 0;
    }
  }
};

type ReduceReturnType = {
  dirty: { [recordId: number]: DirtyInseeCodeRecord };
  clean: { [recordId: number]: CleanInseeCodeRecord };
  noResult: { [recordId: number]: NoResultInseeCodeRecord };
};

export const cleanRecordsData = (
  recordsUncleanedData: InseeCodeUncleanedRecord[],
): ReduceReturnType => {
  return recordsUncleanedData.reduce<ReduceReturnType>(
    (acc: ReduceReturnType, record) => {
      return !record.results.length
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
                    collectivite: record.collectivite,
                    ...record.results[0],
                  },
                },
              };
    },
    { dirty: {}, clean: {}, noResult: {} },
  );
};

const isDoubtfulResults = (dataFromApi: NormalizedInseeResult[]) => {
  return dataFromApi[0]?.score < 0.6;
};

const areTooCloseResults = (dataFromApi: NormalizedInseeResult[]) => {
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
    mappings[COLUMN_MAPPING_NAMES.COLLECTIVITE.name] &&
    mappings[COLUMN_MAPPING_NAMES.CODE_INSEE.name]
  );
};
