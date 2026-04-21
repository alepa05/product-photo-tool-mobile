const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();

// Cartelle
const upload = multer({ dest: "uploads/" });
const OUTPUT_DIR = "output";

// Crea cartella output se non esiste
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// Porta (Render usa process.env.PORT)
const PORT = process.env.PORT || 3000;

// 🔑 API KEY (presa da Render env variables)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Serve frontend
app.use(express.static("public"));

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Upload immagine
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const filePath = req.file.path;

    // Simulazione processing (qui poi collegheremo OpenAI)
    const outputPath = path.join(
      OUTPUT_DIR,
      "processed-" + Date.now() + ".jpg"
    );

    fs.copyFileSync(filePath, outputPath);

    res.json({
      success: true,
      image: "/" + outputPath,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore upload" });
  }
});

// Serve immagini output
app.use("/output", express.static("output"));

// Start server
app.listen(PORT, () => {
  console.log("Server attivo su porta " + PORT);
});
