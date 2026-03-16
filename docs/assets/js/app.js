pdfjsLib.GlobalWorkerOptions.workerSrc = "./assets/libs/pdfjs/pdf.worker.min.js";

        let originalPdfBytes = null;
        let pdfDoc = null;
        let currentScale = 1.5; 
        let globalAlign = 'left';
        let fileName = 'document.pdf';
        let activeTextElement = null;
        let activeWrapperForMenu = null;

        const dropzone = document.getElementById('dropzone');
        const fileInput = document.getElementById('file-input');
        const workspace = document.getElementById('workspace');
        const pdfContainer = document.getElementById('pdf-container');
        const globalTools = document.getElementById('global-tools');
        const bottomActions = document.getElementById('bottom-actions');
        
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        const zoomInput = document.getElementById('zoom-input');
        
        const floatingToolbar = document.getElementById('floating-toolbar');
        const toolFont = document.getElementById('tool-font');
        const toolSize = document.getElementById('tool-size');

        const addPageMenu = document.getElementById('add-page-menu');
        const btnAddBlank = document.getElementById('btn-add-blank');
        const btnAddCopy = document.getElementById('btn-add-copy');

        dropzone.addEventListener('click', () => fileInput.click());
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('border-primary', 'bg-blue-50', 'dark:bg-blue-900/20');
        });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('border-primary', 'bg-blue-50', 'dark:bg-blue-900/20'));
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('border-primary', 'bg-blue-50', 'dark:bg-blue-900/20');
            if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files[0]);
        });
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) handleFileUpload(e.target.files[0]);
        });

        zoomInBtn.addEventListener('click', () => updateZoom(currentScale + 0.2));
        zoomOutBtn.addEventListener('click', () => updateZoom(currentScale - 0.2));
        zoomInput.addEventListener('change', (e) => {
            let val = parseInt(e.target.value.replace('%', ''));
            if (!isNaN(val) && val > 10) updateZoom(val / 100);
            else updateZoomDisplay();
        });

        document.querySelectorAll('.align-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                globalAlign = btn.dataset.align;
                document.querySelectorAll('.align-btn').forEach(b => b.classList.remove('text-primary'));
                btn.classList.add('text-primary');
                if(activeTextElement) activeTextElement.style.textAlign = globalAlign;
            });
        });

        document.getElementById('btn-reset').addEventListener('click', () => {
            if(confirm("Are you sure you want to reset all changes?")) {
                loadPdfFromBytes(originalPdfBytes);
            }
        });

        document.getElementById('btn-save').addEventListener('click', async () => await saveModifiedPdf());

        btnAddBlank.addEventListener('click', () => {
            addPageMenu.style.display = 'none';
            if (activeWrapperForMenu) addBlankPage(activeWrapperForMenu);
        });

        btnAddCopy.addEventListener('click', () => {
            addPageMenu.style.display = 'none';
            if (activeWrapperForMenu) duplicatePage(activeWrapperForMenu);
        });

        async function handleFileUpload(file) {
            if (file.type !== 'application/pdf') {
                alert('Please upload a valid PDF file.');
                return;
            }
            fileName = file.name;
            const arrayBuffer = await file.arrayBuffer();
            originalPdfBytes = new Uint8Array(arrayBuffer);
            
            dropzone.classList.add('hidden');
            workspace.classList.remove('hidden');
            globalTools.classList.remove('opacity-50', 'pointer-events-none');
            bottomActions.classList.remove('hidden');

            loadPdfFromBytes(originalPdfBytes);
        }

        async function loadPdfFromBytes(bytes) {
            pdfContainer.innerHTML = ''; 
            floatingToolbar.style.display = 'none';
            addPageMenu.style.display = 'none';

            try {
                const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
                pdfDoc = await loadingTask.promise;
                
                for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                    await renderPage(pageNum);
                }
            } catch (error) {
                console.error("PDF load error:", error);
                alert("Unable to load the PDF.");
            }
        }

        async function renderPage(pageNum) {
            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: currentScale });
            const unscaledViewport = page.getViewport({ scale: 1.0 });

            const wrapper = document.createElement('div');
            wrapper.className = 'page-wrapper';
            wrapper.style.width = `${viewport.width}px`;
            wrapper.style.height = `${viewport.height}px`;
            
            wrapper.dataset.originalIndex = pageNum - 1;
            wrapper.dataset.isNew = 'false';
            wrapper.dataset.pdfWidth = unscaledViewport.width;
            wrapper.dataset.pdfHeight = unscaledViewport.height;

            const controls = document.createElement('div');
            controls.className = 'page-controls';
            controls.innerHTML = `
                <button class="page-btn relative group add-page-btn tooltip" data-tooltip="Add/Copy Page"><i class="ph ph-plus font-bold"></i></button>
                <button class="page-btn delete-page-btn tooltip hover:text-red-500 hover:border-red-500" data-tooltip="Delete Page"><i class="ph ph-x font-bold"></i></button>
            `;
            wrapper.appendChild(controls);

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            wrapper.appendChild(canvas);

            const textLayerDiv = document.createElement('div');
            textLayerDiv.className = 'text-layer';
            textLayerDiv.style.width = `${viewport.width}px`;
            textLayerDiv.style.height = `${viewport.height}px`;
            wrapper.appendChild(textLayerDiv);

            textLayerDiv.addEventListener('dblclick', (e) => {
                if(e.target === textLayerDiv) createNewTextElement(e, textLayerDiv);
            });

            pdfContainer.appendChild(wrapper);
            attachPageControlEvents(wrapper);

            const renderContext = { canvasContext: context, viewport: viewport };
            await page.render(renderContext).promise;

            try {
                const textContent = await page.getTextContent();
                await pdfjsLib.renderTextLayer({
                    textContentSource: textContent,
                    container: textLayerDiv,
                    viewport: viewport,
                    textDivs: []
                });
                makeTextFieldsEditable(textLayerDiv);
            } catch(e) { console.warn("Text Layer failed:", e); }
        }

        function createNewTextElement(e, layerDiv) {
            const rect = layerDiv.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const span = document.createElement('span');
            span.textContent = 'New Text';
            span.dataset.originalText = '';
            span.dataset.isNewlyCreated = 'true';
            
            span.style.left = `${x}px`;
            span.style.top = `${y}px`;
            
            span.style.fontSize = `${14 * currentScale}px`;
            span.dataset.fontSize = '14'; 
            span.style.fontFamily = 'Helvetica';
            span.dataset.fontFamily = 'Helvetica';
            
            span.setAttribute('contenteditable', 'true');
            span.classList.add('text-modified'); 
            span.style.color = 'black'; 
            span.style.minWidth = '30px';
            
            layerDiv.appendChild(span);
            
            span.addEventListener('focus', handleTextFocus);
            span.addEventListener('blur', handleTextBlur);
            
            setTimeout(() => span.focus(), 50);
        }

        function addBlankPage(afterWrapper) {
            let width = 595.28; 
            let height = 841.89; 
            
            if (afterWrapper) {
                width = parseFloat(afterWrapper.dataset.pdfWidth) || width;
                height = parseFloat(afterWrapper.dataset.pdfHeight) || height;
            }
            
            const scaledWidth = width * currentScale;
            const scaledHeight = height * currentScale;

            const wrapper = document.createElement('div');
            wrapper.className = 'page-wrapper';
            wrapper.style.width = `${scaledWidth}px`;
            wrapper.style.height = `${scaledHeight}px`;
            
            wrapper.dataset.isNew = 'true';
            wrapper.dataset.pdfWidth = width;
            wrapper.dataset.pdfHeight = height;

            const controls = document.createElement('div');
            controls.className = 'page-controls';
            controls.innerHTML = `
                <button class="page-btn relative group add-page-btn tooltip" data-tooltip="Add/Copy Page"><i class="ph ph-plus font-bold"></i></button>
                <button class="page-btn delete-page-btn tooltip hover:text-red-500 hover:border-red-500" data-tooltip="Delete Page"><i class="ph ph-x font-bold"></i></button>
            `;
            wrapper.appendChild(controls);

            const canvas = document.createElement('canvas');
            canvas.width = scaledWidth;
            canvas.height = scaledHeight;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, scaledWidth, scaledHeight);
            wrapper.appendChild(canvas);

            const textLayerDiv = document.createElement('div');
            textLayerDiv.className = 'text-layer';
            textLayerDiv.style.width = `${scaledWidth}px`;
            textLayerDiv.style.height = `${scaledHeight}px`;
            
            textLayerDiv.addEventListener('dblclick', (e) => {
                if(e.target === textLayerDiv) createNewTextElement(e, textLayerDiv);
            });
            wrapper.appendChild(textLayerDiv);

            if (afterWrapper) afterWrapper.after(wrapper);
            else pdfContainer.appendChild(wrapper);
            
            attachPageControlEvents(wrapper);
            wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        function duplicatePage(sourceWrapper) {
            const width = parseFloat(sourceWrapper.dataset.pdfWidth);
            const height = parseFloat(sourceWrapper.dataset.pdfHeight);
            const scaledWidth = width * currentScale;
            const scaledHeight = height * currentScale;

            const newWrapper = document.createElement('div');
            newWrapper.className = 'page-wrapper';
            newWrapper.style.width = `${scaledWidth}px`;
            newWrapper.style.height = `${scaledHeight}px`;
            
            newWrapper.dataset.originalIndex = sourceWrapper.dataset.originalIndex || '';
            newWrapper.dataset.isNew = sourceWrapper.dataset.isNew;
            newWrapper.dataset.pdfWidth = width;
            newWrapper.dataset.pdfHeight = height;

            const controls = document.createElement('div');
            controls.className = 'page-controls';
            controls.innerHTML = `
                <button class="page-btn relative group add-page-btn tooltip" data-tooltip="Add/Copy Page"><i class="ph ph-plus font-bold"></i></button>
                <button class="page-btn delete-page-btn tooltip hover:text-red-500 hover:border-red-500" data-tooltip="Delete Page"><i class="ph ph-x font-bold"></i></button>
            `;
            newWrapper.appendChild(controls);

            const sourceCanvas = sourceWrapper.querySelector('canvas');
            const newCanvas = document.createElement('canvas');
            newCanvas.width = scaledWidth;
            newCanvas.height = scaledHeight;
            const ctx = newCanvas.getContext('2d');
            ctx.drawImage(sourceCanvas, 0, 0);
            newWrapper.appendChild(newCanvas);

            const sourceTextLayer = sourceWrapper.querySelector('.text-layer');
            const newTextLayer = document.createElement('div');
            newTextLayer.className = 'text-layer';
            newTextLayer.style.width = `${scaledWidth}px`;
            newTextLayer.style.height = `${scaledHeight}px`;
            
            newTextLayer.addEventListener('dblclick', (e) => {
                if(e.target === newTextLayer) createNewTextElement(e, newTextLayer);
            });

            const sourceSpans = sourceTextLayer.querySelectorAll('span');
            sourceSpans.forEach(span => {
                const newSpan = document.createElement('span');
                newSpan.innerHTML = span.innerHTML;
                newSpan.className = span.className;
                newSpan.style.cssText = span.style.cssText;
                Object.assign(newSpan.dataset, span.dataset);
                newSpan.setAttribute('contenteditable', 'true');
                newSpan.addEventListener('focus', handleTextFocus);
                newSpan.addEventListener('blur', handleTextBlur);
                newTextLayer.appendChild(newSpan);
            });

            newWrapper.appendChild(newTextLayer);
            sourceWrapper.after(newWrapper);
            attachPageControlEvents(newWrapper);
            newWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        function attachPageControlEvents(wrapper) {
            wrapper.querySelector('.delete-page-btn').addEventListener('click', () => {
                if(confirm('Delete this page?')) wrapper.remove();
            });
            wrapper.querySelector('.add-page-btn').addEventListener('click', (e) => {
                activeWrapperForMenu = wrapper;
                const rect = e.target.closest('button').getBoundingClientRect();
                addPageMenu.style.display = 'flex';
                addPageMenu.style.top = `${rect.bottom + window.scrollY + 5}px`;
                addPageMenu.style.left = `${rect.left + window.scrollX}px`;
            });
        }

        function updateZoom(newScale) {
            if (newScale < 0.5) newScale = 0.5;
            if (newScale > 3.0) newScale = 3.0;
            currentScale = newScale;
            updateZoomDisplay();
            if (originalPdfBytes) loadPdfFromBytes(originalPdfBytes); 
        }

        function updateZoomDisplay() {
            zoomInput.value = Math.round(currentScale * 100) + '%';
        }

        function makeTextFieldsEditable(layerDiv) {
            const spans = layerDiv.querySelectorAll('span');
            spans.forEach(span => {
                if(span.offsetWidth === 0) return; 
                
                span.style.maxWidth = `${span.offsetWidth + 20}px`; 
                span.style.minWidth = `${span.offsetWidth}px`;
                span.setAttribute('contenteditable', 'true');
                span.dataset.originalText = span.textContent;
                
                const style = window.getComputedStyle(span);
                span.dataset.fontFamily = style.fontFamily;
                span.dataset.fontSize = style.fontSize;

                span.addEventListener('focus', handleTextFocus);
                span.addEventListener('blur', handleTextBlur);
            });
        }

        function handleTextFocus(e) {
            activeTextElement = e.target;
            positionToolbar(e.target);
            
            const style = window.getComputedStyle(e.target);
            toolSize.value = parseInt(style.fontSize);
            if(style.fontFamily.toLowerCase().includes('times')) toolFont.value = 'Times-Roman';
            else if(style.fontFamily.toLowerCase().includes('courier')) toolFont.value = 'Courier';
            else toolFont.value = 'Helvetica';
        }

        function handleTextBlur(e) {
            const span = e.target;
            const currentText = span.textContent.replace(/\n/g, '').trim();
            const originalText = (span.dataset.originalText || '').replace(/\n/g, '').trim();

            if (currentText !== originalText || span.dataset.isNewlyCreated === 'true') {
                span.classList.add('text-modified');
                if(currentText === '') {
                    span.innerHTML = '&nbsp;'; 
                    span.style.color = 'transparent';
                    span.style.backgroundColor = 'transparent';
                    if (span.dataset.isNewlyCreated !== 'true') span.classList.add('text-modified');
                    else span.remove();
                } else {
                    span.style.color = 'black';
                }
            } else {
                span.classList.remove('text-modified');
                span.style.color = 'transparent';
                span.innerHTML = span.dataset.originalText;
            }
        }

        function positionToolbar(element) {
            const rect = element.getBoundingClientRect();
            floatingToolbar.style.display = 'flex';
            floatingToolbar.style.top = `${rect.top + window.scrollY - floatingToolbar.offsetHeight - 10}px`;
            
            let leftPos = rect.left + window.scrollX + (rect.width / 2) - (floatingToolbar.offsetWidth / 2);
            if(leftPos < 10) leftPos = 10;
            floatingToolbar.style.left = `${leftPos}px`;
        }

        document.addEventListener('mousedown', (e) => {
            if(floatingToolbar.style.display === 'flex') {
                if(!floatingToolbar.contains(e.target) && (!activeTextElement || !activeTextElement.contains(e.target))) {
                    floatingToolbar.style.display = 'none';
                    activeTextElement = null;
                }
            }
            if(addPageMenu.style.display === 'flex') {
                if(!addPageMenu.contains(e.target) && !e.target.closest('.add-page-btn')) {
                    addPageMenu.style.display = 'none';
                }
            }
        });

        toolFont.addEventListener('change', (e) => { if(activeTextElement) activeTextElement.style.fontFamily = e.target.value; });
        toolSize.addEventListener('input', (e) => { if(activeTextElement) activeTextElement.style.fontSize = `${e.target.value}px`; });

        // ✅ FIX SALVATAGGIO:
        // 1) Usiamo coordinate basate su offsetLeft/offsetTop (più stabili di getBoundingClientRect)
        // 2) pulizia font-family da virgolette/fallback
        // 3) escape testo non sicuro e gestione righe multiple
        // 4) try/catch per singolo span così un errore non blocca tutto il salvataggio
        function sanitizeFontName(fontName) {
            if (!fontName) return 'Helvetica';
            const first = fontName.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
            if (first.includes('times')) return 'Times-Roman';
            if (first.includes('courier')) return 'Courier';
            return 'Helvetica';
        }

        function normalizeTextForPdf(text) {
            if (!text) return '';
            return text
                .replace(/\u00A0/g, ' ')
                .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
                .replace(/\r/g, '');
        }

        async function saveModifiedPdf() {
            if (!originalPdfBytes) {
                alert("No PDF loaded.");
                return;
            }

            try {
                const sourcePdf = await PDFLib.PDFDocument.load(originalPdfBytes);
                const newPdf = await PDFLib.PDFDocument.create();

                const fontHelvetica = await newPdf.embedFont(PDFLib.StandardFonts.Helvetica);
                const fontTimes = await newPdf.embedFont(PDFLib.StandardFonts.TimesRoman);
                const fontCourier = await newPdf.embedFont(PDFLib.StandardFonts.Courier);

                const getFont = (name) => {
                    const cleaned = sanitizeFontName(name);
                    if (cleaned === 'Times-Roman') return fontTimes;
                    if (cleaned === 'Courier') return fontCourier;
                    return fontHelvetica;
                };

                const wrappers = document.querySelectorAll('.page-wrapper');

                for (let i = 0; i < wrappers.length; i++) {
                    const wrapper = wrappers[i];
                    let pageLib;
                    
                    if (wrapper.dataset.isNew === 'true') {
                        const w = parseFloat(wrapper.dataset.pdfWidth) || 595.28;
                        const h = parseFloat(wrapper.dataset.pdfHeight) || 841.89;
                        pageLib = newPdf.addPage([w, h]);
                    } else {
                        const origIndex = parseInt(wrapper.dataset.originalIndex, 10);
                        if (Number.isNaN(origIndex)) continue;
                        const [copiedPage] = await newPdf.copyPages(sourcePdf, [origIndex]);
                        newPdf.addPage(copiedPage);
                        pageLib = newPdf.getPage(newPdf.getPageCount() - 1);
                    }

                    const pageHeight = pageLib.getHeight();
                    const spans = wrapper.querySelectorAll('.text-layer > span');

                    spans.forEach(span => {
                        try {
                            let currentText = normalizeTextForPdf((span.textContent || '').trim());
                            const originalText = normalizeTextForPdf((span.dataset.originalText || '').trim());

                            if (currentText === '\u00A0') currentText = '';
                            const changed = (currentText !== originalText) || (span.dataset.isNewlyCreated === 'true');
                            if (!changed) return;

                            const x = span.offsetLeft / currentScale;
                            const yHtml = span.offsetTop / currentScale;

                            const widthPx = span.offsetWidth || parseFloat(span.style.width) || 0;
                            const heightPx = span.offsetHeight || parseFloat(span.style.height) || 0;
                            const width = widthPx / currentScale;
                            const height = heightPx / currentScale;

                            const yPdf = pageHeight - yHtml - height;

                            if (span.dataset.isNewlyCreated !== 'true' && width > 0 && height > 0) {
                                pageLib.drawRectangle({
                                    x: Math.max(0, x - 1),
                                    y: Math.max(0, yPdf - 1),
                                    width: width + 2,
                                    height: height + 2,
                                    color: PDFLib.rgb(1, 1, 1),
                                });
                            }

                            if (currentText !== '') {
                                const rawFontSize = span.style.fontSize || span.dataset.fontSize || '12px';
                                const pxSize = parseFloat(String(rawFontSize).replace('px', '')) || 12;
                                const finalSize = Math.max(4, pxSize / currentScale);

                                const lines = currentText.split('\n').map(l => l.trimEnd());
                                const lineHeight = finalSize * 1.2;
                                const font = getFont(span.style.fontFamily || span.dataset.fontFamily);

                                lines.forEach((line, idx) => {
                                    if (!line) return;
                                    pageLib.drawText(line, {
                                        x: x,
                                        y: yPdf + Math.max(0, (lines.length - 1 - idx) * lineHeight),
                                        size: finalSize,
                                        font,
                                        color: PDFLib.rgb(0, 0, 0),
                                    });
                                });
                            }
                        } catch (spanError) {
                            console.warn('Skip span due to draw error:', spanError, span);
                        }
                    });
                }

                const pdfBytes = await newPdf.save({ useObjectStreams: false });
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const newName = fileName.replace(/\.pdf$/i, '') + '_changed.pdf';
                a.download = newName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

            } catch (error) {
                console.error("Save error:", error);
                alert("An error occurred while saving.\n\nDetails: " + (error?.message || error));
            }
        }