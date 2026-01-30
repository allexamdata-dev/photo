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
const progressBar = document.getElementById("progress-bar");

function setProgress(val){
  progressBar.style.width = val + "%";
}
function totalSizeKB(){
  return (pdfFiles.reduce((a,f)=>a+f.size,0)/1024).toFixed(1);
}
statusMsg.innerText = `Total input size: ${totalSizeKB()} KB`;
statusMsg.innerText = `Compressed to ${(blob.size/1024).toFixed(1)} KB`;

const MAX_FILES = 5;
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB each
const MAX_TOTAL = 10 * 1024 * 1024; // 10MB total
const upload = multer({
  limits:{
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES
  }
});
let total = req.files.reduce((s,f)=>s+f.size,0);
if(total > MAX_TOTAL){
  return res.status(400).send("Total size limit exceeded");
}

mergeBtn.addEventListener("click", async ()=>{
  setProgress(10);
  mergeBtn.disabled = true;

  const level = document.getElementById("compress-level").value;
  const formData = new FormData();

  pdfFiles.forEach(f=>formData.append("pdfs",f));
  formData.append("level", level);

  setProgress(40);

  const res = await fetch("/merge",{
    method:"POST",
    body:formData
  });

  setProgress(80);

  const blob = await res.blob();

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "merged.pdf";
  a.click();

  setProgress(100);
  mergeBtn.disabled = false;
});
const level = req.body.level || "ebook";

const gsCmd = `
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 \
-dPDFSETTINGS=/${level} \
-dNOPAUSE -dBATCH -dQUIET \
-sOutputFile=${finalPdf} ${mergedPdf}
`;
