const form = document.getElementById("uploadForm");
const cameraInput = document.getElementById("cameraInput");
const fileInput = document.getElementById("fileInput");
const selectedFile = document.getElementById("selectedFile");
const previewUpload = document.getElementById("previewUpload");

const status = document.getElementById("status");
const result = document.getElementById("result");
const preview = document.getElementById("preview");
const downloadLink = document.getElementById("downloadLink");

const newImageBtn = document.getElementById("newImageBtn");
const sendEmailBtn = document.getElementById("sendEmailBtn");
const sendAllTogether = document.getElementById("sendAllTogether");

const codiceInput = document.getElementById("codice");
const emailInput = document.getElementById("email");

const queueBox = document.getElementById("queueBox");
const queueList = document.getElementById("queueList");

let selectedImage = null;
let lastGenerated = null;
let generatedImages = [];

function showPreview(file) {
  if (!file) return;
  const objectUrl = URL.createObjectURL(file);
  previewUpload.src = objectUrl;
  previewUpload.classList.remove("hidden");
}

function renderQueue() {
  if (generatedImages.length === 0) {
    queueBox.classList.add("hidden");
    queueList.innerHTML = "";
    return;
  }

  queueBox.classList.remove("hidden");
  queueList.innerHTML = generatedImages
    .map((img, index) => `<div class="queue-item">${index + 1}. ${img.filename}</div>`)
    .join("");
}

function resetForNextImage() {
  codiceInput.value = "";
  selectedImage = null;

  cameraInput.value = "";
  fileInput.value = "";

  previewUpload.src = "";
  previewUpload.classList.add("hidden");

  selectedFile.textContent = "Nessun file selezionato";

  preview.src = "";
  downloadLink.href = "";
  result.classList.add("hidden");

  status.textContent = "";
  codiceInput.focus();
}

cameraInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  selectedImage = file;
  selectedFile.textContent = `Selezionato: ${file.name}`;
  showPreview(file);
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  selectedImage = file;
  selectedFile.textContent = `Selezionato: ${file.name}`;
  showPreview(file);
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!selectedImage) {
    status.textContent = "Seleziona una foto";
    return;
  }

  const codice = codiceInput.value.trim();
  const email = emailInput.value.trim();

  const formData = new FormData();
  formData.append("image", selectedImage);
  formData.append("codice", codice);
  formData.append("email", email);

  status.textContent = "Elaborazione...";
  result.classList.add("hidden");

  try {
    const res = await fetch("/process", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      status.textContent = data.error || "Errore durante l'elaborazione";
      return;
    }

    lastGenerated = {
      filename: data.filename,
      imageUrl: data.imageUrl
    };

    const alreadyExists = generatedImages.some(img => img.filename === data.filename);
    if (!alreadyExists) {
      generatedImages.push(lastGenerated);
    } else {
      generatedImages = generatedImages.map(img =>
        img.filename === data.filename ? lastGenerated : img
      );
    }

    renderQueue();

    const cacheBuster = `?t=${Date.now()}`;
    preview.src = data.imageUrl + cacheBuster;
    downloadLink.href = data.imageUrl + cacheBuster;
    downloadLink.download = data.filename;

    status.textContent = "Immagine generata correttamente.";
    result.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    status.textContent = "Errore di connessione";
  }
});

newImageBtn.addEventListener("click", () => {
  resetForNextImage();
});

sendEmailBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();

  if (!email) {
    status.textContent = "Inserisci l'email destinatario";
    return;
  }

  if (!lastGenerated && generatedImages.length === 0) {
    status.textContent = "Non ci sono immagini da inviare";
    return;
  }

  let filenames = [];

  if (sendAllTogether.checked) {
    filenames = generatedImages.map(img => img.filename);
  } else {
    filenames = lastGenerated ? [lastGenerated.filename] : [];
  }

  if (filenames.length === 0) {
    status.textContent = "Nessuna immagine valida da inviare";
    return;
  }

  status.textContent = "Invio email in corso...";

  try {
    const res = await fetch("/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        filenames
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      status.textContent = data.error || "Errore durante l'invio email";
      return;
    }

    status.textContent = data.message || "Email inviata correttamente.";

    if (sendAllTogether.checked) {
      generatedImages = [];
      lastGenerated = null;
      renderQueue();
      resetForNextImage();
    }
  } catch (err) {
    console.error(err);
    status.textContent = "Errore di connessione durante invio email";
  }
});
