import { KeyValue } from "../util/types";
import { SortedRecords, UncleanedRecord } from "./types";

export const MESSAGES = {
  DOUBTFUL_RESULT: "Les scores sont douteux",
  TOO_CLOSE_RESULT:
    "Les scores sont trop proches pour sélectionner le bon groupement automatiquement",
};

export const cleanAndSortRecords = <NormalizedResult extends KeyValue>(
  recordsUncleanedData: UncleanedRecord<NormalizedResult>[],
  isDoubtfulResults: (data: NormalizedResult[]) => boolean,
  areTooCloseResults: (data: NormalizedResult[]) => boolean,
): SortedRecords<NormalizedResult> => {
  return recordsUncleanedData.reduce<SortedRecords<NormalizedResult>>(
    (acc: SortedRecords<NormalizedResult>, record) => {
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
                      sourceData: record.sourceData,
                      ...record.results[0],
                    },
                  },
                };
    },
    { dirty: {}, clean: {}, noResult: {} },
  );
};
