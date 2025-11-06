import { request } from "graphql-request";
import { RowRecord } from "grist/GristData";
import {
  FetchIndicateurReturnType,
  FetchIndicateursReturnType,
  NarrowedTypeIndicateur,
  Stats,
  InsituResults,
} from "../types";
import { generateQuery } from "./generateQuery";

const callInsituIndicateurApi = async (
  query: string,
  identifiants: string[],
): Promise<FetchIndicateurReturnType<NarrowedTypeIndicateur>[]> => {
  const params = { identifiants };
  const results: FetchIndicateursReturnType = await request(
    "https://servitu.donnees.incubateur.anct.gouv.fr/graphql",
    query,
    params,
    {
      ["x-client-name"]: "Widget Grist insituIndicateur",
    },
  );

  const data = results.indicateurs;
  return data;
};

function assertIdentifiantCorrect(
  identifiant: string,
): asserts identifiant is string {
  if (typeof identifiant !== "string") {
    throw new Error(
      `L'identifiant ${identifiant} n'est pas compréhensible, ce doit être l'identifiant de l'indicateur insitu`,
    );
  }
  // TODO faire plus de check de la qualité de l'identifiant avant de créer la requête
}

export const getInsituIndicateursResultsForRecords = async (
  identifiants: string[],
  records: RowRecord[],
  checkDestinationIsEmpty: boolean,
  stats: Stats,
): Promise<InsituResults> => {
  console.log("On rentre dans la première fonction : getInsituIndicateursResultsForRecords")
  identifiants.forEach(identifiant => assertIdentifiantCorrect(identifiant))
  const { query, errors: errorByRecord } = generateQuery(
    records,
    checkDestinationIsEmpty,
    stats,
  );
  console.log("generate query") 
  if (!query) {
    return {
      data: null,
      errorByRecord,
    };
  } else {
    try {
      const insituIndicateursResults = await callInsituIndicateurApi(
        query,
        identifiants,
      );
      return { data: insituIndicateursResults, errorByRecord };
    } catch (e) {
      let errorMessage = "La requête à Insitu a échoué";
      if (e instanceof Error) {
        errorMessage = e.message.slice(0, 200) + "...";
      }
      const error = new Error(errorMessage);
      error.cause = e; // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause
      throw error;
    }
  }
};
