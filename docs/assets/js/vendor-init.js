/* PDF.js worker path in locale */
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "./assets/libs/pdfjs/pdf.worker.min.js";
}