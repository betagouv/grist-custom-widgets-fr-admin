"use client";

import { FC } from "react";
import { NormalizedInseeResult } from "./types";
import { RowRecord } from "grist/GristData";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { COLUMN_MAPPING_NAMES } from "./constants";
import GenericChoiceBanner from "../../components/cleanData/GenericChoiceBanner";
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
    <div>Le code INSEE de {recordName} a bien été rempli.</div>
  );

  const choiceBannerNode = record && dirtyData && (
    <GenericChoiceBanner<NormalizedInseeResult>
      dirtyData={dirtyData}
      passDataFromDirtyToClean={passDataFromDirtyToClean}
      option={{
        choiceValueKey: "code",
        withChoiceTagLegend: true,
        choiceTagLegend: "Code INSEE",
        choiceTagKey: "code",
      }}
      itemDisplay={(item: NormalizedInseeResult) => {
        return (
          <div>
            <b>{item.nom}</b>
            {item.departement && ` - ${item.departement.nom}`}
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
