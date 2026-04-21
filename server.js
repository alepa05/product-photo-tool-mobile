const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const { execFile } = require("child_process");

const app = express();

const UPLOAD_DIR = path.join(__dirname, "uploads");
const OUTPUT_DIR = path.join(__dirname, "output");

for (const dir of [UPLOAD_DIR, OUTPUT_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const upload = multer({ dest: UPLOAD_DIR });
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use("/output", express.static(OUTPUT_DIR));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function sanitizeFilename(value) {
  return String(value || "output")
    .trim()
    .replace(/[^\w\-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "output";
}

function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass }
  });
}

async function sendEmailWithAttachment({ to, subject, text, filePath, filename }) {
  const transporter = createTransporter();
  if (!transporter) {
    return { sent: false, reason: "Gmail non configurata sul server" };
  }

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject,
    text,
    attachments: [
      {
        filename,
        path: filePath
      }
    ]
  });

  return { sent: true };
}

function runBackgroundRemoval(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    execFile(
      "python",
      ["remove_bg.py", inputPath, outputPath],
      { cwd: __dirname },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }
        resolve(stdout.trim());
      }
    );
  });
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/process", upload.single("image"), async (req, res) => {
  const tempFile = req.file;
  const codice = sanitizeFilename(req.body.codice);
  const recipientEmail = String(req.body.email || "").trim();

  if (!tempFile) {
    return res.status(400).json({ success: false, error: "Nessuna immagine caricata." });
  }

  const outputFilename = `${codice}.jpg`;
  const outputPath = path.join(OUTPUT_DIR, outputFilename);

  try {
    await runBackgroundRemoval(tempFile.path, outputPath);

    fs.unlink(tempFile.path, () => {});

    let emailResult = { sent: false };

    if (recipientEmail) {
      emailResult = await sendEmailWithAttachment({
        to: recipientEmail,
        subject: `File prodotto ${codice}`,
        text: `In allegato trovi il file ${outputFilename}.`,
        filePath: outputPath,
        filename: outputFilename
      });
    }

    return res.json({
      success: true,
      imageUrl: `/output/${outputFilename}`,
      filename: outputFilename,
      emailed: emailResult.sent,
      emailMessage: emailResult.sent
        ? `Email inviata a ${recipientEmail}`
        : (recipientEmail ? emailResult.reason : "Nessuna email richiesta")
    });
  } catch (error) {
    console.error("Errore processing:", error);
    fs.unlink(tempFile.path, () => {});
    return res.status(500).json({
      success: false,
      error: "Errore durante lo scontorno automatico."
    });
  }
});

app.listen(PORT, () => {
  console.log("Server attivo su porta " + PORT);
});
