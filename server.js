const express = require("express");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
const FormData = require("form-data");
const nodemailer = require("nodemailer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const OUTPUT_DIR = path.join(__dirname, "output");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

app.use("/output", express.static(OUTPUT_DIR));

const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 10000;

function sanitizeFilename(value) {
  return String(value || "output")
    .trim()
    .replace(/[^\w\-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "output";
}

async function removeBackground(buffer, mimetype = "image/jpeg") {
  const apiKey = process.env.REMOVE_BG_API_KEY;

  if (!apiKey) {
    throw new Error("REMOVE_BG_API_KEY mancante");
  }

  const formData = new FormData();
  formData.append("image_file", buffer, {
    filename: "image.jpg",
    contentType: mimetype
  });
  formData.append("size", "auto");

  const response = await axios.post(
    "https://api.remove.bg/v1.0/removebg",
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        "X-Api-Key": apiKey
      },
      responseType: "arraybuffer",
      maxBodyLength: Infinity
    }
  );

  return Buffer.from(response.data);
}

function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass
    }
  });
}

async function sendEmailWithAttachments({ to, filenames }) {
  const transporter = createTransporter();

  if (!transporter) {
    return { sent: false, reason: "Gmail non configurata sul server" };
  }

  const attachments = filenames.map((filename) => ({
    filename,
    path: path.join(OUTPUT_DIR, filename)
  }));

  const subject =
    filenames.length === 1
      ? `File prodotto ${filenames[0]}`
      : `File prodotti (${filenames.length} allegati)`;

  const text =
    filenames.length === 1
      ? `In allegato trovi il file ${filenames[0]}.`
      : `In allegato trovi ${filenames.length} file prodotto.`;

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject,
    text,
    attachments
  });

  return { sent: true };
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/process", upload.single("image"), async (req, res) => {
  try {
    const codice = sanitizeFilename(req.body.codice);
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "Nessuna immagine caricata."
      });
    }

    const noBgBuffer = await removeBackground(file.buffer, file.mimetype);

    const outputFilename = `${codice}.jpg`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    await sharp(noBgBuffer)
      .rotate()
      .resize(1800, 1800, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 92, mozjpeg: true })
      .toFile(outputPath);

    return res.json({
      success: true,
      imageUrl: `/output/${outputFilename}`,
      filename: outputFilename
    });
  } catch (error) {
    console.error("Errore processing:", error.response?.data || error.message || error);
    return res.status(500).json({
      success: false,
      error: "Errore durante l'elaborazione automatica."
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
        error: "Email mancante."
      });
    }

    if (filenames.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Nessuna immagine da inviare."
      });
    }

    const missing = filenames.filter((filename) => {
      return !fs.existsSync(path.join(OUTPUT_DIR, filename));
    });

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `File mancanti: ${missing.join(", ")}`
      });
    }

    const emailResult = await sendEmailWithAttachments({
      to: email,
      filenames
    });

    return res.json({
      success: true,
      message: "Email inviata con 1 immagine.",
      emailed: emailResult.sent
    });
  } catch (error) {
    console.error("Errore invio email:", error.message || error);
    return res.status(500).json({
      success: false,
      error: "Errore durante invio email."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server attivo su porta ${PORT}`);
});
