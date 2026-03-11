import { state } from "../state.js";

export async function loadPdfFromFile(file) {
  if (!file) return;
  const data = await file.arrayBuffer();

  if (!window.pdfjsLib) {
    throw new Error("pdfjsLib non disponibile. Verifica vendor/pdfjs/pdf.min.js");
  }

  state.pdfDoc = await pdfjsLib.getDocument({ data }).promise;
  state.totalPages = state.pdfDoc.numPages;
  state.currentPage = 1;
  state.fileName = file.name.replace(/\.pdf$/i, "") + "_edited.pdf";
}