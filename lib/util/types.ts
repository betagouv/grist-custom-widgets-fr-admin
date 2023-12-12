export interface KeyAsString {
  [key: string]: string;
}

export type MappedRecord = {
  id: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type WidgetStep =
  | "loading"
  | "config"
  | "global_processing"
  | "specific_processing"
  | "menu";
