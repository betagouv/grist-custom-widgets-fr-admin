"use client";

import { useEffect, useState } from "react";
import { useGristEffect } from "../../lib/grist/hooks";
import { addObjectInRecord, gristReady } from "../../lib/grist/plugin-api";
import { COLUMN_MAPPING_NAMES, NO_DATA_MESSAGES, TITLE } from "./constants";
import {
  areTooCloseResults,
  getSirenCodeResultsForRecord,
  getSirenCodeResultsForRecords,
  isDoubtfulResults,
  mappingsIsReady,
} from "./lib";
import { RowRecord } from "grist/GristData";
import { Title } from "../../components/Title";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { Configuration } from "../../components/Configuration";
import Image from "next/image";
import globalSvg from "../../public/global-processing.svg";
import specificSvg from "../../public/specific-processing.svg";
import { Instructions } from "./Instructions";
import { SpecificProcessing } from "./SpecificProcessing";
import { NormalizedSirenResult } from "./types";
import {
  CleanRecord,
  DirtyRecord,
  NoResultRecord,
  UncleanedRecord,
  WidgetCleanDataSteps,
} from "../../lib/cleanData/types";
import { CheckboxParams } from "../../components/CheckboxParams";
import { cleanAndSortRecords } from "../../lib/cleanData/utils";
import GenericGlobalProcessing from "../../components/cleanData/GenericGlobalProcessing";
import { MyFooter } from "./Footer";

const InseeCode = () => {
  const [record, setRecord] = useState<RowRecord | null>();
  const [records, setRecords] = useState<RowRecord[]>([]);
  const [dirtyData, setDirtyData] = useState<{
    [recordId: number]: DirtyRecord<NormalizedSirenResult>;
  }>({});
  const [noResultData, setNoResultData] = useState<{
    [recordId: number]: NoResultRecord<NormalizedSirenResult>;
  }>({});
  const [mappings, setMappings] = useState<WidgetColumnMap | null>(null);
  const [globalInProgress, setGlobalInProgress] = useState(false);
  const [atOnProgress, setAtOnProgress] = useState<[number, number]>([0, 0]);
  const [currentStep, setCurrentStep] =
    useState<WidgetCleanDataSteps>("loading");
  const [areCollectivitesTerritoriales, setAreCollectivitesTerritoriales] =
    useState<boolean>(false);

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
      dataFromApi: UncleanedRecord<NormalizedSirenResult>[],
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
    await getSirenCodeResultsForRecords(
      records,
      mappings!,
      callBackFunction,
      areCollectivitesTerritoriales,
    );
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
      const recordUncleanedData = await getSirenCodeResultsForRecord(
        record,
        mappings!,
        areCollectivitesTerritoriales,
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
    [recordId: number]: CleanRecord<NormalizedSirenResult>;
  }) => {
    Object.values(cleanData).forEach(
      (clean: CleanRecord<NormalizedSirenResult>) => {
        if (clean.siren) {
          const data = {
            [COLUMN_MAPPING_NAMES.SIREN.name]: clean.siren,
            [COLUMN_MAPPING_NAMES.NORMALIZED_NAME.name]: clean.label,
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
    inseeCodeSelected: NormalizedSirenResult,
    initalData: DirtyRecord<NormalizedSirenResult>,
  ) => {
    // Remove the record from dirtyData
    setDirtyData(() => {
      const { [initalData.recordId]: id, ...newDirtyData } = dirtyData;
      return newDirtyData;
    });
    writeCleanDataInTable({
      [initalData.recordId]: {
        ...inseeCodeSelected,
        recordId: initalData.recordId,
        sourceData: initalData.sourceData,
      },
    });
  };

  const collectivitesTerritorialesCheckbox = (
    <div className="centered-column">
      <CheckboxParams
        label="La recherche concerne des collectivités territoriales"
        value={areCollectivitesTerritoriales}
        onChange={() =>
          setAreCollectivitesTerritoriales(!areCollectivitesTerritoriales)
        }
      />
    </div>
  );

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
      {collectivitesTerritorialesCheckbox}
      <div className="menu">
        <div className="centered-column">
          <Image priority src={globalSvg} alt="Traitement global" />
          <h2>Traitement global</h2>
          <p>
            Lancer une recherche globale sur l&apos;ensemble des lignes
            n&apos;ayant pas de code SIREN de renseigné.
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
            Lancer une recherche spécifique du code SIREN de la ligne
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
        {collectivitesTerritorialesCheckbox}
        <Image priority src={globalSvg} alt="traitement global" />
        <GenericGlobalProcessing
          dirtyData={dirtyData}
          noResultData={noResultData}
          globalInProgress={globalInProgress}
          atOnProgress={atOnProgress}
          recordResearch={recordResearch}
          goBackToMenu={goBackToMenu}
          researchObjectName="Les codes SIREN"
        />
      </div>
      <MyFooter />
    </div>
  ) : (
    currentStep === "specific_processing" && (
      <div>
        <div className="centered-column">
          <Title title={TITLE} />
          {collectivitesTerritorialesCheckbox}
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

export default InseeCode;
