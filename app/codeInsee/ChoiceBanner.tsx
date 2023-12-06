"use client";

import { FC, useState } from "react";
import { DirtyInseeCodeRecord, NormalizedInseeResult } from "./types";
import { DEPT } from "../../lib/util/constants";
import "./choiceBanner.css";

export const ChoiceBanner: FC<{
  dirtyData: DirtyInseeCodeRecord;
  passDataFromDirtyToClean: (
    inseeCodeSelected: NormalizedInseeResult,
    initalData: DirtyInseeCodeRecord,
  ) => void;
}> = ({ dirtyData, passDataFromDirtyToClean }) => {
  const [inseeCodeSelected, setInseeCodeSelected] =
    useState<NormalizedInseeResult | null>(null);

  const selectGroupement = () => {
    if (inseeCodeSelected) {
      passDataFromDirtyToClean(inseeCodeSelected, dirtyData);
    }
  };

  return (
    <div className="container">
      <p>
        <b>
          Plusieurs résultats peuvent correspondre à la collectivité
          sélectionnée.
        </b>
        <br />
        Les voici triés par ordre de fiabilité, choisissez la bonne option et
        valider.
        <br />
        <span className="choice-banner-info">{dirtyData.dirtyMessage}</span>
      </p>

      <div className="insee-code-legend">Code INSEE</div>
      <div className="choices">
        {dirtyData.results.map((item, index) => {
          return (
            <div className="text-align-left" key={index}>
              <div className="choice">
                <div className="choice-label">
                  <input
                    onClick={() => setInseeCodeSelected(item)}
                    type="radio"
                    value={item.code_insee}
                    checked={inseeCodeSelected === item}
                  />
                  <label htmlFor={item.code_insee}>
                    <b>
                      {item.nature_juridique} {item.lib_groupement}
                    </b>
                    {item.insee_dep && ` - ${DEPT[item.insee_dep]}`}
                  </label>
                </div>
                {item.code_insee ? (
                  <div className="tag info">{item.code_insee}</div>
                ) : (
                  <div>Sans Code</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <button
        className="primary"
        disabled={!inseeCodeSelected}
        onClick={selectGroupement}
      >
        Valider
      </button>
    </div>
  );
};
