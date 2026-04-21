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


// 📸 PREVIEW IMMEDIATA
function showPreview(file) {
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    previewUpload.src = e.target.result;
    previewUpload.classList.remove("hidden");
  };

  reader.readAsDataURL(file);
}


// 📸 CAMERA
cameraInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  selectedImage = file;
  selectedFile.textContent = `Selezionato: ${file.name}`;
  showPreview(file);
});


// 📁 FILE
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  selectedImage = file;
  selectedFile.textContent = `Selezionato: ${file.name}`;
  showPreview(file);
});


// 🚀 SUBMIT
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!selectedImage) {
    status.textContent = "Seleziona una foto";
    return;
  }

  const codice = document.getElementById("codice").value;
  const email = document.getElementById("email").value;

  const formData = new FormData();
  formData.append("image", selectedImage);
  formData.append("codice", codice);
  formData.append("email", email);

  status.textContent = "Elaborazione...";
  result.classList.add("hidden");

  try {
    const res = await fetch("/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (data.success) {
      status.textContent = "JPG creato e inviato via Gmail.";

      // 🔥 FIX CACHE
      const cacheBuster = `?t=${Date.now()}`;

      preview.src = data.image + cacheBuster;
      downloadLink.href = data.image + cacheBuster;
      downloadLink.download = `${codice}.png`;

      result.classList.remove("hidden");
    } else {
      status.textContent = data.error || "Errore";
    }

  } catch (err) {
    status.textContent = "Errore di connessione";
  }
});
