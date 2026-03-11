import { state } from "../state.js";
import { dom } from "../dom.js";

function getActiveText() {
  const obj = state.fabricCanvas?.getActiveObject();
  if (!obj) return null;
  if (obj.type !== "i-text" && obj.type !== "textbox" && obj.type !== "text") return null;
  return obj;
}

export function initToolbar() {
  dom.fontFamily.addEventListener("change", () => {
    const t = getActiveText();
    if (!t) return;
    t.set("fontFamily", dom.fontFamily.value);
    state.fabricCanvas.requestRenderAll();
  });

  dom.btnBold.addEventListener("click", () => {
    const t = getActiveText();
    if (!t) return;
    t.set("fontWeight", t.fontWeight === "bold" ? "normal" : "bold");
    state.fabricCanvas.requestRenderAll();
  });

  dom.btnItalic.addEventListener("click", () => {
    const t = getActiveText();
    if (!t) return;
    t.set("fontStyle", t.fontStyle === "italic" ? "normal" : "italic");
    state.fabricCanvas.requestRenderAll();
  });

  dom.btnUnderline.addEventListener("click", () => {
    const t = getActiveText();
    if (!t) return;
    t.set("underline", !t.underline);
    state.fabricCanvas.requestRenderAll();
  });
}