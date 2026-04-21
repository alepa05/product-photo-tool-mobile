const form = document.getElementById("uploadForm");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const previewEl = document.getElementById("preview");
const downloadLink = document.getElementById("downloadLink");
const cameraInput = document.getElementById("cameraInput");
const fileInput = document.getElementById("fileInput");
const selectedFileEl = document.getElementById("selectedFile");

let selectedFile = null;

function setSelectedFile(file) {
  selectedFile = file || null;
  selectedFileEl.textContent = selectedFile
    ? `Selezionato: ${selectedFile.name}`
    : "Nessun file selezionato";
}

cameraInput.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (file) {
    fileInput.value = "";
    setSelectedFile(file);
  }
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (file) {
    cameraInput.value = "";
    setSelectedFile(file);
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const codice = document.getElementById("codice").value.trim();
  const email = document.getElementById("email").value.trim();

  if (!codice || !email || !selectedFile) {
    statusEl.textContent = "Compila tutti i campi e seleziona una foto.";
    return;
  }

  resultEl.classList.add("hidden");
  statusEl.textContent = "Elaborazione in corso...";

  try {
    const formData = new FormData();
    formData.append("codice", codice);
    formData.append("email", email);
    formData.append("image", selectedFile);

    const response = await fetch("/process", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Errore durante l'elaborazione.");
    }

    previewEl.src = data.imageUrl;
    downloadLink.href = data.imageUrl;
    downloadLink.download = data.filename;

    resultEl.classList.remove("hidden");
    statusEl.textContent = data.emailed
      ? `JPG creato e inviato via Gmail.`
      : `JPG creato. ${data.emailMessage || ""}`;
  } catch (error) {
    console.error(error);
    statusEl.textContent = error.message || "Errore imprevisto.";
  }
});
