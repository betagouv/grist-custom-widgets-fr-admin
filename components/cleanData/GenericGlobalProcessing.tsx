"use client";

import Image from "next/image";
import doneSvg from "../../public/done.svg";
import { KeyValue } from "../../lib/util/types";
import { DirtyRecord, NoResultRecord } from "../../lib/cleanData/types";

function GenericGlobalProcessing<NormalizedResult extends KeyValue>({
  dirtyData,
  noResultData,
  globalInProgress,
  atOnProgress,
  recordResearch,
  goBackToMenu,
  researchObjectName,
}: {
  dirtyData: {
    [recordId: number]: DirtyRecord<NormalizedResult>;
  };
  noResultData: {
    [recordId: number]: NoResultRecord<NormalizedResult>;
  };
  globalInProgress: boolean;
  atOnProgress: [number, number];
  recordResearch: () => void;
  goBackToMenu: () => void;
  researchObjectName?: string;
}) {
  return globalInProgress ? (
    <div className="centered-column">
      <h2>Traitement global en cours...</h2>
      <span className="loader"></span>
      <div className="px-2">
        {atOnProgress[0]} / {atOnProgress[1]}
      </div>
    </div>
  ) : (
    <div>
      <h2>Traitement global terminée</h2>
      <Image
        priority
        src={doneSvg}
        style={{ marginBottom: "1rem" }}
        alt="traitement spécifique terminé"
      />
      <p>
        {researchObjectName ? researchObjectName : "Les resultats"} de{" "}
        {Object.keys(dirtyData).length + Object.keys(noResultData).length}{" "}
        lignes n&apos;ont pu être trouvés automatiquement. Il se peut
        qu&apos;aucun ou plusieurs résultats correspondent aux noms des sources.
        Pour cela, utilisez la recherche spécifique.
      </p>
      <div>
        <button className="primary" onClick={recordResearch}>
          Recherche spécifique
        </button>
        <button className="secondary" onClick={goBackToMenu}>
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}

export default GenericGlobalProcessing;
