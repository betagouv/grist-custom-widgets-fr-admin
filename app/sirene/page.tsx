'use client';

import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { RowRecord } from "grist/GristData";
import { useEffect, useState } from "react";
import { useGristEffect } from "../../lib/grist/hooks";
import { geocode } from "./lib";

type GeocodeResults = {
  entreprises: {
    simpleLabel: string;
    siren: string;
    firstMatchingEtablissement: {
      codeCommuneEtablissement: string;
      siret: string;
    };
    score: number;
  }[];
}

type GeocodeChoice = {
  libelle: string;
  siren: string;
  code_commune: string;
  siret: string;
  score: number;
}

const Sirene = () => {
  // State
  const [message, setMessage] = useState<[string, string?] | null>(null);
  const [geocodeResults, setGeocodeResults] = useState<GeocodeResults | null>(null);
  const [currentRecord, setCurrentRecord] = useState<RowRecord | null>(null);
  const [currentMappings, setCurrentMappings] = useState<WidgetColumnMap | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<GeocodeChoice | null>(null);

  // Derived state
  const choices = geocodeResults?.entreprises ? geocodeResults.entreprises.map(result => ({
    libelle: result.simpleLabel,
    siren: result.siren,
    code_commune: result.firstMatchingEtablissement.codeCommuneEtablissement,
    siret: result.firstMatchingEtablissement.siret,
    score: result.score
  })) : null;
  const currentRecordColumns = currentRecord ? grist.mapColumnNames(currentRecord) : null;

  useGristEffect(() => {
    grist.ready({
      requiredAccess: "full",
      columns: [
        {
          name: "nom",
          title: "Source (nom d'entité)",
          type: "Any",
          optional: false,
        },
        {
          name: "siren",
          title: "Destination code SIREN",
          type: "Any",
          optional: false,
        },
        {
          name: "libelle",
          title: "Destination libellé normalisé",
          type: "Any",
          optional: true,
        },
      ]
    });

    grist.onRecord((record, mappings) => {
      setMessage(null)
      setSelectedChoice(null)
      setCurrentRecord(record)
      setCurrentMappings(mappings)
    });
  }, []);

  useEffect(() => {
    if (!currentRecord) return

    if (!currentRecordColumns) {
      setMessage(["Configurez d’abord les colonnes source et destination dans les options du widget.", "error"]);
      return
    }
    if (!currentRecordColumns.nom) {
      setMessage(["Valeur manquante pour la source.", "warning"]);
      return
    }
    if (currentRecordColumns.siren) {
      setMessage([`Code déjà présent pour "${currentRecordColumns.nom}" : ${currentRecordColumns.siren}.`]);
      return
    }

    geocode(currentRecordColumns.nom).then(data => {
      setGeocodeResults(data)
    });
  }, [currentRecord, currentRecordColumns])

  useEffect(() => {
    if (!choices) return

    if (choices.length === 0) {
      setMessage([`Pas de résultat pour "${currentRecordColumns?.nom}"`, "warning"]);
      return
    }
  }, [choices])

  const applySelectedChoice = () => {
    if (!currentRecord || !currentMappings || !selectedChoice) return

    const patchObject = {
      ...(currentMappings["siren"] ? {
        [currentMappings["siren"] as string]: selectedChoice.siren
      } : undefined),
      ...(currentMappings["libelle"] ? {
        [currentMappings["libelle"] as string]: selectedChoice.libelle
      } : undefined),
    }
    grist
      .getTable()
      .getTableId()
      .then((tableId) => {
        grist.docApi.applyUserActions([["UpdateRecord", tableId, currentRecord.id, patchObject]])
      });
  }

  return (
    <div>
      <h1>Résolution de code SIREN</h1>
      {message && (
        <div id="message">
          <div className={`dt-message ${message[1]}`}>{message[0]}</div>
        </div>
      )}
      {choices && choices.length > 0 && (
        <div id="choice">
          <form onSubmit={applySelectedChoice}>
            <h2>Possibilités pour «&nbsp;{currentRecordColumns.nom}&nbsp;»</h2>
            {
              choices.map((choice) => (
                <div key={choice.siren}><label>
                  <input
                    type="radio"
                    name="choice"
                    value={choice.siren}
                    onChange={() => setSelectedChoice(choice)}
                  />
                  {choice.libelle} ({choice.siren})
                </label></div>
              ))
            }
            <button type="submit" disabled={!selectedChoice}>Utiliser le résultat sélectionné</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Sirene
