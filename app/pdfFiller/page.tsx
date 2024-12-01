"use client";

import { useState, useEffect } from "react";
import { PDFDocument, PDFField, PDFRadioGroup, PDFTextField, PDFCheckBox, rgb } from 'pdf-lib';
import { useGristEffect } from "../../lib/grist/hooks";
import { addObjectInRecord, gristReady } from "../../lib/grist/plugin-api";
import { Title } from "../../components/Title";
import { Configuration } from "../../components/Configuration";
import { Footer } from "../../components/Footer";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { RowRecord } from "grist/GristData";
import { COLUMN_MAPPING_NAMES, NO_DATA_MESSAGES, TITLE } from "./constants";
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const TEMPLATE_PATH = '/templates/OM-EF-Chorus-DT_PDF_modifiable_V01_2024.pdf';

interface GristData {
  records: RowRecord[];
  mappings: WidgetColumnMap;
}

interface FormFieldInfo {
  name: string;
  type: 'text' | 'radio' | 'checkbox';
  options?: string[];  // For radio buttons
}

const PdfFillerWidget = () => {
  const [currentStep, setCurrentStep] = useState("loading");
  const [isProcessing, setIsProcessing] = useState(false);
  const [gristData, setGristData] = useState<GristData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [availableFields, setAvailableFields] = useState<FormFieldInfo[]>([]);
  const [templateBytes, setTemplateBytes] = useState<Uint8Array | null>(null);
  const [completePdfBytes, setCompletePdfBytes] = useState<Uint8Array | null>(null);

  const mappingsIsReady = (mappings: WidgetColumnMap) => {
    return Object.values(COLUMN_MAPPING_NAMES).every(
      (config) => mappings[config.name] !== undefined
    );
  };

  useGristEffect(() => {
    // Declare the required column mappings to Grist
    grist.ready({
      columns: Object.values(COLUMN_MAPPING_NAMES),
      requiredAccess: 'full',
    });

    // Get table ID and listen for record updates
    grist.onRecord(async (record, mappings) => {
      console.log('Record changed:', record);
      console.log('Mappings received:', mappings);
      setGristData({ records: [record], mappings });
      // Wait for state to update before generating preview
      setTimeout(() => previewFirstPage(), 0);
    });
  }, []);

  const getFieldType = (field: PDFField): FormFieldInfo => {
    if (field instanceof PDFTextField) {
      return { name: field.getName(), type: 'text' };
    }
    if (field instanceof PDFRadioGroup) {
      return {
        name: field.getName(),
        type: 'radio',
        options: field.getOptions()
      };
    }
    if (field instanceof PDFCheckBox) {
      return { name: field.getName(), type: 'checkbox' };
    }
    return { name: field.getName(), type: 'text' }; // default fallback
  };

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
      
      // Load the PDF document from cached bytes
      const pdfDoc = await PDFDocument.load(bytes);
      const form = pdfDoc.getForm();
      
      const fields = form.getFields();
      const fieldInfos = fields.map(getFieldType);
      setAvailableFields(fieldInfos);
      
      setCurrentStep("ready");
    } catch (error) {
      console.error('Error loading PDF template:', error);
      setCurrentStep("error");
    }
  };

  const uploadAttachment = async (blob: Blob, filename: string) => {
    const tokenInfo = await grist.docApi.getAccessToken({ readOnly: false });
    const gristUrl = `${tokenInfo.baseUrl}/attachments?auth=${tokenInfo.token}`;
    
    const formData = new FormData();
    formData.set("upload", blob, filename);
    
    const gristResponse = await fetch(gristUrl, {
      method: "POST",
      body: formData,
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    
    const response = await gristResponse.json();
    console.log(response)
    return response[0];
  };

    
  const downloadAttachment = async (attachmentId: number): Promise<ArrayBuffer> => {
    try {
      // Get access token for downloading attachment
      const tokenInfo = await grist.docApi.getAccessToken({ readOnly: true });
      const downloadUrl = `${tokenInfo.baseUrl}/attachments/${attachmentId}/download?auth=${tokenInfo.token}`;
      
      // Fetch the attachment file
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to download attachment: ${response.statusText}`);
      }
      
      // Return the file data as ArrayBuffer
      return await response.arrayBuffer();
    } catch (error) {
      console.error('Error downloading attachment:', error);
      throw error;
    }
  };

  const savePdfToGrist = async (pdfBytes: Uint8Array) => {
    if (!gristData?.records[0] || !gristData.mappings[COLUMN_MAPPING_NAMES.PDF_OUTPUT.name]) {
      console.error('Missing required Grist data');
      return;
    }

    try {
      const fileName = `filled_form_${new Date().toISOString()}.pdf`;
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      // Upload the file and get its ID
      const attachmentId = await uploadAttachment(blob, fileName);
    
      // Update record using addObjectInRecord
      const data: Partial<RowRecord> = {
        [gristData.mappings[COLUMN_MAPPING_NAMES.PDF_OUTPUT.name]]: ['L', attachmentId]
      };
      
      addObjectInRecord(gristData.records[0].id, data);

    } catch (error) {
      console.error('Error saving PDF to Grist:', error);
      alert('Failed to save PDF to Grist. Please try again.');
    }
  };
  
  const previewFirstPage = async () => {
    if (!templateBytes) {
      console.error('Template bytes not loaded.');
      return;
    }

    try {
      console.log('Starting preview generation...');
      setIsProcessing(true);
      
      // Load the PDF document from cached bytes
      const pdfDoc = await PDFDocument.load(templateBytes);
      const form = pdfDoc.getForm();
      
      // Fill form fields from Grist data
      if (gristData?.records[0] && gristData.mappings) {
        const record = gristData.records[0];
        console.log('Filling fields with record:', record);
        
        for (const [key, config] of Object.entries(COLUMN_MAPPING_NAMES)) {
          if (key === 'PDF_OUTPUT') continue;
          
          const columnId = config.name;
          const fieldMapping = config.form_field;
          
          const value = record[gristData.mappings[columnId] as keyof typeof record];
          console.log(`Processing ${columnId} with value:`, value);
          
          try {
            // Special handling for date signature
            if (key === 'DATE_SIGNATURE' && value && typeof fieldMapping === 'object') {
              const date = new Date(value);
              const formattedDate = date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
              
              const pages = pdfDoc.getPages();
              const firstPage = pages[0];
              const { x, y, fontSize } = fieldMapping;
              
              firstPage.drawText(formattedDate, {
                x,
                y,
                size: fontSize,
                color: rgb(0, 0, 0),  // Black color
              });
              continue;
            }

            // Special handling for checkbox fields (residence and boolean fields)
            if (['RESIDENCE_DEPART', 'RESIDENCE_RETOUR', 'HEBERGEMENT', 'AVANCE', 'ETAPE'].includes(key)) {
              if (typeof fieldMapping === 'object' && value !== '') {
                // For boolean fields, convert value to 'true' or 'false' string
                const lookupValue = typeof value === 'boolean' ? String(value) : value;
                const checkboxField = form.getFieldMaybe(fieldMapping[lookupValue as keyof typeof fieldMapping]);
                if (checkboxField instanceof PDFCheckBox) {
                  checkboxField.check();
                }
                continue;
              }
            }

            // Special handling for DateTime fields
            if (key === 'DATE_HEURE_DEPART' || key === 'DATE_HEURE_RETOUR') {
              if (typeof fieldMapping === 'object' && value) {
                const date = new Date(value);
                
                // Format date as DD/MM/YYYY
                const formattedDate = date.toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                });
                
                // Format time as HH:mm
                const formattedTime = date.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                });

                // Fill date field
                const dateField = form.getFieldMaybe(fieldMapping.date);
                if (dateField instanceof PDFTextField) {
                  dateField.setText(formattedDate);
                }

                // Fill time field
                const timeField = form.getFieldMaybe(fieldMapping.time);
                if (timeField instanceof PDFTextField) {
                  timeField.setText(formattedTime);
                }
                continue;
              }
            }

            // Special handling for transport field
            if (key === 'TRANSPORT') {
              if (typeof fieldMapping === 'object' && value) {
                if (['Train', 'Avion'].includes(value)) {
                  const transportField = form.getFieldMaybe(fieldMapping[value as keyof typeof fieldMapping]);
                  if (transportField instanceof PDFCheckBox) {
                    transportField.check();
                  }
                } else {
                  console.log('Autre', fieldMapping["Autre"]);
                  const otherField = form.getFieldMaybe(fieldMapping["Autre"]);
                  if (otherField instanceof PDFCheckBox) {
                    otherField.check();
                  }
                  const precisionField = form.getFieldMaybe(fieldMapping["Precision"]);
                  if (precisionField instanceof PDFTextField) {
                    precisionField.setText(value);
                  }
                }
                continue;
              }
            }
            
            // Special handling for signature
            if (key === 'SIGNATURE' && value && Array.isArray(value) && typeof fieldMapping === 'object') {
              const attachmentId = value[0];
              const imageBytes = await downloadAttachment(attachmentId);
              const image = await pdfDoc.embedPng(Buffer.from(imageBytes));
              
              const { x, y, maxHeight } = fieldMapping;
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
            if (key === 'SIGNATURE_LOCATION' && value && typeof fieldMapping === 'object') {
              const pages = pdfDoc.getPages();
              const firstPage = pages[0];
              const { x, y, fontSize } = fieldMapping;
              
              firstPage.drawText(String(value), {
                x,
                y,
                size: fontSize,
                color: rgb(0, 0, 0),  // Black color
              });
              continue;
            }

            // Regular form field handling
            const field = form.getFieldMaybe(fieldMapping);
            if (!field) {
              console.warn(`Field ${fieldMapping} not found in PDF form`);
              continue;
            }

            if (field instanceof PDFTextField) {
              field.setText(String(value));
            } else if (field instanceof PDFCheckBox) {
              value ? field.check() : field.uncheck();
            } else if (field instanceof PDFRadioGroup) {
              field.select(String(value));
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
      const blob = new Blob([previewBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setCurrentStep("ready");
      
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Failed to generate preview');
    } finally {
      setIsProcessing(false);
    }
  };

  // Cleanup URL when component unmounts or URL changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const savePdf = async () => {
    if (!completePdfBytes) return;
    
    try {
      setIsProcessing(true);
      await savePdfToGrist(completePdfBytes);
      alert('PDF saved successfully!');
    } catch (error) {
      console.error('Error saving PDF:', error);
      alert('Failed to save PDF');
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
          <p>Available PDF fields:</p>
          <ul>
            {availableFields.map(field => (
              <li key={field.name}>
                {field.name} ({field.type})
                {field.options && (
                  <span> - Options: {field.options.join(', ')}</span>
                )}
              </li>
            ))}
          </ul>
        </Configuration>
        <Footer dataSource={
          <span>PDF Filler powered by pdf-lib</span>
        } />
      </div>
    );
  }

  if (!gristData.records.length) {
    return (
      <div>
        <Title title={TITLE} />
        <div className="centered-column">
          <p>{NO_DATA_MESSAGES.NO_RECORDS}</p>
        </div>
        <Footer dataSource={
          <span>PDF Filler powered by pdf-lib</span>
        } />
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Title title="PDF Filler" />
      <div style={{ 
        padding: '0 10px', 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}>
        {isProcessing && <div>Generating preview...</div>}
        {previewUrl ? (
          <>
            <div className="pdf-preview" style={{
              flex: 1,
              width: '100%',
              minHeight: 0,
              marginBottom: '10px'
            }}>
              <iframe
                src={`${previewUrl}#view=FitV&zoom=page-fit&scrollbar=0&toolbar=0&navpanes=0`}
                width="100%"
                height="calc(100vh - 200px)"
                style={{
                  width: '100%',
                  height: 'calc(100vh - 200px)',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div style={{
              padding: '10px 0 20px 0',
              textAlign: 'center',
              position: 'sticky',
              bottom: 0,
            }}>
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
      <Footer dataSource={
        <span>PDF Filler powered by pdf-lib</span>
      } />
    </div>
  );
};

export default PdfFillerWidget;