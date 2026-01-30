const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { PDFDocument } = require("pdf-lib");

const app = express();
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB per file
});

app.use(express.static("public"));

app.post("/merge", upload.array("pdfs"), async (req, res) => {
  try {
    const mergedPdf = await PDFDocument.create();

    for (const file of req.files) {
      const bytes = fs.readFileSync(file.path);
      const pdf = await PDFDocument.load(bytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(p => mergedPdf.addPage(p));
    }

    const mergedPath = "output/merged.pdf";
    fs.writeFileSync(mergedPath, await mergedPdf.save());

    const finalPath = "output/final.pdf";

    // Ghostscript compression (Linux – Render)
    exec(
      `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 \
-dPDFSETTINGS=/screen -dNOPAUSE -dBATCH -dQUIET \
-sOutputFile=${finalPath} ${mergedPath}`,
      () => {
        res.download(finalPath, "merged-compressed.pdf");

        // cleanup
        req.files.forEach(f => fs.unlinkSync(f.path));
        fs.unlinkSync(mergedPath);
        fs.unlinkSync(finalPath);
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("PDF processing failed");
  }
});

app.listen(3000, () =>
  console.log("Server running on port 3000")
);