import { dom } from "./dom.js";
import { loadPdfFromFile } from "./pdf/pdf-loader.js";
import { renderCurrentPage } from "./pdf/pdf-renderer.js";
import { initTextEditor } from "./text/text-editor.js";
import { initToolbar } from "./ui/toolbar.js";
import { exportPdfPlaceholder } from "./pdf/pdf-export.js";

function showEditor() {
  dom.uploadSection?.classList.add("hidden");
  dom.editorSection?.classList.remove("hidden");
}

async function openFile(file) {
  if (!file) return;
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    alert("Seleziona un file PDF valido.");
    return;
  }

  try {
    await loadPdfFromFile(file);
    showEditor();
    await renderCurrentPage();
    initTextEditor();
  } catch (err) {
    console.error(err);
    alert("Errore durante il caricamento del PDF. Controlla librerie e console.");
  }
}

function wireUpload() {
  if (!dom.btnSelectFile || !dom.pdfInput || !dom.uploadSection) return;

  // Click bottone -> apri file picker
  dom.btnSelectFile.addEventListener("click", () => {
    dom.pdfInput.click();
  });

  // Cambio input file
  dom.pdfInput.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    await openFile(file);
    dom.pdfInput.value = "";
  });

  // Click sull'intera card (ma non sul bottone)
  dom.uploadSection.addEventListener("click", (e) => {
    if (e.target.closest("#btnSelectFile")) return;
    dom.pdfInput.click();
  });

  // Drag & Drop
  ["dragenter", "dragover"].forEach((evt) => {
    dom.uploadSection.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dom.uploadSection.classList.add("drag-over");
    });
  });

  ["dragleave", "dragend"].forEach((evt) => {
    dom.uploadSection.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dom.uploadSection.classList.remove("drag-over");
    });
  });

  dom.uploadSection.addEventListener("drop", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dom.uploadSection.classList.remove("drag-over");
    const file = e.dataTransfer?.files?.[0];
    await openFile(file);
  });
}

function wireFooter() {
  dom.btnReset?.addEventListener("click", () => window.location.reload());
  dom.btnSavePdf?.addEventListener("click", async () => {
    await exportPdfPlaceholder();
  });
}

function wirePageActions() {
  dom.btnBlankPage?.addEventListener("click", () => {
    alert("TODO: implementare aggiunta pagina vuota");
  });

  dom.btnDuplicatePage?.addEventListener("click", () => {
    alert("TODO: implementare duplicazione pagina");
  });
}

function bootstrap() {
  wireUpload();
  wireFooter();
  wirePageActions();
  initToolbar();
}

bootstrap();