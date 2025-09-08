document.addEventListener('DOMContentLoaded', function() {
    window.pdfToProcess = null;
    window.processedImages = null;
    window.currentTicketIndex = -1;
    window.currentRotation = 0;
    window.isExtractionInProgress = false;
    window.ticketResults = new Map();
    window.cropper = null;

    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    const dropzone = document.getElementById('dropzone');
    const fileUpload = document.getElementById('file-upload');
    const fileInfo = document.getElementById('file-info');
    const fileNameEl = document.getElementById('file-name');
    const fileSizeEl = document.getElementById('file-size');
    const removeFileBtn = document.getElementById('remove-file');
    const processPdfBtn = document.getElementById('process-pdf');
    const processingSection = document.getElementById('processing');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const progressPercentage = document.getElementById('progress-percentage');
    const successMessageSection = document.getElementById('success-message');
    const numTicketsExtractedEl = document.getElementById('num-tickets-extracted');
    const nextStepSection = document.getElementById('next-step');
    const goToExtractionBtn = document.getElementById('go-to-extraction');

    const ticketsContainer = document.getElementById('tickets-container');
    const selectAllTicketsBtn = document.getElementById('select-all-tickets');
    const processSelectedBtn = document.getElementById('process-selected');
    const previewImageEl = document.getElementById('preview-image');
    const rotateLeftBtn = document.getElementById('rotate-left');
    const rotateRightBtn = document.getElementById('rotate-right');
    const saveRotationBtn = document.getElementById('save-rotation');
    const resetCropBtn = document.getElementById('reset-crop');
    const promptInputEl = document.getElementById('prompt-input');
    const startExtractionBtn = document.getElementById('start-extraction');
    const extractionStatusEl = document.getElementById('extraction-status');
    const extractionLoadingSpinnerEl = document.getElementById('extraction-loading-spinner');
    const resultsAreaEl = document.getElementById('extraction-results');
    const copyResultsBtn = document.getElementById('copy-results');
    const downloadCsvBtn = document.getElementById('download-csv');
    const downloadTxtBtn = document.getElementById('download-txt');
    const saveResultsBtn = document.getElementById('save-results');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.id.replace('tab-', 'content-');
            tabButtons.forEach(btn => {
                btn.classList.remove('bg-white', 'shadow', 'text-gray-800');
                btn.classList.add('text-gray-600');
            });
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            button.classList.add('bg-white', 'shadow', 'text-gray-800');
            button.classList.remove('text-gray-600');
            document.getElementById(tabId).classList.add('active');
        });
    });

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('active');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('active');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('active');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    dropzone.addEventListener('click', (e) => {
         const clickedLabel = e.target.closest('label[for="file-upload"]');

         fileUpload.value = '';

         if (clickedLabel) {
             console.log("Dropzone click handler detected click originating from Label. Relying on native behavior.");
         } else {
             console.log("Dropzone background or non-label element clicked. Attempting programmatic click.");
             fileUpload.click();
         }
    });


    fileUpload.addEventListener('change', () => {
        console.log("File input change event fired.");
        if (fileUpload.files.length > 0) {
             console.log("File selected:", fileUpload.files[0].name);
            handleFile(fileUpload.files[0]);
        } else {
             console.log("File input cleared or no file selected.");
        }
    });

    async function handleFile(file) {
         if (!file) {
             console.error("handleFile called without a file.");
             window.showNotification('Aucun fichier n\'a été sélectionné.', 'error');
             return;
         }

         const maxFileSize = 20 * 1048576;
         if (file.size > maxFileSize) {
              window.showNotification(`Le fichier est trop volumineux (${formatFileSize(file.size)}). La taille maximale est ${formatFileSize(maxFileSize)}.`, 'error');
              fileUpload.value = '';
              return;
         }

        if (file.type === 'application/pdf') {
            console.log(`Handling PDF file: ${file.name}`);
            window.pdfToProcess = null;
            window.processedImages = null;
            window.currentTicketIndex = -1;
            window.ticketResults = new Map();
            ticketsContainer.innerHTML = '';

            fileNameEl.textContent = file.name;
            fileSizeEl.textContent = formatFileSize(file.size);
            fileInfo.classList.remove('hidden');
            dropzone.classList.add('hidden');

            window.pdfToProcess = file;

            processPdfBtn.disabled = false;
            processPdfBtn.classList.remove('opacity-50');
            processingSection.classList.add('hidden');
            progressBarFill.style.width = '0%';
            progressPercentage.textContent = '0%';
            successMessageSection.classList.add('hidden');
            nextStepSection.classList.add('hidden');
            resultsAreaEl.value = '';
            extractionStatusEl.textContent = 'En attente...';
            extractionStatusEl.className = 'text-sm font-medium text-gray-500';
            extractionLoadingSpinnerEl.classList.add('hidden');

             if (window.cropper) {
                 window.cropper.destroy();
                 window.cropper = null;
             }
             previewImageEl.src = '';
             previewImageEl.style.transform = 'rotate(0deg)';
             window.currentRotation = 0;
             saveRotationBtn.classList.add('hidden');
             resetCropBtn.classList.add('hidden');


        } else {
            window.showNotification('Veuillez sélectionner un fichier PDF.', 'error');
            fileUpload.value = '';
        }
    }

    removeFileBtn.addEventListener('click', () => {
        fileUpload.value = '';
        console.log("File removed. Input value cleared.");

        fileInfo.classList.add('hidden');
        dropzone.classList.remove('hidden');

        processPdfBtn.disabled = false;
        processPdfBtn.classList.remove('opacity-50');
        processingSection.classList.add('hidden');
        progressBarFill.style.width = '0%';
        progressPercentage.textContent = '0%';
        successMessageSection.classList.add('hidden');
        nextStepSection.classList.add('hidden');

        window.pdfToProcess = null;
        window.processedImages = null;
        window.currentTicketIndex = -1;
        window.ticketResults = new Map();
        ticketsContainer.innerHTML = '';

        if (window.cropper) {
            window.cropper.destroy();
            window.cropper = null;
        }
        previewImageEl.src = '';
        previewImageEl.style.transform = 'rotate(0deg)';
        window.currentRotation = 0;
        saveRotationBtn.classList.add('hidden');
        resetCropBtn.classList.add('hidden');
        resultsAreaEl.value = '';
        extractionStatusEl.textContent = 'En attente...';
        extractionStatusEl.className = 'text-sm font-medium text-gray-500';
        extractionLoadingSpinnerEl.classList.add('hidden');
    });

    processPdfBtn.addEventListener('click', async () => {
        if (!window.pdfToProcess) {
            window.showNotification('Veuillez d\'abord sélectionner un fichier PDF.', 'error');
            return;
        }

        processPdfBtn.disabled = true;
        processPdfBtn.classList.add('opacity-50');
        processingSection.classList.remove('hidden');
        progressBarFill.style.width = '0%';
        progressPercentage.textContent = '0%';
        successMessageSection.classList.add('hidden');
        nextStepSection.classList.add('hidden');


        try {
            const pages = await processPDF(window.pdfToProcess, (progress) => {
                 const percentage = Math.round(progress * 100);
                 progressBarFill.style.width = `${percentage}%`;
                 progressPercentage.textContent = `${percentage}%`;
             });

            window.processedImages = pages;

            progressBarFill.style.width = '100%';
            progressPercentage.textContent = '100%';

            processingSection.classList.add('hidden');
            successMessageSection.classList.remove('hidden');
            numTicketsExtractedEl.textContent = `${pages.length} ticket${pages.length > 1 ? 's' : ''} ont été extraits du PDF.`;
            nextStepSection.classList.remove('hidden');

            updateTicketsList(pages);

            if (pages.length > 0) {
                 setTimeout(() => {
                     const firstTicketItem = ticketsContainer.querySelector('.ticket-item');
                     if (firstTicketItem) {
                          firstTicketItem.click();
                     }
                 }, 50);
            } else {
                 if (window.cropper) {
                     window.cropper.destroy();
                     window.cropper = null;
                 }
                 previewImageEl.src = '';
                 window.currentTicketIndex = -1;
                 previewImageEl.style.transform = 'rotate(0deg)';
                 window.currentRotation = 0;
                 saveRotationBtn.classList.add('hidden');
                 resetCropBtn.classList.add('hidden');
            }


        } catch (error) {
            window.showNotification('Erreur lors du traitement du PDF. Veuillez réessayer.', 'error');
            console.error('PDF Processing Error:', error);
            processPdfBtn.disabled = false;
            processPdfBtn.classList.remove('opacity-50');
            processingSection.classList.add('hidden');
            progressBarFill.style.width = '0%';
            progressPercentage.textContent = '0%';
        }
    });

     async function processPDF(file, onProgress) {
         const arrayBuffer = await file.arrayBuffer();
         const pdf = await pdfjsLib.getDocument({ data: arrayBuffer, verbosity: 0 }).promise;
         const pages = [];

         for (let i = 1; i <= pdf.numPages; i++) {
             const page = await pdf.getPage(i);
             const viewport = page.getViewport({ scale: 2.0 });

             const canvas = document.createElement('canvas');
             const context = canvas.getContext('2d');
             canvas.width = viewport.width;
             canvas.height = viewport.height;

             const renderContext = {
                 canvasContext: context,
                 viewport: viewport,
             };

             try {
                await page.render(renderContext).promise;
                 pages.push(canvas.toDataURL('image/png'));
             } catch (renderError) {
                  console.error(`Error rendering page ${i}:`, renderError);
                  window.showNotification(`Attention: Erreur lors du rendu de la page ${i}. Elle sera ignorée.`, 'warning', 5000);
             } finally {
                 page.cleanup();
             }

             if (onProgress) {
                 onProgress(i / pdf.numPages);
             }
         }
         pdf.destroy();

         if (onProgress) {
             onProgress(1);
         }
         return pages.filter(page => page !== null);
     }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' octets';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    }

    window.showNotification = function(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            notification.addEventListener('transitionend', () => notification.remove());
        }, duration);
    }

    function updateTicketsList(pages) {
        ticketsContainer.innerHTML = '';
        if (pages.length === 0) {
             ticketsContainer.innerHTML = '<p class="text-gray-500 text-center p-4">Aucun ticket extrait du PDF.</p>';
             return;
        }

        pages.forEach((page, index) => {
            const ticketItem = document.createElement('div');
            ticketItem.className = `ticket-item p-3 rounded-lg flex items-center justify-between hover:bg-gray-50`;
            ticketItem.dataset.ticketIndex = index;
            ticketItem.innerHTML = `
                <div class="flex items-center flex-1 min-w-0">
                    <input type="checkbox" class="custom-checkbox mr-3" data-ticket-index="${index}">
                    <div class="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full mr-3 flex-shrink-0">
                        <i class="ri-file-list-line text-gray-500"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-medium text-gray-700 truncate">Ticket #${index + 1}</p>
                        <p class="ticket-status-text status-pending text-gray-500">En attente</p>
                    </div>
                </div>
                <button class="preview-btn w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 flex-shrink-0" title="Prévisualiser">
                    <i class="ri-eye-line"></i>
                </button>
            `;

            const checkbox = ticketItem.querySelector('.custom-checkbox');
            const previewBtn = ticketItem.querySelector('.preview-btn');

             checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                 ticketItem.classList.toggle('bg-primary', checkbox.checked);
                 ticketItem.classList.toggle('bg-opacity-5', checkbox.checked);
            });

            ticketItem.addEventListener('click', (e) => {
                 const isCheckboxClick = e.target === checkbox || checkbox.contains(e.target);
                 const isPreviewBtnClick = e.target === previewBtn || previewBtn.contains(e.target);

                 if (window.isExtractionInProgress) {
                     window.showNotification("Extraction en cours. Impossible de changer de ticket.", "info");
                     e.stopPropagation();
                     return;
                 }

                 if (!isCheckboxClick && !isPreviewBtnClick) {
                     checkbox.checked = !checkbox.checked;
                     checkbox.dispatchEvent(new Event('change'));
                 }

                 if (!isCheckboxClick) {
                    handleTicketPreview(index);

                     document.querySelectorAll('.ticket-item').forEach(item => item.classList.remove('active'));
                     ticketItem.classList.add('active');
                 }
            });

            previewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                 if (window.isExtractionInProgress) {
                     window.showNotification("Extraction en cours. Impossible de changer de ticket.", "info");
                     return;
                 }
                handleTicketPreview(index);
                document.querySelectorAll('.ticket-item').forEach(item => item.classList.remove('active'));
                ticketItem.classList.add('active');
            });

             function handleTicketPreview(indexToPreview) {
                 if (window.isExtractionInProgress) {
                     console.log("Attempted to handle preview while extraction is in progress.");
                     return;
                 }

                 if (window.processedImages && window.processedImages[indexToPreview]) {
                     if (window.cropper) {
                         window.cropper.destroy();
                         window.cropper = null;
                     }

                     previewImageEl.src = window.processedImages[indexToPreview];
                     window.currentTicketIndex = indexToPreview;
                     previewImageEl.style.transform = 'rotate(0deg)';
                     window.currentRotation = 0;
                     saveRotationBtn.classList.add('hidden');
                     resetCropBtn.classList.add('hidden');

                     previewImageEl.onload = () => {
                         window.cropper = new Cropper(previewImageEl, {
                             aspectRatio: NaN,
                             viewMode: 1,
                             autoCropArea: 1,
                             responsive: true,
                              ready: function () {
                                 resetCropBtn.classList.remove('hidden');
                              },
                              crop: function() {
                                 saveRotationBtn.classList.remove('hidden');
                              }
                         });
                         previewImageEl.onload = null;
                     };


                     if (window.ticketResults.has(indexToPreview)) {
                          const result = window.ticketResults.get(indexToPreview);
                          resultsAreaEl.value = result.text;
                          const status = result.status;
                          extractionStatusEl.textContent = `Résultat stocké (${status})`;
                          extractionStatusEl.classList.remove('text-gray-500', 'text-blue-500', 'text-green-500', 'text-red-500');
                           if (status === 'Terminé' || status === 'Aucun Article') {
                                extractionStatusEl.classList.add('text-green-500');
                           } else if (status === 'Erreur' || status === 'API Invalide') {
                                extractionStatusEl.classList.add('text-red-500');
                           } else {
                                extractionStatusEl.classList.add('text-gray-500');
                           }
                          extractionLoadingSpinnerEl.classList.add('hidden');

                     } else {
                          resultsAreaEl.value = '';
                          extractionStatusEl.textContent = 'Prêt pour extraction';
                          extractionStatusEl.classList.remove('text-blue-500', 'text-green-500', 'text-red-500');
                          extractionStatusEl.classList.add('text-gray-500');
                          extractionLoadingSpinnerEl.classList.add('hidden');
                     }

                 } else {
                     if (window.cropper) {
                         window.cropper.destroy();
                         window.cropper = null;
                     }
                     previewImageEl.src = '';
                     window.currentTicketIndex = -1;
                     previewImageEl.style.transform = 'rotate(0deg)';
                     window.currentRotation = 0;
                     saveRotationBtn.classList.add('hidden');
                     resetCropBtn.classList.add('hidden');
                     resultsAreaEl.value = '';
                     extractionStatusEl.textContent = 'Aucun ticket sélectionné';
                     extractionStatusEl.classList.remove('text-blue-500', 'text-green-500', 'text-red-500');
                     extractionStatusEl.classList.add('text-gray-500');
                     extractionLoadingSpinnerEl.classList.add('hidden');
                 }
             }

            ticketsContainer.appendChild(ticketItem);
        });

         selectAllTicketsBtn.addEventListener('click', () => {
             const checkboxes = document.querySelectorAll('.custom-checkbox');
             const allChecked = Array.from(checkboxes).every(cb => cb.checked);
             checkboxes.forEach(cb => {
                 cb.checked = !allChecked;
                  cb.dispatchEvent(new Event('change'));
             });
         });
    }

    resetCropBtn.addEventListener('click', () => {
         if (window.cropper) {
             window.cropper.reset();
             window.showNotification("Rognage réinitialisé.", "info");
             saveRotationBtn.classList.add('hidden');
         } else {
             window.showNotification("Aucune image à réinitialiser.", "info");
         }
    });


    rotateLeftBtn.addEventListener('click', () => {
         if (window.currentTicketIndex === -1 || !window.processedImages || !window.processedImages[window.currentTicketIndex]) {
              window.showNotification("Veuillez sélectionner un ticket à faire pivoter.", "error");
              return;
          }
         if (window.isExtractionInProgress) {
             window.showNotification("Extraction en cours. Impossible de faire pivoter.", "info");
             return;
         }
        currentRotation = (currentRotation - 90 + 360) % 360;
        previewImageEl.style.transform = `rotate(${currentRotation}deg)`;
        saveRotationBtn.classList.remove('hidden');

         if (window.cropper) {
             window.cropper.rotate(-90);
             saveRotationBtn.classList.add('hidden');
         } else {
             
             const canvas = document.createElement('canvas');
             const ctx = canvas.getContext('2d');
             const img = previewImageEl;
             if (!img.naturalWidth) { window.showNotification("L'image n'est pas complètement chargée.", "error"); return; }
             const rad = currentRotation * Math.PI / 180;
             const absCos = Math.abs(Math.cos(rad));
             const absSin = Math.abs(Math.sin(rad));
             canvas.width = img.naturalWidth * absCos + img.naturalHeight * absSin;
             canvas.height = img.naturalWidth * absSin + img.naturalHeight * absCos;
             ctx.translate(canvas.width / 2, canvas.height / 2);
             ctx.rotate(rad);
             ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
             previewImageEl.src = canvas.toDataURL('image/png');
             previewImageEl.style.transform = 'rotate(0deg)';
         }
    });

    rotateRightBtn.addEventListener('click', () => {
         if (window.currentTicketIndex === -1 || !window.processedImages || !window.processedImages[window.currentTicketIndex]) {
              window.showNotification("Veuillez sélectionner un ticket à faire pivoter.", "error");
              return;
          }
         if (window.isExtractionInProgress) {
             window.showNotification("Extraction en cours. Impossible de faire pivoter.", "info");
             return;
         }
        currentRotation = (currentRotation + 90) % 360;
        previewImageEl.style.transform = `rotate(${currentRotation}deg)`;
        saveRotationBtn.classList.remove('hidden');

         if (window.cropper) {
             window.cropper.rotate(90);
             saveRotationBtn.classList.add('hidden');
         } else {
             const canvas = document.createElement('canvas');
             const ctx = canvas.getContext('2d');
             const img = previewImageEl;
             if (!img.naturalWidth) { window.showNotification("L'image n'est pas complètement chargée.", "error"); return; }
             const rad = currentRotation * Math.PI / 180;
             const absCos = Math.abs(Math.cos(rad));
             const absSin = Math.abs(Math.sin(rad));
             canvas.width = img.naturalWidth * absCos + img.naturalHeight * absSin;
             canvas.height = img.naturalWidth * absSin + img.naturalHeight * absCos;
             ctx.translate(canvas.width / 2, canvas.height / 2);
             ctx.rotate(rad);
             ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
             previewImageEl.src = canvas.toDataURL('image/png');
             previewImageEl.style.transform = 'rotate(0deg)';
         }
    });

    saveRotationBtn.addEventListener('click', () => {
         if (window.currentTicketIndex === -1 || !window.processedImages || !window.processedImages[window.currentTicketIndex]) {
             window.showNotification("Aucun ticket sélectionné à sauvegarder.", "error");
             return;
         }
         if (window.isExtractionInProgress) {
             window.showNotification("Extraction en cours. Impossible de sauvegarder.", "info");
             return;
         }

         let finalImageUrl = null;

         if (window.cropper) {
             const croppedCanvas = window.cropper.getCroppedCanvas();
             if (croppedCanvas) {
                 finalImageUrl = croppedCanvas.toDataURL('image/png');
             } else {
                 window.showNotification("Erreur lors de la création de l'image rognée.", "error");
                 return;
             }
         } else {
            
              if (window.currentRotation !== 0) {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  const img = previewImageEl; 

                   if (!img.naturalWidth) { window.showNotification("L'image n'est pas complètement chargée.", "error"); return; }

                  const rad = window.currentRotation * Math.PI / 180;
                  const absCos = Math.abs(Math.cos(rad));
                  const absSin = Math.abs(Math.sin(rad));
                  canvas.width = img.naturalWidth * absCos + img.naturalHeight * absSin;
                  canvas.height = img.naturalWidth * absSin + img.naturalHeight * absCos;

                  ctx.translate(canvas.width / 2, ctx.height / 2);
                  ctx.rotate(rad);
                  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
                  finalImageUrl = canvas.toDataURL('image/png');
              } else {
                 finalImageUrl = previewImageEl.src; 
              }
         }

         if (!finalImageUrl) {
             window.showNotification("Erreur: Impossible d'obtenir l'image à sauvegarder.", "error");
             return;
         }


         if (window.cropper) {
             window.cropper.destroy();
             window.cropper = null;
         }
         previewImageEl.src = finalImageUrl;
         previewImageEl.style.transform = 'rotate(0deg)'; 
         window.currentRotation = 0; 
         saveRotationBtn.classList.add('hidden'); 
         resetCropBtn.classList.add('hidden'); 

         window.processedImages[window.currentTicketIndex] = finalImageUrl;

         window.showNotification(`Modifications sauvegardées pour le Ticket #${window.currentTicketIndex + 1}`, "success");
     });

     function setExtractionInProgress(inProgress) {
          window.isExtractionInProgress = inProgress;
          const disable = inProgress;

          startExtractionBtn.disabled = disable;
          processSelectedBtn.disabled = disable;
          saveResultsBtn.disabled = disable;

          ticketsContainer.classList.toggle('pointer-events-none', disable);
          ticketsContainer.classList.toggle('opacity-50', disable);

          if (window.cropper) {
              if (disable) {
                  window.cropper.disable();
              } else {
                  window.cropper.enable();
              }
          }
          rotateLeftBtn.disabled = disable;
          rotateRightBtn.disabled = disable;
          resetCropBtn.disabled = disable;
          saveRotationBtn.disabled = disable;
     }


     startExtractionBtn.addEventListener('click', () => {
         if (window.currentTicketIndex === -1 || !window.processedImages || !window.processedImages[window.currentTicketIndex]) {
             window.showNotification("Veuillez sélectionner un ticket à extraire.", "error");
             return;
         }
          if (window.isExtractionInProgress) {
             window.showNotification("Une extraction est déjà en cours.", "info");
             return;
         }


         let imageBase64 = null;
         if (window.cropper) {
             const croppedCanvas = window.cropper.getCroppedCanvas();
             if (croppedCanvas) {
                 imageBase64 = croppedCanvas.toDataURL('image/png').split(',')[1];
             } else {
                 window.showNotification("Erreur lors de la récupération de l'image rognée pour l'extraction.", "error");
                 return;
             }
         } else if (window.processedImages && window.processedImages[window.currentTicketIndex]) {
             imageBase64 = window.processedImages[window.currentTicketIndex].split(',')[1];
         } else {
              window.showNotification("Aucune image disponible pour l'extraction.", "error");
              return;
         }


         const prompt = promptInputEl.value.trim();

         if (!prompt) {
             window.showNotification("Le prompt d'extraction ne peut pas être vide.", "error");
             return;
         }

         resultsAreaEl.value = '';
         setExtractionInProgress(true);

         if (typeof Shiny !== "undefined") {
            const householdCode = window.pdfToProcess ? window.pdfToProcess.name.replace(/\.pdf$/i, '') : 'Inconnu';
            const ticketNumber = `Ticket #${window.currentTicketIndex + 1}`;

             Shiny.setInputValue('extractSingleTicket', {
                 image: imageBase64,
                 prompt: prompt,
                 index: window.currentTicketIndex,
                 householdCode: householdCode,
                 ticketNumber: ticketNumber
             }, { priority: 'event' });
         } else {
              console.error("Shiny is not defined. Are you running in a Shiny environment?");
              window.showNotification("Erreur: Environnement Shiny non détecté.", "error");
              extractionStatusEl.textContent = 'Erreur (Non-Shiny)';
              extractionStatusEl.className = 'text-sm font-medium text-red-500';
              extractionLoadingSpinnerEl.classList.add('hidden');
              setExtractionInProgress(false);
         }
     });

     processSelectedBtn.addEventListener('click', () => {
         const selectedCheckboxes = document.querySelectorAll('.custom-checkbox:checked');
         const selectedTickets = Array.from(selectedCheckboxes)
             .map(cb => parseInt(cb.dataset.ticketIndex));

         if (selectedTickets.length === 0) {
             window.showNotification('Veuillez sélectionner au moins un ticket à traiter.', 'error');
             return;
         }
         if (window.isExtractionInProgress) {
             window.showNotification("Une extraction est déjà en cours.", "info");
             return;
         }

         if (!window.processedImages || window.processedImages.length === 0) {
              window.showNotification("Aucune image traitée disponible pour l'extraction.", "error");
              return;
         }

         const imagesBase64 = selectedTickets
            .map(index => {
                 if (window.processedImages[index]) {
                     return window.processedImages[index].split(',')[1];
                 } else {
                     console.warn(`Image data not found for index ${index}`);
                     return null;
                 }
             })
             .filter(img => img !== null);

         const prompt = promptInputEl.value.trim();

         if (!prompt) {
             window.showNotification("Le prompt d'extraction ne peut pas être vide.", "error");
             return;
         }

         if (imagesBase64.length === 0) {
              window.showNotification("Aucune image valide trouvée parmi la selection.", "error");
              return;
         }

         resultsAreaEl.value = '';
         setExtractionInProgress(true);

         if (typeof Shiny !== "undefined") {
            const householdCode = window.pdfToProcess ? window.pdfToProcess.name.replace(/\.pdf$/i, '') : 'Inconnu';
            const ticketNumbers = selectedTickets.map(index => `Ticket #${index + 1}`);

             Shiny.setInputValue('ocrRequest', {
                 images: imagesBase64,
                 prompt: prompt,
                 indices: selectedTickets,
                 householdCode: householdCode,
                 ticketNumbers: ticketNumbers
             }, { priority: 'event' });
         } else {
              console.error("Shiny is not defined. Are you running in a Shiny environment?");
              window.showNotification("Erreur: Environnement Shiny non détecté.", "error");
              extractionStatusEl.textContent = 'Erreur (Non-Shiny)';
              extractionStatusEl.className = 'text-sm font-medium text-red-500';
              extractionLoadingSpinnerEl.classList.add('hidden');
              setExtractionInProgress(false);
         }
     });

    saveResultsBtn.addEventListener('click', () => {
        const extractedResults = resultsAreaEl.value.trim();

        if (!extractedResults) {
            window.showNotification('Aucun résultat à enregistrer.', 'info');
            return;
        }

        const householdCode = window.pdfToProcess ? window.pdfToProcess.name.replace(/\.pdf$/i, '') : 'Inconnu';
        const ticketNumber = window.currentTicketIndex !== -1 ? `Ticket #${window.currentTicketIndex + 1}` : 'Inconnu';

        let dataToSend = {
            results: extractedResults,
            ticketIndex: window.currentTicketIndex,
            householdCode: householdCode,
            ticketNumber: ticketNumber
        };

        if (typeof Shiny !== "undefined") {
            Shiny.setInputValue('manualSaveExtractedResults', dataToSend, { priority: 'event' });
        } else {
            console.error("Shiny is not defined. Cannot send data to R server.");
            window.showNotification("Erreur: Environnement Shiny non détecté. Impossible d'enregistrer les résultats.", "error");
        }
    });

    if (typeof Shiny !== "undefined") {
        Shiny.addCustomMessageHandler('ocrResponse', function(message) {
            console.log("Batch OCR Response received:", message);
            resultsAreaEl.value = message.response;
        });

        Shiny.addCustomMessageHandler('ocrSingleResponse', function(message) {
             console.log("Single OCR Response received:", message);
             if (message.hasOwnProperty('response') && message.hasOwnProperty('index') && message.hasOwnProperty('status')) {
                 window.ticketResults.set(message.index, { status: message.status, text: message.response });
                 if (window.currentTicketIndex === message.index) {
                     resultsAreaEl.value = message.response;
                     const status = message.status;
                     extractionStatusEl.textContent = `Résultat stocké (${status})`;
                     extractionStatusEl.classList.remove('text-gray-500', 'text-blue-500', 'text-green-500', 'text-red-500');
                     if (status === 'Terminé' || status === 'Aucun Article') {
                         extractionStatusEl.classList.add('text-green-500');
                     } else if (status === 'Erreur' || status === 'API Invalide') {
                         extractionStatusEl.classList.add('text-red-500');
                     } else {
                         extractionStatusEl.classList.add('text-gray-500');
                     }
                     extractionLoadingSpinnerEl.classList.add('hidden');
                 }
             } else {
                  console.error("ocrSingleResponse message has unexpected format:", message);
             }
        });


        Shiny.addCustomMessageHandler('updateTicketStatus', function(message) {
             const ticketItem = ticketsContainer.querySelector(`div.ticket-item[data-ticket-index="${message.index}"]`);
             if (ticketItem) {
                 const statusTextEl = ticketItem.querySelector('.ticket-status-text');
                 statusTextEl.textContent = message.status;
                 statusTextEl.classList.remove('status-pending', 'status-processing', 'status-success', 'status-error', 'text-gray-500', 'text-blue-500', 'text-green-500', 'text-red-500');

                 if (message.processing) {
                      statusTextEl.classList.add('status-processing', 'text-blue-500');
                     if (!window.ticketResults.has(message.index)) {
                          window.ticketResults.set(message.index, { status: message.status, text: '' });
                     } else {
                         window.ticketResults.get(message.index).status = message.status;
                     }
                 } else if (message.success) {
                      statusTextEl.classList.add('status-success', 'text-green-500');
                       if (!window.ticketResults.has(message.index)) {
                           window.ticketResults.set(message.index, { status: message.status, text: '' });
                       } else {
                           window.ticketResults.get(message.index).status = message.status;
                       }
                 } else if (message.error) {
                      statusTextEl.classList.add('status-error', 'text-red-500');
                      if (!window.ticketResults.has(message.index)) {
                           window.ticketResults.set(message.index, { status: message.status, text: message.error_detail ? `Erreur: ${message.error_detail}` : '' });
                      } else {
                           window.ticketResults.get(message.index).status = message.status;
                           if(message.error_detail) window.ticketResults.get(message.index).text = `Erreur: ${message.error_detail}`;
                      }

                 } else {
                      statusTextEl.classList.add('status-pending', 'text-gray-500');
                       if (!window.ticketResults.has(message.index)) {
                           window.ticketResults.set(message.index, { status: message.status, text: '' });
                       } else {
                           window.ticketResults.get(message.index).status = message.status;
                       }
                 }
             }
        });

        Shiny.addCustomMessageHandler('updateExtractionStatus', function(message) {
              console.log("Extraction Status Update:", message);
              extractionStatusEl.textContent = message.status;

               extractionStatusEl.classList.remove('text-gray-500', 'text-blue-500', 'text-green-500', 'text-red-500');
               if (message.color) {
                  extractionStatusEl.classList.add(`text-${message.color}-500`);
               } else {
                   extractionStatusEl.classList.add('text-gray-500');
               }

              if (message.loading) {
                   extractionLoadingSpinnerEl.classList.remove('hidden');
              } else {
                   extractionLoadingSpinnerEl.classList.add('hidden');
              }
              if (message.loading === false) {
                  setExtractionInProgress(false);
              }
         });

         Shiny.addCustomMessageHandler('ocrError', function(message) {
             console.error("Generic OCR Error received:", message);
             resultsAreaEl.value = `Erreur inattendue: ${message}`;

             extractionStatusEl.textContent = 'Erreur inattendue';
             extractionStatusEl.className = 'text-sm font-medium text-red-500';
             extractionLoadingSpinnerEl.classList.add('hidden');

             window.showNotification(`Erreur: ${message}`, "error");
             setExtractionInProgress(false);
         });

         Shiny.addCustomMessageHandler('showNotification', function(message) {
             if (message.message) {
                 window.showNotification(message.message, message.type || 'info', message.duration || 3000);
             }
         });
    }

    copyResultsBtn.addEventListener('click', () => {
        if (resultsAreaEl.value.trim()) {
            navigator.clipboard.writeText(resultsAreaEl.value)
                .then(() => window.showNotification('Résultats copiés dans le presse-papier', 'success'))
                .catch(err => {
                    console.error('Failed to copy:', err);
                    window.showNotification('Erreur lors de la copie.', 'error');
                });
        } else {
             window.showNotification('Aucun résultat à copier.', 'info');
        }
    });

    downloadCsvBtn.addEventListener('click', () => {
        if (resultsAreaEl.value.trim()) {
            const content = resultsAreaEl.value;
            const lines = content.split('\n').filter(line => line.trim() !== '' && !line.startsWith('---') && !line.startsWith('Erreur: '));
            const csvContent = lines
                .map(line => {
                    const parts = line.split('|').map(s => s.trim());
                    if (parts.length >= 2) {
                        const item = parts[0].replace(/"/g, '""');
                        const price = parts[1].replace(/"/g, '""');
                        return `"${item}","${price}"`;
                    } else if (parts.length === 1 && parts[0]) {
                         const item = parts[0].replace(/"/g, '""');
                         return `"${item}",""`;
                    }
                    return '';
                })
                .filter(line => line !== '')
                .join('\n');

            const householdCode = window.pdfToProcess ? window.pdfToProcess.name.replace(/\.pdf$/i, '') : 'Inconnu';
            const ticketNumber = window.currentTicketIndex !== -1 ? `Ticket #${window.currentTicketIndex + 1}` : 'Inconnu';
            
            const header = "Article,Prix,No_Ticket,Menages\n";
            const finalCsvContent = header + lines
                .map(line => {
                    const parts = line.split('|').map(s => s.trim());
                    if (parts.length >= 2) {
                        const item = parts[0].replace(/"/g, '""');
                        const price = parts[1].replace(/"/g, '""');
                        // Inclure No_Ticket et Menages pour chaque ligne
                        return `"${item}","${price}","${ticketNumber}","${householdCode}"`;
                    } else if (parts.length === 1 && parts[0]) {
                         const item = parts[0].replace(/"/g, '""');
                         return `"${item}","","${ticketNumber}","${householdCode}"`;
                    }
                    return '';
                })
                .filter(line => line !== '')
                .join('\n');


             if (csvContent.trim() === "" && lines.length > 0) {
                 window.showNotification("Impossible de parser les résultats actuels au format CSV (attendu: 'Article | Prix').", "warning");
                 return;
             } else if (csvContent.trim() === "") {
                  window.showNotification("Aucun résultat au format attendu trouvé pour exporter en CSV.", "info");
                  return;
             }

            downloadFile(finalCsvContent, 'text/csv', 'extraction_resultats.csv');
        } else {
             window.showNotification('Aucun résultat à télécharger.', 'info');
        }
    });

    downloadTxtBtn.addEventListener('click', () => {
        if (resultsAreaEl.value.trim()) {
            downloadFile(resultsAreaEl.value, 'text/plain', 'extraction_resultats.txt');
        } else {
             window.showNotification('Aucun résultat à télécharger.', 'info');
        }
    });

    function downloadFile(content, type, defaultFileName) {
        const blob = new Blob([content], { type: type });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');

        const originalFileName = window.pdfToProcess ? window.pdfToProcess.name.replace(/\.pdf$/i, '') : 'extraction_resultats';
        const extension = type === 'text/csv' ? '.csv' : '.txt';
        const fileName = `${originalFileName}${extension}`;

        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

     goToExtractionBtn.addEventListener('click', () => {
         document.getElementById('tab-extraction').click();
     });

     if (tabButtons.length > 0 && tabContents.length > 0) {
          const anyActive = Array.from(tabContents).some(content => content.classList.contains('active'));
          if (!anyActive) {
             tabButtons[0].classList.add('bg-white', 'shadow', 'text-gray-800');
             tabButtons[0].classList.remove('text-gray-600');
             tabContents[0].classList.add('active');
          } else {
              const activeContentId = document.querySelector('.tab-content.active').id;
              const activeTabButton = document.getElementById(`tab-${activeContentId.replace('content-', '')}`);
               if (activeTabButton) {
                   activeTabButton.classList.add('bg-white', 'shadow', 'text-gray-800');
                   activeTabButton.classList.remove('text-gray-600');
               }
          }
     }

     console.log("script.js loaded and DOMContentLoaded fired.");

});