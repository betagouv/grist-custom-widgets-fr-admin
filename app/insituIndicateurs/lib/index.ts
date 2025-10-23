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
  identifiant: string,
): Promise<FetchIndicateurReturnType<NarrowedTypeIndicateur>> => {
  const params = { identifiant };
  const results: FetchIndicateursReturnType = await request(
    "https://servitu.donnees.incubateur.anct.gouv.fr/graphql",
    query,
    params,
    {
      ["x-client-name"]: "Widget Grist insituIndicateur",
    },
  );

  const data = results.indicateurs[0];
  return data;
};

function assertIdentifiantCorrect(identifiant: string): asserts identifiant is string {
  if (typeof identifiant !== "string") {
    throw new Error("L'identifiant de la colonne n'est pas compréhensible, ce doit être l'identifiant de l'indicateur insitu");
  }
  // TODO faire plus de check de la qualité de l'identifiant avant de créer la requête
}

export const getInsituIndicateursResultsForRecords = async (
  identifiant: string,
  records: RowRecord[],
  checkDestinationIsEmpty: boolean,
  stats: Stats,
): Promise<InsituResults> => {
  assertIdentifiantCorrect(identifiant); // A partir de cet appel, typescript reconnaît identifiant comme une string
  const { query, errors: errorByRecord } = generateQuery(
    records,
    checkDestinationIsEmpty,
    stats,
  );
  if (!query) {
    return {
      data: null,
      errorByRecord
    };
  } else {
    try {
      const insituIndicateursResults = await callInsituIndicateurApi(
        query,
        identifiant,
      );
      return { data: insituIndicateursResults, errorByRecord }
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
