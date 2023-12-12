"use client";

import { FC } from "react";
import { ChoiceBanner } from "./ChoiceBanner";
import { RowRecord } from "grist/GristData";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { COLUMN_MAPPING_NAMES } from "./constants";
import Image from "next/image";
import doneSvg from "../../public/done.svg";
import {
  DirtySirenCodeRecord,
  NoResultSirenCodeRecord,
  NormalizedSirenResult,
} from "./types";

export const SpecificProcessing: FC<{
  mappings: WidgetColumnMap | null;
  record: RowRecord | null | undefined;
  dirtyData: DirtySirenCodeRecord | null | undefined;
  noResultData: NoResultSirenCodeRecord | null | undefined;
  passDataFromDirtyToClean: (
    sirenCodeSelected: NormalizedSirenResult,
    initalData: DirtySirenCodeRecord,
  ) => void;
  recordResearch: () => void;
  goBackToMenu: () => void;
}> = ({
  mappings,
  record,
  dirtyData,
  noResultData,
  passDataFromDirtyToClean,
  recordResearch,
  goBackToMenu,
}) => {
  const recordName = () => {
    if (record && mappings) {
      const columnName = mappings[COLUMN_MAPPING_NAMES.NAME.name];
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
    return (
      <span className="tag warning semi-bold">ligne non sélectionnée</span>
    );
  };

  const isResultFind = () => {
    if (record && mappings) {
      const columnName = mappings[COLUMN_MAPPING_NAMES.SIREN.name];
      return typeof columnName === "string" && record[columnName] && true;
    }
    return false;
  };

  const selectOtherLine = (
    <>
      <p>Sélectionner une autre ligne à traiter spécifiquement</p>
      <p>ou</p>
    </>
  );

  const actionsButton = (isFirstResearch: boolean) => {
    return (
      <>
        {record && (
          <button className="primary" onClick={recordResearch}>
            {isFirstResearch ? "Recherche spécifique" : "Réitérer la recherche"}
          </button>
        )}
        <button className="secondary" onClick={goBackToMenu}>
          Retour à l'accueil
        </button>
      </>
    );
  };

  return isResultFind() ? (
    <div className="centered-column">
      <h2>Traitement spécifique terminé</h2>
      <Image
        priority
        src={doneSvg}
        style={{ marginBottom: "1rem" }}
        alt="traitement spécifique terminé"
      />
      <div>Le code SIREN de {recordName()} a bien été rempli.</div>
      <div style={{ marginTop: "4rem" }}>
        {selectOtherLine}
        {actionsButton(false)}
      </div>
    </div>
  ) : (
    <div className="centered-column">
      <h2>Traitement spécifique</h2>
      <div>Collectivité sélectionnée : {recordName()}</div>

      {record && dirtyData && (
        <ChoiceBanner
          dirtyData={dirtyData}
          passDataFromDirtyToClean={passDataFromDirtyToClean}
        />
      )}
      {record && noResultData && (
        <div className="py-2">
          <span className="semi-bold">{noResultData.noResultMessage}</span>
        </div>
      )}
      <div style={{ marginTop: "4rem" }}>
        {record && noResultData ? (
          <>
            {selectOtherLine} {actionsButton(false)}
          </>
        ) : (
          actionsButton(true)
        )}
      </div>
    </div>
  );
};
