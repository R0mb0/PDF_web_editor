import { state } from "../state.js";
import { dom } from "../dom.js";

export async function exportPdfPlaceholder() {
  // Export "visivo" dello stato corrente (PDF renderizzato + overlay testo)
  // in un nuovo PDF pagina singola. È volutamente semplice ma funzionante.
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "pt", "a4");

  const merged = document.createElement("canvas");
  merged.width = dom.pdfCanvas.width;
  merged.height = dom.pdfCanvas.height;
  const mctx = merged.getContext("2d");

  mctx.drawImage(dom.pdfCanvas, 0, 0);

  if (state.fabricCanvas) {
    const overlayCanvas = state.fabricCanvas.lowerCanvasEl;
    mctx.drawImage(overlayCanvas, 0, 0);
  }

  const img = merged.toDataURL("image/png");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = (merged.height * pageW) / merged.width;

  pdf.addImage(img, "PNG", 0, 0, pageW, pageH);
  pdf.save(state.fileName || "output.pdf");
}