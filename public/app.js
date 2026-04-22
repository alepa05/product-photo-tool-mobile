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
  const url = URL.createObjectURL(file);
  previewUpload.src = url;
  previewUpload.classList.remove("hidden");
}

cameraInput.onchange = fileInput.onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  selectedImage = file;
  selectedFile.textContent = file.name;
  showPreview(file);
};

form.onsubmit = async (e) => {
  e.preventDefault();

  if (!selectedImage) {
    status.textContent = "Seleziona una foto";
    return;
  }

  const codice = document.getElementById("codice").value;
  const email = document.getElementById("email").value;

  const data = new FormData();
  data.append("image", selectedImage);
  data.append("codice", codice);
  data.append("email", email);

  status.textContent = "Elaborazione...";

  const res = await fetch("/process", {
    method: "POST",
    body: data
  });

  const json = await res.json();

  if (!json.success) {
    status.textContent = "Errore";
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
};

newBtn.onclick = () => {
  document.getElementById("codice").value = "";
  selectedImage = null;
  selectedFile.textContent = "Nessun file selezionato";
  previewUpload.classList.add("hidden");
  status.textContent = "";
};

sendBtn.onclick = async () => {
  const email = document.getElementById("email").value;

  if (images.length === 0) {
    status.textContent = "Nessuna immagine";
    return;
  }

  status.textContent = "Invio email...";

  const res = await fetch("/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      filenames: images
    })
  });

  const json = await res.json();

  if (!json.success) {
    status.textContent = "Errore invio";
    return;
  }

  status.textContent = "Email inviata";

  // reset tutto tranne email
  images = [];
  lastImage = null;
  counter.textContent = "";
  result.classList.add("hidden");
};
