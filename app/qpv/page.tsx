"use client";

import { useEffect, useState } from "react";
import { useGristEffect } from "../../lib/grist/hooks";
import { gristReady } from "../../lib/grist/plugin-api";
import { RowRecord } from "grist/GristData";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { COLUMN_MAPPING_NAMES } from "./constants";
import "./page.css";
import { checkPointInQPV, loadQPVData, logError, mappingsIsReady } from "./lib";
import { QPVData, QPVWidgetSteps } from "./types";

const Qpv = () => {
  const [records, setRecords] = useState<RowRecord[]>([]);
  const [mappings, setMappings] = useState<WidgetColumnMap | null>(null);
  const [currentStep, setCurrentStep] = useState<QPVWidgetSteps>("loading");
  const [resultMessage, setResultMessage] = useState({
    message: `Cliquez sur "Analyser les coordonnées" pour lancer l'analyse.`,
    type: "neutral",
  });
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
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
    // Charger les données QPV dès le composant est mounted et que le mapping des colonnes est validé
    if (currentStep === "qpv_data_loading") {
      const loadData = async () => {
        console.log("Chargement des données QPV...");
        try {
          setIsDataLoading(true);
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
            console.error(
              "Les données QPV sont vides alors qu'elles ne devraient pas l'être : ",
              loadedQpvData,
            );
            throw new Error(
              "Les données QPV ont été chargé et pourtant qpvData est vide",
            );
          }
        } catch (error) {
          logError(error, setResultMessage);
        } finally {
          setIsDataLoading(false);
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
        logError(error, setResultMessage);
      }
    } catch (error) {
      logError(error, setResultMessage);
    }
  }

  return (
    <>
      <h1>Vérificateur QPV</h1>

      <div className="container">
        <div className="instruction-message">
          <strong>Instructions :</strong> Ce widget vérifie si des adresses se
          trouvent dans des Quartiers Prioritaires de la Ville (QPV).
          <p>
            Pour l'utiliser, configurez vos colonnes préalablement existantes
            via le panneau de création :
          </p>
          <ul>
            <li>
              <strong>Latitude</strong> et <strong>Longitude</strong> : Indiquez
              les colonnes contenant les coordonnées à vérifier
            </li>
            <li>
              <strong>Est en QPV</strong> : Indiquez la colonne (de type
              booléen) qui affichera Vrai si l'adresse est en QPV, Faux sinon
            </li>
            <li>
              <strong>Nom du QPV</strong> : Indiquez la colonne qui affichera le
              nom du QPV, si l'adresse s'y trouve.
            </li>
            <li>
              <strong>Code du QPV</strong> : Sélectionnez la colonne qui
              affichera le code du QPV, si l'adresse s'y trouve.
            </li>
          </ul>
          <p>
            Une fois configuré, cliquez sur "Analyser les coordonnées" pour
            lancer l'analyse et remplir les colonnes de résultats.
          </p>
        </div>

        <div className="settings-panel">
          <button id="analyzeButton" onClick={analyzeAllCoordinates}>
            Analyser les coordonnées
          </button>
        </div>

        {isDataLoading && (
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
        )}

        <div id="result" className="neutral">
          <div id="resultText" className={resultMessage.type}>
            {resultMessage.message}
          </div>
        </div>

        {summary != "" && (
          <div id="summaryContainer" className="summary-container">
            <div className="summary" id="summary">
              {summary}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Qpv;
