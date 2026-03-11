import { state } from "../state.js";

export async function exportPdfPlaceholder() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "pt", "a4");
  pdf.text("Export base pronto. Collegare qui il merge reale PDF+testi.", 40, 60);
  pdf.save(state.fileName || "output.pdf");
}