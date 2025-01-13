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
): Promise<NormalizedSirenResult[]> => {
  const url = new URL("https://recherche-entreprises.api.gouv.fr/search");
  url.searchParams.set("q", query);
  // TODO : check constrainte of shape : code commune strings of lenght 5, dept strings of lenght 2 or 3
  url.searchParams.set("minimal", "true");
  url.searchParams.set("include", "score,siege");
  url.searchParams.set(
    "est_collectivite_territoriale",
    isCollectiviteTerritoriale.toString(),
  );
  if (dept) {
    url.searchParams.set("departement", dept);
  }
  if (codeCommune) {
    url.searchParams.set("code_commune", codeCommune);
  }
  if (codePostal) {
    url.searchParams.set("code_postal", codePostal);
  }
  const response = await fetch(url.toString());
  if (!response.ok) {
    console.error(
      "The call to the recherche-entreprises.api.gouv.fr api is not 200 status",
      response,
    );
  }
  const data = await response.json();
  // @ts-expect-error result in any type
  return (data.results ?? []).slice(0, 5).map((result) => {
    return {
      label: result.nom_complet,
      siren: result.siren,
      code_commune: result.siege.code_postal,
      siret: result.siege.siret,
      score: result.score,
    };
  });
};

const getSirenCodeResults = async (
  mappedRecord: MappedRecord,
  mappings: WidgetColumnMap,
  checkDestinationIsEmpty: boolean,
  isCollectiviteTerritoriale: boolean,
): Promise<UncleanedRecord<NormalizedSirenResult>> => {
  let noResultMessage;
  let name = "";
  let sirenCodeResults: NormalizedSirenResult[] = [];
  let toIgnore = false;
  if (mappedRecord[COLUMN_MAPPING_NAMES.NAME.name]) {
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
    results: sirenCodeResults,
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
  callBackFunction: (
    data: UncleanedRecord<NormalizedSirenResult>[],
    i: number,
    length: number,
  ) => void,
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

/**
 * Réponse à la question de l'utilisation du score de l'API par un responsable de celle-ci :
 *
 * Il est important de noter que ce score n'est pas une mesure de fiabilité au sens strict du terme.
 * Il est généré par Elasticsearch en fonction de notre algorithme de recherche, utilisé pour classer les résultats.
 * Ce score n'est pas standardisé et peut varier considérablement d'un résultat à l'autre.
 * Il est donc recommandé de l'utiliser avec prudence.
 */
export const isDoubtfulResults = (_: NormalizedSirenResult[]) => {
  return false;
};

export const areTooCloseResults = (dataFromApi: NormalizedSirenResult[]) => {
  if (dataFromApi.length > 1) {
    const [firstChoice, secondChoice] = dataFromApi;
    const ratio = secondChoice.score / firstChoice.score;
    return ratio > 0.8;
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
