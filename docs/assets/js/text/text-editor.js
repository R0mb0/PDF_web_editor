import { state } from "../state.js";
import { dom } from "../dom.js";

/**
 * Crea un canvas Fabric sovrapposto al canvas PDF.
 * In questo modo il PDF resta "sfondo", il testo è editabile sopra.
 */
export function initTextEditorOverlay() {
  if (!window.fabric) return;
  if (state.fabricCanvas) {
    state.fabricCanvas.dispose();
    state.fabricCanvas = null;
  }

  const overlayCanvas = document.createElement("canvas");
  overlayCanvas.id = "textOverlayCanvas";
  overlayCanvas.className = "text-overlay-canvas";

  dom.canvasStack.innerHTML = "";
  dom.canvasStack.appendChild(dom.pdfCanvas);
  dom.canvasStack.appendChild(overlayCanvas);

  overlayCanvas.width = dom.pdfCanvas.width;
  overlayCanvas.height = dom.pdfCanvas.height;
  overlayCanvas.style.width = `${dom.pdfCanvas.width}px`;
  overlayCanvas.style.height = `${dom.pdfCanvas.height}px`;

  state.fabricCanvas = new fabric.Canvas("textOverlayCanvas", {
    selection: true,
    preserveObjectStacking: true
  });

  state.fabricCanvas.on("mouse:dblclick", (opt) => {
    const pointer = state.fabricCanvas.getPointer(opt.e);
    const text = new fabric.IText("Nuovo testo", {
      left: pointer.x,
      top: pointer.y,
      fontFamily: dom.fontFamily?.value || "Helvetica",
      fill: "#111",
      fontSize: 18
    });
    state.fabricCanvas.add(text);
    state.fabricCanvas.setActiveObject(text);
    text.enterEditing();
  });
}

export function resizeTextOverlayToPdfCanvas() {
  if (!state.fabricCanvas) return;

  const w = dom.pdfCanvas.width;
  const h = dom.pdfCanvas.height;

  const overlayEl = state.fabricCanvas.getElement();
  overlayEl.width = w;
  overlayEl.height = h;
  overlayEl.style.width = `${w}px`;
  overlayEl.style.height = `${h}px`;

  state.fabricCanvas.setWidth(w);
  state.fabricCanvas.setHeight(h);
  state.fabricCanvas.requestRenderAll();
}