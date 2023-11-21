// @ts-nocheck

import { COLUMN_MAPPING_NAMES } from "./constants";
import { NormalizedGeocodeRecords } from "./types";

//Return ltn, lng, adresse from a string
export const geocodeFromAdress = async (q: string): Promise<NormalizedGeocodeRecords> => {
  const url = new URL("https://api-adresse.data.gouv.fr/search/");
  url.searchParams.set("q", q);

  const response = await fetch(url.toString());
  const data = await response.json();

  return (data.features ?? []).map((d) => {
    return {
      lat: d.geometry.coordinates[1],
      lng: d.geometry.coordinates[0],
      address_nomalized: d.properties.label,
      score: d.properties.score,
    }
  })
};

export const getGeoCodeDataFromApi = async (dataSetter, mappingSetter) => {
  grist.onRecords(async (records, mappings) => {
    const geocodeRecords = [];
    for (const record of records) {
      const mapped = grist.mapColumnNames(record);
      console.log("--- RECORD")
      console.log(record)
      console.log("--- MAPPED")
      console.log(mapped)
      if (!mapped[COLUMN_MAPPING_NAMES.LATITUDE] || !mapped[COLUMN_MAPPING_NAMES.LONGITUDE] || !mapped[COLUMN_MAPPING_NAMES.NORMALIZED_ADDRESS]) {
        const address = mapped[COLUMN_MAPPING_NAMES.ADDRESS];
        const geocodeRecord = await geocodeFromAdress(address);
        geocodeRecords.push({
          result: geocodeRecord,
          recordId: record.id,
          address
        });
      }
    }
    dataSetter(geocodeRecords);
    mappingSetter(mappings);
  });
};

export const cleanRecordData = (dataFromApi) => {
  return dataFromApi.reduce(
    (acc, value) => {
      return !isClean(value.result)
        ? { ...acc, dirty: [...acc.dirty, value] }
        : {
          ...acc,
          clean: [
            ...acc.clean,
            {
              recordId: value.recordId,
              address: value.address,
              ...value.result[0],
            },
          ],
        };
    },
    { dirty: [], clean: [] }
  );
};

export const isClean = (dataFromApi) => {
  const [firstChoice, secondChoice] = dataFromApi;
  return firstChoice?.score > 0.8 && secondChoice?.score < 0.8;
};
