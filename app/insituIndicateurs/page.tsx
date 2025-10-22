"use client";

import { useEffect, useState } from "react";
import { useGristEffect } from "../../lib/grist/hooks";
import { addObjectInRecord, gristReady } from "../../lib/grist/plugin-api";
import {
  COLUMN_MAPPING_NAMES,
  DESCRIPTION_COLONNE_INDICATEUR,
  TITLE,
} from "./constants";
import {
  getInsituIndicateursResultsForRecords,
  listObjectToString,
  mappingsIsReady,
} from "./lib";
import {
  FetchIndicateurReturnType,
  InsituIndicSteps,
  Metadata,
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
  const [metadata, setMetadata] = useState<Metadata>();
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [identifiantIndicateur, setIdentifiantIndicateur] =
    useState<string>("");
  const [wantIndicateurDetail, setWantIndicateurDetail] =
    useState<boolean>(false);
  const [globalIndicateurUpdate, setGlobalIndicateurUpdate] =
    useState<boolean>(true);

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
        setMetadata(dataFromApi.metadata);
        writeDataInTable(dataFromApi, stats);
      }
      if (errorByRecord) {
        writeErrorsInTable(errorByRecord);
      }
      if (error) {
        setGlobalError(error);
      }
      // Mettre à jour le feedback après le traitement des données
      setFeedback(
        `Total de lignes : ${records.length} | 
        Lignes à mettre à jour : ${stats.toUpdateCount} | 
        Lignes mises à jour : ${stats.updatedCount} | 
        Invalides : ${stats.invalidCount}`,
      );
    };
    setGlobalError("");
    setFeedback("Traitement en cours...");
    getInsituIndicateursResultsForRecords(
      identifiantIndicateur,
      records,
      callBackFunction,
      checkDestinationIsEmpty,
      stats,
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
            if (wantIndicateurDetail) {
              valeurIndicateur = listObjectToString(indicateur.rows);
            } else {
              valeurIndicateur = indicateur.count;
            }
            break;
          case "IndicateurListe":
            if (wantIndicateurDetail) {
              valeurIndicateur = indicateur.liste.join(", ");
            } else {
              valeurIndicateur = indicateur.count;
            }
            break;
          case "IndicateurListeGeo":
            if (wantIndicateurDetail) {
              valeurIndicateur = indicateur.properties.join(", ");
            } else {
              valeurIndicateur = indicateur.count;
            }
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
          Colonne sélectionnée :{" "}
          <span className="tag validated semi-bold">
            {mappings![COLUMN_MAPPING_NAMES.VALEUR_INDICATEUR.name]}
          </span>
        </p>
        <p>
          Consulter{" "}
          <a
            href="https://catalogue-indicateurs.donnees.incubateur.anct.gouv.fr/"
            target="_blank"
            title="Lien catalogue d'indicateur de l'ANCT - ouvre une nouvelle fenêtre"
          >
            le catalogue d'indicateurs de l'ANCT
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
        <div className="advice">
          <span className="text-to-copy">
            Nous vous conseillons d'ajouter une description à votre colonne pour
            ne pas perdre la trace de l'identifiant utilisé :
            <br />
            Exemple : « {DESCRIPTION_COLONNE_INDICATEUR}
            <i>
              {identifiantIndicateur.length > 0
                ? identifiantIndicateur
                : "renseignez un identifiant d'indicateur"}
            </i>{" "}
            »
          </span>
          <button className="secondary copied" onClick={handleCopyClick}>
            {" "}
            {isCopied ? "Copié !" : "Copier"}
          </button>
        </div>
        <div className="radio-button">
          Je souhaite récupérer :
          <label>
            <input
              type="radio"
              name="wantIndicateurDetail"
              value="false"
              checked={wantIndicateurDetail === false}
              onChange={() => setWantIndicateurDetail(!wantIndicateurDetail)}
            />
            Le décompte de l'indicateur (Ex: Nombre de villes concernées par le
            programme)
          </label>
          <label>
            <input
              type="radio"
              name="wantIndicateurDetail"
              value="true"
              checked={wantIndicateurDetail === true}
              onChange={() => setWantIndicateurDetail(!wantIndicateurDetail)}
            />
            Le détail de l'indicateur (Ex : Liste des villes concernées par le
            programme)
          </label>
        </div>
        <div className="radio-button">
          Je souhaite lancer une recherche sur :
          <label>
            <input
              type="radio"
              name="globalIndicateurUpdate"
              value="true"
              checked={globalIndicateurUpdate === true}
              onChange={() =>
                setGlobalIndicateurUpdate(!globalIndicateurUpdate)
              }
            />
            L'ensemble des lignes
          </label>
          <label>
            <input
              type="radio"
              name="globalIndicateurUpdate"
              value="false"
              checked={globalIndicateurUpdate === false}
              onChange={() =>
                setGlobalIndicateurUpdate(!globalIndicateurUpdate)
              }
            />
            Seulement les lignes vides
          </label>
        </div>
        {globalError && (
          <div className="alert-error">
            <div>
              <span>Erreur</span> : {globalError}
            </div>
          </div>
        )}
        <div className="centered-column">
          <button
            className="primary"
            onClick={() => {
              updateIndicateurs(!globalIndicateurUpdate);
            }}
            disabled={identifiantIndicateur.length === 0}
          >
            Lancer la recherche
          </button>
        </div>
        {feedback !== "" && <div className="summary">{feedback}</div>}
        {metadata && (
          <div className="metadata">
            Meta données de l'indicateur :
            <ul>
              <li>Nom : {metadata?.nom}</li>
              <li>Description : {metadata?.description}</li>
              <li>Mailles disponibles : {metadata?.mailles?.join(", ")}</li>
              {metadata?.unite && <li>Unité : {metadata?.unite}</li>}
              {metadata?.returnType && (
                <li>Type d'indicateur : {metadata?.returnType}</li>
              )}
            </ul>
          </div>
        )}
        <Instructions />
        <MyFooter />
      </div>
    )
  );
};

export default InsituIndicateurs;
