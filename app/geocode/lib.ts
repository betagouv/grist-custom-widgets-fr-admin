import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { COLUMN_MAPPING_NAMES, NO_DATA_MESSAGES } from "./constants";
import { NormalizedGeocodeResult } from "./types";
import { RowRecord } from "grist/GristData";
import { MappedRecord } from "../../lib/util/types";
import { UncleanedRecord } from "../../lib/cleanData/types";

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
      address_normalized: d.properties.label,
      score: d.properties.score,
      departement: d.properties.context?.split(", ")[1],
    };
  });
};

export const getGeoCodeResults = async (
  mappedRecord: MappedRecord,
  mappings: WidgetColumnMap,
  checkDestinationIsEmpty: boolean,
): Promise<UncleanedRecord<NormalizedGeocodeResult>> => {
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
  return {
    recordId: mappedRecord.id,
    sourceData: address,
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
  callBackFunction: (
    data: UncleanedRecord<NormalizedGeocodeResult>[],
    i: number,
    length: number,
  ) => void,
) => {
  const geoCodeDataFromApi: UncleanedRecord<NormalizedGeocodeResult>[] = [];
  for (const i in records) {
    const record = records[i];
    // We call the API only if the source column is filled and if the destination column are not
    geoCodeDataFromApi.push(
      await getGeoCodeResults(grist.mapColumnNames(record), mappings, true),
    );
    if (parseInt(i) % 10 === 0 || parseInt(i) === records.length - 1) {
      callBackFunction(geoCodeDataFromApi, parseInt(i), records.length);
      // clear data
      geoCodeDataFromApi.length = 0;
    }
  }
};

// TODO : check pertinance of score rules
export const isDoubtfulResults = (dataFromApi: NormalizedGeocodeResult[]) => {
  return dataFromApi[0]?.score < 0.6;
};

export const areTooCloseResults = (dataFromApi: NormalizedGeocodeResult[]) => {
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
