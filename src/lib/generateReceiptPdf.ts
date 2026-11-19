import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function generateReceiptPdf(
  node: HTMLElement,
  filename: string,
): Promise<Blob> {
  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    y: Math.max(0, node.offsetTop - 24),
    height: node.offsetHeight + 24,
  });
  const dataUrl = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
  const blob = pdf.output("blob");
  pdf.save(filename);
  return blob;
}

export async function shareReceiptPdf(
  node: HTMLElement,
  filename: string,
): Promise<void> {
  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    y: Math.max(0, node.offsetTop - 24),
    height: node.offsetHeight + 24,
  });
  const dataUrl = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
  const blob = pdf.output("blob");
  const file = new File([blob], filename, { type: "application/pdf" });
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    (!navigator.canShare || navigator.canShare({ files: [file] }))
  ) {
    try {
      await navigator.share({
        files: [file],
        title: "Transaction receipt",
      });
      return;
    } catch {
      // Fall through to download when share is cancelled or unsupported.
    }
  }
  pdf.save(filename);
}
