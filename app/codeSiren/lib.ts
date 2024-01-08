import { RowRecord } from "grist/GristData";
import { COLUMN_MAPPING_NAMES, NO_DATA_MESSAGES } from "./constants";

import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { NormalizedSirenResult } from "./types";
import { MappedRecord } from "../../lib/util/types";
import { UncleanedRecord } from "../../lib/cleanData/types";

const callSirenCodeApi = async (
  query: string,
  isCollectiviteTerritoriale: boolean,
  dept?: string,
  codeCommune?: string,
  codePostal?: string,
): Promise<NormalizedSirenResult[] | undefined> => {
  const url = new URL("https://recherche-entreprises.api.gouv.fr/search");
  url.searchParams.set("q", query);
  // TODO : check constrainte of shape : code commune strings of lenght 5, dept strings of lenght 2 or 3
  url.searchParams.set(
    "est_collectivite_territoriale",
    isCollectiviteTerritoriale.toString(),
  );
  dept && url.searchParams.set("departement", dept);
  codeCommune && url.searchParams.set("code_commune", codeCommune);
  codePostal && url.searchParams.set("code_postal", codePostal);
  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      const error = await response.json();
      console.log(error);
      return undefined;
    }
    const data = await response.json();
    // @ts-expect-error result in any type
    return (data.results ?? []).map((result) => {
      return {
        label: result.nom_complet,
        siren: result.siren,
        code_commune: result.siege.code_postal,
        siret: result.siege.siret,
        score: result.score,
      };
    });
  } catch (error) {
    console.log(error);
    return undefined;
  }
};

const getSirenCodeResults = async (
  mappedRecord: MappedRecord,
  mappings: WidgetColumnMap,
  checkDestinationIsEmpty: boolean,
  isCollectiviteTerritoriale: boolean,
): Promise<UncleanedRecord<NormalizedSirenResult>> => {
  let noResultMessage;
  let name = "";
  let sirenCodeResults: NormalizedSirenResult[] | undefined = [];
  let toIgnore = false;
  mainIf: if (mappedRecord[COLUMN_MAPPING_NAMES.NAME.name]) {
    // Call the api if we don't have to check the destination column or if there are empty
    if (
      !checkDestinationIsEmpty ||
      !mappedRecord[COLUMN_MAPPING_NAMES.SIREN.name] ||
      (mappings[COLUMN_MAPPING_NAMES.NORMALIZED_NAME.name] &&
        !mappedRecord[COLUMN_MAPPING_NAMES.NORMALIZED_NAME.name])
    ) {
      name = mappedRecord[COLUMN_MAPPING_NAMES.NAME.name];
      const departement = mappedRecord[COLUMN_MAPPING_NAMES.DEPARTEMENT.name];
      const codeCommune = mappedRecord[COLUMN_MAPPING_NAMES.CODE_COMMUNE.name];
      const codePostal = mappedRecord[COLUMN_MAPPING_NAMES.CODE_POSTAL.name];
      // Check the format of params before calling the API
      if (codeCommune && !checkCodeList(codeCommune, 5)) {
        noResultMessage =
          "Un code INSEE de commune doit contenir exactement 5 caractères, vérifier l'information dans la colonne concernée";
        break mainIf;
      }
      if (codePostal && !checkCodeList(codePostal, 5)) {
        noResultMessage =
          "Un code Postal de commune doit contenir exactement 5 caractères, vérifier l'information dans la colonne concernée";
        break mainIf;
      }
      sirenCodeResults = await callSirenCodeApi(
        name,
        isCollectiviteTerritoriale,
        departement,
        codeCommune,
        codePostal,
      );
      if (sirenCodeResults === undefined) {
        console.error(
          "The call to the api give a response with undefined result",
        );
        noResultMessage = NO_DATA_MESSAGES.API_ERROR;
      } else if (sirenCodeResults.length === 0) {
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
    sourceData: name,
    results: sirenCodeResults || [],
    noResultMessage,
    toIgnore,
  };
};

export const getSirenCodeResultsForRecord = async (
  record: RowRecord,
  mappings: WidgetColumnMap,
  isCollectiviteTerritoriale: boolean,
) => {
  return await getSirenCodeResults(
    grist.mapColumnNames(record),
    mappings,
    false,
    isCollectiviteTerritoriale,
  );
};

export const getSirenCodeResultsForRecords = async (
  records: RowRecord[],
  mappings: WidgetColumnMap,
  // eslint-disable-next-line @typescript-eslint/ban-types
  callBackFunction: Function,
  areCollectivitesTerritoriales: boolean,
) => {
  const sirenCodeDataFromApi: UncleanedRecord<NormalizedSirenResult>[] = [];
  for (const i in records) {
    const record = records[i];
    // We call the API only if the source column is filled and if the destination column are not
    sirenCodeDataFromApi.push(
      await getSirenCodeResults(
        grist.mapColumnNames(record),
        mappings,
        true,
        areCollectivitesTerritoriales,
      ),
    );
    if (parseInt(i) % 10 === 0 || parseInt(i) === records.length - 1) {
      callBackFunction(sirenCodeDataFromApi, parseInt(i), records.length);
      // clear data
      sirenCodeDataFromApi.length = 0;
    }
  }
};

export const isDoubtfulResults = (dataFromApi: NormalizedSirenResult[]) => {
  return dataFromApi[0]?.score < 0.6;
};

export const areTooCloseResults = (dataFromApi: NormalizedSirenResult[]) => {
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
    mappings[COLUMN_MAPPING_NAMES.NAME.name] &&
    mappings[COLUMN_MAPPING_NAMES.SIREN.name]
  );
};

const checkCodeList = (codeList: [], numberOfChar: number) => {
  return codeList
    .toString()
    .split(",")
    .every((e: string) => e.length === numberOfChar);
};
