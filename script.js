// ===============================
// Musab PDF Converter Frontend JS
// ===============================

const menuToggle = document.getElementById("menuToggle");
const navbar = document.getElementById("navbar");
const dropZone = document.getElementById("dropZone");
const mainFileInput = document.getElementById("mainFileInput");
const selectFileBtn = document.getElementById("selectFileBtn");
const driveBtn = document.getElementById("driveBtn");
const selectedFileName = document.getElementById("selectedFileName");
const startProcessBtn = document.getElementById("startProcessBtn");
const globalStatus = document.getElementById("globalStatus");
const resultsList = document.getElementById("resultsList");
const mainLoader = document.getElementById("mainLoader");
const toolChips = document.querySelectorAll(".tool-chip");
const toolActionButtons = document.querySelectorAll(".tool-action");

let selectedMainFile = null;
let activeAction = "convert";

// Mobile nav
menuToggle?.addEventListener("click", () => {
  navbar.classList.toggle("show");
});

// Hero quick action chips
toolChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    toolChips.forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    activeAction = chip.dataset.action;
    globalStatus.textContent = `Selected action: ${activeAction}`;
  });
});

// PDF tool card buttons
toolActionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const toolName = button.dataset.tool;
    globalStatus.textContent = `${toolName} selected. Upload a file and click Start Processing.`;
    addResultItem(toolName, "Tool selected and ready to use.", null, false);
    window.location.href = "#downloads";
  });
});

// Main uploader
selectFileBtn.addEventListener("click", () => mainFileInput.click());

mainFileInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    selectedMainFile = e.target.files[0];
    selectedFileName.textContent = `Selected: ${selectedMainFile.name}`;
    globalStatus.textContent = "File selected successfully.";
  }
});

driveBtn.addEventListener("click", () => {
  globalStatus.textContent = "Google Drive import UI clicked. Connect real API later in production.";
  alert("Google Drive import is a demo UI in this project. You can connect the Google Picker API later.");
});

// Drag and drop
["dragenter", "dragover"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
  });
});

dropZone.addEventListener("drop", (e) => {
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    selectedMainFile = files[0];
    selectedFileName.textContent = `Selected: ${selectedMainFile.name}`;
    globalStatus.textContent = "File dropped successfully.";
  }
});

dropZone.addEventListener("click", () => mainFileInput.click());

// Fake processing flow
startProcessBtn.addEventListener("click", async () => {
  if (!selectedMainFile) {
    globalStatus.textContent = "Please select a file before processing.";
    alert("Please select a file first.");
    return;
  }

  mainLoader.classList.remove("hidden");
  globalStatus.textContent = `Processing ${selectedMainFile.name} for ${activeAction}...`;

  await wait(1800);

  const fakeBlob = new Blob(
    [`This is a demo processed file for: ${selectedMainFile.name} using action: ${activeAction}`],
    { type: "text/plain" }
  );
  const downloadUrl = URL.createObjectURL(fakeBlob);

  mainLoader.classList.add("hidden");
  globalStatus.textContent = "Processing complete. Your file is ready to download.";

  addResultItem(
    `${capitalize(activeAction)} Complete`,
    `${selectedMainFile.name} has been processed successfully.`,
    downloadUrl,
    true,
    "processed-demo-file.txt"
  );
});

// ===============================
// Editor Section
// ===============================
const editorArea = document.getElementById("editorArea");
const formatButtons = document.querySelectorAll(".format-btn, .align-btn");
const fontSizeSelector = document.getElementById("fontSizeSelector");
const insertImageInput = document.getElementById("insertImageInput");
const insertTextBoxBtn = document.getElementById("insertTextBoxBtn");
const savePdfBtn = document.getElementById("savePdfBtn");
const clearEditorBtn = document.getElementById("clearEditorBtn");

formatButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const command = btn.dataset.command;
    document.execCommand(command, false, null);
    editorArea.focus();
  });
});

fontSizeSelector.addEventListener("change", () => {
  document.execCommand("fontSize", false, fontSizeSelector.value);
  editorArea.focus();
});

insertImageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    document.execCommand("insertImage", false, reader.result);
    editorArea.focus();
  };
  reader.readAsDataURL(file);
});

insertTextBoxBtn.addEventListener("click", () => {
  const boxHTML = `
    <div style="border:1px solid #cbd5e1;padding:12px;border-radius:10px;margin:10px 0;background:#f8fafc;">
      New text box content...
    </div>
  `;
  document.execCommand("insertHTML", false, boxHTML);
  editorArea.focus();
});

savePdfBtn.addEventListener("click", async () => {
  try {
    const { PDFDocument, StandardFonts, rgb } = PDFLib;
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const plainText = editorArea.innerText || "Empty document";
    const wrapped = wrapText(plainText, 85);

    page.drawText(wrapped, {
      x: 40,
      y: 790,
      size: 12,
      font,
      color: rgb(0.1, 0.1, 0.1),
      lineHeight: 16
    });

    const pdfBytes = await pdfDoc.save();
    downloadBlob(pdfBytes, "editor-document.pdf", "application/pdf");
    addResultItem("Editor PDF Ready", "Your edited content has been exported as PDF.", null, false);
  } catch (error) {
    alert("Could not create PDF from editor content.");
    console.error(error);
  }
});

clearEditorBtn.addEventListener("click", () => {
  editorArea.innerHTML = "<p>Document cleared. Start writing again...</p>";
});

// ===============================
// OCR Section
// ===============================
const ocrImageInput = document.getElementById("ocrImageInput");
const ocrFileName = document.getElementById("ocrFileName");
const extractTextBtn = document.getElementById("extractTextBtn");
const ocrStatus = document.getElementById("ocrStatus");
const ocrResult = document.getElementById("ocrResult");
const copyTextBtn = document.getElementById("copyTextBtn");
const downloadTextBtn = document.getElementById("downloadTextBtn");
const textToPdfBtn = document.getElementById("textToPdfBtn");

let selectedOcrFile = null;

ocrImageInput.addEventListener("change", (e) => {
  selectedOcrFile = e.target.files[0];
  ocrFileName.textContent = selectedOcrFile
    ? `Selected: ${selectedOcrFile.name}`
    : "No OCR image selected";
});

extractTextBtn.addEventListener("click", async () => {
  if (!selectedOcrFile) {
    ocrStatus.textContent = "Please upload an image for OCR.";
    return;
  }

  ocrStatus.textContent = "Reading image and extracting text...";
  try {
    const {
      data: { text }
    } = await Tesseract.recognize(selectedOcrFile, "eng");
    ocrResult.value = text.trim() || "No readable text detected.";
    ocrStatus.textContent = "OCR extraction complete.";
    addResultItem("OCR Completed", "Text extracted from image successfully.", null, false);
  } catch (error) {
    console.error(error);
    ocrStatus.textContent = "OCR failed. Please try another image.";
  }
});

copyTextBtn.addEventListener("click", async () => {
  if (!ocrResult.value.trim()) return alert("No text available to copy.");
  await navigator.clipboard.writeText(ocrResult.value);
  ocrStatus.textContent = "Text copied to clipboard.";
});

downloadTextBtn.addEventListener("click", () => {
  if (!ocrResult.value.trim()) return alert("No text available to download.");
  const blob = new Blob([ocrResult.value], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  createDownloadLink(url, "ocr-text.txt");
  ocrStatus.textContent = "Text file download started.";
});

textToPdfBtn.addEventListener("click", async () => {
  if (!ocrResult.value.trim()) return alert("No extracted text available.");

  try {
    const { PDFDocument, StandardFonts, rgb } = PDFLib;
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText(wrapText(ocrResult.value, 85), {
      x: 40,
      y: 790,
      size: 12,
      font,
      color: rgb(0, 0, 0),
      lineHeight: 16
    });

    const pdfBytes = await pdfDoc.save();
    downloadBlob(pdfBytes, "ocr-text.pdf", "application/pdf");
    ocrStatus.textContent = "PDF created from extracted text.";
  } catch (error) {
    console.error(error);
    ocrStatus.textContent = "Could not create PDF from text.";
  }
});

// ===============================
// Image Tools Section
// ===============================
const imageEditorInput = document.getElementById("imageEditorInput");
const resizeWidth = document.getElementById("resizeWidth");
const resizeHeight = document.getElementById("resizeHeight");
const brightnessRange = document.getElementById("brightnessRange");
const contrastRange = document.getElementById("contrastRange");
const rotateLeftBtn = document.getElementById("rotateLeftBtn");
const rotateRightBtn = document.getElementById("rotateRightBtn");
const applyResizeBtn = document.getElementById("applyResizeBtn");
const cropDemoBtn = document.getElementById("cropDemoBtn");
const imageToPdfBtn = document.getElementById("imageToPdfBtn");
const downloadImageBtn = document.getElementById("downloadImageBtn");
const imageStatus = document.getElementById("imageStatus");
const imageCanvas = document.getElementById("imageCanvas");
const ctx = imageCanvas.getContext("2d");

let imageObject = null;
let rotation = 0;
let currentImageDataUrl = null;

imageEditorInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    imageObject = new Image();
    imageObject.onload = () => {
      currentImageDataUrl = reader.result;
      drawImageToCanvas();
      imageStatus.textContent = "Image loaded successfully.";
    };
    imageObject.src = reader.result;
  };
  reader.readAsDataURL(file);
});

brightnessRange.addEventListener("input", drawImageToCanvas);
contrastRange.addEventListener("input", drawImageToCanvas);

rotateLeftBtn.addEventListener("click", () => {
  rotation -= 90;
  drawImageToCanvas();
});

rotateRightBtn.addEventListener("click", () => {
  rotation += 90;
  drawImageToCanvas();
});

applyResizeBtn.addEventListener("click", () => {
  if (!imageObject) return alert("Please upload an image first.");
  drawImageToCanvas();
  imageStatus.textContent = "Resize values applied visually.";
});

cropDemoBtn.addEventListener("click", () => {
  if (!imageObject) return alert("Please upload an image first.");

  // Demo crop behavior
  const sx = imageObject.width * 0.1;
  const sy = imageObject.height * 0.1;
  const sw = imageObject.width * 0.8;
  const sh = imageObject.height * 0.8;

  ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
  ctx.drawImage(imageObject, sx, sy, sw, sh, 40, 40, imageCanvas.width - 80, imageCanvas.height - 80);
  imageStatus.textContent = "Demo crop applied to preview.";
});

downloadImageBtn.addEventListener("click", () => {
  if (!imageObject) return alert("Please upload an image first.");
  const url = imageCanvas.toDataURL("image/png");
  createDownloadLink(url, "edited-image.png");
  imageStatus.textContent = "Edited image download started.";
});

imageToPdfBtn.addEventListener("click", async () => {
  if (!imageObject) return alert("Please upload an image first.");

  try {
    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.create();
    const pngData = imageCanvas.toDataURL("image/png");
    const pngBytes = await fetch(pngData).then((res) => res.arrayBuffer());

    const pngImage = await pdfDoc.embedPng(pngBytes);
    const page = pdfDoc.addPage([pngImage.width, pngImage.height]);

    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: pngImage.width,
      height: pngImage.height
    });

    const pdfBytes = await pdfDoc.save();
    downloadBlob(pdfBytes, "image-to-pdf.pdf", "application/pdf");
    imageStatus.textContent = "Image converted to PDF successfully.";
  } catch (error) {
    console.error(error);
    imageStatus.textContent = "Image to PDF conversion failed.";
  }
});

function drawImageToCanvas() {
  if (!imageObject) return;

  const width = Number(resizeWidth.value) || imageObject.width;
  const height = Number(resizeHeight.value) || imageObject.height;
  const brightness = Number(brightnessRange.value);
  const contrast = Number(contrastRange.value);

  imageCanvas.width = Math.min(width, 900);
  imageCanvas.height = Math.min(height, 600);

  ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
  ctx.save();
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

  ctx.translate(imageCanvas.width / 2, imageCanvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);

  ctx.drawImage(
    imageObject,
    -imageCanvas.width / 2,
    -imageCanvas.height / 2,
    imageCanvas.width,
    imageCanvas.height
  );

  ctx.restore();
}

// ===============================
// Contact Form
// ===============================
const contactForm = document.getElementById("contactForm");
const contactStatus = document.getElementById("contactStatus");

contactForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!name || !email || !message) {
    contactStatus.textContent = "Please fill in all fields.";
    contactStatus.style.color = "red";
    return;
  }

  contactStatus.textContent = "Message submitted successfully. Connect this form to backend later.";
  contactStatus.style.color = "green";
  contactForm.reset();
});

// ===============================
// Utility Functions
// ===============================
function addResultItem(title, description, url = null, downloadable = false, fileName = "download.txt") {
  const wrapper = document.createElement("div");
  wrapper.className = "result-item";

  const content = document.createElement("div");
  content.innerHTML = `<h3>${title}</h3><p>${description}</p>`;

  const button = document.createElement("button");
  button.className = downloadable ? "btn btn-primary" : "btn btn-outline";
  button.textContent = "Download File";
  button.disabled = !downloadable;

  if (downloadable && url) {
    button.addEventListener("click", () => createDownloadLink(url, fileName));
  }

  wrapper.appendChild(content);
  wrapper.appendChild(button);
  resultsList.prepend(wrapper);
}

function createDownloadLink(url, fileName) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function downloadBlob(data, fileName, mimeType) {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  createDownloadLink(url, fileName);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function wrapText(text, lineLength = 85) {
  const words = text.split(" ");
  let lines = [];
  let currentLine = "";

  words.forEach((word) => {
    if ((currentLine + word).length > lineLength) {
      lines.push(currentLine);
      currentLine = word + " ";
    } else {
      currentLine += word + " ";
    }
  });

  lines.push(currentLine);
  return lines.join("\n");
}