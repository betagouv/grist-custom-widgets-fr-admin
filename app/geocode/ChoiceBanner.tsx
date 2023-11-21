'use client';

import { FC, useState } from "react";

export type GeoCodeApiResult = {
  lat: number;
  lng: number;
  address_nomalized: string;
  score: number;
};

export type DirtyGeoCodeData = {
  result: GeoCodeApiResult[];
  recordId: number;
  address: string;
};


export const ChoiceBanner: FC<{
  dirtyData: DirtyGeoCodeData;
  passDataFromDirtyToClean: (
    adressSelected: GeoCodeApiResult,
    initalData: DirtyGeoCodeData
  ) => void;
}> = ({
  dirtyData,
  passDataFromDirtyToClean,
}) => {
    const [adresseSelected, setAdresseSelected] = useState<GeoCodeApiResult | null>(null);

    const selectAdress = () => {
      if (adresseSelected) {
        passDataFromDirtyToClean(adresseSelected, dirtyData);
      }
    };

    return (
      <div className="px-2">
        <p>Quelle adresse vouliez vous dire pour {dirtyData.address} ?</p>
        <div className="flex-column">
          {dirtyData.result.map((item, index) => {
            return (
              <div className="text-align-left" key={index}>
                <input
                  onClick={() => setAdresseSelected(item)}
                  type="radio"
                  value={item.address_nomalized}
                  checked={adresseSelected === item}
                />
                {item.address_nomalized}
              </div>
            );
          })}
        </div>
        <button disabled={!adresseSelected} onClick={selectAdress}>
          Choisir
        </button>
      </div>
    );
  };
