"use client";

import { RowRecord } from "grist/GristData";

function RecordName({
  record,
  columnName,
}: {
  record: RowRecord | null | undefined;
  columnName: string | string[] | null;
}) {
  if (record && columnName) {
    if (typeof columnName === "string") {
      return record[columnName] ? (
        <span className="tag validated semi-bold">
          {String(record[columnName])}
        </span>
      ) : (
        <span className="tag warning semi-bold">source manquante</span>
      );
    }
    return (
      <span className="tag warning semi-bold">
        colonne illisible (type texte requis)
      </span>
    );
  }
  return <span className="tag warning semi-bold">ligne non sélectionnée</span>;
}

export default RecordName;
