"use client";

import { useEffect, useState } from "react";
import { useGristEffect } from "../../lib/grist/hooks";
import { gristReady, addObjectInRecord } from "../../lib/grist/plugin-api";
import { RowRecord } from "grist/GristData";
import { CleanGeoCodeRecord, NormalizedGeocodeResult } from "./types";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { COLUMN_MAPPING_NAMES, NO_DATA_MESSAGES, TITLE } from "./constants";
import { Configuration } from "../../components/Configuration";
import { Instructions } from "./Instructions";
import { Title } from "../../components/Title";
import Image from "next/image";
import globalSvg from "../../public/global-processing.svg";
import specificSvg from "../../public/specific-processing.svg";
import doneSvg from "../../public/done.svg";
import {
  cleanRecordsData,
  getGeoCodeResultsForRecord,
  getGeoCodeResultsForRecords,
  mappingsIsReady,
} from "./lib";
import { SpecificProcessing } from "./SpecificProcessing";
import {
  DirtyRecord,
  NoResultRecord,
  UncleanedRecord,
  WidgetCleanDataSteps,
} from "../../lib/util/types";

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
  const [atOnProgress, setAtOnProgress] = useState([0, 0]);
  const [currentStep, setCurrentStep] =
    useState<WidgetCleanDataSteps>("loading");

  useGristEffect(() => {
    gristReady("full", Object.values(COLUMN_MAPPING_NAMES));

    grist.onRecords((records, gristMappings) => {
      setRecords(records);
      setMappings(gristMappings);
    });
    // getGeoCodeDataFromApi(setResults, setMappings);
    // grist.onRecord((rec: RowRecord | null) => {
    //   const data = grist.mapColumnNames(rec!); // FIXME rec can be null...
    //   const mapRecord: MapRecord = {
    //     Latitude: data[COLUMN_MAPPING_NAMES.LATITUDE],
    //     Longitude: data[COLUMN_MAPPING_NAMES.LONGITUDE],
    //     addresse_Normalisee: data[COLUMN_MAPPING_NAMES.NORMALIZED_ADDRESS],
    //     id: rec!.id,
    //   };
    //   setRecord(mapRecord);
    // });
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
      dataFromApi: UncleanedRecord<NormalizedGeocodeResult>[],
      at: number,
      on: number,
    ) => {
      setAtOnProgress([at, on]);
      const { clean, dirty, noResult } = cleanRecordsData(dataFromApi);
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
      // TODO : delete data corresponding to this record in dirty and noResult states
      const recordUncleanedData = await getGeoCodeResultsForRecord(
        record,
        mappings!,
      );
      const { clean, dirty, noResult } = cleanRecordsData([
        recordUncleanedData,
      ]);
      clean && writeCleanDataInTable(clean);
      dirty && setDirtyData((prevState) => ({ ...prevState, ...dirty }));
      noResult &&
        setNoResultData((prevState) => ({ ...prevState, ...noResult }));
    }
  };

  const writeCleanDataInTable = (cleanData: {
    [recordId: number]: CleanGeoCodeRecord;
  }) => {
    Object.values(cleanData).forEach((clean: CleanGeoCodeRecord) => {
      if (clean.lat && clean.lng) {
        const data = {
          [COLUMN_MAPPING_NAMES.LATITUDE.name]: clean.lat,
          [COLUMN_MAPPING_NAMES.LONGITUDE.name]: clean.lng,
          [COLUMN_MAPPING_NAMES.NORMALIZED_ADDRESS.name]:
            clean.address_nomalized,
        };
        addObjectInRecord(clean.recordId, grist.mapColumnNamesBack(data));
      } else {
        setNoResultData((prevValue) => ({
          ...prevValue,
          [clean.recordId]: {
            recordId: clean.recordId,
            noResultMessage: NO_DATA_MESSAGES.NO_INSEE_CODE,
            result: clean,
          },
        }));
      }
    });
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
        address: initalData.sourceData,
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
    </div>
  ) : currentStep === "global_processing" ? (
    <div className="centered-column">
      <Title title={TITLE} />
      <Image priority src={globalSvg} alt="traitement global" />
      {globalInProgress ? (
        <div className="centered-column">
          <h2>Traitement global en cours...</h2>
          <span className="loader"></span>
          <div className="px-2">
            {atOnProgress[0]} / {atOnProgress[1]}
          </div>
        </div>
      ) : (
        <div>
          <h2>Traitement global terminée</h2>
          <Image
            priority
            src={doneSvg}
            style={{ marginBottom: "1rem" }}
            alt="traitement spécifique terminé"
          />
          <p>
            Les Geo Codes de{" "}
            {Object.keys(dirtyData).length + Object.keys(noResultData).length}{" "}
            lignes n&apos;ont pu être trouvés automatiquement. Il se peut
            qu&apos;aucun ou plusieurs résultats correspondent aux noms des
            sources. Pour cela, utilisez la recherche spécifique.
          </p>
          <div>
            <button className="primary" onClick={recordResearch}>
              Recherche spécifique
            </button>
            <button className="secondary" onClick={goBackToMenu}>
              Retour à l'accueil
            </button>
          </div>
        </div>
      )}
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

export default GeoCodeur;
