import { COLUMN_MAPPING_NAMES, ERROR_DATA_MESSAGE } from "./constants";
import { Stats } from "./types";
import { RowRecord } from "grist/GristData";

// Mock jest-fetch-mock
import fetchMock from "jest-fetch-mock";

fetchMock.enableMocks();
fetchMock.dontMock();

// Mock graphql-request
jest.mock("graphql-request", () => ({
  request: jest.fn(),
  gql: jest.fn((strings: TemplateStringsArray, ...values: unknown[]) => {
    // Reconstruit la string en intercalant les parties statiques et les valeurs interpolées
    let result = "";
    strings.forEach((str, i) => {
      result += str;
      if (i < values.length) {
        result += values[i];
      }
    });
    return result;
  }),
}));

import { generateQuery } from "./lib/generateQuery";

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

const recordWithRegionMaille: RowRecord = {
  id: 8,
  [COLUMN_MAPPING_NAMES.CODE_INSEE.name]: "11",
  [COLUMN_MAPPING_NAMES.MAILLE.name]: "region",
  [COLUMN_MAPPING_NAMES.VALEUR_INDICATEUR.name]: null,
};

describe("generateQuery", () => {
  let stats: Stats;

  beforeEach(() => {
    stats = {
      toUpdateCount: 0,
      updatedCount: 0,
      invalidCount: 0,
    };
  });

  describe("Valid records and query generation", () => {
    it("should generate valid GraphQL query for commune with INSEE code", () => {
      const records = [validRecord];
      const result = generateQuery(records, false, stats);

      expect(result.errors).toHaveLength(0);
      expect(result.query).toContain("query IndicateurCountQuery");
      expect(result.query).toContain('recordId_1: commune (code: "75001")');
      expect(result.query).toContain("... on IndicateurOneValue");
      expect(result.query).toContain("... on IndicateurListe");
      expect(result.query).toContain("... on IndicateurRow");
      expect(result.query).toContain("... on IndicateurRows");
      expect(result.query).toContain("... on IndicateurListeGeo");
      expect(stats.toUpdateCount).toBe(1);
      expect(stats.invalidCount).toBe(0);
    });

    it("should generate valid GraphQL query for region with INSEE code", () => {
      const records = [recordWithRegionMaille];
      const result = generateQuery(records, false, stats);

      expect(result.errors).toHaveLength(0);
      expect(result.query).toContain('recordId_8: region (code: "11")');
      expect(result.query).toContain("... on IndicateurOneValue");
      expect(stats.toUpdateCount).toBe(1);
      expect(stats.invalidCount).toBe(0);
    });

    it("should generate valid GraphQL query for pays without INSEE code", () => {
      const records = [recordWithPaysMailleAndEmptyInsee];
      const result = generateQuery(records, false, stats);

      expect(result.errors).toHaveLength(0);
      expect(result.query).toContain("recordId_7: pays");
      expect(result.query).not.toContain("(code:");
      expect(result.query).toContain("... on IndicateurOneValue");
      expect(stats.toUpdateCount).toBe(1);
      expect(stats.invalidCount).toBe(0);
    });

    it("should generate query with multiple valid records", () => {
      const records = [
        validRecord,
        recordWithRegionMaille,
        recordWithPaysMailleAndEmptyInsee,
      ];
      const result = generateQuery(records, false, stats);

      expect(result.errors).toHaveLength(0);
      expect(result.query).toContain('recordId_1: commune (code: "75001")');
      expect(result.query).toContain('recordId_8: region (code: "11")');
      expect(result.query).toContain("recordId_7: pays");
      expect(stats.toUpdateCount).toBe(3);
      expect(stats.invalidCount).toBe(0);
    });

    it("should include all indicator types in query fragment", () => {
      const records = [validRecord];
      const result = generateQuery(records, false, stats);

      expect(result.query).toContain("__typename");
      expect(result.query).toContain("valeur");
      expect(result.query).toContain("count");
      expect(result.query).toContain("liste");
      expect(result.query).toContain("row");
      expect(result.query).toContain("rows");
      expect(result.query).toContain("properties");
    });
  });

  describe("Invalid records and error handling", () => {
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

    it("should handle invalid INSEE code", () => {
      const records = [recordWithInvalidInseeCode];
      const result = generateQuery(records, false, stats);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        recordId: 3,
        error: ERROR_DATA_MESSAGE.CODE_INSEE_INVALIDE,
      });
      expect(stats.toUpdateCount).toBe(0);
      expect(stats.invalidCount).toBe(1);
    });

    it("should return empty query when no valid records", () => {
      const records = [recordWithInvalidInseeCode];
      const result = generateQuery(records, false, stats);

      expect(result.query).toBe("");
      expect(result.errors).toHaveLength(1);
    });

    it("should handle empty INSEE code for non-pays maille", () => {
      const records = [recordWithEmptyInseeCode];
      const result = generateQuery(records, false, stats);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        recordId: 4,
        error: ERROR_DATA_MESSAGE.CODE_INSEE_VIDE,
      });
      expect(result.query).toBe("");
      expect(stats.toUpdateCount).toBe(0);
      expect(stats.invalidCount).toBe(1);
    });

    it("should handle invalid maille", () => {
      const records = [recordWithInvalidMaille];
      const result = generateQuery(records, false, stats);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        recordId: 5,
        error: ERROR_DATA_MESSAGE.MAILLE_INVALIDE,
      });
      expect(result.query).toBe("");
      expect(stats.toUpdateCount).toBe(0);
      expect(stats.invalidCount).toBe(1);
    });

    it("should handle empty maille", () => {
      const records = [recordWithEmptyMaille];
      const result = generateQuery(records, false, stats);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        recordId: 6,
        error: ERROR_DATA_MESSAGE.MAILLE_VIDE,
      });
      expect(result.query).toBe("");
      expect(stats.toUpdateCount).toBe(0);
      expect(stats.invalidCount).toBe(1);
    });

    it("should handle mixed valid and invalid records", () => {
      const records = [
        validRecord,
        recordWithInvalidInseeCode,
        recordWithFilledDestination,
        recordWithEmptyMaille,
      ];
      const result = generateQuery(records, false, stats);

      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toEqual({
        recordId: 3,
        error: ERROR_DATA_MESSAGE.CODE_INSEE_INVALIDE,
      });
      expect(result.errors[1]).toEqual({
        recordId: 6,
        error: ERROR_DATA_MESSAGE.MAILLE_VIDE,
      });
      expect(result.query).toContain('recordId_1: commune (code: "75001")');
      expect(result.query).toContain('recordId_2: commune (code: "75002")');
      expect(result.query).not.toContain("recordId_3");
      expect(result.query).not.toContain("recordId_6");
      expect(stats.toUpdateCount).toBe(2);
      expect(stats.invalidCount).toBe(2);
    });
  });

  describe("checkDestinationIsEmpty parameter", () => {
    it("should process all records when checkDestinationIsEmpty is false", () => {
      const records = [validRecord, recordWithFilledDestination];
      const result = generateQuery(records, false, stats);

      expect(result.errors).toHaveLength(0);
      expect(result.query).toContain('recordId_1: commune (code: "75001")');
      expect(result.query).toContain('recordId_2: commune (code: "75002")');
      expect(stats.toUpdateCount).toBe(2);
      expect(stats.invalidCount).toBe(0);
    });

    it("should skip records with filled destination when checkDestinationIsEmpty is true", () => {
      const records = [validRecord, recordWithFilledDestination];
      const result = generateQuery(records, true, stats);

      expect(result.errors).toHaveLength(0);
      expect(result.query).toContain('recordId_1: commune (code: "75001")');
      expect(result.query).not.toContain("recordId_2");
      expect(stats.toUpdateCount).toBe(1);
      expect(stats.invalidCount).toBe(0);
    });

    it("should still validate skipped records when checkDestinationIsEmpty is true", () => {
      const recordWithFilledDestinationButInvalid: RowRecord = {
        id: 9,
        [COLUMN_MAPPING_NAMES.CODE_INSEE.name]: "",
        [COLUMN_MAPPING_NAMES.MAILLE.name]: "commune",
        [COLUMN_MAPPING_NAMES.VALEUR_INDICATEUR.name]: 42,
      };
      const records = [validRecord, recordWithFilledDestinationButInvalid];
      const result = generateQuery(records, true, stats);

      expect(result.errors).toHaveLength(0);
      expect(result.query).toContain('recordId_1: commune (code: "75001")');
      expect(result.query).not.toContain("recordId_9");
      expect(stats.toUpdateCount).toBe(1);
      expect(stats.invalidCount).toBe(0);
    });
  });
});
