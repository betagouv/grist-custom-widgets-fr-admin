import { checkPointInQPV, checkIfRecordsCoordinatesAreInQpv } from "./lib";
import { QPVData, ResultStats } from "./types";
import { RowRecord } from "grist/GristData";
import { MappedRecordForUpdate } from "../../lib/util/types";
import { COLUMN_MAPPING_NAMES } from "./constants";

// Mock des données QPV pour les tests
const mockQPVData: QPVData = {
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [2.3522, 48.8566], // Paris - coordonnées approximatives d'un QPV
            [2.3532, 48.8566],
            [2.3532, 48.8576],
            [2.3522, 48.8576],
            [2.3522, 48.8566],
          ],
        ],
      },
      properties: {
        lib_qp: "Quartier Test Paris",
        code_qp: "QP075001",
        lib_com: "Paris",
        siren_epci: "200054781",
        lib_dep: "Paris",
        lib_reg: "Île-de-France",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [2.2945, 48.8584], // Autre quartier à Paris
              [2.2955, 48.8584],
              [2.2955, 48.8594],
              [2.2945, 48.8594],
              [2.2945, 48.8584],
            ],
          ],
        ],
      },
      properties: {
        lib_qp: "Quartier Test Paris 2",
        code_qp: "QP075002",
        lib_com: "Paris",
        siren_epci: "200054781",
        lib_dep: "Paris",
        lib_reg: "Île-de-France",
      },
    },
  ],
};

// Mock de grist pour les tests
const mockGrist = {
  mapColumnNames: jest.fn(),
};

// Assigner le mock à la variable globale
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).grist = mockGrist;

describe("checkPointInQPV", () => {
  it("should return true when point is inside a QPV", () => {
    const lon = 2.3527; // Point à l'intérieur du premier QPV
    const lat = 48.8571;

    const result = checkPointInQPV(lon, lat, mockQPVData);

    expect(result.inQPV).toBe(true);
    expect(result.qpvInfo).toHaveLength(1);
    expect(result.qpvInfo[0]).toEqual({
      nom: "Quartier Test Paris",
      code: "QP075001",
      commune: "Paris",
      epci: "200054781",
      departement: "Paris",
      region: "Île-de-France",
    });
  });

  it("should return false when point is outside any QPV", () => {
    const lon = 2.4; // Point à l'extérieur des QPV
    const lat = 48.9;

    const result = checkPointInQPV(lon, lat, mockQPVData);

    expect(result.inQPV).toBe(false);
    expect(result.qpvInfo).toHaveLength(0);
  });

  it("should return multiple QPV info when point is in overlapping QPVs", () => {
    // Pour ce test, on va créer des données avec des QPV qui se chevauchent
    const overlappingQPVData: QPVData = {
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [2.352, 48.856],
                [2.354, 48.856],
                [2.354, 48.858],
                [2.352, 48.858],
                [2.352, 48.856],
              ],
            ],
          },
          properties: {
            lib_qp: "QPV 1",
            code_qp: "QP001",
            lib_com: "Paris",
            siren_epci: "200054781",
            lib_dep: "Paris",
            lib_reg: "Île-de-France",
          },
        },
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [2.3525, 48.8565],
                [2.3545, 48.8565],
                [2.3545, 48.8585],
                [2.3525, 48.8585],
                [2.3525, 48.8565],
              ],
            ],
          },
          properties: {
            lib_qp: "QPV 2",
            code_qp: "QP002",
            lib_com: "Paris",
            siren_epci: "200054781",
            lib_dep: "Paris",
            lib_reg: "Île-de-France",
          },
        },
      ],
    };

    const lon = 2.353; // Point dans la zone de chevauchement
    const lat = 48.857;

    const result = checkPointInQPV(lon, lat, overlappingQPVData);

    expect(result.inQPV).toBe(true);
    expect(result.qpvInfo).toHaveLength(2);
  });

  it("should handle empty QPV data", () => {
    const emptyQPVData: QPVData = { features: [] };
    const lon = 2.3527;
    const lat = 48.8571;

    const result = checkPointInQPV(lon, lat, emptyQPVData);

    expect(result.inQPV).toBe(false);
    expect(result.qpvInfo).toHaveLength(0);
  });

  it("should handle QPV with missing properties", () => {
    const qpvDataWithMissingProps: QPVData = {
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [2.3522, 48.8566],
                [2.3532, 48.8566],
                [2.3532, 48.8576],
                [2.3522, 48.8576],
                [2.3522, 48.8566],
              ],
            ],
          },
          properties: {}, // Propriétés vides
        },
      ],
    };

    const lon = 2.3527;
    const lat = 48.8571;

    const result = checkPointInQPV(lon, lat, qpvDataWithMissingProps);

    expect(result.inQPV).toBe(true);
    expect(result.qpvInfo).toHaveLength(1);
    expect(result.qpvInfo[0]).toEqual({
      nom: "Non renseigné",
      code: "Non renseigné",
      commune: "Non renseignée",
      epci: "Non renseigné",
      departement: "Non renseigné",
      region: "Non renseignée",
    });
  });
});

describe("checkIfRecordsCoordinatesAreInQpv", () => {
  let mockRecords: RowRecord[];
  let mockUpdates: MappedRecordForUpdate[];
  let mockStats: ResultStats;

  beforeEach(() => {
    mockUpdates = [];
    mockStats = {
      validCount: 0,
      qpvCount: 0,
      invalidCount: 0,
    };

    // Reset du mock
    mockGrist.mapColumnNames.mockClear();
  });

  it("should process records with valid coordinates inside QPV", () => {
    mockRecords = [
      {
        id: 1,
        [COLUMN_MAPPING_NAMES.LATITUDE.name]: "48.8571",
        [COLUMN_MAPPING_NAMES.LONGITUDE.name]: "2.3527",
      } as RowRecord,
    ];

    mockGrist.mapColumnNames.mockReturnValue({
      [COLUMN_MAPPING_NAMES.LATITUDE.name]: "48.8571",
      [COLUMN_MAPPING_NAMES.LONGITUDE.name]: "2.3527",
    });

    checkIfRecordsCoordinatesAreInQpv(
      mockRecords,
      mockQPVData,
      mockUpdates,
      mockStats,
    );

    expect(mockStats.validCount).toBe(1);
    expect(mockStats.qpvCount).toBe(1);
    expect(mockStats.invalidCount).toBe(0);

    expect(mockUpdates).toHaveLength(1);
    expect(mockUpdates[0]).toEqual({
      id: 1,
      fields: {
        [COLUMN_MAPPING_NAMES.EST_QPV.name]: true,
        [COLUMN_MAPPING_NAMES.NOM_QPV.name]: "Quartier Test Paris",
        [COLUMN_MAPPING_NAMES.CODE_QPV.name]: "QP075001",
      },
    });
  });

  it("should process records with valid coordinates outside QPV", () => {
    mockRecords = [
      {
        id: 2,
        [COLUMN_MAPPING_NAMES.LATITUDE.name]: "48.9",
        [COLUMN_MAPPING_NAMES.LONGITUDE.name]: "2.4",
      } as RowRecord,
    ];

    mockGrist.mapColumnNames.mockReturnValue({
      [COLUMN_MAPPING_NAMES.LATITUDE.name]: "48.9",
      [COLUMN_MAPPING_NAMES.LONGITUDE.name]: "2.4",
    });

    checkIfRecordsCoordinatesAreInQpv(
      mockRecords,
      mockQPVData,
      mockUpdates,
      mockStats,
    );

    expect(mockStats.validCount).toBe(1);
    expect(mockStats.qpvCount).toBe(0);
    expect(mockStats.invalidCount).toBe(0);

    expect(mockUpdates).toHaveLength(1);
    expect(mockUpdates[0]).toEqual({
      id: 2,
      fields: {
        [COLUMN_MAPPING_NAMES.EST_QPV.name]: false,
        [COLUMN_MAPPING_NAMES.NOM_QPV.name]: "",
        [COLUMN_MAPPING_NAMES.CODE_QPV.name]: "",
      },
    });
  });

  it("should handle records with invalid coordinates", () => {
    mockRecords = [
      {
        id: 3,
        [COLUMN_MAPPING_NAMES.LATITUDE.name]: "invalid_lat",
        [COLUMN_MAPPING_NAMES.LONGITUDE.name]: "invalid_lon",
      } as RowRecord,
      {
        id: 4,
        [COLUMN_MAPPING_NAMES.LATITUDE.name]: "",
        [COLUMN_MAPPING_NAMES.LONGITUDE.name]: "2.3527",
      } as RowRecord,
      {
        id: 5,
        [COLUMN_MAPPING_NAMES.LATITUDE.name]: "48.8571",
        [COLUMN_MAPPING_NAMES.LONGITUDE.name]: "",
      } as RowRecord,
    ];

    mockGrist.mapColumnNames
      .mockReturnValueOnce({
        [COLUMN_MAPPING_NAMES.LATITUDE.name]: "invalid_lat",
        [COLUMN_MAPPING_NAMES.LONGITUDE.name]: "invalid_lon",
      })
      .mockReturnValueOnce({
        [COLUMN_MAPPING_NAMES.LATITUDE.name]: "",
        [COLUMN_MAPPING_NAMES.LONGITUDE.name]: "2.3527",
      })
      .mockReturnValueOnce({
        [COLUMN_MAPPING_NAMES.LATITUDE.name]: "48.8571",
        [COLUMN_MAPPING_NAMES.LONGITUDE.name]: "",
      });

    checkIfRecordsCoordinatesAreInQpv(
      mockRecords,
      mockQPVData,
      mockUpdates,
      mockStats,
    );

    expect(mockStats.validCount).toBe(0);
    expect(mockStats.qpvCount).toBe(0);
    expect(mockStats.invalidCount).toBe(3);

    expect(mockUpdates).toHaveLength(3);

    // Vérifier que tous les records invalides ont le bon message
    mockUpdates.forEach((update) => {
      expect(update.fields[COLUMN_MAPPING_NAMES.EST_QPV.name]).toBe(
        "Coordonnées invalides",
      );
      expect(update.fields[COLUMN_MAPPING_NAMES.NOM_QPV.name]).toBe("");
      expect(update.fields[COLUMN_MAPPING_NAMES.CODE_QPV.name]).toBe("");
    });
  });

  it("should handle mixed valid and invalid records", () => {
    mockRecords = [
      {
        id: 1,
        [COLUMN_MAPPING_NAMES.LATITUDE.name]: "48.8571",
        [COLUMN_MAPPING_NAMES.LONGITUDE.name]: "2.3527",
      } as RowRecord,
      {
        id: 2,
        [COLUMN_MAPPING_NAMES.LATITUDE.name]: "invalid_lat",
        [COLUMN_MAPPING_NAMES.LONGITUDE.name]: "invalid_lon",
      } as RowRecord,
      {
        id: 3,
        [COLUMN_MAPPING_NAMES.LATITUDE.name]: "48.9",
        [COLUMN_MAPPING_NAMES.LONGITUDE.name]: "2.4",
      } as RowRecord,
    ];

    mockGrist.mapColumnNames
      .mockReturnValueOnce({
        [COLUMN_MAPPING_NAMES.LATITUDE.name]: "48.8571",
        [COLUMN_MAPPING_NAMES.LONGITUDE.name]: "2.3527",
      })
      .mockReturnValueOnce({
        [COLUMN_MAPPING_NAMES.LATITUDE.name]: "invalid_lat",
        [COLUMN_MAPPING_NAMES.LONGITUDE.name]: "invalid_lon",
      })
      .mockReturnValueOnce({
        [COLUMN_MAPPING_NAMES.LATITUDE.name]: "48.9",
        [COLUMN_MAPPING_NAMES.LONGITUDE.name]: "2.4",
      });

    checkIfRecordsCoordinatesAreInQpv(
      mockRecords,
      mockQPVData,
      mockUpdates,
      mockStats,
    );

    expect(mockStats.validCount).toBe(2);
    expect(mockStats.qpvCount).toBe(1);
    expect(mockStats.invalidCount).toBe(1);

    expect(mockUpdates).toHaveLength(3);

    // Vérifier le record valide dans QPV
    expect(mockUpdates[0]).toEqual({
      id: 1,
      fields: {
        [COLUMN_MAPPING_NAMES.EST_QPV.name]: true,
        [COLUMN_MAPPING_NAMES.NOM_QPV.name]: "Quartier Test Paris",
        [COLUMN_MAPPING_NAMES.CODE_QPV.name]: "QP075001",
      },
    });

    // Vérifier le record invalide
    expect(mockUpdates[1]).toEqual({
      id: 2,
      fields: {
        [COLUMN_MAPPING_NAMES.EST_QPV.name]: "Coordonnées invalides",
        [COLUMN_MAPPING_NAMES.NOM_QPV.name]: "",
        [COLUMN_MAPPING_NAMES.CODE_QPV.name]: "",
      },
    });

    // Vérifier le record valide hors QPV
    expect(mockUpdates[2]).toEqual({
      id: 3,
      fields: {
        [COLUMN_MAPPING_NAMES.EST_QPV.name]: false,
        [COLUMN_MAPPING_NAMES.NOM_QPV.name]: "",
        [COLUMN_MAPPING_NAMES.CODE_QPV.name]: "",
      },
    });
  });

  it("should handle empty records array", () => {
    mockRecords = [];

    checkIfRecordsCoordinatesAreInQpv(
      mockRecords,
      mockQPVData,
      mockUpdates,
      mockStats,
    );

    expect(mockStats.validCount).toBe(0);
    expect(mockStats.qpvCount).toBe(0);
    expect(mockStats.invalidCount).toBe(0);
    expect(mockUpdates).toHaveLength(0);
  });
});
