import fetchMock from "jest-fetch-mock";
import {
  areTooCloseResults,
  callInseeCodeApi,
  getInseeCodeResults,
  isDoubtfulResults,
} from "./lib";
import { NO_DATA_MESSAGES } from "./constants";
import { MESSAGES, cleanAndSortRecords } from "../../lib/cleanData/utils";

fetchMock.enableMocks();
fetchMock.dontMock();

// Mapped records utils
const recordNoResult = {
  id: 66,
  code_insee: "",
  collectivite: "zzzzzzzzzzzzz",
  departement: null,
  lib_groupement: null,
  maille: "commune",
};
const recordNoSourceCode = {
  id: 67,
  code_insee: "",
  collectivite: "",
  departement: null,
  lib_groupement: null,
  maille: null,
};
const recordWithDestinationFilledIn = {
  id: 68,
  code_insee: "44211",
  collectivite: "La Turballe",
  departement: "44",
  lib_groupement: "La Turballe",
  maille: "commune",
};
const recordGivingFewResults = {
  id: 1,
  code_insee: "",
  collectivite: "Saint-Martin",
  departement: null,
  lib_groupement: null,
  maille: "commune",
};
const mappings = {
  code_insee: "code_insee",
  collectivite: "collectivite",
  departement: "departement",
  lib_groupement: "lib_groupement",
  maille: "maille",
};

describe("callInseeCodeApi", () => {
  beforeEach(() => {
    fetchMock.doMock();
  });
  afterEach(() => {
    jest.restoreAllMocks();
    fetchMock.resetMocks();
    fetchMock.dontMock();
  });
  it("should call fetch with the geo.api.gouv.fr API for communes", async () => {
    // api response
    fetchMock.mockResponse(JSON.stringify([]));
    await callInseeCodeApi("foo bar", "commune", "92");
    expect(fetchMock.mock.lastCall![0]).toBe(
      "https://geo.api.gouv.fr/communes?nom=foo+bar&fields=departement&codeDepartement=92",
    );
  });
  
  it("should call fetch with the geo.api.gouv.fr API for epcis", async () => {
    // api response
    fetchMock.mockResponse(JSON.stringify([]));
    await callInseeCodeApi("foo bar", "epci", "92");
    expect(fetchMock.mock.lastCall![0]).toBe(
      "https://geo.api.gouv.fr/epcis?nom=foo+bar&fields=departement&codeDepartement=92",
    );
  });
  
  it("should call fetch with the geo.api.gouv.fr API for départements", async () => {
    // api response
    fetchMock.mockResponse(JSON.stringify([]));
    await callInseeCodeApi("Yvelines", "dep");
    expect(fetchMock.mock.lastCall![0]).toBe(
      "https://geo.api.gouv.fr/departements?nom=Yvelines",
    );
  });
  
  it("should call fetch with the geo.api.gouv.fr API for régions", async () => {
    // api response
    fetchMock.mockResponse(JSON.stringify([]));
    await callInseeCodeApi("Hauts-de-France", "reg");
    expect(fetchMock.mock.lastCall![0]).toBe(
      "https://geo.api.gouv.fr/regions?nom=Hauts-de-France",
    );
  });
});

describe("getInseeCodeResults", () => {
  beforeEach(() => {
    fetchMock.doMock();
  });
  afterEach(() => {
    jest.restoreAllMocks();
    fetchMock.resetMocks();
    fetchMock.dontMock();
  });

  it("if api return no result, should return NormalizedInseeResult with appropriate message", async () => {
    // api response
    fetchMock.mockResponse(JSON.stringify([]));
    const results = await getInseeCodeResults(recordNoResult, mappings, false, null);
    expect(results).toStrictEqual({
      recordId: recordNoResult.id,
      sourceData: recordNoResult.collectivite,
      results: [],
      noResultMessage: NO_DATA_MESSAGES.NO_RESULT,
      toIgnore: false,
    });
  });
  it("if no source data, should return NormalizedInseeResult with appropriate message", async () => {
    const results = await getInseeCodeResults(
      recordNoSourceCode,
      mappings,
      false,
      null,
    );
    expect(results).toStrictEqual({
      recordId: recordNoSourceCode.id,
      sourceData: recordNoSourceCode.collectivite,
      results: [],
      noResultMessage: NO_DATA_MESSAGES.NO_SOURCE_DATA,
      toIgnore: false,
    });
  });
  it("if destination already filled in and check it, should return NormalizedInseeResult with appropriate message", async () => {
    const results = await getInseeCodeResults(
      recordWithDestinationFilledIn,
      mappings,
      true,
      null,
    );
    expect(results).toStrictEqual({
      recordId: recordWithDestinationFilledIn.id,
      sourceData: "",
      results: [],
      noResultMessage: undefined,
      toIgnore: true,
    });
  });
  it("if destination already filled in and dont check it, should return NormalizedInseeResult without specific message and results", async () => {
    const geoApiResponse = [
      {
        nom: "La Turballe",
        code: "44211",
        codeDepartement: "44",
        codesPostaux: ["44420"],
        departement: { code: "44" },
      },
    ];
    const expectedResultArray = [
      {
        lib_groupement: "La Turballe",
        maille: "commune",
        code: "44211",
        insee_dep: "44",
        score: undefined,
      },
    ];
    fetchMock.mockResponse(JSON.stringify(geoApiResponse));
    const results = await getInseeCodeResults(
      recordWithDestinationFilledIn,
      mappings,
      false,
      null,
    );
    expect(results).toStrictEqual({
      recordId: recordWithDestinationFilledIn.id,
      sourceData: recordWithDestinationFilledIn.collectivite,
      results: expectedResultArray,
      noResultMessage: undefined,
      toIgnore: false,
    });
  });
  it("if record has bad shape", async () => {
    // TODO
  });
  it("if all good, should return NormalizedInseeResult without specific message and results", async () => {
    const geoApiResponse = [
      {
        nom: "Saint-Martin",
        code: "54480",
        codeDepartement: "54",
        codesPostaux: ["54450"],
        departement: { code: "54" },
      },
      {
        nom: "Saint-Martin",
        code: "32389",
        codeDepartement: "32",
        codesPostaux: ["32300"],
        departement: { code: "32" },
      },
      {
        nom: "Saint-Martin",
        code: "67426",
        codeDepartement: "67",
        codesPostaux: ["67290"],
        departement: { code: "67" },
      },
    ];
    const expectedResultArray = [
      {
        lib_groupement: "Saint-Martin",
        maille: "commune",
        code: "54480",
        insee_dep: "54",
        score: undefined,
      },
      {
        lib_groupement: "Saint-Martin",
        maille: "commune",
        code: "32389",
        insee_dep: "32",
        score: undefined,
      },
      {
        lib_groupement: "Saint-Martin",
        maille: "commune",
        code: "67426",
        insee_dep: "67",
        score: undefined,
      },
    ];
    fetchMock.mockResponse(JSON.stringify(geoApiResponse));
    const results = await getInseeCodeResults(
      recordGivingFewResults,
      mappings,
      true,
      null,
    );
    expect(results).toStrictEqual({
      recordId: recordGivingFewResults.id,
      sourceData: recordGivingFewResults.collectivite,
      results: expectedResultArray,
      noResultMessage: undefined,
      toIgnore: false,
    });
  });
});

describe("cleanAndSortRecords", () => {
  it("if parameter is empty", async () => {
    expect(
      cleanAndSortRecords([], isDoubtfulResults, areTooCloseResults),
    ).toStrictEqual({
      dirty: {},
      clean: {},
      noResult: {},
    });
  });
  it("if all is good, should split clean, dirty and noResult results correctly", async () => {
    const recordsUncleanedData = [
      {
        // No result data
        recordId: 1,
        sourceData: "zzzzzzzzzzzz",
        results: [],
        noResultMessage: NO_DATA_MESSAGES.NO_RESULT,
        toIgnore: false,
      },
      {
        // Several result without clear best score
        recordId: 2,
        sourceData: "Saint-Martin",
        results: [
          {
            lib_groupement: "Saint-Martin",
            maille: "commune",
            code: "54480",
            insee_dep: "54",
            score: 1.0,
          },
          {
            lib_groupement: "Saint-Martin",
            maille: "commune",
            code: "32389",
            insee_dep: "32",
            score: 1.0,
          },
        ],
        noResultMessage: undefined,
        toIgnore: false,
      },
      {
        // Only one result
        recordId: 3,
        sourceData: "La Turballe",
        results: [
          {
            lib_groupement: "La Turballe",
            maille: "commune",
            code: "44211",
            insee_dep: "44",
            score: 1.0,
          },
        ],
        noResultMessage: undefined,
        toIgnore: false,
      },
      {
        // Single result with low but acceptable score (> 0.1)
        recordId: 4,
        sourceData: "foobar",
        results: [
          {
            lib_groupement: "L\u00e9obard",
            maille: "commune",
            code: "46169",
            insee_dep: "46",
            score: 0.336,
          },
        ],
        noResultMessage: undefined,
        toIgnore: false,
      },
      {
        // Several results - will be marked as dirty due to multiple results
        recordId: 5,
        sourceData: "Nanterre",
        results: [
          {
            lib_groupement: "Nanterre",
            maille: "commune",
            code: "92050",
            insee_dep: "92",
            score: 1.0,
          },
          {
            lib_groupement: "SIVOM de Nanteuil-le-Haudouin",
            maille: "epci",
            code: "",
            insee_dep: "",
            score: 0.5703327922077922,
          },
          {
            lib_groupement: "SIVOM du canton de Frontignan",
            maille: "epci",
            code: "",
            insee_dep: "",
            score: 0.4739488636363636,
          },
        ],
        toIgnore: false,
      },
    ];
    expect(
      cleanAndSortRecords(
        recordsUncleanedData,
        isDoubtfulResults,
        areTooCloseResults,
      ),
    ).toStrictEqual({
      dirty: {
        2: {
          recordId: 2,
          sourceData: "Saint-Martin",
          results: [
            {
              lib_groupement: "Saint-Martin",
              maille: "commune",
              code: "54480",
              insee_dep: "54",
              score: 1.0,
            },
            {
              lib_groupement: "Saint-Martin",
              maille: "commune",
              code: "32389",
              insee_dep: "32",
              score: 1.0,
            },
          ],
          noResultMessage: undefined,
          dirtyMessage: MESSAGES.TOO_CLOSE_RESULT,
          toIgnore: false,
        },
        5: {
          recordId: 5,
          sourceData: "Nanterre",
          results: [
            {
              lib_groupement: "Nanterre",
              maille: "commune",
              code: "92050",
              insee_dep: "92",
              score: 1.0,
            },
            {
              lib_groupement: "SIVOM de Nanteuil-le-Haudouin",
              maille: "epci",
              code: "",
              insee_dep: "",
              score: 0.5703327922077922,
            },
            {
              lib_groupement: "SIVOM du canton de Frontignan",
              maille: "epci",
              code: "",
              insee_dep: "",
              score: 0.4739488636363636,
            },
          ],
          dirtyMessage: MESSAGES.TOO_CLOSE_RESULT,
          toIgnore: false,
        },
      },
      clean: {
        3: {
          recordId: 3,
          sourceData: "La Turballe",
          lib_groupement: "La Turballe",
          maille: "commune",
          code: "44211",
          insee_dep: "44",
          score: 1.0,
        },
        4: {
          recordId: 4,
          sourceData: "foobar",
          lib_groupement: "L\u00e9obard",
          maille: "commune",
          code: "46169",
          insee_dep: "46",
          score: 0.336,
        },
      },
      noResult: {
        1: {
          recordId: 1,
          noResultMessage: NO_DATA_MESSAGES.NO_RESULT,
        },
      },
    });
  });
  it("if paramenter bad shape", async () => {
    // TODO
  });
});
