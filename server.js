const express = require("express");
const multer = require("multer");
const archiver = require("archiver");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const UPLOAD_DIR = path.join(__dirname, "uploads");
const OUTPUT_DIR = path.join(__dirname, "output");

for (const dir of [UPLOAD_DIR, OUTPUT_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

app.use("/output", express.static(OUTPUT_DIR));

const upload = multer({ dest: UPLOAD_DIR });
const PORT = process.env.PORT || 10000;

function sanitizeFilename(value) {
  return String(value || "output")
    .trim()
    .replace(/[^\w\-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "output";
}

function sanitizeSession(value) {
  return sanitizeFilename(value || `session_${Date.now()}`);
}

async function removeBackgroundLocal(inputPath, outputPath) {
  const scriptPath = path.join(__dirname, "remove_bg.py");

  await execFileAsync("python3", [scriptPath, inputPath, outputPath], {
    timeout: 180000
  });
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/process", upload.single("image"), async (req, res) => {
  try {
    const codice = sanitizeFilename(req.body.codice);
    const sessionId = sanitizeSession(req.body.sessionId);
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "Nessun file caricato."
      });
    }

    const sessionDir = path.join(OUTPUT_DIR, sessionId);
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

    const inputPath = file.path;
    const outputFilename = `${codice}.jpg`;
    const outputPath = path.join(sessionDir, outputFilename);

    await removeBackgroundLocal(inputPath, outputPath);

    fs.unlink(inputPath, () => {});

    const files = fs
      .readdirSync(sessionDir)
      .filter((name) => name.toLowerCase().endsWith(".jpg"));

    return res.json({
      success: true,
      filename: outputFilename,
      imageUrl: `/output/${sessionId}/${outputFilename}`,
      count: files.length
    });
  } catch (error) {
    console.error("Errore /process:", error.stderr || error.message || error);

    return res.status(500).json({
      success: false,
      error: "Errore durante l'elaborazione automatica."
    });
  }
});

app.get("/download-zip/:sessionId", async (req, res) => {
  try {
    const sessionId = sanitizeSession(req.params.sessionId);
    const sessionDir = path.join(OUTPUT_DIR, sessionId);

    if (!fs.existsSync(sessionDir)) {
      return res.status(404).send("Nessun file trovato.");
    }

    const files = fs
      .readdirSync(sessionDir)
      .filter((name) => name.toLowerCase().endsWith(".jpg"));

    if (files.length === 0) {
      return res.status(404).send("Nessun file da scaricare.");
    }

    const zipName = `scontorni_${new Date().toISOString().slice(0, 10)}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      console.error("Errore archive:", err);
      res.status(500).end();
    });

    archive.pipe(res);

    files.forEach((filename) => {
      archive.file(path.join(sessionDir, filename), { name: filename });
    });

    await archive.finalize();

    res.on("finish", () => {
      fs.rm(sessionDir, { recursive: true, force: true }, () => {});
    });
  } catch (error) {
    console.error("Errore ZIP:", error.message || error);
    return res.status(500).send("Errore durante creazione ZIP.");
  }
});

app.post("/reset-session", (req, res) => {
  const sessionId = sanitizeSession(req.body.sessionId);
  const sessionDir = path.join(OUTPUT_DIR, sessionId);

  fs.rm(sessionDir, { recursive: true, force: true }, () => {
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server attivo su porta ${PORT}`);
});
