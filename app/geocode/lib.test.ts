import { cleanRecordData, geocodeFromAdress, isClean } from "./lib";
import fetchMock from 'jest-fetch-mock'

fetchMock.enableMocks();
fetchMock.dontMock();

describe('geocodeFromAdress', () => {
  beforeEach(() => {
    fetchMock.doMock();
  });
  afterEach(() => {
    jest.restoreAllMocks();
    fetchMock.resetMocks();
    fetchMock.dontMock();
  });

  it('should return an empty array even with no "features" property in the response', async () => {
    // given
    fetchMock.mockResponse(JSON.stringify({}));
    // when
    const records = await geocodeFromAdress("foobar");
    // then
    expect(records).toStrictEqual([]);
  });

  it('should call fetch with the api-adresse API', async () => {
    // given
    fetchMock.mockResponse(JSON.stringify({}));
    // when
    const records = await geocodeFromAdress("foo bar");
    // then
    expect(fetchMock.mock.lastCall![0]).toBe(
      "https://api-adresse.data.gouv.fr/search/?q=foo+bar"
    );
  });

  it('should return an array of normalized records', async () => {
    // given
    fetchMock.mockResponse(JSON.stringify(
      {"type":"FeatureCollection","version":"draft","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[2.38603,48.888467]},"properties":{"label":"21 Rue des Ardennes 75019 Paris","score":0.9763818181818181,"housenumber":"21","id":"75119_0427_00021","name":"21 Rue des Ardennes","postcode":"75019","citycode":"75119","x":654978.73,"y":6865558.82,"city":"Paris","district":"Paris 19e Arrondissement","context":"75, Paris, Île-de-France","type":"housenumber","importance":0.7402,"street":"Rue des Ardennes"}},{"type":"Feature","geometry":{"type":"Point","coordinates":[4.732432,49.853021]},"properties":{"label":"21 Rue de la Commune de Paris 08120 Bogny-sur-Meuse","score":0.38073442260442264,"housenumber":"21","id":"08081_0178_00021","name":"21 Rue de la Commune de Paris","postcode":"08120","citycode":"08081","x":824672.92,"y":6974060.63,"city":"Bogny-sur-Meuse","context":"08, Ardennes, Grand Est","type":"housenumber","importance":0.53943,"street":"Rue de la Commune de Paris"}},{"type":"Feature","geometry":{"type":"Point","coordinates":[4.714236,49.723666]},"properties":{"label":"21 Route de Paris 08000 La Francheville","score":0.35332482758620687,"housenumber":"21","id":"08180_0060_00021","name":"21 Route de Paris","postcode":"08000","citycode":"08180","x":823676.21,"y":6959637.74,"city":"La Francheville","context":"08, Ardennes, Grand Est","type":"housenumber","importance":0.47278,"street":"Route de Paris"}},{"type":"Feature","geometry":{"type":"Point","coordinates":[5.265477,49.555608]},"properties":{"label":"Rue de Paris 08370 Bièvres","score":0.3494209090909091,"id":"08065_0120","name":"Rue de Paris","postcode":"08370","citycode":"08065","x":863973.26,"y":6941945.38,"city":"Bièvres","context":"08, Ardennes, Grand Est","type":"street","importance":0.24363,"street":"Rue de Paris"}},{"type":"Feature","geometry":{"type":"Point","coordinates":[4.93991,49.335439]},"properties":{"label":"Rue de Paris 08250 Saint-Juvin","score":0.3483836363636364,"id":"08383_0015","name":"Rue de Paris","postcode":"08250","citycode":"08383","x":841015.89,"y":6916829.22,"city":"Saint-Juvin","context":"08, Ardennes, Grand Est","type":"street","importance":0.23222,"street":"Rue de Paris"}}],"attribution":"BAN","licence":"ETALAB-2.0","query":"21 rue des ardennes, Paris","limit":5}
    ));
    // when
    const records = await geocodeFromAdress("foobar");
    // then
    expect(records).toStrictEqual([
      {
        "address_nomalized": "21 Rue des Ardennes 75019 Paris",
        "lat": 48.888467,
        "lng": 2.38603,
        "score": 0.9763818181818181,
      },
      {
        "address_nomalized": "21 Rue de la Commune de Paris 08120 Bogny-sur-Meuse",
        "lat": 49.853021,
        "lng": 4.732432,
        "score": 0.38073442260442264,
      },
      {
        "address_nomalized": "21 Route de Paris 08000 La Francheville",
        "lat": 49.723666,
        "lng": 4.714236,
        "score": 0.35332482758620687,
      },
      {
        "address_nomalized": "Rue de Paris 08370 Bièvres",
        "lat": 49.555608,
        "lng": 5.265477,
        "score": 0.3494209090909091,
      },
      {
        "address_nomalized": "Rue de Paris 08250 Saint-Juvin",
        "lat": 49.335439,
        "lng": 4.93991,
        "score": 0.3483836363636364,
      },
    ]);
  });
});

describe("cleanRecordData ", () => {
  const mockApiResult = [
    {
      result: [
        {
          lat: 2.308628,
          lng: 48.850699,
          address_nomalized: "20 Avenue de Ségur 75007 Paris",
          score: 0.9717099999999999,
        },
        {
          lat: 2.305575,
          lng: 48.847446,
          address_nomalized: "Avenue de Ségur 75015 Paris",
          score: 0.7739006324110672,
        },
        {
          lat: 2.309761,
          lng: 48.85036,
          address_nomalized: "Villa de Ségur 75007 Paris",
          score: 0.4636427272727272,
        },
      ],

      recordId: 1,
      address: "20 avenue de Ségur Paris",
    },
    {
      result: [
        {
          lat: 2.340552,
          lng: 48.822886,
          address_nomalized: "Rue Gazan 75014 Paris",
          score: 0.8834381818181818,
        },
        {
          lat: 1.456954,
          lng: 43.607224,
          address_nomalized: "Rue Gazan 31500 Toulouse",
          score: 0.8822272727272726,
        },
        {
          lat: 6.923759,
          lng: 43.658256,
          address_nomalized: "Rue Gazan 06130 Grasse",
          score: 0.874260909090909,
        },
        {
          lat: 7.282621,
          lng: 43.720104,
          address_nomalized: "Rue Joseph Gazan 06000 Nice",
          score: 0.49875181818181813,
        },
        {
          lat: 2.913464,
          lng: 42.733815,
          address_nomalized: "Rue des Gazanias 66380 Pia",
          score: 0.48741999999999996,
        },
      ],
      recordId: 5,
      address: "rue gazan",
    },
  ];
  it("should split clean and dirty results correctly", () => {
    expect(cleanRecordData(mockApiResult)).toStrictEqual({
      clean: [
        {
          lat: 2.308628,
          lng: 48.850699,
          address_nomalized: "20 Avenue de Ségur 75007 Paris",
          recordId: 1,
          address: "20 avenue de Ségur Paris",
          score: 0.9717099999999999,
        },
      ],
      dirty: [
        {
          result: [
            {
              lat: 2.340552,
              lng: 48.822886,
              address_nomalized: "Rue Gazan 75014 Paris",
              score: 0.8834381818181818,
            },
            {
              lat: 1.456954,
              lng: 43.607224,
              address_nomalized: "Rue Gazan 31500 Toulouse",
              score: 0.8822272727272726,
            },
            {
              lat: 6.923759,
              lng: 43.658256,
              address_nomalized: "Rue Gazan 06130 Grasse",
              score: 0.874260909090909,
            },
            {
              lat: 7.282621,
              lng: 43.720104,
              address_nomalized: "Rue Joseph Gazan 06000 Nice",
              score: 0.49875181818181813,
            },
            {
              lat: 2.913464,
              lng: 42.733815,
              address_nomalized: "Rue des Gazanias 66380 Pia",
              score: 0.48741999999999996,
            },
          ],
          recordId: 5,
          address: "rue gazan",
        },
      ],
    });
  });
});

describe("isClean", () => {
  it("should mark a set of results as clean when exactly one result has a score over 0.8", () => {
    const cleanData = [
      {
        score: 0.97,
      },
      {
        score: 0.77,
      },
      {
        score: 0.46,
      },
    ];
    expect(isClean(cleanData)).toBe(true);
  });
  it("should mark a set of results as dirty when several results have a score over 0.8", () => {
    const dirtyData = [
      {
        score: 0.97,
      },
      {
        score: 0.87,
      },
      {
        score: 0.46,
      },
    ];
    expect(isClean(dirtyData)).toBe(false);
  });
  it("should mark a set of results as dirty when several results have a score over 0.8", () => {
    const dirtyData = [
      {
        score: 0.78,
      },
      {
        score: 0.61,
      },
      {
        score: 0.53,
      },
    ];
    expect(isClean(dirtyData)).toBe(false);
  });
})
