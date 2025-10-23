import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { COLUMN_MAPPING_NAMES } from "./constants";

export const listObjectToString = (objList: object[]): string => {
  return objList
    .map(
      (row: object) =>
        "{" +
        Object.entries(row)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ") +
        "}",
    )
    .join(", ");
};

export const mappingsIsReady = (mappings: WidgetColumnMap | null) => {
  return (
    mappings &&
    mappings[COLUMN_MAPPING_NAMES.VALEUR_INDICATEUR.name] &&
    mappings[COLUMN_MAPPING_NAMES.CODE_INSEE.name] &&
    mappings[COLUMN_MAPPING_NAMES.MAILLE.name]
  );
};
