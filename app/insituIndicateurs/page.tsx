"use client";

import { useEffect, useState } from "react";
import { useGristEffect } from "../../lib/grist/hooks";
import { addObjectInRecord, gristReady } from "../../lib/grist/plugin-api";
import { COLUMN_MAPPING_NAMES, TITLE } from "./constants";
import { getInsituIndicateursResultsForRecords, mappingsIsReady } from "./lib";
import {
  FetchIndicateurReturnType,
  InsituIndicSteps,
  NarrowedTypeIndicateur,
} from "./types";
import { RowRecord } from "grist/GristData";
import { Title } from "../../components/Title";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { Configuration } from "../../components/Configuration";
import { Instructions } from "./Instructions";
import { MyFooter } from "./Footer";

const InseeCode = () => {
  const [records, setRecords] = useState<RowRecord[]>([]);
  const [mappings, setMappings] = useState<WidgetColumnMap | null>(null);
  const [currentStep, setCurrentStep] = useState<InsituIndicSteps>("loading");
  const [globalError, setGlobalError] = useState<string>("");

  useGristEffect(() => {
    gristReady("full", Object.values(COLUMN_MAPPING_NAMES));

    grist.onRecords((records, gristMappings) => {
      setRecords(records);
      setMappings(gristMappings);
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

  const updateIndicateurs = async (checkDestinationIsEmpty: boolean) => {
    const callBackFunction = (
      dataFromApi: FetchIndicateurReturnType<NarrowedTypeIndicateur> | null,
      error: string | null,
      errorByRecord: { recordId: number; error: string }[] | null,
    ) => {
      if (dataFromApi) {
        writeDataInTable(dataFromApi);
      }
      if (errorByRecord) {
        writeErrorsInTable(errorByRecord);
      }
      if (error) {
        setGlobalError(error);
      }
    };
    setGlobalError("");
    getInsituIndicateursResultsForRecords(
      records,
      mappings!,
      callBackFunction,
      checkDestinationIsEmpty,
    );
  };

  const writeErrorsInTable = (
    errorByRecord: { recordId: number; error: string }[],
  ) => {
    errorByRecord.forEach((error) => {
      const data = {
        [COLUMN_MAPPING_NAMES.VALEUR_INDICATEUR.name]: error.error,
      };
      addObjectInRecord(error.recordId, grist.mapColumnNamesBack(data));
    });
  };

  const writeDataInTable = (
    dataFromApi: FetchIndicateurReturnType<NarrowedTypeIndicateur>,
  ) => {
    Object.entries(dataFromApi.mailles).forEach(([recordId, indicateur]) => {
      let valeurIndicateur;
      if (indicateur) {
        switch (indicateur.__typename) {
          case "IndicateurOneValue":
            valeurIndicateur = indicateur.valeur;
            break;
          case "IndicateurRow":
            valeurIndicateur = new String(Object.values(indicateur.row)[0]);
            break;
          case "IndicateurRows":
          case "IndicateurListe":
          case "IndicateurListeGeo":
            valeurIndicateur = indicateur.count;
            break;
          default:
            valeurIndicateur = "Erreur";
        }
      }
      const data = {
        [COLUMN_MAPPING_NAMES.VALEUR_INDICATEUR.name]: valeurIndicateur,
      };
      addObjectInRecord(
        parseInt(recordId.split("recordId_")[1]),
        grist.mapColumnNamesBack(data),
      );
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
      {globalError && (
        <div className="alert-error">
          <div>
            <span>Erreur</span> : {globalError}
          </div>
        </div>
      )}
      <div className="menu">
        <div className="centered-column">
          <h2>Compléter les champs vides</h2>
          <p>
            Lancer une recherche globale sur l&apos;ensemble des lignes
            n&apos;ayant pas d'indicateur renseigné.
          </p>
          <button
            className="primary"
            onClick={() => {
              updateIndicateurs(true);
            }}
          >
            Première recherche
          </button>
        </div>
        <div className="divider"></div>
        <div className="centered-column">
          <h2>Mise à jour</h2>
          <p>
            Lancer une recherche globale sur l&apos;ensemble des lignes. Les
            lignes ayant déjà un indicateur de renseigné seront mis à jour
            (l&apos;ancienne valeur sera écrasée).
          </p>
          <button
            className="primary"
            onClick={() => {
              updateIndicateurs(false);
            }}
          >
            Mise à jour
          </button>
        </div>
      </div>
      <Instructions />
      <MyFooter />
    </div>
  ) : currentStep === "init_processing" ? (
    <div>
      <div className="centered-column">
        <Title title={TITLE} />
      </div>
      <MyFooter />
    </div>
  ) : (
    currentStep === "update_processing" && (
      <div>
        <div className="centered-column">
          <Title title={TITLE} />
        </div>
        <MyFooter />
      </div>
    )
  );
};

export default InseeCode;
