"use client";

import { FC, useState } from "react";
import { DirtyGeoCodeRecord, NormalizedGeocodeResult } from "./types";

export const ChoiceBanner: FC<{
  dirtyData: DirtyGeoCodeRecord;
  passDataFromDirtyToClean: (
    addressSelected: NormalizedGeocodeResult,
    initalData: DirtyGeoCodeRecord,
  ) => void;
}> = ({ dirtyData, passDataFromDirtyToClean }) => {
  const [addresseSelected, setaddresseSelected] =
    useState<NormalizedGeocodeResult | null>(null);

  const selectaddress = () => {
    if (addresseSelected) {
      passDataFromDirtyToClean(addresseSelected, dirtyData);
    }
  };

  return (
    <div className="px-2">
      <p>Quelle adresse vouliez vous dire pour {dirtyData.address} ?</p>
      <div className="flex-column">
        {dirtyData.results.map((item, index) => {
          return (
            <div className="text-align-left" key={index}>
              <input
                onClick={() => setaddresseSelected(item)}
                type="radio"
                value={item.address_nomalized}
                checked={addresseSelected === item}
              />
              {item.address_nomalized}
            </div>
          );
        })}
      </div>
      <button disabled={!addresseSelected} onClick={selectaddress}>
        Choisir
      </button>
    </div>
  );
};
