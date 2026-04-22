const form = document.getElementById("uploadForm");
const cameraInput = document.getElementById("cameraInput");
const fileInput = document.getElementById("fileInput");
const selectedFile = document.getElementById("selectedFile");
const previewUpload = document.getElementById("previewUpload");

const result = document.getElementById("result");
const previewResult = document.getElementById("previewResult");
const downloadLink = document.getElementById("downloadLink");

const newBtn = document.getElementById("newBtn");
const sendBtn = document.getElementById("sendBtn");

const status = document.getElementById("status");

const codiceInput = document.getElementById("codice");
const emailInput = document.getElementById("email");

let selectedImage = null;
let currentFilename = null;
let currentImageUrl = null;

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

// Fix iPhone/Safari
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

function resetForNextImage() {
  codiceInput.value = "";
  selectedImage = null;
  currentFilename = null;
  currentImageUrl = null;

  cameraInput.value = "";
  fileInput.value = "";

  selectedFile.textContent = "Nessun file selezionato";

  previewUpload.src = "";
  previewUpload.classList.add("hidden");

  previewResult.src = "";
  downloadLink.href = "";
  result.classList.add("hidden");

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
  const email = emailInput.value.trim();

  if (!codice) {
    status.textContent = "Inserisci il codice articolo";
    return;
  }

  if (!email) {
    status.textContent = "Inserisci l'email destinatario";
    return;
  }

  const data = new FormData();
  data.append("image", selectedImage);
  data.append("codice", codice);
  data.append("email", email);

  status.textContent = "Elaborazione...";

  try {
    const res = await fetch("/process", {
      method: "POST",
      body: data
    });

    const json = await res.json();

    if (!json.success) {
      status.textContent = json.error || "Errore";
      return;
    }

    currentFilename = json.filename;
    currentImageUrl = json.imageUrl;

    previewResult.src = json.imageUrl + "?t=" + Date.now();
    downloadLink.href = json.imageUrl + "?t=" + Date.now();
    downloadLink.download = json.filename;

    result.classList.remove("hidden");
    status.textContent = "Immagine pronta";
  } catch (err) {
    console.error(err);
    status.textContent = "Errore di connessione";
  }
});

newBtn.addEventListener("click", () => {
  resetForNextImage();
});

sendBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();

  if (!email) {
    status.textContent = "Inserisci l'email destinatario";
    return;
  }

  if (!currentFilename) {
    status.textContent = "Nessuna immagine da inviare";
    return;
  }

  status.textContent = "Invio email...";

  try {
    const res = await fetch("/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        filenames: [currentFilename]
      })
    });

    const json = await res.json();

    if (!json.success) {
      status.textContent = json.error || "Errore invio";
      return;
    }

    status.textContent = "Email inviata";
    const emailToKeep = emailInput.value;
    resetForNextImage();
    emailInput.value = emailToKeep;
  } catch (err) {
    console.error(err);
    status.textContent = "Errore invio";
  }
});
