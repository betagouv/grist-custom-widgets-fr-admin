"use client";

import { useState, useEffect, useCallback } from "react";
import { PDFDocument, PDFTextField, PDFCheckBox, rgb } from "pdf-lib";
import { useGristEffect } from "../../../lib/grist/hooks";
import { Title } from "../../../components/Title";
import { Configuration } from "../../../components/Configuration";
import { Footer } from "../../../components/Footer";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { RowRecord } from "grist/GristData";
import { PdfPreview } from "../PdfPreview";
import { downloadAttachment } from "../attachments";
import { savePdfToGrist } from "../pdfStorage";
import { COLUMN_MAPPING_NAMES, NO_DATA_MESSAGES, TITLE } from "./constants";
const TEMPLATE_PATH = "/templates/om.pdf";

interface GristData {
  records: RowRecord[];
  mappings: WidgetColumnMap;
}

const OmFillerWidget = () => {
  const [currentStep, setCurrentStep] = useState("loading");
  const [isProcessing, setIsProcessing] = useState(false);
  const [gristData, setGristData] = useState<GristData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [templateBytes, setTemplateBytes] = useState<Uint8Array | null>(null);
  const [completePdfBytes, setCompletePdfBytes] = useState<Uint8Array | null>(
    null,
  );

  const mappingsIsReady = (mappings: WidgetColumnMap) => {
    return Object.values(COLUMN_MAPPING_NAMES).every(
      (config) => mappings[config.name] !== undefined,
    );
  };

  useGristEffect(() => {
    // Declare the required column mappings to Grist
    grist.ready({
      columns: Object.values(COLUMN_MAPPING_NAMES),
      requiredAccess: "full",
    });

    // Get table ID and listen for record updates
    grist.onRecord(async (record, mappings) => {
      console.log("Record changed:", record);
      console.log("Mappings received:", mappings);
      if (mappings && record) {
        setGristData({ records: [record], mappings });
      }
    });
  }, []);

  const loadPdfTemplate = async () => {
    try {
      // Fetch the PDF template once and store the bytes
      const response = await fetch(TEMPLATE_PATH);
      if (!response.ok) {
        throw new Error(`Failed to fetch template: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      setTemplateBytes(bytes);

      setCurrentStep("ready");
    } catch (error) {
      console.error("Error loading PDF template:", error);
      setCurrentStep("error");
    }
  };

  const previewFirstPage = useCallback(async () => {
    if (!templateBytes) {
      console.error("Template bytes not loaded.");
      return;
    }

    try {
      console.log("Starting preview generation...");
      setIsProcessing(true);

      // Load the PDF document from cached bytes
      const pdfDoc = await PDFDocument.load(templateBytes);
      const form = pdfDoc.getForm();

      // Fill form fields from Grist data
      if (gristData?.records[0] && gristData.mappings) {
        const record = gristData.records[0];
        console.log("Filling fields with record:", record);

        for (const [key, config] of Object.entries(COLUMN_MAPPING_NAMES)) {
          if (key === "PDF_OUTPUT") {
            continue;
          }

          const columnId = config.name;
          const fieldMapping = config.form_field;

          const value =
            record[gristData.mappings[columnId] as keyof typeof record];
          console.log(`Processing ${columnId} with value:`, value);

          try {
            // Special handling for date signature
            if (
              key === "SIGNATURE_DATE" &&
              value &&
              value instanceof Date &&
              typeof fieldMapping === "object"
            ) {
              const date = new Date(value);
              const formattedDate = date.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });

              const pages = pdfDoc.getPages();
              const firstPage = pages[0];
              const { x, y, fontSize } = fieldMapping as {
                x: number;
                y: number;
                fontSize: number;
              };

              firstPage.drawText(formattedDate, {
                x,
                y,
                size: fontSize,
                color: rgb(0, 0, 0), // Black color
              });
              continue;
            }

            // Special handling for checkbox fields (residence and boolean fields)
            if (
              [
                "RESIDENCE_DEPART",
                "RESIDENCE_RETOUR",
                "HEBERGEMENT",
                "AVANCE",
                "ETAPE",
              ].includes(key)
            ) {
              if (typeof fieldMapping === "object" && value !== "") {
                // For boolean fields, convert value to 'true' or 'false' string
                const lookupValue =
                  typeof value === "boolean" ? String(value) : value;
                const mappingKey = lookupValue as keyof typeof fieldMapping;

                // Add a null check for fieldMapping
                if (fieldMapping && fieldMapping[mappingKey]) {
                  const checkboxField = form.getFieldMaybe(
                    fieldMapping[mappingKey],
                  );
                  if (checkboxField instanceof PDFCheckBox) {
                    checkboxField.check();
                  }
                }
                continue;
              }
            }

            // Special handling for DateTime fields
            if (key === "DATE_HEURE_DEPART" || key === "DATE_HEURE_RETOUR") {
              if (
                typeof fieldMapping === "object" &&
                fieldMapping !== null &&
                value instanceof Date
              ) {
                const date = new Date(value);

                // Format date as DD/MM/YYYY
                const formattedDate = date.toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                });

                // Format time as HH:mm
                const formattedTime = date.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });

                // Fill date field
                if ("date" in fieldMapping && fieldMapping.date) {
                  const dateField = form.getFieldMaybe(fieldMapping.date);
                  if (dateField instanceof PDFTextField) {
                    dateField.setText(formattedDate);
                  }
                }

                // Fill time field
                if ("time" in fieldMapping && fieldMapping.time) {
                  const timeField = form.getFieldMaybe(fieldMapping.time);
                  if (timeField instanceof PDFTextField) {
                    timeField.setText(formattedTime);
                  }
                }
                continue;
              }
            }

            // Special handling for transport field
            if (key === "TRANSPORT") {
              if (
                fieldMapping &&
                typeof fieldMapping === "object" &&
                value &&
                typeof value === "string"
              ) {
                if (["Train", "Avion"].includes(value)) {
                  const transportField = form.getFieldMaybe(
                    fieldMapping[value as keyof typeof fieldMapping],
                  );
                  if (transportField instanceof PDFCheckBox) {
                    transportField.check();
                  }
                } else {
                  if ("Autre" in fieldMapping) {
                    console.log("Autre", fieldMapping["Autre"]);
                    const otherField = form.getFieldMaybe(
                      fieldMapping["Autre"],
                    );
                    if (otherField instanceof PDFCheckBox) {
                      otherField.check();
                    }

                    const precisionField = form.getFieldMaybe(
                      fieldMapping["Precision"],
                    );
                    if (precisionField instanceof PDFTextField) {
                      precisionField.setText(String(value));
                    }
                  } else {
                    console.warn(
                      `Property 'Autre' does not exist on fieldMapping for TRANSPORT`,
                    );
                  }
                }
                continue;
              }
            }

            // Special handling for signature
            if (
              key === "SIGNATURE" &&
              value &&
              Array.isArray(value) &&
              typeof fieldMapping === "object"
            ) {
              const attachmentId = Number(value[0]);
              const imageBytes = await downloadAttachment(attachmentId);
              const image = await pdfDoc.embedPng(new Uint8Array(imageBytes));

              const { x, y, maxHeight } = fieldMapping as {
                x: number;
                y: number;
                maxHeight: number;
              };
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
              continue;
            }

            // Special handling for signature location
            if (
              key === "SIGNATURE_LOCATION" &&
              value &&
              typeof fieldMapping === "object"
            ) {
              const pages = pdfDoc.getPages();
              const firstPage = pages[0];
              const { x, y, fontSize } = fieldMapping as {
                x: number;
                y: number;
                fontSize: number;
              };

              firstPage.drawText(String(value), {
                x,
                y,
                size: fontSize,
                color: rgb(0, 0, 0), // Black color
              });
              continue;
            }

            // Regular form field handling
            if (typeof fieldMapping === "string") {
              const field = form.getFieldMaybe(fieldMapping);
              if (!field) {
                console.warn(`Field ${fieldMapping} not found in PDF form`);
              }

              if (field instanceof PDFTextField) {
                field.setText(String(value));
              }
            } else {
              console.warn(`Invalid fieldMapping type: ${typeof fieldMapping}`);
            }
          } catch (fieldError) {
            console.warn(`Error filling field for ${columnId}:`, fieldError);
          }
        }
      }

      // Save the current PDF before creating a new one
      const currentPdfBytes = await pdfDoc.save();

      // Store the complete PDF bytes in state for later use
      setCompletePdfBytes(currentPdfBytes);

      // Create new PDF with only first page for preview
      const newPdfDoc = await PDFDocument.create();
      const [firstPage] = await newPdfDoc.copyPages(pdfDoc, [0]);
      newPdfDoc.addPage(firstPage);

      const previewBytes = await newPdfDoc.save();
      const blob = new Blob([new Uint8Array(previewBytes)], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setCurrentStep("ready");
    } catch (error) {
      console.error("Error generating preview:", error);
      alert("Failed to generate preview");
    } finally {
      setIsProcessing(false);
    }
  }, [gristData, templateBytes]);

  useEffect(() => {
    if (gristData) {
      previewFirstPage();
    }
  }, [gristData, previewFirstPage]);

  // Cleanup URL when component unmounts or URL changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const savePdf = async () => {
    if (!completePdfBytes) {
      return;
    }

    try {
      setIsProcessing(true);
      await savePdfToGrist(
        completePdfBytes,
        gristData!,
        COLUMN_MAPPING_NAMES.PDF_OUTPUT.name,
        "filled",
      );
      alert("PDF saved successfully!");
    } catch (error) {
      console.error("Error saving PDF:", error);
      alert("Failed to save PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  // Call loadPdfTemplate when component mounts
  useEffect(() => {
    loadPdfTemplate();
  }, []);

  if (currentStep === "loading") {
    return <Title title={TITLE} />;
  }

  if (currentStep === "error") {
    return (
      <div>
        <Title title={`${TITLE} - Error`} />
        <div className="error-message">
          Failed to load PDF template. Please check if the template file exists.
        </div>
      </div>
    );
  }

  if (!gristData?.mappings || !mappingsIsReady(gristData.mappings)) {
    return (
      <div>
        <Title title={TITLE} />
        <Configuration>
          <p>{NO_DATA_MESSAGES.NO_MAPPING}</p>
        </Configuration>
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
      <Title title="OM Filler" />
      <div
        style={{
          padding: "0 10px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {isProcessing && <div>Generating preview...</div>}
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

export default OmFillerWidget;
