/**
 * Musab PDF Converter Backend
 * Beginner-friendly Express server
 * Demo structure for uploads, OCR, and PDF actions
 */

const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const { PDFDocument } = require("pdf-lib");
const Tesseract = require("tesseract.js");

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/**
 * Demo upload route
 */
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  res.json({
    success: true,
    message: "File uploaded successfully",
    file: {
      originalName: req.file.originalname,
      savedName: req.file.filename,
      size: req.file.size
    }
  });
});

/**
 * Demo merge PDF route
 * For now it creates a simple blank PDF and returns a message.
 * You can upgrade this later with real file merging logic.
 */
app.post("/api/merge-pdf", upload.array("files", 10), async (req, res) => {
  try {
    const mergedPdf = await PDFDocument.create();
    const page = mergedPdf.addPage([600, 400]);

    page.drawText("Demo merged PDF created by Musab PDF Converter backend.", {
      x: 50,
      y: 300,
      size: 20
    });

    const pdfBytes = await mergedPdf.save();
    const outputFile = path.join(uploadDir, `merged-${Date.now()}.pdf`);
    fs.writeFileSync(outputFile, pdfBytes);

    res.json({
      success: true,
      message: "Demo merged PDF created successfully",
      downloadPath: `/downloads/${path.basename(outputFile)}`
    });
  } catch (error) {
    console.error("Merge PDF error:", error);
    res.status(500).json({ success: false, message: "Failed to merge PDF files" });
  }
});

/**
 * OCR image to text route
 */
app.post("/api/ocr", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const result = await Tesseract.recognize(req.file.path, "eng");

    res.json({
      success: true,
      message: "Text extracted successfully",
      text: result.data.text
    });
  } catch (error) {
    console.error("OCR error:", error);
    res.status(500).json({ success: false, message: "OCR processing failed" });
  }
});

/**
 * Text to PDF route
 */
app.post("/api/text-to-pdf", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Text is required" });
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);

    page.drawText(text.slice(0, 3000), {
      x: 40,
      y: 780,
      size: 12,
      maxWidth: 500,
      lineHeight: 16
    });

    const pdfBytes = await pdfDoc.save();
    const fileName = `text-to-pdf-${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, pdfBytes);

    res.json({
      success: true,
      message: "PDF created successfully",
      downloadPath: `/downloads/${fileName}`
    });
  } catch (error) {
    console.error("Text to PDF error:", error);
    res.status(500).json({ success: false, message: "Could not create PDF" });
  }
});

// Serve uploaded/processed files
app.use("/downloads", express.static(uploadDir));

// Simple cleanup note route
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    app: "Musab PDF Converter",
    status: "Running",
    note: "This is a demo-ready backend structure that can be upgraded with full PDF processing features."
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Musab PDF Converter server is running on http://localhost:${PORT}`);
});