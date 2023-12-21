"use client";

import { useEffect, useState } from "react";
import { useGristEffect } from "../../lib/grist/hooks";
import { addObjectInRecord, gristReady } from "../../lib/grist/plugin-api";
import { COLUMN_MAPPING_NAMES, NO_DATA_MESSAGES, TITLE } from "./constants";
import {
  areTooCloseResults,
  getInseeCodeResultsForRecord,
  getInseeCodeResultsForRecords,
  isDoubtfulResults,
  mappingsIsReady,
} from "./lib";
import { NormalizedInseeResult } from "./types";
import { RowRecord } from "grist/GristData";
import { Title } from "../../components/Title";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { Configuration } from "../../components/Configuration";
import Image from "next/image";
import globalSvg from "../../public/global-processing.svg";
import specificSvg from "../../public/specific-processing.svg";
import { Instructions } from "./Instructions";
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

const InseeCode = () => {
  const [record, setRecord] = useState<RowRecord | null>();
  const [records, setRecords] = useState<RowRecord[]>([]);
  const [dirtyData, setDirtyData] = useState<{
    [recordId: number]: DirtyRecord<NormalizedInseeResult>;
  }>({});
  const [noResultData, setNoResultData] = useState<{
    [recordId: number]: NoResultRecord<NormalizedInseeResult>;
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
      mappingsIsReady(mappings)
        ? setCurrentStep("menu")
        : setCurrentStep("config");
    }
  }, [mappings, currentStep]);

  const goBackToMenu = () => {
    setCurrentStep("menu");
  };

  const globalResearch = async () => {
    setCurrentStep("global_processing");
    setGlobalInProgress(true);
    const callBackFunction = (
      dataFromApi: UncleanedRecord<NormalizedInseeResult>[],
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
    await getInseeCodeResultsForRecords(records, mappings!, callBackFunction);
    setGlobalInProgress(false);
  };

  const recordResearch = async () => {
    if (record) {
      setCurrentStep("specific_processing");
      // TODO : delete data corresponding to this record in dirty and noResult states
      const recordUncleanedData = await getInseeCodeResultsForRecord(
        record,
        mappings!,
      );
      const { clean, dirty, noResult } = cleanAndSortRecords(
        [recordUncleanedData],
        isDoubtfulResults,
        areTooCloseResults,
      );
      clean && writeCleanDataInTable(clean);
      dirty && setDirtyData((prevState) => ({ ...prevState, ...dirty }));
      noResult &&
        setNoResultData((prevState) => ({ ...prevState, ...noResult }));
    }
  };

  const writeCleanDataInTable = (cleanData: {
    [recordId: number]: CleanRecord<NormalizedInseeResult>;
  }) => {
    Object.values(cleanData).forEach(
      (clean: CleanRecord<NormalizedInseeResult>) => {
        if (clean.code_insee) {
          const data = {
            [COLUMN_MAPPING_NAMES.CODE_INSEE.name]: clean.code_insee,
            [COLUMN_MAPPING_NAMES.LIB_GROUPEMENT.name]: clean.lib_groupement,
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
    inseeCodeSelected: NormalizedInseeResult,
    initalData: DirtyRecord<NormalizedInseeResult>,
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

  return currentStep === "loading" ? (
    <Title title={TITLE} />
  ) : currentStep === "config" ? (
    <div>
      <Title title={TITLE} />
      <Configuration>
        <Instructions />
      </Configuration>
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
            n&apos;ayant pas de code INSEE de renseigné.
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
            Lancer une recherche spécifique du code INSEE de la ligne
            sélectionnée.
          </p>
          <button className="primary" onClick={recordResearch}>
            Recherche spécifique
          </button>
        </div>
      </div>
      <Instructions />
    </div>
  ) : currentStep === "global_processing" ? (
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
        researchObjectName="Les codes INSEE"
      />
    </div>
  ) : (
    currentStep === "specific_processing" && (
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
    )
  );
};

export default InseeCode;
