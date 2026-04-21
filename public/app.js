const form = document.getElementById("uploadForm");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const previewEl = document.getElementById("preview");
const downloadLink = document.getElementById("downloadLink");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const codice = document.getElementById("codice").value.trim();
  const imageInput = document.getElementById("image");
  const file = imageInput.files[0];

  if (!codice || !file) {
    statusEl.textContent = "Inserisci il codice articolo e seleziona una foto.";
    return;
  }

  statusEl.textContent = "Caricamento in corso...";
  resultEl.classList.add("hidden");

  try {
    const formData = new FormData();
    formData.append("codice", codice);
    formData.append("image", file);

    const res = await fetch("/upload", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      throw new Error("Errore durante l'upload");
    }

    const data = await res.json();

    if (!data.success || !data.image) {
      throw new Error("Risposta non valida dal server");
    }

    previewEl.src = data.image;
    downloadLink.href = data.image;
    downloadLink.download = `${codice}.jpg`;

    resultEl.classList.remove("hidden");
    statusEl.textContent = "Immagine generata con successo.";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Errore durante l'elaborazione.";
  }
});
