const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const sharp = require('sharp');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });


// 📸 FUNZIONE REMOVE.BG
async function removeBackground(buffer) {
  const formData = new FormData();
  formData.append('image_file', buffer, 'image.jpg');
  formData.append('size', 'auto');

  const response = await axios.post(
    'https://api.remove.bg/v1.0/removebg',
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        'X-Api-Key': process.env.REMOVE_BG_API_KEY
      },
      responseType: 'arraybuffer'
    }
  );

  return response.data;
}


// 🎨 MIGLIORAMENTO IMMAGINE + OMBRA
async function improveImage(buffer) {
  const image = sharp(buffer);

  const metadata = await image.metadata();

  const resized = await image
    .resize(800, 800, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  const shadow = await sharp(resized)
    .blur(10)
    .modulate({ brightness: 0.5 })
    .toBuffer();

  const final = await sharp({
    create: {
      width: 1000,
      height: 1000,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite([
      { input: shadow, top: 120, left: 100 },
      { input: resized, top: 80, left: 100 }
    ])
    .jpeg({ quality: 90 })
    .toBuffer();

  return final;
}


// 📧 INVIO EMAIL
async function sendEmail(buffer, filename, email) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Packshot automatico',
    text: 'Ecco la tua immagine.',
    attachments: [
      {
        filename,
        content: buffer
      }
    ]
  });
}


// 🚀 ROUTE PRINCIPALE
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const codice = req.body.codice;
    const email = req.body.email;
    const fileBuffer = req.file.buffer;

    // 1. rimuovi sfondo
    const noBg = await removeBackground(fileBuffer);

    // 2. migliora immagine
    const finalImage = await improveImage(noBg);

    const filename = `${codice}.jpg`;

    // 3. invia email
    await sendEmail(finalImage, filename, email);

    res.json({
      success: true,
      image: `data:image/jpeg;base64,${finalImage.toString('base64')}`
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore durante elaborazione' });
  }
});


app.listen(10000, () => {
  console.log('Server attivo su porta 10000');
});
