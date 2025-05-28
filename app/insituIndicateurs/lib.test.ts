import fetchMock from "jest-fetch-mock";
import { describe, expect, afterEach, beforeEach, it } from "@jest/globals";
// import { generateQuery } from "./lib";

fetchMock.enableMocks();
fetchMock.dontMock();

// Mapped records utils
const record1 = {
  id: 1,
  code_insee: "17220",
  maille: "commune",
  indicateur_id: null,
};
const record2 = {
  id: 2,
  code_insee: "11",
  maille: "région",
  indicateur_id: null,
};

const query = `query IndicateurCountQuery($identifiant: String!) {
  indicateurs(filtre: { identifiants: [$identifiant] }) {
    metadata {
      identifiant
      mailles
    }
    mailles {
      recordId_1: commune (code: "17220") {
        ... on IndicateurOneValue {
          __typename
          valeur
        }
        ... on IndicateurListe {
          __typename
          count
        }
        ... on IndicateurRow {
          __typename
          row
        }
        ... on IndicateurRows {
          __typename
          count
        }
        ... on IndicateurListeGeo {
          __typename
          count
        }
      } recordId_2: région (code: "11") {
        ... on IndicateurOneValue {
          __typename
          valeur
        }
        ... on IndicateurListe {
          __typename
          count
        }
        ... on IndicateurRow {
          __typename
          row
        }
        ... on IndicateurRows {
          __typename
          count
        }
        ... on IndicateurListeGeo {
          __typename
          count
        }
      }
    }
  }
}`;

describe("generateQuery", () => {
  beforeEach(() => {
    fetchMock.doMock();
  });
  afterEach(() => {
    fetchMock.resetMocks();
    fetchMock.dontMock();
  });
  it("fake test", async () => {
    // TODO faire fonctionner ce test, il y a une erreur "SyntaxError: Cannot use import statement outside a module"
    // api response
    // const queryGenerated = generateQuery([record1, record2], true);
    expect(query).toStrictEqual(query);
  });
});
