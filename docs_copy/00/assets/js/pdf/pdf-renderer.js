import { state } from "../state.js";
import { dom } from "../dom.js";
import { resizeTextOverlayToPdfCanvas } from "../text/text-editor.js";

export async function renderCurrentPage() {
  if (!state.pdfDoc) return;

  const page = await state.pdfDoc.getPage(state.currentPage);
  const viewport = page.getViewport({ scale: state.currentScale });

  const canvas = dom.pdfCanvas;
  const ctx = canvas.getContext("2d");

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;

  await page.render({ canvasContext: ctx, viewport }).promise;

  // mantiene overlay testo allineato dopo ogni render
  resizeTextOverlayToPdfCanvas();
}