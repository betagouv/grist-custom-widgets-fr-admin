"use client";

import { useEffect, useState } from "react";
import { useGristEffect } from "../../lib/grist/hooks";
import { gristReady } from "../../lib/grist/plugin-api";
import { RowRecord } from "grist/GristData";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { COLUMN_MAPPING_NAMES, TITLE } from "./constants";
import "./page.css";
import { checkPointInQPV, loadQPVData, logError, mappingsIsReady } from "./lib";
import { QPVData, QPVWidgetSteps } from "./types";
import { Title } from "../../components/Title";
import { Configuration } from "../../components/Configuration";
import { MyFooter } from "./Footer";
import { Instructions } from "./Instructions";

const Qpv = () => {
  const [records, setRecords] = useState<RowRecord[]>([]);
  const [mappings, setMappings] = useState<WidgetColumnMap | null>(null);
  const [currentStep, setCurrentStep] = useState<QPVWidgetSteps>("loading");
  const [resultMessage, setResultMessage] = useState({
    message: `Cliquez sur "Analyser les coordonnées" pour lancer l'analyse.`,
    type: "neutral",
  });
  const [percentLoaded, setPercentLoaded] = useState<number>(0);
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
    if (["loading", "config"].includes(currentStep)) {
      if (mappingsIsReady(mappings)) {
        setCurrentStep("qpv_data_loading");
      } else {
        setCurrentStep("config");
      }
    }
  }, [mappings, currentStep]);

  useEffect(() => {
    // Charger les données QPV dès que le composant est mounted et que le mapping des colonnes est validé
    if (currentStep === "qpv_data_loading") {
      const loadData = async () => {
        console.log("Chargement des données QPV...");
        try {
          const loadedQpvData = await loadQPVData((percentLoadedTmp) => {
            setPercentLoaded(percentLoadedTmp);
          });

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
              "Les données QPV ont été chargé et pourtant qpvData est vide",
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
      // Récupérer l'objet de table actif et son ID
      const table = await grist.getTable();
      const tableId = await table.getTableId();
      console.log(`Table ID: ${tableId}`);

      // Préparer les mises à jour
      const updates = [];
      let validCount = 0;
      let qpvCount = 0;
      let invalidCount = 0;

      // Traiter chaque enregistrement
      for (const record of records) {
        const mappedRecord = grist.mapColumnNames(record);
        const recordId = record.id;

        // Vérifier si les coordonnées sont valides
        const latValue = mappedRecord[COLUMN_MAPPING_NAMES.LATITUDE.name];
        const lonValue = mappedRecord[COLUMN_MAPPING_NAMES.LONGITUDE.name];
        const lat = parseFloat(latValue);
        const lon = parseFloat(lonValue);

        let isInQPV = false;
        let qpvName = "";
        let qpvCode = "";

        if (!isNaN(lat) && !isNaN(lon)) {
          validCount++;
          const result = checkPointInQPV(lon, lat, qpvData!);

          if (result.inQPV && result.qpvInfo.length > 0) {
            qpvCount++;
            isInQPV = true;
            qpvName = result.qpvInfo[0].nom;
            qpvCode = result.qpvInfo[0].code;
            console.log(
              `Adresse en QPV trouvée pour ID ${recordId}: ${qpvName} (${qpvCode})`,
            );
          }
        } else {
          // TODO : injecter cette information directement dans la ligne de la table grist
          invalidCount++;
          console.warn(
            `Coordonnées invalides pour ID ${recordId}: Latitude=${latValue}, Longitude=${lonValue}`,
          );
        }

        // Préparer la mise à jour
        const updateFields = {
          [COLUMN_MAPPING_NAMES.EST_QPV.name]: isInQPV,
          [COLUMN_MAPPING_NAMES.NOM_QPV.name]: isInQPV ? qpvName : "",
          [COLUMN_MAPPING_NAMES.CODE_QPV.name]: isInQPV ? qpvCode : "",
        };

        // Ajouter à la liste des mises à jour
        updates.push({
          id: recordId,
          fields: updateFields,
        });
      }

      // Effectuer les mises à jour en bloc avec docApi.applyUserActions
      try {
        // Construire les actions utilisateur
        const actions = [];

        for (const update of updates) {
          actions.push(["UpdateRecord", tableId, update.id, update.fields]);
        }

        // Appliquer toutes les actions en une seule transaction
        await grist.docApi.applyUserActions(actions);

        // Rafraîchir la vue
        await grist.viewApi.fetchSelectedTable();
        console.log("Vue rafraîchie avec fetchSelectedTable");

        // Afficher le résumé
        const totalCount = records.length;
        setResultMessage({
          message: `Analyse terminée pour ${totalCount} enregistrements. ${updates.length} enregistrements mis à jour avec succès. 
          Rafraîchissez la page si les mises à jour ne sont pas visibles.\n
          Résultats: ${qpvCount} sur ${validCount} adresses en QPV (${invalidCount} adresses avec coordonnées invalides)`,
          type: "success",
        });

        setSummary(
          `Total: ${totalCount} | En QPV: ${qpvCount} | Hors QPV: ${validCount - qpvCount} | Invalides: ${invalidCount}`,
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
  ) : currentStep === "config" ? (
    <div>
      <Title title={TITLE} />
      <Configuration>
        <Instructions />
      </Configuration>
      <MyFooter />
    </div>
  ) : currentStep === "qpv_data_loading" ? (
    <div>
      <Title title={TITLE} />
      <div className="loading" id="loadingData">
        <p>Chargement des données QPV...</p>
        <div className="progress">
          <div
            className="progress-bar"
            role="progressbar"
            aria-label="barre de progression"
            style={{ width: percentLoaded + "%" }}
          >
            {percentLoaded}%
          </div>
        </div>
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

            {summary != "" && (
              <div id="summaryContainer" className="summary-container">
                <div className="summary" id="summary">
                  {summary}
                </div>
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
