import { useEffect, useState } from "react";
import { useGristEffect } from "../../lib/grist/hooks";
import { gristReady } from "../../lib/grist/plugin-api";
import { RowRecord } from "grist/GristData";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { COLUMN_MAPPING_NAMES } from "./constants";
import "./page.css";
import { checkPointInQPV, loadQPVData, mappingsIsReady } from "./lib";
import { QPVData, QPVWidgetSteps } from "./types";

const Qpv = () => {
  const [records, setRecords] = useState<RowRecord[]>([]);
  const [mappings, setMappings] = useState<WidgetColumnMap | null>(null);
  const [currentStep, setCurrentStep] = useState<QPVWidgetSteps>("loading");
  const [resultMessage, setResultMessage] = useState({
    message: `Cliquez sur "Analyser les coordonnées" pour lancer l'analyse.`,
    type: "neutral",
  });
  const [qpvData, setQpvData] = useState<QPVData>();
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);

  useGristEffect(() => {
    console.log("Données reçues:", records.length, "enregistrements");

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

  // Charger les données QPV dès le début
  if (!isDataLoaded) {
    loadQPVData2().catch((error) => {
      console.error(`Erreur lors du chargement initial: ${error.message}`);
    });
  }

  async function loadQPVData2() {
    const progressBar = document.querySelector(".progress-bar");

    console.log("Chargement des données QPV...");

    try {
      setIsDataLoading(true);
      // TODO : ca va pas du tout !!! il faut que ce soit intégré à la fonction setQPVData
      setQpvData(
        await loadQPVData((percentLoaded) => {
          progressBar.style.width = percentLoaded + "%";
          progressBar.textContent = percentLoaded + "%";
        }),
      );

      console.log(
        `Données QPV chargées: ${qpvData.features.length} quartiers prioritaires`,
      );
      setIsDataLoading(false);
      setIsDataLoaded(true);

      setResultMessage({
        message:
          "Données QPV chargées avec succès. Cliquez sur 'Analyser les coordonnées' pour lancer l'analyse.",
        type: "success",
      });

      return qpvData;
    } catch (error) {
      setIsDataLoading(false);
      console.error(
        `Erreur lors du chargement des données QPV: ${error.message}`,
      );
      setResultMessage({
        message: `Erreur lors du chargement des données QPV: ${error.message}`,
        type: "error",
      });
      throw error;
    }
  }

  // Analyser les coordonnées et mettre à jour les colonnes
  async function analyzeAllCoordinates() {
    try {
      console.log("Début de l'analyse des coordonnées...");

      // Charger les données QPV si ce n'est pas déjà fait
      if (!isDataLoaded || qpvData === undefined) {
        await loadQPVData2();
      }

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
          const result = checkPointInQPV(lon, lat, qpvData);

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

        console.log(`Mise à jour préparée pour l'enregistrement ${recordId}:`);
        console.log(`Est QPV: ${isInQPV}`);
        console.log(`Nom QPV: ${isInQPV ? qpvName : "(vide)"}`);
        console.log(`Code QPV: ${isInQPV ? qpvCode : "(vide)"}`);

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

        document.getElementById("summaryContainer").style.display = "block";
        document.getElementById("summary").textContent =
          `Total: ${totalCount} | En QPV: ${qpvCount} | Hors QPV: ${validCount - qpvCount} | Invalides: ${invalidCount}`;
      } catch (error) {
        console.error(
          `Erreur lors de la mise à jour des enregistrements: ${error.message}`,
        );
        setResultMessage({
          message: `Erreur lors de la mise à jour des enregistrements: ${error.message}`,
          type: "error",
        });
      }
    } catch (error) {
      console.error(`Erreur lors de l'analyse: ${error.message}`);
      setResultMessage({
        message: `Erreur lors de l'analyse: ${error.message}`,
        type: "error",
      });
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
              >
                0%
              </div>
            </div>
          </div>
        )}

        <div id="result" className="neutral">
          <div id="resultText" className={resultMessage.type}>
            {resultMessage.message}
          </div>
        </div>

        <div id="summaryContainer" className="summary-container">
          <div className="summary" id="summary"></div>
        </div>
      </div>
    </>
  );
};

export default Qpv;
