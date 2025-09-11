"use client";

import { useState, useEffect, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { Title } from "../../../components/Title";
import { Footer } from "../../../components/Footer";
import { useGristEffect } from "../../../lib/grist/hooks";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { RowRecord } from "grist/GristData";
import { COLUMN_MAPPING_NAMES as MANAGER_COLUMN_MAPPING } from "./constants";
import { PdfPreview } from "../PdfPreview";
import { downloadAttachment } from "../attachments";
import { savePdfToGrist } from "../pdfStorage";

const ManagerSignatureWidget = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [gristData, setGristData] = useState<GristData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [completePdfBytes, setCompletePdfBytes] = useState<Uint8Array | null>(
    null,
  );
  const [hasEtatFrais, setHasEtatFrais] = useState(false);

  interface GristData {
    records: RowRecord[];
    mappings: WidgetColumnMap;
  }

  useGristEffect(() => {
    grist.ready({
      columns: Object.values(MANAGER_COLUMN_MAPPING),
      requiredAccess: "full",
    });

    grist.onRecord(async (record, mappings) => {
      console.log("Record changed:", record);
      console.log("Mappings received:", mappings);
      if (mappings && record) {
        const hasEF = Boolean(
          record[
            mappings[
              MANAGER_COLUMN_MAPPING.PDF_EF_INPUT.name
            ] as keyof typeof record
          ],
        );
        setHasEtatFrais(hasEF);
        setGristData({ records: [record], mappings });
      }
    });
  }, []);

  const loadPdf = useCallback(async () => {
    if (!gristData) {
      console.error("No Grist data available");
      return;
    }

    // Use the component-level hasEtatFrais
    const inputFieldName = hasEtatFrais
      ? MANAGER_COLUMN_MAPPING.PDF_EF_INPUT.name
      : MANAGER_COLUMN_MAPPING.PDF_INPUT.name;

    if (!gristData.mappings[inputFieldName]) {
      console.error(`${inputFieldName} not found in Grist data`);
      return;
    }

    try {
      setIsProcessing(true);
      const attachmentId = Number(
        gristData.records[0][
          gristData.mappings[
            inputFieldName
          ] as keyof (typeof gristData.records)[0]
        ],
      );
      const pdfArrayBuffer = await downloadAttachment(attachmentId);
      const pdfBytes = new Uint8Array(pdfArrayBuffer);

      // Load the PDF and add signature
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const signatureField = MANAGER_COLUMN_MAPPING.SIGNATURE.form_field;

      if (signatureField && gristData) {
        // Use the component-level hasEtatFrais
        const signaturePosition = hasEtatFrais
          ? signatureField.alternate
          : signatureField.default;

        const { x, y, maxHeight } = signaturePosition;
        const signatureAttachmentId = Number(
          gristData.records[0][
            gristData.mappings[
              MANAGER_COLUMN_MAPPING.SIGNATURE.name
            ] as keyof (typeof gristData.records)[0]
          ],
        );
        const imageBytes = await downloadAttachment(signatureAttachmentId);
        const image = await pdfDoc.embedPng(new Uint8Array(imageBytes));

        const aspectRatio = image.width / image.height;
        const width = maxHeight * aspectRatio;

        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        firstPage.drawImage(image, {
          x,
          y,
          width,
          height: maxHeight,
        });
      }

      // Save the complete PDF with signature
      const updatedPdfBytes = await pdfDoc.save();
      setCompletePdfBytes(updatedPdfBytes);

      // Generate preview
      const previewDoc = await PDFDocument.load(updatedPdfBytes);
      const previewBytes = await createPreview(previewDoc);
      const blob = new Blob([new Uint8Array(previewBytes)], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error("Error loading PDF:", error);
      alert("Failed to load PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [gristData, hasEtatFrais]);

  const createPreview = async (pdfDoc: PDFDocument): Promise<Uint8Array> => {
    const newPdfDoc = await PDFDocument.create();
    const [firstPage] = await newPdfDoc.copyPages(pdfDoc, [0]);
    newPdfDoc.addPage(firstPage);
    return await newPdfDoc.save();
  };

  const savePdf = async () => {
    if (!completePdfBytes || !gristData) {
      return;
    }

    try {
      setIsProcessing(true);

      // Use the component-level hasEtatFrais
      const outputFieldName = hasEtatFrais
        ? MANAGER_COLUMN_MAPPING.PDF_EF_OUTPUT.name
        : MANAGER_COLUMN_MAPPING.PDF_OUTPUT.name;

      await savePdfToGrist(
        completePdfBytes,
        gristData,
        outputFieldName,
        "signed",
      );
      alert("PDF saved successfully!");
    } catch (error) {
      console.error("Error saving PDF:", error);
      alert("Failed to save PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (gristData) {
      loadPdf();
    }
  }, [gristData, loadPdf]);

  // Cleanup URL when component unmounts or URL changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (
    !gristData?.records[0] ||
    !gristData?.mappings ||
    !gristData.mappings[MANAGER_COLUMN_MAPPING.PDF_INPUT.name]
  ) {
    return (
      <div>
        <Title title="Manager Signature" />
        <div className="error-message">
          {!gristData?.records[0]
            ? "Please select a record to process."
            : "PDF_INPUT mapping is missing. Please configure the widget settings."}
        </div>
        <Footer dataSource={<span>OM Filler powered by pdf-lib</span>} />
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Title title="Manager Signature" />
      <div
        style={{
          padding: "0 10px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {isProcessing && <div>Processing...</div>}
        {previewUrl ? (
          <>
            <PdfPreview previewUrl={previewUrl} />
            <div
              style={{
                padding: "10px 0 20px 0",
                textAlign: "center",
                position: "sticky",
                bottom: 0,
              }}
            >
              <button
                className="primary"
                onClick={savePdf}
                disabled={isProcessing}
              >
                Save to Grist
              </button>
            </div>
          </>
        ) : (
          <div>Loading preview...</div>
        )}
      </div>
      <Footer dataSource={<span>OM Filler powered by pdf-lib</span>} />
    </div>
  );
};

export default ManagerSignatureWidget;
