import * as turf from "@turf/turf";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { COLUMN_MAPPING_NAMES } from "./constants";
import { QPVData, QPVInfo } from "./types";

const QPV_DATA_URL =
  "https://www.data.gouv.fr/fr/datasets/r/942d4ee8-8142-4556-8ea1-335537ce1119";

export async function loadQPVData(
  progressBarCallback: (percent: number) => void,
): Promise<{
  features: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>[];
}> {
  const response = await fetch(QPV_DATA_URL);

  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }

  const reader = response.body!.getReader();
  const contentLengthHeader = response.headers.get("Content-Length");
  const contentLength = contentLengthHeader ? +contentLengthHeader : 0;

  let receivedLength = 0;
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
    receivedLength += value.length;

    if (contentLength) {
      const percentLoaded = Math.round((receivedLength / contentLength) * 100);
      progressBarCallback(percentLoaded);
    }
  }

  const chunksAll = new Uint8Array(receivedLength);
  let position = 0;
  for (const chunk of chunks) {
    chunksAll.set(chunk, position);
    position += chunk.length;
  }

  const jsonText = new TextDecoder("utf-8").decode(chunksAll);
  const qpvData = JSON.parse(jsonText);

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
      console.error("Erreur lors de la vérification d'un polygone: ", error);
      if (error instanceof Error) {
        console.error(
          "Erreur lors de la vérification d'un polygone: " + error.message,
        );
      }
    }
  }

  return {
    inQPV: qpvInfo.length > 0,
    qpvInfo: qpvInfo,
  };
}

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
  error: unknown,
  setResultMessage: ({
    message,
    type,
  }: {
    message: string;
    type: string;
  }) => void,
) => {
  const errorMessage = error instanceof Error ? error.message : error;
  const message = `Erreur lors de l'analyse: ${errorMessage}`;
  console.error(message);
  setResultMessage({ message: message, type: "error" });
};
