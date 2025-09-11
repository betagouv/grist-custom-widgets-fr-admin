import { addObjectInRecord } from "../../lib/grist/plugin-api";
import { uploadAttachment } from "./attachments";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { RowRecord } from "grist/GristData";

interface GristData {
  records: RowRecord[];
  mappings: WidgetColumnMap;
}

export const savePdfToGrist = async (
  pdfBytes: Uint8Array,
  gristData: GristData,
  outputColumnName: string,
  prefix: string = "form",
) => {
  if (!gristData?.records[0] || !gristData.mappings[outputColumnName]) {
    throw new Error("Missing required Grist data");
  }

  const fileName = `${prefix}_${new Date().toISOString()}.pdf`;
  const blob = new Blob([new Uint8Array(pdfBytes)], {
    type: "application/pdf",
  });

  const attachmentId = await uploadAttachment(blob, fileName);

  const data = {
    [outputColumnName]: [grist.GristObjCode.List, attachmentId],
  };

  await addObjectInRecord(
    gristData.records[0].id,
    grist.mapColumnNamesBack(data),
  );
};
