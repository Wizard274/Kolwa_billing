import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const downloadInvoicePdf = async (elementId, filename = 'Kolwa-Invoice.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Invoice print element not found');
  }

  // Generate high-resolution canvas
  const canvas = await html2canvas(element, {
    scale: 2, // 2x scale for crisp print quality
    useCORS: true,
    logging: false,
    backgroundColor: '#FFFFFF'
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  // A4 dimensions in mm: 210 x 297
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // First page
  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;

  // Additional pages if lengthy item list
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }

  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
};
