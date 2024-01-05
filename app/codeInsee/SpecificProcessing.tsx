"use client";

import { FC } from "react";
import { NormalizedInseeResult } from "./types";
import { RowRecord } from "grist/GristData";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { COLUMN_MAPPING_NAMES } from "./constants";
import GenericChoiceBanner from "../../components/cleanData/GenericChoiceBanner";
import { DEPT } from "../../lib/util/constants";
import { DirtyRecord, NoResultRecord } from "../../lib/cleanData/types";
import RecordName from "../../components/RecordName";
import GenericSpecificProcessing from "../../components/cleanData/GenericSpecificProcessing";

export const SpecificProcessing: FC<{
  mappings: WidgetColumnMap | null;
  record: RowRecord | null | undefined;
  dirtyData: DirtyRecord<NormalizedInseeResult> | null | undefined;
  noResultData: NoResultRecord<NormalizedInseeResult> | null | undefined;
  passDataFromDirtyToClean: (
    inseeCodeSelected: NormalizedInseeResult,
    initalData: DirtyRecord<NormalizedInseeResult>,
  ) => void;
  recordResearch: () => void;
  goBackToMenu: () => void;
}> = ({
  mappings,
  record,
  dirtyData,
  noResultData,
  passDataFromDirtyToClean,
  recordResearch,
  goBackToMenu,
}) => {
  const recordName = (
    <RecordName
      record={record}
      columnName={mappings && mappings[COLUMN_MAPPING_NAMES.COLLECTIVITE.name]}
    />
  );

  const isResultFind = () => {
    if (record && mappings) {
      const columnName = mappings[COLUMN_MAPPING_NAMES.CODE_INSEE.name];
      if (typeof columnName === "string" && record[columnName]) {
        return true;
      }
    }
    return false;
  };

  const recordFindNode = (
    <div>Le code INSEE/SIREN de {recordName} a bien été rempli.</div>
  );

  const choiceBannerNode = record && dirtyData && (
    <GenericChoiceBanner<NormalizedInseeResult>
      dirtyData={dirtyData}
      passDataFromDirtyToClean={passDataFromDirtyToClean}
      option={{
        choiceValueKey: "code_insee",
        withChoiceTagLegend: true,
        choiceTagLegend: "Code INSEE / SIREN",
        choiceTagKey: "code_insee",
        choiceTagKey2: "siren_groupement",
      }}
      itemDisplay={(item: NormalizedInseeResult) => {
        return (
          <div>
            <b>
              {item.nature_juridique} {item.lib_groupement}
            </b>
            {item.insee_dep && ` - ${DEPT[item.insee_dep]}`}
          </div>
        );
      }}
    />
  );

  return (
    <GenericSpecificProcessing<NormalizedInseeResult>
      record={record}
      recordNameNode={recordName}
      noResultData={noResultData}
      recordResearch={recordResearch}
      goBackToMenu={goBackToMenu}
      isResultFind={isResultFind}
      recordFindNode={recordFindNode}
      choiceBannerNode={choiceBannerNode}
    />
  );
};
