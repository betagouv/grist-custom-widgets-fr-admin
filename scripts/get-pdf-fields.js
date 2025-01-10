const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function getFormFields(pdfPath) {
  try {
    // Read the PDF file
    const pdfBytes = fs.readFileSync(pdfPath);
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Get the form
    const form = pdfDoc.getForm();
    
    // Get all fields
    const fields = form.getFields();
    
    // Print field information
    fields.forEach(field => {
      console.log({
        name: field.getName(),
        type: field.constructor.name,
        // For radio groups, show available options
        ...(field.constructor.name === 'PDFRadioGroup' && {
          options: field.getOptions()
        })
      });
    });

  } catch (error) {
    console.error('Error reading PDF fields:', error);
  }
}

// Use the script
const pdfPath = './public/templates/om.pdf';
getFormFields(pdfPath); 