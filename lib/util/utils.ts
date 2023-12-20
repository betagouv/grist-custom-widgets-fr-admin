import { MESSAGES } from "./constants";
import { KeyValue, SortedRecords, UncleanedRecord } from "./types";

export const cleanAndSortRecords = <NormalizedSirenResult extends KeyValue>(
  recordsUncleanedData: UncleanedRecord<NormalizedSirenResult>[],
  isDoubtfulResults: (data: NormalizedSirenResult[]) => boolean,
  areTooCloseResults: (data: NormalizedSirenResult[]) => boolean,
): SortedRecords<NormalizedSirenResult> => {
  return recordsUncleanedData.reduce<SortedRecords<NormalizedSirenResult>>(
    (acc: SortedRecords<NormalizedSirenResult>, record) => {
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
