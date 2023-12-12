"use client";

import { FC, useState } from "react";
import "../codeInsee/choiceBanner.css";
import { DirtySirenCodeRecord, NormalizedSirenResult } from "./types";

export const ChoiceBanner: FC<{
  dirtyData: DirtySirenCodeRecord;
  passDataFromDirtyToClean: (
    sirenCodeSelected: NormalizedSirenResult,
    initalData: DirtySirenCodeRecord,
  ) => void;
}> = ({ dirtyData, passDataFromDirtyToClean }) => {
  const [sirenCodeSelected, setSirenCodeSelected] =
    useState<NormalizedSirenResult | null>(null);

  const selectGroupement = () => {
    if (sirenCodeSelected) {
      passDataFromDirtyToClean(sirenCodeSelected, dirtyData);
    }
  };

  return (
    <div className="container">
      <p>
        <b>Plusieurs résultats peuvent correspondre.</b>
        <br />
        Les voici triés par ordre de fiabilité, choisissez la bonne option et
        valider.
        <br />
        <span className="choice-banner-info">{dirtyData.dirtyMessage}</span>
      </p>

      <div className="insee-code-legend">Code SIREN</div>
      <div className="choices">
        {dirtyData.results.map((item, index) => {
          return (
            <div className="text-align-left" key={index}>
              <div className="choice">
                <div className="choice-label">
                  <input
                    onClick={() => setSirenCodeSelected(item)}
                    type="radio"
                    value={item.siren}
                    checked={sirenCodeSelected === item}
                  />
                  <label htmlFor={item.siren}>
                    <b>{item.label}</b>
                    {item.code_commune && ` - ${item.code_commune}`}
                  </label>
                </div>
                <div className="tag info">{item.siren}</div>
              </div>
            </div>
          );
        })}
      </div>
      <button
        className="primary"
        disabled={!sirenCodeSelected}
        onClick={selectGroupement}
      >
        Valider
      </button>
    </div>
  );
};
