const form = document.getElementById("uploadForm");
const cameraInput = document.getElementById("cameraInput");
const fileInput = document.getElementById("fileInput");

const selectedFile = document.getElementById("selectedFile");
const previewUpload = document.getElementById("previewUpload");

const result = document.getElementById("result");
const previewResult = document.getElementById("previewResult");
const counter = document.getElementById("counter");

const newBtn = document.getElementById("newBtn");
const sendBtn = document.getElementById("sendBtn");

const status = document.getElementById("status");

let selectedImage = null;
let images = [];
let lastImage = null;

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

// FIX iPhone/Safari: resetta il valore prima di aprire camera/file picker
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

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!selectedImage) {
    status.textContent = "Seleziona una foto";
    return;
  }

  const codice = document.getElementById("codice").value.trim();
  const email = document.getElementById("email").value.trim();

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

    lastImage = json.filename;

    if (!images.includes(lastImage)) {
      images.push(lastImage);
    }

    previewResult.src = json.imageUrl + "?t=" + Date.now();
    result.classList.remove("hidden");

    counter.textContent = `Immagini pronte: ${images.length}`;
    status.textContent = "Immagine pronta";
  } catch (err) {
    console.error(err);
    status.textContent = "Errore di connessione";
  }
});

newBtn.addEventListener("click", () => {
  document.getElementById("codice").value = "";
  selectedImage = null;
  selectedFile.textContent = "Nessun file selezionato";
  previewUpload.src = "";
  previewUpload.classList.add("hidden");
  cameraInput.value = "";
  fileInput.value = "";
  status.textContent = "";
});

sendBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();

  if (images.length === 0) {
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
        filenames: images
      })
    });

    const json = await res.json();

    if (!json.success) {
      status.textContent = json.error || "Errore invio";
      return;
    }

    status.textContent = "Email inviata";
    images = [];
    lastImage = null;
    counter.textContent = "";
    result.classList.add("hidden");
  } catch (err) {
    console.error(err);
    status.textContent = "Errore invio";
  }
});
