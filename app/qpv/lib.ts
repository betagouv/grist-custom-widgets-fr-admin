import * as turf from "@turf/turf";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { COLUMN_MAPPING_NAMES } from "./constants";
import { QPVData, QPVInfo, ResultStats } from "./types";
import { RowRecord } from "grist/GristData";
import { MappedRecordForUpdate } from "../../lib/util/types";

const QPV_DATA_URL =
  "https://www.data.gouv.fr/fr/datasets/r/942d4ee8-8142-4556-8ea1-335537ce1119";

export async function loadQPVData(): Promise<{
  features: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>[];
}> {
  const response = await fetch(QPV_DATA_URL);

  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }

  const qpvData = await response.json();

  console.log(
    `Données QPV chargées: ${qpvData.features.length} quartiers prioritaires`,
  );

  return qpvData;
}

// Vérifier si un point est dans un QPV
export function checkPointInQPV(
  lon: number,
  lat: number,
  qpvData: QPVData,
): {
  inQPV: boolean;
  qpvInfo: QPVInfo[];
} {
  if (!qpvData || !qpvData.features) {
    return { inQPV: false, qpvInfo: [] };
  }

  const point = turf.point([lon, lat]);
  const qpvInfo: QPVInfo[] = [];

  for (const feature of qpvData.features) {
    try {
      if (turf.booleanPointInPolygon(point, feature)) {
        const properties = feature.properties || {};
        qpvInfo.push({
          nom: properties.lib_qp || "Non renseigné",
          code: properties.code_qp || "Non renseigné",
          commune: properties.lib_com || "Non renseignée",
          epci: properties.siren_epci || "Non renseigné",
          departement: properties.lib_dep || "Non renseigné",
          region: properties.lib_reg || "Non renseignée",
        });
      }
    } catch (error: unknown) {
      logError(
        "Erreur lors de la vérification d'un polygone",
        error,
        undefined,
      );
    }
  }

  return {
    inQPV: qpvInfo.length > 0,
    qpvInfo: qpvInfo,
  };
}

export const checkIfRecordsCoordinatesAreInQpv = (
  records: RowRecord[],
  qpvData: QPVData,
  updates: MappedRecordForUpdate[],
  stats: ResultStats,
) => {
  // Traiter chaque enregistrement
  for (const record of records) {
    const mappedRecord = grist.mapColumnNames(record);
    const recordId = record.id;

    // Vérifier si les coordonnées sont valides
    const latValue = mappedRecord[COLUMN_MAPPING_NAMES.LATITUDE.name];
    const lonValue = mappedRecord[COLUMN_MAPPING_NAMES.LONGITUDE.name];
    const lat = parseFloat(latValue);
    const lon = parseFloat(lonValue);

    let isInQPV: boolean | string = false;
    let qpvName = "";
    let qpvCode = "";

    if (!isNaN(lat) && !isNaN(lon)) {
      stats.validCount++;
      const result = checkPointInQPV(lon, lat, qpvData!);

      if (result.inQPV && result.qpvInfo.length > 0) {
        stats.qpvCount++;
        isInQPV = true;
        qpvName = result.qpvInfo[0].nom;
        qpvCode = result.qpvInfo[0].code;
      }
    } else {
      // Les coordonnées renseignées dans ce record sont invalides
      stats.invalidCount++;
      isInQPV = "Coordonnées invalides";
    }

    updates.push({
      id: recordId,
      fields: {
        [COLUMN_MAPPING_NAMES.EST_QPV.name]: isInQPV,
        [COLUMN_MAPPING_NAMES.NOM_QPV.name]: qpvName,
        [COLUMN_MAPPING_NAMES.CODE_QPV.name]: qpvCode,
      },
    });
  }
};

export const writeInGrist = async (
  updates: {
    id: number;
    fields: unknown;
  }[],
) => {
  // Récupérer l'objet de table actif et son ID
  const table = await grist.getTable();
  const tableId = await table.getTableId();
  console.log(`Table ID: ${tableId}`);
  const actions = [];

  for (const update of updates) {
    actions.push(["UpdateRecord", tableId, update.id, update.fields]);
  }

  // Appliquer toutes les actions en une seule transaction
  await grist.docApi.applyUserActions(actions);

  // Rafraîchir la vue
  await grist.viewApi.fetchSelectedTable();
  console.log("Vue rafraîchie avec fetchSelectedTable");
};

export const mappingsIsReady = (mappings: WidgetColumnMap | null) => {
  return (
    mappings &&
    mappings[COLUMN_MAPPING_NAMES.LATITUDE.name] &&
    mappings[COLUMN_MAPPING_NAMES.LONGITUDE.name] &&
    mappings[COLUMN_MAPPING_NAMES.NOM_QPV.name] &&
    mappings[COLUMN_MAPPING_NAMES.EST_QPV.name] &&
    mappings[COLUMN_MAPPING_NAMES.CODE_QPV.name]
  );
};

export const logError = (
  context: string,
  error: unknown,
  setResultMessage:
    | (({ message, type }: { message: string; type: string }) => void)
    | undefined,
) => {
  const errorMessage = error instanceof Error ? error.message : error;
  const message = `${context}: ${errorMessage}`;
  console.error(message);
  if (setResultMessage) {
    setResultMessage({ message: message, type: "error" });
  }
};
