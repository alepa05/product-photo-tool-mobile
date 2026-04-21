const form = document.getElementById("uploadForm");
const cameraInput = document.getElementById("cameraInput");
const fileInput = document.getElementById("fileInput");
const selectedFile = document.getElementById("selectedFile");
const previewUpload = document.getElementById("previewUpload");

const status = document.getElementById("status");
const result = document.getElementById("result");
const preview = document.getElementById("preview");
const downloadLink = document.getElementById("downloadLink");

let selectedImage = null;

function showPreview(file) {
  if (!file) return;

  const objectUrl = URL.createObjectURL(file);
  previewUpload.src = objectUrl;
  previewUpload.classList.remove("hidden");
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

  const codice = document.getElementById("codice").value.trim();
  const email = document.getElementById("email").value.trim();

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

    status.textContent = data.emailed
      ? "JPG creato e inviato via Gmail."
      : "JPG creato.";

    const cacheBuster = `?t=${Date.now()}`;
    preview.src = data.imageUrl + cacheBuster;
    downloadLink.href = data.imageUrl + cacheBuster;
    downloadLink.download = data.filename;

    result.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    status.textContent = "Errore di connessione";
  }
});
