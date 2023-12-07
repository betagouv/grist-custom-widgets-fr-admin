import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { COLUMN_MAPPING_NAMES, NO_DATA_MESSAGES } from "./constants";
import {
  CleanGeoCodeRecord,
  DirtyGeoCodeRecord,
  GeoCodeUncleanedRecord,
  MappedRecord,
  NoResultGeoCodeRecord,
  NormalizedGeocodeResult,
} from "./types";
import { RowRecord } from "grist/GristData";
import { MESSAGES } from "../../lib/util/constants";

//Return ltn, lng, address from a string
export const callGeoCodeApi = async (
  q: string,
): Promise<NormalizedGeocodeResult[]> => {
  const url = new URL("https://api-adresse.data.gouv.fr/search/");
  url.searchParams.set("q", q);

  const response = await fetch(url.toString());
  const data = await response.json();

  // @ts-expect-error d in any type
  return (data.features ?? []).map((d) => {
    return {
      lat: d.geometry.coordinates[1],
      lng: d.geometry.coordinates[0],
      address_nomalized: d.properties.label,
      score: d.properties.score,
      departement: d.properties.context?.split(", ")[1],
    };
  });
};

export const getGeoCodeResults = async (
  mappedRecord: MappedRecord,
  mappings: WidgetColumnMap,
  checkDestinationIsEmpty: boolean,
): Promise<GeoCodeUncleanedRecord> => {
  let noResultMessage;
  let address = "";
  let geoCodeResults: NormalizedGeocodeResult[] = [];
  let toIgnore = false;
  if (mappedRecord[COLUMN_MAPPING_NAMES.ADDRESS.name]) {
    if (
      !checkDestinationIsEmpty ||
      !mappedRecord[COLUMN_MAPPING_NAMES.LATITUDE.name] ||
      !mappedRecord[COLUMN_MAPPING_NAMES.LONGITUDE.name] ||
      (mappings[COLUMN_MAPPING_NAMES.NORMALIZED_ADDRESS.name] &&
        !mappedRecord[COLUMN_MAPPING_NAMES.NORMALIZED_ADDRESS.name])
    ) {
      address = mappedRecord[COLUMN_MAPPING_NAMES.ADDRESS.name];
      geoCodeResults = await callGeoCodeApi(address);
      if (geoCodeResults === undefined) {
        console.error(
          "The call to the api give a response with undefined result",
        );
        noResultMessage = NO_DATA_MESSAGES.API_ERROR;
      } else if (geoCodeResults.length === 0) {
        noResultMessage = NO_DATA_MESSAGES.NO_RESULT;
      }
    } else {
      toIgnore = true;
    }
  } else {
    noResultMessage = NO_DATA_MESSAGES.NO_SOURCE_DATA;
  }
  console.log({
    recordId: mappedRecord.id,
    address,
    results: geoCodeResults,
    noResultMessage,
    toIgnore,
  });
  return {
    recordId: mappedRecord.id,
    address,
    results: geoCodeResults,
    noResultMessage,
    toIgnore,
  };
};

export const getGeoCodeResultsForRecord = async (
  record: RowRecord,
  mappings: WidgetColumnMap,
) => {
  return await getGeoCodeResults(grist.mapColumnNames(record), mappings, false);
};

export const getGeoCodeResultsForRecords = async (
  records: RowRecord[],
  mappings: WidgetColumnMap,
  // eslint-disable-next-line @typescript-eslint/ban-types
  callBackFunction: Function,
) => {
  const geoCodeDataFromApi: GeoCodeUncleanedRecord[] = [];
  for (const i in records) {
    const record = records[i];
    // We call the API only if the source column is filled and if the destination column are not
    geoCodeDataFromApi.push(
      await getGeoCodeResults(grist.mapColumnNames(record), mappings, true),
    );
    if (parseInt(i) % 100 === 0 || parseInt(i) === records.length - 1) {
      callBackFunction(geoCodeDataFromApi, parseInt(i), records.length);
      // clear data
      geoCodeDataFromApi.length = 0;
    }
  }
};

type ReduceReturnType = {
  dirty: { [recordId: number]: DirtyGeoCodeRecord };
  clean: { [recordId: number]: CleanGeoCodeRecord };
  noResult: { [recordId: number]: NoResultGeoCodeRecord };
};

export const cleanRecordsData = (
  recordsUncleanedData: GeoCodeUncleanedRecord[],
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
                      address: record.address,
                      ...record.results[0],
                    },
                  },
                };
    },
    { dirty: {}, clean: {}, noResult: {} },
  );
};

// TODO : check pertinance of score rules
const isDoubtfulResults = (dataFromApi: NormalizedGeocodeResult[]) => {
  return dataFromApi[0]?.score < 0.6;
};

const areTooCloseResults = (dataFromApi: NormalizedGeocodeResult[]) => {
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
    mappings[COLUMN_MAPPING_NAMES.ADDRESS.name] &&
    mappings[COLUMN_MAPPING_NAMES.LONGITUDE.name] &&
    mappings[COLUMN_MAPPING_NAMES.LATITUDE.name]
  );
};