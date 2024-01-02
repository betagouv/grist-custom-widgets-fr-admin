import { KeyValue } from "../util/types";

export type WidgetCleanDataSteps =
  | "loading"
  | "config"
  | "global_processing"
  | "specific_processing"
  | "menu";

export type UncleanedRecord<NormalizedResult extends KeyValue> = {
  results: NormalizedResult[];
  recordId: number;
  sourceData: string;
  noResultMessage?: string;
  toIgnore: boolean;
};

export type DirtyRecord<NormalizedResult extends KeyValue> =
  UncleanedRecord<NormalizedResult> & {
    dirtyMessage: string;
  };

export type NoResultRecord<NormalizedResult extends KeyValue> = {
  result?: NormalizedResult;
  recordId: number;
  noResultMessage: string;
};

export type CleanRecord<NormalizedResult extends KeyValue> =
  NormalizedResult & {
    sourceData: string;
    recordId: number;
  };

export type SortedRecords<NormalizedResult extends KeyValue> = {
  dirty: { [recordId: number]: DirtyRecord<NormalizedResult> };
  clean: { [recordId: number]: CleanRecord<NormalizedResult> };
  noResult: { [recordId: number]: NoResultRecord<NormalizedResult> };
};

export type NoDataMessage = {
  NO_DESTINATION_DATA: string;
  NO_RESULT: string;
  NO_SOURCE_DATA: string;
  API_ERROR: string;
};
