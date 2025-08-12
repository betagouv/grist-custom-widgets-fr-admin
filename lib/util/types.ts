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

export type MappedRecordForUpdate = {
  id: number;
  fields: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
};
