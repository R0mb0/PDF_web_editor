import { state } from "../state.js";
import { dom } from "../dom.js";

export function initTextEditor() {
  if (!window.fabric) return;

  state.fabricCanvas = new fabric.Canvas("pdfCanvas", {
    selection: true,
    preserveObjectStacking: true
  });

  state.fabricCanvas.on("mouse:dblclick", (opt) => {
    const pointer = state.fabricCanvas.getPointer(opt.e);
    const text = new fabric.IText("Nuovo testo", {
      left: pointer.x,
      top: pointer.y,
      fontFamily: dom.fontFamily.value || "Helvetica",
      fill: "#111",
      fontSize: 18
    });
    state.fabricCanvas.add(text);
    state.fabricCanvas.setActiveObject(text);
    text.enterEditing();
  });
}