"use client";

import { FC, useState } from "react";
import { DirtyInseeCodeRecord, NormalizedInseeResult } from "./types";
import { NATURE_JURIDIQUE } from "./constants";
import { DEPT } from "../../lib/util/constants";

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
    <div style={{ marginBottom: "2rem" }}>
      <p>
        <b>Choisissez le bon groupement</b>
        <br />
        <i>{dirtyData.dirtyMessage}</i>
        <br />
        <span className="info">NB: Ils sont triés par ordre de fiabilité</span>
      </p>

      <div className="flex-column">
        {dirtyData.results.map((item, index) => {
          return (
            <div className="text-align-left" key={index}>
              <div
                className="flex-row"
                style={{ justifyContent: "space-between", margin: "0.5rem 0" }}
              >
                <div className="flex-row">
                  <input
                    onClick={() => setInseeCodeSelected(item)}
                    type="radio"
                    value={item.code_insee}
                    checked={inseeCodeSelected === item}
                  />
                  <div className="flex-column">
                    {`${NATURE_JURIDIQUE[item.nature_juridique]} ${
                      item.lib_groupement
                    }`}
                    {item.insee_dep && <div>{`${DEPT[item.insee_dep]}`}</div>}
                  </div>
                </div>
                {item.code_insee ? (
                  <div>
                    Code Insee: <b>{item.code_insee}</b>
                  </div>
                ) : (
                  <div>Sans code Insee</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <button disabled={!inseeCodeSelected} onClick={selectGroupement}>
        Choisir
      </button>
    </div>
  );
};
