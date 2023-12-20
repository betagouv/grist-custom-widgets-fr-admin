"use client";

import { FC } from "react";
import { NormalizedGeocodeResult } from "./types";
import { RowRecord } from "grist/GristData";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { COLUMN_MAPPING_NAMES } from "./constants";
import Image from "next/image";
import doneSvg from "../../public/done.svg";
import dynamic from "next/dynamic";
import { DirtyRecord, NoResultRecord } from "../../lib/util/types";
import GenericChoiceBanner from "../../components/GenericChoiceBanner";

// react-leaflet is relies on browser APIs window. Dynamically load the component on the client side desabling ssr
const MyAwesomeMap = dynamic(() => import("./Map"), { ssr: false });
const DynamicMarker = dynamic(() => import("./DynamicMarker"), { ssr: false });
const ChoiceDynamicMarker = dynamic(() => import("./ChoiceDynamicMarker"), {
  ssr: false,
});

export const SpecificProcessing: FC<{
  mappings: WidgetColumnMap | null;
  record: RowRecord | null | undefined;
  dirtyData: DirtyRecord<NormalizedGeocodeResult> | null | undefined;
  noResultData: NoResultRecord<NormalizedGeocodeResult> | null | undefined;
  passDataFromDirtyToClean: (
    inseeCodeSelected: NormalizedGeocodeResult,
    initalData: DirtyRecord<NormalizedGeocodeResult>,
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
      {record && (
        <MyAwesomeMap>
          <DynamicMarker mappings={mappings} record={record} />
        </MyAwesomeMap>
      )}
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
        <GenericChoiceBanner<NormalizedGeocodeResult>
          dirtyData={dirtyData}
          passDataFromDirtyToClean={passDataFromDirtyToClean}
          option={{
            choiceValueKey: "address_nomalized",
            withChoiceTagLegend: false,
            choiceTagLegend: "",
            choiceTagKey: "",
          }}
          itemDisplay={(item: NormalizedGeocodeResult) => (
            <div>
              <b>{item.address_nomalized}</b>
              {item.departement && ` - ${item.departement}`}
            </div>
          )}
          selectedDisplay={(selected: NormalizedGeocodeResult) => (
            <MyAwesomeMap>
              <ChoiceDynamicMarker address={selected} />
            </MyAwesomeMap>
          )}
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
