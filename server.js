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

const upload = multer({ dest: "uploads/" });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
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
    }
  );

  return response.data;
}

app.post("/process", upload.single("photo"), async (req, res) => {
  try {
    const { codiceArticolo, email } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Nessun file caricato",
      });
    }

    const inputPath = req.file.path;

    const outputFileName = `${codiceArticolo}.jpg`;
    const outputPath = path.join(__dirname, "public", outputFileName);

    // RIMOZIONE SFONDO
    const noBgBuffer = await removeBackground(inputPath);

    // GENERAZIONE IMMAGINE FINALE SENZA BORDI NERI
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

    // INVIO EMAIL
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: `Immagine ${codiceArticolo}`,
      text: "Immagine generata automaticamente.",
      attachments: [
        {
          filename: outputFileName,
          path: outputPath,
        },
      ],
    });

    // ELIMINA FILE TEMPORANEO
    fs.unlinkSync(inputPath);

    return res.json({
      success: true,
      imageUrl: `/${outputFileName}?t=${Date.now()}`,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "Errore durante l'elaborazione automatica.",
    });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server attivo su porta ${PORT}`);
});
