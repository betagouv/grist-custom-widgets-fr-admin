"use client";

import { ReactNode } from "react";
import { RowRecord } from "grist/GristData";
import Image from "next/image";
import doneSvg from "../../public/done.svg";
import { KeyValue } from "../../lib/util/types";
import { NoResultRecord } from "../../lib/cleanData/types";

function GenericSpecificProcessing<NormalizedResult extends KeyValue>({
  record,
  recordNameNode,
  noResultData,
  recordResearch,
  goBackToMenu,
  isResultFind,
  recordFindNode,
  choiceBannerNode,
}: {
  record: RowRecord | null | undefined;
  recordNameNode: ReactNode;
  noResultData: NoResultRecord<NormalizedResult> | null | undefined;
  recordResearch: () => void;
  goBackToMenu: () => void;
  isResultFind: () => boolean;
  recordFindNode: ReactNode;
  choiceBannerNode: ReactNode;
}) {
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
      {recordFindNode}
      <div style={{ marginTop: "4rem" }}>
        {selectOtherLine}
        {actionsButton(false)}
      </div>
    </div>
  ) : (
    <div className="centered-column">
      <h2>Traitement spécifique</h2>
      <div>Ligne sélectionnée : {recordNameNode}</div>

      {choiceBannerNode}
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
}

export default GenericSpecificProcessing;
