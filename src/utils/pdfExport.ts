import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export async function exportReportToPdf(elementId: string, filename = 'Laporan_Akurasi_SMV_Produksi.pdf') {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element laporan tidak ditemukan untuk diekspor ke PDF.');
  }

  // Temporary style adjustment for high quality canvas capture
  const originalBackground = element.style.backgroundColor;
  element.style.backgroundColor = '#ffffff';

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // 2x resolution for retina/clean print clarity
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1280 // Ensure desktop proportion during capture
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 297; // A4 landscape width mm
    const pageHeight = 210; // A4 landscape height mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } finally {
    element.style.backgroundColor = originalBackground;
  }
}
