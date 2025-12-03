import { RowRecord } from "grist/GristData";
import {
  COLUMN_MAPPING_NAMES,
  DECOUPAGE_ADMIN,
  NO_DATA_MESSAGES,
} from "./constants";
import {
  EntiteAdmin,
  MAILLE_ACCEPTED_VALUES,
  MailleLabel,
  NormalizedInseeResult,
} from "./types";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { MappedRecord } from "../../lib/util/types";
import { UncleanedRecord } from "../../lib/cleanData/types";
import { removeAccents } from "../../lib/util/utils";

// Mapping pour déterminer l'endpoint de l'API geo.api.gouv.fr selon la maille
const getApiEndpoint = (maille: string): string => {
  if (!maille) {
    throw new Error(NO_DATA_MESSAGES.NO_SOURCE_DATA);
  } 
  const normalizedMaille = normalizeMaille(maille);
  if (!normalizedMaille) {
    throw new Error("maille invalide");
  }
  return DECOUPAGE_ADMIN[normalizedMaille].apiGeoUrl || "";
};

// Fonction pour normaliser les résultats de l'API geo.api.gouv.fr vers le format NormalizedInseeResult
const normalizeGeoApiResults = (
  results: any[],
  maille: string,
): NormalizedInseeResult[] => {
  return results.map((result) => {
    return {
      lib_groupement: result.nom || "",
      maille: maille,
      code: result.code || "",
      insee_dep: result.codeDepartement || result.departement?.code || "",
      score: result._score,
    };
  });
};

export const callInseeCodeApi = async (
  collectivity: string,
  maille: string,
  dept?: string,
): Promise<NormalizedInseeResult[]> => {
  console.log("---- appel de l'api")
  const endpoint = getApiEndpoint(maille);

  const url = new URL(`https://geo.api.gouv.fr/${endpoint}`);
  url.searchParams.set("nom", collectivity);

  // Ajouter le champ departement pour les communes et epcis
  if (endpoint === "communes" || endpoint === "epcis") {
    url.searchParams.set("fields", "departement");
  }

  // Filtrer par département si fourni
  if (dept && (endpoint === "communes" || endpoint === "epcis")) {
    url.searchParams.set("codeDepartement", dept);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(
      "L'appel à l'API geo.api.gouv.fr n'a pas fonctionné"
    )
  }
  const data = await response.json();
  console.log("-----------")
  console.log(data)

  // L'API geo.api.gouv.fr renvoie directement un tableau de résultats
  return normalizeGeoApiResults(data, maille);
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

  const collectiviteValue = mappedRecord[COLUMN_MAPPING_NAMES.COLLECTIVITE.name];
  const mailleValue = mappedRecord[COLUMN_MAPPING_NAMES.MAILLE.name];

  if (collectiviteValue) {
    // Call the api if we don't have to check the destination column or if there are empty
    if (
      !checkDestinationIsEmpty ||
      !mappedRecord[COLUMN_MAPPING_NAMES.CODE_INSEE.name] ||
      (mappings[COLUMN_MAPPING_NAMES.LIB_GROUPEMENT.name] &&
        !mappedRecord[COLUMN_MAPPING_NAMES.LIB_GROUPEMENT.name])
    ) {
      collectivite = collectiviteValue;
      const departement = mappedRecord[COLUMN_MAPPING_NAMES.DEPARTEMENT.name];

      // Déterminer la nature juridique à utiliser
      const normalizedMailleValue = normalizeMaille(mailleValue);
      const maille = normalizedMailleValue
        ? normalizedMailleValue
        : generalNatureJuridique
          ? generalNatureJuridique.key
          : "";

      try {
        inseeCodeResults = await callInseeCodeApi(
          collectivite,
          maille,
          departement,
        );
      } catch (error) {
        console.error(error.message);
        noResultMessage = error.message;
      }

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
  generalNatureJuridique: EntiteAdmin | null,
): Promise<UncleanedRecord<NormalizedInseeResult>[]> => {
  const inseeCodeDataFromApi: UncleanedRecord<NormalizedInseeResult>[] = [];
  for (const record of records) {
    // We call the API only if the source column is filled and if the destination column are not
    inseeCodeDataFromApi.push(
      await getInseeCodeResults(
        grist.mapColumnNames(record),
        mappings,
        true,
        generalNatureJuridique,
      ),
    );
  }
  return inseeCodeDataFromApi;
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

const normalizeMaille = (inputMaille: string): MailleLabel | null => {
  if (!inputMaille) {
    return null;
  }
  const normalizedInput = removeAccents(inputMaille.toLowerCase().trim());
  // Check each maille type and its accepted values
  for (const [mailleLabel, acceptedValues] of Object.entries(
    MAILLE_ACCEPTED_VALUES,
  )) {
    if (acceptedValues.includes(normalizedInput)) {
      return mailleLabel as MailleLabel;
    }
  }
  return null;
};
