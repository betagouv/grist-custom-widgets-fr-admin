export interface KeyAsString {
  [key: string]: string;
}

export interface KeyValue {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export type MappedRecord = {
  id: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

/**
 * Types for clean data Widgets
 */
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
