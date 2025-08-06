"use client";

import { useEffect, useState } from "react";
import { useGristEffect } from "../../lib/grist/hooks";
import { addObjectInRecord, gristReady } from "../../lib/grist/plugin-api";
import {
  COLUMN_MAPPING_NAMES,
  DESCRIPTION_COLONNE_INDICATEUR,
  TITLE,
} from "./constants";
import { getInsituIndicateursResultsForRecords, mappingsIsReady } from "./lib";
import {
  FetchIndicateurReturnType,
  InsituIndicSteps,
  NarrowedTypeIndicateur,
  Stats,
} from "./types";
import { RowRecord } from "grist/GristData";
import { Title } from "../../components/Title";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { Instructions } from "./Instructions";
import { MyFooter } from "./Footer";
import "./page.css";

const InsituIndicateurs = () => {
  const [records, setRecords] = useState<RowRecord[]>([]);
  const [mappings, setMappings] = useState<WidgetColumnMap | null>(null);
  const [currentStep, setCurrentStep] = useState<InsituIndicSteps>("loading");
  const [globalError, setGlobalError] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [identifiantIndicateur, setIdentifiantIndicateur] =
    useState<string>("");

  useGristEffect(() => {
    try {
      gristReady("full", Object.values(COLUMN_MAPPING_NAMES));

      grist.onRecords((records, gristMappings) => {
        setRecords(records);
        setMappings(gristMappings);
      });
    } catch (error) {
      console.error("Error during Grist initialization:", error);
      setGlobalError("Erreur lors de l'initialisation de Grist");
    }
  }, []);

  useEffect(() => {
    if (currentStep === "loading") {
      if (mappingsIsReady(mappings)) {
        setCurrentStep("menu");
      } else {
        setCurrentStep("loading");
      }
    }
  }, [mappings, currentStep]);

  const updateIndicateurs = async (checkDestinationIsEmpty: boolean) => {
    const stats: Stats = {
      toUpdateCount: 0,
      updatedCount: 0,
      invalidCount: 0,
    };
    const callBackFunction = (
      dataFromApi: FetchIndicateurReturnType<NarrowedTypeIndicateur> | null,
      error: string | null,
      errorByRecord: { recordId: number; error: string }[] | null,
    ) => {
      if (dataFromApi) {
        writeDataInTable(dataFromApi, stats);
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
      identifiantIndicateur,
      records,
      callBackFunction,
      checkDestinationIsEmpty,
      stats,
    );
    setFeedback(
      `Total de ligne: ${records.length} | Ligne à mettre à jour: ${stats.toUpdateCount} | Lignes mise à jour: ${stats.updatedCount} | Invalides: ${stats.invalidCount}`,
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
    stats: Stats,
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
      stats.updatedCount++;
    });
  };

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(
        DESCRIPTION_COLONNE_INDICATEUR + identifiantIndicateur,
      );
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return currentStep === "loading" ? (
    <div>
      <Title title={TITLE} />
      <div className="loading">
        <span className="loader"></span>
      </div>
      <Instructions />
      <MyFooter />
    </div>
  ) : (
    currentStep === "menu" && (
      <div>
        <Title title={TITLE} />
        <p>
          Consulter{" "}
          <a
            href="https://catalogue-indicateurs.donnees.incubateur.anct.gouv.fr/"
            target="_blank"
            title="Lien catalogue d'indicateur de l'ANCT - ouvre une nouvelle fenêtre"
          >
            le catalogue d'indicateur de l'ANCT
          </a>{" "}
          pour trouver l'indicateur qui vous intéresse, copiez son identifiant
          et collez le ci-dessous.
        </p>
        <label htmlFor="indicatorId">Identifiant de l'indicateur :</label>
        <input
          type="text"
          id="indicatorId"
          name="indicatorId"
          placeholder="Entrez l'identifiant de l'indicateur"
          defaultValue={identifiantIndicateur}
          onChange={(event) => setIdentifiantIndicateur(event.target.value)}
        />
        <>
          <p>
            Nous vous conseillons d'ajouter une description à votre colonne pour
            ne pas perdre la trace de l'identifiant utilisé.
          </p>
          <div className="code-copy">
            <span className="text-to-copy">
              {DESCRIPTION_COLONNE_INDICATEUR}
              <i>
                {identifiantIndicateur.length > 0
                  ? identifiantIndicateur
                  : "renseigner un identifiant d'indicateur"}
              </i>
            </span>
            <button className="secondary copied" onClick={handleCopyClick}>
              {" "}
              {isCopied ? "Copié!" : "Copier"}
            </button>
          </div>
        </>
        {globalError && (
          <div className="alert-error">
            <div>
              <span>Erreur</span> : {globalError}
            </div>
          </div>
        )}
        <div className="menu">
          <div className="centered-column">
            <h2>
              Compléter les champs vides de votre colonne{" "}
              {mappings![COLUMN_MAPPING_NAMES.VALEUR_INDICATEUR.name]}
            </h2>
            <p>
              Lancer une recherche globale sur l&apos;ensemble des lignes
              n&apos;ayant pas d'indicateur renseigné.
            </p>
            <button
              className="primary"
              onClick={() => {
                updateIndicateurs(true);
              }}
              disabled={identifiantIndicateur.length === 0}
            >
              Première recherche
            </button>
          </div>
          <div className="divider"></div>
          <div className="centered-column">
            <h2>
              Mise à jour de votre colonne{" "}
              {mappings![COLUMN_MAPPING_NAMES.VALEUR_INDICATEUR.name]}
            </h2>
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
              disabled={identifiantIndicateur.length === 0}
            >
              Mise à jour
            </button>
          </div>
        </div>
        {feedback !== "" && <div className="summary">{feedback}</div>}
        <Instructions />
        <MyFooter />
      </div>
    )
  );
};

export default InsituIndicateurs;
