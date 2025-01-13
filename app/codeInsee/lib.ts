import { RowRecord } from "grist/GristData";
import {
  COLUMN_MAPPING_NAMES,
  NATURE_JURIDIQUE,
  NO_DATA_MESSAGES,
} from "./constants";
import {
  EntiteAdmin,
  NormalizedInseeResult,
  NormalizedInseeResults,
} from "./types";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { MappedRecord } from "../../lib/util/types";
import { UncleanedRecord } from "../../lib/cleanData/types";

export const callInseeCodeApi = async (
  collectivity: string,
  dept?: string,
  natureJuridique?: string,
): Promise<NormalizedInseeResult[]> => {
  // The only use of this endpoint is here ! If we change the API used, we could delete the addok service.
  const url = new URL("https://addok.donnees.incubateur.anct.gouv.fr/search");
  url.searchParams.set("q", collectivity);
  if (dept) {
    url.searchParams.set("insee_dep", dept);
  }
  if (natureJuridique) {
    url.searchParams.set("nature_juridique", natureJuridique);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    console.error(
      "The call to the addok.donnees.incubateur.anct.gouv.fr api is not 200 status",
      response,
    );
  }
  const data: NormalizedInseeResults = await response.json();
  return data.results;
};

export const getInseeCodeResults = async (
  mappedRecord: MappedRecord,
  mappings: WidgetColumnMap,
  checkDestinationIsEmpty: boolean,
  generalNatureJuridique: EntiteAdmin | null,
): Promise<UncleanedRecord<NormalizedInseeResult>> => {
  let noResultMessage;
  let collectivite = "";
  let inseeCodeResults: NormalizedInseeResult[] = [];
  let toIgnore = false;
  if (mappedRecord[COLUMN_MAPPING_NAMES.COLLECTIVITE.name]) {
    // Call the api if we don't have to check the destination column or if there are empty
    if (
      !checkDestinationIsEmpty ||
      !mappedRecord[COLUMN_MAPPING_NAMES.CODE_INSEE.name] ||
      (mappings[COLUMN_MAPPING_NAMES.LIB_GROUPEMENT.name] &&
        !mappedRecord[COLUMN_MAPPING_NAMES.LIB_GROUPEMENT.name])
    ) {
      collectivite = mappedRecord[COLUMN_MAPPING_NAMES.COLLECTIVITE.name];
      const departement = mappedRecord[COLUMN_MAPPING_NAMES.DEPARTEMENT.name];
      const natureJuridique =
        mappedRecord[COLUMN_MAPPING_NAMES.NATURE_JURIDIQUE.name];
      // natureJuridique is taken into account only if it's a valid value, otherwise we use the general one if it's defined
      inseeCodeResults = await callInseeCodeApi(
        collectivite,
        departement,
        NATURE_JURIDIQUE[natureJuridique]
          ? natureJuridique
          : generalNatureJuridique
            ? generalNatureJuridique.key
            : undefined,
      );
      if (inseeCodeResults === undefined) {
        console.error(
          "The call to the api give a response with undefined result",
        );
        noResultMessage = NO_DATA_MESSAGES.API_ERROR;
      } else if (inseeCodeResults.length === 0) {
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
    sourceData: collectivite,
    results: inseeCodeResults,
    noResultMessage,
    toIgnore,
  };
};

export const getInseeCodeResultsForRecord = async (
  record: RowRecord,
  mappings: WidgetColumnMap,
  generalNatureJuridique: EntiteAdmin | null,
) => {
  return await getInseeCodeResults(
    grist.mapColumnNames(record),
    mappings,
    false,
    generalNatureJuridique,
  );
};

export const getInseeCodeResultsForRecords = async (
  records: RowRecord[],
  mappings: WidgetColumnMap,
  callBackFunction: (
    data: UncleanedRecord<NormalizedInseeResult>[],
    i: number,
    length: number,
  ) => void,
  generalNatureJuridique: EntiteAdmin | null,
) => {
  const inseeCodeDataFromApi: UncleanedRecord<NormalizedInseeResult>[] = [];
  for (const i in records) {
    const record = records[i];
    // We call the API only if the source column is filled and if the destination column are not
    inseeCodeDataFromApi.push(
      await getInseeCodeResults(
        grist.mapColumnNames(record),
        mappings,
        true,
        generalNatureJuridique,
      ),
    );
    if (parseInt(i) % 10 === 0 || parseInt(i) === records.length - 1) {
      callBackFunction(inseeCodeDataFromApi, parseInt(i), records.length);
      // clear data
      inseeCodeDataFromApi.length = 0;
    }
  }
};

export const isDoubtfulResults = (dataFromApi: NormalizedInseeResult[]) => {
  return dataFromApi[0]?.score < 0.6;
};

export const areTooCloseResults = (dataFromApi: NormalizedInseeResult[]) => {
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
    mappings[COLUMN_MAPPING_NAMES.COLLECTIVITE.name] &&
    mappings[COLUMN_MAPPING_NAMES.CODE_INSEE.name]
  );
};
