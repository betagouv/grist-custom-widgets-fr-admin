"use client";

import { useState } from "react";
import { useGristEffect } from "../../lib/grist/hooks";
import { addObjectInRecord, gristReady2 } from "../../lib/grist/plugin-api";
import { COLUMN_MAPPING_NAMES, NO_DATA_MESSAGES } from "./constants";
import {
  cleanRecordsData,
  getInseeCodeResultsForRecord,
  getInseeCodeResultsForRecords,
  mappingsIsReady,
} from "./lib";
import {
  CleanInseeCodeRecord,
  DirtyInseeCodeRecord,
  InseeCodeUncleanedRecord,
  NoResultInseeCodeRecord,
  NormalizedInseeResult,
} from "./types";
import { ChoiceBanner } from "./ChoiceBanner";
import { RowRecord } from "grist/GristData";
import { Title } from "./Title";
import { WidgetColumnMap } from "grist/CustomSectionAPI";

const InseeCode = () => {
  const [record, setRecord] = useState<RowRecord | null>();
  const [records, setRecords] = useState<RowRecord[]>([]);
  const [dirtyData, setDirtyData] = useState<{
    [recordId: number]: DirtyInseeCodeRecord;
  }>({});
  const [noResultData, setNoResultData] = useState<{
    [recordId: number]: NoResultInseeCodeRecord;
  }>({});
  const [mappings, setMappings] = useState<WidgetColumnMap | null>(null);
  const [inProgress, setInProgress] = useState(false);
  const [atOnProgress, setAtOnProgress] = useState([0, 0]);

  useGristEffect(() => {
    gristReady2("full", Object.values(COLUMN_MAPPING_NAMES));

    grist.onRecords((records, mappings) => {
      setRecords(records);
      setMappings(mappings);
      // if (grist.mapColumnNames(records[0])) {
      //   setMappings(mappings as Mappings);
      // }
      // else {
      //   console.error("Please map all columns");
      // }
    });
  }, []);

  useGristEffect(() => {
    grist.onRecord((rec: RowRecord | null) => {
      setRecord(rec);
    });
  }, []);

  const globalResearch = async () => {
    setInProgress(true);
    const callBackFunction = (
      dataFromApi: InseeCodeUncleanedRecord[],
      at: number,
      on: number,
    ) => {
      setAtOnProgress([at, on]);
      const { clean, dirty, noResult } = cleanRecordsData(dataFromApi);
      writeCleanDataInTable(clean);
      setDirtyData((prevState) => ({ ...prevState, ...dirty }));
      setNoResultData((prevState) => ({ ...prevState, ...noResult }));
    };
    await getInseeCodeResultsForRecords(records, mappings!, callBackFunction);
    setInProgress(false);
  };

  const recordResearch = async () => {
    if (record) {
      // TODO : delete data corresponding to this record in dirty and noResult states
      const recordUncleanedData = await getInseeCodeResultsForRecord(
        record,
        mappings!,
      );
      const { clean, dirty, noResult } = cleanRecordsData([
        recordUncleanedData,
      ]);
      clean && writeCleanDataInTable(clean);
      dirty && setDirtyData((prevState) => ({ ...prevState, ...dirty }));
      noResult &&
        setNoResultData((prevState) => ({ ...prevState, ...noResult }));
    }
  };

  const writeCleanDataInTable = (cleanData: {
    [recordId: number]: CleanInseeCodeRecord;
  }) => {
    Object.values(cleanData).forEach((clean: CleanInseeCodeRecord) => {
      if (clean.code_insee) {
        const data = {
          [COLUMN_MAPPING_NAMES.CODE_INSEE.name]: clean.code_insee,
          [COLUMN_MAPPING_NAMES.LIB_GROUPEMENT.name]: clean.lib_groupement,
        };
        addObjectInRecord(clean.recordId, grist.mapColumnNamesBack(data));
      } else {
        setNoResultData((prevValue) => ({
          ...prevValue,
          [clean.recordId]: {
            recordId: clean.recordId,
            noResultMessage: NO_DATA_MESSAGES.NO_INSEE_CODE,
            result: clean,
          },
        }));
      }
    });
  };

  const passDataFromDirtyToClean = (
    inseeCodeSelected: NormalizedInseeResult,
    initalData: DirtyInseeCodeRecord,
  ) => {
    // Remove the record from dirtyData
    setDirtyData(() => {
      const { [initalData.recordId]: id, ...newDirtyData } = dirtyData;
      return newDirtyData;
    });
    console.log(dirtyData);
    writeCleanDataInTable({
      [initalData.recordId]: {
        ...inseeCodeSelected,
        recordId: initalData.recordId,
        collectivite: initalData.collectivite,
      },
    });
  };

  const recordName = () => {
    if (record && mappings) {
      const columnName = mappings[COLUMN_MAPPING_NAMES.COLLECTIVITE.name];
      if (typeof columnName === "string") {
        return (
          <div>Collectivité sélectionnée : {String(record[columnName])}</div>
        );
      }
      return <div>Vérifiez les paramétrages de colonne de la Vue</div>;
    }
    return <div>Aucune ligne n'est actuellement selectionnée</div>;
  };

  const sirenGroupement = record && noResultData[record.id]?.result && (
    <div>
      Il existe cependant un code Siren :{" "}
      <b>{noResultData[record.id].result?.siren_groupement}</b>
    </div>
  );

  return !mappingsIsReady(mappings) ? (
    <div>
      <Title />
      <p>
        Configurez d&apos;abord les colonnes source et destination dans les
        options du widget.
      </p>
    </div>
  ) : (
    <div>
      <Title />
      <h2>Traitement ligne par ligne</h2>
      {recordName()}
      {record && dirtyData[record.id] && (
        <ChoiceBanner
          dirtyData={dirtyData[record.id]}
          passDataFromDirtyToClean={passDataFromDirtyToClean}
        />
      )}
      {record && noResultData[record.id] && (
        <div>
          {noResultData[record.id].noResultMessage}
          {sirenGroupement}
        </div>
      )}
      {record && <button onClick={recordResearch}>Recherche spécifique</button>}

      <div className="py-2">
        <hr />
        <h2>Traitement global</h2>
        <p>
          Vous pouvez lancer une recherche pour l&apos;ensemble des lignes
          n&apos;ayant pas encore de code insee renseigné
          <br />
          Les données seront renseignées 100 par 100
        </p>
        {inProgress ? (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <span className="loader"></span>
            <div className="px-2">
              {atOnProgress[0]} / {atOnProgress[1]}
            </div>
          </div>
        ) : (
          <button onClick={globalResearch}>Recherche globale</button>
        )}
      </div>
    </div>
  );
};

export default InseeCode;
