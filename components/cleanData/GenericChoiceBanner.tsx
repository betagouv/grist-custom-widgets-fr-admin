"use client";

import { ReactNode, useState } from "react";
import "./genericChoiceBanner.css";
import { KeyValue } from "../../lib/util/types";
import { DirtyRecord } from "../../lib/cleanData/types";

type Option = {
  choiceValueKey: string;
  withChoiceTagLegend: boolean;
  choiceTagLegend: string;
  choiceTagKey: string;
  choiceTagKey2?: string;
};

type GenericChoiceBannerParams<NormalizedResult extends KeyValue> = {
  dirtyData: DirtyRecord<NormalizedResult>;
  itemDisplay: (item: NormalizedResult) => ReactNode;
  passDataFromDirtyToClean: (
    selected: NormalizedResult,
    initalData: DirtyRecord<NormalizedResult>,
  ) => void;
  option: Option;
  selectedDisplay?: (selected: NormalizedResult) => ReactNode;
};

function GenericChoiceBanner<NormalizedResult extends KeyValue>({
  dirtyData,
  itemDisplay,
  passDataFromDirtyToClean,
  option,
  selectedDisplay,
}: GenericChoiceBannerParams<NormalizedResult>) {
  const [selected, setSelected] = useState<NormalizedResult | null>(null);

  const selectGroupement = () => {
    if (selected) {
      passDataFromDirtyToClean(selected, dirtyData);
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

      {selected && selectedDisplay && selectedDisplay(selected)}

      {option.withChoiceTagLegend && (
        <div className="insee-code-legend">{option.choiceTagLegend}</div>
      )}
      <div className="choices">
        {dirtyData.results.map((item, index) => {
          return (
            <div className="text-align-left" key={index}>
              <div className="choice">
                <div className="choice-label">
                  <input
                    onClick={() => setSelected(item)}
                    type="radio"
                    value={item[option.choiceValueKey]}
                    checked={selected === item}
                  />
                  <label htmlFor={item[option.choiceValueKey]}>
                    {itemDisplay(item)}
                  </label>
                </div>
                {option.withChoiceTagLegend && (
                  <div className="tag info">
                    {item[option.choiceTagKey] ||
                      (option.choiceTagKey2 && item[option.choiceTagKey2])}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <button
        className="primary"
        disabled={!selected}
        onClick={selectGroupement}
      >
        Valider
      </button>
    </div>
  );
}

export default GenericChoiceBanner;
