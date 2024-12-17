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
  nature_juridique: null,
};
const recordNoSourceCode = {
  id: 67,
  code_insee: "",
  collectivite: "",
  departement: null,
  lib_groupement: null,
  nature_juridique: null,
};
const recordWithDestinationFilledIn = {
  id: 68,
  code_insee: "44211",
  collectivite: "La Turballe",
  departement: "44",
  lib_groupement: "La Turballe",
  nature_juridique: "COM",
};
const recordGivingFewResults = {
  id: 1,
  code_insee: "",
  collectivite: "Saint-Martin",
  departement: null,
  lib_groupement: null,
  nature_juridique: null,
};
const mappings = {
  code_insee: "code_insee",
  collectivite: "collectivite",
  departement: "departement",
  lib_groupement: "lib_groupement",
  nature_juridique: "nature_juridique",
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
  it("should call fetch with the données&territoires addok API", async () => {
    // api response
    fetchMock.mockResponse(JSON.stringify({}));
    await callInseeCodeApi("foo bar", "92", "COM");
    expect(fetchMock.mock.lastCall![0]).toBe(
      "https://addok.donnees.incubateur.anct.gouv.fr/search?q=foo+bar&insee_dep=92&nature_juridique=COM",
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
    fetchMock.mockResponse(
      JSON.stringify({
        results: [],
        query: recordNoResult.collectivite,
        limit: 5,
      }),
    );
    const results = await getInseeCodeResults(recordNoResult, mappings, false);
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
    const resultArray = [
      {
        lib_groupement: "La Turballe",
        siren_groupement: "214402117",
        nature_juridique: "COM",
        code_insee: "44211",
        insee_dep: "44",
        score: 1.0,
      },
    ];
    fetchMock.mockResponse(
      JSON.stringify({
        results: resultArray,
        query: recordNoResult.collectivite,
        limit: 5,
      }),
    );
    const results = await getInseeCodeResults(
      recordWithDestinationFilledIn,
      mappings,
      false,
    );
    expect(results).toStrictEqual({
      recordId: recordWithDestinationFilledIn.id,
      sourceData: recordWithDestinationFilledIn.collectivite,
      results: resultArray,
      noResultMessage: undefined,
      toIgnore: false,
    });
  });
  it("if record has bad shape", async () => {
    // TODO
  });
  it("if all good, should return NormalizedInseeResult without specific message and results", async () => {
    const resultArray = [
      {
        lib_groupement: "Saint-Martin",
        siren_groupement: "215404807",
        nature_juridique: "COM",
        code_insee: "54480",
        insee_dep: "54",
        score: 1.0,
      },
      {
        lib_groupement: "Saint-Martin",
        siren_groupement: "213203896",
        nature_juridique: "COM",
        code_insee: "32389",
        insee_dep: "32",
        score: 1.0,
      },
      {
        lib_groupement: "Saint-Martin",
        siren_groupement: "216704262",
        nature_juridique: "COM",
        code_insee: "67426",
        insee_dep: "67",
        score: 1.0,
      },
    ];
    fetchMock.mockResponse(
      JSON.stringify({
        results: resultArray,
        query: recordNoResult.collectivite,
        limit: 5,
      }),
    );
    const results = await getInseeCodeResults(
      recordGivingFewResults,
      mappings,
      true,
    );
    expect(results).toStrictEqual({
      recordId: recordGivingFewResults.id,
      sourceData: recordGivingFewResults.collectivite,
      results: resultArray,
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
            siren_groupement: "215404807",
            nature_juridique: "COM",
            code_insee: "54480",
            insee_dep: "54",
            score: 1.0,
          },
          {
            lib_groupement: "Saint-Martin",
            siren_groupement: "213203896",
            nature_juridique: "COM",
            code_insee: "32389",
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
            siren_groupement: "214402117",
            nature_juridique: "COM",
            code_insee: "44211",
            insee_dep: "44",
            score: 1.0,
          },
        ],
        noResultMessage: undefined,
        toIgnore: false,
      },
      {
        // Several result but with best score
        recordId: 4,
        sourceData: "Nanterre",
        results: [
          {
            lib_groupement: "Nanterre",
            siren_groupement: "219200508",
            nature_juridique: "COM",
            code_insee: "92050",
            insee_dep: "92",
            score: 1.0,
          },
          {
            lib_groupement: "SIVOM de Nanteuil-le-Haudouin",
            siren_groupement: "246000046",
            nature_juridique: "SIVOM",
            code_insee: "",
            insee_dep: "",
            score: 0.5703327922077922,
          },
          {
            lib_groupement: "SIVOM du canton de Frontignan",
            siren_groupement: "243400058",
            nature_juridique: "SIVOM",
            code_insee: "",
            insee_dep: "",
            score: 0.4739488636363636,
          },
        ],
        toIgnore: false,
      },
      {
        // Several result without convincing score
        recordId: 5,
        sourceData: "foobar",
        results: [
          {
            lib_groupement: "L\u00e9obard",
            siren_groupement: "214601692",
            nature_juridique: "COM",
            code_insee: "46169",
            insee_dep: "46",
            score: 0.336,
          },
        ],
        noResultMessage: undefined,
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
              siren_groupement: "215404807",
              nature_juridique: "COM",
              code_insee: "54480",
              insee_dep: "54",
              score: 1.0,
            },
            {
              lib_groupement: "Saint-Martin",
              siren_groupement: "213203896",
              nature_juridique: "COM",
              code_insee: "32389",
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
          sourceData: "foobar",
          results: [
            {
              lib_groupement: "L\u00e9obard",
              siren_groupement: "214601692",
              nature_juridique: "COM",
              code_insee: "46169",
              insee_dep: "46",
              score: 0.336,
            },
          ],
          noResultMessage: undefined,
          dirtyMessage: MESSAGES.DOUBTFUL_RESULT,
          toIgnore: false,
        },
      },
      clean: {
        3: {
          recordId: 3,
          sourceData: "La Turballe",
          lib_groupement: "La Turballe",
          siren_groupement: "214402117",
          nature_juridique: "COM",
          code_insee: "44211",
          insee_dep: "44",
          score: 1.0,
        },
        4: {
          recordId: 4,
          sourceData: "Nanterre",
          lib_groupement: "Nanterre",
          siren_groupement: "219200508",
          nature_juridique: "COM",
          code_insee: "92050",
          insee_dep: "92",
          score: 1.0,
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
