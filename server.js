const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const FormData = require("form-data");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const OUTPUT_DIR = path.join(__dirname, "output");
const UPLOAD_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.use("/output", express.static(OUTPUT_DIR));

const upload = multer({ dest: UPLOAD_DIR });

function sanitizeFilename(value) {
  return String(value || "output")
    .trim()
    .replace(/[^\w\-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "output";
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function removeBackground(imagePath) {
  const formData = new FormData();

  formData.append("image_file", fs.createReadStream(imagePath));
  formData.append("size", "auto");

  const response = await axios.post(
    "https://api.remove.bg/v1.0/removebg",
    formData,
    {
      responseType: "arraybuffer",
      headers: {
        ...formData.getHeaders(),
        "X-Api-Key": process.env.REMOVE_BG_API_KEY,
      },
      maxBodyLength: Infinity,
    }
  );

  return response.data;
}

app.post("/process", upload.single("image"), async (req, res) => {
  try {
    const codice = sanitizeFilename(req.body.codice);
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "Nessun file caricato",
      });
    }

    const inputPath = file.path;
    const outputFileName = `${codice}.jpg`;
    const outputPath = path.join(OUTPUT_DIR, outputFileName);

    const noBgBuffer = await removeBackground(inputPath);

    await sharp(noBgBuffer)
      .rotate()
      .resize(1800, 1800, {
        fit: "contain",
        background: {
          r: 255,
          g: 255,
          b: 255,
          alpha: 1,
        },
      })
      .flatten({
        background: {
          r: 255,
          g: 255,
          b: 255,
        },
      })
      .jpeg({
        quality: 95,
        mozjpeg: true,
      })
      .toFile(outputPath);

    fs.unlinkSync(inputPath);

    return res.json({
      success: true,
      filename: outputFileName,
      imageUrl: `/output/${outputFileName}`,
    });
  } catch (error) {
    console.error("Errore /process:", error.response?.data || error.message || error);

    return res.status(500).json({
      success: false,
      error: "Errore durante l'elaborazione automatica.",
    });
  }
});

app.post("/send-email", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim();
    const filenames = Array.isArray(req.body.filenames) ? req.body.filenames : [];

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email mancante.",
      });
    }

    if (filenames.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Nessuna immagine da inviare.",
      });
    }

    const attachments = filenames.map((filename) => ({
      filename,
      path: path.join(OUTPUT_DIR, filename),
    }));

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: filenames.length === 1
        ? `Immagine ${filenames[0]}`
        : `Immagini generate (${filenames.length})`,
      text: filenames.length === 1
        ? "Immagine generata automaticamente."
        : `In allegato trovi ${filenames.length} immagini generate automaticamente.`,
      attachments,
    });

    return res.json({
      success: true,
      message: "Email inviata correttamente.",
    });
  } catch (error) {
    console.error("Errore /send-email:", error.message || error);

    return res.status(500).json({
      success: false,
      error: "Errore durante invio email.",
    });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server attivo su porta ${PORT}`);
});
