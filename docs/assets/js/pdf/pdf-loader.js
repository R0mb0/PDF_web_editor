import { state } from "../state.js";

export async function loadPdfFromFile(file) {
  const data = await file.arrayBuffer();
  state.pdfDoc = await pdfjsLib.getDocument({ data }).promise;
  state.totalPages = state.pdfDoc.numPages;
  state.currentPage = 1;
  state.fileName = file.name.replace(/\.pdf$/i, "") + "_edited.pdf";
}