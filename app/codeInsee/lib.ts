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
        
        if (inseeCodeResults === undefined) {
          console.error(
            "The call to the api give a response with undefined result",
          );
          noResultMessage = NO_DATA_MESSAGES.API_ERROR;
        } else if (inseeCodeResults.length === 0) {
          noResultMessage = NO_DATA_MESSAGES.NO_RESULT;
        }
      } catch (error: Error) {
        console.error(error);
        noResultMessage = error.message;
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

/**
 * Traite une liste de records pour récupérer leurs codes INSEE via l'API geo.api.gouv.fr
 * 
 * Cette fonction utilise une callback function pour traiter les résultats par batch (tous les 10 enregistrements)
 * plutôt que d'attendre la fin de l'ensemble du traitement. Cette approche présente plusieurs avantages :
 * - Affichage progressif des résultats dans l'interface utilisateur
 * - Mise à jour incrémentale du Grist, permettant de sauvegarder les résultats au fur et à mesure
 * - En cas d'erreur durant le traitement, les résultats déjà obtenus ne sont pas perdus
 * - Meilleure expérience utilisateur avec un feedback visuel de la progression
 * 
 * @param records - Liste des enregistrements Grist à traiter
 * @param mappings - Mapping des colonnes Grist
 * @param callBackFunction - Fonction appelée tous les 10 enregistrements avec les résultats du batch
 * @param generalNatureJuridique - Nature juridique commune à tous les enregistrements (optionnel)
 */
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
    // On appelle l'API uniquement si la colonne source est remplie et si les colonnes de destination sont vides
    inseeCodeDataFromApi.push(
      await getInseeCodeResults(
        grist.mapColumnNames(record),
        mappings,
        true,
        generalNatureJuridique,
      ),
    );
    // Traitement par batch : on appelle la callback tous les 10 enregistrements ou au dernier enregistrement
    // Cela permet d'afficher les résultats progressivement et de sauvegarder au fur et à mesure dans Grist
    if (parseInt(i) % 10 === 0 || parseInt(i) === records.length - 1) {
      callBackFunction(inseeCodeDataFromApi, parseInt(i), records.length);
      // On vide le tableau pour le prochain batch
      inseeCodeDataFromApi.length = 0;
    }
  }
};

export const isDoubtfulResults = (dataFromApi: NormalizedInseeResult[]) => {
  // Le score donné par l'api geo ne semble pas fiable. Exemple la commune Nantes-en-Ratier obtient un score de 0.29 pour elle même
  return dataFromApi[0]?.score < 0.1;
};

export const areTooCloseResults = (dataFromApi: NormalizedInseeResult[]) => {
  if (dataFromApi.length > 1) {
    return true;
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
