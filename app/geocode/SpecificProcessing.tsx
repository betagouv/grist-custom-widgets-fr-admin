"use client";

import { FC } from "react";
import { ChoiceBanner } from "./ChoiceBanner";
import {
  DirtyGeoCodeRecord,
  NoResultGeoCodeRecord,
  NormalizedGeocodeResult,
} from "./types";
import { RowRecord } from "grist/GristData";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { COLUMN_MAPPING_NAMES } from "./constants";
import Image from "next/image";
import doneSvg from "../../public/done.svg";
import { DynamicMarker } from "./DynamicMarker";
import { Map } from "./Map";

export const SpecificProcessing: FC<{
  mappings: WidgetColumnMap | null;
  record: RowRecord | null | undefined;
  dirtyData: DirtyGeoCodeRecord | null | undefined;
  noResultData: NoResultGeoCodeRecord | null | undefined;
  passDataFromDirtyToClean: (
    inseeCodeSelected: NormalizedGeocodeResult,
    initalData: DirtyGeoCodeRecord,
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
      const columnName = mappings[COLUMN_MAPPING_NAMES.ADDRESS.name];
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
      const columnNameLat = mappings[COLUMN_MAPPING_NAMES.LATITUDE.name];
      const columnNameLng = mappings[COLUMN_MAPPING_NAMES.LONGITUDE.name];
      return (
        typeof columnNameLat === "string" &&
        typeof columnNameLng === "string" &&
        record[columnNameLat] &&
        record[columnNameLng] &&
        true
      );
    }
    return false;
  };

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
      {/* <Map>
        {record && <DynamicMarker mappings={mappings} record={record} />}
      </Map> */}
      <div style={{ marginTop: "4rem" }}>
        {selectOtherLine}
        {actionsButton(false)}
      </div>
    </div>
  ) : (
    <div className="centered-column">
      <h2>Traitement spécifique</h2>
      <div>Adresse sélectionnée : {recordName()}</div>

      {record && dirtyData && (
        <ChoiceBanner
          dirtyData={dirtyData}
          passDataFromDirtyToClean={passDataFromDirtyToClean}
        />
      )}
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
};
