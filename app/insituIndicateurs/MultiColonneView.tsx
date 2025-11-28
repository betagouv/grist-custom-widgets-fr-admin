import { useEffect, useState } from "react";
import { DESCRIPTION_COLONNE_INDICATEUR } from "./constants";
import { getInsituIndicateursResultsForRecords } from "./lib";
import { FetchIndicateurReturnType, IndicateursDetail, InsituResults, NarrowedTypeIndicateur, Stats } from "./types";
import { RowRecord } from "grist/GristData";
import { addObjectInRecord } from "../../lib/grist/plugin-api";
import { extractIndicateurValue, extractRecordNumber } from "./lib/indicateurExtractor";

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
// TODO : idée d'afficher les metadonnées dans le tableau dans une 5ème colonne

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

      const afficherDetailIndicateur = wantIndicateursDetail[colonne.id] === true;

      // Parcours de toutes les mailles (records) pour cet indicateur
      Object.entries(resultatIndicateur.mailles).forEach(([recordId, indicateur]) => {
        const valeurIndicateur = extractIndicateurValue(indicateur, afficherDetailIndicateur);
        if (!dataByRecord[recordId]) {
          dataByRecord[recordId] = {};
        }
        dataByRecord[recordId][colonne.id] = valeurIndicateur;
      });
    });

    // Écriture des données dans Grist pour chaque record
    Object.entries(dataByRecord).forEach(([recordId, dataRecord]) => {
      addObjectInRecord(extractRecordNumber(recordId), dataRecord as any);
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
        <div className="multi-colonne">
          <div className="header">
            <h3>Colonnes trouvées ({filteredColumns.length}) :</h3>
            <div className="actions">
              <span className="counter">
                {selectedColumns.size} colonne(s) sélectionnée(s)
              </span>
              <button
                className="primary update-button"
                onClick={handleUpdateSelectedColumns}
                disabled={selectedColumns.size === 0}
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
          <table>
            <thead>
              <tr>
                <th className="checkbox-column">
                  <input
                    type="checkbox"
                    checked={selectedColumns.size === filteredColumns.length && filteredColumns.length > 0}
                    onChange={handleSelectAll}
                    title="Tout sélectionner / Tout désélectionner"
                  />
                </th>
                <th>Mode</th>
                <th>Nom de la colonne</th>
                <th>Description</th>
                <th>Identifiant Insitu</th>
              </tr>
            </thead>
            <tbody>
              {filteredColumns.map((col) => (
                <tr key={col.id}>
                  <td className="checkbox-column">
                    <input
                      type="checkbox"
                      checked={selectedColumns.has(col.id)}
                      onChange={() => handleColumnSelect(col.id)}
                    />
                  </td>
                  <td>
                    <div className="radio-button">
                      <label>
                        <input
                          type="radio"
                          name={`wantIndicateurDetail_${col.id}`}
                          value="false"
                          checked={wantIndicateursDetail[col.id] === false}
                          onChange={() => setWantIndicateursDetail((prev) => ({ ...prev, [col.id]: false }))}
                        />
                        décompte
                      </label>
                      <label>
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
                  <td><strong>{col.label}</strong></td>
                  <td className="small-text">{col.description}</td>
                  <td className="small-text">
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
