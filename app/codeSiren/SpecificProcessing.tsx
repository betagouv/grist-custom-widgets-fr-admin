"use client";

import { FC } from "react";
import { RowRecord } from "grist/GristData";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { COLUMN_MAPPING_NAMES } from "./constants";
import Image from "next/image";
import doneSvg from "../../public/done.svg";
import { NormalizedSirenResult } from "./types";
import GenericChoiceBanner from "../../components/GenericChoiceBanner";
import { DirtyRecord, NoResultRecord } from "../../lib/util/types";
import RecordName from "../../components/RecordName";

export const SpecificProcessing: FC<{
  mappings: WidgetColumnMap | null;
  record: RowRecord | null | undefined;
  dirtyData: DirtyRecord<NormalizedSirenResult> | null | undefined;
  noResultData: NoResultRecord<NormalizedSirenResult> | null | undefined;
  passDataFromDirtyToClean: (
    sirenCodeSelected: NormalizedSirenResult,
    initalData: DirtyRecord<NormalizedSirenResult>,
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
  const recordName = (
    <RecordName
      record={record}
      columnName={mappings && mappings[COLUMN_MAPPING_NAMES.NAME.name]}
    />
  );

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
      <div>Le code SIREN de {recordName} a bien été rempli.</div>
      <div style={{ marginTop: "4rem" }}>
        {selectOtherLine}
        {actionsButton(false)}
      </div>
    </div>
  ) : (
    <div className="centered-column">
      <h2>Traitement spécifique</h2>
      <div>Collectivité sélectionnée : {recordName}</div>

      {record && dirtyData && (
        <GenericChoiceBanner<NormalizedSirenResult>
          dirtyData={dirtyData}
          passDataFromDirtyToClean={passDataFromDirtyToClean}
          option={{
            choiceValueKey: "siren",
            withChoiceTagLegend: true,
            choiceTagLegend: "Code SIREN",
            choiceTagKey: "siren",
          }}
          itemDisplay={(item: NormalizedSirenResult) => {
            return (
              <div>
                <b>{item.label}</b>
                {item.code_commune && ` - ${item.code_commune}`}
              </div>
            );
          }}
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
