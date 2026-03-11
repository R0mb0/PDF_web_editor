import { dom } from "./dom.js";
import { loadPdfFromFile } from "./pdf/pdf-loader.js";
import { renderCurrentPage } from "./pdf/pdf-renderer.js";
import { initTextEditor } from "./text/text-editor.js";
import { initToolbar } from "./ui/toolbar.js";
import { exportPdfPlaceholder } from "./pdf/pdf-export.js";

function showEditor() {
  dom.uploadSection.classList.add("hidden");
  dom.editorSection.classList.remove("hidden");
}

function wireUpload() {
  dom.btnSelectFile.addEventListener("click", () => dom.pdfInput.click());

  dom.pdfInput.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await loadPdfFromFile(file);
    showEditor();
    await renderCurrentPage();
    initTextEditor();
  });
}

function wireFooter() {
  dom.btnReset.addEventListener("click", () => window.location.reload());
  dom.btnSavePdf.addEventListener("click", async () => {
    await exportPdfPlaceholder();
  });
}

function wirePageActions() {
  dom.btnBlankPage.addEventListener("click", () => {
    alert("TODO: implementare aggiunta pagina vuota");
  });
  dom.btnDuplicatePage.addEventListener("click", () => {
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