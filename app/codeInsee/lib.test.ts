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
  maille: "COM",
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
  maille: "COM",
};
const recordGivingFewResults = {
  id: 1,
  code_insee: "",
  collectivite: "Saint-Martin",
  departement: null,
  lib_groupement: null,
  maille: "COM",
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
    await callInseeCodeApi("foo bar", "COM", "92");
    expect(fetchMock.mock.lastCall![0]).toBe(
      "https://geo.api.gouv.fr/communes?nom=foo+bar&fields=departement&codeDepartement=92",
    );
  });
  
  it("should call fetch with the geo.api.gouv.fr API for epcis", async () => {
    // api response
    fetchMock.mockResponse(JSON.stringify([]));
    await callInseeCodeApi("foo bar", "CA", "92");
    expect(fetchMock.mock.lastCall![0]).toBe(
      "https://geo.api.gouv.fr/epcis?nom=foo+bar&fields=departement&codeDepartement=92",
    );
  });
  
  it("should call fetch with the geo.api.gouv.fr API for départements", async () => {
    // api response
    fetchMock.mockResponse(JSON.stringify([]));
    await callInseeCodeApi("Yvelines", "DEP");
    expect(fetchMock.mock.lastCall![0]).toBe(
      "https://geo.api.gouv.fr/departements?nom=Yvelines",
    );
  });
  
  it("should call fetch with the geo.api.gouv.fr API for régions", async () => {
    // api response
    fetchMock.mockResponse(JSON.stringify([]));
    await callInseeCodeApi("Hauts-de-France", "REG");
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
        siren_groupement: "44420",
        maille: "COM",
        code_insee: "44211",
        insee_dep: "44",
        score: 1.0,
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
        siren_groupement: "54450",
        maille: "COM",
        code_insee: "54480",
        insee_dep: "54",
        score: 1.0,
      },
      {
        lib_groupement: "Saint-Martin",
        siren_groupement: "32300",
        maille: "COM",
        code_insee: "32389",
        insee_dep: "32",
        score: 1.0,
      },
      {
        lib_groupement: "Saint-Martin",
        siren_groupement: "67290",
        maille: "COM",
        code_insee: "67426",
        insee_dep: "67",
        score: 1.0,
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
            siren_groupement: "215404807",
            maille: "COM",
            code_insee: "54480",
            insee_dep: "54",
            score: 1.0,
          },
          {
            lib_groupement: "Saint-Martin",
            siren_groupement: "213203896",
            maille: "COM",
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
            maille: "COM",
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
            maille: "COM",
            code_insee: "92050",
            insee_dep: "92",
            score: 1.0,
          },
          {
            lib_groupement: "SIVOM de Nanteuil-le-Haudouin",
            siren_groupement: "246000046",
            maille: "SIVOM",
            code_insee: "",
            insee_dep: "",
            score: 0.5703327922077922,
          },
          {
            lib_groupement: "SIVOM du canton de Frontignan",
            siren_groupement: "243400058",
            maille: "SIVOM",
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
            maille: "COM",
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
              maille: "COM",
              code_insee: "54480",
              insee_dep: "54",
              score: 1.0,
            },
            {
              lib_groupement: "Saint-Martin",
              siren_groupement: "213203896",
              maille: "COM",
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
              maille: "COM",
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
          maille: "COM",
          code_insee: "44211",
          insee_dep: "44",
          score: 1.0,
        },
        4: {
          recordId: 4,
          sourceData: "Nanterre",
          lib_groupement: "Nanterre",
          siren_groupement: "219200508",
          maille: "COM",
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
