import { NarrowedTypeIndicateur } from "../types";
import { listObjectToString } from "../utils";

/**
 * Extrait la valeur d'un indicateur en fonction de son type
 * @param indicateur L'indicateur à traiter
 * @param wantDetail Si true, retourne le détail complet, sinon retourne le décompte
 * @returns La valeur de l'indicateur (number ou string)
 */
export const extractIndicateurValue = (
  indicateur: NarrowedTypeIndicateur | null | undefined,
  wantDetail: boolean
): number | string => {
  if (!indicateur) {
    return "Erreur";
  }

  switch (indicateur.__typename) {
    case "IndicateurOneValue":
      return indicateur.valeur;
    
    case "IndicateurRow":
      return String(Object.values(indicateur.row)[0]);
    
    case "IndicateurRows":
      return wantDetail
        ? listObjectToString(indicateur.rows)
        : indicateur.count;
    
    case "IndicateurListe":
      return wantDetail
        ? indicateur.liste.join(", ")
        : indicateur.count;
    
    case "IndicateurListeGeo":
      return wantDetail
        ? indicateur.properties.join(", ")
        : indicateur.count;
    
    default:
      return "Erreur";
  }
};

/**
 * Extrait le numéro de record depuis un identifiant au format "recordId_XXX"
 * @param recordId L'identifiant du record au format "recordId_XXX"
 * @returns Le numéro de record extrait
 */
export const extractRecordNumber = (recordId: string): number => {
  return parseInt(recordId.split("recordId_")[1]);
};
