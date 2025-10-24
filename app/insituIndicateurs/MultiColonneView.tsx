import { useEffect, useState } from "react";
import { DESCRIPTION_COLONNE_INDICATEUR } from "./constants";

interface ColumnInfo {
  id: string;
  label: string;
  description?: string;
}

interface MultiColonneViewProps {
  tokenInfo: { token: string; baseUrl: string } | null;
  tableId: string | null;
}

export const MultiColonneView = ({ tokenInfo, tableId }: MultiColonneViewProps) => {
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [filteredColumns, setFilteredColumns] = useState<ColumnInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchColumns = async () => {
      if (!tokenInfo || !tableId) {
        setError("Informations de table manquantes");
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
        const cols: ColumnInfo[] = data.columns.map((col: any) => ({
          id: col.id,
          label: col.fields.label || col.id,
          description: col.fields.description || "",
        }));

        setColumns(cols);

        // Filtrer les colonnes dont la description commence par "Indicateur provenant de Insitu :"
        const filtered = cols.filter(
          (col) =>
            col.description &&
            col.description.startsWith(DESCRIPTION_COLONNE_INDICATEUR)
        );

        setFilteredColumns(filtered);
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors de la récupération des colonnes:", err);
        setError("Impossible de récupérer les colonnes de la table");
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

  if (error) {
    return (
      <div className="alert-error">
        <div>
          <span>Erreur</span> : {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="alert-info">
        <p>
          <strong>Mode multi-colonne</strong> : Ce mode affiche uniquement les
          colonnes dont la description commence par "
          {DESCRIPTION_COLONNE_INDICATEUR}".
        </p>
        <p>
          Ces colonnes ont été créées avec le widget Insitu Indicateurs et
          contiennent des indicateurs provenant du catalogue de l'ANCT.
        </p>
      </div>

      {filteredColumns.length === 0 ? (
        <div className="alert-info">
          <p>
            Aucune colonne trouvée avec la description "
            {DESCRIPTION_COLONNE_INDICATEUR}".
          </p>
          <p>
            Utilisez le mode simple pour créer des colonnes avec des
            indicateurs Insitu.
          </p>
        </div>
      ) : (
        <div>
          <h3>Colonnes trouvées ({filteredColumns.length}) :</h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "1rem",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd" }}>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>
                  Nom de la colonne
                </th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredColumns.map((col) => (
                <tr key={col.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "0.5rem" }}>
                    <strong>{col.label}</strong>
                  </td>
                  <td style={{ padding: "0.5rem", fontSize: "0.9em" }}>
                    {col.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};
