const form = document.getElementById("uploadForm");

const cameraInput = document.getElementById("cameraInput");
const fileInput = document.getElementById("fileInput");

const selectedFile = document.getElementById("selectedFile");
const previewUpload = document.getElementById("previewUpload");

const result = document.getElementById("result");
const previewResult = document.getElementById("previewResult");
const counter = document.getElementById("counter");

const newBtn = document.getElementById("newBtn");
const zipBtn = document.getElementById("zipBtn");
const resetBtn = document.getElementById("resetBtn");

const status = document.getElementById("status");
const codiceInput = document.getElementById("codice");

let selectedImage = null;
let imageCount = 0;

let sessionId = localStorage.getItem("scontornoSessionId");

if (!sessionId) {
  sessionId =
    "session_" +
    Date.now() +
    "_" +
    Math.random().toString(36).slice(2);

  localStorage.setItem("scontornoSessionId", sessionId);
}

function showPreview(file) {
  if (!file) return;

  const url = URL.createObjectURL(file);

  previewUpload.src = url;
  previewUpload.classList.remove("hidden");
}

async function convertToJpg(file) {
  return new Promise((resolve, reject) => {

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {

      const canvas = document.createElement("canvas");

      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {

          URL.revokeObjectURL(url);

          if (!blob) {
            reject(new Error("Conversione fallita"));
            return;
          }

          const jpgFile = new File(
            [blob],
            "image.jpg",
            {
              type: "image/jpeg"
            }
          );

          resolve(jpgFile);

        },
        "image/jpeg",
        0.9
      );

    };

    img.onerror = () => {
      reject(new Error("Errore immagine"));
    };

    img.src = url;

  });
}

async function handleSelectedFile(file) {

  if (!file) return;

  try {

    status.textContent = "Preparazione immagine...";

    selectedImage = await convertToJpg(file);

    selectedFile.textContent =
      "Selezionato: image.jpg";

    showPreview(selectedImage);

    status.textContent = "";

  } catch (err) {

    console.error(err);

    status.textContent =
      "Errore preparazione immagine";

  }

}

cameraInput.addEventListener("change", async (e) => {
  await handleSelectedFile(e.target.files[0]);
});

fileInput.addEventListener("change", async (e) => {
  await handleSelectedFile(e.target.files[0]);
});

form.addEventListener("submit", async (e) => {

  e.preventDefault();

  if (!selectedImage) {
    status.textContent =
      "Seleziona una foto";
    return;
  }

  const codice = codiceInput.value.trim();

  if (!codice) {
    status.textContent =
      "Inserisci il codice articolo";
    return;
  }

  const data = new FormData();

  data.append("image", selectedImage);
  data.append("codice", codice);
  data.append("sessionId", sessionId);

  status.textContent =
    "Elaborazione...";

  try {

    console.log("Invio richiesta");

    const res = await fetch("/process", {
      method: "POST",
      body: data
    });

    console.log(res);

    const json = await res.json();

    if (!res.ok || !json.success) {

      status.textContent =
        json.error || "Errore";

      return;
    }

    imageCount =
      json.count || imageCount + 1;

    previewResult.src =
      json.imageUrl +
      "?t=" +
      Date.now();

    counter.textContent =
      `Immagini pronte: ${imageCount}`;

    result.classList.remove("hidden");

    status.textContent =
      "Immagine aggiunta al pacchetto ZIP";

  } catch (err) {

    console.error(err);

    status.textContent =
      "Errore di connessione";

  }

});

newBtn.addEventListener("click", () => {

  codiceInput.value = "";

  selectedImage = null;

  previewUpload.src = "";

  previewUpload.classList.add("hidden");

  selectedFile.textContent =
    "Nessun file selezionato";

  status.textContent = "";

});

resetBtn.addEventListener("click", async () => {

  await fetch("/reset-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sessionId
    })
  });

  imageCount = 0;

  result.classList.add("hidden");

  counter.textContent = "";

  status.textContent =
    "Sessione resettata";

});

zipBtn.addEventListener("click", () => {

  window.location.href =
    `/download-zip/${sessionId}`;

});
