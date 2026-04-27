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
  sessionId = "session_" + Date.now() + "_" + Math.random().toString(36).slice(2);
  localStorage.setItem("scontornoSessionId", sessionId);
}

function showPreview(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  previewUpload.src = url;
  previewUpload.classList.remove("hidden");
}

function handleSelectedFile(file) {
  if (!file) return;

  selectedImage = file;
  selectedFile.textContent = `Selezionato: ${file.name || "immagine"}`;
  showPreview(file);
}

cameraInput.addEventListener("click", () => {
  cameraInput.value = "";
});

fileInput.addEventListener("click", () => {
  fileInput.value = "";
});

cameraInput.addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  handleSelectedFile(file);
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  handleSelectedFile(file);
});

function resetFormOnly() {
  codiceInput.value = "";
  selectedImage = null;

  cameraInput.value = "";
  fileInput.value = "";

  selectedFile.textContent = "Nessun file selezionato";

  previewUpload.src = "";
  previewUpload.classList.add("hidden");

  status.textContent = "";
  codiceInput.focus();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!selectedImage) {
    status.textContent = "Seleziona una foto";
    return;
  }

  const codice = codiceInput.value.trim();

  if (!codice) {
    status.textContent = "Inserisci il codice articolo";
    return;
  }

  const data = new FormData();
  data.append("image", selectedImage);
  data.append("codice", codice);
  data.append("sessionId", sessionId);

  status.textContent = "Elaborazione...";

  try {
    const res = await fetch("/process", {
      method: "POST",
      body: data
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      status.textContent = json.error || "Errore";
      return;
    }

    imageCount = json.count || imageCount + 1;

    previewResult.src = json.imageUrl + "?t=" + Date.now();
    counter.textContent = `Immagini pronte: ${imageCount}`;
    result.classList.remove("hidden");

    status.textContent = "Immagine aggiunta al pacchetto ZIP";
  } catch (err) {
    console.error(err);
    status.textContent = "Errore di connessione";
  }
});

newBtn.addEventListener("click", () => {
  resetFormOnly();
});

zipBtn.addEventListener("click", () => {
  if (imageCount === 0) {
    status.textContent = "Nessuna immagine da scaricare";
    return;
  }

  window.location.href = `/download-zip/${sessionId}`;

  setTimeout(() => {
    localStorage.removeItem("scontornoSessionId");
    sessionId = "session_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    localStorage.setItem("scontornoSessionId", sessionId);

    imageCount = 0;
    counter.textContent = "Immagini pronte: 0";
    result.classList.add("hidden");
    resetFormOnly();
    status.textContent = "Pacchetto ZIP scaricato. Nuova sessione pronta.";
  }, 1500);
});

resetBtn.addEventListener("click", async () => {
  await fetch("/reset-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ sessionId })
  });

  localStorage.removeItem("scontornoSessionId");
  sessionId = "session_" + Date.now() + "_" + Math.random().toString(36).slice(2);
  localStorage.setItem("scontornoSessionId", sessionId);

  imageCount = 0;
  counter.textContent = "Immagini pronte: 0";
  result.classList.add("hidden");
  resetFormOnly();
  status.textContent = "Pacchetto azzerato";
});
