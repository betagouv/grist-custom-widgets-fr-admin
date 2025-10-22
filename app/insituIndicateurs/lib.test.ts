import {
  getInsituIndicateursResultsForRecords,
  getQueryFragmentForRecord,
  generateQuery,
  generateQueryFragmentByTerritoire,
} from "./lib";
import { COLUMN_MAPPING_NAMES, ERROR_DATA_MESSAGE } from "./constants";
import { MailleLabelEnum, Stats } from "./types";
import { RowRecord } from "grist/GristData";

// Mock jest-fetch-mock
import fetchMock from "jest-fetch-mock";

fetchMock.enableMocks();
fetchMock.dontMock();

// Mock graphql-request
jest.mock("graphql-request", () => ({
  request: jest.fn(),
  gql: jest.fn((query: string) => query),
}));

import { request } from "graphql-request";
const mockRequest = request as jest.MockedFunction<typeof request>;

// Mock grist global object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).grist = {
  mapColumnNames: (record: RowRecord) => ({
    id: record.id,
    [COLUMN_MAPPING_NAMES.CODE_INSEE.name]:
      record[COLUMN_MAPPING_NAMES.CODE_INSEE.name],
    [COLUMN_MAPPING_NAMES.MAILLE.name]:
      record[COLUMN_MAPPING_NAMES.MAILLE.name],
    [COLUMN_MAPPING_NAMES.VALEUR_INDICATEUR.name]:
      record[COLUMN_MAPPING_NAMES.VALEUR_INDICATEUR.name],
  }),
};

// Test data
const validRecord: RowRecord = {
  id: 1,
  [COLUMN_MAPPING_NAMES.CODE_INSEE.name]: "75001",
  [COLUMN_MAPPING_NAMES.MAILLE.name]: "commune",
  [COLUMN_MAPPING_NAMES.VALEUR_INDICATEUR.name]: null,
};

const recordWithFilledDestination: RowRecord = {
  id: 2,
  [COLUMN_MAPPING_NAMES.CODE_INSEE.name]: "75002",
  [COLUMN_MAPPING_NAMES.MAILLE.name]: "commune",
  [COLUMN_MAPPING_NAMES.VALEUR_INDICATEUR.name]: 42,
};

const recordWithInvalidInseeCode: RowRecord = {
  id: 3,
  [COLUMN_MAPPING_NAMES.CODE_INSEE.name]: "invalid-code!",
  [COLUMN_MAPPING_NAMES.MAILLE.name]: "commune",
  [COLUMN_MAPPING_NAMES.VALEUR_INDICATEUR.name]: null,
};

const recordWithEmptyInseeCode: RowRecord = {
  id: 4,
  [COLUMN_MAPPING_NAMES.CODE_INSEE.name]: "",
  [COLUMN_MAPPING_NAMES.MAILLE.name]: "commune",
  [COLUMN_MAPPING_NAMES.VALEUR_INDICATEUR.name]: null,
};

const recordWithInvalidMaille: RowRecord = {
  id: 5,
  [COLUMN_MAPPING_NAMES.CODE_INSEE.name]: "75003",
  [COLUMN_MAPPING_NAMES.MAILLE.name]: "invalid-maille",
  [COLUMN_MAPPING_NAMES.VALEUR_INDICATEUR.name]: null,
};

const recordWithEmptyMaille: RowRecord = {
  id: 6,
  [COLUMN_MAPPING_NAMES.CODE_INSEE.name]: "75004",
  [COLUMN_MAPPING_NAMES.MAILLE.name]: "",
  [COLUMN_MAPPING_NAMES.VALEUR_INDICATEUR.name]: null,
};

const recordWithPaysMailleAndEmptyInsee: RowRecord = {
  id: 7,
  [COLUMN_MAPPING_NAMES.CODE_INSEE.name]: "",
  [COLUMN_MAPPING_NAMES.MAILLE.name]: "pays",
  [COLUMN_MAPPING_NAMES.VALEUR_INDICATEUR.name]: null,
};

const mockApiResponse = {
  indicateurs: [
    {
      metadata: {
        identifiant: "test-indicator",
        nom: "Test Indicator",
        description: "A test indicator",
        unite: "unit",
        mailles: ["commune"],
        returnType: "IndicateurOneValue",
      },
      mailles: {
        recordId_1: {
          __typename: "IndicateurOneValue",
          valeur: 123,
        },
      },
    },
  ],
};

describe("generateQueryFragmentByTerritoire", () => {
  it("should generate correct query fragment for commune with INSEE code", () => {
    const result = generateQueryFragmentByTerritoire(
      MailleLabelEnum.Com,
      "75001",
      1,
    );
    expect(result).toContain('recordId_1: commune (code: "75001")');
    expect(result).toContain("... on IndicateurOneValue");
    expect(result).toContain("... on IndicateurListe");
    expect(result).toContain("... on IndicateurRow");
    expect(result).toContain("... on IndicateurRows");
    expect(result).toContain("... on IndicateurListeGeo");
  });

  it("should generate correct query fragment for pays without INSEE code", () => {
    const result = generateQueryFragmentByTerritoire(
      MailleLabelEnum.Pays,
      "",
      2,
    );
    expect(result).toContain("recordId_2: pays");
    expect(result).not.toContain("(code:");
  });

  it("should generate correct query fragment for region with INSEE code", () => {
    const result = generateQueryFragmentByTerritoire(
      MailleLabelEnum.Reg,
      "11",
      3,
    );
    expect(result).toContain('recordId_3: region (code: "11")');
  });
});

describe("getQueryFragmentForRecord", () => {
  it("should return valid query for valid record", () => {
    const mappedRecord = grist.mapColumnNames(validRecord);
    const result = getQueryFragmentForRecord(mappedRecord, false);

    expect(result.error).toBe("");
    expect(result.query).toContain('recordId_1: commune (code: "75001")');
  });

  it("should return error for invalid INSEE code", () => {
    const mappedRecord = grist.mapColumnNames(recordWithInvalidInseeCode);
    const result = getQueryFragmentForRecord(mappedRecord, false);

    expect(result.error).toBe(ERROR_DATA_MESSAGE.CODE_INSEE_INVALIDE);
    expect(result.query).toBe("");
  });

  it("should return error for empty INSEE code (non-pays maille)", () => {
    const mappedRecord = grist.mapColumnNames(recordWithEmptyInseeCode);
    const result = getQueryFragmentForRecord(mappedRecord, false);

    expect(result.error).toBe(ERROR_DATA_MESSAGE.CODE_INSEE_VIDE);
    expect(result.query).toBe("");
  });

  it("should return error for invalid maille", () => {
    const mappedRecord = grist.mapColumnNames(recordWithInvalidMaille);
    const result = getQueryFragmentForRecord(mappedRecord, false);

    expect(result.error).toBe(ERROR_DATA_MESSAGE.MAILLE_INVALIDE);
    expect(result.query).toBe("");
  });

  it("should return error for empty maille", () => {
    const mappedRecord = grist.mapColumnNames(recordWithEmptyMaille);
    const result = getQueryFragmentForRecord(mappedRecord, false);

    expect(result.error).toBe(ERROR_DATA_MESSAGE.MAILLE_VIDE);
    expect(result.query).toBe("");
  });

  it("should return valid query for pays maille with empty INSEE code", () => {
    const mappedRecord = grist.mapColumnNames(
      recordWithPaysMailleAndEmptyInsee,
    );
    const result = getQueryFragmentForRecord(mappedRecord, false);

    expect(result.error).toBe("");
    expect(result.query).toContain("recordId_7: pays");
    expect(result.query).not.toContain("(code:");
  });

  it("should skip record when destination is filled and checkDestinationIsEmpty is true", () => {
    const mappedRecord = grist.mapColumnNames(recordWithFilledDestination);
    const result = getQueryFragmentForRecord(mappedRecord, true);

    expect(result.error).toBe("");
    expect(result.query).toBe("");
  });

  it("should process record when destination is filled and checkDestinationIsEmpty is false", () => {
    const mappedRecord = grist.mapColumnNames(recordWithFilledDestination);
    const result = getQueryFragmentForRecord(mappedRecord, false);

    expect(result.error).toBe("");
    expect(result.query).toContain('recordId_2: commune (code: "75002")');
  });
});

describe("generateQuery", () => {
  let stats: Stats;

  beforeEach(() => {
    stats = {
      toUpdateCount: 0,
      updatedCount: 0,
      invalidCount: 0,
    };
  });

  it("should generate valid GraphQL query for valid records", () => {
    const records = [validRecord];
    const result = generateQuery(records, false, stats);

    expect(result.errors).toHaveLength(0);
    expect(stats.toUpdateCount).toBe(1);
    expect(stats.invalidCount).toBe(0);
  });

  it("should return empty query when no valid records", () => {
    const records = [recordWithInvalidInseeCode];
    const result = generateQuery(records, false, stats);

    expect(result.query).toBe("");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({
      recordId: 3,
      error: ERROR_DATA_MESSAGE.CODE_INSEE_INVALIDE,
    });
    expect(stats.toUpdateCount).toBe(0);
    expect(stats.invalidCount).toBe(1);
  });

  it("should handle mixed valid and invalid records", () => {
    const records = [
      validRecord,
      recordWithInvalidInseeCode,
      recordWithFilledDestination,
    ];
    const result = generateQuery(records, false, stats);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({
      recordId: 3,
      error: ERROR_DATA_MESSAGE.CODE_INSEE_INVALIDE,
    });
    expect(stats.toUpdateCount).toBe(2);
    expect(stats.invalidCount).toBe(1);
  });

  it("should skip records with filled destination when checkDestinationIsEmpty is true", () => {
    const records = [validRecord, recordWithFilledDestination];
    const result = generateQuery(records, true, stats);

    expect(result.errors).toHaveLength(0);
    expect(stats.toUpdateCount).toBe(1);
    expect(stats.invalidCount).toBe(0);
  });
});

describe("getInsituIndicateursResultsForRecords", () => {
  beforeEach(() => {
    mockRequest.mockClear();
  });

  it("should call callback with data when API call succeeds", async () => {
    mockRequest.mockResolvedValue(mockApiResponse);
    const callback = jest.fn();
    const stats: Stats = { toUpdateCount: 0, updatedCount: 0, invalidCount: 0 };

    await getInsituIndicateursResultsForRecords(
      "test-indicator",
      [validRecord],
      callback,
      false,
      stats,
    );

    expect(callback).toHaveBeenCalledWith(
      mockApiResponse.indicateurs[0],
      null,
      [],
    );
  });

  it("should call callback with error when API call fails", async () => {
    mockRequest.mockRejectedValue(new Error("API Error"));
    const callback = jest.fn();
    const stats: Stats = { toUpdateCount: 0, updatedCount: 0, invalidCount: 0 };

    await getInsituIndicateursResultsForRecords(
      "test-indicator",
      [validRecord],
      callback,
      false,
      stats,
    );

    expect(callback).toHaveBeenCalledWith(null, "API Error...", null);
  });

  it("should call callback with errors when no valid records", async () => {
    const callback = jest.fn();
    const stats: Stats = { toUpdateCount: 0, updatedCount: 0, invalidCount: 0 };

    await getInsituIndicateursResultsForRecords(
      "test-indicator",
      [recordWithInvalidInseeCode],
      callback,
      false,
      stats,
    );

    expect(callback).toHaveBeenCalledWith(null, null, [
      { recordId: 3, error: ERROR_DATA_MESSAGE.CODE_INSEE_INVALIDE },
    ]);
  });

  it("should call callback with error when identifiant is not a string", async () => {
    const callback = jest.fn();
    const stats: Stats = { toUpdateCount: 0, updatedCount: 0, invalidCount: 0 };

    await getInsituIndicateursResultsForRecords(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      123 as any,
      [validRecord],
      callback,
      false,
      stats,
    );

    expect(callback).toHaveBeenCalledWith(
      null,
      "L'identifiant de la colonne n'est pas compréhensible, ce doit être l'identifiant le l'indicateur insitu",
      null,
    );
  });
});
