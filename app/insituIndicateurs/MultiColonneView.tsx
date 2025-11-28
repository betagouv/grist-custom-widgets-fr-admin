import { useEffect, useState } from "react";
import { DESCRIPTION_COLONNE_INDICATEUR } from "./constants";
import { getInsituIndicateursResultsForRecords } from "./lib";
import { FetchIndicateurReturnType, IndicateursDetail, InsituResults, NarrowedTypeIndicateur, Stats } from "./types";
import { RowRecord } from "grist/GristData";
import { addObjectInRecord } from "../../lib/grist/plugin-api";
import { listObjectToString } from "./utils";

interface ColumnInfo {
  id: string;
  label: string;
  description: string;
  insituIndicateurId: string;
}

interface MultiColonneViewProps {
  tokenInfo: { token: string; baseUrl: string } | null;
  tableId: string | null;
  records: RowRecord[];
  setFeedback: React.Dispatch<React.SetStateAction<string>>;
  setGlobalError: React.Dispatch<React.SetStateAction<string>>;
};
// TODO : affichage commun du global erreur et feedback (ou non)
// TODO : afficher les metadonnées dans le tableau dans une 4ème colonne

export const MultiColonneView = ({ tokenInfo, tableId, records, setFeedback, setGlobalError }: MultiColonneViewProps) => {
  const [filteredColumns, setFilteredColumns] = useState<ColumnInfo[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [getColumnsError, setGetColumnsError] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [wantIndicateursDetail, setWantIndicateursDetail] =
    useState<IndicateursDetail>({});

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(DESCRIPTION_COLONNE_INDICATEUR);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleColumnSelect = (columnId: string) => {
    setSelectedColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedColumns.size === filteredColumns.length) {
      setSelectedColumns(new Set());
    } else {
      setSelectedColumns(new Set(filteredColumns.map((col) => col.id)));
    }
  };

  const handleUpdateSelectedColumns = async () => {
    // Récupération des informations des colonnes sélectionnées
    const columnsToUpdate = filteredColumns.filter((col) =>
      selectedColumns.has(col.id)
    );
    const indicateursIdentifiants = columnsToUpdate.map((col) => col.insituIndicateurId);

    const stats: Stats = {
      toUpdateCount: 0,
      updatedCount: 0,
      invalidCount: 0,
    };
    setFeedback("Traitement en cours...");
    getInsituIndicateursResultsForRecords(
      indicateursIdentifiants,
      records,
      false,
      stats,
    )
      .then(
        ({ data, errorByRecord }: InsituResults) => {
          if (data) {
            writeDataInTable(columnsToUpdate, data, stats);
          }
          if (errorByRecord) {
            writeErrorsInTable(columnsToUpdate, errorByRecord);
          }
          setFeedback(
            `Total de lignes : ${records.length} | 
          Lignes à mettre à jour : ${stats.toUpdateCount} | 
          Lignes mises à jour : ${stats.updatedCount} | 
          Invalides : ${stats.invalidCount}`,
          );
        })
      .catch((globalError: Error) => {
        setGlobalError(globalError.message.length > 400 ? globalError.message.slice(0, 400) + " ..." : globalError.message);
        setFeedback("")
      });
  };

  const writeErrorsInTable = (
    columnsToUpdate: ColumnInfo[],
    errorByRecord: { recordId: number; error: string }[],
  ) => {
    errorByRecord.forEach((error) => {
      const data = columnsToUpdate.reduce((acc: any, col) => {
        acc[col.id] = error.error;
        return acc;
      }, {});
      addObjectInRecord(error.recordId, data);
    });
  };

  const writeDataInTable = (
    columnsToUpdate: ColumnInfo[],
    dataFromApi: FetchIndicateurReturnType<NarrowedTypeIndicateur>[],
    stats: Stats,
  ) => {
    // Structure : { recordId: { columnId: valeur } }
    const dataByRecord: Record<string, Record<string, number | string>> = {};

    // Parcours de tous les indicateurs récupérés depuis l'API
    dataFromApi.forEach(resultatIndicateur => {
      const identifiantIndicateur = resultatIndicateur.metadata.identifiant;

      if (!identifiantIndicateur) {
        console.warn("Indicateur sans identifiant ignoré", resultatIndicateur.metadata);
        return;
      }

      // Trouver la colonne correspondant à cet indicateur
      const colonne = columnsToUpdate.find(col => col.insituIndicateurId === identifiantIndicateur);
      if (!colonne) {
        return;
      }

      // Déterminer si on veut le détail pour cette colonne
      const afficherDetailIndicateur = wantIndicateursDetail[colonne.id] === true;

      // Parcours de toutes les mailles (records) pour cet indicateur
      Object.entries(resultatIndicateur.mailles).forEach(([recordId, indicateur]) => {
        if (!indicateur) {
          return;
        }

        // Extraction de la valeur selon le type d'indicateur
        let valeurIndicateur: number | string;

        switch (indicateur.__typename) {
          case "IndicateurOneValue":
            valeurIndicateur = indicateur.valeur;
            break;
          case "IndicateurRow":
            valeurIndicateur = String(Object.values(indicateur.row)[0]);
            break;
          case "IndicateurRows":
            valeurIndicateur = afficherDetailIndicateur
              ? listObjectToString(indicateur.rows)
              : indicateur.count;
            break;
          case "IndicateurListe":
            valeurIndicateur = afficherDetailIndicateur
              ? indicateur.liste.join(", ")
              : indicateur.count;
            break;
          case "IndicateurListeGeo":
            valeurIndicateur = afficherDetailIndicateur
              ? indicateur.properties.join(", ")
              : indicateur.count;
            break;
          default:
            valeurIndicateur = "Erreur";
        }

        // Initialisation du record si nécessaire
        if (!dataByRecord[recordId]) {
          dataByRecord[recordId] = {};
        }

        // Stockage de la valeur pour cette colonne et ce record
        dataByRecord[recordId][colonne.id] = valeurIndicateur;
      });
    });

    // Écriture des données dans Grist pour chaque record
    Object.entries(dataByRecord).forEach(([recordId, dataRecord]) => {
      // Extraction du numéro de record depuis l'identifiant "recordId_XXX"
      const idRecordGrist = parseInt(recordId.split("recordId_")[1]);

      // Mise à jour du record dans Grist
      addObjectInRecord(idRecordGrist, dataRecord as any);
      stats.updatedCount++;
    });
  };

  useEffect(() => {
    const fetchColumns = async () => {
      if (!tokenInfo || !tableId) {
        setGetColumnsError("Informations de table manquantes");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${tokenInfo.baseUrl}/tables/${tableId}/columns?auth=${tokenInfo.token}`
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des colonnes");
        }

        const data = await response.json();

        // Filtrer les colonnes dont la description commence par DESCRIPTION_COLONNE_INDICATEUR
        const filtered = data.columns.filter(
          (col: any) =>
            col.fields.description &&
            col.fields.description.startsWith(DESCRIPTION_COLONNE_INDICATEUR)
        ).map((col: any) => ({
          id: col.id,
          label: col.fields.label || col.id,
          description: col.fields.description || "",
          insituIndicateurId: col.fields.description.split(DESCRIPTION_COLONNE_INDICATEUR)[1]
        }));

        // Ajouter les colonnes filtrées dans wantIndicateursDetail
        const initialWantDetail: IndicateursDetail = {};
        filtered.forEach((col: any) => {
          initialWantDetail[col.id] = false;
        });
        setWantIndicateursDetail(initialWantDetail);
        setFilteredColumns(filtered);
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors de la récupération des colonnes:", err);
        setGetColumnsError("Impossible de récupérer les colonnes de la table, essayez de recharger la page");
        setLoading(false);
      }
    };

    fetchColumns();
  }, [tokenInfo, tableId]);

  if (loading) {
    return (
      <div className="loading">
        <span className="loader"></span>
        <p>Chargement des colonnes...</p>
      </div>
    );
  }

  if (getColumnsError) {
    return (
      <div className="alert-error">
        <div>
          <span>Erreur</span> : {getColumnsError}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="advice">
        <span className="text-to-copy">
          <strong>Mode multi-colonne</strong> : Ce mode affiche uniquement les
          colonnes dont la description commence par « {DESCRIPTION_COLONNE_INDICATEUR} »
        </span>
        <button className="secondary copied" onClick={handleCopyClick}>
          {" "}
          {isCopied ? "Copié !" : "Copier"}
        </button>
      </div>

      {filteredColumns.length === 0 ? (
        <div className="alert-info">
          <p>
            Aucune colonne trouvée avec la description "
            {DESCRIPTION_COLONNE_INDICATEUR}".
          </p>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3>Colonnes trouvées ({filteredColumns.length}) :</h3>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.9em", color: "#666" }}>
                {selectedColumns.size} colonne(s) sélectionnée(s)
              </span>
              <button
                className="primary"
                onClick={handleUpdateSelectedColumns}
                disabled={selectedColumns.size === 0}
                style={{ marginLeft: "1rem" }}
              >
                Mettre à jour les colonnes sélectionnées
              </button>
            </div>
          </div>
          <p>
            Sélectionnez les colonnes que vous souhaitez mettre à jour et indiquez si vous souhaitez récupérer
            le décompte de l'indicateur (Ex: Nombre de villes concernées par le programme)
            ou
            le détail de l'indicateur (Ex : Liste des villes concernées par le programme)
          </p>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "1rem",
              marginBottom: "1rem",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd" }}>
                <th style={{ textAlign: "center", padding: "0.5rem", width: "50px" }}>
                  <input
                    type="checkbox"
                    checked={selectedColumns.size === filteredColumns.length && filteredColumns.length > 0}
                    onChange={handleSelectAll}
                    title="Tout sélectionner / Tout désélectionner"
                  />
                </th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>
                  Mode
                </th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>
                  Nom de la colonne
                </th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>
                  Description
                </th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>
                  Identifiant Insitu
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredColumns.map((col) => (
                <tr key={col.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ textAlign: "center", padding: "0.5rem" }}>
                    <input
                      type="checkbox"
                      checked={selectedColumns.has(col.id)}
                      onChange={() => handleColumnSelect(col.id)}
                    />
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    <div className="radio-button">
                      <label style={{ whiteSpace: "nowrap" }}>
                        <input
                          type="radio"
                          name={`wantIndicateurDetail_${col.id}`}
                          value="false"
                          checked={wantIndicateursDetail[col.id] === false}
                          onChange={() => setWantIndicateursDetail((prev) => ({ ...prev, [col.id]: false }))}
                        />
                        décompte
                      </label>
                      <label style={{ whiteSpace: "nowrap" }}>
                        <input
                          type="radio"
                          name={`wantIndicateurDetail_${col.id}`}
                          value="true"
                          checked={wantIndicateursDetail[col.id] === true}
                          onChange={() => setWantIndicateursDetail((prev) => ({ ...prev, [col.id]: true }))}
                        />
                        détail
                      </label>
                    </div>
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    <strong>{col.label}</strong>
                  </td>
                  <td style={{ padding: "0.5rem", fontSize: "0.9em" }}>
                    {col.description}
                  </td>
                  <td style={{ padding: "0.5rem", fontSize: "0.9em" }}>
                    <a
                      href={`https://catalogue-indicateurs.donnees.incubateur.anct.gouv.fr/indicateur/${col.insituIndicateurId}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Ouvre Nouvel onglet - catalogue d'indicateur"
                    >
                      {col.insituIndicateurId}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div >
      )}
    </>
  );
};
