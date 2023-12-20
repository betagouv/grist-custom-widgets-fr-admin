"use client";

import { FC } from "react";
import { NormalizedInseeResult } from "./types";
import { RowRecord } from "grist/GristData";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { COLUMN_MAPPING_NAMES } from "./constants";
import Image from "next/image";
import doneSvg from "../../public/done.svg";
import GenericChoiceBanner from "../../components/GenericChoiceBanner";
import { DEPT } from "../../lib/util/constants";
import { DirtyRecord, NoResultRecord } from "../../lib/util/types";

export const SpecificProcessing: FC<{
  mappings: WidgetColumnMap | null;
  record: RowRecord | null | undefined;
  dirtyData: DirtyRecord<NormalizedInseeResult> | null | undefined;
  noResultData: NoResultRecord<NormalizedInseeResult> | null | undefined;
  passDataFromDirtyToClean: (
    inseeCodeSelected: NormalizedInseeResult,
    initalData: DirtyRecord<NormalizedInseeResult>,
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
      const columnName = mappings[COLUMN_MAPPING_NAMES.COLLECTIVITE.name];
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
      const columnName = mappings[COLUMN_MAPPING_NAMES.CODE_INSEE.name];
      return typeof columnName === "string" && record[columnName] && true;
    }
    return false;
  };

  const sirenGroupement = record &&
    noResultData?.result &&
    noResultData.result?.siren_groupement && (
      <>
        {" "}
        Il existe cependant un code SIREN :{" "}
        <span className="tag info">
          {noResultData.result?.siren_groupement}
        </span>
      </>
    );

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
      <div>Le code INSEE de {recordName()} a bien été rempli.</div>
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
        <GenericChoiceBanner<NormalizedInseeResult>
          dirtyData={dirtyData}
          passDataFromDirtyToClean={passDataFromDirtyToClean}
          option={{
            choiceValueKey: "code_insee",
            withChoiceTagLegend: true,
            choiceTagLegend: "Code INSEE",
            choiceTagKey: "code_insee",
          }}
          itemDisplay={(item: NormalizedInseeResult) => {
            return (
              <div>
                <b>
                  {item.nature_juridique} {item.lib_groupement}
                </b>
                {item.insee_dep && ` - ${DEPT[item.insee_dep]}`}
              </div>
            );
          }}
        />
      )}
      {record && noResultData && (
        <div className="py-2">
          <span className="semi-bold">{noResultData.noResultMessage}</span>
          {sirenGroupement}
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
