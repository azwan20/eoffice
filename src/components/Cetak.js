import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function CetakPDF() {
  const handleDownloadPDF = async () => {
    const element = document.querySelector(".template"); // ambil elemen

    if (!element) return;

    // render jadi canvas dulu
    const canvas = await html2canvas(element, {
      scale: 2, // resolusi lebih tajam
    });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4"); // format A4 portrait
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    pdf.save("dokumen.pdf"); // download langsung
  };

  return (
    <div>
      <button className="print-button" onClick={handleDownloadPDF}>
        Download PDF
      </button>
    </div>
  );
}