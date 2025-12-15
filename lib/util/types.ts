export interface KeyAsString {
  [key: string]: string;
}

export interface KeyValue {
  [key: string]: any;
}

export type MappedRecord = {
  id: number;
  [key: string]: any;
};

export type MappedRecordForUpdate = {
  id: number;
  fields: {
    [key: string]: any;
  };
};
