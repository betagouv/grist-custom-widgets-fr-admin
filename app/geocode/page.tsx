"use client";

import { useEffect, useState } from "react";
import { useGristEffect } from "../../lib/grist/hooks";
import { gristReady, addObjectInRecord } from "../../lib/grist/plugin-api";
import { RowRecord } from "grist/GristData";
import { NormalizedGeocodeResult } from "./types";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { COLUMN_MAPPING_NAMES, NO_DATA_MESSAGES, TITLE } from "./constants";
import { Configuration } from "../../components/Configuration";
import { Instructions } from "./Instructions";
import { Title } from "../../components/Title";
import Image from "next/image";
import globalSvg from "../../public/global-processing.svg";
import specificSvg from "../../public/specific-processing.svg";
import {
  areTooCloseResults,
  getGeoCodeResultsForRecord,
  getGeoCodeResultsForRecords,
  isDoubtfulResults,
  mappingsIsReady,
} from "./lib";
import { SpecificProcessing } from "./SpecificProcessing";
import {
  CleanRecord,
  DirtyRecord,
  NoResultRecord,
  UncleanedRecord,
  WidgetCleanDataSteps,
} from "../../lib/cleanData/types";
import { cleanAndSortRecords } from "../../lib/cleanData/utils";
import GenericGlobalProcessing from "../../components/cleanData/GenericGlobalProcessing";
import { MyFooter } from "./Footer";

const GeoCodeur = () => {
  const [record, setRecord] = useState<RowRecord | null>();
  const [records, setRecords] = useState<RowRecord[]>([]);
  const [dirtyData, setDirtyData] = useState<{
    [recordId: number]: DirtyRecord<NormalizedGeocodeResult>;
  }>({});
  const [noResultData, setNoResultData] = useState<{
    [recordId: number]: NoResultRecord<NormalizedGeocodeResult>;
  }>({});
  const [mappings, setMappings] = useState<WidgetColumnMap | null>(null);
  const [globalInProgress, setGlobalInProgress] = useState(false);
  const [atOnProgress, setAtOnProgress] = useState<[number, number]>([0, 0]);
  const [currentStep, setCurrentStep] =
    useState<WidgetCleanDataSteps>("loading");

  useGristEffect(() => {
    gristReady("full", Object.values(COLUMN_MAPPING_NAMES));

    grist.onRecords((records, gristMappings) => {
      setRecords(records);
      setMappings(gristMappings);
    });
  }, []);

  useGristEffect(() => {
    grist.onRecord((rec: RowRecord | null) => {
      setRecord(rec);
    });
  }, []);

  useEffect(() => {
    if (["loading", "config"].includes(currentStep)) {
      if (mappingsIsReady(mappings)) {
        setCurrentStep("menu");
      } else {
        setCurrentStep("config");
      }
    }
  }, [mappings, currentStep]);

  const goBackToMenu = () => {
    setCurrentStep("menu");
  };

  const globalResearch = async () => {
    setCurrentStep("global_processing");
    setGlobalInProgress(true);
    const callBackFunction = (
      dataFromApi: UncleanedRecord<NormalizedGeocodeResult>[],
      at: number,
      on: number,
    ) => {
      setAtOnProgress([at, on]);
      const { clean, dirty, noResult } = cleanAndSortRecords(
        dataFromApi,
        isDoubtfulResults,
        areTooCloseResults,
      );
      writeCleanDataInTable(clean);
      setDirtyData((prevState) => ({ ...prevState, ...dirty }));
      setNoResultData((prevState) => ({ ...prevState, ...noResult }));
    };
    await getGeoCodeResultsForRecords(records, mappings!, callBackFunction);
    setGlobalInProgress(false);
  };

  const recordResearch = async () => {
    if (record) {
      setCurrentStep("specific_processing");
      // Delete data corresponding to this record in dirty and noResult states
      setDirtyData((prevState) => {
        delete prevState[record.id];
        return prevState;
      });
      setNoResultData((prevState) => {
        delete prevState[record.id];
        return prevState;
      });
      const recordUncleanedData = await getGeoCodeResultsForRecord(
        record,
        mappings!,
      );
      const { clean, dirty, noResult } = cleanAndSortRecords(
        [recordUncleanedData],
        isDoubtfulResults,
        areTooCloseResults,
      );
      if (clean) {
        writeCleanDataInTable(clean);
      }
      if (dirty) {
        setDirtyData((prevState) => ({ ...prevState, ...dirty }));
      }
      if (noResult) {
        setNoResultData((prevState) => ({ ...prevState, ...noResult }));
      }
    }
  };

  const writeCleanDataInTable = (cleanData: {
    [recordId: number]: CleanRecord<NormalizedGeocodeResult>;
  }) => {
    Object.values(cleanData).forEach(
      (clean: CleanRecord<NormalizedGeocodeResult>) => {
        if (clean.lat && clean.lng) {
          const data = {
            [COLUMN_MAPPING_NAMES.LATITUDE.name]: clean.lat,
            [COLUMN_MAPPING_NAMES.LONGITUDE.name]: clean.lng,
            [COLUMN_MAPPING_NAMES.NORMALIZED_ADDRESS.name]:
              clean.address_normalized,
          };
          addObjectInRecord(clean.recordId, grist.mapColumnNamesBack(data));
        } else {
          setNoResultData((prevValue) => ({
            ...prevValue,
            [clean.recordId]: {
              recordId: clean.recordId,
              noResultMessage: NO_DATA_MESSAGES.NO_DESTINATION_DATA,
              result: clean,
            },
          }));
        }
      },
    );
  };

  const passDataFromDirtyToClean = (
    addressSelected: NormalizedGeocodeResult,
    initalData: DirtyRecord<NormalizedGeocodeResult>,
  ) => {
    // Remove the record from dirtyData
    setDirtyData(() => {
      const { [initalData.recordId]: id, ...newDirtyData } = dirtyData;
      return newDirtyData;
    });
    writeCleanDataInTable({
      [initalData.recordId]: {
        ...addressSelected,
        recordId: initalData.recordId,
        sourceData: initalData.sourceData,
      },
    });
  };

  return currentStep === "loading" ? (
    <Title title={TITLE} />
  ) : currentStep === "config" ? (
    <div>
      <Title title={TITLE} />
      <Configuration>
        <Instructions />
      </Configuration>
      <MyFooter />
    </div>
  ) : currentStep === "menu" ? (
    <div>
      <Title title={TITLE} />
      <div className="menu">
        <div className="centered-column">
          <Image priority src={globalSvg} alt="Traitement global" />
          <h2>Traitement global</h2>
          <p>
            Lancer une recherche globale sur l&apos;ensemble des lignes
            n&apos;ayant pas de geocodage de renseigné.
          </p>
          <button className="primary" onClick={globalResearch}>
            Recherche globale
          </button>
        </div>
        <div className="divider"></div>
        <div className="centered-column">
          <Image priority src={specificSvg} alt="Traitement spécifique" />
          <h2>Traitement spécifique</h2>
          <p>
            Lancer une recherche spécifique du geocodage de la ligne
            sélectionnée.
          </p>
          <button className="primary" onClick={recordResearch}>
            Recherche spécifique
          </button>
        </div>
      </div>
      <Instructions />
      <MyFooter />
    </div>
  ) : currentStep === "global_processing" ? (
    <div>
      <div className="centered-column">
        <Title title={TITLE} />
        <Image priority src={globalSvg} alt="traitement global" />
        <GenericGlobalProcessing
          dirtyData={dirtyData}
          noResultData={noResultData}
          globalInProgress={globalInProgress}
          atOnProgress={atOnProgress}
          recordResearch={recordResearch}
          goBackToMenu={goBackToMenu}
          researchObjectName="Les GeoCodes"
        />
      </div>
      <MyFooter />
    </div>
  ) : (
    currentStep === "specific_processing" && (
      <div>
        <div className="centered-column">
          <Title title={TITLE} />
          <Image priority src={specificSvg} alt="traitement spécifique" />
          <SpecificProcessing
            mappings={mappings}
            record={record}
            dirtyData={record && dirtyData[record.id]}
            noResultData={record && noResultData[record.id]}
            passDataFromDirtyToClean={passDataFromDirtyToClean}
            recordResearch={recordResearch}
            goBackToMenu={goBackToMenu}
          />
        </div>
        <MyFooter />
      </div>
    )
  );
};

export default GeoCodeur;
