"use client";

import { useEffect, useState } from "react";
import { useGristEffect } from "../../lib/grist/hooks";
import { gristReady } from "../../lib/grist/plugin-api";
import { RowRecord } from "grist/GristData";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { COLUMN_MAPPING_NAMES, TITLE } from "./constants";
import "./page.css";
import {
  checkIfRecordsCoordinatesAreInQpv,
  loadQPVData,
  logError,
  mappingsIsReady,
  writeInGrist,
} from "./lib";
import { QPVData, QPVWidgetSteps } from "./types";
import { Title } from "../../components/Title";
import { MyFooter } from "./Footer";
import { Instructions } from "./Instructions";
import { MappedRecordForUpdate } from "../../lib/util/types";

const Qpv = () => {
  const [records, setRecords] = useState<RowRecord[]>([]);
  const [mappings, setMappings] = useState<WidgetColumnMap | null>(null);
  const [currentStep, setCurrentStep] = useState<QPVWidgetSteps>("loading");
  const [resultMessage, setResultMessage] = useState({
    message: `Cliquez sur "Analyser les coordonnées" pour lancer l'analyse.`,
    type: "neutral",
  });
  const [summary, setSummary] = useState<string>("");

  const [qpvData, setQpvData] = useState<QPVData | undefined>(undefined);

  useGristEffect(() => {
    console.log("Données reçues:", records.length, "enregistrements");

    gristReady("full", Object.values(COLUMN_MAPPING_NAMES));

    grist.onRecords((records, gristMappings) => {
      setRecords(records);
      setMappings(gristMappings);
    });
  }, []);

  useEffect(() => {
    //  Vérification du mapping des colonnes pour le bon fonctionnement du widget
    if (currentStep === "loading") {
      if (mappingsIsReady(mappings)) {
        setCurrentStep("qpv_data_loading");
      } else {
        setCurrentStep("loading");
      }
    }
  }, [mappings, currentStep]);

  useEffect(() => {
    // Charger les données QPV dès que le composant est mounted et que le mapping des colonnes est validé
    if (currentStep === "qpv_data_loading") {
      const loadData = async () => {
        console.log("Chargement des données QPV...");
        try {
          const loadedQpvData = await loadQPVData();

          if (loadedQpvData && loadedQpvData.features) {
            console.log(
              `Données QPV chargées: ${loadedQpvData.features.length} quartiers prioritaires`,
            );
            setQpvData(loadedQpvData);
            setCurrentStep("menu");
            setResultMessage({
              message:
                "Données QPV chargées avec succès. Cliquez sur 'Analyser les coordonnées' pour lancer l'analyse.",
              type: "success",
            });
          } else {
            logError(
              "Les données QPV ont été chargées et pourtant qpvData est vide",
              loadedQpvData,
              setResultMessage,
            );
          }
        } catch (error) {
          logError(
            "Erreur lors du chargement des données QPV",
            error,
            setResultMessage,
          );
        }
      };

      loadData();
    }
  }, [currentStep]);

  // Analyser les coordonnées et mettre à jour les colonnes
  async function analyzeAllCoordinates() {
    console.log("Début de l'analyse des coordonnées...");
    try {
      // Préparer les mises à jour
      const updates: MappedRecordForUpdate[] = [];
      const stats = {
        validCount: 0,
        qpvCount: 0,
        invalidCount: 0,
      };

      checkIfRecordsCoordinatesAreInQpv(records, qpvData!, updates, stats);

      // Effectuer les mises à jour en bloc avec docApi.applyUserActions
      try {
        await writeInGrist(updates);

        // Afficher le résumé
        const totalCount = records.length;
        setResultMessage({
          message: `Analyse terminée pour ${totalCount} enregistrements. ${updates.length} enregistrements mis à jour avec succès. 
          Rafraîchissez la page si les mises à jour ne sont pas visibles.\n
          Résultats: ${stats.qpvCount} sur ${stats.validCount} adresses en QPV (${stats.invalidCount} adresses avec coordonnées invalides)`,
          type: "success",
        });

        setSummary(
          `Total: ${totalCount} | En QPV: ${stats.qpvCount} | Hors QPV: ${stats.validCount - stats.qpvCount} | Invalides: ${stats.invalidCount}`,
        );
      } catch (error) {
        logError(
          "Erreur lors de la mise à jour des enregistrements",
          error,
          setResultMessage,
        );
      }
    } catch (error) {
      logError("Erreur lors de l'analyse", error, setResultMessage);
    }
  }

  return currentStep === "loading" ? (
    <Title title={TITLE} />
  ) : currentStep === "qpv_data_loading" ? (
    <div>
      <Title title={TITLE} />
      <div className="loading" id="loadingData">
        <p>Chargement des données QPV...</p>
        <span className="loader"></span>
      </div>
    </div>
  ) : (
    currentStep === "menu" && (
      <div>
        <Title title={TITLE} />

        <div className="menu">
          <div className="centered-column">
            <div id="result" className="neutral">
              <div id="resultText" className={resultMessage.type}>
                {resultMessage.message}
              </div>
            </div>
            <div className="settings-panel">
              <button
                className="primary"
                onClick={analyzeAllCoordinates}
                id="analyzeButton"
              >
                Analyser les coordonnées
              </button>
            </div>

            {summary !== "" && (
              <div className="summary" id="summary">
                {summary}
              </div>
            )}
          </div>
        </div>
        <Instructions />
        <MyFooter />
      </div>
    )
  );
};

export default Qpv;
