const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" });

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Serve file statici (frontend)
app.use(express.static("public"));

// Endpoint upload + finto processing (placeholder)
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    const codice = req.body.codice || "output";

    if (!file) {
      return res.status(400).send("Nessun file caricato");
    }

    const inputPath = file.path;
    const outputFileName = `${codice}.jpg`;
    const outputPath = path.join("output", outputFileName);

    // 👉 QUI simuliamo la lavorazione (copiamo il file)
    fs.copyFileSync(inputPath, outputPath);

    // elimina file temporaneo
    fs.unlinkSync(inputPath);

    // restituisce file finale
    res.download(outputPath);

  } catch (err) {
    console.error(err);
    res.status(500).send("Errore durante l'elaborazione");
  }
});

// Avvio server
app.listen(PORT, () => {
  console.log(`Server attivo su porta ${PORT}`);
});
