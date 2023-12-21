"use client";

import { FC } from "react";
import { RowRecord } from "grist/GristData";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { COLUMN_MAPPING_NAMES } from "./constants";
import { NormalizedSirenResult } from "./types";
import GenericChoiceBanner from "../../components/cleanData/GenericChoiceBanner";
import { DirtyRecord, NoResultRecord } from "../../lib/cleanData/types";
import RecordName from "../../components/RecordName";
import GenericSpecificProcessing from "../../components/cleanData/GenericSpecificProcessing";

export const SpecificProcessing: FC<{
  mappings: WidgetColumnMap | null;
  record: RowRecord | null | undefined;
  dirtyData: DirtyRecord<NormalizedSirenResult> | null | undefined;
  noResultData: NoResultRecord<NormalizedSirenResult> | null | undefined;
  passDataFromDirtyToClean: (
    sirenCodeSelected: NormalizedSirenResult,
    initalData: DirtyRecord<NormalizedSirenResult>,
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
  const recordNameNode = (
    <RecordName
      record={record}
      columnName={mappings && mappings[COLUMN_MAPPING_NAMES.NAME.name]}
    />
  );

  const isResultFind = () => {
    if (record && mappings) {
      const columnName = mappings[COLUMN_MAPPING_NAMES.SIREN.name];
      if (typeof columnName === "string" && record[columnName]) {
        return true;
      }
    }
    return false;
  };

  const recordFindNode = (
    <div>Le code SIREN de {recordNameNode} a bien été rempli.</div>
  );

  const choiceBannerNode = record && dirtyData && (
    <GenericChoiceBanner<NormalizedSirenResult>
      dirtyData={dirtyData}
      passDataFromDirtyToClean={passDataFromDirtyToClean}
      option={{
        choiceValueKey: "siren",
        withChoiceTagLegend: true,
        choiceTagLegend: "Code SIREN",
        choiceTagKey: "siren",
      }}
      itemDisplay={(item: NormalizedSirenResult) => {
        return (
          <div>
            <b>{item.label}</b>
            {item.code_commune && ` - ${item.code_commune}`}
          </div>
        );
      }}
    />
  );

  return (
    <GenericSpecificProcessing<NormalizedSirenResult>
      record={record}
      recordNameNode={recordNameNode}
      noResultData={noResultData}
      recordResearch={recordResearch}
      goBackToMenu={goBackToMenu}
      isResultFind={isResultFind}
      recordFindNode={recordFindNode}
      choiceBannerNode={choiceBannerNode}
    />
  );
};
