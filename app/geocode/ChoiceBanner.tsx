"use client";

import { FC, useState } from "react";
import { DirtyGeoCodeRecord, NormalizedGeocodeResult } from "./types";
import "../codeInsee/choiceBanner.css";
import { ChoiceDynamicMarker } from "./ChoiceDynamicMarker";
import dynamic from "next/dynamic";

// react-leaflet is relies on browser APIs window. Dynamically load the component on the client side desabling ssr
const MyAwesomeMap = dynamic(() => import("./Map"), { ssr: false });

export const ChoiceBanner: FC<{
  dirtyData: DirtyGeoCodeRecord;
  passDataFromDirtyToClean: (
    addressSelected: NormalizedGeocodeResult,
    initalData: DirtyGeoCodeRecord,
  ) => void;
}> = ({ dirtyData, passDataFromDirtyToClean }) => {
  const [addressSelected, setAddressSelected] =
    useState<NormalizedGeocodeResult | null>(null);

  const selectaddress = () => {
    if (addressSelected) {
      passDataFromDirtyToClean(addressSelected, dirtyData);
    }
  };

  return (
    <div className="container">
      <p>
        <b>
          Plusieurs résultats peuvent correspondre à l'adresse sélectionnée.
        </b>
        <br />
        Les voici triés par ordre de fiabilité, choisissez la bonne option et
        valider.
        <br />
        <span className="choice-banner-info">{dirtyData.dirtyMessage}</span>
      </p>
      {addressSelected && (
        <MyAwesomeMap>
          <ChoiceDynamicMarker address={addressSelected} />
        </MyAwesomeMap>
      )}
      <div className="choices">
        {dirtyData.results.map((item, index) => {
          return (
            <div className="text-align-left" key={index}>
              <div className="choice-label">
                <input
                  onClick={() => setAddressSelected(item)}
                  type="radio"
                  value={item.address_nomalized}
                  checked={addressSelected === item}
                />

                <label htmlFor={item.address_nomalized}>
                  <b>{item.address_nomalized}</b>
                  {item.departement && ` - ${item.departement}`}
                </label>
              </div>
            </div>
          );
        })}
      </div>
      <button disabled={!addressSelected} onClick={selectaddress}>
        Choisir
      </button>
    </div>
  );
};
